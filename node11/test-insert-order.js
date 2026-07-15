const db = require('./db/mysqldb');

async function insertTestOrder() {
  try {
    // 创建订单
    const order = await db.order.create({
      orderNo: 'TEST' + Date.now(),
      userId: 15,
      userName: 'testuser',
      totalAmount: 100.00,
      status: '已付款',
      address: '北京市朝阳区测试地址',
      phone: '13800138000',
      paymentMethod: '支付宝',
      orderTime: new Date()
    });

    // 创建订单商品
    await db.order_goods.create({
      orderId: order.id,
      goodsId: 1,
      goodsName: '测试商品',
      goodsImage: 'https://example.com/test.jpg',
      price: 50.00,
      quantity: 2,
      subtotal: 100.00
    });

    console.log('测试订单插入成功！');
    console.log('订单ID:', order.id);
    console.log('订单号:', order.orderNo);
  } catch (error) {
    console.error('插入测试订单失败:', error);
  } finally {
    process.exit();
  }
}

insertTestOrder();