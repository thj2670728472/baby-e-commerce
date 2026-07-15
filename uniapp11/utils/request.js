// utils/request.js
const BASE_URL = 'http://localhost:3000'; // Node.js 接口地址

// 构建 URL（处理 GET 请求的参数）
const buildUrl = (url, params) => {
  if (!params || Object.keys(params).length === 0) {
    return BASE_URL + url;
  }
  
  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  if (!queryString) {
    return BASE_URL + url;
  }
  
  return BASE_URL + url + (url.includes('?') ? '&' : '?') + queryString;
};

// 请求拦截器
const request = (options) => {
  const token = uni.getStorageSync('token');
  
  let header = {
    'Content-Type': 'application/json',
    ...options.header
  };
  
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }
  
  const method = options.method || 'GET';
  
  let fullUrl = BASE_URL + options.url;
  let requestData = null;
  
  if (method === 'GET') {
    const params = options.params || options.data || {};
    fullUrl = buildUrl(options.url, params);
  } else {
    fullUrl = BASE_URL + options.url;
    requestData = options.data || {};
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method: method,
      data: requestData,
      header: header,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('userInfo');
          uni.removeStorageSync('token');
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/Index/Index' });
          }, 1500);
          reject(res);
        } else if (res.statusCode === 404) {
          uni.showToast({ title: '接口不存在', icon: 'none' });
          reject(res);
        } else if (res.statusCode === 500) {
          const errorMsg = (res.data && res.data.message) || '服务器错误';
          uni.showToast({ title: errorMsg, icon: 'none' });
          reject(res);
        } else {
          const errorMsg = (res.data && res.data.message) || '请求失败';
          uni.showToast({ title: errorMsg, icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        
        let errorMsg = '网络错误';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请重试';
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '网络连接失败，请检查后端服务是否启动';
          }
        }
        
        reject(err);
      }
    });
  });
};

export default request;