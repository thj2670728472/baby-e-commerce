<template>
  <view class="logistics-page">
    <view class="page-header">
      <text class="header-back" @click="navigateBack">返回</text>
      <text class="header-title">物流详情</text>
      <text class="header-placeholder"></text>
    </view>

    <scroll-view class="content" scroll-y v-if="logisticsInfo">
      <!-- 物流公司和单号 -->
      <view class="company-card">
        <view class="company-info">
          <text class="company-label">物流公司</text>
          <text class="company-value">{{ logisticsInfo.company }}</text>
        </view>
        <view class="company-info">
          <text class="company-label">快递单号</text>
          <view class="no-row">
            <text class="company-value">{{ logisticsInfo.no }}</text>
            <text class="copy-btn" @click="copyNo">复制</text>
          </view>
        </view>
      </view>

      <!-- 物流轨迹 -->
      <view class="trace-section">
        <text class="trace-title">物流轨迹</text>
        <view class="trace-list">
          <view 
            class="trace-item" 
            v-for="(item, index) in logisticsInfo.traces" 
            :key="index"
            :class="{ first: index === 0 }"
          >
            <view class="trace-left">
              <view class="trace-dot" :class="{ active: index === 0 }"></view>
              <view class="trace-line" v-if="index < logisticsInfo.traces.length - 1"></view>
            </view>
            <view class="trace-right">
              <text class="trace-desc" :class="{ active: index === 0 }">{{ item.desc }}</text>
              <text class="trace-time">{{ item.time }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="loading-container" v-else>
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLogisticsInfo } from '../../api/index.js'

const logisticsInfo = ref(null)
const orderId = ref('')

const loadLogistics = async () => {
  try {
    const res = await getLogisticsInfo(orderId.value)
    if (res.code === 200) {
      logisticsInfo.value = res.data
    } else {
      uni.showToast({ title: res.message || '暂无物流信息', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const copyNo = () => {
  uni.setClipboardData({ data: logisticsInfo.value.no })
  uni.showToast({ title: '已复制', icon: 'success' })
}

const navigateBack = () => uni.navigateBack()

onLoad((options) => {
  orderId.value = options.orderId
  loadLogistics()
})
</script>

<style scoped>
.logistics-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-back { font-size: 28rpx; color: #333; }
.header-title { font-size: 36rpx; font-weight: bold; color: #333; }
.header-placeholder { width: 100rpx; }

.content { padding: 20rpx; }

.company-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.company-info {
  display: flex;
  align-items: center;
  padding: 15rpx 0;
}

.company-info:first-child {
  border-bottom: 1rpx solid #f0f0f0;
}

.company-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #999;
}

.company-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.no-row {
  flex: 1;
  display: flex;
  align-items: center;
}

.copy-btn {
  font-size: 24rpx;
  color: #409eff;
  margin-left: 20rpx;
  padding: 5rpx 15rpx;
  border: 1rpx solid #409eff;
  border-radius: 20rpx;
}

.trace-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.trace-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.trace-list {
  padding-left: 10rpx;
}

.trace-item {
  display: flex;
  gap: 20rpx;
  padding-bottom: 30rpx;
}

.trace-item:last-child {
  padding-bottom: 0;
}

.trace-left {
  width: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.trace-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #ddd;
  margin-top: 6rpx;
}

.trace-dot.active {
  background-color: #ff6b6b;
  width: 20rpx;
  height: 20rpx;
}

.trace-line {
  flex: 1;
  width: 2rpx;
  background-color: #eee;
  min-height: 40rpx;
}

.trace-right {
  flex: 1;
  padding-bottom: 10rpx;
}

.trace-desc {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.trace-desc.active {
  color: #ff6b6b;
  font-weight: bold;
}

.trace-time {
  font-size: 24rpx;
  color: #999;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 150rpx 0;
  color: #999;
}
</style>