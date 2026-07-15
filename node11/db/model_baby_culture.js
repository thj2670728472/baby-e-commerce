function model_baby_culture(db, SEQ) {
  const BabyCulture = db.define('BabyCulture', {
    id: {
      type: SEQ.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: SEQ.STRING(200),
      allowNull: false,
      comment: '文章标题'
    },
    summary: {
      type: SEQ.TEXT,
      allowNull: false,
      comment: '文章摘要/概括'
    },
    content: {
      type: SEQ.TEXT,
      allowNull: false,
      comment: '文章内容'
    },
    author: {
      type: SEQ.STRING(100),
      allowNull: true,
      comment: '作者'
    },
    status: {
      type: SEQ.ENUM('published', 'draft'),
      defaultValue: 'published',
      comment: '状态：published-已发布，draft-草稿'
    },
    viewCount: {
      type: SEQ.INTEGER,
      defaultValue: 0,
      comment: '浏览次数'
    }
  }, {
    tableName: 'baby_culture',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return BabyCulture;
}

module.exports = model_baby_culture;
