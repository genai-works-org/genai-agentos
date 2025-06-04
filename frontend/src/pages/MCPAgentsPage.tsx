import { useState, useEffect } from 'react';
import { CircularProgress, Container, Box } from '@mui/material';

import { useMcpAgents } from '../hooks/useMcpAgents';
import { MCPAgent } from '../types/agent';
import { MainLayout } from '../components/MainLayout';
import { AIModelCreateCard } from '../components/AIModelCreateCard';
import CreateModal from '../components/CreateModal';
import AgentDetailModal from '../components/mcp/AgentDetailModal';
import AgentCard from '../components/mcp/AgentCard';
import ConfirmModal from '../components/ConfirmModal';

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
      <Container
        maxWidth="xl"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 2,
        }}
      >
        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[200px]">
            <AIModelCreateCard
              onClick={() => setIsCreateModalOpen(true)}
              disabled={false}
              tooltipMessage="Create a new MCP Server"
            />
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                setSelectedAgent={setSelectedAgent}
              />
            ))}
          </div>
        )}
      </Container>

      <CreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateServer}
        title="Create MCP Server"
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
        title="Delete Server"
        text={`Are you sure you want to delete this agent?`}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteServer}
      />
    </MainLayout>
  );
};

export default MCPServersPage;
