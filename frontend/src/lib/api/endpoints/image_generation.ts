import { apiPostDirect, apiGetDirect } from '../client';

export interface AudioFeatures {
  tempo: number;
  energy: number;
  valence: number;
  key: string;
  mode: 'major' | 'minor';
  spectral_centroid: number;
  mfcc_summary: number[];
}

export interface ImageGenerationRequest {
  audio_path: string;
  style: string;
  aspect_ratio: '1:1' | '16:9' | '9:16';
  custom_prompt?: string;
  provider?: 'openai' | 'google';
}

export interface ImageGenerationTask {
  task_id: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed';
  progress: number;
  audio_features?: AudioFeatures;
  generated_prompt?: string;
  image_url?: string;
  error?: string;
}

export interface ImageGenerationSubmitResponse {
  task_id: string;
  message: string;
}

export const createImageGenerationTask = async (data: ImageGenerationRequest): Promise<ImageGenerationSubmitResponse> => {
  return apiPostDirect<ImageGenerationSubmitResponse, ImageGenerationRequest>('/image-generation/generate', data);
};

export const getImageGenerationStatus = async (taskId: string): Promise<ImageGenerationTask> => {
  return apiGetDirect<ImageGenerationTask>(`/image-generation/status/${taskId}`);
};
