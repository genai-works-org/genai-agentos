import { FC } from 'react';
import { X } from 'lucide-react';

import { FlowChainNode } from '@/types/flow';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import FlowChain from './FlowChain';

interface BottomPanelProps {
  description: string;
  setDescription: (description: string) => void;
  links: FlowChainNode[];
  setOpenBottomPanel: (open: boolean) => void;
}

const BottomPanel: FC<BottomPanelProps> = ({
  description,
  setDescription,
  links,
  setOpenBottomPanel,
}) => {
  return (
    <div className="absolute bottom-6 left-6 w-[692px] p-6 bg-primary-white rounded-2xl">
      <p className="font-bold mb-4">Flow Details</p>
      <Textarea
        id="description"
        name="description"
        label="Flow Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="min-h-[100px] mb-6"
        disabled
      />

      <FlowChain links={links} />

      <Button
        variant="link"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => setOpenBottomPanel(false)}
      >
        <X className="h-6 w-6 text-text-secondary" />
      </Button>
    </div>
  );
};

export default BottomPanel;
