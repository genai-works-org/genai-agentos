import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Node } from 'reactflow';
import { Box, Paper, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { AgentTrace } from '@/types/agent';
import { removeUnderscore } from '@/utils/normalizeString';
import { getBatchVariant } from '@/utils/getNodeStyles';
import { JsonField } from './JsonField';
import { Badge } from '../ui/badge';
import Card from '../shared/Card';

interface TraceDetailsProps {
  traceData: AgentTrace[];
  selectedNode: Node | null;
}

export const TraceDetails: FC<TraceDetailsProps> = ({
  traceData,
  selectedNode,
}) => {
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>(
    {},
  );
  const selectedRef = useRef<HTMLDivElement | null>(null);

  const toggleTrace = (traceId: string) => {
    setExpandedTraces(prev => ({
      ...prev,
      [traceId]: !prev[traceId],
    }));
  };

  useEffect(() => {
    if (!selectedNode) return;

    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedNode, traceData]);

  return (
    <>
      <h3 className="font-bold mb-6">Trace Details</h3>

      <div className="flex flex-col gap-4">
        {traceData.map((trace, index) => {
          const traceId = trace.id || `trace-${index}`;
          const isExpanded = expandedTraces[traceId] || false;
          const isSelected = selectedNode?.id === `node-${index}`;

          return (
            <div key={traceId} ref={isSelected ? selectedRef : null}>
              <Card active={isSelected} className="w-full">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold truncate">
                      {removeUnderscore(trace.name)}
                    </p>
                    {trace.type && (
                      <Badge variant={getBatchVariant(trace.type)}>
                        {trace.type}
                      </Badge>
                    )}
                  </div>
                  {trace.id && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      ID: {trace.id}
                    </Typography>
                  )}
                  {trace.flow && (
                    <IconButton onClick={() => toggleTrace(traceId)}>
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </div>

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
                              Execution Time:{' '}
                              {flowItem.execution_time.toFixed(4)}s
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Collapse>

                {!trace.flow && (
                  <div className="break-all">
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
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </>
  );
};
