# 底部Tab页暗夜模式适配说明

## 问题描述

在HeartChat项目中，底部tab导航栏不会随着本地缓存的`darkMode`值的变化而切换为相应的亮色或暗色模式。即使用户手动切换了暗夜模式，底部tab栏的样式也不会跟随变化。

## 解决方案

通过在应用启动时和主题切换时，使用`wx.setTabBarStyle`API来手动设置底部tab栏的样式，确保其与当前的暗夜模式设置保持一致。

## 技术实现

### 1. 在app.js中添加updateTheme方法

在app.js中添加了一个全局的`updateTheme`方法，用于统一更新底部tab栏的样式：

```javascript
/**
 * 更新主题设置
 * @param {boolean} isDarkMode - 是否为暗黑模式
 */
updateTheme(isDarkMode) {
  try {
    // 设置当前页面的主题
    wx.setTabBarStyle({
      color: isDarkMode ? '#8a9aa9' : '#6c757d',
      selectedColor: isDarkMode ? '#4dabf7' : '#007bff',
      backgroundColor: isDarkMode ? '#1a1d20' : '#ffffff',
      borderStyle: isDarkMode ? 'black' : 'white',
      success: () => {
        console.log('设置TabBar样式成功，暗黑模式:', isDarkMode);
      },
      fail: (error) => {
        console.error('设置TabBar样式失败:', error);
      }
    });
  } catch (error) {
    console.error('更新主题设置失败:', error);
  }
}
```

### 2. 在应用启动和主题变化时调用updateTheme

在app.js的onLaunch方法中，当从本地缓存读取darkMode设置或使用系统主题设置时，调用updateTheme方法：

```javascript
// 根据本地缓存设置主题
this.updateTheme(darkModeValue);

// 或者

// 根据系统主题设置主题
this.updateTheme(this.globalData.darkMode);
```

同样，在系统主题变化的监听函数中也调用updateTheme方法：

```javascript
// 更新主题
this.updateTheme(darkModeValue);
```

### 3. 在各个tab页面的onShow方法中检查并更新主题

在home.js、user.js和role-select.js的onShow方法中，检查当前页面的darkMode是否与全局的darkMode一致，如果不一致，则更新页面的darkMode并调用updateTheme方法：

```javascript
// 检查主题变化
if (this.data.darkMode !== app.globalData.darkMode) {
  this.setData({
    darkMode: app.globalData.darkMode
  });
  
  // 更新TabBar样式
  if (app.updateTheme) {
    app.updateTheme(app.globalData.darkMode);
  } else {
    // 如果app中没有updateTheme方法，直接调用setTabBarStyle
    wx.setTabBarStyle({
      color: app.globalData.darkMode ? '#8a9aa9' : '#6c757d',
      selectedColor: app.globalData.darkMode ? '#4dabf7' : '#007bff',
      backgroundColor: app.globalData.darkMode ? '#1a1d20' : '#ffffff',
      borderStyle: app.globalData.darkMode ? 'black' : 'white'
    });
  }
}
```

### 4. 在切换暗黑模式的函数中调用updateTheme

在profile.js的toggleDarkMode方法中，当用户手动切换暗黑模式时，调用updateTheme方法：

```javascript
// 更新TabBar样式
if (app.updateTheme) {
  app.updateTheme(newDarkMode);
} else {
  // 如果app中没有updateTheme方法，直接调用setTabBarStyle
  wx.setTabBarStyle({
    color: newDarkMode ? '#8a9aa9' : '#6c757d',
    selectedColor: newDarkMode ? '#4dabf7' : '#007bff',
    backgroundColor: newDarkMode ? '#1a1d20' : '#ffffff',
    borderStyle: newDarkMode ? 'black' : 'white'
  });
}
```

## 效果

通过以上修改，底部tab导航栏现在可以根据本地缓存的darkMode值正确地切换为亮色或暗色模式，与应用的其他部分保持一致的主题风格。

- 当darkMode为true时，底部tab栏使用暗色背景（#1a1d20）、暗色边框（black）、灰色未选中文字（#8a9aa9）和蓝色选中文字（#4dabf7）
- 当darkMode为false时，底部tab栏使用亮色背景（#ffffff）、亮色边框（white）、灰色未选中文字（#6c757d）和蓝色选中文字（#007bff）

这些颜色值与theme.json中定义的主题变量保持一致，确保整个应用的视觉风格统一。
