import { useState } from 'react';
import type { FC } from 'react';
import { AIModelCard } from './AIModelCard';
import { ModelConfig } from '../types/model';
import { useSettings } from '../contexts/SettingsContext';

import CreateCard from '@/components/shared/CreateCard';

interface AIModelGridProps {
  models: ModelConfig[];
  disabledModelCreate: boolean;
  tooltipMessage: string;
  provider: string;
  onModelCreate: () => void;
  onModelEdit: (model: ModelConfig) => void;
  onModelDelete: (model: ModelConfig) => void;
}

export const AIModelGrid: FC<AIModelGridProps> = ({
  models,
  disabledModelCreate,
  tooltipMessage,
  provider,
  onModelCreate,
  onModelEdit,
  onModelDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeModel } = useSettings();

  const modelsPerRow = 4; // Number of models to show in the first row

  // Sort models: selected model first, then alphabetically
  const sortedModels = [...models].sort((a, b) => {
    if (a.name === activeModel?.name) return -1;
    if (b.name === activeModel?.name) return 1;
    return a.name.localeCompare(b.name);
  });

  const displayedModels = isExpanded
    ? sortedModels
    : sortedModels.slice(0, modelsPerRow);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <CreateCard
          buttonText="Add Models"
          disabled={disabledModelCreate}
          onClick={onModelCreate}
        />
        {displayedModels.length > 0 &&
          displayedModels.map(model => (
            <AIModelCard
              key={model.id}
              modelData={model}
              isSelected={model.id === activeModel?.id}
              onEdit={() => onModelEdit(model as ModelConfig)}
              onDelete={() => onModelDelete(model as ModelConfig)}
              provider={provider}
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
