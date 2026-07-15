import BaseAPI from "./base";
import { ElMessage } from "element-plus";

class ReviewAPI extends BaseAPI {
  constructor() {
    super("/reviews");
  }

  // 提交评价
  async submit(data) {
    try {
      const res = await this.post("/submit", data);
      if (res.code === 200) {
        ElMessage.success(res.message || "评价提交成功");
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "提交评价失败");
      throw error;
    }
  }

  // 获取商品评价列表
  async getGoodsReviews(goodsId) {
    try {
      const res = await this.get(`/goods/${goodsId}`);
      return res;
    } catch (error) {
      ElMessage.error(error.message || "获取评价列表失败");
      throw error;
    }
  }

  // 获取评价统计
  async getReviewStats(goodsId) {
    try {
      const res = await this.get(`/stats/${goodsId}`);
      return res;
    } catch (error) {
      ElMessage.error(error.message || "获取评价统计失败");
      throw error;
    }
  }

  // 获取所有评价（管理员用）
  async getList(params = {}) {
    try {
      const res = await this.get("/list", params);
      return res;
    } catch (error) {
      ElMessage.error(error.message || "获取评价列表失败");
      throw error;
    }
  }

  // 审核评价
  async audit(id, status) {
    try {
      const res = await this.put(`/audit/${id}`, { status });
      if (res.code === 200) {
        ElMessage.success(res.message);
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "审核评价失败");
      throw error;
    }
  }

  // 删除评价
  async remove(id) {
    try {
      const res = await this.delete(`/${id}`);
      if (res.code === 200) {
        ElMessage.success("评价删除成功");
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "删除评价失败");
      throw error;
    }
  }
}

export default new ReviewAPI();
