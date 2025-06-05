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
import { MainLayout } from '../components/MainLayout';
import { AgentFlowCard } from '../components/AgentFlowCard';
import { useAgent } from '../hooks/useAgent';

export const AgentFlowsPage: FC = () => {
  const [flows, setFlows] = useState<AgentFlowDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgentFlow(id);
      // Remove the flow from the state immediately for better UX
      setFlows(prevFlows => prevFlows.filter(flow => flow.id !== id));
      // Refresh the list to ensure consistency
    } finally {
      await loadFlows();
    }
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
                onDelete={handleDelete}
              />
            ))}
          </Box>
        )}
      </Container>
    </MainLayout>
  );
};
