// import { useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { Config } from '@/types/model';
import { Input } from '../ui/input';

interface OpenAISettingsProps {
  settings: Config;
  onSettingsChange: (data: Config) => void;
}

export const OpenAISettings: FC<OpenAISettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  // const [showApiKey, setShowApiKey] = useState(false);

  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      data: { ...settings.data, api_key: e.target.value },
    });
  };

  return (
    <Input
      id="api_key"
      name="api_key"
      label="API Key"
      type="password"
      // type={showApiKey ? 'text' : 'password'}
      placeholder="Enter OpenAI API key"
      value={settings.data.api_key || ''}
      onChange={handleApiKeyChange}
      // secure
      // showPassword={showApiKey}
      // setShowPassword={setShowApiKey}
    />
  );
};
