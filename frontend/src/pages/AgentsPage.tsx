import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { AgentDTO, AgentType } from '../types/agent';
import { AgentCard } from '../components/AgentCard';
import {
  Container,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { MainLayout } from '../components/MainLayout';
import { useAgent } from '../hooks/useAgent';
import ConfirmModal from '../components/ConfirmModal';

export const AgentsPage: FC = () => {
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDTO | null>(null);
  const { isLoading, getAgents, deleteAgent } = useAgent();

  const activeAgents = agents.filter(agent => agent.is_active);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const response = await getAgents();
    setAgents(response);
  };

  const openConfirm = (agent: AgentDTO) => {
    setSelectedAgent(agent);
    setIsConfirmOpen(true);
  };

  const handleDeleteAgent = async () => {
    if (selectedAgent) {
      await deleteAgent(selectedAgent.agent_id);
      await loadAgents();
      setSelectedAgent(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <MainLayout currentPage="Agents">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          {!isLoading && (
            <Box>
              <Typography variant="h5" component="h3">
                {agents.length} agents ({activeAgents.length} active)
              </Typography>
            </Box>
          )}
          <Box>
            <IconButton
              color="primary"
              onClick={loadAgents}
              disabled={isLoading}
              sx={{ mr: 2 }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : filteredAgents.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <Typography variant="h6" color="text.secondary">
              No agents found
            </Typography>
          </Box>
        ) : (
          <Box display="flex" gap={2} flexWrap="wrap">
            {agents.map(agent => (
              <Box key={agent.agent_id} sx={{ width: '350px' }}>
                <AgentCard agent={agent} onDelete={() => openConfirm(agent)} />
              </Box>
            ))}
          </Box>
        )}
      </Container>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Agent"
        text={`Are you sure you want to delete ${selectedAgent?.agent_name || ''}?`}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAgent}
      />
    </MainLayout>
  );
};
