import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { AgentDTO } from '../types/agent';
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

export const AgentsPage: FC = () => {
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const { isLoading, getAgents, deleteAgent } = useAgent();

  const activeAgents = agents.filter(agent => agent.is_active);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const response = await getAgents();
    setAgents(response);
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
        ) : agents.length === 0 ? (
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
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            }}
            gap={3}
          >
            {agents.map(agent => (
              <Box key={agent.agent_id}>
                <AgentCard
                  agent={agent}
                  onDelete={deleteAgent}
                  onDeleted={loadAgents}
                />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </MainLayout>
  );
};
