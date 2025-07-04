import { FC } from 'react';
import { Node } from 'reactflow';
import { Search, X } from 'lucide-react';

import { ActiveConnection } from '@/types/agent';
import { highlightMatch } from '@/utils/highlightMatch';
import { normalizeString } from '@/utils/normalizeString';
import { getBatchVariant } from '@/utils/getNodeStyles';
import Card from '@/components/shared/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AgentsSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  nodes: Node[];
  agents: ActiveConnection[];
  searchResults: ActiveConnection[];
}

const AgentsSidebar: FC<AgentsSidebarProps> = ({
  isOpen,
  setIsOpen,
  search,
  setSearch,
  nodes,
  agents,
  searchResults,
}) => {
  return (
    <div
      className={`relative ${
        isOpen ? 'flex flex-col gap-6' : 'hidden'
      } w-[360px] p-6 bg-primary-white`}
    >
      <p className="font-bold">Add Agents</p>
      <Button
        variant="link"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-6 w-6 text-text-secondary" />
      </Button>
      <div className="relative">
        <Input
          id="search"
          name="search"
          label="Search Agents"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-[52px]"
        />
        <Search className="absolute top-9 left-4 text-text-secondary" />
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto will-change-scroll">
        {(search.length >= 2 ? searchResults : agents).map(agent => {
          const isNodeInFlow = nodes.find(
            node => node.id.split('::')[0] === agent.id,
          );

          return (
            <div
              key={agent.id}
              draggable
              onDragStart={e =>
                e.dataTransfer.setData('text/plain', JSON.stringify(agent))
              }
            >
              <Card
                active={Boolean(isNodeInFlow)}
                className="w-full cursor-grab"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold break-words capitalize">
                    {highlightMatch(
                      normalizeString(agent.name || '').toLowerCase(),
                      search,
                      false,
                    )}
                  </h3>
                  <Badge variant={getBatchVariant(agent.type)}>
                    {agent.type}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  {highlightMatch(
                    agent.agent_schema.description || '',
                    search,
                    true,
                  )}
                </p>
              </Card>
            </div>
          );
        })}
        {(search.length >= 2 && searchResults.length === 0) ||
        agents.length === 0 ? (
          <div className="flex flex-col items-center min-h-[200px]">
            <p>No agents found</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AgentsSidebar;
