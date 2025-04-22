const { getToken, refreshToken } = require('./auth');

const DEFAULT_OPTIONS = {
  loading: true,
  retry: true,
  retryCount: 3
};

class Request {
  /**
   * 调用云函数
   * @param {string} name 云函数名称
   * @param {object} data 请求参数
   * @param {object} options 请求选项
   * @returns {Promise<any>}
   */
  async callFunction(name, data = {}, options = {}) {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    if (finalOptions.loading) {
      wx.showLoading({ title: '加载中...' });
    }

    try {
      // 添加token到请求中
      const token = getToken();
      if (token) {
        data.token = token;
      }

      const { result } = await wx.cloud.callFunction({
        name,
        data
      });

      if (!result.success) {
        // token过期,尝试刷新
        if (result.error === 'TOKEN_EXPIRED' && finalOptions.retry) {
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // 重试请求
            return this.callFunction(name, data, {
              ...finalOptions,
              retry: false
            });
          }
        }
        throw new Error(result.error || '请求失败');
      }

      return result.data;
    } catch (error) {
      console.error(`[${name}]请求失败:`, error);

      // 请求重试
      if (finalOptions.retry && finalOptions.retryCount > 0) {
        return this.callFunction(name, data, {
          ...finalOptions,
          retryCount: finalOptions.retryCount - 1
        });
      }

      throw error;
    } finally {
      if (finalOptions.loading) {
        wx.hideLoading();
      }
    }
  }

  /**
   * GET请求
   * @param {string} url 请求地址
   * @param {object} data 请求参数
   * @returns {Promise<any>}
   */
  async get(url, data) {
    return this.request('GET', url, data);
  }

  /**
   * POST请求
   * @param {string} url 请求地址
   * @param {object} data 请求参数
   * @returns {Promise<any>}
   */
  async post(url, data) {
    return this.request('POST', url, data);
  }

  /**
   * 发起HTTP请求
   * @param {string} method 请求方法
   * @param {string} url 请求地址
   * @param {object} data 请求参数
   * @returns {Promise<any>}
   */
  async request(method, url, data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method,
        data,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 上传文件到云存储
   * @param {string} filePath 本地文件路径
   * @param {string} cloudPath 云存储路径
   * @param {object} options 上传选项
   * @param {boolean} options.showLoading 是否显示加载提示，默认true
   * @param {number} options.retryCount 重试次数，默认3
   * @param {number} options.retryDelay 重试间隔（毫秒），默认1000
   * @returns {Promise<{fileID: string, tempFileURL: string}>} 文件ID和访问链接
   */
  static async uploadFile(filePath, cloudPath, options = {}) {
    const {
      showLoading = true,
      retryCount = 3,
      retryDelay = 1000
    } = options;

    if (showLoading) {
      wx.showLoading({ title: '上传中...' });
    }

    try {
      // 添加重试机制
      let remainingRetries = retryCount;
      let success = false;
      let fileID = null;
      let error = null;

      while (remainingRetries >= 0 && !success) {
        try {
          // 上传文件
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath,
            filePath,
          });

          if (uploadResult && uploadResult.fileID) {
            fileID = uploadResult.fileID;
            success = true;
          } else {
            throw new Error('上传返回结果无效');
          }
        } catch (uploadError) {
          error = uploadError;
          console.warn(`上传尝试失败，剩余重试次数: ${remainingRetries}`, uploadError);
          remainingRetries--;

          if (remainingRetries < 0) {
            break;
          }

          // 等待一段时间再重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!success) {
        throw error || new Error('上传失败');
      }

      // 获取文件链接
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: [fileID],
      });

      if (fileList[0].status === 0) {
        if (showLoading) {
          wx.hideLoading();
        }
        return {
          fileID,
          tempFileURL: fileList[0].tempFileURL
        };
      } else {
        throw new Error(fileList[0].errMsg || '获取文件链接失败');
      }
    } catch (error) {
      console.error('Upload file failed:', error);

      if (showLoading) {
        wx.hideLoading();
      }

      // 提供更具体的错误信息
      let errorMsg = '上传文件失败';
      if (error.errMsg) {
        if (error.errMsg.includes('TLS connection')) {
          errorMsg = '网络连接不稳定，请检查网络';
        } else if (error.errMsg.includes('timeout')) {
          errorMsg = '上传超时，请重试';
        }
      }

      error.message = errorMsg;
      throw error;
    }
  }

  /**
   * 从云存储下载文件
   * @param {string} fileID 文件ID
   * @returns {Promise<string>} 本地文件路径
   */
  static async downloadFile(fileID) {
    try {
      const { tempFilePath } = await wx.cloud.downloadFile({
        fileID,
      });
      return tempFilePath;
    } catch (error) {
      console.error('Download file failed:', error);
      throw error;
    }
  }

  /**
   * 删除云存储文件
   * @param {string|string[]} fileID 文件ID或ID数组
   * @returns {Promise<void>}
   */
  static async deleteFile(fileID) {
    try {
      const { fileList } = await wx.cloud.deleteFile({
        fileList: Array.isArray(fileID) ? fileID : [fileID],
      });

      const failedFiles = fileList.filter(file => file.status !== 0);
      if (failedFiles.length > 0) {
        throw new Error(
          `Failed to delete files: ${failedFiles
            .map(file => file.errMsg)
            .join(', ')}`
        );
      }
    } catch (error) {
      console.error('Delete file failed:', error);
      throw error;
    }
  }

  /**
   * 批量获取文件临时链接
   * @param {string[]} fileIDs 文件ID数组
   * @returns {Promise<string[]>} 临时链接数组
   */
  static async getTempFileURLs(fileIDs) {
    try {
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: fileIDs,
      });

      const failedFiles = fileList.filter(file => file.status !== 0);
      if (failedFiles.length > 0) {
        throw new Error(
          `Failed to get temp URLs: ${failedFiles
            .map(file => file.errMsg)
            .join(', ')}`
        );
      }

      return fileList.map(file => file.tempFileURL);
    } catch (error) {
      console.error('Get temp file URLs failed:', error);
      throw error;
    }
  }
}

module.exports = new Request();
