const express = require('express');
const router = express.Router();
const db = require('../db/mysqldb');

// 获取订单列表（根据用户过滤）
router.get('/list', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    let whereCondition = {};
    if (userId) {
      whereCondition.userId = userId;
    }
    
    const orders = await db.order.findAll({
      where: whereCondition,
      include: [{
        model: db.order_goods,
        as: 'order_goods'
      }],
      order: [['orderTime', 'DESC']]
    });
    
    res.send({
      code: 200,
      data: orders,
      message: '获取订单列表成功'
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.send({
      code: 500,
      message: '获取订单列表失败: ' + error.message
    });
  }
});

// 获取订单详情
router.get('/detail/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id, {
      include: [{
        model: db.order_goods,
        as: 'order_goods'
      }]
    });
    
    if (!order) return res.send({ code: 404, message: '订单不存在' });
    
    // 查已评价的商品ID
    const reviewed = await db.review.findAll({
      where: { orderId: order.id, userId: order.userId },
      attributes: ['goodsId']
    });
    const reviewedGoodsIds = reviewed.map(r => r.goodsId);
    
    const result = order.toJSON();
    result.reviewedGoodsIds = reviewedGoodsIds;
    
    res.send({ code: 200, data: result });
  } catch (error) {
    res.send({ code: 500, message: '获取订单详情失败' });
  }
});
// 创建订单
router.post('/create', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const orderData = req.body;
    
    if (!orderData.userId || !orderData.goods || orderData.goods.length === 0) {
      await transaction.rollback();
      return res.send({ code: 400, message: '缺少必要参数' });
    }
    
    const user = await db.user.findByPk(orderData.userId);
    if (!user) {
      await transaction.rollback();
      return res.send({ code: 404, message: '用户不存在' });
    }
    
    // 获取地址
    let address = orderData.address;
    let phone = orderData.phone;
    
    if (!address || !phone) {
      const defaultAddress = await db.address.findOne({
        where: { userId: orderData.userId, isDefault: true }
      });
      
      if (defaultAddress) {
        address = `${defaultAddress.province}${defaultAddress.city}${defaultAddress.district}${defaultAddress.detail}`;
        phone = defaultAddress.phone;
      } else {
        const firstAddress = await db.address.findOne({ where: { userId: orderData.userId } });
        if (firstAddress) {
          address = `${firstAddress.province}${firstAddress.city}${firstAddress.district}${firstAddress.detail}`;
          phone = firstAddress.phone;
        } else {
          await transaction.rollback();
          return res.send({ code: 400, message: '请先添加收货地址' });
        }
      }
    }
    
    const orderNo = 'ORD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // 验证商品状态和库存
    for (const goods of orderData.goods) {
      const product = await db.goods.findByPk(goods.goodsId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.send({ code: 404, message: `商品 ${goods.goodsName} 不存在` });
      }
      if (!product.status) {
        await transaction.rollback();
        return res.send({ code: 400, message: `商品 ${goods.goodsName} 已下架，无法购买` });
      }
      if (product.quantity < goods.quantity) {
        await transaction.rollback();
        return res.send({ code: 400, message: `商品 ${goods.goodsName} 库存不足` });
      }
    }

    // 计算原价
    let originalTotal = 0;
    for (const goods of orderData.goods) {
      originalTotal += Number(goods.price) * Number(goods.quantity);
    }
    
    // 处理优惠券
    let couponAmount = 0;
    let couponId = orderData.couponId || null;
    let finalTotal = originalTotal;
    
    if (couponId) {
      const coupon = await db.UserCoupon.findOne({
        where: { id: couponId, userId: orderData.userId, status: 1 },
        transaction
      });
      
      if (!coupon) {
        await transaction.rollback();
        return res.send({ code: 400, message: '优惠券无效' });
      }
      
      if (originalTotal < coupon.threshold) {
        await transaction.rollback();
        return res.send({ code: 400, message: `订单金额不满足优惠券使用门槛` });
      }
      
      couponAmount = Number(coupon.amount);
      finalTotal = originalTotal - couponAmount;
      
      // 标记优惠券为已使用
      await coupon.update({ 
        status: 2, 
        usedTime: new Date(), 
        orderId: null
      }, { transaction });
    }

    // ========== 处理积分抵扣 ==========
let usePoints = orderData.usePoints || 0;
if (usePoints > 0) {
  const user = await db.user.findByPk(orderData.userId, { transaction });
  if (user.points < usePoints) {
    await transaction.rollback();
    return res.send({ code: 400, message: '积分不足' });
  }
  // 扣积分
  await db.user.update(
    { points: db.sequelize.literal(`points - ${usePoints}`) },
    { where: { id: orderData.userId }, transaction }
  );
  // 记录积分消耗
  await db.pointsRecord.create({
    userId: orderData.userId,
    type: 'expense',
    points: usePoints,
    source: '下单抵扣',
    description: `订单${orderNo}`
  }, { transaction });
  // 抵扣金额 = 积分 / 10
  finalTotal = finalTotal - (usePoints / 10);
}
    
    // 创建订单
    const order = await db.order.create({
      orderNo: orderNo,
      userId: orderData.userId,
      userName: user.username,
      totalAmount: Math.max(0, finalTotal),  //实际支付金额
      originalAmount: originalTotal,    //原价
      couponId: couponId,
      couponAmount: couponAmount,   //优惠券抵扣金额
      status: orderData.status || '待付款',
      address: address,
      phone: phone,
      paymentMethod: orderData.paymentMethod || '在线支付',
      orderTime: new Date()
    }, { transaction });
    
    // 更新优惠券的订单ID
    if (couponId) {
      await db.UserCoupon.update(
        { orderId: order.id },
        { where: { id: couponId }, transaction }
      );
    }
    
    // 创建订单商品记录
    for (const goods of orderData.goods) {
      let goodsImage = goods.goodsImage;
      if (Array.isArray(goodsImage) && goodsImage.length > 0) {
        goodsImage = goodsImage[0];
      }
      
      await db.order_goods.create({
        orderId: order.id,
        goodsId: goods.goodsId,
        goodsName: goods.goodsName,
        goodsImage: goodsImage || '',
        price: goods.price,
        quantity: goods.quantity,
        subtotal: Number(goods.price) * Number(goods.quantity)
      }, { transaction });
      
      // 如果订单状态是已付款，扣减库存
      if (orderData.status === '已付款') {
        const product = await db.goods.findByPk(goods.goodsId, { transaction });
        if (product) {
          const newQuantity = product.quantity - goods.quantity;
          if (newQuantity < 0) {
            await transaction.rollback();
            return res.send({ code: 400, message: `商品 ${goods.goodsName} 库存不足` });
          }
          await product.update({ quantity: newQuantity }, { transaction });
        }
      }
    }
    
    await transaction.commit();
    
    res.send({ code: 200, data: order, message: '创建订单成功' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建订单失败:', error);
    res.send({ code: 500, message: '创建订单失败: ' + error.message });
  }
});

// 更新订单状态
router.put('/update-status/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    const newStatus = req.body.status;
    const oldStatus = order.status;
    
    if (oldStatus === '待付款' && newStatus === '已付款') {
      const transaction = await db.sequelize.transaction();
      
      try {
        const orderGoods = await db.order_goods.findAll({
          where: { orderId: order.id },
          transaction
        });
        
        for (const item of orderGoods) {
          const product = await db.goods.findByPk(item.goodsId, { transaction });
          if (product) {
            const newQuantity = product.quantity - item.quantity;
            if (newQuantity < 0) {
              await transaction.rollback();
              return res.send({ code: 400, message: `商品 ${item.goodsName} 库存不足` });
            }
            await product.update({ quantity: newQuantity }, { transaction });
          }
        }
        
        await order.update({ status: newStatus }, { transaction });
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await order.update({ status: newStatus });
    }
    
    res.send({ code: 200, message: '更新订单状态成功' });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.send({ code: 500, message: '更新订单状态失败: ' + error.message });
  }
});

// 确认收货
router.post('/receive/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) return res.send({ code: 404, message: '订单不存在' });
    if (order.status !== '已发货') return res.send({ code: 400, message: '只有已发货的订单才能确认收货' });

    await order.update({ status: '已完成' });
      // ========== 累加销量 ==========
    const orderGoods = await db.order_goods.findAll({ where: { orderId: order.id } });
    for (const item of orderGoods) {
      await db.goods.update(
        { sales: db.sequelize.literal('sales + 1') },
        { where: { id: item.goodsId } }
      );
    }

    // ========== 加积分 ==========
    const totalAmount = Number(order.totalAmount);
    const points = totalAmount >= 100 ? 30 : 20;
    await db.user.update(
      { points: db.sequelize.literal(`points + ${points}`) },
      { where: { id: order.userId } }
    );
    await db.pointsRecord.create({
      userId: order.userId, type: 'income', points,
      source: '下单', description: `订单${order.orderNo}`
    });

    res.send({ code: 200, message: `确认收货成功，+${points}积分` });
  } catch (error) {
    res.send({ code: 500, message: '确认收货失败' });
  }
});
// 申请退货
router.post('/return/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    const allowStatus = ['已付款', '已发货', '已完成'];
    if (!allowStatus.includes(order.status)) {
      return res.send({ code: 400, message: '当前订单状态不允许退货' });
    }
    
    await order.update({
      status: '退货中',
      returnReason: req.body.reason,
      returnTime: new Date()
    });
    
    res.send({ code: 200, message: '退货申请已提交，等待管理员审核' });
  } catch (error) {
    console.error('申请退货失败:', error);
    res.send({ code: 500, message: '申请退货失败: ' + error.message });
  }
});

// 取消订单
router.post('/cancel/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    if (order.status !== '待付款') {
      return res.send({ code: 400, message: '只有待付款的订单才能取消' });
    }
    
    // 如果使用了优惠券，恢复优惠券状态
    if (order.couponId) {
      await db.UserCoupon.update(
        { status: 1, usedTime: null, orderId: null },
        { where: { id: order.couponId } }
      );
    }
    
    await order.update({ status: '已取消' });
    
    res.send({ code: 200, message: '订单已取消' });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.send({ code: 500, message: '取消订单失败: ' + error.message });
  }
});

// 删除订单
router.delete('/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    const allowDelete = ['已取消', '已完成', '已退货'];
    if (!allowDelete.includes(order.status)) {
      return res.send({ code: 400, message: '只能删除已取消、已完成或已退货的订单' });
    }
    
    await db.order_goods.destroy({ where: { orderId: order.id } });
    await order.destroy();
    
    res.send({ code: 200, message: '删除订单成功' });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.send({ code: 500, message: '删除订单失败: ' + error.message });
  }
});

// 发货（管理员）- 支持物流信息
router.post('/ship/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    if (order.status !== '已付款') {
      return res.send({ code: 400, message: '只有已付款的订单才能发货' });
    }
    
    const { logisticsCompany, logisticsNo } = req.body;
    
    await order.update({ 
      status: '已发货',
      logisticsCompany: logisticsCompany || '',
      logisticsNo: logisticsNo || '',
      shipTime: new Date()
    });
    
    res.send({ code: 200, message: '发货成功' });
  } catch (error) {
    console.error('发货失败:', error);
    res.send({ code: 500, message: '发货失败: ' + error.message });
  }
});

// 审核退货（管理员）
router.post('/approve-return/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id);
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    if (order.status !== '退货中') {
      return res.send({ code: 400, message: '该订单不在退货审核状态' });
    }
    
    const { approved } = req.body;
    
    if (approved) {
      const transaction = await db.sequelize.transaction();
      
      try {
        const orderGoods = await db.order_goods.findAll({
          where: { orderId: order.id },
          transaction
        });
        
        for (const item of orderGoods) {
          const product = await db.goods.findByPk(item.goodsId, { transaction });
          if (product) {
            await product.update({ 
              quantity: product.quantity + item.quantity 
            }, { transaction });
          }
        }
        
        await order.update({ status: '已退货' }, { transaction });
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await order.update({ status: '已完成' });
    }
    
    res.send({ 
      code: 200, 
      message: approved ? '退货申请已通过，库存已恢复' : '退货申请已拒绝' 
    });
  } catch (error) {
    console.error('审核退货失败:', error);
    res.send({ code: 500, message: '审核退货失败: ' + error.message });
  }
});

// 获取用户各状态订单数量
router.get('/count/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const counts = {
      all: await db.order.count({ where: { userId } }),
      pendingPayment: await db.order.count({ where: { userId, status: '待付款' } }),
      pendingShipment: await db.order.count({ where: { userId, status: '已付款' } }),
      shipped: await db.order.count({ where: { userId, status: '已发货' } }),
      completed: await db.order.count({ where: { userId, status: '已完成' } }),
      returning: await db.order.count({ where: { userId, status: '退货中' } })
    };
    
    res.send({ code: 200, data: counts, message: '获取订单数量成功' });
  } catch (error) {
    console.error('获取订单数量失败:', error);
    res.send({ code: 500, message: '获取订单数量失败: ' + error.message });
  }
});


// ==================== 查询物流信息 ====================
router.get('/logistics/:id', async (req, res) => {
  try {
    const order = await db.order.findByPk(req.params.id, {
      attributes: ['id', 'orderNo', 'status', 'logisticsCompany', 'logisticsNo', 'shipTime']
    });
    
    if (!order) {
      return res.send({ code: 404, message: '订单不存在' });
    }
    
    if (!order.logisticsNo) {
      return res.send({ code: 400, message: '暂无物流信息' });
    }
    
    // 模拟物流轨迹
    const shipTime = new Date(order.shipTime);
    const now = new Date();
    const hoursSinceShip = Math.floor((now - shipTime) / (1000 * 60 * 60));
    
    const mockTraces = [];
    
    if (hoursSinceShip >= 24) {
      mockTraces.push({
        time: formatDateTime(new Date(shipTime.getTime() + 24 * 60 * 60 * 1000)),
        status: '已签收',
        desc: '您的快递已签收，感谢使用'
      });
    }
    
    if (hoursSinceShip >= 6) {
      mockTraces.push({
        time: formatDateTime(new Date(shipTime.getTime() + 6 * 60 * 60 * 1000)),
        status: '派送中',
        desc: '快递员正在派送，请保持电话畅通'
      });
    }
    
    if (hoursSinceShip >= 3) {
      mockTraces.push({
        time: formatDateTime(new Date(shipTime.getTime() + 3 * 60 * 60 * 1000)),
        status: '运输中',
        desc: '快件已到达目的地转运中心'
      });
    }
    
    if (hoursSinceShip >= 1) {
      mockTraces.push({
        time: formatDateTime(new Date(shipTime.getTime() + 60 * 60 * 1000)),
        status: '运输中',
        desc: '快件已从转运中心发出'
      });
    }
    
    mockTraces.push({
      time: formatDateTime(shipTime),
      status: '已揽收',
      desc: '快递员已揽收快件'
    });
    
    res.send({
      code: 200,
      data: {
        orderNo: order.orderNo,
        company: order.logisticsCompany,
        no: order.logisticsNo,
        traces: mockTraces
      },
      message: '获取物流信息成功'
    });
  } catch (error) {
    console.error('获取物流信息失败:', error);
    res.send({ code: 500, message: '获取物流信息失败' });
  }
});

function formatDateTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}
module.exports = router;