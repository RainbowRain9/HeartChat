// 加密key
const CRYPTO_KEY = 'your-secret-key';

/**
 * 简单加密
 */
export const encrypt = (data: string): string => {
  try {
    // 这里使用简单的Base64编码，实际项目中应使用更安全的加密方法
    return wx.arrayBufferToBase64(new Uint8Array([...data].map(char => char.charCodeAt(0))));
  } catch (error) {
    console.error('Encrypt failed:', error);
    return data;
  }
};

/**
 * 简单解密
 */
export const decrypt = (encrypted: string): string => {
  try {
    // 这里使用简单的Base64解码，实际项目中应使用更安全的解密方法
    const buffer = wx.base64ToArrayBuffer(encrypted);
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  } catch (error) {
    console.error('Decrypt failed:', error);
    return encrypted;
  }
}; 