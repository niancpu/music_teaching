/**
 * Hook for fetching songs data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSongs, getSongBySlug, SongListResponse, SongDetailResponse } from '@/lib/api';
import type { Song } from '@/types/song';

interface UseSongsResult {
  songs: Song[];
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSongs(category?: string): UseSongsResult {
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSongs(category);
      setSongs(data.songs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch songs'));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return { songs, total, loading, error, refetch: fetchSongs };
}

interface UseSongResult {
  song: Song | null;
  loading: boolean;
  error: Error | null;
}

export function useSong(slug: string): UseSongResult {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSong() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSongBySlug(slug);
        setSong(data.song);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch song'));
      } finally {
        setLoading(false);
      }
    }

    fetchSong();
  }, [slug]);

  return { song, loading, error };
}
