var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');
var multer = require('multer');
var path = require('path');
var fs = require('fs');

// 上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==================== 图片上传 ====================

// 上传聊天图片
router.post('/upload', upload.single('file'), function(req, res) {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '请选择图片' });
    }
    const url = '/uploads/chat/' + req.file.filename;
    res.json({ code: 200, message: '上传成功', data: { url } });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.json({ code: 500, message: '上传失败' });
  }
});

// ==================== 用户端接口 ====================

// 获取或创建用户会话（每个用户只有一个会话）
router.post('/session/get', async (req, res) => {
  try {
    const { userId, userName, userAvatar } = req.body;
    
    console.log('========== 获取/创建会话 ==========');
    console.log('userId:', userId);
    console.log('userName:', userName);
    console.log('userAvatar:', userAvatar);
    
    if (!userId || !userName) {
      return res.json({ code: 400, message: '参数不完整' });
    }
    
    // 查找现有会话
    let session = await db.ChatSession.findOne({
      where: { userId: userId, status: 1 }
    });
    
    console.log('现有会话:', session ? session.id : '无');
    
    if (!session) {
      // 创建新会话
      session = await db.ChatSession.create({
        userId: userId,
        userName: userName,
        userAvatar: userAvatar || '',
        lastMessage: '开始咨询',
        lastTime: new Date(),
        unreadCount: 0,
        userUnreadCount: 0,
        status: 1
      });
      
      console.log('新会话创建成功，ID:', session.id);
      
      // 自动发送欢迎消息
      await db.ChatMessage.create({
        sessionId: session.id,
        senderId: 1, // 管理员ID
        senderName: '客服',
        senderType: 'admin',
        receiverId: userId,
        messageType: 'text',
        content: '您好！请问有什么可以帮您的？',
        isRead: 0,
        createTime: new Date()
      });
      
      console.log('欢迎消息已发送');
    }
    
    console.log('===================================');
    
    res.json({ code: 200, data: session, message: '获取会话成功' });
  } catch (error) {
    console.error('========== 获取会话失败 ==========');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('===================================');
    res.json({ code: 500, message: '获取会话失败: ' + error.message });
  }
});

// 获取用户会话信息
router.get('/session/:userId', async (req, res) => {
  try {
    const session = await db.ChatSession.findOne({
      where: { userId: req.params.userId, status: 1 }
    });
    res.json({ code: 200, data: session });
  } catch (error) {
    console.error('获取会话失败:', error);
    res.json({ code: 500, message: '获取会话失败' });
  }
});

// 获取用户消息列表
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    console.log('获取消息列表，sessionId:', sessionId);
    
    const messages = await db.ChatMessage.findAll({
      where: { sessionId: sessionId },
      order: [['createTime', 'ASC']]
    });
    
    console.log('消息数量:', messages.length);
    
    // 标记管理员消息为已读
    await db.ChatMessage.update(
      { isRead: 1 },
      { where: { sessionId: sessionId, senderType: 'admin', isRead: 0 } }
    );
    
    // 清空用户未读数
    await db.ChatSession.update(
      { userUnreadCount: 0 },
      { where: { id: sessionId } }
    );
    
    res.json({ code: 200, data: messages, message: '获取消息成功' });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.json({ code: 500, message: '获取消息失败: ' + error.message });
  }
});

// 用户发送消息
router.post('/message/send', async (req, res) => {
  try {
    const { sessionId, senderId, senderName, messageType, content } = req.body;
    
    console.log('========== 用户发送消息 ==========');
    console.log('sessionId:', sessionId);
    console.log('senderId:', senderId);
    console.log('messageType:', messageType);
    console.log('content:', content);
    
    if (!sessionId || !senderId || !content) {
      return res.json({ code: 400, message: '参数不完整' });
    }
    
    const session = await db.ChatSession.findByPk(sessionId);
    if (!session) {
      return res.json({ code: 404, message: '会话不存在' });
    }
    
    // 创建消息
    const message = await db.ChatMessage.create({
      sessionId: sessionId,
      senderId: senderId,
      senderName: senderName,
      senderType: 'user',
      receiverId: 1, // 管理员ID
      messageType: messageType || 'text',
      content: content,
      isRead: 0,
      createTime: new Date()
    });
    
    console.log('消息创建成功，ID:', message.id);
    
    // 更新会话
    await db.ChatSession.update({
      lastMessage: messageType === 'text' ? content : '[图片]',
      lastTime: new Date(),
      unreadCount: db.sequelize.literal('unreadCount + 1')
    }, { where: { id: sessionId } });
    
    console.log('===================================');
    
    res.json({ code: 200, data: message, message: '发送成功' });
  } catch (error) {
    console.error('========== 发送消息失败 ==========');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('===================================');
    res.json({ code: 500, message: '发送失败: ' + error.message });
  }
});

// 获取用户未读消息数
router.get('/unread/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const session = await db.ChatSession.findOne({
      where: { userId: userId, status: 1 }
    });
    const count = session ? session.userUnreadCount : 0;
    res.json({ code: 200, data: { count: count } });
  } catch (error) {
    console.error('获取未读数失败:', error);
    res.json({ code: 500, message: '获取未读数失败' });
  }
});

// ==================== 管理员端接口 ====================

// 获取所有会话列表（管理员）
router.get('/admin/sessions', async (req, res) => {
  try {
    const sessions = await db.ChatSession.findAll({
      where: { status: 1 },
      order: [['lastTime', 'DESC']]
    });
    res.json({ code: 200, data: sessions, message: '获取会话列表成功' });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.json({ code: 500, message: '获取会话列表失败: ' + error.message });
  }
});

// 管理员获取消息列表
router.get('/admin/messages/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    const messages = await db.ChatMessage.findAll({
      where: { sessionId: sessionId },
      order: [['createTime', 'ASC']]
    });
    
    // 标记用户消息为已读
    await db.ChatMessage.update(
      { isRead: 1 },
      { where: { sessionId: sessionId, senderType: 'user', isRead: 0 } }
    );
    
    // 清空管理员未读数
    await db.ChatSession.update(
      { unreadCount: 0 },
      { where: { id: sessionId } }
    );
    
    res.json({ code: 200, data: messages, message: '获取消息成功' });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.json({ code: 500, message: '获取消息失败: ' + error.message });
  }
});

// 管理员发送消息
router.post('/admin/message/send', async (req, res) => {
  try {
    const { sessionId, content, messageType } = req.body;
    
    console.log('========== 管理员发送消息 ==========');
    console.log('sessionId:', sessionId);
    console.log('messageType:', messageType);
    console.log('content:', content);
    
    if (!sessionId || !content) {
      return res.json({ code: 400, message: '参数不完整' });
    }
    
    const session = await db.ChatSession.findByPk(sessionId);
    if (!session) {
      return res.json({ code: 404, message: '会话不存在' });
    }
    
    // 创建消息
    const message = await db.ChatMessage.create({
      sessionId: sessionId,
      senderId: 1, // 管理员ID
      senderName: '客服',
      senderType: 'admin',
      receiverId: session.userId,
      messageType: messageType || 'text',
      content: content,
      isRead: 0,
      createTime: new Date()
    });
    
    console.log('消息创建成功，ID:', message.id);
    
    // 更新会话
    await db.ChatSession.update({
      lastMessage: messageType === 'text' ? content : '[图片]',
      lastTime: new Date(),
      userUnreadCount: db.sequelize.literal('userUnreadCount + 1')
    }, { where: { id: sessionId } });
    
    console.log('===================================');
    
    res.json({ code: 200, data: message, message: '发送成功' });
  } catch (error) {
    console.error('========== 发送消息失败 ==========');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('===================================');
    res.json({ code: 500, message: '发送失败: ' + error.message });
  }
});

// 关闭会话
router.put('/admin/session/close/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    await db.ChatSession.update(
      { status: 2 },
      { where: { id: sessionId } }
    );
    res.json({ code: 200, message: '会话已关闭' });
  } catch (error) {
    console.error('关闭会话失败:', error);
    res.json({ code: 500, message: '关闭会话失败' });
  }
});

// 获取未读消息总数（管理员）
router.get('/admin/unread/count', async (req, res) => {
  try {
    const sessions = await db.ChatSession.findAll({ where: { status: 1 } });
    const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
    res.json({ code: 200, data: { count: totalUnread } });
  } catch (error) {
    console.error('获取未读数失败:', error);
    res.json({ code: 500, message: '获取未读数失败' });
  }
});

module.exports = router;