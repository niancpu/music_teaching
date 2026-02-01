import { API_V1_URL } from '../config';

export interface VisualizationRequest {
  audio_path: string;
  style: 'circular' | 'radial' | 'bars';
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
  const response = await fetch(`${API_V1_URL}/visualization/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create visualization task');
  }
  
  return response.json();
};

export const getVisualizationStatus = async (taskId: string): Promise<VisualizationTask> => {
  const response = await fetch(`${API_V1_URL}/visualization/status/${taskId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get visualization status');
  }
  
  return response.json();
};
