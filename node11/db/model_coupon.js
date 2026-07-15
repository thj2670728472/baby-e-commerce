module.exports = function(sequelize, DataTypes) {
  // 优惠券模板
  const CouponTemplate = sequelize.define('CouponTemplate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.TINYINT, defaultValue: 1 },
    threshold: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    probability: { type: DataTypes.DECIMAL(3,2), allowNull: false },
    totalCount: { type: DataTypes.INTEGER, defaultValue: -1 },
    usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    createTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'tb_coupon_template', timestamps: false });

  // 用户优惠券
  const UserCoupon = sequelize.define('UserCoupon', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    templateId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    threshold: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    usedTime: { type: DataTypes.DATE },
    orderId: { type: DataTypes.INTEGER },
    createTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expireTime: { type: DataTypes.DATE }
  }, { tableName: 'tb_user_coupon', timestamps: false });

  // 抽取记录
  const CouponDrawRecord = sequelize.define('CouponDrawRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    templateId: { type: DataTypes.INTEGER, allowNull: false },
    couponName: { type: DataTypes.STRING(100), allowNull: false },
    threshold: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    createTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'tb_coupon_draw_record', timestamps: false });

  return { CouponTemplate, UserCoupon, CouponDrawRecord };
};