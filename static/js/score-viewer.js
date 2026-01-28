/**
 * 乐谱查看器模块
 * 用于在弹窗中显示 PDF 乐谱
 */

/**
 * 打开乐谱查看器
 * @param {string} pdfUrl - PDF 文件的 URL
 * @param {string} title - 乐谱标题
 */
function openScoreViewer(pdfUrl, title) {
    var dialog = document.getElementById('score-dialog');
    var titleEl = document.getElementById('score-title');
    var frame = document.getElementById('score-frame');
    
    if (titleEl) titleEl.textContent = title || '乐谱';
    if (frame) frame.src = pdfUrl;
    if (dialog) dialog.showModal();
}

/**
 * 关闭乐谱查看器
 */
function closeScoreViewer() {
    var dialog = document.getElementById('score-dialog');
    var frame = document.getElementById('score-frame');
    
    if (frame) frame.src = '';
    if (dialog) dialog.close();
}

/**
 * 点击弹窗背景关闭
 */
document.addEventListener('DOMContentLoaded', function() {
    var dialog = document.getElementById('score-dialog');
    if (dialog) {
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                closeScoreViewer();
            }
        });
    }
});
