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

export function isTokenExpired(token: string): boolean {
  if (!token || !token.includes('.')) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64Url)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= (payload.exp * 1000) - 30000; // 30-second buffer
  } catch {
    return false;
  }
}

export function clearAllAuthTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('docsearch:auth_logout'));
  } catch {}
  try {
    window.localStorage?.removeItem('docsearch_auth_token');
    window.localStorage?.removeItem('auth_token');
    window.localStorage?.removeItem('token');
    window.localStorage?.removeItem('docsearch_auth_session');
    window.localStorage?.removeItem('docsearch_partner_session');
    window.sessionStorage?.removeItem('docsearch_auth_token');
    window.sessionStorage?.removeItem('auth_token');
  } catch {}
}

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  const token = (
    window.localStorage?.getItem('docsearch_auth_token') ||
    window.localStorage?.getItem('auth_token') ||
    window.localStorage?.getItem('token') ||
    window.sessionStorage?.getItem('docsearch_auth_token') ||
    window.sessionStorage?.getItem('auth_token') ||
    ''
  );
  if (token && isTokenExpired(token)) {
    clearAllAuthTokens();
    return '';
  }
  return token;
}

let tokenRefreshPromise: Promise<string> | null = null;

export async function ensureAuthToken(): Promise<string> {
  const existing = getAuthToken();
  if (existing && !isTokenExpired(existing)) return existing;

  if (typeof window === 'undefined') return '';

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const refreshToken = window.localStorage?.getItem('docsearch_refresh_token');
      if (refreshToken && refreshToken.trim().length > 0) {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const json = await res.json().catch(() => null);
        if (json?.data?.accessToken) {
          window.localStorage?.setItem('docsearch_auth_token', json.data.accessToken);
          return json.data.accessToken as string;
        }
      }
    } catch (err) {
      console.warn('Silent auth token refresh note:', err);
    } finally {
      tokenRefreshPromise = null;
    }
    return '';
  })();

  return tokenRefreshPromise;
}

export function isMockFallbackAllowed(): boolean {
  if (typeof window !== 'undefined') {
    // Explicit developer/sandbox override only
    const explicit = window.localStorage?.getItem('docsearch_enable_mock_fallback');
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;

    // Vite environment configuration
    const envFlag = (import.meta as any).env?.VITE_ENABLE_MOCK_FALLBACK;
    if (envFlag === 'true') return true;
  }
  // Default to false: Authoritative clinical, billing, and pharmacy operations must never silently fake success
  return false;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  try {
    let token = getAuthToken();
    if (!token && typeof window !== 'undefined') {
      token = await ensureAuthToken();
    }

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
      const errMsg = err?.error?.message || err?.message || res.statusText;
      const isAuthIssue =
        res.status === 401 ||
        errMsg.includes('Authorization') ||
        errMsg.includes('expired') ||
        errMsg.includes('token');

      // Auto-retry once with refreshed token on 401
      if (isAuthIssue && !isRetry && typeof window !== 'undefined') {
        clearAllAuthTokens();
        const freshToken = await ensureAuthToken();
        if (freshToken) {
          return apiRequest<T>(endpoint, options, true);
        }
      }

      if (!isMockFallbackAllowed()) {
        throw new ApiError(errMsg, err?.error?.code || 'HTTP_ERROR', res.status);
      }

      return {
        success: false,
        error: err.error || { code: 'HTTP_ERROR', message: errMsg }
      };
    }

    const json = await res.json();
    if (json && typeof json === 'object' && 'success' in json && typeof (json as any).success === 'boolean') {
      return json;
    }
    return { success: true, data: json as T };
  } catch (err: unknown) {
    if (!isMockFallbackAllowed()) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err instanceof Error ? err.message : 'Network error', 'NETWORK_ERROR');
    }
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
