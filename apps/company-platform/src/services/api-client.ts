const API_BASE_URL = ((import.meta as any)?.env?.VITE_API_URL as string) || '';

export class ApiError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code = 'API_ERROR', statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }
}

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage?.getItem('docsearch_company_token') ||
    window.localStorage?.getItem('docsearch_auth_token') ||
    window.localStorage?.getItem('token') ||
    window.sessionStorage?.getItem('docsearch_company_token') ||
    window.sessionStorage?.getItem('docsearch_auth_token') ||
    window.sessionStorage?.getItem('token') ||
    ''
  );
}

export function isMockFallbackAllowed(): boolean {
  return false;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err.error || { code: 'HTTP_ERROR', message: err.message || res.statusText }
      };
    }

    const json = await res.json();
    if (json && typeof json === 'object' && 'success' in json && typeof (json as any).success === 'boolean') {
      return json;
    }
    return { success: true, data: json as T };
  } catch (err: unknown) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' }
    };
  }
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiRequest<T>(endpoint, options);
  if (!res.success || res.data === undefined) {
    const message = res.error?.message || 'API request failed';
    const code = res.error?.code || 'API_ERROR';
    throw new ApiError(message, code);
  }
  return res.data;
}
