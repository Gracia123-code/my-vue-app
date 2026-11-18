// ==================== 前端公共工具函数 ====================
// 这里放各个页面都会用到的通用小函数，避免每个页面重复写

/**
 * 获取图片的完整地址
 * 后端存图片时，可能是「逗号分隔的多张图」，也可能是相对路径（/uploads/xxx.jpg）
 * 这里统一处理：取第一张图，并把相对路径补成完整地址
 * @param {string} url 后端返回的图片字段
 * @returns {string} 可以直接放进 <img src> 的完整地址
 */
export function getImage(url) {
  // 没有图片时，返回一张占位图
  if (!url) return 'https://via.placeholder.com/200x200?text=暂无图片'
  // 多张图用逗号分隔，只取第一张
  const first = String(url).split(',')[0]
  // 已经是 http 开头的完整地址就直接用，否则拼上后端地址
  if (first.startsWith('http')) return first
  return `http://localhost:8080${first}`
}

/**
 * 获取一个商品的所有图片（数组形式），用于轮播/多图展示
 * @param {string} url 后端返回的图片字段（逗号分隔）
 * @returns {string[]} 图片完整地址数组
 */
export function getImages(url) {
  if (!url) return []
  return String(url).split(',').filter(Boolean).map(u => (u.startsWith('http') ? u : `http://localhost:8080${u}`))
}

/**
 * 格式化时间：把后端返回的 ISO 时间（2026-11-18T12:30:00）变成 2026-11-18 12:30:00
 * @param {string} timeStr 后端时间字符串
 * @returns {string} 格式化后的时间
 */
export function formatTime(timeStr) {
  if (!timeStr) return ''
  return String(timeStr).replace('T', ' ').substring(0, 19)
}

/**
 * 获取带 Token 的请求头
 * 后端通过 JwtInterceptor 校验 Authorization: Bearer xxx
 * @returns {object} axios 请求头对象
 */
export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
}

/**
 * 读取本地缓存的用户信息
 * @returns {object} 用户信息对象（没有则返回空对象）
 */
export function getUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch (e) {
    return {}
  }
}

/**
 * 保存用户信息到本地缓存
 * @param {object} user 用户信息对象
 */
export function setUserInfo(user) {
  localStorage.setItem('userInfo', JSON.stringify(user))
}
