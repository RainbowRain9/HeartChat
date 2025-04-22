import { AppOption } from '../typings';

describe('App', () => {
  let app: AppOption;

  beforeEach(() => {
    // 重置 App 实例
    app = getApp();
  });

  describe('globalData', () => {
    it('should have initial values', () => {
      expect(app.globalData).toBeDefined();
      expect(app.globalData.userInfo).toBeNull();
      expect(app.globalData.hasUserInfo).toBeFalsy();
      expect(app.globalData.canIUse).toBeTruthy();
    });
  });

  describe('wx API mocks', () => {
    it('should mock wx.showToast correctly', () => {
      wx.showToast({ title: 'Test Toast', icon: 'success' });
      expect(wx.showToast).toHaveBeenCalledWith({
        title: 'Test Toast',
        icon: 'success'
      });
    });

    it('should mock wx.getSystemInfoSync correctly', () => {
      const systemInfo = wx.getSystemInfoSync();
      expect(systemInfo).toMatchObject({
        platform: 'devtools',
        model: 'iPhone X',
        system: 'iOS 14.0'
      });
    });

    it('should mock wx.cloud.callFunction correctly', async () => {
      const mockResult = { result: { data: 'test' } };
      (wx.cloud.callFunction as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await wx.cloud.callFunction({
        name: 'test',
        data: { foo: 'bar' }
      });

      expect(wx.cloud.callFunction).toHaveBeenCalledWith({
        name: 'test',
        data: { foo: 'bar' }
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('custom matchers', () => {
    it('should use custom toBeWithinRange matcher', () => {
      expect(5).toBeWithinRange(1, 10);
      expect(11).not.toBeWithinRange(1, 10);
    });
  });
}); 