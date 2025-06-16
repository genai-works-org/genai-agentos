import { useState } from 'react';
import type { FC } from 'react';
import { AgentFlowDTO } from '../types/agent';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  '&.deleting': {
    opacity: 0.5,
    transform: 'scale(0.95)',
  },
});

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

const TitleBox = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
});

const TitleTypography = styled(Typography)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 'calc(100% - 100px)', // Leave space for buttons
});

const DescriptionBox = styled(Box)({
  flexGrow: 1,
  overflow: 'auto',
  marginBottom: '8px',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '3px',
    '&:hover': {
      background: '#555',
    },
  },
});

interface AgentFlowCardProps {
  flow: AgentFlowDTO;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AgentFlowCard: FC<AgentFlowCardProps> = ({
  flow,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      onDelete(flow.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <StyledCard
      sx={{
        mb: 3,
        borderRadius: '0.5rem',
        boxShadow:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: `2px solid ${flow.is_active ? '#0c7c59' : '#c1121f'}`,
        maxHeight: expanded ? '400px' : '200px',
        transition: 'max-height 0.3s ease-in-out',
      }}
      className={isDeleting ? 'deleting' : ''}
    >
      <StyledCardContent>
        <TitleBox>
          <TitleTypography variant="h6">
            {flow.name.replace(/_/g, ' ')}
          </TitleTypography>
          <Box>
            <IconButton onClick={() => onEdit(flow.id)} disabled={isDeleting}>
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={handleDelete}
              color="error"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <CircularProgress size={24} color="error" />
              ) : (
                <DeleteIcon />
              )}
            </IconButton>
          </Box>
        </TitleBox>
        <DescriptionBox>
          <Typography
            variant="body2"
            color="text.secondary"
            onClick={() => setExpanded(!expanded)}
            sx={{ cursor: 'pointer' }}
          >
            {expanded
              ? flow.description
              : flow.description.length > 100
                ? `${flow.description.substring(0, 100)}...`
                : flow.description}
          </Typography>
        </DescriptionBox>
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            Agents: {flow.flow.length}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Created: {new Date(flow.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </StyledCardContent>
    </StyledCard>
  );
};
