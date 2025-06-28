import type { FC } from 'react';
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import { AgentTrace } from '../../types/agent';
import { JsonField } from './JsonField';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { removeUnderscore } from '../../utils/normalizeString';

interface TraceDetailsProps {
  traceData: AgentTrace[];
}

export const TraceDetails: FC<TraceDetailsProps> = ({ traceData }) => {
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>(
    {},
  );

  const toggleTrace = (traceId: string) => {
    setExpandedTraces(prev => ({
      ...prev,
      [traceId]: !prev[traceId],
    }));
  };

  const renderFlowTrace = (trace: AgentTrace, index: number) => {
    const traceId = trace.id || `trace-${index}`;
    const isExpanded = expandedTraces[traceId] || false;

    return (
      <Paper
        key={traceId}
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          border: `2px solid ${
            trace.is_success || trace.flow?.at(-1)?.is_success
              ? '#4CAF50'
              : '#F44336'
          }`,
          borderRadius: '8px',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                maxWidth: '100%',
                overflowWrap: 'break-word',
              }}
            >
              <Typography variant="h6" sx={{ overflowWrap: 'break-word' }}>
                {removeUnderscore(trace.name)}
              </Typography>
              {trace.type && (
                <Chip
                  label={trace.type}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#FFE0B2',
                    color: '#E65100',
                    textTransform: 'uppercase',
                  }}
                />
              )}
            </Box>
            {trace.id && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {trace.id}
              </Typography>
            )}
          </Box>
          {trace.flow && (
            <IconButton onClick={() => toggleTrace(traceId)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        <Collapse in={isExpanded}>
          {trace.flow && (
            <Box sx={{ mt: 2, ml: 2 }}>
              {trace.flow.map((flowItem, flowIndex) => (
                <Paper
                  key={flowItem.id || `flow-${flowIndex}`}
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: `1px solid ${
                      flowItem.is_success ? '#4CAF50' : '#F44336'
                    }`,
                    borderRadius: '8px',
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {flowItem.name}
                  </Typography>
                  {flowItem.id && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      ID: {flowItem.id}
                    </Typography>
                  )}
                  <JsonField
                    label="Input"
                    value={flowItem.input}
                    fieldId={`flow-input-${flowItem.id || flowIndex}`}
                  />
                  <JsonField
                    label="Output"
                    value={flowItem.output}
                    fieldId={`flow-output-${flowItem.id || flowIndex}`}
                  />
                  {flowItem.execution_time && (
                    <Typography variant="body2" color="text.secondary">
                      Execution Time: {flowItem.execution_time.toFixed(4)}s
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Collapse>

        {!trace.flow && (
          <>
            <JsonField
              label="Input"
              value={trace.input}
              fieldId={`input-${traceId}`}
            />
            <JsonField
              label="Output"
              value={trace.output}
              fieldId={`output-${traceId}`}
            />
          </>
        )}
      </Paper>
    );
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Trace Details
      </Typography>
      <Divider sx={{ my: 1 }} />
      {traceData.map((trace, index) => renderFlowTrace(trace, index))}
    </>
  );
};
