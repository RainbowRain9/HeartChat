class Format {
  /**
   * 格式化时间戳为日期时间字符串
   * @param {number} timestamp 时间戳
   * @param {string} format 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
   * @returns {string} 格式化后的字符串
   */
  static datetime(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month.toString().padStart(2, '0'))
      .replace('DD', day.toString().padStart(2, '0'))
      .replace('HH', hour.toString().padStart(2, '0'))
      .replace('mm', minute.toString().padStart(2, '0'))
      .replace('ss', second.toString().padStart(2, '0'));
  }

  /**
   * 格式化时间戳为相对时间
   * @param {number} timestamp 时间戳
   * @returns {string} 相对时间字符串
   */
  static relativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`;
    } else if (diff < month) {
      return `${Math.floor(diff / week)}周前`;
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`;
    } else {
      return `${Math.floor(diff / year)}年前`;
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes 字节数
   * @param {number} decimals 小数位数，默认2
   * @returns {string} 格式化后的字符串
   */
  static fileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * 格式化数字（添加千分位）
   * @param {number} num 数字
   * @param {number} decimals 小数位数，默认2
   * @returns {string} 格式化后的字符串
   */
  static number(num, decimals = 2) {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * 格式化金额
   * @param {number} amount 金额
   * @param {string} symbol 货币符号，默认'¥'
   * @param {number} decimals 小数位数，默认2
   * @returns {string} 格式化后的字符串
   */
  static currency(amount, symbol = '¥', decimals = 2) {
    return `${symbol}${Format.number(amount, decimals)}`;
  }

  /**
   * 格式化百分比
   * @param {number} value 值（0-1）
   * @param {number} decimals 小数位数，默认0
   * @returns {string} 格式化后的字符串
   */
  static percentage(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * 格式化手机号
   * @param {string} phone 手机号
   * @returns {string} 格式化后的字符串
   */
  static phone(phone) {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  /**
   * 格式化身份证号
   * @param {string} idCard 身份证号
   * @returns {string} 格式化后的字符串
   */
  static idCard(idCard) {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  }

  /**
   * 格式化银行卡号
   * @param {string} cardNo 银行卡号
   * @returns {string} 格式化后的字符串
   */
  static bankCard(cardNo) {
    return cardNo.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
  }

  /**
   * 格式化文本长度
   * @param {string} text 文本
   * @param {number} maxLength 最大长度
   * @param {string} suffix 后缀，默认'...'
   * @returns {string} 格式化后的字符串
   */
  static textLength(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + suffix;
  }
}

module.exports = Format;
