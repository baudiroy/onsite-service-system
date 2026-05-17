import { clearAccessToken, getAccessToken } from './tokenStorage';
import type { CurrentUser, LoginResponse } from '../types/auth';

export type ApiEnvelope<T> = {
  data?: T;
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown[];
    requestId?: string;
  };
  requestId?: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown[];
  requestId?: string;

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown[], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function parseJson<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('伺服器回傳格式無法解析。', response.status, 'INVALID_RESPONSE');
  }
}

export async function apiRequestEnvelope<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = getAccessToken();
  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await parseJson<T>(response);

  if (response.status === 401) {
    clearAccessToken();
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const error = payload.error;
    throw new ApiError(
      error?.message || '請求失敗，請稍後再試。',
      response.status,
      error?.code,
      error?.details,
      error?.requestId || payload.requestId
    );
  }

  return payload;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await apiRequestEnvelope<T>(path, options);
  return payload.data as T;
}

export const authApi = {
  login(email: string, password: string) {
    return apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: { email, password }
    });
  },

  me() {
    return apiRequest<CurrentUser>('/api/v1/auth/me');
  },

  logout() {
    return apiRequest<{ success: boolean }>('/api/v1/auth/logout', {
      method: 'POST'
    });
  }
};
