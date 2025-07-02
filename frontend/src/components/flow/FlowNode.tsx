import type { FC } from 'react';
import { useRef, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { ShieldX, Trash2 } from 'lucide-react';
import { Box } from '@mui/material';

import { getBatchVariant } from '@/utils/getNodeStyles';
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
            data.label.toLowerCase()
          ) : (
            <span className="flex items-center gap-1 text-error-main">
              <ShieldX /> {data.label.toLowerCase() || 'Inactive'}
            </span>
          )}
        </p>

        <div className="flex items-center gap-4">
          {data?.type && (
            <Badge variant={getBatchVariant(data.type)}>{data.type}</Badge>
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
        <Box
          sx={{
            width: '90%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            overflow: 'auto',
            py: 0.5,
          }}
        >
          {data.flow.map((step: any, index: number) => (
            <Box
              key={index}
              id={`flow-node-${id}-${index}`}
              onClick={e => {
                e.stopPropagation();
                const event = new CustomEvent('flowStepClick', {
                  detail: { step, nodeId: id },
                });
                window.dispatchEvent(event);
              }}
              sx={{
                maxWidth: '180px',
                wordBreak: 'break-all',
                textAlign: 'center',
                p: 0.5,
                bgcolor: '#fff',
                borderRadius: '4px',
                border: `1px solid ${step.is_success ? '#4CAF50' : '#F44336'}`,
                minHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              <p className="text-center">{step.name}</p>
            </Box>
          ))}
        </Box>
      )}
    </div>
  );
};
