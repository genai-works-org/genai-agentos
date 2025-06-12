import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  SelectChangeEvent,
  Button,
  TextField,
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
import { validateField } from '../utils/validation';
import { authService } from '../services/authService';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure openai',
  OLLAMA: 'ollama',
} as const;

const TOOLTIP_MESSAGES = {
  OPENAI: 'Provide OpenAI API key and model or save settings',
  AZURE_OPENAI:
    'Provide Azure OpenAI API key, endpoint, and deployment name or save settings',
  OLLAMA: 'Provide Ollama base URL and model or save settings',
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<ModelConfig | null>(null);
  const [config, setConfig] = useState<Settings>(settings);
  const defaultModels = {
    [AI_PROVIDERS.OPENAI]: openAiModels,
    [AI_PROVIDERS.AZURE_OPENAI]: azureOpenAiModels,
    [AI_PROVIDERS.OLLAMA]: ollamaModels,
  };
  const [models, setModels] = useState(defaultModels);
  const { isModalOpen, confirmLeave, cancelLeave } = useUnsavedChanges(
    Boolean(selectedModel),
    () => {
      setModels(defaultModels);
      setSelectedModel(null);
    },
  );
  const isMaxLastMessagesChanged =
    config.max_last_messages !== settings.max_last_messages;

  useEffect(() => {
    setConfig(settings);
  }, [settings]);

  useEffect(() => {
    setModels(defaultModels);
  }, [openAiModels, azureOpenAiModels, ollamaModels]);

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

  const handleSave = async () => {
    const user = authService.getCurrentUser();
    let userId;

    if (user?.accessToken) {
      const tokenParts = user.accessToken.split('.');

      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        userId = payload.id || payload.sub;
      }
    }

    if (isMaxLastMessagesChanged) {
      if (validateField('maxLastMessages', String(config.max_last_messages)))
        return;

      await authService.updateUserProfile(userId, {
        max_last_messages: config.max_last_messages,
      });
    }

    if (selectedModel) {
      const { id, ...restData } = selectedModel;
      if (id) {
        await updateModel(id, restData);
      } else {
        await createModel(selectedModel);
      }
    }

    setSelectedModel(null);
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
      if (modelToDelete.id) {
        await deleteModel(modelToDelete.id);
        updateSettings({ ...config, model: null });
      }

      setModels(prevModels => {
        const providerModels =
          prevModels[modelToDelete.provider as keyof typeof prevModels] || [];
        return {
          ...prevModels,
          [modelToDelete.provider]: providerModels.filter(
            model => model.id !== modelToDelete.id,
          ),
        };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDialogOpen(false);
      setModelToDelete(null);
      setSelectedModel(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setModelToDelete(null);
  };

  const handleSaveModel = async (formData: ModelConfig) => {
    setSelectedModel(formData);
    setShowForm(false);
    setModels(prevModels => {
      const providerModels =
        prevModels[formData.provider as keyof typeof prevModels] || [];
      const modelExists = providerModels.some(
        model => model.id === formData.id,
      );

      if (modelExists) {
        return {
          ...prevModels,
          [formData.provider]: providerModels.map(model =>
            model.id === formData.id ? formData : model,
          ),
        };
      } else {
        return {
          ...prevModels,
          [formData.provider]: [...providerModels, formData],
        };
      }
    });
  };

  const handleCreateModel = () => {
    setSelectedModel(null);
    setShowForm(true);
  };

  const handleDeepnessChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleConfigChange({ max_last_messages: Number(e.target.value) });
  };

  const isSaveDisabled = () => {
    if (!isProviderSettingsSet(config, config.ai_provider)) return true;
    if (selectedModel) return false;

    return isMaxLastMessagesChanged ? false : true;
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
                availableModels={models[AI_PROVIDERS.OPENAI]}
                onModelSelect={handleModelSelect}
                onModelCreate={handleCreateModel}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(config, AI_PROVIDERS.OPENAI) ||
                  (Boolean(selectedModel) && !Boolean(selectedModel?.id))
                }
                tooltipMessage={TOOLTIP_MESSAGES.OPENAI}
              />
            )}

            {config.ai_provider === AI_PROVIDERS.AZURE_OPENAI && (
              <AzureOpenAISettings
                settings={config}
                onSettingsChange={handleConfigChange}
                availableModels={models[AI_PROVIDERS.AZURE_OPENAI]}
                onModelSelect={handleModelSelect}
                onModelCreate={handleCreateModel}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(config, AI_PROVIDERS.AZURE_OPENAI) ||
                  (Boolean(selectedModel) && !Boolean(selectedModel?.id))
                }
                tooltipMessage={TOOLTIP_MESSAGES.AZURE_OPENAI}
              />
            )}

            {config.ai_provider === AI_PROVIDERS.OLLAMA && (
              <OllamaSettings
                settings={config}
                onSettingsChange={handleConfigChange}
                availableModels={models[AI_PROVIDERS.OLLAMA]}
                onModelSelect={handleModelSelect}
                onModelCreate={handleCreateModel}
                onModelEdit={handleEditModel}
                onModelDelete={handleDeleteModel}
                disabledModelCreate={
                  !isProviderSettingsSet(config, AI_PROVIDERS.OLLAMA) ||
                  (Boolean(selectedModel) && !Boolean(selectedModel?.id))
                }
                tooltipMessage={TOOLTIP_MESSAGES.OLLAMA}
              />
            )}

            <TextField
              fullWidth
              type="number"
              name="messageDeepness"
              label="Message context window"
              value={config.max_last_messages || 5}
              onChange={handleDeepnessChange}
              placeholder="Enter message deepness"
              slotProps={{ htmlInput: { min: 1, max: 20 } }}
              error={Boolean(
                validateField(
                  'maxLastMessages',
                  String(config.max_last_messages),
                ),
              )}
              helperText={validateField(
                'maxLastMessages',
                String(config.max_last_messages),
              )}
            />

            <Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isSaveDisabled()}
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

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={cancelLeave}
        onConfirm={confirmLeave}
        title="Unsaved Changes"
        text="All unsaved changes will be lost. Are you sure you want to leave?"
        confirmText="Leave"
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
