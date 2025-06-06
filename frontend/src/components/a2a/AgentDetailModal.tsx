import { FC } from 'react';
import {
  Box,
  Button,
  Chip,
  DialogActions,
  Stack,
  Typography,
} from '@mui/material';
import { A2AAgent, AgentType } from '../../types/agent';
import { Modal } from '../Modal';
import { normalizeString } from '../../utils/normalizeString';

interface AgentDetailModalProps {
  open: boolean;
  agent: A2AAgent | null;
  onClose: () => void;
  onDelete: () => void;
}

const AgentDetailModal: FC<AgentDetailModalProps> = ({
  open,
  agent,
  onClose,
  onDelete,
}) => {
  if (!agent) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={normalizeString(agent.name || '')}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2">Type:</Typography>
          <Chip
            label={AgentType.A2A}
            color="primary"
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>

        {/* <Box>
          <Typography variant="subtitle2">Description:</Typography>
          <Typography variant="body2">{agent.description}</Typography>
        </Box> */}

        <Box>
          <Typography variant="subtitle2">Expected Input:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
            {agent.agent_schema.defaultInputModes.map(mode => (
              <Chip key={mode} label={mode} size="small" />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2">Expected Output:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
            {agent.agent_schema.defaultOutputModes.map(mode => (
              <Chip key={mode} label={mode} size="small" />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2">Skills:</Typography>
          <Stack direction="row" mt={1} flexWrap="wrap" gap={1}>
            {agent.agent_schema.skills.map(skill => (
              <Chip
                key={skill.id}
                label={normalizeString(skill.id)}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backgroundColor: '#E3F2FD',
                  color: '#1565C0',
                }}
              />
            ))}
          </Stack>
        </Box>
      </Stack>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="error" onClick={onDelete}>
          Delete
        </Button>
      </DialogActions>
    </Modal>
  );
};

export default AgentDetailModal;
