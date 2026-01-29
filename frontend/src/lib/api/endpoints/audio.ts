/**
 * Audio API endpoints
 */

import { apiGet, apiPostFormData } from '../client';

export interface ScoreListResponse {
  scores: string[];
}

export interface AudioAnalysisResult {
  status: string;
  result?: Record<string, unknown>;
}

export async function analyzeAudio(file: File): Promise<AudioAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiPostFormData<AudioAnalysisResult>('/audio/analyze', formData);
}

export async function getScores(): Promise<ScoreListResponse> {
  return apiGet<ScoreListResponse>('/scores');
}
