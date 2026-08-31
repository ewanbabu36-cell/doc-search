import { AppError, ErrorCode } from '@docsearch/shared-core';

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClient {
  constructor(private config: ApiClientConfig) {}

  private async buildHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-request-id': crypto.randomUUID(),
      ...this.config.defaultHeaders,
      ...customHeaders
    };

    if (this.config.getAuthToken) {
      const token = await this.config.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const normalizedBase = this.config.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    const url = new URL(`${normalizedBase}/${normalizedPath}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options?.headers);

    const init: RequestInit = {
      method: 'GET',
      headers,
      ...(options?.signal ? { signal: options.signal } : {})
    };

    const res = await fetch(url, init);
    return this.handleResponse<T>(res);
  }

  async post<T, B = unknown>(path: string, body: B, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options?.headers);

    const init: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...(options?.signal ? { signal: options.signal } : {})
    };

    const res = await fetch(url, init);
    return this.handleResponse<T>(res);
  }

  async patch<T, B = unknown>(path: string, body: B, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options?.headers);

    const init: RequestInit = {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      ...(options?.signal ? { signal: options.signal } : {})
    };

    const res = await fetch(url, init);
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options?.headers);

    const init: RequestInit = {
      method: 'DELETE',
      headers,
      ...(options?.signal ? { signal: options.signal } : {})
    };

    const res = await fetch(url, init);
    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
      if (this.config.onUnauthorized) {
        this.config.onUnauthorized();
      }
      throw AppError.unauthorized('Session expired or unauthenticated. Please log in again.');
    }

    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!res.ok) {
      if (isJson) {
        const errorData = (await res.json()) as {
          error?: { message?: string; code?: ErrorCode; details?: { field: string; message: string }[] };
          message?: string;
          code?: ErrorCode;
        };
        throw new AppError({
          message: errorData?.error?.message || errorData?.message || 'Request failed',
          code: errorData?.error?.code || errorData?.code || ErrorCode.INTERNAL_SERVER_ERROR,
          statusCode: res.status,
          details: errorData?.error?.details || []
        });
      }
      const errorText = await res.text();
      throw new AppError({
        message: errorText || `HTTP ${res.status}: ${res.statusText}`,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: res.status
      });
    }

    if (isJson) {
      return (await res.json()) as T;
    }

    return (await res.text()) as unknown as T;
  }
}
