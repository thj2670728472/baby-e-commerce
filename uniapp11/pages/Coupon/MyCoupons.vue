<template>
  <view class="my-coupons-page">
    <view class="page-header">
      <text class="header-back" @click="navigateBack">返回</text>
      <text class="header-title">我的优惠券</text>
      <text class="header-placeholder"></text>
    </view>

    <!-- 状态切换 -->
    <view class="status-tabs">
      <view class="tab-item" :class="{ active: currentStatus === 1 }" @click="currentStatus = 1">未使用</view>
      <view class="tab-item" :class="{ active: currentStatus === 2 }" @click="currentStatus = 2">已使用</view>
      <view class="tab-item" :class="{ active: currentStatus === 3 }" @click="currentStatus = 3">已过期</view>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="loading" class="loading-tip">加载中...</view>
      <view v-else-if="filteredCoupons.length === 0" class="empty-tip">
        <text>暂无优惠券</text>
        <button class="go-draw-btn" @click="goToDraw">去抽取</button>
      </view>
      <view v-else class="coupon-list">
        <view class="coupon-item" v-for="item in filteredCoupons" :key="item.id" :class="{ used: item.status !== 1 }">
          <view class="coupon-left">
            <text class="coupon-amount">￥{{ item.amount }}</text>
            <text class="coupon-threshold">满{{ item.threshold }}可用</text>
          </view>
          <view class="coupon-right">
            <text class="coupon-name">{{ item.name }}</text>
            <text class="coupon-expire">有效期至 {{ formatDate(item.expireTime) }}</text>
          </view>
          <view class="coupon-status" v-if="item.status === 2">
            <text>已使用</text>
          </view>
          <view class="coupon-status expired" v-if="item.status === 3">
            <text>已过期</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserCoupons } from '../../api/index.js'

const coupons = ref([])
const loading = ref(false)
const currentStatus = ref(1)
const currentUser = ref(null)

const filteredCoupons = computed(() => {
  return coupons.value.filter(c => c.status === currentStatus.value)
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`
}

const loadCoupons = async () => {
  const user = currentUser.value
  if (!user) return

  loading.value = true
  try {
    const res = await getUserCoupons(user.id)
    if (res.code === 200) coupons.value = res.data || []
  } catch (error) {} finally { loading.value = false }
}

const goToDraw = () => {
  uni.navigateTo({ url: '/pages/Coupon/Coupon' })
}

const navigateBack = () => uni.navigateBack()

onMounted(() => {
  const userStr = uni.getStorageSync('userInfo')
  if (userStr) currentUser.value = typeof userStr === 'string' ? JSON.parse(userStr) : userStr
  loadCoupons()
})
</script>

<style scoped>
.my-coupons-page { min-height: 100vh; background-color: #f5f5f5; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 30rpx; background-color: #fff; }
.header-back { font-size: 28rpx; color: #333; }
.header-title { font-size: 36rpx; font-weight: bold; }
.header-placeholder { width: 60rpx; }
.status-tabs { display: flex; background-color: #fff; padding: 0 20rpx 20rpx; }
.tab-item { flex: 1; text-align: center; padding: 20rpx 0; font-size: 28rpx; color: #666; }
.tab-item.active { color: #ff6b6b; font-weight: bold; border-bottom: 4rpx solid #ff6b6b; }
.content { padding: 20rpx; }
.loading-tip, .empty-tip { text-align: center; padding: 100rpx 0; color: #999; }
.go-draw-btn { width: 200rpx; height: 70rpx; background-color: #ff6b6b; color: #fff; border-radius: 35rpx; margin-top: 30rpx; border: none; }
.coupon-item { display: flex; background: linear-gradient(90deg, #ff6b6b, #ff8e8e); border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; position: relative; }
.coupon-item.used { opacity: 0.6; }
.coupon-left { width: 160rpx; text-align: center; border-right: 2rpx dashed rgba(255,255,255,0.5); }
.coupon-amount { font-size: 48rpx; color: #fff; font-weight: bold; display: block; }
.coupon-threshold { font-size: 22rpx; color: #fff; margin-top: 8rpx; }
.coupon-right { flex: 1; padding-left: 30rpx; display: flex; flex-direction: column; justify-content: center; }
.coupon-name { font-size: 32rpx; color: #fff; font-weight: bold; margin-bottom: 10rpx; }
.coupon-expire { font-size: 22rpx; color: rgba(255,255,255,0.8); }
.coupon-status { position: absolute; right: 20rpx; bottom: 20rpx; background-color: rgba(0,0,0,0.3); padding: 6rpx 16rpx; border-radius: 20rpx; }
.coupon-status text { font-size: 22rpx; color: #fff; }
</style>