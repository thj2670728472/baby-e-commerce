function model_cart(db, SEQ) {
  const cart = db.define('cart', {
    userId: {
      type: SEQ.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    goodsId: {
      type: SEQ.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    goodsName: {
      type: SEQ.STRING(100),
      allowNull: false,
      comment: '商品名称'
    },
    goodsImage: {
      type: SEQ.TEXT,
      allowNull: true,
      comment: '商品图片'
    },
    price: {
      type: SEQ.DECIMAL(10, 2),
      allowNull: false,
      comment: '商品价格'
    },
    quantity: {
      type: SEQ.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '数量'
    },
    createTime: {
      type: SEQ.DATE,
      defaultValue: SEQ.NOW,
      comment: '加入时间'
    }
  }, {
    tableName: 'tb_cart',
    freezeTableName: true,
    timestamps: false
  });
  return cart;
}
module.exports = model_cart;