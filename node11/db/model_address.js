function model_address(db, SEQ) {
  const address = db.define('address', {
    userId: {
      type: SEQ.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    name: {
      type: SEQ.STRING,
      allowNull: false,
      comment: '收货人姓名'
    },
    phone: {
      type: SEQ.STRING,
      allowNull: false,
      comment: '联系电话'
    },
    province: {
      type: SEQ.STRING,
      allowNull: false,
      comment: '省份'
    },
    city: {
      type: SEQ.STRING,
      allowNull: false,
      comment: '城市'
    },
    district: {
      type: SEQ.STRING,
      allowNull: false,
      comment: '区县'
    },
    detail: {
      type: SEQ.TEXT,
      allowNull: false,
      comment: '详细地址'
    },
    isDefault: {
      type: SEQ.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否默认地址'
    }
  }, {
    tableName: 'tb_address',
    freezeTableName: true
  });
  return address;
}
module.exports = model_address;