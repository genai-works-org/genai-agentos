import { Fragment } from 'react';
import type { FC } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface FlowChainNode {
  id: string;
  name: string;
  color: string;
}

interface FlowChainProps {
  links: FlowChainNode[];
}

export const FlowChain: FC<FlowChainProps> = ({ links }) => {
  if (links.length === 0) return null;

  return (
    <Box>
      <Typography variant="caption" gutterBottom>Flow Chain</Typography>
      <Box display="flex" alignItems="center" gap={0.25} flexWrap="wrap">
        {links.map((node, idx) => (
          <Fragment key={idx}>
            <Card
              sx={{
                minWidth: 20,
                border: `1px solid ${node.color}`,
                borderRadius: '2px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
              }}
            >
              <CardContent sx={{ p: 0.5 }}>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    mb: 0.125,
                    color: node.color,
                  }}
                >
                  {node.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.6rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {node.id.split('-')[0]+'...'}
                </Typography>
              </CardContent>
            </Card>
            {idx < links.length - 1 && (
              <Box sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
                →
              </Box>
            )}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}; 