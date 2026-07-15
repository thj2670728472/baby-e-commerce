import request from '@/utils/request'

// 获取所有文章列表
export function getBabyCultureList() {
  return request({
    url: '/baby-culture',
    method: 'get'
  })
}

// 获取文章详情
export function getBabyCultureDetail(id) {
  return request({
    url: `/baby-culture/${id}`,
    method: 'get'
  })
}

// 创建新文章（管理员）
export function createBabyCulture(data) {
  return request({
    url: '/baby-culture',
    method: 'post',
    data
  })
}

// 更新文章（管理员）
export function updateBabyCulture(id, data) {
  return request({
    url: `/baby-culture/${id}`,
    method: 'put',
    data
  })
}

// 删除文章（管理员）
export function deleteBabyCulture(id) {
  return request({
    url: `/baby-culture/${id}`,
    method: 'delete'
  })
}
