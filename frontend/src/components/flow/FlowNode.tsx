import type { FC } from 'react';
import { useRef, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { ShieldX, Trash2 } from 'lucide-react';

import { getBatchVariant } from '@/utils/getNodeStyles';
import { removeUnderscore } from '@/utils/normalizeString';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface FlowNodeData {
  label: string;
  description: string;
  color: string;
  type: string;
  isActive: boolean;
  flow?: any[];
  onDelete: (nodeId: string) => void;
  isDeletable?: boolean;
}

export const FlowNode: FC<NodeProps<FlowNodeData>> = ({ data, id }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isActive = data.isActive === true || data.isActive === undefined;

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  useEffect(() => {
    if (nodeRef.current) {
      const height = nodeRef.current.offsetHeight;
      // Emit height to parent through custom event
      const event = new CustomEvent('nodeHeight', {
        detail: { nodeId: id, height },
      });
      window.dispatchEvent(event);
    }
  }, [id, data.flow]);

  return (
    <div ref={nodeRef} className="relative">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      <div
        className={`flex items-center ${
          data.isDeletable ? 'justify-between' : 'justify-center'
        }`}
      >
        <p className="font-bold break-words capitalize">
          {isActive ? (
            data.label
          ) : (
            <span className="flex items-center gap-1 text-error-main">
              <ShieldX /> {data.label || 'Inactive'}
            </span>
          )}
        </p>

        <div className="flex items-center gap-4">
          {data?.type && (
            <Badge variant={getBatchVariant(data.type)} className="ml-4">
              {data.type}
            </Badge>
          )}

          {data.isDeletable && (
            <Button variant="remove" size="icon" onClick={handleDelete}>
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      {data.description && (
        <p className="text-sm text-text-secondary mt-4">{data.description}</p>
      )}

      {data.flow && (
        <div className="mt-2 space-y-2">
          {data.flow.map((step: any, index: number) => (
            <div
              key={index}
              id={`flow-node-${id}-${index}`}
              className={`p-2 border rounded-xl ${
                step.is_success ? 'border-primary-accent' : 'border-red-600'
              }`}
            >
              <p className="text-sm text-center capitalize">
                {removeUnderscore(step.name)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
