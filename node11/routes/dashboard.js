var express = require('express');
var router = express.Router();
const { goods, category, order, user, baby, order_goods } = require('../db/mysqldb');

// 获取仪表盘统计数据
router.get('/statistics', async (req, res) => {
  try {
    // 获取商品总数（库存）
    const totalProducts = await goods.count();
    
    // 获取商品种类数（假设每个商品都是一个种类）
    const productTypes = await goods.count();
    
    // 获取商品分类数
    const productCategories = await category.count();
    
    // 获取订单总数
    const totalOrders = await order.count();
    
    // 获取完成订单数
    const completedOrders = await order.count({ where: { status: '已完成' } });
    
    // 获取用户总数
    const totalUsers = await user.count();
    
    // 计算总销售金额（从订单货物表中计算状态为"已完成"的订单的所有subtotal之和）
    // 首先查询所有状态为"已完成"的订单
    const completedOrderList = await order.findAll({ 
      where: { status: '已完成' },
      attributes: ['id']
    });
    
    console.log('已完成订单列表:', completedOrderList);
    
    // 提取已完成订单的ID列表
    const completedOrderIds = completedOrderList.map(order => order.id);
    
    console.log('已完成订单ID列表:', completedOrderIds);
    
    // 然后查询订单货物表中对应这些订单的记录
    let totalSales = 0;
    if (completedOrderIds.length > 0) {
      try {
        const orderGoods = await order_goods.findAll({ 
          where: { orderId: completedOrderIds }
        });
        
        console.log('订单货物列表:', orderGoods);
        
        // 计算subtotal之和
        orderGoods.forEach(item => {
          console.log('商品subtotal:', item.subtotal);
          totalSales += Number(item.subtotal) || 0;
        });
        
        console.log('计算后的总销售金额:', totalSales);
      } catch (error) {
        console.error('计算销售金额失败:', error);
        totalSales = 0;
      }
    }
    
    console.log('最终总销售金额:', totalSales);
    
    // 婴儿数：从baby表中查询实际数量
    const babyCount = await baby.count();
    
    res.json({
      totalSales: Math.round(totalSales),
      totalOrders,
      totalProducts,
      totalUsers,
      productTypes,
      productCategories,
      completedOrders,
      babyCount
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ code: 500, message: '获取统计数据失败' });
  }
});

module.exports = router;