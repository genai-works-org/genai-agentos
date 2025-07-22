import { AI_PROVIDERS, Config, ModelsConfigs } from '../types/model';

export const isProviderSettingsSet = (
  configs: ModelsConfigs[],
  name: string,
) => {
  const provider = configs.find(c => c.provider === name);
  return Boolean(provider?.api_key) || Boolean(provider?.metadata?.base_url);
};

export const isProviderSettingsChanged = (
  provider: string,
  oldConfig: ModelsConfigs[],
  newConfig: Config,
) => {
  const targetProvider = oldConfig.find(c => c.provider === provider);
  const isNotEmpty = Object.values(newConfig.data).every(v => v !== '');

  if (!isNotEmpty) {
    return false;
  }

  if (provider === AI_PROVIDERS.OLLAMA) {
    return targetProvider?.metadata.base_url !== newConfig.data.base_url;
  }

  if (!targetProvider) return true;

  const prev = {
    ...targetProvider.metadata,
    api_key: targetProvider.api_key,
  };
  const curr = newConfig.data;

  const prevKeys = Object.keys(prev);
  const currKeys = Object.keys(curr);

  if (prevKeys.length !== currKeys.length) return true;

  for (const key of prevKeys) {
    if (prev[key as keyof typeof prev] !== curr[key]) {
      return true;
    }
  }

  return false;
};

export const getProviderModels = (
  models: ModelsConfigs[],
  provider: string,
) => {
  const providerModels = models.find(m => m.provider === provider);
  return providerModels ? providerModels.configs : [];
};

export const getInitialConfig = (providers: ModelsConfigs[]) => {
  const provider = providers.find(m => m.provider === AI_PROVIDERS.OPENAI);
  return {
    provider: AI_PROVIDERS.OPENAI,
    data: {
      api_key: provider?.api_key || '',
      ...provider?.metadata,
    },
  };
};

export const getInitialMetadata = (
  provider: string,
): Record<string, string> => {
  switch (provider) {
    case AI_PROVIDERS.OPENAI:
      return {
        api_key: '',
      };

    case AI_PROVIDERS.AZURE_OPENAI:
      return {
        endpoint: '',
        api_key: '',
        api_version: '',
        model: '',
      };

    case AI_PROVIDERS.OLLAMA:
      return {
        base_url: '',
      };

    default:
      return {};
  }
};
