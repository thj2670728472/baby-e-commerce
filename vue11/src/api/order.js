import request from '@/utils/request'

export function getOrderList() {
  return request({
    url: '/orders/list',
    method: 'get'
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/orders/detail/${id}`,
    method: 'get'
  })
}

export function updateOrderStatus(id, status) {
  return request({
    url: `/orders/update-status/${id}`,
    method: 'put',
    data: { status }
  })
}

export function createOrder(data) {
  return request({
    url: '/orders/create',
    method: 'post',
    data
  })
}


// 申请退货
export function applyReturn(id, reason) {
  return request({
    url: `/orders/return/${id}`,
    method: 'post',
    data: { reason }
  })
}

// 管理员审核退货
export function approveReturn(id, approved) {
  return request({
    url: `/orders/approve-return/${id}`,
    method: 'post',
    data: { approved }
  })
}

// 发货
export function shipOrder(id,data) {
  return request({
    url: `/orders/ship/${id}`,
    method: 'post',
    data
  })
}

// 确认收货
export function receiveOrder(id) {
  return request({
    url: `/orders/receive/${id}`,
    method: 'post'
  })
}
