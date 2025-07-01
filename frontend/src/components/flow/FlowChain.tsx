import { Fragment } from 'react';
import type { FC } from 'react';
import { ArrowRight } from 'lucide-react';

import { FlowChainNode } from '@/types/flow';
import Card from '@/components/shared/Card';

interface FlowChainProps {
  links: FlowChainNode[];
}

const FlowChain: FC<FlowChainProps> = ({ links }) => {
  if (links.length === 0) return null;

  return (
    <div className="max-h-[204px] overflow-y-auto">
      <p className="font-bold mb-4">Flow Chain</p>
      <div className="flex items-center flex-wrap gap-4">
        {links.map((node, idx) => (
          <Fragment key={idx}>
            <Card style={{ width: 'calc(50% - 50px)' }}>
              <p className="font-bold mb-1 truncate">{node.name}</p>
              <p className="text-sm text-text-secondary truncate">{node.id}</p>
            </Card>
            {idx < links.length - 1 && (
              <ArrowRight className="text-text-light" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default FlowChain;
