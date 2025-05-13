// home.js - 首页交互逻辑

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');
    
    // 获取当前日期和时间
    updateDateTime();
    
    // 每分钟更新一次时间
    setInterval(updateDateTime, 60000);
});

// 更新日期和时间
function updateDateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    // 更新状态栏时间
    const statusTimeElements = document.querySelectorAll('.status-left');
    statusTimeElements.forEach(element => {
        element.textContent = `${hours}:${minutes}`;
    });
}
