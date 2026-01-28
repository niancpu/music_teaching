'use client';

import { useRef, useState, useCallback, createRef, RefObject } from 'react';
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

  const totalAudioRef = useRef<HTMLAudioElement>(null);
  const trackRefs = useRef<Map<string, RefObject<HTMLAudioElement | null>>>(new Map());

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

  const statusConfig = {
    ready: { className: 'bg-green-100 text-green-700', text: '就绪' },
    playing: { className: 'bg-blue-100 text-blue-500', text: '播放中' },
    paused: { className: 'bg-gray-100 text-gray-500', text: '已暂停' },
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
