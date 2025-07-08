import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

import { AgentFlowDTO } from '@/types/agent';
import { useAgent } from '@/hooks/useAgent';
import { useToast } from '@/hooks/useToast';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgentFlowCard } from '@/components/flow/AgentFlowCard';
import ConfirmModal from '@/components/modals/ConfirmModal';
import CreateCard from '@/components/shared/CreateCard';

const AgentFlowsPage: FC = () => {
  const [flows, setFlows] = useState<AgentFlowDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<AgentFlowDTO | null>(null);
  const navigate = useNavigate();
  const { getAgentFlows, deleteAgentFlow } = useAgent();
  const toast = useToast();

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setIsLoading(true);
    try {
      const data = await getAgentFlows();
      setFlows(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsConfirmOpen(false);
    setSelectedFlow(null);
  };

  const handleDelete = (flow: AgentFlowDTO) => {
    setSelectedFlow(flow);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedFlow) return;

    await deleteAgentFlow(selectedFlow.id);
    await loadFlows();
    handleClose();
    toast.showSuccess('Agent Flow deleted successfully');
  };

  const handleEdit = (id: string) => {
    navigate(`/agent-flows/${id}`);
  };

  return (
    <MainLayout currentPage="Agent Flows">
      <div className="p-16">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <CircularProgress />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 min-h-[280px]">
            {flows.map(flow => (
              <AgentFlowCard
                key={flow.id}
                flow={flow}
                onEdit={handleEdit}
                onDelete={() => handleDelete(flow)}
              />
            ))}

            <CreateCard
              buttonText="Add Agent Flow"
              onClick={() => navigate('/agent-flows/new')}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        description={`Are you sure you want to delete this Agent Flow "${
          selectedFlow?.name || ''
        }"?`}
        onClose={handleClose}
        onConfirm={handleDeleteConfirmed}
      />
    </MainLayout>
  );
};

export default AgentFlowsPage;
