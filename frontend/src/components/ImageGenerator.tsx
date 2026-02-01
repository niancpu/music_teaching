'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSongs } from '@/lib/hooks/useSongs';
import { createImageGenerationTask, getImageGenerationStatus, ImageGenerationTask } from '@/lib/api/endpoints/image_generation';
import type { Song, Track } from '@/types/song';
import { Loader2, Image as ImageIcon, AlertCircle, CheckCircle, Music, Wand2 } from 'lucide-react';

const STYLES = [
  { value: 'abstract', label: '抽象艺术 (Abstract)' },
  { value: 'landscape', label: '风景画 (Landscape)' },
  { value: 'portrait', label: '肖像画 (Portrait)' },
  { value: 'surrealism', label: '超现实主义 (Surrealism)' },
  { value: 'cyberpunk', label: '赛博朋克 (Cyberpunk)' },
  { value: 'watercolor', label: '水彩画 (Watercolor)' },
  { value: 'oil_painting', label: '油画 (Oil Painting)' },
];

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (正方形)' },
  { value: '16:9', label: '16:9 (横屏)' },
  { value: '9:16', label: '9:16 (竖屏)' },
];

export default function ImageGenerator() {
  const { songs, loading: songsLoading, error: songsError } = useSongs();
  
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [style, setStyle] = useState('abstract');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const [task, setTask] = useState<ImageGenerationTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for task status
  useEffect(() => {
    if (task && ['pending', 'analyzing', 'generating'].includes(task.status)) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const updatedTask = await getImageGenerationStatus(task.task_id);
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
    
    // Strip leading /audio/ if present
    if (audioPath.startsWith('/audio/')) {
      audioPath = audioPath.substring(7);
    } else if (audioPath.startsWith('audio/')) {
        audioPath = audioPath.substring(6);
    }

    try {
      const response = await createImageGenerationTask({
        audio_path: audioPath,
        style,
        aspect_ratio: aspectRatio,
        custom_prompt: customPrompt || undefined,
        // provider: 'openai', // Use backend default
      });
      
      setTask({
        task_id: response.task_id,
        status: 'pending',
        progress: 0
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动图片生成任务失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (songsLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
          <Wand2 className="w-5 h-5 text-purple-500" />
          AI 绘图配置
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Song Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择乐曲</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={selectedSong?.slug || ''}
                onChange={(e) => {
                  const song = songs.find(s => s.slug === e.target.value) || null;
                  setSelectedSong(song);
                  setSelectedTrack(null);
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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

          {/* Image Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">艺术风格</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片比例</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
              >
                {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">自定义提示词 (可选)</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 text-sm"
                placeholder="在此输入额外的画面描述..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGenerate}
            disabled={!selectedSong || isSubmitting || (task && ['pending', 'analyzing', 'generating'].includes(task.status))}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex justify-center items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                正在提交请求...
              </>
            ) : (
              <>
                 <ImageIcon className="w-5 h-5 mr-2" />
                 生成 AI 意境图
              </>
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
              'bg-purple-100 text-purple-800'
            }`}>
              {task.status === 'pending' && '等待中'}
              {task.status === 'analyzing' && '音频分析中'}
              {task.status === 'generating' && 'AI 绘图中'}
              {task.status === 'completed' && '已完成'}
              {task.status === 'failed' && '失败'}
            </span>
          </div>

          {/* Progress Bar */}
          {['pending', 'analyzing', 'generating'].includes(task.status) && (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {task.status === 'pending' && '正在排队...'}
                {task.status === 'analyzing' && '正在提取音频特征 (BPM, 情绪, 调性)...'}
                {task.status === 'generating' && '正在调用 AI 生成图片...'}
              </p>
            </div>
          )}

           {/* Audio Features Display */}
           {task.audio_features && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Music className="w-4 h-4 mr-2" />
                提取到的音乐特征
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">速度 (BPM)</span>
                  <span className="font-medium">{task.audio_features.tempo}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">调性</span>
                  <span className="font-medium">{task.audio_features.key} {task.audio_features.mode}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">情绪值 (Valence)</span>
                  <span className="font-medium">{task.audio_features.valence}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">能量值 (Energy)</span>
                  <span className="font-medium">{task.audio_features.energy}</span>
                </div>
              </div>
            </div>
          )}

          {/* Result Image */}
          {task.status === 'completed' && task.image_url && (
            <div className="mt-6 space-y-4">
               <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>生成完成！</span>
               </div>
               
               <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={task.image_url} 
                    alt="AI Generated Visualization" 
                    className="w-full h-auto object-contain max-h-[600px] bg-gray-50"
                  />
               </div>
               
               {task.generated_prompt && (
                 <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded">
                   <span className="font-semibold">AI Prompt:</span> {task.generated_prompt}
                 </div>
               )}
            </div>
          )}

          {/* Error Message */}
          {task.status === 'failed' && (
             <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
               <p className="font-medium">生成失败</p>
               <p className="text-sm mt-1">{task.error || '发生了未知错误。'}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
