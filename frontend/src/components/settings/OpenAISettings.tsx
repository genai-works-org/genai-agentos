import { useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Settings } from '../../contexts/SettingsContext';
import { AIModelGrid } from '../AIModelGrid';
import { AIModel } from '../../services/apiService';
import { ModelConfig } from '../../services/modelService';

interface OpenAISettingsProps {
  settings: Settings;
  onSettingsChange: (data: Partial<Settings>) => void;
  availableModels: AIModel[];
  disabledModelCreate: boolean;
  tooltipMessage: string;
  onModelSelect: (model: AIModel) => void;
  onModelCreate: () => void;
  onModelEdit: (model: ModelConfig) => void;
  onModelDelete: (model: ModelConfig) => void;
}

export const OpenAISettings: FC<OpenAISettingsProps> = ({
  settings,
  availableModels,
  disabledModelCreate,
  tooltipMessage,
  onSettingsChange,
  onModelSelect,
  onModelCreate,
  onModelEdit,
  onModelDelete,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const handleApiKeyChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = e.target;
    onSettingsChange({ openAi: { api_key: value.trim() } });
  };

  return (
    <>
      <Box>
        <TextField
          fullWidth
          type={showApiKey ? 'text' : 'password'}
          name="openaiApiKey"
          label="API Key"
          value={settings.openAi.api_key || ''}
          onChange={handleApiKeyChange}
          placeholder="Enter OpenAI API key"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowApiKey(!showApiKey)}
                  edge="end"
                >
                  {showApiKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Available Models
        </label>
        <AIModelGrid
          selectedModel={settings.model}
          models={availableModels}
          onModelSelect={onModelSelect}
          onModelCreate={onModelCreate}
          onModelEdit={onModelEdit}
          onModelDelete={onModelDelete}
          disabledModelCreate={disabledModelCreate}
          tooltipMessage={tooltipMessage}
        />
      </Box>
    </>
  );
};
