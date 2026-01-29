import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Music } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';
import { fetchSongBySlug, fetchSongs } from '@/lib/api/server';
import songsData from '@/data/songs.json';
import type { Song } from '@/types/song';

const staticSongs = songsData.songs as Song[];

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSong(slug: string): Promise<Song | null> {
  try {
    const response = await fetchSongBySlug(slug);
    return response.song;
  } catch {
    // Fallback to static data if API is unavailable
    return staticSongs.find((s) => s.slug === slug) || null;
  }
}

export async function generateStaticParams() {
  try {
    const response = await fetchSongs();
    return response.songs.map((song) => ({
      slug: song.slug,
    }));
  } catch {
    // Fallback to static data
    return staticSongs.map((song) => ({
      slug: song.slug,
    }));
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const song = await getSong(slug);
  if (!song) return { title: '歌曲未找到' };
  return {
    title: `${song.title} - 音乐教学平台`,
    description: song.description,
  };
}

export default async function SongPage({ params }: PageProps) {
  const { slug } = await params;
  const song = await getSong(slug);

  if (!song) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-[57px] z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Link>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-medium text-gray-900">{song.title}</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">首页</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">{song.title}</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">{song.title}</h1>
          <p className="text-gray-500">{song.description}</p>
        </div>

        {/* Audio Player */}
        <AudioPlayer song={song} />
      </div>
    </div>
  );
}
