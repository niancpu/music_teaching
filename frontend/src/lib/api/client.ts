/**
 * API client with fetch wrapper
 */

import { API_V1_URL } from './config';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
  message?: string;
  timestamp: string;
}

export class APIError extends Error {
  code: string;
  field?: string;

  constructor(code: string, message: string, field?: string) {
    super(message);
    this.code = code;
    this.field = field;
    this.name = 'APIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: APIResponse<T> = await response.json();

  if (!data.success || data.error) {
    throw new APIError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An unknown error occurred',
      data.error?.field
    );
  }

  return data.data as T;
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_V1_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<T>(response);
}

export async function apiPost<T, B = unknown>(
  endpoint: string,
  body: B
): Promise<T> {
  const response = await fetch(`${API_V1_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return handleResponse<T>(response);
}

export async function apiPostFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_V1_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<T>(response);
}
