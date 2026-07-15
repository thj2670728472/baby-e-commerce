import request from '../utils/request.js';

// 获取用户信息
export const getUserInfo = () => {
  // 从本地存储中获取用户信息
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo) {
    return Promise.resolve({ code: 200, data: userInfo });
  }
  
  // 如果本地存储中没有用户信息，返回一个默认的用户对象
  return Promise.resolve({ code: 200, data: {
    username: '',
    phone: '',
    avatar: ''
  }});
};