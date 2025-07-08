import { useState, useEffect, useCallback } from 'react';
import type { FC, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  Node as ReactFlowNode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useLogs } from '@/hooks/useLogs';
import { useFlowNodes } from '@/hooks/useFlowNodes';
import { AgentTrace } from '@/types/agent';
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
  const [logAreaWidth, setLogAreaWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
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
    setSelectedNode(node);
  }, []);

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

  return (
    <MainLayout currentPage="Agent Trace">
      <div className="flex h-[calc(100vh-64px)]">
        {/* React Flow Area */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
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
        <div
          className={`relative p-6 overflow-auto bg-primary-white`}
          style={{ width: `${logAreaWidth}px` }}
        >
          <div
            className={`absolute top-0 bottom-0 left-0 w-0.5 cursor-col-resize hover:bg-primary-accent ${
              isResizing ? 'bg-primary-accent' : 'bg-transparent'
            }`}
            onMouseDown={handleMouseDown}
          />

          <Tabs defaultValue="trace">
            <TabsList>
              <TabsTrigger value="trace">Trace Details</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="trace">
              <TraceDetails
                traceData={traceData || []}
                selectedNode={selectedNode}
              />
            </TabsContent>
            <TabsContent value="logs">
              <ResponseLog logs={logs} traceData={traceData} error={error} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default AgentsTracePage;
