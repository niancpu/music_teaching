/* track-player.js - 音频播放控制 */

/**
 * 音轨播放器模块
 * 提供多音轨同步播放、暂停、重置、音量控制等功能
 */

// 音频ID列表（由页面初始化时设置）
var trackPlayerAudioIds = [];

/**
 * 初始化音轨播放器
 * @param {string[]} audioIds - 音频元素ID数组
 */
function initTrackPlayer(audioIds) {
    trackPlayerAudioIds = audioIds || [];
    console.log('TrackPlayer initialized with', trackPlayerAudioIds.length, 'tracks');
}

/**
 * 播放所有音轨
 */
function playAll() {
    trackPlayerAudioIds.forEach(function(id) {
        var audio = document.getElementById(id);
        if (audio && audio.src) {
            audio.play().catch(function(e) {
                console.warn('播放失败:', id, e.message);
            });
        }
    });
    updatePlayStatus('playing');
}

/**
 * 暂停所有音轨
 */
function pauseAll() {
    trackPlayerAudioIds.forEach(function(id) {
        var audio = document.getElementById(id);
        if (audio) {
            audio.pause();
        }
    });
    updatePlayStatus('paused');
}

/**
 * 重新开始所有音轨
 */
function restartAll() {
    trackPlayerAudioIds.forEach(function(id) {
        var audio = document.getElementById(id);
        if (audio) {
            audio.currentTime = 0;
            audio.pause();
        }
    });
    updatePlayStatus('ready');
}

/**
 * 设置单个音轨音量
 * @param {string} audioId - 音频元素ID
 * @param {number} value - 音量值 (0-1)
 */
function setVolume(audioId, value) {
    var audio = document.getElementById(audioId);
    if (audio) {
        audio.volume = parseFloat(value);
    }
}

/**
 * 设置所有音轨音量
 * @param {number} value - 音量值 (0-1)
 */
function setAllVolume(value) {
    trackPlayerAudioIds.forEach(function(id) {
        setVolume(id, value);
    });
}

/**
 * 更新播放状态显示
 * @param {string} status - 状态: 'ready' | 'playing' | 'paused'
 */
function updatePlayStatus(status) {
    var statusTag = document.querySelector('.status-tag');
    if (!statusTag) return;
    
    // 移除所有状态类
    statusTag.classList.remove('ready', 'playing', 'paused');
    
    // 添加新状态类和更新文本
    statusTag.classList.add(status);
    
    var statusText = {
        'ready': '就绪',
        'playing': '播放中',
        'paused': '已暂停'
    };
    
    var icon = statusTag.querySelector('i');
    if (icon) {
        statusTag.innerHTML = '<i class="fa-solid fa-circle text-xs"></i>' + statusText[status];
    } else {
        statusTag.textContent = statusText[status];
    }
}

/**
 * 获取当前播放时间（以第一个有效音轨为准）
 * @returns {number} 当前播放时间（秒）
 */
function getCurrentTime() {
    for (var i = 0; i < trackPlayerAudioIds.length; i++) {
        var audio = document.getElementById(trackPlayerAudioIds[i]);
        if (audio && audio.src) {
            return audio.currentTime;
        }
    }
    return 0;
}

/**
 * 设置所有音轨的播放位置
 * @param {number} time - 播放位置（秒）
 */
function seekAll(time) {
    trackPlayerAudioIds.forEach(function(id) {
        var audio = document.getElementById(id);
        if (audio) {
            audio.currentTime = time;
        }
    });
}

/**
 * 检查是否有音轨正在播放
 * @returns {boolean}
 */
function isPlaying() {
    for (var i = 0; i < trackPlayerAudioIds.length; i++) {
        var audio = document.getElementById(trackPlayerAudioIds[i]);
        if (audio && !audio.paused) {
            return true;
        }
    }
    return false;
}
