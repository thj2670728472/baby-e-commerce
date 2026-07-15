var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');

// 提交评价
router.post('/submit', async (req, res) => {
  try {
    const { orderId, goodsId, userId, userName, rating, content, isAnonymous } = req.body;
    
    console.log('========== 收到评价提交请求 ==========');
    console.log('orderId:', orderId);
    console.log('goodsId:', goodsId);
    console.log('userId:', userId);
    console.log('userName:', userName);
    console.log('rating:', rating);
    console.log('content:', content);
    console.log('isAnonymous:', isAnonymous);
    console.log('======================================');
    
    if (!goodsId || !userId || !rating) {
      console.log('参数不完整');
      return res.send({ code: 400, message: '参数不完整' });
    }
    
    const reviewData = {
      orderId: orderId || null,
      goodsId: goodsId,
      userId: userId,
      userName: isAnonymous ? '' : (userName || ''),
      rating: rating,
      content: content || '默认好评',
      images: JSON.stringify(req.body.images || []),
      status: 0,
      createTime: new Date(),
      updateTime: new Date()
    };
    
    const review = await db.review.create(reviewData);
    console.log('评价创建成功，ID:', review.id);
    
    res.send({ 
      code: 200, 
      data: review, 
      message: '评价提交成功，等待管理员审核' 
    });
  } catch (error) {
    console.error('提交评价失败:', error.message);
    res.send({ code: 500, message: '提交评价失败: ' + error.message });
  }
});

// 解析图片字段的辅助函数
function parseImages(data) {
  if (!data.images) {
    data.images = [];
    return data;
  }
  if (typeof data.images === 'string') {
    try { data.images = JSON.parse(data.images); } catch (e) { data.images = []; }
  }
  if (!Array.isArray(data.images)) data.images = [];
  return data;
}

// 获取所有评价（管理员）
router.get('/list', async (req, res) => {
  try {
    const { status, goodsId, page = 1, limit = 10 } = req.query;
    
    let where = {};
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    if (goodsId) {
      where.goodsId = parseInt(goodsId);
    }
    
    const { count, rows } = await db.review.findAndCountAll({
      where: where,
      order: [['createTime', 'DESC']],
      offset: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    });
    
    const processedRows = rows.map(review => {
      let data = review.toJSON();
      if (!data.userName) data.userName = '匿名用户';
      data = parseImages(data);
      return data;
    });
    
    res.send({ 
      code: 200, 
      data: { list: processedRows, total: count, page: parseInt(page), limit: parseInt(limit) }, 
      message: '获取评价列表成功' 
    });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    res.send({ code: 500, message: '获取评价列表失败: ' + error.message });
  }
});

// 获取商品评价列表 - 只返回已审核通过的
router.get('/goods/:goodsId', async (req, res) => {
  try {
    const reviews = await db.review.findAll({
      where: { goodsId: req.params.goodsId, status: 1 },
      order: [['createTime', 'DESC']]
    });
    
    const processedReviews = reviews.map(review => {
      let data = review.toJSON();
      if (!data.userName) data.userName = '匿名用户';
      data = parseImages(data);
      return data;
    });
    
    res.send({ code: 200, data: processedReviews, message: '获取评价列表成功' });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    res.send({ code: 500, message: '获取评价列表失败: ' + error.message });
  }
});

// 获取评价统计
router.get('/stats/:goodsId', async (req, res) => {
  try {
    const reviews = await db.review.findAll({
      where: { goodsId: req.params.goodsId, status: 1 }
    });
    
    const total = reviews.length;
    const avgRating = total > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) 
      : 0;
    
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1; });
    
    res.send({ code: 200, data: { total, avgRating, ratingCounts }, message: '获取评价统计成功' });
  } catch (error) {
    console.error('获取评价统计失败:', error);
    res.send({ code: 500, message: '获取评价统计失败: ' + error.message });
  }
});

// 审核评价（管理员）
router.put('/audit/:id', async (req, res) => {
  try {
    const { status } = req.body;   //1通过  2拒绝
    const review = await db.review.findByPk(req.params.id);
    
    if (!review) return res.send({ code: 404, message: '评价不存在' });
    
    await review.update({ status: parseInt(status), updateTime: new Date() });
    
    if (parseInt(status) === 1) {
      const existRecord = await db.pointsRecord.findOne({
        where: { userId: review.userId, source: '评价', description: `评价ID:${review.id}` }
      });
      
      if (!existRecord) {
        await db.user.update(
          { points: db.sequelize.literal('points + 5') },
          { where: { id: review.userId } }
        );
        await db.pointsRecord.create({
          userId: review.userId, type: 'income', points: 5,
          source: '评价', description: `评价ID:${review.id}`
        });
        console.log(`用户${review.userId}评价奖励+5积分`);
      }
    }
    
    console.log('评价审核完成:', req.params.id, '状态:', status);
    res.send({ code: 200, message: status == 1 ? '评价审核通过' : '评价已拒绝' });
  } catch (error) {
    console.error('审核评价失败:', error);
    res.send({ code: 500, message: '审核评价失败: ' + error.message });
  }
});

// 删除评价（管理员）
router.delete('/:id', async (req, res) => {
  try {
    const review = await db.review.findByPk(req.params.id);
    if (!review) return res.send({ code: 404, message: '评价不存在' });
    await review.destroy();
    res.send({ code: 200, message: '评价删除成功' });
  } catch (error) {
    console.error('删除评价失败:', error);
    res.send({ code: 500, message: '删除评价失败: ' + error.message });
  }
});

module.exports = router;