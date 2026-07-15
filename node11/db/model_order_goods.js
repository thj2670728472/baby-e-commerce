function model_order_goods(db, SEQ) {
  const order_goods = db.define('order_goods', {
    orderId: {
      type: SEQ.INTEGER,
      allowNull: false,
      comment: '订单ID'
    },
    goodsId: {
      type: SEQ.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    goodsName: {
      type: SEQ.STRING,
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
      comment: '商品数量'
    },
    subtotal: {
      type: SEQ.DECIMAL(10, 2),
      allowNull: false,
      comment: '商品小计'
    }
  }, {
    tableName: 'tb_order_goods',
    freezeTableName: true
  });
  return order_goods;
}
module.exports = model_order_goods;