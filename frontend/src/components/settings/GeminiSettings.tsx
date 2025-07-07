import { useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AIModelGrid } from '../AIModelGrid';
import { AI_PROVIDERS, ModelConfig, Config } from '../../types/model';

interface GeminiSettingsProps {
  settings: Config;
  onSettingsChange: (data: Config) => void;
  availableModels: ModelConfig[];
  disabledModelCreate: boolean;
  tooltipMessage: string;
  onModelCreate: () => void;
  onModelEdit: (model: ModelConfig) => void;
  onModelDelete: (model: ModelConfig) => void;
}

export const GeminiSettings: FC<GeminiSettingsProps> = ({
  settings,
  availableModels,
  disabledModelCreate,
  tooltipMessage,
  onSettingsChange,
  onModelCreate,
  onModelEdit,
  onModelDelete,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      data: { ...settings.data, api_key: e.target.value },
    });
  };

  return (
    <>
      <Box>
        <TextField
          fullWidth
          type={showApiKey ? 'text' : 'password'}
          name="api_key"
          label="API Key"
          value={settings.data.api_key || ''}
          onChange={handleApiKeyChange}
          placeholder="Enter Gemini API key"
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
          provider={AI_PROVIDERS.GEMINI}
        />
      </Box>
    </>
  );
};
