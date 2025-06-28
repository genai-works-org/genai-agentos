import { useState } from 'react';
import type { FC, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { AgentDTO } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';

const ExpandMore = styled((props: { expanded: boolean } & any) => {
  const { expanded, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expanded }) => ({
  transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

interface AgentCardProps {
  agent: AgentDTO;
  onDelete: () => void;
}

export const AgentCard: FC<AgentCardProps> = ({ agent, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const description = agent.agent_description;

  const handleExpandClick = (e: MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleCardClick = () => {
    navigate(`/agents/${agent.agent_id}/details`);
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const renderParameters = () => {
    if (!agent.agent_schema?.function?.parameters?.properties) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Parameters:
        </Typography>
        {Object.entries(agent.agent_schema.function.parameters.properties).map(
          ([name, param]) => (
            <Box key={name} sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                component="span"
                sx={{ textDecoration: 'underline' }}
              >
                {name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                type - {param.type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                description - {param.description}
              </Typography>
            </Box>
          ),
        )}
      </Box>
    );
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        borderRadius: '0.5rem',
        boxShadow:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid',
        borderColor: 'rgba(229, 231, 235, 1)',
        position: 'relative',
        '&:hover': {
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: agent?.is_active ? 'success.main' : 'error.main',
        }}
      />
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ width: '280px', wordBreak: 'break-all' }}
          >
            {removeUnderscore(agent.agent_name)}
          </Typography>
          <IconButton onClick={handleDelete} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {expanded
            ? description
            : description && description?.length > 100
            ? `${description.substring(0, 100)}...`
            : description}
        </Typography>
        {expanded && <>{renderParameters()}</>}
      </CardContent>
      <CardActions disableSpacing>
        <ExpandMore
          expanded={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      </CardActions>
    </Card>
  );
};
