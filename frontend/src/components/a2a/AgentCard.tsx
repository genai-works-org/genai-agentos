import { FC } from 'react';
import { A2AAgent, AgentType } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Card from '@/components/shared/Card';

interface AgentCardProps {
  agent: A2AAgent;
  setSelectedAgent: (agent: A2AAgent) => void;
}

const AgentCard: FC<AgentCardProps> = ({ agent, setSelectedAgent }) => {
  return (
    <Card key={agent.id}>
      <div className="h-full flex flex-col justify-between">
        <div>
          <Badge variant="pink" className="mb-4">
            {AgentType.A2A}
          </Badge>
          <h3 className="font-bold mb-1 truncate">
            {removeUnderscore(agent.name || '')}
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {agent.description}
          </p>
          <h4 className="text-sm font-bold text-text-secondary mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {agent.card_content.skills.map(skill => (
              <Badge key={skill.id} variant="blue">
                {removeUnderscore(skill.id)}
              </Badge>
            ))}
          </div>
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

export default AgentCard;
