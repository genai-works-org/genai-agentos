import { FC } from 'react';
import { Trash2 } from 'lucide-react';

import { A2AAgent } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AgentDetailModalProps {
  open: boolean;
  agent: A2AAgent | null;
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
      <DialogContent className="max-w-[800px] px-8 py-12 gap-4">
        <DialogHeader>
          <DialogTitle className="text-left mb-4">
            {removeUnderscore(agent.name || '')}
          </DialogTitle>
          <DialogDescription className="text-left">
            {agent.description}
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-sm font-bold text-text-secondary mb-2">
            Expected Input
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {agent.card_content.defaultInputModes.map(mode => (
              <Badge key={mode} variant="green">
                {mode}
              </Badge>
            ))}
          </div>

          <p className="text-sm font-bold text-text-secondary mb-2">
            Expected Output
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {agent.card_content.defaultOutputModes.map(mode => (
              <Badge key={mode} variant="green">
                {mode}
              </Badge>
            ))}
          </div>

          <p className="text-sm font-bold text-text-secondary mb-2">Skills</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {agent.card_content.skills.map(skill => (
              <Badge key={skill.id} variant="blue">
                {removeUnderscore(skill.id)}
              </Badge>
            ))}
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

export default AgentDetailModal;
