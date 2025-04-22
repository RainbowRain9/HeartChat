// 存储相关的key常量
const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

// 保存登录信息
function saveLoginInfo(data) {
  try {
    // 分别存储token和userInfo
    wx.setStorageSync(TOKEN_KEY, data.token)
    wx.setStorageSync(USER_INFO_KEY, data.userInfo)

    // 如果执行到这里说明保存成功
    return true
  } catch (error) {
    console.error('保存登录信息失败:', error)
    return false
  }
}

// 获取登录信息
function getLoginInfo() {
  try {
    // 分别获取token和userInfo
    const token = wx.getStorageSync(TOKEN_KEY)
    const userInfo = wx.getStorageSync(USER_INFO_KEY)

    return {
      token,
      userInfo
    }
  } catch (error) {
    console.error('获取登录信息失败:', error)
    return {}
  }
}

// 清除登录信息
function clearLoginInfo() {
  try {
    // 分别清除token和userInfo
    wx.removeStorageSync(TOKEN_KEY)
    wx.removeStorageSync(USER_INFO_KEY)
    return true
  } catch (error) {
    console.error('清除登录信息失败:', error)
    return false
  }
}

// 检查是否登录
function checkLogin() {
  try {
    const token = wx.getStorageSync(TOKEN_KEY)
    const userInfo = wx.getStorageSync(USER_INFO_KEY)
    return !!(token && userInfo)
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}

// 导出模块
module.exports = {
  saveLoginInfo,
  getLoginInfo,
  clearLoginInfo,
  checkLogin
};
