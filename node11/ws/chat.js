const WebSocket = require('ws');
const db = require('../db/mysqldb');

// ==================== 连接池 ====================
// [用户] userId -> { ws, userId, userName, role } —— 每个用户一个连接
const userClients = new Map();
// [管理员] WebSocket 连接集合 —— 可能有多个管理员同时在线
const adminClients = new Set();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws/chat' });

  wss.on('connection', (ws) => {
    let clientInfo = null;

    // ==================== [用户 + 管理员] 接收客户端消息入口 ====================
    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        await handleMessage(ws, msg, () => clientInfo, (info) => { clientInfo = info; });
      } catch (e) {
        console.error('WebSocket消息处理失败:', e.message);
        sendTo(ws, { type: 'error', message: '消息格式错误' });
      }
    });

    // ==================== 断开时清理连接池 ====================
    ws.on('close', () => {
      if (clientInfo) {
        // [用户] 从 userClients 移除
        if (clientInfo.role === 'user') {
          userClients.delete(String(clientInfo.userId));
        // [管理员] 从 adminClients 移除
        } else if (clientInfo.role === 'admin') {
          adminClients.delete(ws);
        }
      }
    });

    ws.on('error', () => {});
  });

  console.log('WebSocket 聊天服务已启动 (路径: /ws/chat)');
}

async function handleMessage(ws, msg, getClientInfo, setClientInfo) {
  switch (msg.type) {

    // ==================== [用户 + 管理员] 认证 ====================
    case 'auth': {
      const { userId, userName, role } = msg;
      if (!userId || !role) {
        sendTo(ws, { type: 'error', message: '认证参数不完整' });
        return;
      }
      setClientInfo({ userId, userName, role });

      // [用户] 存入 userClients，key 为用户ID
      if (role === 'user') {
        userClients.set(String(userId), { ws, userId, userName, role });
      // [管理员] 存入 adminClients 集合
      } else if (role === 'admin') {
        adminClients.add(ws);
      }

      sendTo(ws, { type: 'auth_ok', message: '认证成功' });
      break;
    }

    // ==================== [用户 + 管理员] 发送消息（入口） ====================
    // 客户端发来 { type:"send_message", sessionId, content, messageType }
    // 服务端根据角色分流到 handleUserMessage / handleAdminMessage
    case 'send_message': {
      const client = getClientInfo();
      if (!client) {
        sendTo(ws, { type: 'error', message: '请先认证' });
        return;
      }

      const { sessionId, content, messageType } = msg;
      if (!sessionId || !content) {
        sendTo(ws, { type: 'error', message: '参数不完整' });
        return;
      }

      const session = await db.ChatSession.findByPk(sessionId);
      if (!session) {
        sendTo(ws, { type: 'error', message: '会话不存在' });
        return;
      }

      if (session.status !== 1) {
        sendTo(ws, { type: 'error', message: '会话已关闭' });
        return;
      }

      // [用户] 用户发消息 → handleUserMessage
      if (client.role === 'user') {
        await handleUserMessage(client, session, content, messageType);
      // [管理员] 管理员发消息 → handleAdminMessage
      } else if (client.role === 'admin') {
        await handleAdminMessage(client, session, content, messageType);
      }
      break;
    }

    // ==================== [用户 + 管理员] 标记已读 ====================
    case 'read_messages': {
      const client = getClientInfo();
      if (!client) return;

      const { sessionId } = msg;
      if (!sessionId) return;

      // [用户] 标记管理员消息为已读，清空"用户端的未读数"
      if (client.role === 'user') {
        await db.ChatMessage.update(
          { isRead: 1 },
          { where: { sessionId, senderType: 'admin', isRead: 0 } }
        );
        await db.ChatSession.update(
          { userUnreadCount: 0 },
          { where: { id: sessionId } }
        );
        // 通知管理员刷新未读数角标
        broadcastUnreadToAdmins();
      // [管理员] 标记用户消息为已读，清空"管理员端的未读数"
      } else if (client.role === 'admin') {
        await db.ChatMessage.update(
          { isRead: 1 },
          { where: { sessionId, senderType: 'user', isRead: 0 } }
        );
        await db.ChatSession.update(
          { unreadCount: 0 },
          { where: { id: sessionId } }
        );
        // 推送更新后的会话列表给所有管理员（未读角标归零）
        await broadcastSessionsToAdmins();
      }
      break;
    }

    // ==================== [管理员] 关闭会话 ====================
    // 仅管理员可操作，关闭后通知双方
    case 'close_session': {
      const client = getClientInfo();
      if (!client || client.role !== 'admin') {
        sendTo(ws, { type: 'error', message: '无权操作' });
        return;
      }

      const { sessionId } = msg;
      const session = await db.ChatSession.findByPk(sessionId);
      if (!session) {
        sendTo(ws, { type: 'error', message: '会话不存在' });
        return;
      }

      await db.ChatSession.update({ status: 2 }, { where: { id: sessionId } });

      // 通知用户 ──→ 推送 session_closed 给对应用户
      const userClient = userClients.get(String(session.userId));
      if (userClient && userClient.ws.readyState === WebSocket.OPEN) {
        sendTo(userClient.ws, { type: 'session_closed', data: { sessionId } });
      }

      // 通知管理员 ──→ 回显给操作者
      sendTo(ws, { type: 'session_closed', data: { sessionId } });
      // 刷新管理员端会话列表
      await broadcastSessionsToAdmins();
      break;
    }

    default:
      sendTo(ws, { type: 'error', message: '未知消息类型: ' + msg.type });
  }
}

// ====================================================================
//  [用户] 用户发送消息的完整处理
//  ==================== 服务端接收 → 写DB → 推送 ====================
//  推送对象：
//    1. 用户自己（回显确认）
//    2. 所有在线管理员（实时接收）
//    3. 管理员会话列表 + 未读数（角标更新）
// ====================================================================
async function handleUserMessage(client, session, content, messageType) {
  const type = messageType || 'text';

  // --- 写入消息表 ---
  const message = await db.ChatMessage.create({
    sessionId: session.id,
    senderId: client.userId,
    senderName: client.userName,
    senderType: 'user',
    receiverId: 1,
    messageType: type,
    content,
    isRead: 0,
    createTime: new Date()
  });

  // --- 更新会话表（lastMessage, lastTime, unreadCount+1） ---
  const lastMsg = type === 'text' ? content : '[图片]';
  await db.ChatSession.update({
    lastMessage: lastMsg,
    lastTime: new Date(),
    unreadCount: db.sequelize.literal('unreadCount + 1')
  }, { where: { id: session.id } });

  // --- 推送 ---
  // 1. [用户接收] 回显给自己（确认消息已发送）
  sendTo(userClients.get(String(client.userId))?.ws, {
    type: 'new_message',
    data: message
  });

  // 2. [管理员接收] 推送给所有在线管理员（实时看到新消息）
  const msgData = message.toJSON ? message.toJSON() : message;
  for (const adminWs of adminClients) {
    sendTo(adminWs, { type: 'new_message', data: msgData });
  }

  // 3. [管理员接收] 刷新会话列表和未读角标
  await broadcastSessionsToAdmins();
}

// ====================================================================
//  [管理员] 管理员发送消息的完整处理
//  ==================== 服务端接收 → 写DB → 推送 ====================
//  推送对象：
//    1. 所有在线管理员（含发送者自己，多端同步）
//    2. 目标用户（实时接收）
//    3. 管理员会话列表刷新
// ====================================================================
async function handleAdminMessage(client, session, content, messageType) {
  const type = messageType || 'text';

  // --- 写入消息表 ---
  const message = await db.ChatMessage.create({
    sessionId: session.id,
    senderId: 1,
    senderName: '客服',
    senderType: 'admin',
    receiverId: session.userId,
    messageType: type,
    content,
    isRead: 0,
    createTime: new Date()
  });

  // --- 更新会话表（lastMessage, lastTime, userUnreadCount+1） ---
  const lastMsg = type === 'text' ? content : '[图片]';
  await db.ChatSession.update({
    lastMessage: lastMsg,
    lastTime: new Date(),
    userUnreadCount: db.sequelize.literal('userUnreadCount + 1')
  }, { where: { id: session.id } });

  const msgData = message.toJSON ? message.toJSON() : message;

  // 1. [管理员接收] 推送给所有管理员（含发送者自己，确保多端同步）
  for (const adminWs of adminClients) {
    sendTo(adminWs, { type: 'new_message', data: msgData });
  }

  // 2. [用户接收] 推送给目标用户（实时收到客服回复）
  const userClient = userClients.get(String(session.userId));
  if (userClient && userClient.ws.readyState === WebSocket.OPEN) {
    sendTo(userClient.ws, { type: 'new_message', data: msgData });
    // 同时推送用户端未读数
    const updatedSession = await db.ChatSession.findByPk(session.id);
    sendTo(userClient.ws, {
      type: 'unread_update',
      data: { count: updatedSession ? updatedSession.userUnreadCount : 0 }
    });
  }

  // 3. [管理员接收] 刷新会话列表
  await broadcastSessionsToAdmins();
}

// ==================== [管理员] 广播会话列表给所有管理员 ====================
async function broadcastSessionsToAdmins() {
  const sessions = await db.ChatSession.findAll({
    where: { status: 1 },
    order: [['lastTime', 'DESC']]
  });
  const data = sessions.map(s => s.toJSON ? s.toJSON() : s);
  for (const adminWs of adminClients) {
    sendTo(adminWs, { type: 'sessions_update', data });
  }
  await broadcastUnreadToAdmins();
}

// ==================== [管理员] 广播未读总数给所有管理员 ====================
async function broadcastUnreadToAdmins() {
  const sessions = await db.ChatSession.findAll({ where: { status: 1 } });
  const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
  for (const adminWs of adminClients) {
    sendTo(adminWs, { type: 'unread_update', data: { count: totalUnread } });
  }
}

function sendTo(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

module.exports = { setupWebSocket };
