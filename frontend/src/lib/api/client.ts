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
  if (!response.ok) {
    let errorData: APIResponse<T> | null = null;
    try {
      errorData = await response.json();
    } catch {
      throw new APIError(
        `HTTP_${response.status}`,
        response.statusText || `Request failed with status ${response.status}`
      );
    }
    if (errorData?.error) {
      throw new APIError(errorData.error.code, errorData.error.message, errorData.error.field);
    }
    throw new APIError(`HTTP_${response.status}`, `Request failed with status ${response.status}`);
  }

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

/**
 * Handle direct response (for endpoints that don't use APIResponse wrapper)
 */
async function handleDirectResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      // Handle FastAPI validation errors where detail is an array
      if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail
          .map((err: { msg?: string; message?: string }) => err.msg || err.message || JSON.stringify(err))
          .join('; ');
      } else if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (errorData.detail) {
        errorMessage = JSON.stringify(errorData.detail);
      }
    } catch {
      /* use default message */
    }
    throw new APIError(`HTTP_${response.status}`, errorMessage);
  }
  return response.json();
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

/**
 * GET request for endpoints that return direct data (not wrapped in APIResponse)
 */
export async function apiGetDirect<T>(
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

  return handleDirectResponse<T>(response);
}

/**
 * POST request for endpoints that return direct data (not wrapped in APIResponse)
 */
export async function apiPostDirect<T, B = unknown>(
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

  return handleDirectResponse<T>(response);
}
