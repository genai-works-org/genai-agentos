import { useState } from 'react';

import { useSettings } from '@/contexts/SettingsContext';
import { useModels } from '@/hooks/useModels';
import { useToast } from '@/hooks/useToast';
import {
  getInitialConfig,
  getProviderModels,
  isProviderSettingsChanged,
  isProviderSettingsSet,
  getInitialMetadata,
} from '@/utils/settings';
import {
  AI_PROVIDERS,
  Config,
  CreateModelBody,
  ModelConfig,
  TOOLTIP_MESSAGES,
  PROVIDERS_OPTIONS,
} from '@/types/model';
import { MainLayout } from '@/components/layout/MainLayout';
import { OpenAISettings } from '@/components/settings/OpenAISettings';
import { AzureOpenAISettings } from '@/components/settings/AzureOpenAISettings';
import { OllamaSettings } from '@/components/settings/OllamaSettings';
import ModelForm from '@/components/settings/ModelForm';
import { AIModelGrid } from '@/components/settings/AIModelGrid';
import ConfirmModal from '@/components/modals/ConfirmModal';
import Select from '@/components/shared/Select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const SettingsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    providers,
    systemPrompt,
    refetchModels,
    activeModel,
    setActiveModel,
  } = useSettings();
  const [config, setConfig] = useState<Config>(() =>
    getInitialConfig(providers),
  );
  const {
    createProvider,
    updateProvider,
    createModel,
    updateModel,
    deleteModel,
    loading,
  } = useModels();
  const toast = useToast();

  const handleProviderChange = (value: string) => {
    const currentProvider = providers.find(p => p.provider === value);

    if (currentProvider) {
      const { provider, metadata, api_key } = currentProvider;
      setConfig({ provider, data: { ...metadata, api_key } });
      return;
    }

    setConfig({
      provider: value,
      data: getInitialMetadata(value),
    });
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
    if (selectedModel.id === activeModel?.id) {
      setActiveModel(null);
    }
    setDeleteDialogOpen(false);
    setSelectedModel(null);
    toast.showSuccess('Model deleted successfully');
  };

  const handleSaveProvider = async () => {
    try {
      const { api_key, ...credentials } = config.data;
      const body = {
        api_key: api_key || '',
        metadata: credentials || {},
      };

      if (isProviderSettingsSet(providers, config.provider)) {
        const res = await updateProvider(config.provider, body);
        setConfig({
          ...config,
          data: {
            ...config.data,
            api_key: res.api_key,
          },
        });
      } else {
        const res = await createProvider({
          ...body,
          name: config.provider,
        });
        setConfig({
          ...config,
          data: {
            ...config.data,
            api_key: res.api_key,
          },
        });
      }

      toast.showSuccess('Settings saved successfully');
    } catch (error) {
      toast.showError('Failed to create provider');
    } finally {
      refetchModels();
    }
  };

  const handleSaveModel = async (formData: CreateModelBody) => {
    try {
      const { id, provider, ...restData } = formData;
      if (id) {
        const updatedModel = await updateModel(id, {
          ...restData,
        });
        id === activeModel?.id && setActiveModel(updatedModel);
      } else {
        await createModel({
          ...restData,
          provider,
        });
      }
      toast.showSuccess('Model saved successfully');
    } catch (err) {
      toast.showError('Failed to save model');
    } finally {
      refetchModels();
      setShowForm(false);
      setSelectedModel(null);
    }
  };

  return (
    <MainLayout currentPage="Settings">
      <div className="h-full p-16 max-h-[calc(100vh-64px)] overflow-y-auto">
        <div className="bg-primary-white rounded-xl min-h-full">
          <div className="p-4">
            <h2 className="font-bold text-text-secondary">API Information</h2>
            <p className="text-sm text-text-light">Providers, Keys, Models</p>
          </div>
          <Separator />

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select
                value={config.provider}
                label="AI Provider"
                options={PROVIDERS_OPTIONS}
                onChange={handleProviderChange}
              />

              {config.provider === AI_PROVIDERS.OPENAI && (
                <OpenAISettings
                  settings={config}
                  onSettingsChange={setConfig}
                />
              )}

              {config.provider === AI_PROVIDERS.AZURE_OPENAI && (
                <AzureOpenAISettings
                  settings={config}
                  onSettingsChange={setConfig}
                />
              )}

              {config.provider === AI_PROVIDERS.OLLAMA && (
                <OllamaSettings
                  settings={config}
                  onSettingsChange={setConfig}
                />
              )}
            </div>

            <div className="flex justify-end mb-6">
              <Button
                onClick={handleSaveProvider}
                disabled={
                  !isProviderSettingsChanged(config.provider, providers, config)
                }
                className="w-[181px]"
              >
                Save API changes
              </Button>
            </div>

            <p className="text-xs text-text-secondary mb-2">Models</p>
            <AIModelGrid
              models={getProviderModels(providers, config.provider)}
              onModelCreate={() => setShowForm(true)}
              onModelEdit={handleEditModel}
              onModelDelete={handleDeleteModel}
              disabledModelCreate={
                !isProviderSettingsSet(providers, config.provider)
              }
              tooltipMessage={
                !isProviderSettingsSet(providers, config.provider)
                  ? TOOLTIP_MESSAGES[
                      config.provider as keyof typeof TOOLTIP_MESSAGES
                    ]
                  : ''
              }
              provider={config.provider}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        description={`Are you sure you want to delete the model "${selectedModel?.name}"?`}
      />

      {showForm && (
        <ModelForm
          settings={config}
          initialData={selectedModel}
          onSave={handleSaveModel}
          onClose={() => {
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

export default SettingsPage;
