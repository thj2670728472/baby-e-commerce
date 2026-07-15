function model_search_history(db, SEQ) {
  const searchHistory = db.define('search_history', {
    id: {
      type: SEQ.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: SEQ.INTEGER,
      allowNull: true,
      comment: '用户ID（未登录为null）'
    },
    keyword: {
      type: SEQ.STRING(100),
      allowNull: false,
      comment: '搜索关键词'
    },
    searchTime: {
      type: SEQ.DATE,
      allowNull: false,
      defaultValue: SEQ.NOW,
      comment: '搜索时间'
    }
  }, {
    tableName: 'tb_search_history',
    freezeTableName: true,
    timestamps: false
  });
  return searchHistory;
}
module.exports = model_search_history;