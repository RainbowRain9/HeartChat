# 自定义组件模板

## 目录结构

```
components/component-name/
├── index.js       # 组件逻辑
├── index.json     # 组件配置
├── index.wxml     # 组件结构
└── index.wxss     # 组件样式
```

## 组件逻辑 (index.js)

```javascript
// components/component-name/index.js

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 基本属性
    title: {
      type: String,
      value: ''
    },
    description: {
      type: String,
      value: ''
    },
    // 对象属性
    item: {
      type: Object,
      value: {}
    },
    // 数组属性
    list: {
      type: Array,
      value: []
    },
    // 布尔属性
    loading: {
      type: Boolean,
      value: false
    },
    // 数字属性
    maxCount: {
      type: Number,
      value: 10
    },
    // 带观察器的属性
    status: {
      type: Number,
      value: 0,
      observer(newVal, oldVal) {
        // 属性变化时执行
        this._statusChanged(newVal, oldVal);
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    innerValue: '',
    activeIndex: 0,
    showContent: false
  },

  /**
   * 组件的选项
   */
  options: {
    // 在组件定义时的选项中启用多slot支持
    multipleSlots: true,
    // 组件样式隔离
    styleIsolation: 'isolated',
    // 虚拟化组件节点
    virtualHost: true,
    // 外部样式类
    externalClasses: ['custom-class', 'header-class', 'content-class']
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    created() {
      // 组件实例刚刚被创建时执行
      console.log('Component created');
    },
    attached() {
      // 组件实例进入页面节点树时执行
      this._init();
    },
    ready() {
      // 组件在视图层布局完成后执行
      console.log('Component ready');
    },
    moved() {
      // 组件实例被移动到节点树另一个位置时执行
      console.log('Component moved');
    },
    detached() {
      // 组件实例被从页面节点树移除时执行
      this._cleanup();
    },
    error(error) {
      // 组件方法抛出错误时执行
      console.error('Component error:', error);
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show() {
      // 页面被展示时执行
      console.log('Page show');
    },
    hide() {
      // 页面被隐藏时执行
      console.log('Page hide');
    },
    resize(size) {
      // 页面尺寸变化时执行
      console.log('Page resize:', size);
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化组件
     * @private
     */
    _init() {
      // 初始化内部数据
      this.setData({
        innerValue: this.properties.title
      });
    },

    /**
     * 清理组件资源
     * @private
     */
    _cleanup() {
      // 清理资源，如定时器、事件监听等
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    },

    /**
     * 状态变化处理
     * @private
     * @param {number} newVal - 新状态值
     * @param {number} oldVal - 旧状态值
     */
    _statusChanged(newVal, oldVal) {
      // 处理状态变化
      console.log('Status changed:', oldVal, '->', newVal);
      
      // 根据状态更新UI
      this.setData({
        showContent: newVal === 1
      });
    },

    /**
     * 处理点击事件
     * @public
     * @param {Object} event - 事件对象
     */
    handleTap(event) {
      const { index } = event.currentTarget.dataset;
      
      // 更新内部状态
      this.setData({
        activeIndex: index
      });
      
      // 触发自定义事件
      this.triggerEvent('tap', {
        index,
        item: this.data.list[index]
      });
    },

    /**
     * 处理输入事件
     * @public
     * @param {Object} event - 事件对象
     */
    handleInput(event) {
      const { value } = event.detail;
      
      // 更新内部状态
      this.setData({
        innerValue: value
      });
      
      // 触发自定义事件
      this.triggerEvent('input', { value });
    },

    /**
     * 处理确认事件
     * @public
     */
    handleConfirm() {
      // 验证数据
      if (!this.data.innerValue) {
        wx.showToast({
          title: '请输入内容',
          icon: 'none'
        });
        return;
      }
      
      // 触发自定义事件
      this.triggerEvent('confirm', {
        value: this.data.innerValue
      });
      
      // 重置内部状态
      this.setData({
        innerValue: ''
      });
    },

    /**
     * 切换内容显示状态
     * @public
     */
    toggleContent() {
      this.setData({
        showContent: !this.data.showContent
      });
    },

    /**
     * 对外暴露的方法，可通过 selectComponent 调用
     * @public
     * @param {string} value - 要设置的值
     */
    setValue(value) {
      this.setData({
        innerValue: value
      });
      return true;
    },

    /**
     * 对外暴露的方法，获取组件内部值
     * @public
     * @returns {string} 内部值
     */
    getValue() {
      return this.data.innerValue;
    },

    /**
     * 重置组件状态
     * @public
     */
    reset() {
      this.setData({
        innerValue: '',
        activeIndex: 0,
        showContent: false
      });
    }
  }
});
```

## 组件配置 (index.json)

```json
{
  "component": true,
  "usingComponents": {
    "icon": "/components/icon/index",
    "loading": "/components/loading/index"
  }
}
```

## 组件结构 (index.wxml)

```html
<!-- components/component-name/index.wxml -->

<view class="component custom-class">
  <!-- 头部 -->
  <view class="component__header header-class">
    <view class="component__title">{{title}}</view>
    <view class="component__action" bindtap="toggleContent">
      <icon name="{{showContent ? 'up' : 'down'}}" size="32rpx" />
    </view>
  </view>
  
  <!-- 加载状态 -->
  <loading wx:if="{{loading}}" />
  
  <!-- 内容区域 -->
  <view class="component__content content-class" wx:if="{{showContent && !loading}}">
    <!-- 描述 -->
    <view class="component__description" wx:if="{{description}}">
      {{description}}
    </view>
    
    <!-- 列表 -->
    <view class="component__list" wx:if="{{list.length > 0}}">
      <block wx:for="{{list}}" wx:key="index">
        <view class="component__item {{activeIndex === index ? 'component__item--active' : ''}}"
              data-index="{{index}}"
              bindtap="handleTap">
          <view class="component__item-content">{{item.name || item}}</view>
        </view>
      </block>
    </view>
    
    <!-- 输入区域 -->
    <view class="component__input-area">
      <input class="component__input"
             value="{{innerValue}}"
             placeholder="请输入内容"
             bindinput="handleInput" />
      <view class="component__button" bindtap="handleConfirm">确认</view>
    </view>
    
    <!-- 插槽：自定义内容 -->
    <slot name="content"></slot>
  </view>
  
  <!-- 底部 -->
  <view class="component__footer">
    <!-- 插槽：底部内容 -->
    <slot name="footer"></slot>
  </view>
</view>
```

## 组件样式 (index.wxss)

```css
/* components/component-name/index.wxss */

/* 组件容器 */
.component {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20rpx;
}

/* 头部 */
.component__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.component__title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.component__action {
  padding: 10rpx;
}

/* 内容区域 */
.component__content {
  padding: 24rpx;
}

.component__description {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  line-height: 1.5;
}

/* 列表 */
.component__list {
  margin-bottom: 20rpx;
}

.component__item {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.component__item:last-child {
  border-bottom: none;
}

.component__item--active {
  background-color: #f8f8f8;
}

.component__item-content {
  font-size: 28rpx;
  color: #333;
}

/* 输入区域 */
.component__input-area {
  display: flex;
  margin-top: 20rpx;
}

.component__input {
  flex: 1;
  height: 80rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.component__button {
  width: 120rpx;
  height: 80rpx;
  background-color: #4a90e2;
  color: #fff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  margin-left: 20rpx;
}

/* 底部 */
.component__footer {
  padding: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}
```

## 使用示例

### 基本使用

```html
<!-- 在页面中使用组件 -->
<component-name
  title="组件标题"
  description="组件描述文本"
  loading="{{loading}}"
  list="{{dataList}}"
  status="{{status}}"
  bind:tap="handleItemTap"
  bind:confirm="handleConfirm"
  custom-class="my-component"
></component-name>
```

### 使用插槽

```html
<!-- 使用插槽自定义内容 -->
<component-name title="带插槽的组件">
  <view slot="content">
    这是自定义内容区域
  </view>
  <view slot="footer">
    这是自定义底部区域
  </view>
</component-name>
```

### 使用外部样式类

```html
<!-- 使用外部样式类自定义样式 -->
<component-name
  title="自定义样式的组件"
  custom-class="custom-component"
  header-class="custom-header"
  content-class="custom-content"
></component-name>
```

```css
/* 页面样式文件中定义外部样式类 */
.custom-component {
  margin: 30rpx;
}

.custom-header {
  background-color: #f0f8ff;
}

.custom-content {
  background-color: #f9f9f9;
}
```

### 调用组件方法

```javascript
// 页面逻辑文件中调用组件方法
Page({
  onReady() {
    // 获取组件实例
    this.component = this.selectComponent('#myComponent');
  },
  
  setValue() {
    // 调用组件方法
    if (this.component) {
      this.component.setValue('新的值');
    }
  },
  
  getValue() {
    // 调用组件方法获取值
    if (this.component) {
      const value = this.component.getValue();
      console.log('组件值:', value);
    }
  },
  
  resetComponent() {
    // 调用组件重置方法
    if (this.component) {
      this.component.reset();
    }
  }
});
```

```html
<!-- 在页面中使用组件并设置id -->
<component-name id="myComponent" title="可调用方法的组件"></component-name>

<!-- 添加按钮调用组件方法 -->
<view class="button-group">
  <button bindtap="setValue">设置值</button>
  <button bindtap="getValue">获取值</button>
  <button bindtap="resetComponent">重置组件</button>
</view>
```

## 组件通信

### 父组件向子组件传递数据

通过属性（properties）传递：

```html
<!-- 父组件模板 -->
<component-name title="{{title}}" list="{{list}}"></component-name>
```

```javascript
// 父组件逻辑
Page({
  data: {
    title: '动态标题',
    list: ['项目1', '项目2', '项目3']
  }
});
```

### 子组件向父组件传递数据

通过事件（events）传递：

```javascript
// 子组件逻辑
Component({
  methods: {
    handleTap() {
      // 触发自定义事件，并传递数据
      this.triggerEvent('customEvent', {
        value: 'Hello from component'
      });
    }
  }
});
```

```html
<!-- 父组件模板 -->
<component-name bind:customEvent="onCustomEvent"></component-name>
```

```javascript
// 父组件逻辑
Page({
  onCustomEvent(event) {
    // 接收子组件传递的数据
    const { value } = event.detail;
    console.log('Received from component:', value);
  }
});
```

### 父组件调用子组件方法

通过 selectComponent 获取子组件实例并调用其方法：

```javascript
// 父组件逻辑
Page({
  callComponentMethod() {
    // 获取组件实例
    const component = this.selectComponent('#myComponent');
    
    // 调用组件方法
    if (component) {
      component.setValue('New value');
    }
  }
});
```

## 组件数据监听

### 使用 observers 监听数据变化

```javascript
Component({
  properties: {
    value: String
  },
  
  data: {
    innerValue: ''
  },
  
  observers: {
    // 监听单个属性
    'value': function(value) {
      this.setData({
        innerValue: value
      });
    },
    
    // 监听多个属性
    'prop1, prop2': function(prop1, prop2) {
      // 当 prop1 或 prop2 变化时执行
    },
    
    // 监听对象属性
    'object.field': function(field) {
      // 当 object.field 变化时执行
    },
    
    // 监听数组
    'array[0]': function(value) {
      // 当数组第一项变化时执行
    },
    
    // 使用通配符
    'array.**': function(array) {
      // 当数组或其任意子项变化时执行
    }
  }
});
```

## 最佳实践

1. 组件名使用连字符命名法（kebab-case），如 `custom-button`
2. 为组件属性提供默认值和类型定义
3. 使用私有方法命名前缀（如 `_init`）区分内部方法
4. 在 `detached` 生命周期中清理资源（定时器、事件监听等）
5. 使用 `triggerEvent` 触发自定义事件进行组件通信
6. 使用插槽（slot）提供内容定制能力
7. 使用外部样式类允许外部定制样式
8. 组件内部状态使用 `this.setData()` 更新，不直接修改 `this.data`
9. 使用 BEM 命名规范组织样式，避免样式冲突
10. 为复杂组件编写清晰的文档和使用示例
