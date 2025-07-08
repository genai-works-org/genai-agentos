import { ChangeEvent, FC } from 'react';
import { Config } from '@/types/model';
import { Input } from '../ui/input';

interface AzureOpenAISettingsProps {
  settings: Config;
  onSettingsChange: (data: Config) => void;
}

export const AzureOpenAISettings: FC<AzureOpenAISettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  // const [showApiKey, setShowApiKey] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      data: { ...settings.data, [name]: value },
    });
  };

  return (
    <>
      <Input
        id="endpoint"
        name="endpoint"
        label="Endpoint"
        placeholder="Enter Azure OpenAI endpoint"
        value={settings.data.endpoint || ''}
        onChange={handleChange}
      />

      <Input
        id="api_key"
        name="api_key"
        label="API Key"
        type="password"
        // type={showApiKey ? 'text' : 'password'}
        placeholder="Enter Azure OpenAI API key"
        value={settings.data.api_key || ''}
        onChange={handleChange}
        // secure
        // showPassword={showApiKey}
        // setShowPassword={setShowApiKey}
      />

      <Input
        id="api_version"
        name="api_version"
        label="API Version"
        placeholder="Enter Azure OpenAI API version"
        value={settings.data.api_version || ''}
        onChange={handleChange}
      />

      <Input
        id="model"
        name="model"
        label="Deployment Name"
        placeholder="Enter Azure OpenAI deployment name"
        value={settings.data.model || ''}
        onChange={handleChange}
      />
    </>
  );
};
