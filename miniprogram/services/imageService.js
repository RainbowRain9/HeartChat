// 图片资源服务
// 不在模块顶层调用getApp()

// 云环境ID
const ENV_ID = 'cloud1-9gpfk3ie94d8630a'; // 云环境ID

// 图片资源映射表
const IMAGE_MAP = {
  // 图标
  'icons/back': 'cloud://'+ENV_ID+'.icons/back.png',
  'icons/emotion': 'cloud://'+ENV_ID+'.icons/emotion.png',
  'icons/voice': 'cloud://'+ENV_ID+'.icons/voice.png',
  'icons/send': 'cloud://'+ENV_ID+'.icons/send.png',
  'icons/close': 'cloud://'+ENV_ID+'.icons/close.png',

  // 头像
  'avatars/default-avatar': 'cloud://'+ENV_ID+'.avatars/default-avatar.png',

  // 可以添加更多图片...
};

// 本地图片映射表（作为备用）
const LOCAL_IMAGE_MAP = {
  'icons/back': '/images/icons/back.png',
  'icons/emotion': '/images/icons/emotion.png',
  'icons/voice': '/images/icons/voice.png',
  'icons/send': '/images/icons/send.png',
  'icons/close': '/images/icons/close.png',
  'avatars/default-avatar': '/images/avatars/default-avatar.png',
};

// 默认头像
const DEFAULT_AVATARS = {
  user: '/images/system/default-avatar.png',
  role: '/images/avatars/default-avatar.png'
};

// 图片缓存
let imageCache = {};

/**
 * 获取图片URL
 * @param {string} key 图片键名
 * @param {boolean} useLocal 是否使用本地图片（默认false）
 * @returns {string} 图片URL
 */
function getImageUrl(key, useLocal = false) {
  // 如果键名不存在，返回空字符串
  if (!key) {
    console.warn('图片键名不能为空');
    return '';
  }

  try {
    // 获取app实例
    const app = getApp();

    // 如果指定使用本地图片或者app未初始化或云环境未初始化，则使用本地图片
    if (useLocal || !app || !app.globalData || !app.globalData.cloudInit) {
      return LOCAL_IMAGE_MAP[key] || '';
    }

    // 否则使用云存储图片
    return IMAGE_MAP[key] || LOCAL_IMAGE_MAP[key] || '';
  } catch (error) {
    console.error('获取图片URL失败:', error);
    return LOCAL_IMAGE_MAP[key] || '';
  }
}

/**
 * 预加载常用图片
 * @param {Array<string>} keys 图片键名数组
 * @returns {Promise<void>}
 */
async function preloadImages(keys = []) {
  const promises = keys.map(key => {
    const url = getImageUrl(key);
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: url,
        success: resolve,
        fail: reject
      });
    });
  });

  try {
    await Promise.all(promises);
    console.log('图片预加载完成');
  } catch (error) {
    console.error('图片预加载失败:', error);
  }
}

/**
 * 初始化图片服务
 * @returns {Promise<void>}
 */
async function initImageService() {
  // 获取app实例
  const app = getApp();

  // 检查app和云环境是否初始化
  if (!app || !app.globalData || !app.globalData.cloudInit) {
    console.warn('应用或云环境未初始化，将使用本地图片');
    return;
  }

  // 从本地存储加载缓存的图片URL
  try {
    const cachedImages = wx.getStorageSync('imageCache');
    if (cachedImages) {
      imageCache = JSON.parse(cachedImages);
    }
  } catch (error) {
    console.error('Failed to load image cache:', error);
    imageCache = {};
  }

  // 预加载常用图片
  const commonImages = [
    'icons/back',
    'icons/emotion',
    'icons/voice',
    'icons/send',
    'icons/close',
    'avatars/default-avatar'
  ];

  await preloadImages(commonImages);
}

/**
 * 上传图片到云存储
 * @param {string} filePath 本地文件路径
 * @param {string} folder 存储文件夹，如 'users', 'roles'
 * @param {string} userId 用户ID，可选
 * @returns {Promise<{fileID: string, tempFileURL: string}>} 上传结果
 */
async function uploadImage(filePath, folder = 'images', userId = '') {
  try {
    // 获取app实例
    const app = getApp();

    // 检查app和云环境是否初始化
    if (!app || !app.globalData || !app.globalData.cloudInit) {
      throw new Error('应用或云环境未初始化，无法上传图片');
    }
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

    // 显示加载提示
    wx.showLoading({ title: '上传中...' });

    // 添加重试机制
    let retryCount = 3;
    let success = false;
    let uploadResult = null;
    let error = null;

    while (retryCount >= 0 && !success) {
      try {
        // 上传文件
        uploadResult = await wx.cloud.uploadFile({
          cloudPath,
          filePath
        });

        if (uploadResult && uploadResult.fileID) {
          success = true;
        } else {
          throw new Error('上传返回结果无效');
        }
      } catch (uploadError) {
        error = uploadError;
        console.warn(`上传尝试失败，剩余重试次数: ${retryCount}`, uploadError);
        retryCount--;

        if (retryCount < 0) {
          break;
        }

        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!success) {
      throw error || new Error('上传失败');
    }

    // 获取文件链接
    const { fileList } = await wx.cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    });

    wx.hideLoading();

    if (fileList[0].status === 0) {
      // 缓存图片URL
      cacheImage(uploadResult.fileID, fileList[0].tempFileURL);

      return {
        fileID: uploadResult.fileID,
        tempFileURL: fileList[0].tempFileURL
      };
    } else {
      throw new Error(fileList[0].errMsg || '获取文件链接失败');
    }
  } catch (error) {
    wx.hideLoading();
    console.error('Upload image failed:', error);

    // 提供更具体的错误信息
    let errorMsg = '上传文件失败';
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
 * 上传头像
 * @param {string} filePath 本地文件路径
 * @param {string} userId 用户ID
 * @param {string} type 头像类型，'user'或'role'
 * @returns {Promise<string>} 文件ID
 */
async function uploadAvatar(filePath, userId, type = 'user') {
  try {
    const folder = type === 'user' ? 'users' : 'roles';
    const result = await uploadImage(filePath, folder, userId);
    return result.fileID;
  } catch (error) {
    console.error('Upload avatar failed:', error);
    throw error;
  }
}

/**
 * 缓存图片URL
 * @param {string} fileID 文件ID
 * @param {string} url 临时URL
 */
function cacheImage(fileID, url) {
  if (!fileID || !url) return;

  imageCache[fileID] = url;

  // 保存到本地存储
  try {
    wx.setStorageSync('imageCache', JSON.stringify(imageCache));
  } catch (error) {
    console.error('Failed to save image cache:', error);
  }
}

/**
 * 获取图片临时URL
 * @param {string} fileID 文件ID
 * @returns {Promise<string>} 临时URL
 */
async function getImageTempURL(fileID) {
  // 如果是本地路径，直接返回
  if (!fileID || fileID.startsWith('/') || fileID.startsWith('http')) {
    return fileID;
  }

  // 获取app实例
  const app = getApp();

  // 检查app和云环境是否初始化
  if (!app || !app.globalData || !app.globalData.cloudInit) {
    console.warn('应用或云环境未初始化，无法获取云存储图片');
    return fileID;
  }

  // 检查缓存
  if (imageCache[fileID]) {
    return imageCache[fileID];
  }

  try {
    const { fileList } = await wx.cloud.getTempFileURL({
      fileList: [fileID]
    });

    if (fileList[0].status === 0) {
      const url = fileList[0].tempFileURL;
      cacheImage(fileID, url);
      return url;
    }
    return null;
  } catch (error) {
    console.error('Get image URL failed:', error);
    return null;
  }
}

/**
 * 获取默认头像
 * @param {string} type 头像类型，'user'或'role'
 * @returns {string} 默认头像路径
 */
function getDefaultAvatar(type = 'user') {
  return DEFAULT_AVATARS[type] || DEFAULT_AVATARS.user;
}

/**
 * 清除图片缓存
 */
function clearImageCache() {
  imageCache = {};
  try {
    wx.removeStorageSync('imageCache');
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
}

// 导出图片服务
export default {
  getImageUrl,
  preloadImages,
  initImageService,
  uploadImage,
  uploadAvatar,
  getImageTempURL,
  getDefaultAvatar,
  clearImageCache
};
