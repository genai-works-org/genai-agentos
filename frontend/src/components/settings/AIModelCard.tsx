import type { FC } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { ModelConfig } from '@/types/model';
import Card from '@/components/shared/Card';
import { Button } from '@/components/ui/button';

interface AIModelCardProps {
  modelData: ModelConfig;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  provider: string;
}

export const AIModelCard: FC<AIModelCardProps> = ({
  modelData,
  onEdit,
  onDelete,
  isSelected,
  provider,
}) => {
  const { name, model, temperature, max_last_messages } = modelData;

  return (
    <Card active={isSelected} className="w-[412px]">
      <h3 className="font-bold mb-4 truncate">{name}</h3>

      <div className="mb-2">
        <h5 className="text-sm font-bold text-text-secondary mb-1">Model</h5>
        <p className="text-sm text-text-secondary">{model}</p>
      </div>

      <div className="mb-2">
        <h5 className="text-sm font-bold text-text-secondary mb-1">Provider</h5>
        <p className="text-sm text-text-secondary">{provider}</p>
      </div>

      <div className="mb-2">
        <h5 className="text-sm font-bold text-text-secondary mb-1">
          Temperature
        </h5>
        <p className="text-sm text-text-secondary">{temperature}</p>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-bold text-text-secondary mb-1">
          LLM Message context window
        </h5>
        <p className="text-sm text-text-secondary">{max_last_messages}</p>
      </div>

      <div className="flex gap-4">
        <Button
          variant="secondary"
          onClick={e => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={16} />
          Edit
        </Button>
        <Button
          variant="secondary"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-error-main"
        >
          <Trash2 size={16} />
          Delete
        </Button>
      </div>
    </Card>
  );
};
