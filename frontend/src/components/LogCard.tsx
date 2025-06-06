import type { FC } from 'react';
import { Box, Typography, Paper, ListItem } from '@mui/material';
import { LogEntry, LogLevel } from '../types/log';
import { JSONTree } from 'react-json-tree';

interface LogCardProps {
  log: LogEntry;
  agentName: string;
}

const jsonTheme = {
  scheme: 'monokai',
  base00: 'transparent',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

const getLogColor = (level: LogLevel) => {
  switch (level) {
    case LogLevel.ERROR:
      return {
        text: 'error.main',
        border: 'error.light',
        bg: 'error.lighter',
      };
    case LogLevel.WARNING:
      return {
        text: 'warning.main',
        border: 'warning.light',
        bg: 'warning.lighter',
      };
    case LogLevel.CRITICAL:
      return {
        text: 'error.main',
        border: 'error.light',
        bg: 'error.lighter',
      };
    case LogLevel.DEBUG:
      return {
        text: 'secondary.main',
        border: 'secondary.light',
        bg: 'secondary.lighter',
      };
    case LogLevel.INFO:
    default:
      return {
        text: 'info.main',
        border: 'info.light',
        bg: 'info.lighter',
      };
  }
};

export const LogCard: FC<LogCardProps> = ({ log, agentName }) => {
  const colors = getLogColor(log.log_level);

  // Try to parse the message as JSON, if it fails, treat it as a regular string
  const parsedMessage = (() => {
    try {
      return JSON.parse(log.message);
    } catch {
      return log.message;
    }
  })();

  return (
    <ListItem
      sx={{
        flexDirection: 'column',
        alignItems: 'flex-start',
        mb: 2,
        p: 0,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          p: 2,
          border: `1px solid`,
          borderColor: colors.border,
          backgroundColor: colors.bg,
          overflow: 'hidden',
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="subtitle1"
            sx={{ color: colors.text, fontWeight: 'bold' }}
          >
            {log.log_level.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(log.created_at).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box
            sx={{
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.border,
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: colors.text,
              },
            }}
          >
            {typeof parsedMessage === 'string' ? (
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', minWidth: 'min-content' }}
              >
                {parsedMessage}
              </Typography>
            ) : (
              <JSONTree
                data={parsedMessage}
                theme={jsonTheme}
                invertTheme={false}
              />
            )}
          </Box>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={1}
        >
          <Typography variant="caption" color="text.secondary">
            Agent: {agentName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {log.agent_id}
          </Typography>
        </Box>
      </Paper>
    </ListItem>
  );
};
