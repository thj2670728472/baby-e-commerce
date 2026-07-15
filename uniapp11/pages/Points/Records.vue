<template>
	<view class="records-page">
		<view class="page-header">
			<text class="header-back" @click="navigateBack">返回</text>
			<text class="header-title">积分记录</text>
			<text class="header-placeholder"></text>
		</view>

		<scroll-view class="content" scroll-y v-if="records.length > 0">
			<view class="record-item" v-for="item in records" :key="item.id">
				<view class="record-left">
					<view class="record-icon" :class="item.type">
						<text>{{ item.type === 'income' ? '+' : '-' }}</text>
					</view>
					<view class="record-info">
						<text class="record-source">{{ item.source }}</text>
						<text class="record-time">{{ formatTime(item.createTime) }}</text>
						<text class="record-desc" v-if="item.description">{{ item.description }}</text>
					</view>
				</view>
				<text class="record-points" :class="item.type">
					{{ item.type === 'income' ? '+' : '' }}{{ item.points }}
				</text>
			</view>
		</scroll-view>

		<view v-else class="empty-container">
			<text class="empty-text">暂无积分记录</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPointsRecords } from '../../api/index.js'

const records = ref([])

const getCurrentUser = () => {
	try {
		const userStr = uni.getStorageSync('userInfo')
		if (!userStr) return null
		return typeof userStr === 'string' ? JSON.parse(userStr) : userStr
	} catch (e) { return null }
}

const formatTime = (time) => {
	if (!time) return ''
	return time.split('T')[0] + ' ' + (time.split('T')[1]?.split('.')[0] || '')
}

const loadData = async () => {
	const user = getCurrentUser()
	if (!user) return
	try {
		const res = await getPointsRecords(user.id)
		if (res.code === 200) records.value = res.data || []
	} catch (error) {}
}

const navigateBack = () => uni.navigateBack()
onMounted(() => loadData())
</script>

<style scoped>
.records-page { min-height: 100vh; background-color: #f5f5f5; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 30rpx; background-color: #fff; }
.header-back { font-size: 28rpx; color: #333; }
.header-title { font-size: 36rpx; font-weight: bold; }
.header-placeholder { width: 100rpx; }
.content { padding: 20rpx; }
.record-item { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 25rpx; border-radius: 16rpx; margin-bottom: 12rpx; }
.record-left { display: flex; align-items: center; gap: 15rpx; }
.record-icon { width: 50rpx; height: 50rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: bold; color: #fff; flex-shrink: 0; }
.record-icon.income { background-color: #ff6b6b; }
.record-icon.expense { background-color: #4caf50; }
.record-source { font-size: 28rpx; color: #333; display: block; }
.record-time { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.record-desc { font-size: 22rpx; color: #ccc; margin-top: 4rpx; display: block; }
.record-points { font-size: 32rpx; font-weight: bold; }
.record-points.income { color: #ff6b6b; }
.record-points.expense { color: #4caf50; }
.empty-container { display: flex; justify-content: center; padding: 150rpx 0; }
.empty-text { font-size: 28rpx; color: #999; }
</style>