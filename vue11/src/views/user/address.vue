<template>
  <div class="address-container">
    <el-card shadow="never" class="address-card">
      <template #header>
        <div class="card-header">
          <span>地址管理</span>
          <el-button type="primary" @click="handleAdd">新增地址</el-button>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="addressList.length === 0" class="empty-container">
        <el-empty description="暂无地址" />
        <el-button type="primary" @click="handleAdd" style="margin-top: 20px">新增地址</el-button>
      </div>
      
      <div v-else class="address-list">
        <el-card 
          v-for="address in addressList" 
          :key="address.id" 
          class="address-item"
          :class="{ 'default-address': address.isDefault }"
        >
          <template #header>
            <div class="address-header">
              <div class="address-info">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
                <el-tag v-if="address.isDefault" type="success" size="small">默认</el-tag>
              </div>
              <div class="address-actions">
                <el-button type="primary" link @click="handleEdit(address)">编辑</el-button>
                <el-button type="danger" link @click="handleDelete(address)">删除</el-button>
              </div>
            </div>
          </template>
          <div class="address-detail">
            {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
          </div>
        </el-card>
      </div>
    </el-card>
    
    <!-- 新增/编辑地址弹窗 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="收货人" prop="name">
          <el-input v-model="formData.name" placeholder="请输入收货人姓名" />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="省份" prop="province">
          <el-input v-model="formData.province" placeholder="请输入省份" />
        </el-form-item>
        
        <el-form-item label="城市" prop="city">
          <el-input v-model="formData.city" placeholder="请输入城市" />
        </el-form-item>
        
        <el-form-item label="区县" prop="district">
          <el-input v-model="formData.district" placeholder="请输入区县" />
        </el-form-item>
        
        <el-form-item label="详细地址" prop="detail">
          <el-input 
            v-model="formData.detail" 
            type="textarea" 
            placeholder="请输入详细地址" 
            rows="3"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="formData.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import addressAPI from '@/api/address'

const addressList = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增地址')
const formRef = ref(null)
const formData = ref({
  id: '',
  userId: '',
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请输入省份', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'blur' }
  ],
  district: [
    { required: true, message: '请输入区县', trigger: 'blur' }
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 获取当前用户ID
const currentUserId = computed(() => {
  const userStr = sessionStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return user.id
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }
  return null
})

// 加载地址列表
const loadAddressList = async () => {
  const userId = currentUserId.value
  if (!userId) {
    ElMessage.error('用户未登录')
    return
  }
  
  loading.value = true
  try {
    const res = await addressAPI.getList(userId)
    if (res.code === 200) {
      addressList.value = res.data || []
    }
  } catch (error) {
    console.error('加载地址列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新增地址
const handleAdd = () => {
  dialogTitle.value = '新增地址'
  formData.value = {
    id: '',
    userId: currentUserId.value,
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  }
  dialogVisible.value = true
}

// 编辑地址
const handleEdit = (address) => {
  dialogTitle.value = '编辑地址'
  formData.value = {
    id: address.id,
    userId: address.userId,
    name: address.name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    isDefault: address.isDefault
  }
  dialogVisible.value = true
}

// 删除地址
const handleDelete = (address) => {
  ElMessageBox.confirm(`确定删除地址 ${address.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await addressAPI.remove(address.id)
      if (res.code === 200) {
        loadAddressList()
      }
    } catch (error) {
      console.error('删除地址失败:', error)
    }
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    let res
    if (formData.value.id) {
      res = await addressAPI.update(formData.value.id, formData.value)
    } else {
      res = await addressAPI.add(formData.value)
    }
    
    if (res.code === 200) {
      dialogVisible.value = false
      loadAddressList()
    }
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 组件挂载时加载地址列表
onMounted(() => {
  loadAddressList()
})
</script>

<style scoped>
.address-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.address-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  padding: 20px;
}

.empty-container {
  text-align: center;
  padding: 40px 0;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.address-item {
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.address-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.default-address {
  border-color: #409eff;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.name {
  font-weight: 500;
  font-size: 16px;
}

.phone {
  color: #606266;
}

.address-detail {
  margin-top: 8px;
  color: #606266;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>