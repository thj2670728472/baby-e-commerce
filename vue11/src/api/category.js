import BaseAPI from "./base";
import { ElMessage } from "element-plus";

class CategoryAPI extends BaseAPI {
  constructor() {
    super("/category"); //设置调用的路径
  }

  // 获取分类列表
  async getList() {
    try {
      const res = await this.get("");
      return res;
    } catch (error) {
      // 如果是取消请求，不显示错误消息
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 200, data: [] };
      }
      ElMessage.error(error.message || "获取分类列表失败");
      throw error;
    }
  }

  // 获取启用的分类列表
  async getEnabledList() {
    try {
      const res = await this.get("/enabled");
      return res;
    } catch (error) {
      // 如果是取消请求，不显示错误消息
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 200, data: [] };
      }
      ElMessage.error(error.message || "获取启用分类列表失败");
      throw error;
    }
  }

  // 根据名称获取分类
  async getByName(name) {
    try {
      const res = await this.get(`/name/${name}`);
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 200, data: null };
      }
      ElMessage.error(error.message || "获取分类详情失败");
      throw error;
    }
  }

  // 获取分类详情
  async getDetail(id) {
    try {
      const res = await this.get(`/${id}`);
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 200, data: null };
      }
      ElMessage.error(error.message || "获取分类详情失败");
      throw error;
    }
  }

  // 新增分类
  async add(data) {
    try {
      const res = await this.post("", data);
      if (res.code === 200) {
        ElMessage.success("新增分类成功");
      }
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 400, message: '请求已取消' };
      }
      ElMessage.error(error.message || "新增分类失败");
      throw error;
    }
  }

  // 更新分类
  async update(id, data) {
    try {
      const res = await this.put(`/${id}`, data);
      if (res.code === 200) {
        ElMessage.success("更新分类成功");
      }
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 400, message: '请求已取消' };
      }
      ElMessage.error(error.message || "更新分类失败");
      throw error;
    }
  }

  // 删除分类
  async remove(id) {
    try {
      const res = await this.requestWithLoading("delete", `/${id}`);
      if (res.code === 200) {
        ElMessage.success("删除分类成功");
      }
      return res;
    } catch (error) {
      if (error._isCanceled) {
        console.log('请求已取消:', error.message);
        return { code: 400, message: '请求已取消' };
      }
      ElMessage.error(error.message || "删除分类失败");
      throw error;
    }
  }
}

export default new CategoryAPI();