import type { FC } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LogCard } from './LogCard';
import { AgentTrace } from '../../types/agent';
import { Log } from '../../types/log';

interface ResponseLogProps {
  logs: Log[];
  traceData: AgentTrace[] | null;
  isLoading: boolean;
  error: Error | null;
}

export const ResponseLog: FC<ResponseLogProps> = ({
  logs,
  traceData,
  isLoading,
  error,
}) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Full Response Log
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : logs.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            No logs available for this trace
          </Typography>
        ) : (
          <List>
            {logs.map(log => {
              const agentName =
                traceData?.find(trace => trace.id === log.agent_id)?.name ||
                'Unknown Agent';
              return (
                <LogCard key={log.created_at} log={log} agentName={agentName} />
              );
            })}
          </List>
        )}
      </Paper>
    </>
  );
};
