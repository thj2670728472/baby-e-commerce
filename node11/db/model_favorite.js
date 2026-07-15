module.exports = function(sequelize, DataTypes) {
  return sequelize.define('favorite', {
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
    goodsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    goodsName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '商品名称'
    },
    goodsImage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '商品图片'
    },
    goodsPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '商品价格'
    },
    createTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '收藏时间'
    }
  }, {
    tableName: 'tb_favorite',
    timestamps: false
  });
};