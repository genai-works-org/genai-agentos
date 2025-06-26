import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Copy } from 'lucide-react';
import {
  Container,
  IconButton,
  Typography,
  CircularProgress,
  Box,
  Button,
  TextField,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AgentDTO } from '../types/agent';
import { useAgent } from '../hooks/useAgent';
import { useToast } from '../hooks/useToast';
import { AgentCard } from '../components/AgentCard';
import { MainLayout } from '../components/MainLayout';
import ConfirmModal from '../components/ConfirmModal';
import { Modal as GenerateTokenModal } from '../components/Modal';

export const AgentsPage: FC = () => {
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [token, setToken] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentDTO | null>(null);
  const { isLoading, getAgents, deleteAgent, createAgent } = useAgent();
  const toast = useToast();

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
    <MainLayout currentPage="Agents">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          {!isLoading && (
            <Box>
              <Typography variant="h5" component="h3">
                {agents.length} agents ({activeAgents.length} active)
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            onClick={createNewAgent}
            sx={{ ml: 'auto', mr: 2 }}
          >
            Generate Token
          </Button>
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

      <GenerateTokenModal
        isOpen={isGenerateOpen}
        onClose={closeTokenModal}
        title="Generated Token"
        className="relative"
      >
        <TextField
          multiline
          maxRows={6}
          value={token}
          fullWidth
          disabled
          sx={{ '& .MuiInputBase-root': { pr: 5 } }}
        />
        <Copy
          size={20}
          className="absolute top-[84px] right-[30px] cursor-pointer"
          onClick={copyToken}
        />
      </GenerateTokenModal>
    </MainLayout>
  );
};
