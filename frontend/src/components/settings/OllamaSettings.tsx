import type { ChangeEvent, FC } from 'react';
import { Config } from '@/types/model';
import { Input } from '../ui/input';

interface OllamaSettingsProps {
  settings: Config;
  onSettingsChange: (data: Config) => void;
}

export const OllamaSettings: FC<OllamaSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      data: { ...settings.data, base_url: e.target.value },
    });
  };

  return (
    <Input
      id="base_url"
      name="base_url"
      label="Base URL"
      placeholder="Enter Ollama base URL"
      value={settings.data.base_url || ''}
      onChange={handleUrlChange}
    />
  );
};
