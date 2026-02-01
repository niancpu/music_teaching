'use client';

import React, { useState } from 'react';
import VisualizationGenerator from '@/components/VisualizationGenerator';
import ImageGenerator from '@/components/ImageGenerator';
import { Sparkles, ArrowLeft, Video, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function VisualizationPage() {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">可视化工作室</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">将音乐转化为视觉艺术</h2>
          <p className="text-lg text-gray-600">
            从音频库中选择乐曲，定制视觉风格，利用我们先进的音频分析引擎生成高质量的视频或意境图片。
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex rounded-lg bg-white shadow-sm p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'video'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Video className="w-4 h-4" />
              视频生成
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'image'
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              AI 绘图
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeTab === 'video' ? <VisualizationGenerator /> : <ImageGenerator />}
        </div>
      </main>
    </div>
  );
}