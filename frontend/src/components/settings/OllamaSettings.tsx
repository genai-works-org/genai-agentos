import type { ChangeEvent, FC } from 'react';
import { Box, TextField } from '@mui/material';
import { AIModelGrid } from './AIModelGrid';
import { AI_PROVIDERS, ModelConfig, Config } from '../../types/model';

interface OllamaSettingsProps {
  settings: Config;
  onSettingsChange: (data: Config) => void;
  availableModels: ModelConfig[];
  disabledModelCreate: boolean;
  tooltipMessage: string;
  onModelCreate: () => void;
  onModelEdit: (model: ModelConfig) => void;
  onModelDelete: (model: ModelConfig) => void;
}

export const OllamaSettings: FC<OllamaSettingsProps> = ({
  settings,
  availableModels,
  disabledModelCreate,
  tooltipMessage,
  onModelCreate,
  onModelEdit,
  onModelDelete,
  onSettingsChange,
}) => {
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      data: { ...settings.data, base_url: e.target.value },
    });
  };

  return (
    <>
      <Box>
        <TextField
          fullWidth
          name="base_url"
          label="Base URL"
          value={settings.data.base_url || ''}
          onChange={handleUrlChange}
          placeholder="Enter Ollama base URL"
        />
      </Box>

      <Box>
        <p className="block text-sm font-medium text-gray-700 mb-4">
          Available Models
        </p>
        <AIModelGrid
          models={availableModels}
          onModelCreate={onModelCreate}
          onModelEdit={onModelEdit}
          onModelDelete={onModelDelete}
          disabledModelCreate={disabledModelCreate}
          tooltipMessage={tooltipMessage}
          provider={AI_PROVIDERS.OLLAMA}
        />
      </Box>
    </>
  );
};
