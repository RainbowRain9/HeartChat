/**
 * 日志工具类
 */

// 是否开启调试模式
const DEBUG_MODE = false;

/**
 * 普通日志
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
function log(message, data) {
  if (DEBUG_MODE) {
    console.log(`[LOG] ${message}`, data || '');
  }
}

/**
 * 信息日志
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
function infoLog(message, data) {
  if (DEBUG_MODE) {
    console.info(`[INFO] ${message}`, data || '');
  }
}

/**
 * 警告日志
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
function warnLog(message, data) {
  console.warn(`[WARN] ${message}`, data || '');
}

/**
 * 错误日志
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
function errorLog(message, data) {
  console.error(`[ERROR] ${message}`, data || '');
}

/**
 * 调试日志
 * @param {string} message 日志消息
 * @param {any} data 附加数据
 */
function debugLog(message, data) {
  if (DEBUG_MODE) {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
}

module.exports = {
  log,
  infoLog,
  warnLog,
  errorLog,
  debugLog
};
