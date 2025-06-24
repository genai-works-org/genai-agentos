import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Stack,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { agentService } from '../services/agentService';
import { AgentDTO } from '../types/agent';
import { MainLayout } from '../components/layout/MainLayout';
import { JSONTree } from 'react-json-tree';
import { jsonTreeTheme } from '../constants/jsonTreeTheme';
import { normalizeString } from '../utils/normalizeString';

export const AgentDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) return;
      try {
        const agentData = await agentService.getAgent(id);
        setAgent(agentData);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <MainLayout currentPage="Agent Details">
        <Container>
          <Typography>Loading...</Typography>
        </Container>
      </MainLayout>
    );
  }

  if (!agent) {
    return (
      <MainLayout currentPage="Agent Details">
        <Container>
          <Typography>Agent not found</Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentPage="Agent Details">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2, color: 'black' }}
        >
          Back
        </Button>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                ID
              </Typography>
              <TextField
                fullWidth
                value={agent.agent_id}
                variant="outlined"
                disabled
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Name
              </Typography>
              <TextField
                fullWidth
                value={normalizeString(agent.agent_name)}
                variant="outlined"
                disabled
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={agent.agent_schema.function.description}
                variant="outlined"
                disabled
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                gutterBottom
              >
                Input Parameters
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <JSONTree
                  data={agent.agent_schema}
                  theme={jsonTreeTheme}
                  invertTheme={false}
                />
              </Paper>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </MainLayout>
  );
};
