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
import { Settings, useSettings } from '../contexts/SettingsContext';
import { AIModel } from '../services/apiService';
import { ModelConfig } from '../services/modelService';
import { MainLayout } from '../components/MainLayout';
import { OpenAISettings } from '../components/settings/OpenAISettings';
import { AzureOpenAISettings } from '../components/settings/AzureOpenAISettings';
import { OllamaSettings } from '../components/settings/OllamaSettings';
import { ModelForm } from '../components/ModelForm';
import ConfirmModal from '../components/ConfirmModal';

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure openai',
  OLLAMA: 'ollama',
} as const;

const TOOLTIP_MESSAGES = {
  OPENAI: 'Provide OpenAI API key and model',
  AZURE_OPENAI: 'Provide Azure OpenAI API key, endpoint, and deployment name',
  OLLAMA: 'Provide Ollama base URL and model',
  COMMON: 'Provide required provider data first',
} as const;

const isProviderSettingsSet = (
  settings: Settings,
  ai_provider?: string | undefined,
) => {
  switch (ai_provider) {
    case AI_PROVIDERS.OPENAI:
      return Boolean(settings.openAi.api_key);
    case AI_PROVIDERS.AZURE_OPENAI:
      return Boolean(
        settings.azureOpenAi.endpoint &&
          settings.azureOpenAi.api_key &&
          settings.azureOpenAi.deployment_name &&
          settings.azureOpenAi.api_version,
      );
    case AI_PROVIDERS.OLLAMA:
      return Boolean(settings.ollama.base_url);
    default:
      return false;
  }
};

export const SettingsPage = () => {
  const {
    settings,
    updateSettings,
    loading,
    createModel,
    updateModel,
    deleteModel,
    openAiModels,
    azureOpenAiModels,
    ollamaModels,
  } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<ModelConfig | null>(null);
  const [config, setConfig] = useState<Settings>(settings);

  useEffect(() => {
    setConfig(settings);
  }, [settings]);

  const handleProviderChange = (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    setConfig({ ...config, ai_provider: value });
  };

  const handleModelSelect = (model: AIModel) => {
    setConfig({ ...config, model });
  };

  const handleConfigChange = (data: Partial<Settings>) => {
    setConfig({ ...config, ...data });
  };

  const handleSave = () => {
    updateSettings(config);
    toast.success('Settings saved successfully');
  };

  const handleEditModel = (model: ModelConfig) => {
    setSelectedModel(model);
    setShowForm(true);
  };

  const handleDeleteModel = async (model: ModelConfig) => {
    setModelToDelete(model);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!modelToDelete) return;
    try {
      await deleteModel(modelToDelete.id);
      if (modelToDelete.id === currentModelId) {
        setCurrentModelId(null);
      }
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setDeleteDialogOpen(false);
      setModelToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setModelToDelete(null);
  };

  const handleSaveModel = async (formData: ModelConfig) => {
    try {
      const { id, ...restData } = formData;
      if (id) {
        await updateModel(id, restData);
      } else {
        await createModel(formData);
      }
      setShowForm(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCreateModel = () => {
    setSelectedModel(null);
    setShowForm(true);
  };

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
                  value={config.ai_provider}
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

            {config.ai_provider === AI_PROVIDERS.OPENAI && (
              <OpenAISettings
                settings={config}
                onSettingsChange={handleConfigChange}
                availableModels={openAiModels}
                onModelSelect={handleModelSelect}
                onModelCreate={handleCreateModel}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(config, AI_PROVIDERS.OPENAI)
                }
                tooltipMessage={TOOLTIP_MESSAGES.OPENAI}
              />
            )}

            {config.ai_provider === AI_PROVIDERS.AZURE_OPENAI && (
              <AzureOpenAISettings
                settings={config}
                onSettingsChange={handleConfigChange}
                availableModels={azureOpenAiModels}
                onModelSelect={handleModelSelect}
                onModelCreate={handleCreateModel}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(config, AI_PROVIDERS.AZURE_OPENAI)
                }
                tooltipMessage={TOOLTIP_MESSAGES.AZURE_OPENAI}
              />
            )}

            {config.ai_provider === AI_PROVIDERS.OLLAMA && (
              <OllamaSettings
                settings={config}
                onSettingsChange={handleConfigChange}
                availableModels={ollamaModels}
                onModelSelect={handleModelSelect}
                onModelCreate={handleCreateModel}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(config, AI_PROVIDERS.OLLAMA)
                }
                tooltipMessage={TOOLTIP_MESSAGES.OLLAMA}
              />
            )}

            <Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={!isProviderSettingsSet(config, config.ai_provider)}
              >
                Save Settings
              </Button>
            </Box>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Model"
        text={`Are you sure you want to delete the model "${modelToDelete?.name}"?`}
      />

      {showForm && (
        <ModelForm
          settings={config}
          initialData={selectedModel}
          availableModels={[
            ...openAiModels,
            ...azureOpenAiModels,
            ...ollamaModels,
          ].map(m => ({ name: m.model, provider: m.provider }))}
          onSave={handleSaveModel}
          onCancel={() => setShowForm(false)}
          isLoading={loading}
        />
      )}
    </MainLayout>
  );
};
