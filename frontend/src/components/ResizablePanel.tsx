import type { ReactNode, FC } from 'react';
import { Box } from '@mui/material';
import { useResizablePanel } from '../hooks/useResizablePanel';

interface ResizablePanelProps {
  children: ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const ResizablePanel: FC<ResizablePanelProps> = ({
  children,
  initialWidth = 400,
  minWidth = 200,
  maxWidth = 800,
}) => {
  const { width, isResizing, handleMouseDown } = useResizablePanel({
    initialWidth,
    minWidth,
    maxWidth,
  });

  return (
    <Box
      width={width}
      p={2}
      overflow="auto"
      position="relative"
      sx={{
        transition: isResizing ? 'none' : 'width 0.2s ease-in-out',
      }}
    >
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        width="4px"
        onMouseDown={handleMouseDown as any} // TODO: fix type
        sx={{
          cursor: 'col-resize',
          '&:hover': {
            backgroundColor: 'primary.main',
          },
          backgroundColor: isResizing ? 'primary.main' : 'transparent',
        }}
      />
      {children}
    </Box>
  );
};
