import { FC } from 'react';
import { Card, CardContent, Chip, Stack, Typography, Box } from '@mui/material';
import { A2AAgent, AgentType } from '../../types/agent';
import { normalizeString } from '../../utils/normalizeString';

interface AgentCardProps {
  agent: A2AAgent;
  setSelectedAgent: (agent: A2AAgent) => void;
}

const AgentCard: FC<AgentCardProps> = ({ agent, setSelectedAgent }) => {
  return (
    <Card
      onClick={() => setSelectedAgent(agent)}
      sx={{
        width: '350px',
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
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            color="text.primary"
            sx={{ maxWidth: '250px', wordBreak: 'break-all' }}
          >
            {normalizeString(agent.name || '')}
          </Typography>
          <Chip
            label={AgentType.A2A}
            size="small"
            sx={{
              fontWeight: 600,
              backgroundColor: '#FFE0B2',
              color: '#E65100',
              textTransform: 'uppercase',
            }}
          />
        </Box>
        {/* <Typography variant="body2" color="text.secondary">
          {agent.description}
        </Typography> */}
        <Typography
          variant="subtitle2"
          fontWeight={600}
          mt={1}
          color="text.secondary"
        >
          Skills:
        </Typography>
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
                textTransform: 'lowercase',
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
