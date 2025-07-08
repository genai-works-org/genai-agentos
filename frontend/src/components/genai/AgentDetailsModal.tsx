import { FC } from 'react';
import { JSONTree } from 'react-json-tree';
import { Trash2 } from 'lucide-react';

import { AgentDTO } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import { jsonTreeTheme } from '@/constants/jsonTreeTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AgentDetailsModalProps {
  open: boolean;
  agent: AgentDTO | null;
  onClose: () => void;
  onDelete: () => void;
}

const AgentDetailsModal: FC<AgentDetailsModalProps> = ({
  agent,
  open,
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
          <DialogTitle className="text-left mb-4 capitalize">
            {removeUnderscore(agent.agent_name)} Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <Input id="id" name="id" label="ID" value={agent.agent_id} disabled />
          <Input
            id="name"
            name="name"
            label="Name"
            value={agent.agent_name}
            disabled
          />
        </div>
        <Textarea
          id="description"
          name="description"
          label="Description"
          value={agent.agent_description}
          disabled
          className="min-h-[100px]"
        />
        <div>
          <p className="text-xs text-text-secondary mb-2">Input Parameters</p>
          <div className="max-h-[177px] overflow-y-auto p-2 bg-primary-white rounded-xl">
            <JSONTree
              data={agent.agent_schema}
              theme={jsonTreeTheme}
              invertTheme={false}
            />
          </div>
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

export default AgentDetailsModal;
