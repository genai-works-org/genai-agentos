import { FC, useEffect } from 'react';
import { SendIcon, PaperclipIcon } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import {
  MenuItem,
  SelectChangeEvent,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Select } from '@mui/material';

interface ToolbarProps {
  onAttachClick: () => void;
  onInsertMarkdown: (type: 'bold' | 'italic' | 'code') => void;
  onTogglePreview: () => void;
  showPreview: boolean;
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
  const { activeModel, availableModels, setActiveModel } = useSettings();
  const isModelAvailable = availableModels.length > 0;
  const isModelSelected = Boolean(activeModel);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    if (value) {
      const model = availableModels.find(model => model.id === value);
      setActiveModel(model || null);
    }
  };

  useEffect(() => {
    if (!isModelSelected && isModelAvailable) {
      setActiveModel(availableModels[0]);
    }
  }, []);

  return (
    <div className="px-3 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2 text-gray-500">
        <button
          onClick={onAttachClick}
          disabled={isUploading || isAnyFileUploading}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 shadow-md"
        >
          <PaperclipIcon size={20} />
        </button>
      </div>
      <div className="flex items-center">
        {!isModelAvailable ? (
          <span className="text-red-500 text-sm">
            Add settings and models on the Settings page
          </span>
        ) : (
          <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              value={activeModel?.id || ''}
              label="Model"
              onChange={handleSelectChange}
              autoWidth
              size="small"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200,
                  },
                },
              }}
            >
              {availableModels.map(model => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <button
          onClick={onSubmit}
          disabled={!isModelSelected || !hasContent}
          className={`ml-6 p-2 rounded-md transition-colors shadow-md ${
            hasContent && isModelSelected
              ? 'bg-[#FF5722] text-white hover:bg-[#E64A19] '
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          <SendIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
