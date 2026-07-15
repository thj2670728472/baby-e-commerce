<template>
  <div class="review-manage-container">
    <div class="header">
      <h2>评价管理</h2>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="审核状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品ID">
          <el-input v-model="filterForm.goodsId" placeholder="请输入商品ID" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评价列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="reviewList" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="goodsId" label="商品ID" width="100" align="center" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column label="评分" width="150" align="center">
          <template #default="{ row }">
            <el-rate :model-value="row.rating" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <span v-if="getImages(row).length > 0">{{ getImages(row).length }}张</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="180" align="center">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="success" link @click="handleAudit(row, 1)">通过</el-button>
              <el-button type="danger" link @click="handleAudit(row, 2)">拒绝</el-button>
            </template>
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit" :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 查看详情弹窗 -->
    <el-dialog title="评价详情" v-model="detailDialogVisible" width="600px">
      <el-descriptions :column="1" border v-if="currentReview">
        <el-descriptions-item label="评价ID">{{ currentReview.id }}</el-descriptions-item>
        <el-descriptions-item label="商品ID">{{ currentReview.goodsId }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentReview.userName }}</el-descriptions-item>
        <el-descriptions-item label="评分">
          <el-rate :model-value="currentReview.rating" disabled show-score text-color="#ff9900" />
        </el-descriptions-item>
        <el-descriptions-item label="评价内容">{{ currentReview.content || '无' }}</el-descriptions-item>
        <el-descriptions-item label="评价图片">
          <div v-if="getImages(currentReview).length > 0" class="detail-images">
            <el-image 
              v-for="(img, idx) in getImages(currentReview)" 
              :key="idx" 
              :src="img" 
              fit="cover"
              class="detail-image-item"
              :preview-src-list="getImages(currentReview)"
              :initial-index="idx"
            />
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentReview.status)">{{ getStatusText(currentReview.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatTime(currentReview.createTime) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <template v-if="currentReview && currentReview.status === 0">
          <el-button type="success" @click="handleAudit(currentReview, 1)">通过</el-button>
          <el-button type="danger" @click="handleAudit(currentReview, 2)">拒绝</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import reviewAPI from '@/api/review'

export default {
  name: 'ReviewManage',
  setup() {
    const loading = ref(false)
    const reviewList = ref([])
    const detailDialogVisible = ref(false)
    const currentReview = ref(null)

    const filterForm = reactive({ status: '', goodsId: '' })
    const pagination = reactive({ page: 1, limit: 10, total: 0 })

    // ========== 解析图片 ==========
    const getImages = (row) => {
      if (!row || !row.images) return []
      if (Array.isArray(row.images)) return row.images
      if (typeof row.images === 'string') {
        try { const parsed = JSON.parse(row.images); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; }
      }
      return []
    }

    const loadReviews = async () => {
      loading.value = true
      try {
        const params = { page: pagination.page, limit: pagination.limit }
        if (filterForm.status !== '') params.status = filterForm.status
        if (filterForm.goodsId) params.goodsId = filterForm.goodsId

        const res = await reviewAPI.getList(params)
        if (res.code === 200) {
          reviewList.value = res.data.list || []
          pagination.total = res.data.total || 0
        } else {
          ElMessage.error(res.message || '加载评价列表失败')
        }
      } catch (error) {
        ElMessage.error('加载评价列表失败')
      } finally { loading.value = false }
    }

    const handleSearch = () => { pagination.page = 1; loadReviews() }
    const handleReset = () => { filterForm.status = ''; filterForm.goodsId = ''; pagination.page = 1; loadReviews() }
    const handleSizeChange = (val) => { pagination.limit = val; loadReviews() }
    const handleCurrentChange = (val) => { pagination.page = val; loadReviews() }

    const handleAudit = async (row, status) => {
      try {
        await ElMessageBox.confirm(status === 1 ? '确认通过该评价吗？' : '确认拒绝该评价吗？', '提示', {
          confirmButtonText: '确定', cancelButtonText: '取消', type: status === 1 ? 'success' : 'warning'
        })
        const res = await reviewAPI.audit(row.id, status)
        if (res.code === 200) { loadReviews(); if (detailDialogVisible.value) detailDialogVisible.value = false }
      } catch (error) { if (error !== 'cancel') console.error('审核评价失败:', error) }
    }

    const handleView = (row) => { currentReview.value = { ...row }; detailDialogVisible.value = true }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确认删除该评价吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
        const res = await reviewAPI.remove(row.id)
        if (res.code === 200) loadReviews()
      } catch (error) { if (error !== 'cancel') console.error('删除评价失败:', error) }
    }

    const getStatusType = (status) => ({ 0: 'warning', 1: 'success', 2: 'danger' }[status] || 'info')
    const getStatusText = (status) => ({ 0: '待审核', 1: '已通过', 2: '已拒绝' }[status] || '未知')

    const formatTime = (time) => {
      if (!time) return '-'
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    onMounted(() => loadReviews())

    return { loading, reviewList, filterForm, pagination, detailDialogVisible, currentReview, loadReviews, handleSearch, handleReset, handleSizeChange, handleCurrentChange, handleAudit, handleView, handleDelete, getStatusType, getStatusText, formatTime, getImages }
  }
}
</script>

<style scoped>
.review-manage-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h2 { margin: 0; font-size: 24px; color: #303133; }
.filter-card, .table-card { margin-bottom: 20px; border-radius: 8px; }
.filter-form { display: flex; flex-wrap: wrap; align-items: center; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }

.detail-images { display: flex; flex-wrap: wrap; gap: 10px; }
.detail-image-item { width: 100px; height: 100px; border-radius: 8px; }
</style>