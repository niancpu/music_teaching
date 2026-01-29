import Link from 'next/link';
import SongCard from '@/components/SongCard';
import { fetchSongs } from '@/lib/api/server';
import songsData from '@/data/songs.json';
import type { Song } from '@/types/song';

async function getSongs(): Promise<Song[]> {
  try {
    const response = await fetchSongs();
    return response.songs;
  } catch {
    // Fallback to static data if API is unavailable
    return songsData.songs as Song[];
  }
}

export default async function Home() {
  const songs = await getSongs();
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-medium text-gray-900 mb-4">音乐教学资源平台</h1>
          <p className="text-xl text-gray-500 mb-8">获取高质量教学音频与课件，分享你的创作</p>
          <div className="flex justify-center gap-4">
            <Link
              href="#audio-library"
              className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
            >
              开始探索
            </Link>
            <Link
              href="#"
              className="px-6 py-2.5 bg-white text-blue-500 text-sm font-medium border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
            >
              了解更多
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Audio Library Section */}
      <section id="audio-library" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">音频库</h2>
            <p className="text-gray-500">精选管弦乐分轨音频资源</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {songs.map((song) => (
              <SongCard key={song.slug} song={song} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/library"
              className="px-6 py-2.5 bg-white text-blue-500 text-sm font-medium border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
            >
              查看全部音频
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Courseware Section */}
      <section id="courseware" className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">课件中心</h2>
            <p className="text-gray-500 mb-6">专业的音乐教学课件，助力课堂教学</p>
            <Link
              href="#"
              className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors inline-block"
            >
              浏览课件
            </Link>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section id="creator" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">创作者中心</h2>
            <p className="text-gray-500 mb-6">上传并分享你的音乐教学资源</p>
            <Link
              href="#"
              className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors inline-block"
            >
              开始创作
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
