import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';

import { useMcpAgents } from '@/hooks/useMcpAgents';
import { MCPAgent } from '@/types/agent';
import { MainLayout } from '@/components/layout/MainLayout';
import CreateCard from '@/components/shared/CreateCard';
import AgentCard from '@/components/mcp/AgentCard';
import AgentDetailModal from '@/components/mcp/AgentDetailModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import CreateAgentModal from '@/components/modals/CreateAgentModal';

const MCPServersPage = () => {
  const [agents, setAgents] = useState<MCPAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<MCPAgent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { getServers, createServer, deleteServer, isLoading } = useMcpAgents();

  const handleCreateServer = async (url: string) => {
    await createServer(url);
    const updatedAgents = await getServers();
    setAgents(updatedAgents);
    setIsCreateModalOpen(false);
  };

  const handleDeleteServer = async () => {
    await deleteServer(selectedAgent?.id || '');
    const updatedServers = await getServers();
    setAgents(updatedServers);
    setIsConfirmOpen(false);
    setSelectedAgent(null);
  };

  useEffect(() => {
    getServers().then(setAgents);
  }, [getServers]);

  return (
    <MainLayout currentPage="MCP Agents">
      <div className="p-16">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <CircularProgress />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 min-h-[220px]">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                setSelectedAgent={setSelectedAgent}
              />
            ))}
            <CreateCard
              buttonText="Add MCP Agent"
              onClick={() => setIsCreateModalOpen(true)}
            />
          </div>
        )}
      </div>

      <CreateAgentModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateServer}
        title="Create MCP Server"
        placeholder="https://mcp-example.com"
        loading={isLoading}
      />

      <AgentDetailModal
        open={!!selectedAgent}
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onDelete={() => setIsConfirmOpen(true)}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        description={`Are you sure you want to delete this agent?`}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteServer}
        loading={isLoading}
      />
    </MainLayout>
  );
};

export default MCPServersPage;
