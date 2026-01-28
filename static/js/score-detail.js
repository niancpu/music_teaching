/**
 * 乐谱详情页 JavaScript 模块
 * 处理乐器配置、PDF 加载和音视频同步
 */

// 乐器配置
var instrumentMap = {
    flute: { name: '长笛', audio: '/assets/audio/欢乐颂长笛.mp3', pdf: '/assets/scores/欢乐颂长笛分谱.pdf' },
    oboe: { name: '双簧管', audio: '/assets/audio/欢乐颂双簧管.mp3', pdf: '/assets/scores/欢乐颂双簧管分谱.pdf' },
    clarinetBb: { name: 'Bb调单簧管', audio: '/assets/audio/欢乐颂Bb调单簧管.mp3', pdf: '/assets/scores/欢乐颂Bb调单簧管分谱.pdf' },
    bassoon: { name: '大管', audio: '/assets/audio/欢乐颂大管.mp3', pdf: '/assets/scores/欢乐颂大管分谱.pdf' },
    violin1: { name: '小提琴I', audio: '/assets/audio/欢乐颂小提琴1.mp3', pdf: '/assets/scores/欢乐颂小提琴Ⅰ分谱.pdf' },
    violin2: { name: '小提琴II', audio: '/assets/audio/欢乐颂小提琴2.mp3', pdf: '/assets/scores/欢乐颂小提琴Ⅱ分谱.pdf' },
    viola: { name: '中提琴', audio: '/assets/audio/欢乐颂中提琴.mp3', pdf: '/assets/scores/欢乐颂中提琴分谱.pdf' },
    cello: { name: '大提琴', audio: '/assets/audio/欢乐颂大提琴.mp3', pdf: '/assets/scores/欢乐颂大提琴分谱.pdf' },
    doubleBass: { name: '低音提琴', audio: '/assets/audio/欢乐颂低音提琴.mp3', pdf: '/assets/scores/欢乐颂低音提琴分谱.pdf' }
};

// 获取URL参数
function getQueryParam(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// 初始化页面
function initScoreDetail() {
    var instrument = getQueryParam('instrument');
    var config = instrumentMap[instrument];
    var title = document.getElementById('score-title');
    var audio = document.getElementById('audio-player');
    var pdfViewer = document.getElementById('pdf-viewer');
    var videoBar = document.getElementById('video-bar');
    var video = document.getElementById('video-player');

    if (!config) {
        title.textContent = '未知乐器';
        pdfViewer.innerHTML = '<div class="loading">未找到该乐器的乐谱信息</div>';
        return;
    }

    title.textContent = config.name + '乐谱';
    audio.src = config.audio;

    // 加载PDF
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjsLib.getDocument(config.pdf).promise.then(function(pdfDoc) {
        pdfViewer.innerHTML = '';
        for (var i = 1; i <= pdfDoc.numPages; i++) {
            (function(pageNum) {
                pdfDoc.getPage(pageNum).then(function(page) {
                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    var viewport = page.getViewport({ scale: 1.5 });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    var pageDiv = document.createElement('div');
                    pageDiv.className = 'score-page';
                    pageDiv.appendChild(canvas);
                    pdfViewer.appendChild(pageDiv);
                    page.render({ canvasContext: context, viewport: viewport });
                });
            })(i);
        }
    }).catch(function(err) {
        pdfViewer.innerHTML = '<div class="loading">加载乐谱失败：' + err.message + '</div>';
    });

    // 小提琴I 特殊处理：显示视频并同步
    if (instrument === 'violin1' && videoBar && video) {
        videoBar.style.display = '';
        setupVideoSync(audio, video);
    } else if (videoBar) {
        videoBar.style.display = 'none';
    }

    // 设置高亮功能
    setupHighlight(audio, instrument);
}

// 音视频同步
function setupVideoSync(audio, video) {
    // 同步播放/暂停
    audio.addEventListener('play', function() { video.play(); });
    audio.addEventListener('pause', function() { video.pause(); });
    video.addEventListener('play', function() { audio.play(); });
    video.addEventListener('pause', function() { audio.pause(); });

    // 同步进度
    audio.addEventListener('timeupdate', function() {
        if (Math.abs(video.currentTime - audio.currentTime) > 0.3) {
            video.currentTime = audio.currentTime;
        }
    });
    video.addEventListener('timeupdate', function() {
        if (Math.abs(audio.currentTime - video.currentTime) > 0.3) {
            audio.currentTime = video.currentTime;
        }
    });

    // 同步快进/快退
    var isSyncing = false;
    audio.addEventListener('seeking', function() {
        if (!isSyncing) {
            isSyncing = true;
            video.currentTime = audio.currentTime;
            isSyncing = false;
        }
    });
    video.addEventListener('seeking', function() {
        if (!isSyncing) {
            isSyncing = true;
            audio.currentTime = video.currentTime;
            isSyncing = false;
        }
    });
}

// 乐谱高亮数据（预留，需要根据实际乐谱位置填充）
var scoreHighlights = {
    // 每个乐器的高亮区域配置
    // 格式: { start: 开始时间, end: 结束时间, page: 页码, top, left, width, height }
};

// 设置高亮功能
function setupHighlight(audio, instrument) {
    audio.addEventListener('timeupdate', function() {
        var currentTime = audio.currentTime;
        var highlights = scoreHighlights[instrument];
        if (!highlights) return;

        // 找到当前时间对应的高亮区块
        var highlight = null;
        for (var i = 0; i < highlights.length; i++) {
            if (currentTime >= highlights[i].start && currentTime < highlights[i].end) {
                highlight = highlights[i];
                break;
            }
        }

        // 移除旧的高亮
        var oldHighlights = document.querySelectorAll('.highlight');
        for (var j = 0; j < oldHighlights.length; j++) {
            oldHighlights[j].remove();
        }

        // 渲染高亮
        if (highlight) {
            var pageDiv = document.querySelector('.score-page:nth-child(' + highlight.page + ')');
            if (pageDiv) {
                var highlightDiv = document.createElement('div');
                highlightDiv.className = 'highlight';
                highlightDiv.style.top = highlight.top + 'px';
                highlightDiv.style.left = highlight.left + 'px';
                highlightDiv.style.width = highlight.width + 'px';
                highlightDiv.style.height = highlight.height + 'px';
                highlightDiv.style.position = 'absolute';
                pageDiv.style.position = 'relative';
                pageDiv.appendChild(highlightDiv);
            }
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initScoreDetail);
