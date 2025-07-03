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
  metadata: Record<string, string>;
}

export interface CreateProviderBody {
  name: string;
  api_key: string;
  metadata: Record<string, string>;
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
  provider: string;
  api_key: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, string>;
}

export interface Config {
  provider: string;
  data: Record<string, string>;
}

export interface ActiveModel extends ModelConfig {
  provider: string;
}

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure openai',
  OLLAMA: 'ollama',
} as const;

export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

export const TOOLTIP_MESSAGES = {
  openai: 'Provide OpenAI API key for adding a model',
  'azure openai':
    'Provide Azure OpenAI endpoint, API key, API version and Deployment name for adding a model',
  ollama: 'Provide Ollama Base URL for adding a model',
};

export const PROVIDERS_OPTIONS = [
  { value: AI_PROVIDERS.OPENAI, label: 'OpenAI' },
  { value: AI_PROVIDERS.AZURE_OPENAI, label: 'Azure OpenAI' },
  { value: AI_PROVIDERS.OLLAMA, label: 'Ollama' },
];
