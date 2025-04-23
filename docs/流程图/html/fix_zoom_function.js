// 修复所有HTML文件中的放大功能
const fs = require('fs');
const path = require('path');

// 获取HTML文件目录
const htmlDir = __dirname;

// 读取所有HTML文件
const htmlFiles = fs.readdirSync(htmlDir).filter(file => 
    file.endsWith('.html') && 
    file !== 'HeartChat流程图总览.html' &&
    file !== 'HeartChat功能实现流程图.html' &&
    file !== 'HeartChat系统架构图.html' &&
    file !== 'HeartChat数据库结构图.html'
);

// 修复openZoomModal函数
const oldOpenZoomModalPattern = /function openZoomModal\(mermaidDiv, title\) \{[\s\S]*?currentScale = 1;[\s\S]*?updateZoom\(\);[\s\S]*?modal\.querySelector\('\.zoom-level'\)\.textContent = '100%';[\s\S]*?\}/;
const newOpenZoomModal = `function openZoomModal(mermaidDiv, title) {
            const modal = document.querySelector('.modal');
            const modalTitle = modal.querySelector('.modal-title');
            const modalDiagram = modal.querySelector('.modal-diagram');
            
            // 重置缩放
            currentScale = 1;
            
            // 设置模态框标题
            modalTitle.textContent = title;
            
            // 清空并复制流程图
            modalDiagram.innerHTML = '';
            const clonedDiagram = mermaidDiv.cloneNode(true);
            modalDiagram.appendChild(clonedDiagram);
            
            // 显示模态框
            modal.style.display = 'block';
            
            // 重新渲染Mermaid图表
            mermaid.init(undefined, modalDiagram.querySelectorAll('.mermaid'));
            
            // 更新缩放显示
            modal.querySelector('.zoom-level').textContent = '100%';
            
            // 重置图表缩放比例（在渲染完成后调用）
            setTimeout(function() {
                const mermaidDiv = modal.querySelector('.mermaid');
                if (mermaidDiv) {
                    mermaidDiv.style.transform = 'scale(1)';
                }
            }, 100);
        }`;

// 修复重复的openZoomModal函数
const duplicateOpenZoomModalPattern = /\/\/ 导出流程图为图片\s*\/\/ 打开放大模态框\s*function openZoomModal\(mermaidDiv, title\) \{/;
const fixedExportDiagram = `// 导出流程图为图片
        function exportDiagram(mermaidDiv, title) {`;

// 更新所有HTML文件
htmlFiles.forEach(file => {
    try {
        const filePath = path.join(htmlDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 修复openZoomModal函数
        if (content.includes('function openZoomModal')) {
            content = content.replace(oldOpenZoomModalPattern, newOpenZoomModal);
            
            // 修复重复的openZoomModal函数
            if (content.match(duplicateOpenZoomModalPattern)) {
                content = content.replace(duplicateOpenZoomModalPattern, fixedExportDiagram);
            }
            
            // 写回文件
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed ${file}`);
        } else {
            console.log(`${file} doesn't have openZoomModal function, skipping...`);
        }
    } catch (error) {
        console.error(`Error fixing ${file}:`, error);
    }
});

console.log('All files fixed successfully!');
