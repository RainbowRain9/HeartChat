# UI组件库

<cite>
**本文档引用文件**  
- [emotion-panel.js](file://miniprogram/components/emotion-panel/emotion-panel.js)
- [interest-tag-cloud.js](file://miniprogram/components/interest-tag-cloud/interest-tag-cloud.js)
- [model-selector.js](file://miniprogram/components/model-selector/model-selector.js)
- [ec-canvas.js](file://miniprogram/components/ec-canvas/ec-canvas.js)
- [theme.json](file://miniprogram/theme.json)
- [用户兴趣标签云组件使用示例.md](file://doc/使用文档/用户兴趣标签云组件使用示例.md)
</cite>

## 目录
1. [介绍](#介绍)
2. [emotion-panel 组件](#emotion-panel-组件)
3. [interest-tag-cloud 组件](#interest-tag-cloud-组件)
4. [model-selector 组件](#model-selector-组件)
5. [ec-canvas 组件](#ec-canvas-组件)
6. [暗黑模式支持](#暗黑模式支持)
7. [总结](#总结)

## 介绍
本文档详细介绍了 HeartChat 小程序中的核心 UI 组件，包括其视觉样式、交互行为、属性、事件、插槽及使用方法。重点涵盖 `emotion-panel`、`interest-tag-cloud`、`model-selector` 和 `ec-canvas` 四个可复用组件，并说明其在暗黑模式下的适配机制。

## emotion-panel 组件

`emotion-panel` 组件用于展示情感分析结果的详细信息面板，支持动态数据绑定和用户交互。

### 视觉样式与交互行为
该组件以模态面板形式展示情感分析的核心指标，包括情感极性、强度、趋势及关键词。用户可通过点击关闭按钮、切换角色、保存记录或查看历史来触发相应操作。组件设计简洁，信息层级清晰，适合在聊天或情绪分析场景中使用。

### 适用场景
- 情感分析结果展示
- 用户情绪回顾与记录
- 角色切换引导

### 属性（Properties）
| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| emotion | Object | null | 情感分析结果对象，包含 valence、intensity、trend 等字段 |
| show | Boolean | false | 是否显示面板 |
| darkMode | Boolean | false | 是否启用暗色主题 |

### 事件（Events）
| 事件名 | 说明 | 携带数据 |
|--------|------|----------|
| close | 用户点击关闭按钮时触发 | 无 |
| switchRole | 用户点击“切换角色”时触发 | `{ emotion: 当前情感数据 }` |
| save | 用户点击“保存记录”时触发 | `{ emotion: 当前情感数据 }` |
| history | 用户点击“查看历史”时触发 | 无 |

### 插槽（Slots）
该组件无插槽定义。

### WXML 使用示例
```xml
<emotion-panel 
  emotion="{{currentEmotion}}" 
  show="{{showEmotionPanel}}" 
  darkMode="{{isDarkMode}}" 
  bind:close="onClosePanel" 
  bind:switchRole="onSwitchRole" 
  bind:save="onSaveEmotion" 
  bind:history="onViewHistory">
</emotion-panel>
```

**Section sources**
- [emotion-panel.js](file://miniprogram/components/emotion-panel/emotion-panel.js#L1-L118)

## interest-tag-cloud 组件

`interest-tag-cloud` 组件用于可视化展示用户的兴趣标签，支持字体大小加权、颜色分类和交互点击。

### 视觉样式与交互行为
标签云中的每个标签根据其权重动态调整字体大小，分类标签使用预设颜色区分。用户可点击标签查看详情，也可通过刷新按钮手动更新数据。组件支持响应式布局，适配不同屏幕尺寸。

### 适用场景
- 用户画像展示
- 兴趣偏好分析
- 个性化推荐入口

### 属性（Properties）
| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userId | String | '' | 用户唯一标识，必填 |
| maxTags | Number | 20 | 最大显示标签数量 |
| minFontSize | Number | 12 | 标签最小字体大小（px） |
| maxFontSize | Number | 24 | 标签最大字体大小（px） |
| colorMap | Object | 预设颜色映射 | 白天模式下分类颜色映射 |
| darkModeColorMap | Object | 预设暗色映射 | 暗黑模式下分类颜色映射 |
| showCategory | Boolean | true | 是否显示分类信息 |
| autoRefresh | Boolean | false | 是否在组件挂载时自动加载数据 |
| darkMode | Boolean | false | 是否启用暗黑模式 |
| showTitle | Boolean | true | 是否显示标题 |
| showRefreshButton | Boolean | true | 是否显示刷新按钮 |
| useCategories | Boolean | true | 是否使用分类数据而非关键词数据 |

### 事件（Events）
| 事件名 | 说明 | 携带数据 |
|--------|------|----------|
| tagclick | 用户点击某个标签时触发 | `{ tag: { name, value, category, color } }` |
| loaded | 标签数据加载完成后触发 | `{ tags: Array }` |
| error | 数据加载失败时触发 | `{ error: 错误信息 }` |
| refresh | 用户点击刷新按钮时触发 | 无 |

### 方法（Methods）
| 方法名 | 参数 | 说明 |
|--------|------|------|
| loadTags | forceRefresh: Boolean | 加载标签数据，`forceRefresh=true` 时强制刷新缓存 |
| handleRefresh | 无 | 手动触发刷新逻辑，同时触发 `refresh` 事件 |

### WXML 使用示例
```xml
<interest-tag-cloud 
  id="interestTagCloud"
  userId="{{openId}}"
  maxTags="30"
  minFontSize="12"
  maxFontSize="20"
  showCategory="{{true}}"
  darkMode="{{isDarkMode}}"
  bind:tagclick="handleTagClick"
  bind:loaded="handleTagsLoaded"
  bind:error="handleTagsError"
  bind:refresh="handleRefresh">
</interest-tag-cloud>
```

### JS 调用示例
```javascript
// 手动加载标签
const tagCloud = this.selectComponent('#interestTagCloud');
tagCloud.loadTags(true);
```

**Section sources**
- [interest-tag-cloud.js](file://miniprogram/components/interest-tag-cloud/interest-tag-cloud.js#L1-L256)
- [用户兴趣标签云组件使用示例.md](file://doc/使用文档/用户兴趣标签云组件使用示例.md#L1-L166)

## model-selector 组件

`model-selector` 组件提供 AI 模型选择功能，支持多模型切换与状态管理。

### 视觉样式与交互行为
组件以下拉选择器形式呈现，用户可选择不同的 AI 模型类型（如智谱、Gemini、OpenAI 等），并进一步选择具体模型。界面包含模型图标、名称、简短描述及 API 状态提示，交互流畅，支持懒加载与连接测试。

### 适用场景
- AI 模型切换
- 多模型能力展示
- 开发者调试与测试

### 属性（Properties）
| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| darkMode | Boolean | false | 是否启用暗黑模式 |

### 事件（Events）
| 事件名 | 说明 | 携带数据 |
|--------|------|----------|
| modelChange | 模型切换成功后触发 | `{ modelType, modelName }` |

### 方法（Methods）
| 方法名 | 参数 | 说明 |
|--------|------|------|
| showModelSelector | 无 | 显示模型选择器弹窗 |
| hideModelSelector | 无 | 隐藏模型选择器弹窗 |
| selectModelType | modelType | 选择模型类型并测试连接 |
| selectModel | modelName | 选择具体模型并保存设置 |

### WXML 使用示例
```xml
<model-selector 
  darkMode="{{isDarkMode}}" 
  bind:modelChange="onModelChange">
</model-selector>
```

**Section sources**
- [model-selector.js](file://miniprogram/components/model-selector/model-selector.js#L1-L342)

## ec-canvas 组件

`ec-canvas` 是基于 ECharts 的微信小程序图表组件，用于渲染各类数据可视化图表。

### 视觉样式与交互行为
该组件封装了 ECharts 在小程序环境下的初始化逻辑，支持触摸事件（如点击、缩放）和动态数据更新。图表类型包括折线图、柱状图、饼图等，适用于情绪波动、统计报告等数据展示场景。

### 适用场景
- 情绪历史趋势图
- 用户行为统计
- 每日心情报告可视化

### 属性（Properties）
| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| canvasId | String | 'ec-canvas' | Canvas 元素 ID |
| ec | Object | 无 | ECharts 配置对象，包含 `onInit` 回调 |
| forceUseOldCanvas | Boolean | false | 强制使用旧版 Canvas 渲染 |

### 事件（Events）
| 事件名 | 说明 | 携带数据 |
|--------|------|----------|
| init | 图表初始化完成后触发 | `{ canvas, width, height, dpr }` |

### 图表配置传递
通过 `ec` 属性传递 ECharts 配置项，示例如下：
```javascript
Page({
  data: {
    ec: {
      onInit: function(canvas, width, height, dpr) {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(chart);
        chart.setOption({
          title: { text: '情绪波动趋势' },
          tooltip: {},
          xAxis: { type: 'category', data: ['周一', '周二', '周三'] },
          yAxis: { type: 'value' },
          series: [{ data: [80, 90, 75], type: 'line' }]
        });
        return chart;
      }
    }
  }
});
```

### 动态更新数据
通过组件实例获取 `chart` 对象并调用 `setOption` 方法更新数据：
```javascript
const ecComponent = this.selectComponent('#mychart');
if (ecComponent && ecComponent.chart) {
  ecComponent.chart.setOption({
    series: [{ data: newData }]
  });
}
```

### WXML 使用示例
```xml
<ec-canvas id="mychart" canvas-id="mychart" ec="{{ec}}" />
```

**Section sources**
- [ec-canvas.js](file://miniprogram/components/ec-canvas/ec-canvas.js#L1-L285)

## 暗黑模式支持

所有 UI 组件均支持通过 `darkMode` 属性响应暗黑模式切换，主题样式由 `theme.json` 文件统一定义。

### 主题配置机制
`theme.json` 定义了白天与暗黑两种主题的样式变量，包括背景色、文字色、边框色、阴影等。组件通过绑定 `darkMode` 属性动态切换样式类或颜色映射。

### 组件适配说明
- **emotion-panel**：根据 `darkMode` 切换背景与文字颜色。
- **interest-tag-cloud**：使用 `colorMap` 与 `darkModeColorMap` 分别定义白天与暗黑模式下的分类颜色。
- **model-selector**：整体界面颜色随主题变化，确保可读性。
- **ec-canvas**：图表颜色需在 `onInit` 中根据 `darkMode` 动态设置，建议使用主题变量。

### 主题变量示例（theme.json）
```json
{
  "light": {
    "color-text-base": "#212529",
    "color-bg-base": "#ffffff"
  },
  "dark": {
    "color-text-base": "#f8f9fa",
    "color-bg-base": "#212529"
  }
}
```

### 使用建议
在页面或组件中监听主题变化事件，并同步更新 `darkMode` 属性：
```javascript
onLoad() {
  const isDarkMode = wx.getSystemInfoSync().theme === 'dark';
  this.setData({ isDarkMode });
}
```

**Section sources**
- [theme.json](file://miniprogram/theme.json#L1-L76)

## 总结
本文档全面介绍了 HeartChat 项目中的核心 UI 组件，涵盖其属性、事件、方法及使用方式。各组件均具备良好的可定制性与可访问性，支持暗黑模式，并通过事件机制实现灵活交互。ECharts 集成组件 `ec-canvas` 提供了强大的数据可视化能力，适用于多种数据分析场景。