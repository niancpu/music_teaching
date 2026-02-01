'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSongs } from '@/lib/hooks/useSongs';
import { createVisualization, getVisualizationStatus, VisualizationTask } from '@/lib/api/endpoints/visualization';
import type { Song, Track } from '@/types/song';
import { Loader2, Play, AlertCircle, CheckCircle } from 'lucide-react';

const STYLES = [
  { value: 'circular', label: '圆形波纹 (Circular)' },
  { value: 'radial', label: '放射光束 (Radial)' },
  { value: 'bars', label: '频率柱状图 (Bars)' },
];

const RESOLUTIONS = [
  { value: '720p', label: '720p (高清)' },
  { value: '1080p', label: '1080p (全高清)' },
  { value: '4k', label: '4k (超高清)' },
];

const COLORS = [
  { value: 'blue', label: '科技蓝' },
  { value: 'red', label: '活力红' },
  { value: 'green', label: '清新绿' },
  { value: 'purple', label: '梦幻紫' },
  { value: 'orange', label: '温暖橙' },
];

export default function VisualizationGenerator() {
  const { songs, loading: songsLoading, error: songsError } = useSongs();
  
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null); // null means totalAudio
  const [style, setStyle] = useState<'circular' | 'radial' | 'bars'>('circular');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [colorScheme, setColorScheme] = useState('blue');
  
  const [task, setTask] = useState<VisualizationTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for task status
  useEffect(() => {
    if (task && ['pending', 'analyzing', 'rendering'].includes(task.status)) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const updatedTask = await getVisualizationStatus(task.task_id);
          setTask(updatedTask);
          if (['completed', 'failed'].includes(updatedTask.status)) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (err) {
          console.error('Failed to poll task status:', err);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [task?.task_id, task?.status]);

  const handleGenerate = async () => {
    if (!selectedSong) return;
    
    setIsSubmitting(true);
    setError(null);
    setTask(null);

    // Determine audio path
    let audioPath = selectedTrack ? selectedTrack.audioFile : selectedSong.totalAudio;
    
    // Strip leading /audio/ if present, as backend expects relative path inside public/audio/
    if (audioPath.startsWith('/audio/')) {
      audioPath = audioPath.substring(7);
    } else if (audioPath.startsWith('audio/')) {
        audioPath = audioPath.substring(6);
    }

    try {
      const response = await createVisualization({
        audio_path: audioPath,
        style,
        resolution,
        color_scheme: colorScheme,
      });
      
      // Start polling with initial pending state
      setTask({
        task_id: response.task_id,
        status: 'pending',
        progress: 0
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动可视化任务失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (songsLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">正在加载曲库...</span>
      </div>
    );
  }

  if (songsError) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        加载歌曲失败: {songsError.message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <Play className="w-5 h-5 text-blue-500" />
          可视化参数配置
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Song Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择乐曲</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSong?.slug || ''}
                onChange={(e) => {
                  const song = songs.find(s => s.slug === e.target.value) || null;
                  setSelectedSong(song);
                  setSelectedTrack(null); // Reset track when song changes
                }}
              >
                <option value="">-- 请选择一首乐曲 --</option>
                {songs.map((song) => (
                  <option key={song.slug} value={song.slug}>
                    {song.title} - {song.composer}
                  </option>
                ))}
              </select>
            </div>

            {selectedSong && selectedSong.tracks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择分轨 (可选)</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTrack?.id || ''}
                  onChange={(e) => {
                    const track = selectedSong.tracks.find(t => t.id === e.target.value) || null;
                    setSelectedTrack(track);
                  }}
                >
                  <option value="">完整混音 (Full Mix)</option>
                  {selectedSong.tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name} ({track.section})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Visualization Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">视觉风格</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
              >
                {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">配色方案</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
              >
                {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分辨率</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
              >
                {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGenerate}
            disabled={!selectedSong || isSubmitting || (task && ['pending', 'analyzing', 'rendering'].includes(task.status))}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex justify-center items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                正在启动...
              </>
            ) : (
              '生成可视化视频'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Status & Result Area */}
      {task && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">任务状态</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              task.status === 'completed' ? 'bg-green-100 text-green-800' :
              task.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {task.status === 'pending' && '等待中'}
              {task.status === 'analyzing' && '分析音频中'}
              {task.status === 'rendering' && '渲染视频中'}
              {task.status === 'completed' && '已完成'}
              {task.status === 'failed' && '失败'}
            </span>
          </div>

          {/* Progress Bar */}
          {['pending', 'analyzing', 'rendering'].includes(task.status) && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 text-right">{task.progress}%</p>
              <p className="text-sm text-gray-600">
                {task.status === 'pending' && '任务正在排队...'}
                {task.status === 'analyzing' && '正在分析音频频率数据...'}
                {task.status === 'rendering' && '正在渲染每一帧视频画面...'}
              </p>
            </div>
          )}

          {/* Result Video */}
          {task.status === 'completed' && task.video_path && (
            <div className="mt-6 space-y-4">
               <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>渲染完成！</span>
               </div>
               <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    controls 
                    className="w-full h-full"
                    src={task.video_path}
                  >
                    Your browser does not support the video tag.
                  </video>
               </div>
            </div>
          )}

          {/* Error Message */}
          {task.status === 'failed' && (
             <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
               <p className="font-medium">渲染失败</p>
               <p className="text-sm mt-1">{task.error || '发生了未知错误。'}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}