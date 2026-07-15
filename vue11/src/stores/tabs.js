import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTabsStore = defineStore('tabs', () => {
  const tabList = ref([
    {
      path: '/main/dashboard',
      title: '仪表盘',
      closable: false
    }
  ])
  const activeTab = ref('/main/dashboard')
  
  // 添加折叠状态，从 localStorage 读取
  const menuCollapsed = ref(localStorage.getItem('menuCollapsed') === 'true')

  // 添加标签页
  const addTab = (tab) => {
    const exists = tabList.value.some(item => item.path === tab.path)
    if (!exists) {
      tabList.value.push(tab)
    }
    activeTab.value = tab.path
  }

  // 移除标签页
  const removeTab = (path) => {
    const index = tabList.value.findIndex(item => item.path === path)
    if (index !== -1) {
      tabList.value.splice(index, 1)
      
      // 如果关闭的是当前激活的标签页，激活上一个标签页
      if (activeTab.value === path) {
        activeTab.value = tabList.value[index]?.path || tabList.value[index - 1]?.path || ''
      }
    }
  }

  // 设置当前激活的标签页
  const setActiveTab = (path) => {
    activeTab.value = path
  }
  
  // 切换菜单折叠状态
  const toggleMenuCollapse = () => {
    menuCollapsed.value = !menuCollapsed.value
    localStorage.setItem('menuCollapsed', menuCollapsed.value)
  }

  return {
    tabList,
    activeTab,
    menuCollapsed,
    addTab,
    removeTab,
    setActiveTab,
    toggleMenuCollapse
  }
})