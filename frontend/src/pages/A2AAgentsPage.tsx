import { useState, useEffect } from 'react';
import { CircularProgress, Container, Box } from '@mui/material';

import { useA2aAgents } from '../hooks/useA2aAgents';
import { A2AAgent } from '../types/agent';
import { MainLayout } from '../components/MainLayout';
import { AIModelCreateCard } from '../components/AIModelCreateCard';
import CreateModal from '../components/CreateModal';
import AgentDetailModal from '../components/a2a/AgentDetailModal';
import AgentCard from '../components/a2a/AgentCard';
import ConfirmModal from '../components/ConfirmModal';
import { normalizeString } from '../utils/normalizeString';

const A2AAgentsPage = () => {
  const [agents, setAgents] = useState<A2AAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<A2AAgent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { getAgents, createAgent, deleteAgent, isLoading } = useA2aAgents();

  const handleCreateAgent = async (url: string) => {
    await createAgent(url);
    const updatedAgents = await getAgents();
    setAgents(updatedAgents);
    setIsCreateModalOpen(false);
  };

  const handleDeleteAgent = async () => {
    await deleteAgent(selectedAgent?.id || '');
    const updatedAgents = await getAgents();
    setAgents(updatedAgents);
    setIsConfirmOpen(false);
    setSelectedAgent(null);
  };

  useEffect(() => {
    getAgents().then(setAgents);
  }, [getAgents]);

  return (
    <MainLayout currentPage="A2A Agents">
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
              tooltipMessage="Create a new A2A Agent"
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
        onCreate={handleCreateAgent}
        title="Create A2A Agent"
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
        title="Delete Agent"
        text={`Are you sure you want to delete ${normalizeString(selectedAgent?.name || '')} agent?`}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAgent}
      />
    </MainLayout>
  );
};

export default A2AAgentsPage;
