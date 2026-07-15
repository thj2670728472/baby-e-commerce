var express = require('express');
var router = express.Router();
var addressDal = require('../db/addressdal');
var responseHelper = require('../utils/responseHelper');

/* GET address listing by user id. */
router.get('/list/:userId', async function(req, res, next) {
  try {
    const userId = req.params.userId;
    let result = await addressDal.getAddressByUserId(userId);
    responseHelper.success(res, result, "获取地址列表成功");
  } catch (error) {
    console.error('获取地址列表失败:', error);
    responseHelper.error(res, "获取地址列表失败");
  }
});

/* GET default address by user id. */
router.get('/default/:userId', async function(req, res, next) {
  try {
    const userId = req.params.userId;
    let result = await addressDal.getDefaultAddressByUserId(userId);
    responseHelper.success(res, result, "获取默认地址成功");
  } catch (error) {
    console.error('获取默认地址失败:', error);
    responseHelper.error(res, "获取默认地址失败");
  }
});

/* GET address by id. */
router.get('/:id', async function(req, res, next) {
  try {
    const id = req.params.id;
    let result = await addressDal.getAddressById(id);
    if (result) {
      responseHelper.success(res, result, "获取地址详情成功");
    } else {
      responseHelper.error(res, "地址不存在");
    }
  } catch (error) {
    console.error('获取地址详情失败:', error);
    responseHelper.error(res, "获取地址详情失败");
  }
});

/* POST add address. */
router.post('/', async function(req, res, next) {
  try {
    const model = req.body;
    let result = await addressDal.addAddress(model);
    responseHelper.success(res, result, "新增地址成功");
  } catch (error) {
    console.error('新增地址失败:', error);
    responseHelper.error(res, "新增地址失败");
  }
});

/* PUT update address. */
router.put('/:id', async function(req, res, next) {
  try {
    const model = req.body;
    model.id = req.params.id;
    let result = await addressDal.updateAddress(model);
    if (result[0] > 0) {
      responseHelper.success(res, result, "更新地址成功");
    } else {
      responseHelper.error(res, "更新地址失败");
    }
  } catch (error) {
    console.error('更新地址失败:', error);
    responseHelper.error(res, "更新地址失败");
  }
});

/* DELETE delete address. */
router.delete('/:id', async function(req, res, next) {
  try {
    const id = req.params.id;
    let result = await addressDal.deleteAddress(id);
    if (result > 0) {
      responseHelper.success(res, result, "删除地址成功");
    } else {
      responseHelper.error(res, "删除地址失败");
    }
  } catch (error) {
    console.error('删除地址失败:', error);
    responseHelper.error(res, "删除地址失败");
  }
});

module.exports = router;