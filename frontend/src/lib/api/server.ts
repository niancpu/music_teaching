/**
 * Server-side API client for use in Server Components
 */

import { API_V1_URL } from './config';
import type { Song } from '@/types/song';

export interface SongListResponse {
  songs: Song[];
  total: number;
}

export interface SongDetailResponse {
  song: Song;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function serverFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_V1_URL}${endpoint}`, {
    cache: 'no-store', // Always fetch fresh data
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: APIResponse<T> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Unknown error');
  }

  return data.data;
}

export async function fetchSongs(category?: string): Promise<SongListResponse> {
  const params = category ? `?category=${category}` : '';
  return serverFetch<SongListResponse>(`/songs${params}`);
}

export async function fetchSongBySlug(slug: string): Promise<SongDetailResponse> {
  return serverFetch<SongDetailResponse>(`/songs/${slug}`);
}
