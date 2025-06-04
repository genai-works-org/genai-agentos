import { useState } from 'react';
import type { FC } from 'react';
import { AIModel } from '../services/apiService';
import { AIModelCard } from './AIModelCard';
import { AIModelCreateCard } from './AIModelCreateCard';
import { ModelConfig } from '../services/modelService';

interface AIModelGridProps {
  models: AIModel[];
  disabledModelCreate: boolean;
  tooltipMessage: string;
  selectedModel: AIModel | null;
  onModelSelect: (model: AIModel) => void;
  onModelCreate: () => void;
  onModelEdit: (model: ModelConfig) => void;
  onModelDelete: (model: ModelConfig) => void;
}

export const AIModelGrid: FC<AIModelGridProps> = ({
  models = [
    {
      id: 'create',
      name: 'Create New Model',
      provider: 'Create New Model',
      model: 'GRP',
      system_prompt: 'Do this and that',
      temperature: 0.5,
    },
  ],
  disabledModelCreate,
  tooltipMessage,
  selectedModel,
  onModelSelect,
  onModelCreate = () => {},
  onModelEdit,
  onModelDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const modelsPerRow = 4; // Number of models to show in the first row

  // Sort models: selected model first, then alphabetically
  const sortedModels = [...models].sort((a, b) => {
    if (a.name === selectedModel?.name) return -1;
    if (b.name === selectedModel?.name) return 1;
    return a.name.localeCompare(b.name);
  });

  const displayedModels = isExpanded
    ? sortedModels
    : sortedModels.slice(0, modelsPerRow);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {onModelCreate && (
          <AIModelCreateCard
            onClick={onModelCreate}
            disabled={disabledModelCreate}
            tooltipMessage={tooltipMessage}
          />
        )}
        {displayedModels.length > 0 &&
          displayedModels.map(model => (
            <AIModelCard
              key={model.id}
              modelData={model}
              isSelected={model.id === selectedModel?.id}
              onSelect={onModelSelect}
              onEdit={() => onModelEdit(model as ModelConfig)}
              onDelete={() => onModelDelete(model as ModelConfig)}
            />
          ))}
      </div>
      {sortedModels.length > modelsPerRow && (
        <div className="text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            {isExpanded
              ? 'Show Less'
              : `Show More (${sortedModels.length - modelsPerRow} more)`}
          </button>
        </div>
      )}
    </div>
  );
};
