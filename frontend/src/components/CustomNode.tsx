import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography } from '@mui/material';

export const CustomNode = ({ data }: NodeProps) => {
  return (
    <Box
      style={{
        position: 'relative',
        padding: '16px 8px',
        borderRadius: 8,
        background: '#fff',
      }}
    >
      {data.label}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 2,
          right: 4,
          padding: '0 4px',
          fontSize: 8,
          border: '1px solid #E65100',
          color: '#E65100',
          borderRadius: 2,
        }}
      >
        {data.type}
      </Typography>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </Box>
  );
};
