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
    <Card active={isSelected}>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-bold truncate">{name}</h3>
        <div>
          <Button
            variant="link"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={20} />
          </Button>
          <Button
            variant="remove"
            size="icon"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={20} />
          </Button>
        </div>
      </div>

      <h4 className="font-bold mb-2">Parameters</h4>
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

      <div>
        <h5 className="text-sm font-bold text-text-secondary mb-1">
          LLM context length
        </h5>
        <p className="text-sm text-text-secondary">{max_last_messages}</p>
      </div>
    </Card>
  );
};
