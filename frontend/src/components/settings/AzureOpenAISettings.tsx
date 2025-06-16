import { ChangeEvent, FC, useState } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AIModelGrid } from '../AIModelGrid';
import { ModelConfig, AI_PROVIDERS, Config } from '../../types/model';

interface AzureOpenAISettingsProps {
  settings: Config;
  onSettingsChange: (data: Config) => void;
  availableModels: ModelConfig[];
  disabledModelCreate: boolean;
  tooltipMessage: string;
  onModelCreate: () => void;
  onModelEdit: (model: ModelConfig) => void;
  onModelDelete: (model: ModelConfig) => void;
}

export const AzureOpenAISettings: FC<AzureOpenAISettingsProps> = ({
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      data: { ...settings.data, [name]: value },
    });
  };

  return (
    <>
      <Box>
        <TextField
          fullWidth
          name="endpoint"
          label="Endpoint"
          value={settings.data.endpoint || ''}
          onChange={handleChange}
          placeholder="Enter Azure OpenAI endpoint"
        />
      </Box>

      <Box>
        <TextField
          fullWidth
          type={showApiKey ? 'text' : 'password'}
          name="api_key"
          label="API Key"
          value={settings.data.api_key || ''}
          onChange={handleChange}
          placeholder="Enter Azure OpenAI API key"
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
        <TextField
          fullWidth
          name="api_version"
          label="API Version"
          value={settings.data.api_version || ''}
          onChange={handleChange}
          placeholder="Enter Azure OpenAI API version"
        />
      </Box>

      <Box>
        <TextField
          fullWidth
          name="model"
          label="Deployment Name"
          value={settings.data.model || ''}
          onChange={handleChange}
          placeholder="Enter Azure OpenAI deployment name"
        />
      </Box>

      <Box>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Available Models
        </label>
        <AIModelGrid
          models={availableModels}
          onModelCreate={onModelCreate}
          onModelEdit={onModelEdit}
          onModelDelete={onModelDelete}
          disabledModelCreate={disabledModelCreate}
          tooltipMessage={tooltipMessage}
          provider={AI_PROVIDERS.AZURE_OPENAI}
        />
      </Box>
    </>
  );
};
