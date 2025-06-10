import { FC } from 'react';
import {
  Box,
  Button,
  Chip,
  DialogActions,
  Stack,
  Typography,
} from '@mui/material';
import { MCPAgent } from '../../types/agent';
import { Modal } from '../Modal';

interface AgentDetailModalProps {
  open: boolean;
  agent: MCPAgent | null;
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
    <Modal isOpen={open} onClose={onClose} title={agent.server_url}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2">Type:</Typography>
          <Chip label="MCP" color="primary" size="small" sx={{ mt: 0.5 }} />
        </Box>

        <Box mt={1}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.primary"
            gutterBottom
          >
            Tools:
          </Typography>

          <Stack direction="row" gap={1} flexWrap="wrap">
            {agent.mcp_tools.map(tool => (
              <Box
                key={tool.id}
                px={1.5}
                py={0.5}
                borderRadius={1}
                bgcolor="#E3F2FD"
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textTransform: 'capitalize',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  {tool.name}
                </Typography>
              </Box>
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
