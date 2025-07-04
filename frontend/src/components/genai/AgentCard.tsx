import type { FC } from 'react';

import { AgentDTO } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import { Button } from '@/components/ui/button';
import Card from '@/components/shared/Card';

interface AgentCardProps {
  agent: AgentDTO;
  setSelectedAgent: (agent: AgentDTO) => void;
}

export const AgentCard: FC<AgentCardProps> = ({ agent, setSelectedAgent }) => {
  return (
    <Card
      className={`${
        agent.is_active ? 'border-primary-accent' : 'border-red-600'
      }`}
    >
      <div className="h-full min-h-[150px] flex flex-col justify-between">
        <div>
          <h3 className="font-bold mb-1 truncate capitalize">
            {removeUnderscore(agent.agent_name)}
          </h3>
          <p className="text-sm text-text-secondary">
            {agent.agent_description}
          </p>
        </div>
        <Button
          variant="link"
          size="link"
          onClick={() => setSelectedAgent(agent)}
          className="contents"
        >
          More Info
        </Button>
      </div>
    </Card>
  );
};
