var express = require('express');
var router = express.Router();
const { baby, user } = require('../db/mysqldb');

// 获取用户的婴儿列表
router.get('/list', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.json({ code: 400, message: '缺少用户ID' });
    }
    
    const babies = await baby.findAll({
      where: { userId }
    });
    
    res.json({ code: 200, data: babies, message: '获取婴儿列表成功' });
  } catch (error) {
    console.error('获取婴儿列表失败:', error);
    res.json({ code: 500, message: '获取婴儿列表失败' });
  }
});

// 保存婴儿信息
router.post('/save', async (req, res) => {
  try {
    const { userId, babies } = req.body;
    if (!userId || !babies || !Array.isArray(babies)) {
      return res.json({ code: 400, message: '参数错误' });
    }
    
    // 先删除用户的所有婴儿信息
    await baby.destroy({
      where: { userId }
    });
    
    // 保存新的婴儿信息
    if (babies.length > 0) {
      const babyData = babies.map(babyItem => ({
        userId,
        name: babyItem.name,
        birthDate: babyItem.birthDate,
        gender: babyItem.gender,
        height: babyItem.height,
        weight: babyItem.weight
      }));
      
      await baby.bulkCreate(babyData);
    }
    
    res.json({ code: 200, message: '保存婴儿信息成功' });
  } catch (error) {
    console.error('保存婴儿信息失败:', error);
    res.json({ code: 500, message: '保存婴儿信息失败' });
  }
});

// 计算总婴儿数
router.get('/count', async (req, res) => {
  try {
    const count = await baby.count();
    res.json({ code: 200, data: count, message: '获取婴儿数量成功' });
  } catch (error) {
    console.error('获取婴儿数量失败:', error);
    res.json({ code: 500, message: '获取婴儿数量失败' });
  }
});

module.exports = router;