import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { AIModel } from '../services/apiService';
import { useModels } from '../hooks/useModels';
import { ModelConfig } from '../services/modelService';
import { AI_PROVIDERS } from '../pages/SettingsPage';

export interface Settings {
  openAi: {
    api_key: string;
  };
  azureOpenAi: {
    endpoint: string;
    api_key: string;
    api_version: string;
    deployment_name: string;
  };
  ollama: {
    base_url: string;
  };
  model: AIModel | null;
  ai_provider: string;
  system_prompt: string | null;
  max_last_messages: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  availableModels: AIModel[];
  azureOpenAiModels: AIModel[];
  openAiModels: AIModel[];
  ollamaModels: AIModel[];
  loading: boolean;
  error: string | null;
  createModel: (model: Omit<ModelConfig, 'id'>) => Promise<ModelConfig>;
  updateModel: (
    id: string,
    model: Partial<ModelConfig>,
  ) => Promise<ModelConfig>;
  deleteModel: (id: string) => Promise<void>;
}

const defaultSettings: Settings = {
  openAi: {
    api_key: '',
  },
  azureOpenAi: {
    endpoint: '',
    api_key: '',
    api_version: '',
    deployment_name: '',
  },
  ollama: {
    base_url: '',
  },
  model: null,
  ai_provider: AI_PROVIDERS.OPENAI,
  system_prompt: null,
  max_last_messages: 5,
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const LOCAL_STORAGE_KEY = 'app-settings';
  const {
    models: availableModels,
    loading,
    error,
    system_prompt,
    createModel,
    updateModel,
    deleteModel,
  } = useModels();
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved
        ? { ...JSON.parse(saved), system_prompt: system_prompt }
        : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [azureOpenAiModels, setAzureOpenAiModels] = useState<AIModel[]>([]);
  const [openAiModels, setOpenAiModels] = useState<AIModel[]>([]);
  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([]);

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      system_prompt,
    }));
  }, [system_prompt]);

  useEffect(() => {
    const settingsForStorage = {
      openAi: {
        api_key: settings.openAi.api_key,
      },
      azureOpenAi: {
        endpoint: settings.azureOpenAi.endpoint,
        api_key: settings.azureOpenAi.api_key,
        api_version: settings.azureOpenAi.api_version,
        deployment_name: settings.azureOpenAi.deployment_name,
      },
      ollama: {
        base_url: settings.ollama.base_url,
      },
      model: settings.model,
      ai_provider: settings.ai_provider,
      max_last_messages: settings.max_last_messages,
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsForStorage));
  }, [settings]);

  useEffect(() => {
    if (availableModels.length === 0) {
      setAzureOpenAiModels([]);
      setOpenAiModels([]);
      setOllamaModels([]);

      return;
    }

    const azureOpenAiModels = availableModels.filter(
      model => model.provider === AI_PROVIDERS.AZURE_OPENAI,
    );
    const openAiModels = availableModels.filter(
      model => model.provider === AI_PROVIDERS.OPENAI,
    );
    const ollamaModels = availableModels.filter(
      model => model.provider === AI_PROVIDERS.OLLAMA,
    );

    setAzureOpenAiModels(azureOpenAiModels);
    setOpenAiModels(openAiModels);
    setOllamaModels(ollamaModels);

    if (azureOpenAiModels.length > 0) {
      setSettings(prev => {
        const newSettings = { ...prev };
        newSettings.azureOpenAi = {
          endpoint: azureOpenAiModels[0].credentials.endpoint,
          api_key: azureOpenAiModels[0].credentials.api_key,
          api_version: azureOpenAiModels[0].credentials.api_version,
          deployment_name: azureOpenAiModels[0].credentials.deployment_name,
        };

        return newSettings;
      });
    }

    if (openAiModels.length > 0) {
      setSettings(prev => {
        const newSettings = { ...prev };
        newSettings.openAi = {
          api_key: openAiModels[0].credentials.api_key,
        };

        return newSettings;
      });
    }

    if (ollamaModels.length > 0) {
      setSettings(prev => {
        const newSettings = { ...prev };
        newSettings.ollama = {
          base_url: ollamaModels[0].credentials.base_url,
        };

        return newSettings;
      });
    }
  }, [availableModels]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        availableModels,
        azureOpenAiModels,
        openAiModels,
        ollamaModels,
        loading,
        error,
        createModel,
        updateModel,
        deleteModel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
