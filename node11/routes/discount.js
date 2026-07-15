var express = require('express');
var router = express.Router();

//  配置区域（改时间，折扣） 
const TARGET_DAY = 1;        // 打折的星期：0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
const DISCOUNT_RATE = 0.7;   // 折扣率：0.7 = 7折
const DISCOUNT_NAME = '周一狂欢日';  // 显示名称
// ==========================================================

// 获取星期名称
function getDayName(day) {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[day];
}

// 计算距离目标星期还有多少天（通用方法）
function getDaysUntilTarget(targetDay) {
  const now = new Date();
  const currentDay = now.getDay();
  
  if (currentDay === targetDay) {
    return 0; // 今天就是目标日
  }
  
  let diff = targetDay - currentDay;
  if (diff < 0) {
    diff += 7; // 跨到下周
  }
  
  return diff;
}

// 判断当前是否是打折日
function isDiscountDay() {
  const now = new Date();
  return now.getDay() === TARGET_DAY;
}

// 获取距离下一个打折日的时间
function getTimeUntilNextDiscountDay() {
  const now = new Date();
  const daysUntil = getDaysUntilTarget(TARGET_DAY);
  
  const nextDiscountDay = new Date(now);
  nextDiscountDay.setDate(now.getDate() + daysUntil);
  nextDiscountDay.setHours(0, 0, 0, 0);
  
  const timeUntil = nextDiscountDay - now;
  
  const days = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
  
  return { 
    days, 
    hours, 
    minutes, 
    totalSeconds: Math.max(0, Math.floor(timeUntil / 1000)) 
  };
}

// 获取打折状态
router.get('/status', (req, res) => {
  const now = new Date();
  const isActive = isDiscountDay();
  
  let countdown = { days: 0, hours: 0, minutes: 0, totalSeconds: 0 };
  let endTime = null;
  
  if (isActive) {
    // 如果是打折日，计算距离今天结束的时间
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);
    const timeLeft = dayEnd - now;
    
    countdown = {
      days: 0,
      hours: Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)),
      totalSeconds: Math.max(0, Math.floor(timeLeft / 1000))
    };
    endTime = dayEnd.toISOString();
  } else {
    // 如果不是打折日，计算距离下一个打折日的时间
    countdown = getTimeUntilNextDiscountDay();
  }
  
  // 动态生成显示名称
  const dayName = getDayName(TARGET_DAY);
  const discountText = isActive ? `${dayName}狂欢日 全场${Math.round(DISCOUNT_RATE * 10)}折！` : `距离${dayName}狂欢日还有`;
  
  res.send({
    code: 200,
    data: {
      isActive,
      discountRate: DISCOUNT_RATE,
      discountText,
      targetDay: TARGET_DAY,
      targetDayName: dayName,
      countdown,
      endTime
    }
  });
});



module.exports = router;