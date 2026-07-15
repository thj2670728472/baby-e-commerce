var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');
const { Op } = require('sequelize');

// ==================== 记录搜索关键词 ====================
router.post('/record', async (req, res) => {
  try {
    const { keyword, userId } = req.body;
    
    if (!keyword || !keyword.trim()) {
      return res.json({ code: 400, message: '关键词不能为空' });
    }
    
    await db.searchHistory.create({
      userId: userId || null,
      keyword: keyword.trim(),
      searchTime: new Date()
    });
    
    res.json({ code: 200, message: '记录成功' });
  } catch (error) {
    console.error('记录搜索关键词失败:', error);
    res.json({ code: 500, message: '记录失败' });
  }
});

// ==================== 获取热搜词（最近7天搜索最多的10个词） ====================
router.get('/hot', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const hotKeywords = await db.searchHistory.findAll({
      attributes: [
        'keyword',
        [db.sequelize.fn('COUNT', db.sequelize.col('keyword')), 'count']
      ],
      where: {
        searchTime: { [Op.gte]: sevenDaysAgo }
      },
      group: ['keyword'],
      order: [[db.sequelize.literal('count'), 'DESC']],
      limit: 10
    });
    
    res.json({ code: 200, data: hotKeywords, message: '获取热搜词成功' });
  } catch (error) {
    console.error('获取热搜词失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// ==================== 获取用户搜索历史（最近20条） ====================
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const history = await db.searchHistory.findAll({
      where: { userId: userId },
      attributes: ['keyword', 'searchTime'],
      order: [['searchTime', 'DESC']],
      limit: 20
    });
    
    // 去重
    const uniqueHistory = [];
    const seenKeywords = new Set();
    for (const item of history) {
      if (!seenKeywords.has(item.keyword)) {
        seenKeywords.add(item.keyword);
        uniqueHistory.push(item);
      }
    }
    
    res.json({ code: 200, data: uniqueHistory, message: '获取搜索历史成功' });
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// ==================== 清除用户搜索历史 ====================
router.delete('/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    await db.searchHistory.destroy({ where: { userId: userId } });
    res.json({ code: 200, message: '清除成功' });
  } catch (error) {
    console.error('清除搜索历史失败:', error);
    res.json({ code: 500, message: '清除失败' });
  }
});

// ==================== 搜索建议（根据输入前缀匹配） ====================
router.get('/suggest', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || !keyword.trim()) {
      return res.json({ code: 200, data: [] });
    }
    
    // 从历史记录中匹配
    const suggestions = await db.searchHistory.findAll({
      attributes: ['keyword'],
      where: {
        keyword: { [Op.like]: `%${keyword.trim()}%` }
      },
      group: ['keyword'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('keyword')), 'DESC']],
      limit: 8
    });
    
    res.json({ code: 200, data: suggestions, message: '获取建议成功' });
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

module.exports = router;