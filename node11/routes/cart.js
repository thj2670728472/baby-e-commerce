var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');

// 获取购物车列表
router.get('/list/:userId', async (req, res) => {
  try {
    const cartList = await db.cart.findAll({
      where: { userId: req.params.userId },
      order: [['createTime', 'DESC']]
    });
    res.json({ code: 200, data: cartList, message: '获取购物车成功' });
  } catch (error) {
    res.json({ code: 500, message: '获取购物车失败' });
  }
});

// 加入购物车
router.post('/add', async (req, res) => {
  try {
    const { userId, goodsId, goodsName, goodsImage, price } = req.body;

    // 检查商品状态
    const product = await db.goods.findByPk(goodsId);
    if (!product) {
      return res.json({ code: 404, message: '商品不存在' });
    }
    if (!product.status) {
      return res.json({ code: 400, message: '商品已下架，无法加入购物车' });
    }

    // 检查是否已存在
    const existItem = await db.cart.findOne({ where: { userId, goodsId } });

    if (existItem) {
      await existItem.update({ quantity: existItem.quantity + 1 });
      res.json({ code: 200, message: '购物车数量已更新' });
    } else {
      await db.cart.create({ userId, goodsId, goodsName, goodsImage, price, quantity: 1 });
      res.json({ code: 200, message: '已加入购物车' });
    }
  } catch (error) {
    res.json({ code: 500, message: '加入购物车失败' });
  }
});

// 更新数量
router.put('/update/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    await db.cart.update({ quantity }, { where: { id: req.params.id } });
    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除
router.delete('/delete/:id', async (req, res) => {
  try {
    await db.cart.destroy({ where: { id: req.params.id } });
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    res.json({ code: 500, message: '删除失败' });
  }
});

// 清空购物车
router.delete('/clear/:userId', async (req, res) => {
  try {
    await db.cart.destroy({ where: { userId: req.params.userId } });
    res.json({ code: 200, message: '已清空' });
  } catch (error) {
    res.json({ code: 500, message: '清空失败' });
  }
});

module.exports = router;
