import { API_V1_URL } from '../config';

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
  const response = await fetch(`${API_V1_URL}/image-generation/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '提交图片生成任务失败');
  }
  
  return response.json();
};

export const getImageGenerationStatus = async (taskId: string): Promise<ImageGenerationTask> => {
  const response = await fetch(`${API_V1_URL}/image-generation/status/${taskId}`);
  
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '获取任务状态失败');
  }
  
  return response.json();
};
