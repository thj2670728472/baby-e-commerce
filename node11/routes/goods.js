var express = require('express');
var router = express.Router();
var goodsDal=require('../db/goodsdal');
var categoryDal=require('../db/categorydal');

var responseHelper=require('../utils/responseHelper');

/* GET goods listing. 支持 status 查询参数过滤上架/下架商品 */
router.get('/', async function(req, res, next) {
  let result=await goodsDal.getAllGoods(req.query.status);
  responseHelper.success(res,result,"获取商品列表成功");
});

/* GET goods by id. */
router.get('/:id', async function(req, res, next) {
  let result=await goodsDal.getGoodsById(req.params.id);
  if(result){
    responseHelper.success(res,result,"获取商品详情成功");
  }
  else{
    responseHelper.error(res,"商品不存在");
  }
});

/* POST add goods. */
router.post('/', async function(req, res, next) {
  try {
    console.log('接收到的请求数据:', req.body);
    
    // 检查分类是否存在，不存在则创建
    const categoryName = req.body.category;
    if (categoryName) {
      console.log('检查分类是否存在:', categoryName);
      // 检查分类是否存在
      const existingCategories = await categoryDal.getAllCategory();
      console.log('现有分类:', existingCategories);
      const categoryExists = existingCategories.some(cat => cat.name === categoryName);
      console.log('分类是否存在:', categoryExists);
      
      if (!categoryExists) {
        // 创建新分类
        console.log('创建新分类:', categoryName);
        const newCategory = {
          name: categoryName,
          sort: existingCategories.length + 1, // 设置排序为最后
          status: true // 默认启用
        };
        const createdCategory = await categoryDal.addCategory(newCategory);
        console.log('创建的新分类:', createdCategory);
      }
    }
    
    model={
      name:req.body.name,
      quantity:req.body.quantity,
      category:req.body.category,
      price:req.body.price,
      status:req.body.status,
      images:req.body.images,
      description:req.body.description
    }
    console.log('准备添加的商品数据:', model);
    let result=await goodsDal.addGoods(model);
    console.log('添加商品的结果:', result);
    if(result){
      responseHelper.success(res,result,"新增商品成功");
    }
    else{
      responseHelper.error(res,"新增商品失败");
    }
  } catch (error) {
    console.error('添加商品时出错:', error);
    responseHelper.error(res,"添加商品时出错: " + error.message);
  }
});

/* PUT update goods. */
router.put('/:id', async function(req, res, next) {
  try {
    // 检查分类是否存在，不存在则创建
    const categoryName = req.body.category;
    if (categoryName) {
      // 检查分类是否存在
      const existingCategories = await categoryDal.getAllCategory();
      const categoryExists = existingCategories.some(cat => cat.name === categoryName);
      
      if (!categoryExists) {
        // 创建新分类
        const newCategory = {
          name: categoryName,
          sort: existingCategories.length + 1, // 设置排序为最后
          status: true // 默认启用
        };
        await categoryDal.addCategory(newCategory);
      }
    }
    
    model={
      id:req.params.id,
      name:req.body.name,
      quantity:req.body.quantity,
      category:req.body.category,
      price:req.body.price,
      status:req.body.status,
      images:req.body.images,
      description:req.body.description
    }
    let result=await goodsDal.updateGoods(model);
    if(result[0] > 0){
      responseHelper.success(res,result,"更新商品成功");
    }
    else{
      responseHelper.error(res,"更新商品失败");
    }
  } catch (error) {
    console.error('更新商品时出错:', error);
    responseHelper.error(res,"更新商品时出错: " + error.message);
  }
});

/* DELETE delete goods. */
router.delete('/:id', async function(req, res, next) {
  let result=await goodsDal.deleteGoods(req.params.id);
  if(result > 0){
    responseHelper.success(res,result,"删除商品成功");
  }
  else{
    responseHelper.error(res,"删除商品失败");
  }
});

module.exports = router;