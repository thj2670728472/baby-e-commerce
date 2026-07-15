module.exports = function(sequelize, DataTypes) {
  const ChatSession = sequelize.define('ChatSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    userAvatar: {
      type: DataTypes.STRING(500),
      defaultValue: '',
      comment: '用户头像'
    },
    lastMessage: {
      type: DataTypes.TEXT,
      comment: '最后一条消息'
    },
    lastTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '最后消息时间'
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '管理员未读数'
    },
    userUnreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '用户未读数'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1-进行中，2-已关闭'
    },
    createTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updateTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tb_chat_session',
    timestamps: false
  });

  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '会话ID'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '发送者ID'
    },
    senderName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '发送者名称'
    },
    senderType: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      comment: '发送者类型'
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '接收者ID'
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image'),
      defaultValue: 'text',
      comment: '消息类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容'
    },
    isRead: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '是否已读'
    },
    createTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tb_chat_message',
    timestamps: false
  });

  return { ChatSession, ChatMessage };
};