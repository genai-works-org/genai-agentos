import { useState } from 'react';
import type { FC } from 'react';
import { Trash2 } from 'lucide-react';

import { AgentFlowDTO, AgentType } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import Card from '@/components/shared/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentFlowCardProps {
  flow: AgentFlowDTO;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AgentFlowCard: FC<AgentFlowCardProps> = ({
  flow,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      onDelete(flow.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={flow.is_active ? 'border-primary-accent' : 'border-red-600'}
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          <Badge variant="brown" className="mb-4">
            {AgentType.FLOW}
          </Badge>
          <h3 className="font-bold mb-1 truncate">
            {removeUnderscore(flow.name)}
          </h3>
          <p className="text-sm mb-4 text-text-secondary break-words">
            {flow.description}
          </p>
          <h4 className="text-sm font-bold text-text-secondary mb-2">
            Created
          </h4>
          <Badge variant="blue" className="mb-4">
            {new Date(flow.created_at).toLocaleDateString()}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(flow.id)} disabled={isDeleting}>
            Open Flow
          </Button>
          <Button variant="remove" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};
