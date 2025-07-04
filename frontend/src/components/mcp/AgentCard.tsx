import { FC } from 'react';
import { MCPAgent, AgentType } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import Card from '@/components/shared/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentCardProps {
  agent: MCPAgent;
  setSelectedAgent: (agent: MCPAgent) => void;
}

const AgentCard: FC<AgentCardProps> = ({ agent, setSelectedAgent }) => {
  return (
    <Card key={agent.id}>
      <div className="h-full flex flex-col justify-between">
        <div>
          <Badge variant="brown" className="mb-4">
            {AgentType.MCP}
          </Badge>
          <h3 className="font-bold mb-4 truncate">{agent.server_url}</h3>
          <h4 className="text-sm font-bold text-text-secondary mb-2">Tools</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {agent.mcp_tools.map(tool => (
              <Badge key={tool.id} variant="cyan" className="capitalize">
                {removeUnderscore(tool.name.toLowerCase())}
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
