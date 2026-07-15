<template>
	<view class="category-page">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input">
				<image class="search-icon" src="/static/搜索.png"></image>
				<input 
					class="search-input-field" 
					v-model="searchKeyword" 
					placeholder="搜索商品名称" 
					@input="onSearchInput"
					@confirm="handleSearch"
					@focus="onSearchFocus"
				/>
				<view class="search-button" @click="handleSearch">
					<text class="search-button-text">搜索</text>
				</view>
				<view class="favorite-btn" @click="goToFavorite">
					<text class="favorite-icon">❤️</text>
				</view>
			</view>
		</view>
		
		<!-- 搜索面板（点击搜索框时弹出） -->
		<view class="search-panel" v-if="showSearchPanel && !isSearching" @click.stop>
			<!-- 搜索建议 -->
			<view class="suggest-list" v-if="searchKeyword.trim() && searchSuggests.length > 0">
				<text class="panel-title">搜索建议</text>
				<view 
					class="suggest-item" 
					v-for="(item, index) in searchSuggests" 
					:key="index" 
					@click="quickSearch(item.keyword)"
				>
					<text class="suggest-icon">🔍</text>
					<text class="suggest-text">{{ item.keyword }}</text>
				</view>
			</view>
			
			<!-- 搜索历史 -->
			<view class="panel-section" v-if="!searchKeyword.trim() && searchHistory.length > 0">
				<view class="panel-header">
					<text class="panel-title">🕐 搜索历史</text>
					<view class="clear-btn" @click="clearHistory">
						<text class="clear-icon">🗑️</text>
						<text class="clear-text">清除</text>
					</view>
				</view>
				<view class="tag-list">
					<text 
						class="tag-item history-tag" 
						v-for="(item, index) in searchHistory" 
						:key="index" 
						@click="quickSearch(item.keyword)"
					>
						{{ item.keyword }}
					</text>
				</view>
			</view>
			
			<!-- 热搜词 -->
			<view class="panel-section" v-if="!searchKeyword.trim()">
				<view class="panel-header">
					<text class="panel-title">🔥 热门搜索</text>
					<text class="refresh-btn" @click="loadHotKeywords">🔄 换一批</text>
				</view>
				<view class="tag-list">
					<text 
						class="tag-item hot-tag" 
						v-for="(item, index) in hotKeywords" 
						:key="index" 
						@click="quickSearch(item.keyword)"
					>
						<text class="hot-rank" v-if="index < 3" :class="'rank-' + (index + 1)">{{ index + 1 }}</text>
						{{ item.keyword }}
					</text>
				</view>
				<view v-if="hotKeywords.length === 0" class="empty-text">暂无热搜词</view>
			</view>
		</view>
		
		<!-- 搜索结果页 -->
		<view v-if="isSearching" class="search-page">
			<view class="search-top-bar">
				<view class="back-btn" @click="goBack">
					
					<text class="back-text">返回</text>
				</view>
				<view class="search-input-small">
					<image class="search-icon-small" src="/static/搜索.png"></image>
					<input 
						class="search-field-small" 
						v-model="searchKeyword" 
						placeholder="搜索商品名称" 
						@confirm="handleSearch"
					/>
				</view>
				<text class="search-btn-text" @click="handleSearch">搜索</text>
			</view>
			
			<view class="search-result-header">
				<text class="search-keyword">搜索"{{ searchedKeyword }}"</text>
				<text class="search-result-count">共 {{ searchResults.length }} 件商品</text>
			</view>
			
			<view v-if="searchResults.length === 0 && !searchLoading" class="no-result">
				<image class="no-result-image" src="/static/搜索.png" mode="aspectFit"></image>
				<text class="no-result-text">未找到相关商品</text>
				<text class="no-result-tip">试试其他关键词吧</text>
			</view>
			
			<scroll-view v-else class="search-results-list" scroll-y>
				<view class="goods-grid">
					<view class="goods-item" v-for="(item, index) in searchResults" :key="index" @click="navigateToDetail(item.id)">
						<image :src="getImageUrl(item.images)" mode="aspectFill"></image>
						<view class="goods-info">
							<text class="goods-name">{{ item.name }}</text>
							<text class="goods-category">{{ item.category }}</text>
							<view class="price-wrapper">
								<text class="goods-price" :class="{ 'discount-price': discountInfo?.isActive }">
									￥{{ getDisplayPrice(item.price) }}
								</text>
								<text class="original-price" v-if="discountInfo?.isActive">
									￥{{ formatPrice(item.price) }}
								</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 分类内容（非搜索状态） -->
		<view class="category-content" v-if="!isSearching">
			<scroll-view class="category-left" scroll-y>
				<view 
					class="category-item" 
					v-for="category in categoryList" 
					:key="category.id"
					:class="{ active: currentCategoryId === category.id }"
					@click="selectCategory(category.id)"
				>
					<text>{{ category.name }}</text>
				</view>
			</scroll-view>
			
			<scroll-view class="category-right" scroll-y>
				<view class="category-title">{{ currentCategoryName }}</view>
				<view v-if="categoryGoods.length === 0" class="no-goods">
					<text>暂无商品</text>
				</view>
				<view v-else class="goods-grid">
					<view class="goods-item" v-for="goods in categoryGoods" :key="goods.id" @click="navigateToDetail(goods.id)">
						<image :src="getImageUrl(goods.images)" mode="aspectFill"></image>
						<view class="goods-info">
							<text class="goods-name">{{ goods.name }}</text>
							<view class="price-wrapper">
								<text class="goods-price" :class="{ 'discount-price': discountInfo?.isActive }">
									￥{{ getDisplayPrice(goods.price) }}
								</text>
								<text class="original-price" v-if="discountInfo?.isActive">
									￥{{ formatPrice(goods.price) }}
								</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 遮罩层 -->
		<view class="search-mask" v-if="showSearchPanel && !isSearching" @click="closeSearchPanel"></view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
	getCategoryList, getGoodsList, getDiscountStatus,
	getHotKeywords, getSearchHistory, clearSearchHistory, 
	getSearchSuggest, recordSearchKeyword 
} from '../../api/index.js'

const categoryList = ref([])
const currentCategoryId = ref(null)
const allGoods = ref([])

// 打折信息
const discountInfo = ref(null)

// ========== 搜索相关状态 ==========
const searchKeyword = ref('')
const searchedKeyword = ref('')
const isSearching = ref(false)
const showSearchPanel = ref(false)
const searchResults = ref([])
const searchLoading = ref(false)
const searchSuggests = ref([])
const hotKeywords = ref([])
const searchHistory = ref([])

let suggestTimer = null

const currentCategoryName = computed(() => {
	const category = categoryList.value.find(cat => cat.id === currentCategoryId.value)
	return category ? category.name : '全部商品'
})

const categoryGoods = computed(() => {
	if (!currentCategoryId.value) return []
	const category = categoryList.value.find(cat => cat.id === currentCategoryId.value)
	if (!category) return []
	return allGoods.value.filter(goods => goods.category === category.name)
})

const loadDiscountStatus = async () => {
	try {
		const res = await getDiscountStatus()
		if (res.code === 200) discountInfo.value = res.data
	} catch (error) {}
}

const formatPrice = (price) => Number(price).toFixed(2)

const getDisplayPrice = (price) => {
	if (discountInfo.value?.isActive) return formatPrice(price * discountInfo.value.discountRate)
	return formatPrice(price)
}

const getImageUrl = (images) => {
	if (!images) return '/static/商品.png'
	if (Array.isArray(images)) return images[0] || '/static/商品.png'
	if (typeof images === 'string') {
		try {
			const parsed = JSON.parse(images)
			return Array.isArray(parsed) ? parsed[0] : images
		} catch (e) { return images }
	}
	return '/static/商品.png'
}

const getCurrentUser = () => {
	try {
		const userStr = uni.getStorageSync('userInfo')
		if (!userStr) return null
		return typeof userStr === 'string' ? JSON.parse(userStr) : userStr
	} catch (e) { return null }
}

const goToFavorite = () => {
	const user = getCurrentUser()
	if (!user) {
		uni.showModal({
			title: '提示', content: '请先登录',
			success: (res) => { if (res.confirm) uni.navigateTo({ url: '/pages/Index/Index' }) }
		})
		return
	}
	uni.navigateTo({ url: '/pages/Favorite/Favorite' })
}

// ========== 搜索框获得焦点 ==========
const onSearchFocus = () => {
	showSearchPanel.value = true
	loadSearchHistory()
	loadHotKeywords()
}

const closeSearchPanel = () => {
	showSearchPanel.value = false
}

// ========== 输入时获取建议 ==========
const onSearchInput = (e) => {
	const keyword = e.detail.value.trim()
	if (!keyword) {
		searchSuggests.value = []
		return
	}
	clearTimeout(suggestTimer)
	suggestTimer = setTimeout(() => {
		loadSuggests(keyword)
	}, 300)
}

const loadSuggests = async (keyword) => {
	try {
		const res = await getSearchSuggest(keyword)
		if (res.code === 200) searchSuggests.value = res.data || []
	} catch (error) {}
}

const loadHotKeywords = async () => {
	try {
		const res = await getHotKeywords()
		if (res.code === 200) hotKeywords.value = res.data || []
	} catch (error) {}
}

const loadSearchHistory = async () => {
	const user = getCurrentUser()
	if (!user) return
	try {
		const res = await getSearchHistory(user.id)
		if (res.code === 200) searchHistory.value = res.data || []
	} catch (error) {}
}

const quickSearch = (keyword) => {
	searchKeyword.value = keyword
	closeSearchPanel()
	handleSearch()
}

const clearHistory = async () => {
	const user = getCurrentUser()
	if (!user) return
	uni.showModal({
		title: '提示',
		content: '确定要清除所有搜索历史吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await clearSearchHistory(user.id)
					searchHistory.value = []
					uni.showToast({ title: '已清除', icon: 'success' })
				} catch (error) {}
			}
		}
	})
}

// ========== 搜索 ==========
const handleSearch = () => {
	const keyword = searchKeyword.value.trim()
	if (!keyword) {
		uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
		return
	}
	isSearching.value = true
	showSearchPanel.value = false
	searchedKeyword.value = keyword
	performSearch(keyword)
}

const performSearch = async (keyword) => {
	searchLoading.value = true
	
	const user = getCurrentUser()
	recordSearchKeyword({ keyword: keyword.trim(), userId: user?.id || null }).catch(() => {})
	
	try {
		const res = await getGoodsList({ name: keyword || '' })
		if (res.code === 200) {
			searchResults.value = (res.data || []).filter(item => 
				item.name && item.name.toLowerCase().includes(keyword.toLowerCase())
			)
		} else {
			searchResults.value = []
		}
	} catch (error) {
		searchResults.value = []
	} finally {
		searchLoading.value = false
	}
}

// ========== 返回分类页 ==========
const goBack = () => {
	isSearching.value = false
	showSearchPanel.value = false
	searchKeyword.value = ''
	searchResults.value = []
	searchSuggests.value = []
}

const loadCategories = async () => {
	try {
		const res = await getCategoryList()
		if (res.code === 200) {
			categoryList.value = res.data || []
			if (categoryList.value.length > 0) {
				currentCategoryId.value = categoryList.value[0].id
			}
		}
	} catch (error) {}
}

const loadGoods = async () => {
	try {
		const res = await getGoodsList()
		if (res.code === 200) allGoods.value = res.data || []
	} catch (error) {}
}

const selectCategory = (categoryId) => {
	currentCategoryId.value = categoryId
}

const navigateToDetail = (goodsId) => {
	uni.navigateTo({ url: `/pages/GoodsDetail/GoodsDetail?id=${goodsId}` })
}

onMounted(() => {
	loadDiscountStatus()
	loadCategories()
	loadGoods()
})
</script>

<style scoped>
.category-page {
	min-height: 100vh;
	background-color: #f5f5f5;
	display: flex;
	flex-direction: column;
	position: relative;
}

/* ========== 搜索栏 ========== */
.search-bar {
	padding: 20rpx;
	background-color: #ffffff;
	position: sticky;
	top: 0;
	z-index: 110;
}

.search-input {
	display: flex;
	align-items: center;
	background-color: #f0f0f0;
	border-radius: 40rpx;
	padding: 10rpx 20rpx;
}

.search-icon { width: 32rpx; height: 32rpx; margin-right: 10rpx; }
.search-input-field { font-size: 28rpx; color: #333; flex: 1; }
.search-button { padding: 10rpx 24rpx; background-color: #ff6b6b; border-radius: 30rpx; margin-left: 10rpx; }
.search-button-text { font-size: 24rpx; color: #fff; font-weight: bold; }
.favorite-btn { padding: 10rpx 16rpx; margin-left: 10rpx; }
.favorite-icon { font-size: 36rpx; }

/* ========== 遮罩层 ========== */
.search-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.4);
	z-index: 90;
}

/* ========== 搜索面板 ========== */
.search-panel {
	position: relative;
	z-index: 100;
	background-color: #fff;
	margin: 0 20rpx;
	border-radius: 0 0 16rpx 16rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
	max-height: 60vh;
	overflow-y: auto;
}

.panel-section { margin-bottom: 25rpx; }
.panel-section:last-child { margin-bottom: 0; }

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.panel-title { font-size: 28rpx; font-weight: bold; color: #333; }

.clear-btn { display: flex; align-items: center; gap: 5rpx; }
.clear-icon { font-size: 24rpx; }
.clear-text { font-size: 24rpx; color: #999; }
.refresh-btn { font-size: 24rpx; color: #409eff; }

.tag-list { display: flex; flex-wrap: wrap; gap: 15rpx; }
.tag-item { padding: 10rpx 24rpx; border-radius: 24rpx; font-size: 26rpx; }
.history-tag { background-color: #f5f5f5; color: #666; }
.hot-tag { background-color: #fff5f5; color: #ff6b6b; }
.hot-rank { font-weight: bold; margin-right: 6rpx; }
.hot-rank.rank-1 { color: #ff0000; }
.hot-rank.rank-2 { color: #ff6600; }
.hot-rank.rank-3 { color: #ff9900; }
.empty-text { text-align: center; padding: 20rpx 0; color: #ccc; font-size: 24rpx; }

/* ========== 搜索建议 ========== */
.suggest-list { margin-bottom: 20rpx; }
.suggest-item { display: flex; align-items: center; padding: 20rpx 10rpx; border-bottom: 1rpx solid #f5f5f5; }
.suggest-item:last-child { border-bottom: none; }
.suggest-icon { font-size: 28rpx; margin-right: 15rpx; }
.suggest-text { font-size: 28rpx; color: #333; }

/* ========== 搜索结果页 ========== */
.search-page { min-height: 100vh; background-color: #f5f5f5; }
.search-top-bar {
	display: flex;
	align-items: center;
	padding: 15rpx 20rpx;
	background-color: #fff;
	gap: 15rpx;
	position: sticky;
	top: 0;
	z-index: 10;
}
.back-btn { display: flex; align-items: center; gap: 4rpx; flex-shrink: 0; }
.back-icon { font-size: 32rpx; color: #333; font-weight: bold; }
.back-text { font-size: 26rpx; color: #333; }
.search-input-small { flex: 1; display: flex; align-items: center; background-color: #f0f0f0; border-radius: 30rpx; padding: 8rpx 16rpx; }
.search-icon-small { width: 28rpx; height: 28rpx; margin-right: 8rpx; }
.search-field-small { flex: 1; font-size: 26rpx; color: #333; }
.search-btn-text { font-size: 26rpx; color: #ff6b6b; font-weight: bold; flex-shrink: 0; }
.search-result-header { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 30rpx; background-color: #ffffff; border-bottom: 1rpx solid #f0f0f0; }
.search-keyword { font-size: 28rpx; color: #333; font-weight: bold; }
.search-result-count { font-size: 24rpx; color: #999; }
.search-results-list { padding: 20rpx; }
.no-result { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 150rpx 40rpx; background-color: #ffffff; margin: 20rpx; border-radius: 16rpx; }
.no-result-image { width: 160rpx; height: 160rpx; margin-bottom: 30rpx; opacity: 0.5; }
.no-result-text { font-size: 32rpx; color: #666; margin-bottom: 10rpx; }
.no-result-tip { font-size: 26rpx; color: #999; }

/* ========== 分类内容 ========== */
.category-content { display: flex; flex: 1; height: calc(100vh - 100rpx); }
.category-left { width: 180rpx; background-color: #f5f5f5; }
.category-item { padding: 30rpx 20rpx; font-size: 28rpx; color: #666; text-align: center; position: relative; }
.category-item.active { color: #ff6b6b; font-weight: bold; background-color: #ffffff; }
.category-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6rpx; height: 40rpx; background-color: #ff6b6b; border-radius: 0 4rpx 4rpx 0; }
.category-right { flex: 1; background-color: #ffffff; padding: 20rpx; }
.category-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.no-goods { display: flex; justify-content: center; align-items: center; height: 300rpx; color: #999; font-size: 28rpx; }

.goods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; }
.goods-item { background-color: #f9f9f9; border-radius: 16rpx; overflow: hidden; }
.goods-item image { width: 100%; height: 200rpx; }
.goods-info { padding: 15rpx 15rpx 15rpx 15rpx; }
.goods-name { font-size: 26rpx; color: #333; margin-bottom: 8rpx; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-category { font-size: 22rpx; color: #999; margin-bottom: 8rpx; }
.price-wrapper { display: flex; align-items: baseline; gap: 10rpx; }
.goods-price { font-size: 28rpx; color: #333; font-weight: bold; }
.goods-price.discount-price { color: #ff6b6b; }
.original-price { font-size: 22rpx; color: #999; text-decoration: line-through; }
</style>