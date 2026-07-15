<template>
  <view class="all-articles-page">
    <view class="page-header">
      <text class="header-back" @click="navigateBack">返回</text>
      <text class="header-title">全部文章</text>
      <text class="header-placeholder"></text>
    </view>
    <scroll-view class="article-list" scroll-y>
      <view class="article-item" v-for="article in articles" :key="article.id" @click="showDetail(article)">
        <text class="article-title">{{ article.title }}</text>
        <text class="article-summary">{{ article.summary }}</text>
        <view class="article-meta">
          <text v-if="article.author">作者：{{ article.author }}</text>
          <text>{{ formatDate(article.createdAt) }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="modal" v-if="showModal">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">文章详情</text>
          <text class="modal-close" @click="showModal = false">×</text>
        </view>
        <view class="modal-body">
          <text class="detail-title">{{ selectedArticle.title }}</text>
          <view class="detail-meta">
            <text v-if="selectedArticle.author">作者：{{ selectedArticle.author }}</text>
            <text>{{ formatDate(selectedArticle.createdAt) }}</text>
          </view>
          <view class="detail-content"><text>{{ selectedArticle.content }}</text></view>
        </view>
        <view class="modal-footer">
          <button class="close-button" @click="showModal = false">关闭</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getArticles, getArticleDetail } from '../../api/index.js'

const articles = ref([])
const showModal = ref(false)
const selectedArticle = ref({})

const loadArticles = async () => {
  const res = await getArticles()
  if (res.code === 200) articles.value = res.data
}

const showDetail = async (article) => {
  showModal.value = true
  selectedArticle.value = article
  const res = await getArticleDetail(article.id)
  if (res.code === 200) selectedArticle.value = res.data
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString('zh-CN') : ''
const navigateBack = () => uni.navigateBack()

onMounted(() => loadArticles())
</script>

<style scoped>
.all-articles-page { min-height: 100vh; background-color: #f5f5f5; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 30rpx; background-color: #fff; }
.header-back { font-size: 28rpx; color: #333; }
.header-title { font-size: 36rpx; font-weight: bold; }
.header-placeholder { width: 100rpx; }
.article-list { padding: 20rpx; }
.article-item { background-color: #fff; border-radius: 16rpx; padding: 25rpx; margin-bottom: 15rpx; }
.article-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 10rpx; }
.article-summary { font-size: 24rpx; color: #666; margin-bottom: 15rpx; line-height: 1.5; }
.article-meta { font-size: 20rpx; color: #999; display: flex; gap: 20rpx; }

.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background-color: #fff; border-radius: 16rpx; width: 90%; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 25rpx; border-bottom: 1rpx solid #e0e0e0; }
.modal-title { font-size: 32rpx; font-weight: bold; }
.modal-close { font-size: 36rpx; color: #999; }
.modal-body { flex: 1; padding: 25rpx; overflow-y: auto; }
.detail-title { font-size: 28rpx; font-weight: bold; text-align: center; margin-bottom: 15rpx; }
.detail-meta { display: flex; justify-content: center; gap: 20rpx; margin-bottom: 20rpx; padding-bottom: 15rpx; border-bottom: 1rpx solid #e0e0e0; font-size: 22rpx; color: #999; }
.detail-content { font-size: 26rpx; line-height: 1.8; white-space: pre-wrap; }
.modal-footer { display: flex; justify-content: center; padding: 20rpx; border-top: 1rpx solid #e0e0e0; }
.close-button { width: 180rpx; height: 60rpx; background-color: #409eff; color: #fff; font-size: 26rpx; border-radius: 30rpx; border: none; }
</style>