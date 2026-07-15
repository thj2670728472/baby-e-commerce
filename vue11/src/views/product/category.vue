<template>
  <div class="category-container">
    <div class="header">
      <h2>商品分类</h2>
      <el-button type="primary" @click="handleAdd">新增分类</el-button>
    </div>

    <!-- 分类列表表格 -->
    <el-card class="table-card" shadow="never">
      <el-table 
        v-loading="loading" 
        :data="categoryList" 
        border 
        stripe 
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="sort" label="排序" width="100" align="center" />
        <el-table-column label="商品种类数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ getGoodsCount(row.name) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              type="danger" 
              link 
              @click="handleDelete(row)"
              :disabled="getGoodsCount(row.name) > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      @closed="handleDialogClosed"
    >
      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number 
            v-model="formData.sort" 
            :min="0" 
            :max="999" 
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import categoryAPI from '@/api/category'
import goodsAPI from '@/api/goods'

// 数据列表
const categoryList = ref([])
const loading = ref(false)
const goodsList = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const submitLoading = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: '',
  name: '',
  sort: 0,
  status: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
    {
      validator: async (rule, value, callback) => {
        if (!value) {
          return callback();
        }
        // 检查分类名称是否重复
        const existingCategory = categoryList.value.find(item => item.name === value && item.id !== formData.id);
        if (existingCategory) {
          callback(new Error('分类名称已存在'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
    { type: 'number', min: 0, max: 999, message: '排序必须在0-999之间', trigger: 'blur' }
  ]
}

// 获取分类下的商品数量
const getGoodsCount = (categoryName) => {
  return goodsList.value.filter(item => item.category === categoryName).length
}

// 加载分类列表
const loadCategories = async () => {
  loading.value = true
  try {
    const res = await categoryAPI.getList()
    if (res.code === 200) {
      // 对分类列表按sort字段升序排序
      categoryList.value = (res.data || []).sort((a, b) => a.sort - b.sort)
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

// 加载商品列表（用于统计商品数量）
const loadGoods = async () => {
  try {
    const res = await goodsAPI.getList()
    if (res.code === 200) {
      goodsList.value = res.data || []
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
  }
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增分类'
  formData.id = ''
  formData.name = ''
  // 后端会自动计算排序值，设置为0作为默认值
  formData.sort = 0
  formData.status = true
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑分类'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  const count = getGoodsCount(row.name)
  if (count > 0) {
    ElMessage.warning('该分类下还有商品，无法删除')
    return
  }
  
  ElMessageBox.confirm(`确认删除分类"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await categoryAPI.remove(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadCategories()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let res
        if (formData.id) {
          res = await categoryAPI.update(formData.id, formData)
        } else {
          res = await categoryAPI.add(formData)
        }
        
        if (res.code === 200) {
          ElMessage.success(formData.id ? '更新成功' : '新增成功')
          dialogVisible.value = false
          loadCategories()
        }
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 弹窗关闭后的回调
const handleDialogClosed = () => {
  formRef.value?.resetFields()
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('CategoryList mounted')
  loadCategories()
  loadGoods()
})

// 当组件被激活时（如果使用了keep-alive）
onActivated(() => {
  console.log('CategoryList activated')
  loadCategories()
  loadGoods()
})
</script>

<style scoped>
.category-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.table-card {
  border-radius: 8px;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>