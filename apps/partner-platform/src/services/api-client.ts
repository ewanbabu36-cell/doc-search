const API_BASE_URL = typeof window !== 'undefined' && window.location.port !== '4000'
  ? 'http://localhost:4000'
  : '';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  try {
    const token = typeof window !== 'undefined' ? window.sessionStorage?.getItem('auth_token') || '' : '';
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
      return { success: false, error: err.error || { code: 'HTTP_ERROR', message: res.statusText } };
    }

    const json = await res.json();
    return json;
  } catch (err: unknown) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' }
    };
  }
}
