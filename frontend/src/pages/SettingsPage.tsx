import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  SelectChangeEvent,
  Button,
} from '@mui/material';
import { useSettings } from '../contexts/SettingsContext';
import { useModels } from '../hooks/useModels';
import { MainLayout } from '../components/MainLayout';
import { OpenAISettings } from '../components/settings/OpenAISettings';
import { AzureOpenAISettings } from '../components/settings/AzureOpenAISettings';
import { OllamaSettings } from '../components/settings/OllamaSettings';
import { ModelForm } from '../components/ModelForm';
import ConfirmModal from '../components/ConfirmModal';
import {
  AI_PROVIDERS,
  Config,
  CreateModelBody,
  ModelConfig,
  ModelsConfigs,
  TOOLTIP_MESSAGES,
} from '../types/model';

const isProviderSettingsSet = (configs: ModelsConfigs[], name: string) => {
  const provider = configs.find(c => c.provider === name);
  return Boolean(provider?.api_key);
};

const isProviderSettingsChanged = (
  provider: string,
  oldConfig: ModelsConfigs[],
  newConfig: Config,
) => {
  const targetProvider = oldConfig.find(c => c.provider === provider);

  return (
    JSON.stringify({
      ...targetProvider?.metadata,
      api_key: targetProvider?.api_key,
    }) !== JSON.stringify(newConfig.data)
  );
};

const getProviderModels = (models: ModelsConfigs[], provider: string) => {
  const providerModels = models.find(m => m.provider === provider);
  return providerModels ? providerModels.configs : [];
};

export const SettingsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [config, setConfig] = useState<Config>({
    provider: AI_PROVIDERS.OPENAI,
    data: {},
  });
  const { providers, systemPrompt, refetchModels } = useSettings();
  const {
    createProvider,
    updateProvider,
    createModel,
    updateModel,
    deleteModel,
    loading,
  } = useModels();

  const handleProviderChange = (e: SelectChangeEvent<string>) => {
    const currentProvider = providers.find(p => p.provider === e.target.value);

    if (currentProvider) {
      const { provider, metadata, api_key } = currentProvider;
      setConfig({ provider, data: { ...metadata, api_key } });
      return;
    }

    setConfig({ provider: e.target.value, data: {} });
  };

  const handleEditModel = (model: ModelConfig) => {
    setSelectedModel(model);
    setShowForm(true);
  };

  const handleDeleteModel = async (model: ModelConfig) => {
    setSelectedModel(model);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedModel) return;

    await deleteModel(selectedModel.id);
    await refetchModels();
    setDeleteDialogOpen(false);
    setSelectedModel(null);
  };

  const handleSaveProvider = async () => {
    try {
      const { api_key, ...credentials } = config.data;
      const body = {
        api_key: api_key || '',
        metadata: credentials || {},
      };

      if (isProviderSettingsSet(providers, config.provider)) {
        await updateProvider(config.provider, body);
      } else {
        await createProvider({
          ...body,
          name: config.provider,
        });
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to create provider');
    } finally {
      refetchModels();
    }
  };

  const handleSaveModel = async (formData: CreateModelBody) => {
    try {
      const { id, provider, ...restData } = formData;
      if (id) {
        await updateModel(id, {
          ...restData,
        });
      } else {
        await createModel({
          ...restData,
          provider,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      refetchModels();
      setShowForm(false);
      setSelectedModel(null);
    }
  };

  useEffect(() => {
    const provider = providers.find(p => p.provider === config.provider);
    if (provider) {
      const { provider: providerName, metadata, api_key } = provider;
      setConfig({ provider: providerName, data: { ...metadata, api_key } });
    }
  }, [providers]);

  return (
    <MainLayout currentPage="Settings">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Box>
              <FormControl fullWidth>
                <InputLabel id="ai-provider-label">AI Provider</InputLabel>
                <Select
                  labelId="ai-provider-label"
                  id="ai-provider"
                  name="aiProvider"
                  value={config.provider}
                  label="AI Provider"
                  onChange={handleProviderChange}
                >
                  <MenuItem value={AI_PROVIDERS.OPENAI}>OpenAI</MenuItem>
                  <MenuItem value={AI_PROVIDERS.AZURE_OPENAI}>
                    Azure OpenAI
                  </MenuItem>
                  <MenuItem value={AI_PROVIDERS.OLLAMA}>Ollama</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {config.provider === AI_PROVIDERS.OPENAI && (
              <OpenAISettings
                settings={config}
                onSettingsChange={setConfig}
                availableModels={getProviderModels(
                  providers,
                  AI_PROVIDERS.OPENAI,
                )}
                onModelCreate={() => setShowForm(true)}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(providers, AI_PROVIDERS.OPENAI)
                }
                tooltipMessage={
                  !isProviderSettingsSet(providers, AI_PROVIDERS.OPENAI)
                    ? TOOLTIP_MESSAGES.OPENAI
                    : ''
                }
              />
            )}

            {config.provider === AI_PROVIDERS.AZURE_OPENAI && (
              <AzureOpenAISettings
                settings={config}
                onSettingsChange={setConfig}
                availableModels={getProviderModels(
                  providers,
                  AI_PROVIDERS.AZURE_OPENAI,
                )}
                onModelCreate={() => setShowForm(true)}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(providers, AI_PROVIDERS.AZURE_OPENAI)
                }
                tooltipMessage={
                  !isProviderSettingsSet(providers, AI_PROVIDERS.AZURE_OPENAI)
                    ? TOOLTIP_MESSAGES.AZURE_OPENAI
                    : ''
                }
              />
            )}

            {config.provider === AI_PROVIDERS.OLLAMA && (
              <OllamaSettings
                settings={config}
                onSettingsChange={setConfig}
                availableModels={getProviderModels(
                  providers,
                  AI_PROVIDERS.OLLAMA,
                )}
                onModelCreate={() => setShowForm(true)}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(providers, AI_PROVIDERS.OLLAMA)
                }
                tooltipMessage={
                  !isProviderSettingsSet(providers, AI_PROVIDERS.OLLAMA)
                    ? TOOLTIP_MESSAGES.OLLAMA
                    : ''
                }
              />
            )}

            <Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSaveProvider}
                disabled={
                  !isProviderSettingsChanged(config.provider, providers, config)
                }
              >
                Save Settings
              </Button>
            </Box>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Model"
        text={`Are you sure you want to delete the model "${selectedModel?.name}"?`}
      />

      {showForm && (
        <ModelForm
          settings={config}
          initialData={selectedModel}
          onSave={handleSaveModel}
          onCancel={() => {
            setSelectedModel(null);
            setShowForm(false);
          }}
          systemPrompt={systemPrompt}
          isLoading={loading}
        />
      )}
    </MainLayout>
  );
};
