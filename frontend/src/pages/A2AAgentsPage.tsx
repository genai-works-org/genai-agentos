import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';

import { useA2aAgents } from '@/hooks/useA2aAgents';
import { useToast } from '@/hooks/useToast';
import { removeUnderscore } from '@/utils/normalizeString';
import { A2AAgent } from '@/types/agent';
import { MainLayout } from '@/components/layout/MainLayout';
import CreateCard from '@/components/shared/CreateCard';
import AgentCard from '@/components/a2a/AgentCard';
import AgentDetailModal from '@/components/a2a/AgentDetailModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import CreateAgentModal from '@/components/modals/CreateAgentModal';

const A2AAgentsPage = () => {
  const [agents, setAgents] = useState<A2AAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<A2AAgent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { getAgents, createAgent, deleteAgent, isLoading } = useA2aAgents();
  const toast = useToast();

  const handleCreateAgent = async (url: string) => {
    await createAgent(url);
    const updatedAgents = await getAgents();
    setAgents(updatedAgents);
    setIsCreateModalOpen(false);
    toast.showSuccess('Agent created successfully');
  };

  const handleDeleteAgent = async () => {
    await deleteAgent(selectedAgent?.id || '');
    const updatedAgents = await getAgents();
    setAgents(updatedAgents);
    setIsConfirmOpen(false);
    setSelectedAgent(null);
    toast.showSuccess('Agent deleted successfully');
  };

  useEffect(() => {
    getAgents().then(setAgents);
  }, [getAgents]);

  return (
    <MainLayout currentPage="A2A Agents">
      <div className="p-16">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <CircularProgress />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 min-h-[280px]">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                setSelectedAgent={setSelectedAgent}
              />
            ))}
            <CreateCard
              buttonText="Add A2A Agent"
              onClick={() => setIsCreateModalOpen(true)}
            />
          </div>
        )}
      </div>

      <CreateAgentModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAgent}
        title="Create A2A Agent"
        placeholder="https://a2a-example.com"
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
        description={`Are you sure you want to delete this Agent "${removeUnderscore(
          selectedAgent?.name || '',
        )}"?`}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAgent}
        loading={isLoading}
      />
    </MainLayout>
  );
};

export default A2AAgentsPage;
