export interface ModelConfig {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  temperature: number;
  credentials: Record<string, string>;
  max_last_messages: number;
  user_prompt: string;
}

export interface ModelsConfigs {
  api_key: string;
  provider: string;
  configs: ModelConfig[];
}

export interface CreateProviderBody {
  name: string;
  api_key: string;
  credentials: Record<string, string>;
}

export interface CreateModelBody {
  name: string;
  model: string;
  system_prompt: string;
  temperature: number;
  user_prompt: string;
  max_last_messages: number;
  provider: string;
  credentials: Record<string, string>;
  id?: string;
}

export interface Provider {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  creator_id: string;
  updated_at: string;
}

export interface Config {
  provider: string;
  data: Record<string, string>;
}

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure openai',
  OLLAMA: 'ollama',
} as const;

export const TOOLTIP_MESSAGES = {
  OPENAI: 'Provide OpenAI API key and model',
  AZURE_OPENAI: 'Provide Azure OpenAI API key, endpoint, and deployment name',
  OLLAMA: 'Provide Ollama base URL and model',
  COMMON: 'Provide required provider data first',
} as const;
