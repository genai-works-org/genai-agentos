import { useState, useEffect, useCallback, useRef } from 'react';
import type { FC, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { JSONTree } from 'react-json-tree';
import { Box, Typography, Collapse } from '@mui/material';
import ReactFlow, {
  Background,
  Controls,
  Node as ReactFlowNode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useLogs } from '@/hooks/useLogs';
import { useFlowNodes } from '@/hooks/useFlowNodes';
import { AgentTrace } from '@/types/agent';
import { jsonTreeTheme } from '@/constants/jsonTreeTheme';
import { MainLayout } from '@/components/layout/MainLayout';
import { FlowNode } from '@/components/flow/FlowNode';
import { TraceDetails } from '@/components/flow/TraceDetails';
import { ResponseLog } from '@/components/flow/ResponseLog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const nodeTypes = {
  custom: FlowNode,
};

const AgentsTracePage: FC = () => {
  const [traceData, setTraceData] = useState<AgentTrace[] | null>(null);
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [logAreaWidth, setLogAreaWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [showTracePanel, setShowTracePanel] = useState(false);
  const tracePanelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logs, error, fetchLogs } = useLogs();
  const { nodes, edges, onNodesChange, onEdgesChange } =
    useFlowNodes(traceData);

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

  const onNodeClick = useCallback((event: MouseEvent, node: ReactFlowNode) => {
    event.stopPropagation();
    if (!node.data.flow) {
      setSelectedNode(node);
      setSelectedStep(null);
      setShowTracePanel(true);
    }
  }, []);

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
    const searchParams = new URLSearchParams(location.search);
    const requestId = searchParams.get('requestId');
    if (requestId) {
      fetchLogs(requestId);
    }
  }, [location.search, fetchLogs]);

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

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <MainLayout currentPage="Agent Trace">
      <div className="flex h-[calc(100vh-64px)]">
        {/* React Flow Area */}
        <div
          onClick={() => showTracePanel && setShowTracePanel(false)}
          className="flex-1 relative"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
          >
            <Background />
            <Controls />
          </ReactFlow>

          <Button
            variant="secondary"
            onClick={() => navigate(location.state?.location)}
            className="absolute top-6 left-6 w-[166px]"
          >
            <MoveLeft size={16} />
            Back to Chat
          </Button>
        </div>

        {/* Log Area */}
        <Box
          width={logAreaWidth}
          p={'24px'}
          overflow="auto"
          position="relative"
          sx={{
            transition: isResizing ? 'none' : 'width 0.2s ease-in-out',
            backgroundColor: '#fff',
          }}
        >
          <div
            className={`absolute top-0 bottom-0 left-0 w-0.5 cursor-col-resize hover:bg-primary-accent ${
              isResizing ? 'bg-primary-accent' : 'bg-transparent'
            }`}
            onMouseDown={handleMouseDown}
          />

          <Tabs defaultValue="logs">
            <TabsList>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="trace">Trace Details</TabsTrigger>
            </TabsList>
            <TabsContent value="logs">
              <ResponseLog logs={logs} traceData={traceData} error={error} />
            </TabsContent>
            <TabsContent value="trace">
              <TraceDetails traceData={traceData || []} />
            </TabsContent>
          </Tabs>
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
      </div>
    </MainLayout>
  );
};

export default AgentsTracePage;
