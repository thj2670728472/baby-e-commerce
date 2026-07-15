import request from "@/utils/request";
class BaseAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  buildUrl(url) {
    return url.startsWith("http") ? url : `${this.baseUrl}${url}`;
  }
  // GET请求
  get(url, params = {}, config = {}) {
    return request({
      method: "get",
      url: this.buildUrl(url),
      params,
      ...config,
    });
  }
  // POST请求
  post(url, data = {}, config = {}) {   
    return request({
      method: "post",
      url: this.buildUrl(url),
      data,
      ...config,
    });
  }
  // PUT请求
  put(url, data = {}, config = {}) {
    return request({
      method: "put",
      url: this.buildUrl(url),
      data,
      ...config,
    });
  }
  // DELETE请求
  delete(url, params = {}, config = {}) {
    return request({
      method: "delete",
      url: this.buildUrl(url),
      params,
      ...config,
    });
  }
  // PATCH请求
  patch(url, data = {}, config = {}) {
    return request({
      method: "patch",
      url: this.buildUrl(url),
      data,
      ...config,
    });
  }
  // 带loading的请求
  requestWithLoading(method, url, data = {}, loadingMessage = "加载中...") {
    // 可以在这里触发全局loading状态
    return request({
      method,
      url: this.buildUrl(url),
      //样例：如何使用base.js 来调用 node后台，以user为例
      ...(method === "get" ? { params: data } : { data }),
    });
  }
}
export default BaseAPI;

