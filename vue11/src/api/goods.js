import BaseAPI from "./base";
import { ElMessage } from "element-plus";

class GoodsAPI extends BaseAPI {
  constructor() {
    super("/goods"); //设置调用的路径
  }

  // 获取商品列表
  async getList() {
    try {
      const res = await this.get("");
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 200, data: [] };
      }
      ElMessage.error(error.message || "获取商品列表失败");
      throw error;
    }
  }

  // 获取商品详情
  async getDetail(id) {
    try {
      const res = await this.get(`/${id}`);
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 200, data: null };
      }
      ElMessage.error(error.message || "获取商品详情失败");
      throw error;
    }
  }

  // 新增商品
  async add(data) {
    try {
      const res = await this.post("", data);
      if (res.code === 200) {
        ElMessage.success("新增商品成功");
      }
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 400, message: '请求已取消' };
      }
      ElMessage.error(error.message || "新增商品失败");
      throw error;
    }
  }

  // 更新商品
  async update(id, data) {
    try {
      const res = await this.put(`/${id}`, data);
      // 移除这里的成功提示，让调用方统一处理，避免重复提示
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 400, message: '请求已取消' };
      }
      ElMessage.error(error.message || "更新商品失败");
      throw error;
    }
  }

  // 删除商品
  async remove(id) {
    try {
      const res = await this.requestWithLoading("delete", `/${id}`);
      if (res.code === 200) {
        ElMessage.success("删除商品成功");
      }
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 400, message: '请求已取消' };
      }
      ElMessage.error(error.message || "删除商品失败");
      throw error;
    }
  }
}

export default new GoodsAPI();