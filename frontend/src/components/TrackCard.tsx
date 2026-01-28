'use client';

import { useRef } from 'react';
import { Wind, Music, Volume2 } from 'lucide-react';
import type { Track } from '@/types/song';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wind,
  Music,
};

interface TrackCardProps {
  track: Track;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onVolumeChange: (volume: number) => void;
  onOpenScore?: () => void;
}

export default function TrackCard({ track, audioRef, onVolumeChange, onOpenScore }: TrackCardProps) {
  const IconComponent = iconMap[track.icon] || Music;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-blue-500">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{track.name}</h3>
              <p className="text-sm text-gray-500">{track.section}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="1"
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              {track.scoreFile && onOpenScore && (
                <button
                  onClick={onOpenScore}
                  className="px-3 py-1.5 text-sm font-medium text-blue-500 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-500 transition-colors"
                >
                  乐谱
                </button>
              )}
            </div>
          </div>
          <audio
            ref={audioRef}
            controls
            src={track.audioFile}
            className="w-full h-10"
          />
        </div>
      </div>
    </div>
  );
}
