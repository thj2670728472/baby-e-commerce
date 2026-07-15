import BaseAPI from "./base";
import { ElMessage } from "element-plus";

class UploadAPI extends BaseAPI {
  constructor() {
    super("/upload"); //设置调用的路径
  }

  // 上传图片
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await this.post('/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.code === 200) {
        ElMessage.success('图片上传成功');
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "图片上传失败");
      throw error;
    }
  }

  // 批量上传图片
  async uploadImages(files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const res = await this.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.code === 200) {
        ElMessage.success('图片上传成功');
      }
      return res;
    } catch (error) {
      ElMessage.error(error.message || "图片上传失败");
      throw error;
    }
  }
}

export default new UploadAPI();