import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { RefreshCw } from 'lucide-react';
import { CircularProgress } from '@mui/material';

import { AgentDTO } from '@/types/agent';
import { useAgent } from '@/hooks/useAgent';
import { useToast } from '@/hooks/useToast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { AgentCard } from '@/components/genai/AgentCard';
import AgentDetailsModal from '@/components/genai/AgentDetailsModal';
import GenerateTokenModal from '@/components/genai/GenerateTokenModal';

const AgentsPage: FC = () => {
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [token, setToken] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentDTO | null>(null);
  const { isLoading, getAgents, deleteAgent, createAgent } = useAgent();
  const toast = useToast();

  const activeAgents = useMemo(
    () => agents.filter(agent => agent.is_active),
    [agents],
  );

  const agentsLength = useMemo(() => activeAgents.length, [activeAgents]);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const response = await getAgents();
    setAgents(response);
  };

  const handleDeleteAgent = async () => {
    if (selectedAgent) {
      await deleteAgent(selectedAgent.agent_id);
      await loadAgents();
      setSelectedAgent(null);
      setIsConfirmOpen(false);
      toast.showSuccess('Agent deleted successfully');
    }
  };

  const createNewAgent = async () => {
    const template = {
      name: '',
      description: '',
      input_parameters: {
        additionalProp1: {},
      },
      is_active: false,
    };

    const res = await createAgent(template);
    setIsGenerateOpen(true);
    setToken(res.jwt);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    toast.showSuccess('Copied to clipboard');
  };

  const closeTokenModal = () => {
    setIsGenerateOpen(false);
    setToken('');
  };

  return (
    <MainLayout currentPage="GenAI Agents">
      <div className="p-16">
        <div className="flex justify-between items-center mb-12 p-4 bg-primary-white rounded-2xl border border-neutral-border">
          <p className="font-bold">
            {agentsLength} Active {agentsLength === 1 ? 'Agent' : 'Agents'}
          </p>
          <div>
            <Button onClick={createNewAgent} className="w-[168px] mr-2">
              Generate token
            </Button>
            <Button
              variant="outline"
              onClick={loadAgents}
              className="w-[131px]"
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <CircularProgress />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {agents.map(agent => (
              <AgentCard
                key={agent.agent_id}
                agent={agent}
                setSelectedAgent={setSelectedAgent}
              />
            ))}
          </div>
        )}
      </div>

      <AgentDetailsModal
        open={!!selectedAgent}
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onDelete={() => setIsConfirmOpen(true)}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        description={`Are you sure you want to delete this Agent "${
          selectedAgent?.agent_name || ''
        }"?`}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAgent}
      />

      <GenerateTokenModal
        open={isGenerateOpen}
        onClose={closeTokenModal}
        token={token}
        copyToken={copyToken}
      />
    </MainLayout>
  );
};

export default AgentsPage;
