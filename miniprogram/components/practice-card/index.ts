interface IPracticeData {
  // 练习ID
  id: string;
  // 练习标题
  title: string;
  // 练习描述
  description: string;
  // 练习类型
  type: 'breathing' | 'meditation' | 'writing' | 'exercise';
  // 练习时长(分钟)
  duration: number;
  // 练习进度
  progress: number;
  // 是否已完成
  completed: boolean;
  // 上次练习时间
  lastPracticeTime?: number;
}

Component({
  properties: {
    // 练习数据
    practice: {
      type: Object,
      value: {
        id: '',
        title: '',
        description: '',
        type: 'breathing',
        duration: 5,
        progress: 0,
        completed: false,
      } as IPracticeData,
    },
  },

  data: {
    // 练习类型图标
    typeIcons: {
      breathing: '/images/practice/breathing.svg',
      meditation: '/images/practice/meditation.svg',
      writing: '/images/practice/writing.svg',
      exercise: '/images/practice/exercise.svg',
    },
    // 练习类型颜色
    typeColors: {
      breathing: '#4d96ff',
      meditation: '#6c5ce7',
      writing: '#a8e6cf',
      exercise: '#ff6b6b',
    },
  },

  methods: {
    // 开始练习
    startPractice() {
      const { practice } = this.properties;
      this.triggerEvent('start', { id: practice.id });
    },

    // 继续练习
    continuePractice() {
      const { practice } = this.properties;
      this.triggerEvent('continue', { id: practice.id });
    },

    // 查看练习详情
    viewDetails() {
      const { practice } = this.properties;
      this.triggerEvent('details', { id: practice.id });
    },

    // 格式化时间
    formatTime(timestamp: number): string {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    // 格式化进度
    formatProgress(progress: number): string {
      return Math.round(progress * 100) + '%';
    },
  },
}); 