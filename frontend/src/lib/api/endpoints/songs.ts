/**
 * Songs API endpoints
 */

import { apiGet } from '../client';
import type { Song } from '@/types/song';

export interface SongListResponse {
  songs: Song[];
  total: number;
}

export interface SongDetailResponse {
  song: Song;
}

export async function getSongs(category?: string): Promise<SongListResponse> {
  return apiGet<SongListResponse>('/songs', category ? { category } : undefined);
}

export async function getSongBySlug(slug: string): Promise<SongDetailResponse> {
  return apiGet<SongDetailResponse>(`/songs/${slug}`);
}
