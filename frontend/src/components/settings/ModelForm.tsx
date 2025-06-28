import type { FC, FormEvent, ChangeEvent } from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Slider,
  Input,
  DialogContent,
} from '@mui/material';
import {
  AI_PROVIDERS,
  ModelConfig,
  Config,
  CreateModelBody,
} from '@/types/model';

interface ModelFormProps {
  settings: Config;
  initialData: ModelConfig | null;
  onSave: (data: CreateModelBody) => void;
  onCancel: () => void;
  systemPrompt: string;
  isLoading?: boolean;
}

export const ModelForm: FC<ModelFormProps> = ({
  settings,
  initialData,
  onSave,
  onCancel,
  isLoading,
  systemPrompt,
}) => {
  const initialModel =
    initialData?.model || settings.provider === AI_PROVIDERS.OPENAI
      ? 'gpt-4o'
      : '';

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    model: initialModel,
    provider: settings.provider,
    system_prompt: initialData?.system_prompt || systemPrompt,
    temperature: initialData?.temperature ?? 0.7,
    max_last_messages: initialData?.max_last_messages ?? 5,
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateRequiredFields = () => {
    if (!formData.name || !formData.model || !formData.provider) {
      return 'Please fill in all required fields';
    }

    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateRequiredFields();

    if (validationError) {
      setError(validationError);
      return;
    }

    onSave({
      name: formData.name.trim(),
      model: formData.model.trim(),
      provider: formData.provider.trim(),
      system_prompt: formData.system_prompt.trim(),
      temperature: formData.temperature,
      max_last_messages: Number(formData.max_last_messages),
      user_prompt: '',
      credentials: {},
      id: initialData?.id,
    });
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">
            {initialData ? 'Edit Model' : 'Add New Model'}
          </Typography>
          <IconButton onClick={onCancel} size="small">
            <X className="h-5 w-5" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
              inputProps={{
                maxLength: 10,
              }}
            />

            <TextField
              label="Provider"
              value={formData.provider}
              disabled
              fullWidth
            />

            <TextField
              label="Model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label="System Prompt"
              name="system_prompt"
              value={formData.system_prompt}
              onChange={handleChange}
              multiline
              rows={15}
              fullWidth
            />

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography>Temperature</Typography>
                <Input
                  value={formData.temperature}
                  size="small"
                  onChange={e => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 2) {
                      handleChange({
                        target: { name: 'temperature', value },
                      } as any);
                    }
                  }}
                  inputProps={{
                    step: 0.1,
                    min: 0,
                    max: 2,
                    type: 'number',
                    'aria-labelledby': 'temperature-slider',
                  }}
                  sx={{ width: '70px' }}
                />
              </Box>
              <Slider
                name="temperature"
                value={formData.temperature}
                onChange={(_, value) =>
                  handleChange({
                    target: { name: 'temperature', value },
                  } as any)
                }
                min={0}
                max={2}
                step={0.1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 2, label: '2' },
                ]}
              />
            </Box>

            <TextField
              fullWidth
              type="number"
              name="max_last_messages"
              label="Message context window"
              value={formData.max_last_messages}
              onChange={handleChange}
              placeholder="Enter message deepness"
              slotProps={{ htmlInput: { min: 1, max: 20 } }}
            />

            <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
              <Button variant="outlined" onClick={onCancel} fullWidth>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !formData.name || !formData.model}
                fullWidth
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};
