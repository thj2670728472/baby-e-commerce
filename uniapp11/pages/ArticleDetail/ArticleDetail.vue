<template>
	<view class="article-detail-page">
		<!-- 顶部导航栏 -->
		<view class="article-header">
			<text class="header-back" @click="navigateBack">返回</text>
			<text class="header-title">文章详情</text>
		</view>
		
		<!-- 文章内容 -->
		<scroll-view class="article-content" scroll-y>
			<!-- 文章标题 -->
			<text class="article-title">{{ article.title }}</text>
			
			<!-- 文章作者和日期 -->
			<view class="article-meta">
				<text class="article-author">{{ article.author }}</text>
				<text class="article-date">{{ article.createdAt }}</text>
			</view>
			
			<!-- 文章封面 -->
			<image :src="article.cover" mode="aspectFill" class="article-cover"></image>
			
			<!-- 文章正文 -->
			<view class="article-body">
				<text class="body-text">{{ article.content }}</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getArticleDetail } from '../../api/index.js'

// 文章信息
const article = ref({
	id: '',
	title: '',
	author: '',
	cover: '',
	content: '',
	createdAt: ''
})

// 文章ID
const articleId = ref('')

// 加载文章详情
const loadArticleDetail = async () => {
	if (!articleId.value) return
	
	try {
		const res = await getArticleDetail(articleId.value)
		if (res.code === 200) {
			article.value = res.data
		}
	} catch (error) {
		console.error('加载文章详情失败:', error)
		uni.showToast({
			title: '加载文章详情失败',
			icon: 'none'
		})
	}
}

// 返回上一页
const navigateBack = () => {
	uni.navigateBack()
}

// 获取路由参数
onLoad((options) => {
	articleId.value = options.id
	loadArticleDetail()
})

// 组件挂载时加载文章详情
onMounted(() => {
	if (articleId.value) {
		loadArticleDetail()
	}
})
</script>

<style scoped>
.article-detail-page {
	min-height: 100vh;
	background-color: #f5f5f5;
}

/* 顶部导航栏 */
.article-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	background-color: #ffffff;
	position: sticky;
	top: 0;
	z-index: 10;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.header-back {
	font-size: 28rpx;
	color: #333333;
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
}

/* 文章内容 */
.article-content {
	padding: 30rpx;
}

.article-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 20rpx;
	line-height: 1.4;
}

.article-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.article-author {
	font-size: 24rpx;
	color: #999999;
}

.article-date {
	font-size: 24rpx;
	color: #999999;
}

.article-cover {
	width: 100%;
	height: 400rpx;
	border-radius: 16rpx;
	margin-bottom: 30rpx;
}

.article-body {
	background-color: #ffffff;
	padding: 30rpx;
	border-radius: 16rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.body-text {
	font-size: 28rpx;
	color: #333333;
	line-height: 1.6;
	white-space: pre-wrap;
}
</style>