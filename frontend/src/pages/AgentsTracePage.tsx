import { useState, useEffect, useCallback, useRef } from 'react';
import type { FC, MouseEvent, SyntheticEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Collapse } from '@mui/material';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node as ReactFlowNode,
} from 'reactflow';
import { JSONTree } from 'react-json-tree';
import 'reactflow/dist/style.css';
import { MainLayout } from '../components/layout/MainLayout';
import { useLogs } from '../hooks/useLogs';
import { useFlowNodes } from '../hooks/useFlowNodes';
import { FlowNode } from '../components/FlowNode';
import { AgentTrace } from '../types/agent';
import { TraceDetails } from '../components/TraceDetails';
import { ResponseLog } from '../components/ResponseLog';
import { jsonTreeTheme } from '../constants/jsonTreeTheme';

const nodeTypes = {
  custom: FlowNode,
};

const AgentsTracePage: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [traceData, setTraceData] = useState<AgentTrace[] | null>(null);
  const { logs, isLoading, error, fetchLogs } = useLogs();
  const { nodes, edges, onNodesChange, onEdgesChange } =
    useFlowNodes(traceData);
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [logAreaWidth, setLogAreaWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showTracePanel, setShowTracePanel] = useState(false);
  const tracePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestId = searchParams.get('requestId');
    if (requestId) {
      fetchLogs(requestId);
    }
  }, [location.search, fetchLogs]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: WindowEventMap['mousemove']) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 200 && newWidth <= 800) {
        setLogAreaWidth(newWidth);
      }
    },
    [isResizing],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const state = location.state as { traceData: AgentTrace[] } | null;
    if (state?.traceData) {
      setTraceData(state.traceData);
    }
  }, [location.state]);

  useEffect(() => {
    const handleFlowStepClick = (event: CustomEvent) => {
      event.stopPropagation();
      const { step } = event.detail;
      setSelectedStep(step);
      setShowTracePanel(true);
    };

    window.addEventListener(
      'flowStepClick',
      handleFlowStepClick as EventListener,
    );
    return () => {
      window.removeEventListener(
        'flowStepClick',
        handleFlowStepClick as EventListener,
      );
    };
  }, []);

  const onNodeClick = useCallback((event: MouseEvent, node: ReactFlowNode) => {
    event.stopPropagation();
    if (!node.data.flow) {
      setSelectedNode(node);
      setSelectedStep(null);
      setShowTracePanel(true);
    }
  }, []);

  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleClickOutside = useCallback(
    (event: WindowEventMap['mousemove']) => {
      if (
        tracePanelRef.current &&
        !tracePanelRef.current.contains(event.target as HTMLElement)
      ) {
        setShowTracePanel(false);
      }
    },
    [],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <MainLayout
      currentPage="Agent Trace"
      handleReturn={() => {
        navigate('/chat');
      }}
    >
      <Box display="flex" height="calc(100vh - 64px)">
        {/* React Flow Area */}
        <Box
          flex={1}
          position="relative"
          borderRight={1}
          borderColor="grey.300"
          onClick={() => showTracePanel && setShowTracePanel(false)}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>

        {/* Log Area */}
        <Box
          width={logAreaWidth}
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
            onMouseDown={handleMouseDown}
            sx={{
              cursor: 'col-resize',
              '&:hover': {
                backgroundColor: 'primary.main',
              },
              backgroundColor: isResizing ? 'primary.main' : 'transparent',
            }}
          />
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Logs" />
            <Tab label="Trace Details" />
          </Tabs>

          {selectedTab === 0 ? (
            <ResponseLog
              logs={logs}
              traceData={traceData}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <TraceDetails traceData={traceData || []} />
          )}
        </Box>

        {/* Bottom Trace Panel */}
        <Collapse in={showTracePanel}>
          <Box
            ref={tracePanelRef}
            onClick={e => e.stopPropagation()}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '300px',
              backgroundColor: 'background.paper',
              boxShadow: 3,
              zIndex: 1000,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              {selectedNode && !selectedStep && (
                <>
                  <Typography variant="h6" gutterBottom>
                    {selectedNode.data.name}
                  </Typography>
                  {selectedNode.data.id && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      ID: {selectedNode.data.id}
                    </Typography>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Input
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        overflowX: 'auto',
                      }}
                    >
                      <JSONTree
                        data={selectedNode.data.input}
                        theme={jsonTreeTheme}
                        invertTheme={false}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Output
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        overflowX: 'auto',
                      }}
                    >
                      <JSONTree
                        data={selectedNode.data.output}
                        theme={jsonTreeTheme}
                        invertTheme={false}
                      />
                    </Box>
                  </Box>
                </>
              )}
              {selectedStep && (
                <>
                  <Typography variant="h6" gutterBottom>
                    {selectedStep.name}
                  </Typography>
                  {selectedStep.id && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      ID: {selectedStep.id}
                    </Typography>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Input
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        overflowX: 'auto',
                      }}
                    >
                      <JSONTree
                        data={selectedStep.input}
                        theme={jsonTreeTheme}
                        invertTheme={false}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Output
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        overflowX: 'auto',
                      }}
                    >
                      <JSONTree
                        data={selectedStep.output}
                        theme={jsonTreeTheme}
                        invertTheme={false}
                      />
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Collapse>
      </Box>
    </MainLayout>
  );
};

export default AgentsTracePage;
