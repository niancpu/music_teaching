/**
 * 曲目数据加载器
 * 提供曲目数据和渲染功能
 */

// 曲目数据
var tracksData = [
    {
        id: 'ode-to-joy',
        title: '欢乐颂',
        composer: '贝多芬',
        category: 'classical',
        description: '第九交响曲选段',
        icon: 'fa-music',
        url: '/track/ode-to-joy',
        audio: '/assets/audio/ode-to-joy.mp3'
    },
    {
        id: 'four-little-swans',
        title: '四小天鹅',
        composer: '柴可夫斯基',
        category: 'classical',
        description: '天鹅湖选段',
        icon: 'fa-feather',
        url: '/track/four-little-swans',
        audio: '/assets/audio/four-little-swans.mp3'
    },
    {
        id: 'jasmine-flower',
        title: '茉莉花',
        composer: '中国民歌',
        category: 'folk',
        description: '江苏民歌',
        icon: 'fa-seedling',
        url: '/track/jasmine-flower',
        audio: '/assets/audio/jasmine-flower.mp3'
    },
    {
        id: 'little-hero',
        title: '小英雄',
        composer: '儿童歌曲',
        category: 'children',
        description: '经典儿歌',
        icon: 'fa-child',
        url: '/track/little-hero',
        audio: '/assets/audio/little-hero.mp3'
    },
    {
        id: 'naples-dance',
        title: '那不勒斯舞曲',
        composer: '柴可夫斯基',
        category: 'classical',
        description: '芭蕾舞曲',
        icon: 'fa-masks-theater',
        url: '/track/naples-dance',
        audio: '/assets/audio/naples-dance.mp3'
    }
];

// 分类数据
var categoriesData = [
    { id: 'all', name: '全部' },
    { id: 'classical', name: '古典音乐' },
    { id: 'folk', name: '民族音乐' },
    { id: 'children', name: '儿童歌曲' }
];

/**
 * 加载曲目数据（返回Promise以保持兼容性）
 */
function loadTracks() {
    return Promise.resolve(tracksData);
}

/**
 * 获取分类列表
 */
function getCategories() {
    return categoriesData;
}

/**
 * 根据分类筛选曲目
 */
function getTracksByCategory(category) {
    if (category === 'all') {
        return tracksData;
    }
    return tracksData.filter(function(track) {
        return track.category === category;
    });
}

/**
 * 搜索曲目
 */
function searchTracks(keyword) {
    var lowerKeyword = keyword.toLowerCase();
    return tracksData.filter(function(track) {
        return track.title.toLowerCase().indexOf(lowerKeyword) !== -1 ||
               track.composer.toLowerCase().indexOf(lowerKeyword) !== -1 ||
               track.description.toLowerCase().indexOf(lowerKeyword) !== -1;
    });
}

/**
 * 生成曲目卡片HTML（用于首页）
 */
function generateTrackCardHtml(track) {
    return '<a href="' + track.url + '" class="track-card block p-4 hover:shadow-md transition-shadow">' +
        '<div class="flex items-center gap-3 mb-3">' +
            '<div class="icon-circle"><i class="fa-solid ' + track.icon + '"></i></div>' +
            '<div>' +
                '<h3 class="font-medium text-base text-primary">' + track.title + '</h3>' +
                '<p class="text-sm text-secondary">' + track.composer + '</p>' +
            '</div>' +
        '</div>' +
        '<p class="text-sm text-secondary">' + track.description + '</p>' +
    '</a>';
}

/**
 * 生成音乐卡片HTML（用于音频库）
 */
function generateMusicCardHtml(track) {
    return '<a href="' + track.url + '" class="track-card block p-4 hover:shadow-md transition-shadow">' +
        '<div class="flex items-center gap-3 mb-2">' +
            '<div class="icon-circle"><i class="fa-solid ' + track.icon + '"></i></div>' +
            '<div class="flex-1 min-w-0">' +
                '<h3 class="font-medium text-base text-primary truncate">' + track.title + '</h3>' +
                '<p class="text-sm text-secondary truncate">' + track.composer + '</p>' +
            '</div>' +
        '</div>' +
        '<p class="text-sm text-secondary line-clamp-2">' + track.description + '</p>' +
    '</a>';
}

/**
 * 渲染曲目列表
 * @param {string} containerId - 容器元素ID
 * @param {string} category - 分类ID
 * @param {string} cardType - 卡片类型：'track' 或 'music'
 */
function renderTrackList(containerId, category, cardType) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var tracks = getTracksByCategory(category);
    var html = '';
    
    tracks.forEach(function(track) {
        if (cardType === 'music') {
            html += generateMusicCardHtml(track);
        } else {
            html += generateTrackCardHtml(track);
        }
    });

    container.innerHTML = html || '<p class="text-secondary col-span-3 text-center py-8">暂无曲目</p>';
}
