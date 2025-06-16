import {
  CreateModelBody,
  CreateProviderBody,
  ModelConfig,
  ModelsConfigs,
  Provider,
} from '../types/model';
import { apiService } from './apiService';

export const modelService = {
  async getPrompt() {
    const response = await apiService.get<{ system_prompt: string }>(
      '/api/llm/model/prompt',
    );

    return response.data?.system_prompt;
  },

  async getModels() {
    const response = await apiService.get<ModelsConfigs[]>(
      '/api/llm/model/configs',
    );
    return response.data;
  },

  async getModel(id: string) {
    const response = await apiService.get<ModelConfig>(
      `/api/llm/model/config/${id}`,
    );
    return response.data;
  },

  async createProvider(provider: CreateProviderBody) {
    const response = await apiService.post<Provider>(
      '/api/llm/model/provider',
      provider,
    );
    return response.data;
  },

  async updateProvider(
    provider: string,
    data: { api_key: string; metadata: Record<string, string> },
  ) {
    const response = await apiService.patch<Provider>(
      `/api/llm/model/providers/${provider}`,
      data,
    );
    return response.data;
  },

  async createModel(model: CreateModelBody) {
    const response = await apiService.post<ModelsConfigs[]>(
      '/api/llm/model/config',
      model,
    );
    return response.data;
  },

  async updateModel(id: string, model: Partial<ModelConfig>) {
    const response = await apiService.patch<ModelConfig>(
      `/api/llm/model/config/${id}`,
      model,
    );
    return response.data;
  },

  async deleteModel(id: string) {
    await apiService.delete(`/api/llm/model/config/${id}`);
  },
};
