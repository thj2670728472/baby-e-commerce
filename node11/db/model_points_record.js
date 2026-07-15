function model_points_record(db, SEQ) {
  return db.define('points_record', {
    userId: { type: SEQ.INTEGER, allowNull: false, comment: '用户ID' },
    type: { type: SEQ.ENUM('income', 'expense'), allowNull: false, comment: 'income=获得, expense=消耗' },
    points: { type: SEQ.INTEGER, allowNull: false, comment: '积分数量' },
    source: { type: SEQ.STRING(50), allowNull: false, comment: '来源' },
    description: { type: SEQ.STRING(200), comment: '备注' },
    createTime: { type: SEQ.DATE, defaultValue: SEQ.NOW }
  }, {
    tableName: 'tb_points_record',
    freezeTableName: true,
    timestamps: false
  });
}
module.exports = model_points_record;