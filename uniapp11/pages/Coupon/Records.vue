<template>
  <view class="records-page">
    <view class="page-header">
      <text class="header-back" @click="navigateBack">返回</text>
      <text class="header-title">抽取记录</text>
      <text class="header-placeholder"></text>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-else-if="records.length === 0" class="empty-tip">暂无抽取记录</view>
      <view v-else class="record-list">
        <view class="record-item" v-for="item in records" :key="item.id">
          <view class="record-info">
            <text class="record-name">{{ item.couponName }}</text>
            <text class="record-desc">满{{ item.threshold }}减{{ item.amount }}</text>
          </view>
          <text class="record-time">{{ formatTime(item.createTime) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDrawRecords } from '../../api/index.js'

const records = ref([])
const loading = ref(false)
const currentUser = ref(null)

const formatTime = (time) => {
  const date = new Date(time)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const loadRecords = async () => {
  const user = currentUser.value
  if (!user) return

  loading.value = true
  try {
    const res = await getDrawRecords(user.id)
    if (res.code === 200) records.value = res.data || []
  } catch (error) {} finally { loading.value = false }
}

const navigateBack = () => uni.navigateBack()

onMounted(() => {
  const userStr = uni.getStorageSync('userInfo')
  if (userStr) currentUser.value = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
  loadRecords()
})
</script>

<style scoped>
.records-page { min-height: 100vh; background-color: #f5f5f5; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 30rpx; background-color: #fff; }
.header-back { font-size: 28rpx; color: #333; }
.header-title { font-size: 36rpx; font-weight: bold; }
.header-placeholder { width: 60rpx; }
.content { padding: 20rpx; }
.loading-tip, .empty-tip { text-align: center; padding: 100rpx 0; color: #999; }
.record-item { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 25rpx; border-radius: 16rpx; margin-bottom: 15rpx; }
.record-name { font-size: 30rpx; font-weight: bold; color: #ff6b6b; display: block; margin-bottom: 8rpx; }
.record-desc { font-size: 24rpx; color: #999; }
.record-time { font-size: 24rpx; color: #999; }
</style>