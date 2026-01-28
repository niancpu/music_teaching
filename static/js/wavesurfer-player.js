/**
 * 波形播放器 - 欢乐颂
 */

var audioTracks = [
    { id: 'flute', name: '长笛', file: 'assets/audio/欢乐颂长笛.mp3' },
    { id: 'oboe', name: '双簧管', file: 'assets/audio/欢乐颂双簧管.mp3' },
    { id: 'clarinetBb', name: 'Bb调单簧管', file: 'assets/audio/欢乐颂Bb调单簧管.mp3' },
    { id: 'bassoon', name: '大管', file: 'assets/audio/欢乐颂大管.mp3' },
    { id: 'violin1', name: '小提琴I', file: 'assets/audio/欢乐颂小提琴1.mp3' },
    { id: 'violin2', name: '小提琴II', file: 'assets/audio/欢乐颂小提琴2.mp3' },
    { id: 'viola', name: '中提琴', file: 'assets/audio/欢乐颂中提琴.mp3' },
    { id: 'cello', name: '大提琴', file: 'assets/audio/欢乐颂大提琴.mp3' },
    { id: 'doubleBass', name: '低音提琴', file: 'assets/audio/欢乐颂低音提琴.mp3' }
];

var scoreFiles = {
    'flute': { file: 'assets/scores/欢乐颂长笛分谱.pdf', title: '欢乐颂 - 长笛分谱' },
    'oboe': { file: 'assets/scores/欢乐颂双簧管分谱.pdf', title: '欢乐颂 - 双簧管分谱' },
    'clarinetBb': { file: 'assets/scores/欢乐颂Bb调单簧管分谱.pdf', title: '欢乐颂 - Bb调单簧管分谱' },
    'bassoon': { file: 'assets/scores/欢乐颂大管分谱.pdf', title: '欢乐颂 - 大管分谱' },
    'violin1': { file: 'assets/scores/欢乐颂小提琴Ⅰ分谱.pdf', title: '欢乐颂 - 小提琴I分谱' },
    'violin2': { file: 'assets/scores/欢乐颂小提琴Ⅱ分谱.pdf', title: '欢乐颂 - 小提琴II分谱' },
    'viola': { file: 'assets/scores/欢乐颂中提琴分谱.pdf', title: '欢乐颂 - 中提琴分谱' },
    'cello': { file: 'assets/scores/欢乐颂大提琴分谱.pdf', title: '欢乐颂 - 大提琴分谱' },
    'doubleBass': { file: 'assets/scores/欢乐颂低音提琴分谱.pdf', title: '欢乐颂 - 低音提琴分谱' }
};

var wavesurfers = {};
var isPlaying = false;

function initializeTracks() {
    audioTracks.forEach(function(track) {
        try {
            var wavesurfer = WaveSurfer.create({
                container: '#' + track.id + '-waveform',
                waveColor: '#dadce0',
                progressColor: '#1a73e8',
                cursorColor: '#202124',
                barWidth: 2,
                barRadius: 2,
                height: 48,
                url: track.file
            });

            wavesurfers[track.id] = wavesurfer;

            var volumeControl = document.getElementById(track.id + '-volume');
            if (volumeControl) {
                volumeControl.addEventListener('input', function(e) {
                    wavesurfer.setVolume(parseFloat(e.target.value));
                });
            }

            var scoreBtn = document.getElementById(track.id + '-score-btn');
            if (scoreBtn) {
                scoreBtn.addEventListener('click', function() {
                    var score = scoreFiles[track.id];
                    if (score) openScore(score.file, score.title);
                });
            }

            wavesurfer.on('play', function() {
                isPlaying = true;
                updatePlayStatus();
            });

            wavesurfer.on('pause', checkAllPaused);
            wavesurfer.on('finish', checkAllPaused);
        } catch (error) {
            console.error('初始化 ' + track.id + ' 失败:', error);
        }
    });
}

function openScore(scoreFile, scoreTitle) {
    window.open(scoreFile, 'scoreViewer', 'width=1200,height=800');
}

function playAll() {
    Object.values(wavesurfers).forEach(function(ws) {
        if (ws.isPaused()) ws.play();
    });
    isPlaying = true;
    updatePlayStatus();
}

function pauseAll() {
    Object.values(wavesurfers).forEach(function(ws) {
        ws.pause();
    });
    checkAllPaused();
}

function restartAll() {
    Object.values(wavesurfers).forEach(function(ws) {
        ws.stop();
    });
    isPlaying = false;
    updatePlayStatus();
}

function updatePlayStatus() {
    var status = document.getElementById('play-status');
    if (isPlaying) {
        status.textContent = '播放中';
        status.className = 'status-badge status-playing';
    } else {
        status.textContent = '已暂停';
        status.className = 'status-badge status-paused';
    }
}

function checkAllPaused() {
    var allPaused = Object.values(wavesurfers).every(function(ws) {
        return ws.isPaused();
    });
    if (allPaused) {
        isPlaying = false;
        updatePlayStatus();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeTracks();

    document.getElementById('play-all-btn').addEventListener('click', playAll);
    document.getElementById('pause-all-btn').addEventListener('click', pauseAll);
    document.getElementById('restart-all-btn').addEventListener('click', restartAll);

    document.getElementById('full-score-btn').addEventListener('click', function() {
        openScore('assets/scores/欢乐颂总谱.pdf', '欢乐颂 - 总谱');
    });
});
