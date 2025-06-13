import { environment } from '../common/environment';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '../constants/localStorage';
import { useToast } from '../hooks/useToast';
// Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
}

interface PostOptions extends RequestInit {
  noStingify?: boolean;
  isFormData?: boolean;
}

// Constants
const API_BASE_URL = environment.apiBaseUrl;

// Token management
export const tokenService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiService {
  private toast = useToast();

  // Helper function to handle response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.detail || errorData.message || (await response.text());
      } catch {
        errorMessage = await response.text();
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        statusText: response.statusText,
      };

      // Handle 403 Forbidden error
      if (response.status === 403 || response.status === 401) {
        // Import authService and trigger logout
        const { authService } = await import('./authService');
        authService.logout();
        this.toast.showError('Session expired. Please login again.');
      } else {
        // Show the actual error message from the API
        this.toast.showError(errorMessage);
      }

      throw error;
    }

    // Check if response has content
    const contentLength = response.headers.get('content-length');
    const isEmpty = contentLength === '0' || contentLength === null;

    const data = isEmpty ? null : await response.json();
    return {
      data: data as T,
      status: response.status,
      statusText: response.statusText,
    };
  }

  // Helper function to refresh token
  // private async refreshToken(): Promise<void> {
  //   const refreshToken = tokenService.getRefreshToken();
  //   if (!refreshToken) {
  //     throw new Error('No refresh token available');
  //   }

  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/login/refresh-token`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ refresh_token: refreshToken }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to refresh token');
  //     }

  //     const data = await response.json();
  //     tokenService.setToken(data.access_token);
  //     if (data.refresh_token) {
  //       tokenService.setRefreshToken(data.refresh_token);
  //     }
  //   } catch (error) {
  //     tokenService.removeToken();
  //     tokenService.removeRefreshToken();
  //     throw error;
  //   }
  // }

  // Helper function to make request with retry
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
  ): Promise<ApiResponse<T>> {
    // Check if user is authenticated
    const token = tokenService.getToken();
    if (
      !token &&
      !endpoint.includes('/api/login') &&
      !endpoint.includes('/api/register')
    ) {
      throw new Error('User is not authenticated');
    }

    const headers = this.getHeaders();
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        requestOptions,
      );
      return await this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  // Helper function to get headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {};

    const token = tokenService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Helper function to handle request with notifications

  // Helper function to build URL with query parameters
  private buildUrlWithParams(
    endpoint: string,
    params?: Record<string, string>,
  ): string {
    if (!params) return endpoint;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  // Public API methods
  async get<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> } = {},
  ): Promise<ApiResponse<T>> {
    try {
      const { params, ...requestOptions } = options;
      const url = this.buildUrlWithParams(endpoint, params);
      const response = await this.makeRequest<T>(url, {
        ...requestOptions,
        method: 'GET',
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async post<T>(
    endpoint: string,
    data: any,
    options: PostOptions = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeRequest<T>(endpoint, {
        ...options,
        method: 'POST',
        body: options.noStingify ? data : JSON.stringify(data),
        headers: {
          ...options.headers,
          ...(!options.isFormData &&
            !options.noStingify && { 'Content-Type': 'application/json' }),
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async put<T>(
    endpoint: string,
    data: any,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.makeRequest<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async patch<T>(
    endpoint: string,
    data: any,
    options: RequestInit & { params?: Record<string, string> } = {},
  ): Promise<ApiResponse<T>> {
    try {
      const { params, ...requestOptions } = options;
      const url = this.buildUrlWithParams(endpoint, params);
      const response = await this.makeRequest<T>(url, {
        ...requestOptions,
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> } = {},
  ): Promise<ApiResponse<T>> {
    try {
      const { params, ...requestOptions } = options;
      const url = this.buildUrlWithParams(endpoint, params);
      const response = await this.makeRequest<T>(url, {
        ...requestOptions,
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService();
