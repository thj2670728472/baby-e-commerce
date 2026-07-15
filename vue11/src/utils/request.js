import axios from "axios";
//import router from '@/router'

// 自定义提示函数（可根据需要替换为其他UI库或原生alert）
const showMessage = (message, type = "error") => {
  // 使用浏览器原生提示（可替换为其他轻提示组件）
  if (type === "error") {
    console.error(`[错误]: ${message}`);
    // 生产环境可改用更友好的提示方式
    if (import.meta.env.DEV) {
      alert(`错误: ${message}`);
    }
  } else if (type === "success") {
    console.log(`[成功]: ${message}`);
    if (import.meta.env.DEV) {
      alert(`成功: ${message}`);
    }
  } else if (type === "warning") {
    console.warn(`[警告]: ${message}`);
    if (import.meta.env.DEV) {
      alert(`警告: ${message}`);
    }
  }
};

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || "/api",
  timeout: 10000,
  withCredentials: true,
});

// 请求队列（用于管理loading等）
const pendingRequests = new Map();

// 生成请求唯一标识（排除时间戳参数）
const generateRequestKey = (config) => {
  let { method, url, params, data } = config;
  
  // 深拷贝参数，避免修改原对象
  let clonedParams = params ? { ...params } : {};
  let clonedData = data ? { ...data } : {};
  
  // 移除时间戳参数（_t），避免影响请求key的生成
  if (clonedParams && clonedParams._t) {
    delete clonedParams._t;
  }
  
  // 根据请求方法生成key
  let key = `${method}:${url}`;
  
  // 对于GET请求，如果还有其它参数，加入key（但排除_t）
  if (method === 'get' && Object.keys(clonedParams).length > 0) {
    // 对参数进行排序，确保相同的对象生成相同的字符串
    const sortedParams = JSON.stringify(clonedParams, Object.keys(clonedParams).sort());
    key = `${key}:${sortedParams}`;
  }
  
  // 对于POST/PUT等请求，如果有数据，也加入key
  if ((method === 'post' || method === 'put' || method === 'patch') && 
      Object.keys(clonedData).length > 0) {
    const sortedData = JSON.stringify(clonedData, Object.keys(clonedData).sort());
    key = `${key}:${sortedData}`;
  }
  
  return key;
};

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    console.log("完整请求URL:", config.baseURL + config.url);
    
    // 从localStorage获取token
    // const token =
    //   localStorage.getItem("token") || sessionStorage.getItem("token");
    // // 添加token
    // if (token) {
    //   config.headers["Authorization"] = `Bearer ${token}`;
    // }
    
    // 添加时间戳防止缓存（对GET请求）- 只对GET请求添加
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    // 生成请求唯一标识（已排除_t参数）
    const requestKey = generateRequestKey(config);
    
    // 检查是否存在相同请求
    if (pendingRequests.has(requestKey)) {
      // 如果存在相同请求，取消之前的
      const cancel = pendingRequests.get(requestKey);
      cancel("取消重复请求");
      pendingRequests.delete(requestKey);
      console.log(`取消重复请求: ${requestKey}`);
    }
    
    // 添加取消token
    config.cancelToken = new axios.CancelToken((cancel) => {
      pendingRequests.set(requestKey, cancel);
    });
    
    // 将requestKey存储在config中，以便在响应拦截器中使用
    config.requestKey = requestKey;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 请求完成后从队列移除
    if (response.config.requestKey) {
      pendingRequests.delete(response.config.requestKey);
    } else {
      // 兼容旧逻辑（如果没有requestKey）
      const requestKey = generateRequestKey(response.config);
      pendingRequests.delete(requestKey);
    }
    
    const res = response.data;
    
    // 根据后端返回的code进行处理
    // 假设后端返回格式：{ code: 200, data: {}, message: '成功' }
    if (res.code && res.code !== 200) {
      handleBusinessError(res.code, res.message);
      return Promise.reject(new Error(res.message || "请求失败"));
    }
    
    return res;
  },
  (error) => {
    // 请求完成后从队列移除
    if (error.config) {
      if (error.config.requestKey) {
        pendingRequests.delete(error.config.requestKey);
      } else {
        // 兼容旧逻辑（如果没有requestKey）
        const requestKey = generateRequestKey(error.config);
        pendingRequests.delete(requestKey);
      }
    }
    
    // 处理取消请求 - 这里不将取消请求作为错误抛出到业务代码
    if (axios.isCancel(error)) {
      console.log("请求已取消:", error.message);
      // 返回一个特殊标记，而不是reject，这样业务代码就不用处理取消错误
      return Promise.resolve({
        _isCanceled: true,
        message: error.message
      });
    }
    
    // 处理HTTP错误
    handleHttpError(error);
    return Promise.reject(error);
  },
);

// 业务错误处理
function handleBusinessError(code, message) {
  switch (code) {
    case 401:
      //handleUnauthorized()
      showMessage("登录已过期，请重新登录", "warning");
      break;
    case 403:
      showMessage("没有权限访问", "warning");
      break;
    case 404:
      showMessage("请求的资源不存在", "warning");
      break;
    case 500:
      showMessage("服务器内部错误", "error");
      break;
    default:
      showMessage(message || "系统错误", "error");
  }
}

// HTTP错误处理
function handleHttpError(error) {
  const status = error.response?.status;
  const message = error.message;
  
  switch (status) {
    case 400:
      showMessage("请求错误", "error");
      break;
    case 401:
      //handleUnauthorized()
      showMessage("登录已过期", "warning");
      break;
    case 403:
      showMessage("拒绝访问", "warning");
      break;
    case 404:
      showMessage("请求地址不存在", "warning");
      break;
    case 500:
      showMessage("服务器内部错误", "error");
      break;
    case 502:
      showMessage("网关错误", "error");
      break;
    case 504:
      showMessage("网关超时", "error");
      break;
    default:
      if (error.code === "ECONNABORTED") {
        showMessage("请求超时", "warning");
      } else if (!navigator.onLine) {
        showMessage("网络连接已断开", "warning");
      } else {
        showMessage(`网络错误: ${message}`, "error");
      }
  }
}

// 处理未授权
// function handleUnauthorized() {
//   // 清除用户信息
//   localStorage.removeItem('token')
//   sessionStorage.removeItem('token')
//   localStorage.removeItem('userInfo')
//   sessionStorage.removeItem('userInfo')
//   // 跳转到登录页
//   const currentRoute = router.currentRoute.value
//   if (currentRoute.path !== '/login') {
//     router.push({
//       path: '/login',
//       query: { redirect: currentRoute.fullPath }
//     })
//   }
// }

export default service;