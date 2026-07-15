var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');

// 获取用户积分
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await db.user.findByPk(req.params.userId, { attributes: ['id', 'points'] });
    
    res.json({ code: 200, data: { points: user.points || 0 } });
  } catch (error) {
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取积分记录
router.get('/records/:userId', async (req, res) => {
  try {
    const records = await db.pointsRecord.findAll({
      where: { userId: req.params.userId },
      order: [['createTime', 'DESC']],
      limit: 50
    });
    res.json({ code: 200, data: records });
  } catch (error) {
    res.json({ code: 500, message: '获取失败' });
  }
});


module.exports = router;