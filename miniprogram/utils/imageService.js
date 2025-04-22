/**
 * 图片服务工具类
 * 提供图片上传、获取、缓存等功能
 */

const request = require('./request');

class ImageService {
  constructor() {
    this.defaultAvatars = {
      user: '/images/system/default-avatar.png',
      role: '/images/avatars/default-avatar.png'
    };
    this.imageCache = {};
    this.initialized = false;
  }

  /**
   * 初始化图片服务
   */
  initImageService() {
    if (this.initialized) return;
    
    // 从本地存储加载缓存的图片URL
    try {
      const cachedImages = wx.getStorageSync('imageCache');
      if (cachedImages) {
        this.imageCache = JSON.parse(cachedImages);
      }
    } catch (error) {
      console.error('Failed to load image cache:', error);
      this.imageCache = {};
    }
    
    this.initialized = true;
  }

  /**
   * 上传图片到云存储
   * @param {string} filePath 本地文件路径
   * @param {string} folder 存储文件夹，如 'users', 'roles'
   * @param {string} userId 用户ID，可选
   * @param {object} options 上传选项
   * @returns {Promise<{fileID: string, tempFileURL: string}>} 上传结果
   */
  async uploadImage(filePath, folder = 'images', userId = '', options = {}) {
    try {
      // 生成唯一文件名
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = filePath.split('.').pop();
      
      // 构建云存储路径
      let cloudPath = `${folder}/`;
      if (userId) {
        cloudPath += `${userId}/`;
      }
      cloudPath += `${timestamp}_${randomStr}.${extension}`;
      
      // 使用request工具类上传文件
      const result = await request.constructor.uploadFile(filePath, cloudPath, options);
      
      // 缓存图片URL
      if (result && result.fileID) {
        this.cacheImage(result.fileID, result.tempFileURL);
      }
      
      return result;
    } catch (error) {
      console.error('Upload image failed:', error);
      throw error;
    }
  }

  /**
   * 上传头像
   * @param {string} filePath 本地文件路径
   * @param {string} userId 用户ID
   * @param {string} type 头像类型，'user'或'role'
   * @returns {Promise<string>} 文件ID
   */
  async uploadAvatar(filePath, userId, type = 'user') {
    try {
      const folder = type === 'user' ? 'users' : 'roles';
      const result = await this.uploadImage(filePath, folder, userId, {
        showLoading: true,
        retryCount: 3,
        retryDelay: 1000
      });
      
      return result.fileID;
    } catch (error) {
      console.error('Upload avatar failed:', error);
      
      // 提供更友好的错误提示
      let errorMsg = '上传头像失败';
      if (error.errMsg) {
        if (error.errMsg.includes('TLS connection')) {
          errorMsg = '网络连接不稳定，请检查网络';
        } else if (error.errMsg.includes('timeout')) {
          errorMsg = '上传超时，请重试';
        }
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      
      throw error;
    }
  }

  /**
   * 获取图片临时URL
   * @param {string} fileID 文件ID
   * @returns {Promise<string>} 临时URL
   */
  async getImageURL(fileID) {
    // 如果是本地路径，直接返回
    if (!fileID || fileID.startsWith('/') || fileID.startsWith('http')) {
      return fileID;
    }
    
    // 检查缓存
    if (this.imageCache[fileID]) {
      return this.imageCache[fileID];
    }
    
    try {
      const result = await request.constructor.getTempFileURLs([fileID]);
      if (result && result.length > 0) {
        const url = result[0];
        this.cacheImage(fileID, url);
        return url;
      }
      return null;
    } catch (error) {
      console.error('Get image URL failed:', error);
      return null;
    }
  }

  /**
   * 缓存图片URL
   * @param {string} fileID 文件ID
   * @param {string} url 临时URL
   */
  cacheImage(fileID, url) {
    if (!fileID || !url) return;
    
    this.imageCache[fileID] = url;
    
    // 保存到本地存储
    try {
      wx.setStorageSync('imageCache', JSON.stringify(this.imageCache));
    } catch (error) {
      console.error('Failed to save image cache:', error);
    }
  }

  /**
   * 获取默认头像
   * @param {string} type 头像类型，'user'或'role'
   * @returns {string} 默认头像路径
   */
  getDefaultAvatar(type = 'user') {
    return this.defaultAvatars[type] || this.defaultAvatars.user;
  }

  /**
   * 清除图片缓存
   */
  clearImageCache() {
    this.imageCache = {};
    try {
      wx.removeStorageSync('imageCache');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }
}

module.exports = new ImageService();
