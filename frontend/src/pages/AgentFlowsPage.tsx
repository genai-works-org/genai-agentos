import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentFlowDTO } from '../types/agent';
import {
  Container,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { MainLayout } from '../components/layout/MainLayout';
import { AgentFlowCard } from '../components/AgentFlowCard';
import { useAgent } from '../hooks/useAgent';
import ConfirmModal from '../components/ConfirmModal';

export const AgentFlowsPage: FC = () => {
  const [flows, setFlows] = useState<AgentFlowDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<AgentFlowDTO | null>(null);
  const navigate = useNavigate();
  const { getAgentFlows, deleteAgentFlow } = useAgent();

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
  };

  const handleEdit = (id: string) => {
    navigate(`/agent-flows/${id}`);
  };

  return (
    <MainLayout currentPage="Agent Flows">
      <Container
        maxWidth="xl"
        sx={{
          mb: 4,
          justifyContent: 'align-item',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          mb={3}
        >
          <Box>
            <IconButton
              color="primary"
              onClick={loadFlows}
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
        ) : flows.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <Typography variant="h6" color="text.secondary">
              No agent flows found
            </Typography>
          </Box>
        ) : (
          <Box>
            {flows.map(flow => (
              <AgentFlowCard
                key={flow.id}
                flow={flow}
                onEdit={handleEdit}
                onDelete={() => handleDelete(flow)}
              />
            ))}
          </Box>
        )}
      </Container>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Agent Flow"
        text={`Are you sure you want to delete "${selectedFlow?.name || ''}"?`}
        onClose={handleClose}
        onConfirm={handleDeleteConfirmed}
      />
    </MainLayout>
  );
};
