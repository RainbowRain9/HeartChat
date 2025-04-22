import { emotionPractices } from '../../../config';

interface IPageInstance {
  data: PracticePageData;
  loadPractices: () => Promise<void>;
  loadProgress: () => Promise<void>;
  viewPractice: (e: WechatMiniprogram.TouchEvent) => void;
  completePractice: () => Promise<void>;
  closeDetail: () => void;
}

Page<IPageInstance>({
  data: {
    loading: false,
    practices: [],
    currentPractice: null,
    progress: {
      completed: [],
      createTime: new Date(),
      updateTime: new Date()
    },
    showDetail: false
  },

  onLoad() {
    this.loadPractices();
    this.loadProgress();
  },

  // 加载练习列表
  async loadPractices() {
    try {
      this.setData({ loading: true });
      // 从配置文件获取练习列表
      const practices: EmotionPractice[] = emotionPractices.map(p => ({
        ...p,
        completed: false
      }));
      this.setData({ practices });
    } catch (err) {
      console.error('加载练习列表失败:', err);
      wx.showToast({
        title: '加载练习列表失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载练习进度
  async loadProgress() {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection<PracticeProgress>('practice_progress')
        .where({
          _openid: getApp<WechatMiniprogram.App.Instance>().globalData.userInfo?.openid
        })
        .get();

      if (data.length) {
        const progress = data[0];
        this.setData({
          progress,
          practices: this.data.practices.map(p => ({
            ...p,
            completed: progress.completed?.includes(p.id)
          }))
        });
      }
    } catch (err) {
      console.error('加载练习进度失败:', err);
    }
  },

  // 查看练习详情
  viewPractice(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    const practice = this.data.practices.find(p => p.id === id);
    if (practice) {
      this.setData({
        currentPractice: practice,
        showDetail: true
      });
    }
  },

  // 完成练习
  async completePractice() {
    if (!this.data.currentPractice) return;

    try {
      this.setData({ loading: true });
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 更新或创建进度记录
      if (this.data.progress._id) {
        await db.collection('practice_progress').doc(this.data.progress._id).update({
          data: {
            completed: _.addToSet(this.data.currentPractice.id),
            updateTime: db.serverDate()
          }
        });
      } else {
        await db.collection('practice_progress').add({
          data: {
            completed: [this.data.currentPractice.id],
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
      }

      // 更新本地数据
      const practices = this.data.practices.map(p => ({
        ...p,
        completed: p.id === this.data.currentPractice.id ? true : p.completed
      }));

      this.setData({ 
        practices,
        showDetail: false,
        currentPractice: null
      });

      wx.showToast({
        title: '练习完成',
        icon: 'success'
      });
    } catch (err) {
      console.error('更新练习进度失败:', err);
      wx.showToast({
        title: '更新进度失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 关闭详情
  closeDetail() {
    this.setData({
      showDetail: false,
      currentPractice: null
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: '情绪练习 - 提升情绪管理能力',
      path: '/packageA/pages/emotion/practice'
    };
  }
}); 