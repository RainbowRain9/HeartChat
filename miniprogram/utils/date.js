/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:MM 格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date) {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM:SS 格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取相对日期（如：今天、昨天、前天）
 * @param {Date} date 日期对象
 * @returns {string} 相对日期字符串
 */
function getRelativeDate(date) {
  if (!date || !(date instanceof Date)) {
    return '未知日期';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - targetDate) / (24 * 60 * 60 * 1000));
  
  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays === 2) {
    return '前天';
  } else if (diffDays > 2 && diffDays <= 7) {
    return `${diffDays}天前`;
  } else {
    return formatDate(date);
  }
}

/**
 * 获取日期范围
 * @param {number} days 天数
 * @param {Date} endDate 结束日期，默认为今天
 * @returns {Object} 包含开始日期和结束日期的对象
 */
function getDateRange(days, endDate = new Date()) {
  const end = new Date(endDate);
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

/**
 * 解析日期字符串为Date对象
 * @param {string} dateStr 日期字符串 (YYYY-MM-DD 或 YYYY/MM/DD)
 * @returns {Date} 日期对象
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  // 处理不同的日期分隔符
  const normalizedDateStr = dateStr.replace(/\//g, '-');
  
  // 尝试解析日期
  const date = new Date(normalizedDateStr);
  
  // 检查是否为有效日期
  if (isNaN(date.getTime())) {
    console.error('无效的日期字符串:', dateStr);
    return new Date();
  }
  
  return date;
}

/**
 * 获取两个日期之间的天数
 * @param {Date|string} startDate 开始日期
 * @param {Date|string} endDate 结束日期
 * @returns {number} 天数
 */
function getDaysBetween(startDate, endDate) {
  // 确保输入是Date对象
  const start = startDate instanceof Date ? startDate : parseDate(startDate);
  const end = endDate instanceof Date ? endDate : parseDate(endDate);
  
  // 设置为当天的开始时间
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // 计算天数差
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * 获取当月的天数
 * @param {Date} date 日期对象
 * @returns {number} 当月天数
 */
function getDaysInMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return new Date(year, month, 0).getDate();
}

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeDate,
  getDateRange,
  parseDate,
  getDaysBetween,
  getDaysInMonth
};
