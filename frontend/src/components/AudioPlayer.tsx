'use client';

import { useRef, useState, useCallback, createRef, RefObject, useEffect } from 'react';
import { Play, Pause, RotateCcw, Disc } from 'lucide-react';
import type { Song, Track } from '@/types/song';
import TrackCard from './TrackCard';
import ScoreViewer from './ScoreViewer';

interface AudioPlayerProps {
  song: Song;
}

type PlayStatus = 'ready' | 'playing' | 'paused';

export default function AudioPlayer({ song }: AudioPlayerProps) {
  const [status, setStatus] = useState<PlayStatus>('ready');
  const [scoreModal, setScoreModal] = useState<{ open: boolean; file: string; title: string }>({
    open: false,
    file: '',
    title: '',
  });
  const [externalListeningEnabled, setExternalListeningEnabled] = useState(false);
  const [externalPermission, setExternalPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isExternalListening, setIsExternalListening] = useState(false);
  const [isExternalPerforming, setIsExternalPerforming] = useState(false);

  const totalAudioRef = useRef<HTMLAudioElement>(null);
  const trackRefs = useRef<Map<string, RefObject<HTMLAudioElement | null>>>(new Map());
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const loudStartRef = useRef<number | null>(null);
  const quietStartRef = useRef<number | null>(null);
  const isPerformingRef = useRef(false);

  // Initialize refs for tracks
  song.tracks.forEach((track) => {
    if (!trackRefs.current.has(track.id)) {
      trackRefs.current.set(track.id, createRef<HTMLAudioElement>());
    }
  });

  const getAllAudioElements = useCallback(() => {
    const elements: HTMLAudioElement[] = [];
    if (totalAudioRef.current) elements.push(totalAudioRef.current);
    trackRefs.current.forEach((ref) => {
      if (ref.current) elements.push(ref.current);
    });
    return elements;
  }, []);

  const playAll = useCallback(() => {
    getAllAudioElements().forEach((audio) => {
      if (audio.src) audio.play();
    });
    setStatus('playing');
  }, [getAllAudioElements]);

  const pauseAll = useCallback(() => {
    getAllAudioElements().forEach((audio) => audio.pause());
    setStatus('paused');
  }, [getAllAudioElements]);

  const restartAll = useCallback(() => {
    getAllAudioElements().forEach((audio) => {
      audio.currentTime = 0;
    });
    playAll();
  }, [getAllAudioElements, playAll]);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const ref = trackRefs.current.get(trackId);
    if (ref?.current) {
      ref.current.volume = volume;
    }
  }, []);

  const openScore = useCallback((file: string, title: string) => {
    setScoreModal({ open: true, file, title });
  }, []);

  const closeScore = useCallback(() => {
    setScoreModal({ open: false, file: '', title: '' });
  }, []);

  const cleanupExternalListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    loudStartRef.current = null;
    quietStartRef.current = null;
    isPerformingRef.current = false;
    setIsExternalPerforming(false);
    setIsExternalListening(false);
  }, []);

  useEffect(() => {
    if (!externalListeningEnabled) {
      cleanupExternalListening();
      return;
    }

    let isCancelled = false;
    const START_THRESHOLD = 0.02;
    const STOP_THRESHOLD = 0.015;
    const HYSTERESIS_MS = 600;

    const setupExternalListening = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) return;
        setExternalPermission('granted');
        mediaStreamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        await audioContext.resume();

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const processor = audioContext.createScriptProcessor(2048, 1, 1);

        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(audioContext.destination);

        sourceRef.current = source;
        analyserRef.current = analyser;
        processorRef.current = processor;
        setIsExternalListening(true);

        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < input.length; i += 1) {
            sum += input[i] * input[i];
          }
          const rms = Math.sqrt(sum / input.length);
          const now = performance.now();

          if (rms >= START_THRESHOLD) {
            if (loudStartRef.current === null) {
              loudStartRef.current = now;
            }
            quietStartRef.current = null;
          } else if (rms <= STOP_THRESHOLD) {
            if (quietStartRef.current === null) {
              quietStartRef.current = now;
            }
            loudStartRef.current = null;
          }

          if (!isPerformingRef.current && loudStartRef.current !== null && now - loudStartRef.current >= HYSTERESIS_MS) {
            isPerformingRef.current = true;
            setIsExternalPerforming(true);
            playAll();
          }

          if (isPerformingRef.current && quietStartRef.current !== null && now - quietStartRef.current >= HYSTERESIS_MS) {
            isPerformingRef.current = false;
            setIsExternalPerforming(false);
            pauseAll();
          }
        };
      } catch (error) {
        if (isCancelled) return;
        setExternalPermission('denied');
        cleanupExternalListening();
      }
    };

    setupExternalListening();

    return () => {
      isCancelled = true;
      cleanupExternalListening();
    };
  }, [cleanupExternalListening, externalListeningEnabled, pauseAll, playAll]);

  const statusConfig = {
    ready: { className: 'bg-green-100 text-green-700', text: '就绪' },
    playing: { className: 'bg-blue-100 text-blue-500', text: '播放中' },
    paused: { className: 'bg-gray-100 text-gray-500', text: '已暂停' },
  };

  const externalPermissionText = {
    unknown: '未请求权限',
    granted: '权限已授权',
    denied: '权限被拒绝',
  };

  // Group tracks by section
  const tracksBySection = song.tracks.reduce((acc, track) => {
    if (!acc[track.section]) acc[track.section] = [];
    acc[track.section].push(track);
    return acc;
  }, {} as Record<string, Track[]>);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">播放控制</h2>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[status].className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusConfig[status].text}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={playAll}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            全部播放
          </button>
          <button
            onClick={pauseAll}
            className="inline-flex items-center px-4 py-2 bg-white text-blue-500 text-sm font-medium border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            <Pause className="w-4 h-4 mr-2" />
            暂停
          </button>
          <button
            onClick={restartAll}
            className="inline-flex items-center px-4 py-2 bg-white text-blue-500 text-sm font-medium border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新开始
          </button>
        </div>
        <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">外部演奏监听</p>
              <p className="text-xs text-gray-500">通过麦克风检测演奏自动播放/暂停</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                checked={externalListeningEnabled}
                onChange={(event) => setExternalListeningEnabled(event.target.checked)}
              />
              {externalListeningEnabled ? '已开启' : '已关闭'}
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                externalPermission === 'granted' ? 'bg-green-100 text-green-700' : externalPermission === 'denied' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {externalPermissionText[externalPermission]}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                isExternalListening ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isExternalListening ? '正在监听' : '未监听'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                isExternalPerforming ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isExternalPerforming ? '检测到演奏' : '未检测'}
            </span>
          </div>
        </div>
      </div>

      {/* Total Audio */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-blue-500">
            <Disc className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">总音频</h3>
                <p className="text-sm text-gray-500">完整混音版本</p>
              </div>
              {song.totalScore && (
                <button
                  onClick={() => openScore(song.totalScore!, `${song.title} - 总谱`)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-500 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
                >
                  总谱
                </button>
              )}
            </div>
            <audio
              ref={totalAudioRef}
              controls
              src={song.totalAudio}
              className="w-full h-10"
            />
          </div>
        </div>
      </div>

      {/* Tracks by Section */}
      {Object.entries(tracksBySection).map(([section, tracks]) => (
        <div key={section}>
          <h2 className="text-lg font-medium text-gray-900 mb-4 mt-8">{section}</h2>
          <div className="space-y-4">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                audioRef={trackRefs.current.get(track.id)!}
                onVolumeChange={(volume) => setTrackVolume(track.id, volume)}
                onOpenScore={track.scoreFile ? () => openScore(track.scoreFile!, `${song.title} - ${track.name}分谱`) : undefined}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Score Modal */}
      <ScoreViewer
        open={scoreModal.open}
        file={scoreModal.file}
        title={scoreModal.title}
        onClose={closeScore}
      />
    </div>
  );
}
