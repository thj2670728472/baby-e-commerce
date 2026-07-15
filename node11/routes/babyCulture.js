const express = require('express');
const router = express.Router();
const { baby_culture } = require('../db/mysqldb');

// 获取所有文章列表
router.get('/', async (req, res) => {
  try {
    const articles = await baby_culture.findAll({
      where: { status: 'published' },
      order: [['createdAt', 'DESC']]
    });
    res.send({
      code: 200,
      message: '获取成功',
      data: articles
    });
  } catch (error) {
    res.send({
      code: 500,
      message: '获取文章列表失败：' + error.message
    });
  }
});

// 根据月龄推荐文章
router.get('/recommend', async (req, res) => {
  try {
    const { months } = req.query;
    let keywords = [];
    
    if (months <= 6) keywords = ['新生儿', '母乳', '喂养', '护理', '睡眠'];
    else if (months <= 12) keywords = ['辅食', '爬行', '长牙', '断奶'];
    else if (months <= 36) keywords = ['早教', '说话', '走路', '绘本', '玩具'];
    else keywords = ['幼儿园', '习惯', '教育'];
    
    const articles = await baby_culture.findAll({
      where: { status: 'published' },
      order: [['createdAt', 'DESC']]
    });
    
    // 按关键词匹配推荐
    const recommended = articles.filter(a => 
      keywords.some(k => a.title.includes(k) || a.summary.includes(k))
    );
    const rest = articles.filter(a => !recommended.includes(a));
    
    res.json({ code: 200, data: { recommended, all: articles } });
  } catch (error) {
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取文章详情
router.get('/:id', async (req, res) => {
  try {
    const article = await baby_culture.findByPk(req.params.id);
    if (article) {
      // 增加浏览次数
      await article.update({ viewCount: article.viewCount + 1 });
      res.send({
        code: 200,
        message: '获取成功',
        data: article
      });
    } else {
      res.send({
        code: 404,
        message: '文章不存在'
      });
    }
  } catch (error) {
    res.send({
      code: 500,
      message: '获取文章详情失败：' + error.message
    });
  }
});

// 创建新文章（管理员）
router.post('/', async (req, res) => {
  try {
    const article = await baby_culture.create(req.body);
    res.send({
      code: 200,
      message: '创建成功',
      data: article
    });
  } catch (error) {
    res.send({
      code: 500,
      message: '创建文章失败：' + error.message
    });
  }
});

// 更新文章（管理员）
router.put('/:id', async (req, res) => {
  try {
    const article = await baby_culture.findByPk(req.params.id);
    if (article) {
      await article.update(req.body);
      res.send({
        code: 200,
        message: '更新成功',
        data: article
      });
    } else {
      res.send({
        code: 404,
        message: '文章不存在'
      });
    }
  } catch (error) {
    res.send({
      code: 500,
      message: '更新文章失败：' + error.message
    });
  }
});

// 删除文章（管理员）
router.delete('/:id', async (req, res) => {
  try {
    const article = await baby_culture.findByPk(req.params.id);
    if (article) {
      await article.destroy();
      res.send({
        code: 200,
        message: '删除成功'
      });
    } else {
      res.send({
        code: 404,
        message: '文章不存在'
      });
    }
  } catch (error) {
    res.send({
      code: 500,
      message: '删除文章失败：' + error.message
    });
  }
});

module.exports = router;
