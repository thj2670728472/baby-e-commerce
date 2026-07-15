var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');

// 获取用户收藏列表
router.get('/list/:userId', async (req, res) => {
  try {
    const favorites = await db.favorite.findAll({
      where: { userId: req.params.userId },
      order: [['createTime', 'DESC']]
    });
    res.send({ code: 200, data: favorites, message: '获取收藏列表成功' });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.send({ code: 500, message: '获取收藏列表失败' });
  }
});

// 检查是否已收藏
router.get('/check/:userId/:goodsId', async (req, res) => {
  try {
    const favorite = await db.favorite.findOne({
      where: { 
        userId: req.params.userId,
        goodsId: req.params.goodsId
      }
    });
    res.send({ code: 200, data: { isFavorite: !!favorite } });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.send({ code: 500, message: '检查收藏状态失败' });
  }
});

// 添加收藏
router.post('/add', async (req, res) => {
  try {
    const { userId, goodsId, goodsName, goodsImage, goodsPrice } = req.body;
    
    // 检查是否已收藏
    const existing = await db.favorite.findOne({
      where: { userId, goodsId }
    });
    
    if (existing) {
      return res.send({ code: 400, message: '已经收藏过了' });
    }
    
    // 处理图片
    let image = goodsImage;
    if (Array.isArray(image) && image.length > 0) {
      image = image[0];
    }
    
    const favorite = await db.favorite.create({
      userId,
      goodsId,
      goodsName,
      goodsImage: image || '',
      goodsPrice,
      createTime: new Date()
    });
    
    res.send({ code: 200, data: favorite, message: '收藏成功' });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.send({ code: 500, message: '添加收藏失败' });
  }
});

// 取消收藏
router.delete('/remove/:userId/:goodsId', async (req, res) => {
  try {
    const result = await db.favorite.destroy({
      where: { 
        userId: req.params.userId,
        goodsId: req.params.goodsId
      }
    });
    
    if (result > 0) {
      res.send({ code: 200, message: '取消收藏成功' });
    } else {
      res.send({ code: 404, message: '收藏不存在' });
    }
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.send({ code: 500, message: '取消收藏失败' });
  }
});

module.exports = router;