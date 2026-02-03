import { apiPostDirect, apiGetDirect } from '../client';

export interface VisualizationRequest {
  audio_path: string;
  style: 'circular' | 'radial' | 'bars' | 'particle';
  color_scheme: string;
  resolution: '720p' | '1080p' | '4k';
}

export interface VisualizationTask {
  task_id: string;
  status: 'pending' | 'analyzing' | 'rendering' | 'completed' | 'failed';
  progress: number;
  video_path?: string;
  error?: string;
}

export interface VisualizationTaskResponse {
  task_id: string;
  message: string;
}

export const createVisualization = async (data: VisualizationRequest): Promise<VisualizationTaskResponse> => {
  return apiPostDirect<VisualizationTaskResponse, VisualizationRequest>('/visualization/render', data);
};

export const getVisualizationStatus = async (taskId: string): Promise<VisualizationTask> => {
  return apiGetDirect<VisualizationTask>(`/visualization/status/${taskId}`);
};
