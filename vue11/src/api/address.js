import BaseAPI from "./base";
import { ElMessage } from "element-plus";

class AddressAPI extends BaseAPI {
  constructor() {
    super("/address"); //设置调用的路径
  }

  // 获取地址列表
  async getList(userId) {
    try {
      const res = await this.get(`/list/${userId}`);
      return res;
    } catch (error) {
      ElMessage.error(error.message || "获取地址列表失败");
      throw error;
    }
  }

  // 获取默认地址
  async getDefault(userId) {
    try {
      const res = await this.get(`/default/${userId}`);
      return res;
    } catch (error) {
      ElMessage.error(error.message || "获取默认地址失败");
      throw error;
    }
  }

  // 新增地址
  async add(data) {
    try {
      const res = await this.post("", data);
      if (res.code === 200) {
        ElMessage.success("新增地址成功");
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "新增地址失败");
      throw error;
    }
  }

  // 更新地址
  async update(id, data) {
    try {
      const res = await this.put(`/${id}`, data);
      if (res.code === 200) {
        ElMessage.success("更新地址成功");
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "更新地址失败");
      throw error;
    }
  }

  // 删除地址
  async remove(id) {
    try {
      const res = await this.delete(`/${id}`);
      if (res.code === 200) {
        ElMessage.success("删除地址成功");
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "删除地址失败");
      throw error;
    }
  }
}

export default new AddressAPI();