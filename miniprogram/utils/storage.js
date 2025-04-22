class Storage {
  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} data 缓存数据
   * @param {number} expire 过期时间（毫秒），可选
   */
  static set(key, data, expire) {
    try {
      const storage = {
        data,
        expire: expire ? Date.now() + expire : null,
      };
      wx.setStorageSync(key, storage);
    } catch (error) {
      console.error('Set storage failed:', error);
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @param {any} defaultValue 默认值
   * @returns {any} 缓存数据或默认值
   */
  static get(key, defaultValue) {
    try {
      const storage = wx.getStorageSync(key);
      
      // 缓存不存在
      if (!storage) {
        return defaultValue;
      }

      // 判断是否过期
      if (storage.expire && storage.expire < Date.now()) {
        this.remove(key);
        return defaultValue;
      }

      return storage.data;
    } catch (error) {
      console.error('Get storage failed:', error);
      return defaultValue;
    }
  }

  /**
   * 移除缓存
   * @param {string} key 缓存键
   */
  static remove(key) {
    try {
      wx.removeStorageSync(key);
    } catch (error) {
      console.error('Remove storage failed:', error);
    }
  }

  /**
   * 清空缓存
   */
  static clear() {
    try {
      wx.clearStorageSync();
    } catch (error) {
      console.error('Clear storage failed:', error);
    }
  }

  /**
   * 获取缓存信息
   * @returns {object} 缓存信息
   */
  static info() {
    try {
      return wx.getStorageInfoSync();
    } catch (error) {
      console.error('Get storage info failed:', error);
      return {
        keys: [],
        currentSize: 0,
        limitSize: 0,
      };
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key 缓存键
   * @returns {boolean} 是否存在
   */
  static has(key) {
    try {
      const storage = wx.getStorageSync(key);
      if (!storage) {
        return false;
      }
      if (storage.expire && storage.expire < Date.now()) {
        this.remove(key);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Check storage failed:', error);
      return false;
    }
  }
}

module.exports = Storage;
