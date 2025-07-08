import { useEffect, useState, type FC } from 'react';

import { FLOW_NAME_REGEX } from '@/constants/regex';
import { FlowChainNode } from '@/types/flow';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FlowChain from './FlowChain';

interface SaveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowName: string;
  onFlowNameChange: (value: string) => void;
  flowDescription: string;
  onFlowDescriptionChange: (value: string) => void;
  links: FlowChainNode[];
  saving: boolean;
  onSave: () => void;
}

const SaveFlowModal: FC<SaveFlowModalProps> = ({
  isOpen,
  onClose,
  flowName,
  onFlowNameChange,
  flowDescription,
  onFlowDescriptionChange,
  links,
  saving,
  onSave,
}) => {
  const [flowNameError, setFlowNameError] = useState<string | null>(null);

  const isReadyToSave =
    saving ||
    links.length === 0 ||
    flowDescription.trim().length === 0 ||
    flowName.trim().length === 0 ||
    !!flowNameError;

  useEffect(() => {
    if (!FLOW_NAME_REGEX.test(flowName)) {
      setFlowNameError('Only letters, numbers and hyphens are allowed');
    } else {
      setFlowNameError(null);
    }
  }, [flowName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[800px] px-9 py-12 gap-6"
      >
        <DialogHeader>
          <DialogTitle className="text-center">Save Agent Flow</DialogTitle>
        </DialogHeader>

        <Input
          id="flowName"
          name="flowName"
          label="Flow Name"
          value={flowName}
          onChange={e => onFlowNameChange(e.target.value.slice(0, 55))}
          error={flowNameError || ''}
        />
        <Textarea
          id="description"
          name="description"
          label="Flow Description"
          value={flowDescription}
          onChange={e => onFlowDescriptionChange(e.target.value)}
          className="min-h-[100px]"
        />

        <FlowChain links={links} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} className="w-[99px]">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onSave}
            disabled={isReadyToSave}
            className="w-[84px]"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFlowModal;
