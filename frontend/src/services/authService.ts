import { USER_STORAGE_KEY } from '../constants/localStorage';
import { apiService, tokenService } from './apiService';

export interface User {
  id?: string;
  username: string;
  accessToken: string;
  tokenType: string;
  createdAt?: string;
  updatedAt?: string;
}

class AuthService {
  // Get current user from localStorage
  getCurrentUser(): User | null {
    const token = tokenService.getToken();
    if (!token) return null;

    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      this.logout();
      return null;
    }
  }

  // Login with username and password
  async login(username: string, password: string): Promise<User> {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);

    const response = await apiService.post<{
      access_token: string;
      token_type: string;
      refresh_token?: string;
    }>('/api/login/access-token', params.toString(), {
      noStingify: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
    });

    const { access_token, token_type, refresh_token } = response.data;

    // Store tokens using tokenService
    tokenService.setToken(access_token);
    if (refresh_token) {
      tokenService.setRefreshToken(refresh_token);
    }

    const userData: User = {
      username,
      accessToken: access_token,
      tokenType: token_type,
    };

    // Store user info in localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    return userData;
  }

  // Register new user
  async signup(username: string, password: string): Promise<any> {
    const response = await apiService.post<{
      id: string;
      username: string;
      created_at: string;
      updated_at: string;
    }>('/api/register', {
      username,
      password,
    });

    return response.data;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
    tokenService.removeToken();
    tokenService.removeRefreshToken();
    window.location.href = '/login';
  }

  // Get user profile
  async getUserProfile(id: string) {
    const response = await apiService.get(`/api/profiles/${id}`);
    return response.data;
  }

  // Update user profile
  async updateUserProfile(
    id: string,
    data: {
      max_last_messages: number;
    },
  ) {
    const response = await apiService.patch(`/api/profiles/${id}`, data);
    return response.data;
  }
}

export const authService = new AuthService();
