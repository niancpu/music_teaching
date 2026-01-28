/* chat.js - AI聊天功能 */

/**
 * AI聊天模块
 * 提供AI聊天弹窗的打开、关闭和消息发送功能
 */

// 聊天API端点（可配置）
var chatApiEndpoint = '/chat';

/**
 * 打开AI聊天弹窗
 */
function openPopup() {
    var popup = document.getElementById('popup');
    if (popup) {
        popup.setAttribute('open', '');
    }
}

/**
 * 关闭AI聊天弹窗
 */
function closePopup() {
    var popup = document.getElementById('popup');
    if (popup) {
        popup.removeAttribute('open');
    }
}

/**
 * 发送消息到AI
 */
function sendMessage() {
    var input = document.getElementById('userInput');
    var chatContent = document.getElementById('chatContent');
    
    if (!input || !chatContent) return;
    
    var message = input.value.trim();
    if (!message) return;
    
    // 清空输入框
    input.value = '';
    
    // 移除欢迎消息
    var welcomeMsg = chatContent.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // 添加用户消息
    addMessage('user', message);
    
    // 添加加载动画
    var loadingId = addLoading();
    
    // 发送请求到后端
    fetch(chatApiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // 移除加载动画
        removeLoading(loadingId);
        
        // 添加AI回复
        if (data.reply) {
            addMessage('ai', data.reply);
        } else if (data.error) {
            addMessage('ai', '抱歉，发生了错误：' + data.error);
        }
    })
    .catch(function(error) {
        // 移除加载动画
        removeLoading(loadingId);
        
        // 显示错误消息
        addMessage('ai', '抱歉，网络连接出现问题，请稍后重试。');
        console.error('Chat error:', error);
    });
}

/**
 * 添加消息到聊天内容区
 * @param {string} type - 消息类型: 'user' | 'ai'
 * @param {string} content - 消息内容
 */
function addMessage(type, content) {
    var chatContent = document.getElementById('chatContent');
    if (!chatContent) return;
    
    var messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + type;
    
    var label = type === 'user' ? '你' : 'AI助手';
    
    messageDiv.innerHTML = 
        '<span class="message-label">' + label + '</span>' +
        '<div class="message-bubble">' + escapeHtml(content) + '</div>';
    
    chatContent.appendChild(messageDiv);
    
    // 滚动到底部
    chatContent.scrollTop = chatContent.scrollHeight;
}

/**
 * 添加加载动画
 * @returns {string} 加载动画元素ID
 */
function addLoading() {
    var chatContent = document.getElementById('chatContent');
    if (!chatContent) return '';
    
    var loadingId = 'loading-' + Date.now();
    
    var loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message ai';
    loadingDiv.innerHTML = 
        '<span class="message-label">AI助手</span>' +
        '<div class="loading">' +
            '<span></span><span></span><span></span>' +
        '</div>';
    
    chatContent.appendChild(loadingDiv);
    chatContent.scrollTop = chatContent.scrollHeight;
    
    return loadingId;
}

/**
 * 移除加载动画
 * @param {string} loadingId - 加载动画元素ID
 */
function removeLoading(loadingId) {
    var loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
        loadingEl.remove();
    }
}

/**
 * HTML转义，防止XSS
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 处理回车键发送消息
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleChatKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * 初始化聊天功能
 * @param {object} options - 配置选项
 */
function initChat(options) {
    options = options || {};
    
    // 设置API端点
    if (options.apiEndpoint) {
        chatApiEndpoint = options.apiEndpoint;
    }
    
    // 绑定回车键发送
    var input = document.getElementById('userInput');
    if (input) {
        input.addEventListener('keypress', handleChatKeypress);
    }
    
    console.log('Chat module initialized');
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initChat();
    });
} else {
    initChat();
}
