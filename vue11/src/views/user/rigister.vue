<template>
  <div class="register-container">
    <div class="register-form">
      <h2>用户注册</h2>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
        status-icon
      >
        <el-form-item label="账号" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入账号" 
            prefix-icon="User" 
            clearable
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock" 
            show-password 
            clearable
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码" 
            prefix-icon="Lock" 
            show-password 
            clearable
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="registerForm.phone" 
            placeholder="请输入手机号" 
            prefix-icon="Phone" 
            clearable
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="请输入邮箱" 
            prefix-icon="Message" 
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="btn" 
            @click="handleRegister" 
            :loading="loading"
          >
            注册
          </el-button>
          <el-button class="btn" @click="goToLogin">
            去登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 注册协议 -->
      <div class="agreement">
        注册即表示同意
        <el-link type="primary" :underline="false">《用户协议》</el-link>
        和
        <el-link type="primary" :underline="false">《隐私政策》</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import UserAPI from '@/api/user'

// 路由实例
const router = useRouter()
// 加载状态
const loading = ref(false)
// 表单实例
const registerFormRef = ref()

// 注册表单数据
const registerForm = reactive({
  username: '',    // 账号
  password: '',    // 密码
  confirmPassword: '', // 确认密码
  phone: '',       // 手机号
  email: ''        // 邮箱
})

// 确认密码校验规则
const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单校验规则
const registerRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请输入确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' }
  ]
}

// 注册提交方法
const handleRegister = async () => {
  try {
    // 先校验表单
    await registerFormRef.value.validate()
    
    // 确认注册
    await ElMessageBox.confirm('确认提交注册信息？', '注册确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    loading.value = true
    
    // 调用注册接口
    const res = await UserAPI.register({
      username: registerForm.username.trim(),
      password: registerForm.password,
      phone: registerForm.phone.trim(),
      email: registerForm.email.trim()
    })
    
    // 处理响应
    if (res.code === 200) {
      ElMessage.success('注册成功！即将跳转到登录页')
      // 清空表单
      registerFormRef.value.resetFields()
      // 延迟跳转
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      ElMessage.error(res.message || '注册失败，请重试')
    }
  } catch (err) {
    // 用户取消确认框时不显示错误
    if (err !== 'cancel') {
      console.error('注册失败：', err)
      if (err.response) {
        ElMessage.error(err.response.data?.message || '服务器错误')
      } else if (err.message) {
        ElMessage.error(err.message)
      } else {
        ElMessage.error('注册失败，请稍后重试')
      }
    }
  } finally {
    loading.value = false
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
  font-weight: 500;
  background: linear-gradient(90deg, #409eff, #7e57c2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn {
  width: 100%;
  margin-top: 10px;
  height: 40px;
  font-size: 16px;
}

.el-button--primary {
  background: linear-gradient(90deg, #409eff, #7e57c2);
  border: none;
  transition: all 0.3s ease;
}

.el-button--primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.3);
}

.el-button--primary:active {
  transform: translateY(0);
}

.agreement {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.agreement .el-link {
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #555;
}
</style>