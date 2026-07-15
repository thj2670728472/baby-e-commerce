var express = require('express');
var router = express.Router();
var db = require('../db/mysqldb');
const { Op } = require('sequelize');

// 获取当前周数
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// 检查用户本周是否已抽取
async function hasUserDrawnThisWeek(userId) {
  const now = new Date();
  const yearNumber = now.getFullYear();
  const weekNumber = getWeekNumber(now);
  
  const record = await db.UserDrawRecord.findOne({
    where: { userId, yearNumber, weekNumber }
  });
  
  return !!record;
}

// 记录用户本周已抽取
async function recordUserDraw(userId) {
  const now = new Date();
  const yearNumber = now.getFullYear();
  const weekNumber = getWeekNumber(now);
  
  await db.UserDrawRecord.create({
    userId,
    drawDate: now,
    yearNumber,
    weekNumber
  });
}

// 获取可用优惠券模板（抽取用）
router.get('/templates', async (req, res) => {
  try {
    const templates = await db.CouponTemplate.findAll({
      where: { status: 1 },
      attributes: ['id', 'name', 'threshold', 'amount', 'probability']
    });
    res.json({ code: 200, data: templates });
  } catch (error) {
    console.error('获取优惠券模板失败:', error);
    res.json({ code: 500, message: '获取优惠券模板失败' });
  }
});

// 检查用户本周是否已抽取
router.get('/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const hasDrawn = await hasUserDrawnThisWeek(userId);
    res.json({ code: 200, data: { hasDrawn } });
  } catch (error) {
    console.error('检查抽取状态失败:', error);
    res.json({ code: 500, message: '检查失败' });
  }
});

// 抽取优惠券
router.post('/draw', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json({ code: 400, message: '用户未登录' });

    // 检查本周是否已抽取
    const hasDrawn = await hasUserDrawnThisWeek(userId);
    if (hasDrawn) {
      return res.json({ code: 400, message: '本周已经抽取过了，下周再来吧' });
    }

    const templates = await db.CouponTemplate.findAll({ where: { status: 1 } });
    if (templates.length === 0) {
      return res.json({ code: 400, message: '暂无可用优惠券' });
    }

    // 根据概率抽取
    const random = Math.random();
    let selectedTemplate = null;
    let cumulativeProbability = 0;

    for (const template of templates) {
      cumulativeProbability += template.probability;
      if (random < cumulativeProbability) {
        selectedTemplate = template;
        break;
      }
    }
    if (!selectedTemplate) selectedTemplate = templates[0];

    // 检查库存
    if (selectedTemplate.totalCount !== -1 && selectedTemplate.usedCount >= selectedTemplate.totalCount) {
      return res.json({ code: 400, message: '优惠券已被抢光' });
    }

    await selectedTemplate.update({ usedCount: selectedTemplate.usedCount + 1 });

    // 设置过期时间为3天后
    const expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 3);
    expireTime.setHours(23, 59, 59, 999);

    // 创建用户优惠券
    const userCoupon = await db.UserCoupon.create({
      userId,
      templateId: selectedTemplate.id,
      name: selectedTemplate.name,
      threshold: selectedTemplate.threshold,
      amount: selectedTemplate.amount,
      status: 1,
      expireTime
    });

    // 记录抽取记录
    await db.CouponDrawRecord.create({
      userId,
      templateId: selectedTemplate.id,
      couponName: selectedTemplate.name,
      threshold: selectedTemplate.threshold,
      amount: selectedTemplate.amount
    });

    // 记录本周已抽取
    await recordUserDraw(userId);

    res.json({
      code: 200,
      data: userCoupon,
      message: `恭喜你得到了${selectedTemplate.name}优惠券，有效期3天，赶紧去使用吧`
    });
  } catch (error) {
    console.error('抽取优惠券失败:', error);
    res.json({ code: 500, message: '抽取失败' });
  }
});

// 获取用户优惠券列表
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    let where = { userId };
    if (status) where.status = parseInt(status);
    
    // 自动更新过期优惠券状态
    const now = new Date();
    await db.UserCoupon.update(
      { status: 3 },
      { where: { userId, status: 1, expireTime: { [Op.lt]: now } } }
    );
    
    const coupons = await db.UserCoupon.findAll({
      where,
      order: [['createTime', 'DESC']]
    });
    
    res.json({ code: 200, data: coupons });
  } catch (error) {
    console.error('获取优惠券列表失败:', error);
    res.json({ code: 500, message: '获取优惠券列表失败' });
  }
});

// 获取用户可用优惠券（下单时使用）
router.get('/available/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.query;
    
    const now = new Date();
    
    // 自动更新过期优惠券状态
    await db.UserCoupon.update(
      { status: 3 },
      { where: { userId, status: 1, expireTime: { [Op.lt]: now } } }
    );
    
    // ✅ 查询可用优惠券，同时检查模板是否启用
    const coupons = await db.UserCoupon.findAll({
      where: {
        userId,
        status: 1,
        threshold: { [Op.lte]: amount || 0 },
        expireTime: { [Op.gt]: now }
      },
      include: [{
        model: db.CouponTemplate,
        attributes: ['status'],
        where: { status: 1 },  // ✅ 只返回模板状态为启用的优惠券
        required: true
      }],
      order: [['amount', 'DESC']]
    });
    
    res.json({ code: 200, data: coupons });
  } catch (error) {
    console.error('获取可用优惠券失败:', error);
    res.json({ code: 500, message: '获取可用优惠券失败: ' + error.message });
  }
});

// 获取抽取记录
router.get('/records/:userId', async (req, res) => {
  try {
    const records = await db.CouponDrawRecord.findAll({
      where: { userId: req.params.userId },
      order: [['createTime', 'DESC']],
      limit: 20
    });
    res.json({ code: 200, data: records });
  } catch (error) {
    console.error('获取抽取记录失败:', error);
    res.json({ code: 500, message: '获取抽取记录失败' });
  }
});

// 使用优惠券
router.put('/use/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId } = req.body;
    
    const coupon = await db.UserCoupon.findByPk(id);
    if (!coupon) {
      return res.json({ code: 404, message: '优惠券不存在' });
    }
    
    if (coupon.status !== 1) {
      return res.json({ code: 400, message: '优惠券不可用' });
    }
    
    const now = new Date();
    if (coupon.expireTime && new Date(coupon.expireTime) < now) {
      await coupon.update({ status: 3 });
      return res.json({ code: 400, message: '优惠券已过期' });
    }
    
    await coupon.update({ status: 2, usedTime: now, orderId });
    
    res.json({ code: 200, message: '优惠券已使用' });
  } catch (error) {
    console.error('使用优惠券失败:', error);
    res.json({ code: 500, message: '使用优惠券失败' });
  }
});

// 获取用户优惠券数量
router.get('/count/:userId', async (req, res) => {
  try {
    const now = new Date();
    
    // 自动更新过期优惠券状态
    await db.UserCoupon.update(
      { status: 3 },
      { where: { userId: req.params.userId, status: 1, expireTime: { [Op.lt]: now } } }
    );
    
    const count = await db.UserCoupon.count({
      where: { userId: req.params.userId, status: 1, expireTime: { [Op.gt]: now } }
    });
    
    res.json({ code: 200, data: { count } });
  } catch (error) {
    console.error('获取优惠券数量失败:', error);
    res.json({ code: 500, message: '获取优惠券数量失败' });
  }
});

// 获取用户本周是否已抽取
router.get('/week-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const hasDrawn = await hasUserDrawnThisWeek(userId);
    res.json({ code: 200, data: { hasDrawn } });
  } catch (error) {
    console.error('获取周状态失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

module.exports = router;