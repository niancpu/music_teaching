'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Music, Feather, Leaf, Baby, Keyboard, Repeat, Moon, Cloud, Guitar, Drum, Heart, Wind, Waves, User } from 'lucide-react';
import songsData from '@/data/songs.json';
import type { Song } from '@/types/song';

const songs = songsData.songs as Song[];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Music, Feather, Leaf, Baby, Keyboard, Repeat, Moon, Cloud, Guitar, Drum, Heart, Wind, Waves, User,
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-500',
  red: 'bg-red-50 text-red-500',
  green: 'bg-green-50 text-green-500',
  yellow: 'bg-yellow-50 text-yellow-500',
};

// Extended library data (combining with original static library data)
const extendedSongs: Song[] = [
  ...songs,
  { slug: 'fur-elise', title: '致爱丽丝', composer: '贝多芬', description: '钢琴独奏', category: 'classical', icon: 'Keyboard', iconColor: 'blue', totalAudio: '', tracks: [] },
  { slug: 'four-seasons-spring', title: '四季·春', composer: '维瓦尔第', description: '小提琴协奏曲', category: 'classical', icon: 'Music', iconColor: 'green', totalAudio: '', tracks: [] },
  { slug: 'symphony-5', title: '第五交响曲', composer: '贝多芬', description: '交响乐', category: 'classical', icon: 'Music', iconColor: 'red', totalAudio: '', tracks: [] },
  { slug: 'turkish-march', title: '土耳其进行曲', composer: '莫扎特', description: '钢琴曲', category: 'classical', icon: 'Keyboard', iconColor: 'blue', totalAudio: '', tracks: [] },
  { slug: 'traumerei', title: '梦幻曲', composer: '舒曼', description: '钢琴独奏', category: 'classical', icon: 'Cloud', iconColor: 'blue', totalAudio: '', tracks: [] },
  { slug: 'moonlight-sonata', title: '月光奏鸣曲', composer: '贝多芬', description: '钢琴奏鸣曲', category: 'classical', icon: 'Moon', iconColor: 'blue', totalAudio: '', tracks: [] },
  { slug: 'canon', title: '卡农', composer: '帕赫贝尔', description: '室内乐', category: 'classical', icon: 'Repeat', iconColor: 'blue', totalAudio: '', tracks: [] },
  { slug: 'farewell', title: '送别', composer: '中国经典', description: '校园歌曲', category: 'folk', icon: 'Guitar', iconColor: 'yellow', totalAudio: '', tracks: [] },
  { slug: 'ambush', title: '十面埋伏', composer: '中国琵琶', description: '古典名曲', category: 'folk', icon: 'Drum', iconColor: 'red', totalAudio: '', tracks: [] },
  { slug: 'high-mountain', title: '高山流水', composer: '中国古琴', description: '文人音乐', category: 'folk', icon: 'Waves', iconColor: 'blue', totalAudio: '', tracks: [] },
  { slug: 'happy-year', title: '欢乐年年', composer: '中国民族', description: '节庆音乐', category: 'folk', icon: 'Drum', iconColor: 'red', totalAudio: '', tracks: [] },
  { slug: 'west-wind', title: '西风的话', composer: '中国民歌', description: '经典传唱', category: 'folk', icon: 'Wind', iconColor: 'green', totalAudio: '', tracks: [] },
  { slug: 'butterfly-lovers', title: '梁祝', composer: '何占豪、陈钢', description: '琵琶协奏曲', category: 'folk', icon: 'Heart', iconColor: 'red', totalAudio: '', tracks: [] },
];

type Category = 'all' | 'classical' | 'folk';

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<Category>('all');

  const filteredSongs = useMemo(() => {
    return extendedSongs.filter((song) => {
      const matchesSearch = searchTerm === '' ||
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.composer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || song.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, category]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-[57px] z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Link>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-medium text-gray-900">音频资源库</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">音频资源库</h1>
          <p className="text-gray-500">探索丰富的音乐教学资源</p>
        </div>

        {/* Search Box */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flex items-center px-4 py-3 bg-gray-100 rounded-lg border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-md transition-all">
            <Search className="w-5 h-5 text-gray-500 mr-3" />
            <input
              type="text"
              placeholder="搜索歌曲或作曲家..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-900"
            />
          </div>
        </div>

        {/* Category Buttons */}
        <div className="flex justify-center gap-3 mb-8">
          {[
            { key: 'all', label: '全部' },
            { key: 'classical', label: '古典音乐' },
            { key: 'folk', label: '民族音乐' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key as Category)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                category === cat.key
                  ? 'bg-blue-50 text-blue-500 border-blue-500'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Music Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredSongs.map((song) => {
            const IconComponent = iconMap[song.icon] || Music;
            const colorClass = colorMap[song.iconColor] || colorMap.blue;
            const hasAudio = song.totalAudio !== '';

            return (
              <div
                key={song.slug}
                className="bg-white border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{song.title}</h3>
                    <p className="text-sm text-gray-500">{song.composer} · {song.description}</p>
                  </div>
                </div>
                {hasAudio ? (
                  <Link
                    href={`/songs/${song.slug}`}
                    className="block w-full px-4 py-2 text-sm font-medium text-center text-blue-500 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
                  >
                    查看详情
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 text-sm font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded cursor-not-allowed"
                  >
                    即将上线
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
