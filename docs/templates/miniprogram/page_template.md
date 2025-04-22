# 页面模板

## 目录结构

```
pages/page-name/
├── index.js       # 页面逻辑
├── index.json     # 页面配置
├── index.wxml     # 页面结构
└── index.wxss     # 页面样式
```

## 页面逻辑 (index.js)

```javascript
// pages/page-name/index.js

// 获取应用实例
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    title: '页面标题',
    loading: true,
    error: null,
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取页面参数
    const { id } = options;
    
    // 设置页面数据
    this.setData({
      id
    });
    
    // 加载初始数据
    this.loadData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面初次渲染完成后执行
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时执行
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏时执行
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载时执行
    // 清理资源、取消订阅等
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 重置页码
    this.setData({
      page: 1,
      hasMore: true
    });
    
    // 重新加载数据
    this.loadData().then(() => {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 如果还有更多数据，加载下一页
    if (this.data.hasMore) {
      this.loadMoreData();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: this.data.title,
      path: `/pages/page-name/index?id=${this.data.id}`
    };
  },
  
  /**
   * 加载数据
   */
  async loadData() {
    try {
      this.setData({ loading: true, error: null });
      
      // 调用云函数获取数据
      const result = await wx.cloud.callFunction({
        name: 'function-name',
        data: {
          action: 'getData',
          params: {
            page: this.data.page,
            pageSize: this.data.pageSize
          }
        }
      });
      
      // 检查结果
      if (!result.result.success) {
        throw new Error(result.result.error.message || '加载失败');
      }
      
      // 更新数据
      const { list, total } = result.result.data;
      
      this.setData({
        list,
        loading: false,
        hasMore: list.length >= this.data.pageSize
      });
    } catch (error) {
      console.error('Load data error:', error);
      
      this.setData({
        loading: false,
        error: error.message || '加载失败，请重试'
      });
      
      // 显示错误提示
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },
  
  /**
   * 加载更多数据
   */
  async loadMoreData() {
    if (this.data.loading || !this.data.hasMore) {
      return;
    }
    
    try {
      this.setData({
        loading: true,
        page: this.data.page + 1
      });
      
      // 调用云函数获取更多数据
      const result = await wx.cloud.callFunction({
        name: 'function-name',
        data: {
          action: 'getData',
          params: {
            page: this.data.page,
            pageSize: this.data.pageSize
          }
        }
      });
      
      // 检查结果
      if (!result.result.success) {
        throw new Error(result.result.error.message || '加载失败');
      }
      
      // 更新数据
      const { list } = result.result.data;
      
      this.setData({
        list: [...this.data.list, ...list],
        loading: false,
        hasMore: list.length >= this.data.pageSize
      });
    } catch (error) {
      console.error('Load more data error:', error);
      
      this.setData({
        loading: false,
        page: this.data.page - 1,
        error: error.message || '加载失败，请重试'
      });
      
      // 显示错误提示
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },
  
  /**
   * 处理项目点击
   */
  handleItemTap(event) {
    const { id } = event.currentTarget.dataset;
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  },
  
  /**
   * 处理添加按钮点击
   */
  handleAddTap() {
    // 跳转到添加页面
    wx.navigateTo({
      url: '/pages/add/index'
    });
  },
  
  /**
   * 处理刷新按钮点击
   */
  handleRefreshTap() {
    this.loadData();
  }
});
```

## 页面配置 (index.json)

```json
{
  "navigationBarTitleText": "页面标题",
  "enablePullDownRefresh": true,
  "backgroundColor": "#f8f8f8",
  "usingComponents": {
    "loading": "/components/loading/index",
    "empty": "/components/empty/index",
    "item-card": "/components/item-card/index"
  }
}
```

## 页面结构 (index.wxml)

```html
<!-- pages/page-name/index.wxml -->

<view class="container">
  <!-- 头部 -->
  <view class="header">
    <view class="title">{{title}}</view>
    <view class="actions">
      <view class="action-btn" bindtap="handleRefreshTap">
        <text class="action-icon">↻</text>
        <text>刷新</text>
      </view>
      <view class="action-btn" bindtap="handleAddTap">
        <text class="action-icon">+</text>
        <text>添加</text>
      </view>
    </view>
  </view>
  
  <!-- 内容 -->
  <view class="content">
    <!-- 加载中 -->
    <loading wx:if="{{loading && page === 1}}" />
    
    <!-- 错误提示 -->
    <view wx:if="{{error && !loading && list.length === 0}}" class="error-container">
      <view class="error-message">{{error}}</view>
      <view class="error-action" bindtap="handleRefreshTap">重试</view>
    </view>
    
    <!-- 空状态 -->
    <empty wx:if="{{!loading && !error && list.length === 0}}" 
           text="暂无数据" 
           buttonText="添加" 
           bindtap="handleAddTap" />
    
    <!-- 列表内容 -->
    <view wx:if="{{list.length > 0}}" class="list-container">
      <view class="list">
        <block wx:for="{{list}}" wx:key="id">
          <item-card item="{{item}}" 
                    data-id="{{item.id}}" 
                    bindtap="handleItemTap" />
        </block>
      </view>
      
      <!-- 加载更多 -->
      <view wx:if="{{loading && page > 1}}" class="loading-more">
        <text>加载中...</text>
      </view>
      
      <!-- 没有更多 -->
      <view wx:if="{{!loading && !hasMore && list.length > 0}}" class="no-more">
        <text>没有更多数据了</text>
      </view>
    </view>
  </view>
  
  <!-- 底部 -->
  <view class="footer">
    <text class="footer-text">© 2023 HeartChat</text>
  </view>
</view>
```

## 页面样式 (index.wxss)

```css
/* pages/page-name/index.wxss */

/* 容器 */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30rpx;
}

/* 头部 */
.header {
  padding: 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 28rpx;
  color: #4a90e2;
}

.action-icon {
  font-size: 32rpx;
}

/* 内容 */
.content {
  flex: 1;
  padding: 30rpx;
}

/* 错误提示 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.error-message {
  font-size: 28rpx;
  color: #ff6b6b;
  margin-bottom: 20rpx;
}

.error-action {
  font-size: 28rpx;
  color: #4a90e2;
  padding: 10rpx 30rpx;
  border: 1rpx solid #4a90e2;
  border-radius: 30rpx;
}

/* 列表 */
.list-container {
  margin-top: 20rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 加载更多 */
.loading-more {
  text-align: center;
  padding: 20rpx 0;
  font-size: 24rpx;
  color: #999;
}

/* 没有更多 */
.no-more {
  text-align: center;
  padding: 20rpx 0;
  font-size: 24rpx;
  color: #999;
}

/* 底部 */
.footer {
  text-align: center;
  padding: 20rpx 0;
  font-size: 24rpx;
  color: #999;
}
```

## 使用说明

1. 创建页面时，复制此模板并根据实际需求修改
2. 修改页面标题、数据结构和业务逻辑
3. 根据需要调整页面布局和样式
4. 添加必要的错误处理和加载状态
5. 根据实际情况调整生命周期函数

## 常见页面类型

### 列表页面

- 显示数据列表
- 支持下拉刷新和上拉加载更多
- 提供添加、刷新等操作
- 点击列表项跳转到详情页

### 详情页面

- 显示单个项目的详细信息
- 提供编辑、删除等操作
- 可能包含多个标签页或折叠面板

### 表单页面

- 用于数据录入或编辑
- 包含各种表单控件
- 提供表单验证
- 提供提交和取消操作

### 结果页面

- 显示操作结果（成功或失败）
- 提供后续操作选项
- 可能包含自动跳转逻辑

## 最佳实践

1. 使用 `async/await` 处理异步操作
2. 使用 `try/catch` 捕获异常
3. 提供加载状态和错误提示
4. 使用 `wx:if` 和 `wx:for` 进行条件渲染和列表渲染
5. 使用自定义组件提高代码复用性
6. 使用 `data-*` 属性传递数据
7. 避免在模板中使用复杂表达式
8. 使用 BEM 命名规范组织样式
9. 使用 rpx 单位实现响应式布局
10. 避免过度使用全局状态
