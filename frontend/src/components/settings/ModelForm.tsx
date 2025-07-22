import type { FC, FormEvent, ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

import {
  AI_PROVIDERS,
  ModelConfig,
  Config,
  CreateModelBody,
} from '@/types/model';
import { validateModelsField } from '@/utils/validation';
import { MAX_LAST_MESSAGES_HINT } from '@/constants/texts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModelFormProps {
  settings: Config;
  initialData: ModelConfig | null;
  onSave: (data: CreateModelBody) => void;
  onClose: () => void;
  systemPrompt: string;
  isLoading?: boolean;
}

const ModelForm: FC<ModelFormProps> = ({
  settings,
  initialData,
  onSave,
  onClose,
  isLoading,
  systemPrompt,
}) => {
  const initialModel =
    initialData?.model || (settings.provider === AI_PROVIDERS.OPENAI
      ? 'gpt-4o'
      : '');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    model: initialModel,
    provider: settings.provider,
    system_prompt: initialData?.system_prompt || systemPrompt,
    temperature: initialData?.temperature ?? 0.7,
    max_last_messages: initialData?.max_last_messages ?? 5,
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const isSubmitDisabled = useMemo(() => {
    return (
      isLoading || Object.values(validationErrors).some(error => Boolean(error))
    );
  }, [isLoading, validationErrors, formData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    const error = validateModelsField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error || '' }));

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const error = validateModelsField('name', formData.name);
    setValidationErrors(prev => ({ ...prev, name: error || '' }));

    if (error) {
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[800px] h-full max-h-[800px] px-9 py-12 overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Model' : 'Add New Model'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            id="name"
            name="name"
            label="Name"
            placeholder="Model Name"
            value={formData.name}
            onChange={handleChange}
            maxLength={10}
            withAsterisk
            error={validationErrors.name}
          />
          <Input
            id="model"
            name="model"
            label="Model"
            placeholder="Model Identification"
            value={formData.model}
            onChange={handleChange}
            required
            withAsterisk
            error={validationErrors.model}
          />
          <Textarea
            id="system_prompt"
            name="system_prompt"
            label="System Prompt"
            placeholder="System Prompt"
            value={formData.system_prompt}
            onChange={handleChange}
            required
            withAsterisk
            error={validationErrors.system_prompt}
          />
          <div>
            <Input
              id="temperature"
              name="temperature"
              label="Temperature (0 - 2.0)"
              placeholder="Temperature"
              value={formData.temperature}
              onChange={handleChange}
              required
              min={0}
              max={2}
              withAsterisk
              error={validationErrors.temperature}
            />
            <p className="text-xs text-text-secondary mt-2">
              Enter the value between 0 - 2.0. Numeric value only
            </p>
          </div>
          <div>
            <Input
              id="max_last_messages"
              name="max_last_messages"
              label="LLM Message context window (1 - 20)"
              placeholder="Enter message deepness"
              value={formData.max_last_messages}
              onChange={handleChange}
              required
              min={1}
              max={20}
              withAsterisk
              error={validationErrors.max_last_messages}
              hint={MAX_LAST_MESSAGES_HINT}
            />
            <p className="text-xs text-text-secondary mt-2">
              Enter the value between 1 - 20. Numeric value only
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose} className="w-[99px]">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-[84px]"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModelForm;
