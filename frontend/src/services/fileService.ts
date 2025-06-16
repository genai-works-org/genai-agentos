import { apiService } from './apiService';
import { environment } from '../common/environment';
import { tokenService } from './apiService';

export interface FileMetadata {
  id: string;
  session_id: string;
  request_id: string;
  original_name: string;
  mimetype: string;
  internal_id: string;
  internal_name: string;
  from_agent: boolean;
  created_at: string;
  size: number;
}

export interface FileData {
  file_id: string;
  session_id: string;
  request_id: string;
}

export const fileService = {
  async uploadFile(file: File, requestId?: string, sessionId?: string) {
    const formData = new FormData();
    formData.append('file', file);

    if (requestId) {
      formData.append('request_id', requestId);
    }

    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await apiService.post<{ id: string }>('/files', formData, {
      noStingify: true,
      isFormData: true,
    });

    return response.data.id;
  },

  async downloadFile(fileId: string): Promise<{ url: string; fileId: string }> {
    const token = tokenService.getToken();
    const response = await fetch(`${environment.apiBaseUrl}/files/${fileId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Create a download link
    const url = window.URL.createObjectURL(blob);

    return {
      url,
      fileId,
    };
  },

  async getFileMetadata(fileId: string) {
    const response = await apiService.get<FileMetadata>(
      `/files/${fileId}/metadata`,
    );
    return response.data;
  },

  async getFilesByRequestId(sessionId: string) {
    const response = await apiService.get<FileData[]>('/files', {
      params: {
        session_id: sessionId,
      },
    });
    return response.data;
  },

  async getFileById(id: string) {
    const response = await apiService.get<any>(`/files/${id}`);
    return response.data;
  },
};
