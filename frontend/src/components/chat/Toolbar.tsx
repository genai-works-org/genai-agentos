import { FC, useEffect } from 'react';
import { SendIcon, Paperclip } from 'lucide-react';

import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import Select from '@/components/shared/Select';

interface ToolbarProps {
  onAttachClick: () => void;
  isUploading: boolean;
  isAnyFileUploading: boolean;
  hasContent: boolean;
  onSubmit: () => void;
}

const Toolbar: FC<ToolbarProps> = ({
  onAttachClick,
  isUploading,
  isAnyFileUploading,
  hasContent,
  onSubmit,
}) => {
  const {
    activeModel,
    setActiveModel,
    availableModels,
    isModelAvailable,
    isModelSelected,
  } = useSettings();

  const handleSelectChange = (value: string) => {
    if (value) {
      const model = availableModels.find(model => model.id === value);
      setActiveModel(model || null);
    }
  };

  useEffect(() => {
    if (!isModelSelected && isModelAvailable) {
      setActiveModel(availableModels[0]);
    }
  }, [isModelSelected, isModelAvailable, availableModels, setActiveModel]);

  return (
    <div className="px-4 pb-3 flex items-center justify-between">
      <Button
        variant="link"
        size="icon"
        onClick={onAttachClick}
        disabled={isUploading || isAnyFileUploading || !isModelSelected}
        className="text-text-secondary rotate-[-45deg]"
      >
        <Paperclip size={20} />
      </Button>
      <div className="flex items-center gap-4">
        <Select
          value={activeModel?.id || ''}
          onChange={handleSelectChange}
          options={availableModels.map(model => ({
            value: model.id,
            label: model.name,
          }))}
          disabled={!isModelAvailable}
        />
        <Button
          variant="link"
          size="icon"
          onClick={onSubmit}
          disabled={!isModelSelected || !hasContent}
          className="disabled:bg-transparent rotate-45 text-text-secondary"
        >
          <SendIcon size={20} />
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
