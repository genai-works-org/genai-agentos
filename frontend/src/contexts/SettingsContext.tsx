import type { FC, ReactNode } from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import localStorage from '../services/localStorageService';
import { useModels } from '../hooks/useModels';
import { ModelConfig, ModelsConfigs, ActiveModel } from '../types/model';
import { ACTIVE_MODEL_KEY } from '../constants/localStorage';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  systemPrompt: string;
  providers: ModelsConfigs[];
  activeModel: ActiveModel | null;
  setActiveModel: (model: ModelConfig | null) => void;
  refetchModels: () => Promise<void>;
  availableModels: ModelConfig[];
  isModelAvailable: boolean;
  isModelSelected: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [providers, setProviders] = useState<ModelsConfigs[]>([]);
  const [model, setModel] = useState<ActiveModel | null>(() =>
    localStorage.get(ACTIVE_MODEL_KEY),
  );
  const { fetchModels, fetchSystemPrompt } = useModels();
  const { user } = useAuth();

  const availableModels = useMemo(() => {
    return providers.flatMap(provider => provider.configs);
  }, [providers]);

  const isModelAvailable = availableModels.length > 0;
  const isModelSelected = availableModels.some(m => m.id === model?.id);

  const refetchModels = useCallback(async () => {
    const models = await fetchModels();
    setProviders(models);
  }, [fetchModels]);

  const setActiveModel = useCallback(
    (model: ModelConfig | null) => {
      const providerName = providers.find(provider =>
        provider.configs.some(m => m.id === model?.id),
      )?.provider;

      const activeModel = model
        ? {
            ...model,
            provider: providerName || '',
          }
        : null;

      localStorage.set(ACTIVE_MODEL_KEY, activeModel);
      setModel(activeModel);
    },
    [providers],
  );

  useEffect(() => {
    if (!user) return;
    fetchSystemPrompt().then(setSystemPrompt);
    fetchModels().then(setProviders);
  }, [fetchSystemPrompt, fetchModels, user]);

  return (
    <SettingsContext.Provider
      value={{
        systemPrompt,
        providers,
        activeModel: model,
        setActiveModel,
        refetchModels,
        availableModels,
        isModelAvailable,
        isModelSelected,
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
