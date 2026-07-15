var express = require('express');
var router = express.Router();
var userDal=require('../db/userdal')

var responseHelper=require('../utils/responseHelper')

/* GET users listing. */
router.get('/login', async function(req, res, next) {
  model={
    username:req.query.username,
    password:req.query.password
  }
  let result=await userDal.login(model)
  if(result){
    // 返回用户信息时包含 avatar
    const userData = result.toJSON ? result.toJSON() : result;
    responseHelper.success(res,userData,"登录成功")
  }
  else{
    responseHelper.error(res,"用户名或密码错误")
  }
});

/* POST user registration. */
router.post('/register', async function(req, res, next) {
  model={
    username:req.body.username,
    password:req.body.password,
    phone:req.body.phone,
    email:req.body.email
  }
  let result=await userDal.addUser(model)
  if(result){
    responseHelper.success(res,result,"注册成功")
  }
  else{
    responseHelper.error(res,"注册失败")
  }
});

/* POST change password. */
router.post('/change-password', async function(req, res, next) {
  const { username, oldPassword, newPassword } = req.body;
  
  if (!username || !oldPassword || !newPassword) {
    return responseHelper.error(res, "参数不完整");
  }
  
  if (oldPassword === newPassword) {
    return responseHelper.error(res, "新密码不能与旧密码相同");
  }
  
  let result = await userDal.changePassword({ username, oldPassword, newPassword });
  
  if (result && result.success) {
    responseHelper.success(res, null, "密码修改成功");
  } else {
    responseHelper.error(res, "旧密码错误");
  }
});

/* PUT update user profile. */
router.put('/profile', async function(req, res, next) {
  // ========== 修改这里：添加 avatar 参数 ==========
  const { oldUsername, username, email, phone, avatar } = req.body;
  
  if (!oldUsername) {
    return responseHelper.error(res, "旧用户名不能为空");
  }
  
  if (oldUsername === 'admin' && username && username !== 'admin') {
    return responseHelper.error(res, "管理员用户名不能修改");
  }
  
  try {
    const userInfo = await userDal.getUserByUsername(oldUsername);
    if (!userInfo) {
      return responseHelper.error(res, "用户不存在");
    }
    
    const updateData = {
      id: userInfo.id,
      username: username || userInfo.username,
      email: email || userInfo.email,
      phone: phone || userInfo.phone,
      avatar: avatar !== undefined ? avatar : userInfo.avatar  // 新增 avatar
    };
    
    let result = await userDal.updateUser(updateData);
    
    if (result[0] > 0) {
      const updatedUser = await userDal.getUserById(userInfo.id);
      responseHelper.success(res, updatedUser, "个人资料更新成功");
    } else {
      responseHelper.error(res, "更新失败");
    }
  } catch (error) {
    console.error('更新用户资料失败:', error);
    responseHelper.error(res, "更新失败");
  }
});

/* GET user list. */
router.get('/list', async function(req, res, next) {
  try {
    let result = await userDal.getAllUser();
    responseHelper.success(res, result, "获取用户列表成功");
  } catch (error) {
    console.error('获取用户列表失败:', error);
    responseHelper.error(res, "获取用户列表失败");
  }
});

/* DELETE user. */
router.delete('/:id', async function(req, res, next) {
  const { id } = req.params;
  
  try {
    const userInfo = await userDal.getUserById(id);
    if (!userInfo) {
      return responseHelper.error(res, "用户不存在");
    }
    
    if (userInfo.username === 'admin') {
      return responseHelper.error(res, "管理员用户不能删除");
    }
    
    let result = await userDal.deleteUser(id);
    if (result > 0) {
      responseHelper.success(res, null, "删除成功");
    } else {
      responseHelper.error(res, "删除失败");
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    responseHelper.error(res, "删除失败");
  }
});

module.exports = router;