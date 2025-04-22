// welcome.js - 欢迎页面交互逻辑

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('Welcome page loaded');
    
    // 获取当前日期和时间
    updateDateTime();
    
    // 每分钟更新一次时间
    setInterval(updateDateTime, 60000);
    
    // 添加登录按钮点击事件
    const loginLink = document.querySelector('.welcome-link a');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginModal();
        });
    }
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

// 显示登录模态框
function showLoginModal() {
    // 创建模态框元素
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    
    // 模态框内容
    modal.innerHTML = `
        <div class="bg-white rounded-xl w-5/6 overflow-hidden">
            <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-lg text-center">登录</h3>
            </div>
            <div class="p-4">
                <div class="mb-4">
                    <input type="text" class="ios-input" placeholder="用户名/手机号">
                </div>
                <div class="mb-6">
                    <input type="password" class="ios-input" placeholder="密码">
                </div>
                <a href="home.html" class="ios-button block mb-4">登录</a>
                <p class="text-center text-sm text-gray-500">
                    没有账号？<a href="#" class="text-indigo-500">注册</a>
                </p>
            </div>
            <div class="p-4 bg-gray-50 flex justify-end">
                <button class="text-gray-500 px-4 py-2" onclick="closeModal(this)">取消</button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 点击背景关闭模态框
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 关闭模态框
function closeModal(button) {
    const modal = button.closest('.fixed');
    document.body.removeChild(modal);
}
