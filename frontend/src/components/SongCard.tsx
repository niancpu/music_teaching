import Link from 'next/link';
import { Music, Feather, Leaf, Baby } from 'lucide-react';
import type { Song } from '@/types/song';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Music,
  Feather,
  Leaf,
  Baby,
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-500',
  red: 'bg-red-50 text-red-500',
  green: 'bg-green-50 text-green-500',
  yellow: 'bg-yellow-50 text-yellow-500',
};

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  const IconComponent = iconMap[song.icon] || Music;
  const colorClass = colorMap[song.iconColor] || colorMap.blue;

  return (
    <Link
      href={`/songs/${song.slug}`}
      className="block bg-white border border-gray-200 rounded-lg p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-1">{song.title}</h3>
          <p className="text-sm text-gray-500">{song.description}</p>
        </div>
      </div>
    </Link>
  );
}
