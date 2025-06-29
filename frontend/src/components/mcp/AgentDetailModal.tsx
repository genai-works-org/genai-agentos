import { FC } from 'react';
import { Trash2 } from 'lucide-react';

import { MCPAgent, AgentType } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgentDetailModalProps {
  open: boolean;
  agent: MCPAgent | null;
  onClose: () => void;
  onDelete: () => void;
}

const AgentDetailModal: FC<AgentDetailModalProps> = ({
  open,
  agent,
  onClose,
  onDelete,
}) => {
  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[800px] px-8 py-12 gap-4"
      >
        <DialogHeader>
          <DialogTitle className="text-left">{agent.server_url}</DialogTitle>
        </DialogHeader>

        <div>
          <p className="text-sm font-bold text-text-secondary mb-2">Tools</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {agent.mcp_tools.map(tool => (
              <Badge key={tool.id} variant="cyan" className="capitalize">
                {removeUnderscore(tool.name.toLowerCase())}
              </Badge>
            ))}
          </div>
          <p className="text-sm font-bold text-text-secondary mb-2">Type</p>
          <Badge variant="brown" className="mb-4">
            {AgentType.MCP}
          </Badge>
        </div>

        <DialogFooter>
          <Button onClick={onDelete} variant="remove" className="w-fit">
            <Trash2 size={16} />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailModal;
