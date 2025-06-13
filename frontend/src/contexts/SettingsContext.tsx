import type { FC, ReactNode } from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useModels } from '../hooks/useModels';
import { ModelConfig, ModelsConfigs } from '../types/model';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  systemPrompt: string;
  providers: ModelsConfigs[];
  activeModel: ModelConfig | null;
  availableModels: ModelConfig[];
  activeProvider: string;
  setActiveModel: (model: ModelConfig | null) => void;
  refetchModels: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [providers, setProviders] = useState<ModelsConfigs[]>([]);
  const [activeModel, setActiveModel] = useState<ModelConfig | null>(null);
  const [activeProvider, setActiveProvider] = useState('');
  const { fetchModels, fetchSystemPrompt } = useModels();
  const { user } = useAuth();

  const availableModels = useMemo(() => {
    return providers.flatMap(provider => provider.configs);
  }, [providers]);

  const refetchModels = useCallback(async () => {
    const models = await fetchModels();
    setProviders(models);
  }, [fetchModels]);

  useEffect(() => {
    if (!user) return;
    fetchSystemPrompt().then(setSystemPrompt);
    fetchModels().then(setProviders);
  }, [fetchSystemPrompt, fetchModels, user]);

  useEffect(() => {
    const providerName = providers.find(provider =>
      provider.configs.some(m => m.id === activeModel?.id),
    )?.provider;

    if (providerName) {
      setActiveProvider(providerName);
    }
  }, [providers, activeModel]);

  return (
    <SettingsContext.Provider
      value={{
        systemPrompt,
        providers,
        activeModel,
        availableModels,
        activeProvider,
        setActiveModel,
        refetchModels,
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
