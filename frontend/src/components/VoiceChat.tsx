'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// API基础URL - 语音对话后端服务
const API_BASE_URL = process.env.NEXT_PUBLIC_VOICE_API_URL || 'http://localhost:8000';

type StatusType = 'idle' | 'success' | 'error' | 'processing';

interface VoiceChatProps {
  className?: string;
}

export default function VoiceChat({ className = '' }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('点击按钮开始录音');
  const [statusType, setStatusType] = useState<StatusType>('idle');
  const [timer, setTimer] = useState('00:00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  // 更新状态
  const updateStatus = useCallback((message: string, type: StatusType = 'idle') => {
    setStatus(message);
    setStatusType(type);
  }, []);

  // 检查后端服务
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          setIsBackendReady(true);
          updateStatus('点击按钮开始录音');
        } else {
          updateStatus('后端服务异常', 'error');
        }
      } catch {
        updateStatus('后端服务未启动', 'error');
      }
    };
    checkBackend();
  }, [updateStatus]);

  // 清理音频URL
  useEffect(() => {
    return () => {
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
    };
  }, []);

  // 计时器
  const startTimer = useCallback(() => {
    recordingStartTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartTimeRef.current;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // 写入字符串到DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // AudioBuffer转WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const samples = buffer.getChannelData(0);
    const dataLength = samples.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  // WebM转WAV
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const audioBuffer = await audioContext.decodeAudioData(reader.result as ArrayBuffer);
          const wavBuffer = audioBufferToWav(audioBuffer);
          audioContext.close();
          resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(webmBlob);
    });
  };

  // PCM转WAV
  const pcmToWav = (pcmData: ArrayBuffer, sampleRate: number, numChannels: number): Blob => {
    const dataLength = pcmData.byteLength;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    new Uint8Array(arrayBuffer).set(new Uint8Array(pcmData), 44);

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // 播放响应音频
  const playResponseAudio = async (audioUrl: string) => {
    const fullUrl = `${API_BASE_URL}${audioUrl}`;

    try {
      updateStatus('下载音频...', 'success');
      console.log('[VoiceChat] 下载音频:', fullUrl);
      
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const pcmData = await response.arrayBuffer();
      console.log('[VoiceChat] PCM数据大小:', pcmData.byteLength, '字节');

      if (pcmData.byteLength === 0) {
        updateStatus('音频数据为空', 'error');
        return;
      }

      updateStatus('转换音频...', 'success');

      const wavBlob = pcmToWav(pcmData, 24000, 1);
      console.log('[VoiceChat] WAV Blob大小:', wavBlob.size, '字节');
      
      // 清理之前的URL
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
      }
      
      const blobUrl = URL.createObjectURL(wavBlob);
      audioBlobUrlRef.current = blobUrl;
      console.log('[VoiceChat] Blob URL:', blobUrl);

      // 先显示音频播放器
      setShowAudio(true);
      
      // 使用setTimeout确保DOM已更新
      setTimeout(async () => {
        if (audioRef.current) {
          console.log('[VoiceChat] 设置音频源...');
          audioRef.current.src = blobUrl;
          
          // 等待音频加载
          audioRef.current.onloadeddata = async () => {
            console.log('[VoiceChat] 音频已加载，时长:', audioRef.current?.duration);
            try {
              await audioRef.current?.play();
              updateStatus('正在播放...', 'success');
            } catch (playError) {
              console.log('[VoiceChat] 自动播放失败:', playError);
              updateStatus('请点击播放按钮收听', 'success');
            }
          };
          
          audioRef.current.onerror = (e) => {
            console.error('[VoiceChat] 音频加载错误:', e);
            updateStatus('音频加载失败', 'error');
          };
          
          // 触发加载
          audioRef.current.load();
        } else {
          console.error('[VoiceChat] audioRef.current 为空');
          updateStatus('播放器初始化失败', 'error');
        }
      }, 100);
      
    } catch (error) {
      console.error('[VoiceChat] 播放失败:', error);
      updateStatus(`播放失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  };

  // 处理录音
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      updateStatus('录音数据为空', 'error');
      return;
    }

    setIsProcessing(true);
    updateStatus('处理中...', 'processing');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      updateStatus('转换格式...', 'processing');
      const wavBlob = await convertToWav(audioBlob);

      updateStatus('上传中（约10-30秒）...', 'processing');

      const formData = new FormData();
      formData.append('audio_file', wavBlob, 'recording.wav');
      formData.append('recv_timeout', '30');

      const response = await fetch(`${API_BASE_URL}/api/dialog/audio`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || '服务器错误');
      }

      if (result.success && result.audio_received && result.output_audio_url) {
        updateStatus('获取回复...', 'success');
        await playResponseAudio(result.output_audio_url);
      } else {
        updateStatus(result.message || '未收到回复', 'error');
      }
    } catch (error) {
      updateStatus(`错误: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 开始录音
  const startRecording = async () => {
    updateStatus('请求麦克风权限...', 'processing');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await processRecording();
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      updateStatus('正在录音...', 'success');
      startTimer();
    } catch (error) {
      updateStatus(`无法访问麦克风: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();
  };

  // 切换录音状态
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 音频播放事件处理
  const handleAudioPlay = () => {
    updateStatus('正在播放...', 'success');
  };

  const handleAudioEnded = () => {
    updateStatus('播放完成，可继续对话', 'idle');
  };

  const handleAudioError = () => {
    updateStatus('播放失败', 'error');
  };

  // 状态样式
  const getStatusClassName = () => {
    const baseClass = 'text-sm mt-3';
    switch (statusType) {
      case 'success':
        return `${baseClass} text-green-600`;
      case 'error':
        return `${baseClass} text-red-600`;
      case 'processing':
        return `${baseClass} text-blue-600`;
      default:
        return `${baseClass} text-gray-500`;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex flex-col items-center">
        {/* 录音按钮 */}
        <button
          onClick={toggleRecording}
          disabled={!isBackendReady || isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } ${!isBackendReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            // 停止图标
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // 麦克风图标
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>

        {/* 计时器 */}
        <div className="text-2xl font-mono text-gray-700 mt-4">{timer}</div>

        {/* 状态文字 */}
        <p className={getStatusClassName()}>{status}</p>

        {/* 操作提示 */}
        <p className="text-xs text-gray-400 mt-2">
          {isRecording ? '点击停止录音' : '点击开始录音'}
        </p>

        {/* 音频播放器 */}
        {showAudio && (
          <div className="mt-4 w-full">
            <audio
              ref={audioRef}
              controls
              className="w-full"
              onPlay={handleAudioPlay}
              onEnded={handleAudioEnded}
              onError={handleAudioError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
