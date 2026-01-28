/**
 * 欢乐颂 - 音轨数据和渲染模块
 * 将音轨数据与 HTML 分离，便于维护
 */

// 音轨数据配置
var odeToJoyTracks = {
    // 主音轨
    main: {
        id: 'total-audio',
        name: '总音频',
        section: '完整混音版本',
        icon: 'fa-compact-disc',
        audioSrc: 'assets/audio/欢乐颂总音频.mp3',
        scoreSrc: 'assets/scores/欢乐颂总谱.pdf',
        scoreTitle: '欢乐颂 - 总谱',
        isMain: true
    },
    
    // 声部分组
    sections: [
        {
            title: '木管声部',
            tracks: [
                {
                    id: 'flute-audio',
                    name: '长笛',
                    section: '木管声部',
                    icon: 'fa-wind',
                    audioSrc: 'assets/audio/欢乐颂长笛.mp3',
                    scoreSrc: 'assets/scores/欢乐颂长笛分谱.pdf',
                    scoreTitle: '欢乐颂 - 长笛分谱'
                },
                {
                    id: 'oboe-audio',
                    name: '双簧管',
                    section: '木管声部',
                    icon: 'fa-wind',
                    audioSrc: 'assets/audio/欢乐颂双簧管.mp3',
                    scoreSrc: 'assets/scores/欢乐颂双簧管分谱.pdf',
                    scoreTitle: '欢乐颂 - 双簧管分谱'
                },
                {
                    id: 'clarinet-audio',
                    name: 'Bb调单簧管',
                    section: '木管声部',
                    icon: 'fa-wind',
                    audioSrc: 'assets/audio/欢乐颂Bb调单簧管.mp3',
                    scoreSrc: 'assets/scores/欢乐颂Bb调单簧管分谱.pdf',
                    scoreTitle: '欢乐颂 - Bb调单簧管分谱'
                },
                {
                    id: 'bassoon-audio',
                    name: '大管',
                    section: '木管声部',
                    icon: 'fa-wind',
                    audioSrc: 'assets/audio/欢乐颂大管.mp3',
                    scoreSrc: 'assets/scores/欢乐颂大管分谱.pdf',
                    scoreTitle: '欢乐颂 - 大管分谱'
                }
            ]
        },
        {
            title: '弦乐声部',
            tracks: [
                {
                    id: 'violin1-audio',
                    name: '小提琴 I',
                    section: '弦乐声部',
                    icon: 'fa-music',
                    audioSrc: 'assets/audio/欢乐颂小提琴1.mp3',
                    scoreSrc: 'assets/scores/欢乐颂小提琴Ⅰ分谱.pdf',
                    scoreTitle: '欢乐颂 - 小提琴I分谱'
                },
                {
                    id: 'violin2-audio',
                    name: '小提琴 II',
                    section: '弦乐声部',
                    icon: 'fa-music',
                    audioSrc: 'assets/audio/欢乐颂小提琴2.mp3',
                    scoreSrc: 'assets/scores/欢乐颂小提琴Ⅱ分谱.pdf',
                    scoreTitle: '欢乐颂 - 小提琴II分谱'
                },
                {
                    id: 'viola-audio',
                    name: '中提琴',
                    section: '弦乐声部',
                    icon: 'fa-music',
                    audioSrc: 'assets/audio/欢乐颂中提琴.mp3',
                    scoreSrc: 'assets/scores/欢乐颂中提琴分谱.pdf',
                    scoreTitle: '欢乐颂 - 中提琴分谱'
                },
                {
                    id: 'cello-audio',
                    name: '大提琴',
                    section: '弦乐声部',
                    icon: 'fa-music',
                    audioSrc: 'assets/audio/欢乐颂大提琴.mp3',
                    scoreSrc: 'assets/scores/欢乐颂大提琴分谱.pdf',
                    scoreTitle: '欢乐颂 - 大提琴分谱'
                },
                {
                    id: 'bass-audio',
                    name: '低音提琴',
                    section: '弦乐声部',
                    icon: 'fa-music',
                    audioSrc: 'assets/audio/欢乐颂低音提琴.mp3',
                    scoreSrc: 'assets/scores/欢乐颂低音提琴分谱.pdf',
                    scoreTitle: '欢乐颂 - 低音提琴分谱'
                }
            ]
        }
    ]
};

/**
 * 生成音轨卡片 HTML
 * @param {Object} track - 音轨数据对象
 * @returns {string} HTML 字符串
 */
function renderTrackCard(track) {
    var volumeControl = '';
    var buttons = '';
    
    if (track.isMain) {
        // 主音轨：显示总谱和 AI 分析按钮
        buttons = `
            <button class="btn-secondary text-sm" onclick="openScoreViewer('${track.scoreSrc}', '${track.scoreTitle}')">
                <i class="fa-solid fa-file-lines mr-1"></i>总谱
            </button>
            <button class="btn-secondary text-sm" onclick="openPopup()">
                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI分析
            </button>
        `;
    } else {
        // 分轨：显示音量控制和乐谱按钮
        volumeControl = `
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-volume-low text-sm text-secondary"></i>
                <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1" 
                       oninput="setVolume('${track.id}', this.value)">
            </div>
        `;
        buttons = `
            <button class="btn-secondary text-sm" onclick="openScoreViewer('${track.scoreSrc}', '${track.scoreTitle}')">
                <i class="fa-solid fa-file-lines mr-1"></i>乐谱
            </button>
        `;
    }
    
    return `
        <div class="track-card p-6 mb-4">
            <div class="flex items-start gap-4">
                <div class="icon-circle"><i class="fa-solid ${track.icon}"></i></div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h3 class="font-medium text-base mb-1 text-primary">${track.name}</h3>
                            <p class="text-sm text-secondary">${track.section}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            ${volumeControl}
                            ${buttons}
                        </div>
                    </div>
                    <audio id="${track.id}" controls src="${track.audioSrc}"></audio>
                </div>
            </div>
        </div>
    `;
}

/**
 * 生成声部标题 HTML
 * @param {string} title - 声部标题
 * @returns {string} HTML 字符串
 */
function renderSectionTitle(title) {
    return `<h2 class="text-lg font-medium mb-4 mt-8 text-primary">${title}</h2>`;
}

/**
 * 渲染所有音轨到容器
 */
function renderAllTracks() {
    var container = document.getElementById('tracks-container');
    if (!container) return;
    
    var html = '';
    var audioIds = [];
    
    // 渲染主音轨
    html += renderTrackCard(odeToJoyTracks.main);
    audioIds.push(odeToJoyTracks.main.id);
    
    // 渲染各声部
    odeToJoyTracks.sections.forEach(function(section) {
        html += renderSectionTitle(section.title);
        section.tracks.forEach(function(track) {
            html += renderTrackCard(track);
            audioIds.push(track.id);
        });
    });
    
    container.innerHTML = html;
    
    // 初始化音轨播放器
    initTrackPlayer(audioIds);
}

// 页面加载完成后渲染音轨
document.addEventListener('DOMContentLoaded', renderAllTracks);
