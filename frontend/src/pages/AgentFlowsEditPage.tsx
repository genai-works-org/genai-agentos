import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { FC, DragEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import { Plus, MoveLeft, PanelBottomOpen } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { agentService } from '@/services/agentService';
import { normalizeString, removeUnderscore } from '@/utils/normalizeString';
import { getNodeStyles } from '@/utils/getNodeStyles';
import { transformEdgesToNodes } from '@/utils/transformEdgesToNodes';
import { AgentType, ActiveConnection } from '@/types/agent';
import { FlowChainNode } from '@/types/flow';
import { useAgent } from '@/hooks/useAgent';
import { useToast } from '@/hooks/useToast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import SaveFlowModal from '@/components/flow/SaveFlowModal';
import { FlowNode } from '@/components/flow/FlowNode';
import HeaderButtons from '@/components/flow/HeaderButtons';
import AgentsSidebar from '@/components/flow/AgentsSidebar';
import BottomPanel from '@/components/flow/BottomPanel';

const nodeTypes = {
  customNode: FlowNode,
};

const AgentFlowsEditPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState(() => `Agents-flow-${Date.now()}`);
  const [flowDescription, setFlowDescription] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [agents, setAgents] = useState<ActiveConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ActiveConnection[]>([]);
  const [saving, setSaving] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(true);
  const [openBottomPanel, setOpenBottomPanel] = useState(false);
  const [links, setLinks] = useState<FlowChainNode[]>([]);
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});
  const positionsSet = useRef(false);
  const { getAgentFlow, createAgentFlow, updateAgentFlow, getAgents } =
    useAgent();
  const toast = useToast();

  const isNewFlow = useMemo(() => id === 'new', [id]);
  const layoutTitle = isNewFlow ? 'New Agent Flow' : flowName;
  const allNodesConnected = nodes.length - 1 === edges.length;
  const isSaveEnabled =
    allNodesConnected && nodes.length > 0 && edges.length > 0;

  const handleDeleteNode = useCallback(
    (nodeIdToDelete: string) => {
      setNodes(nds => nds.filter(node => node.id !== nodeIdToDelete));
      setEdges(edg =>
        edg.filter(
          edge =>
            edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete,
        ),
      );
    },
    [setNodes, setEdges],
  );

  // React Flow handlers
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceExists = edges.some(edge => edge.source === params.source);
      const targetExists = edges.some(edge => edge.target === params.target);

      if (sourceExists || targetExists) return;

      const edgeWithStyle = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#008765',
          fill: '#008765',
        },
      };
      setEdges(eds => addEdge(edgeWithStyle, eds));
    },
    [setEdges, edges],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      positionsSet.current = true;
      const agent = JSON.parse(event.dataTransfer.getData('text/plain'));

      // Get the ReactFlow container's bounds
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();

      // Calculate position relative to the ReactFlow container
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      // Add some offset to make the node appear slightly above and to the left of the cursor
      const offset = 50;
      const finalPosition = {
        x: position.x - offset,
        y: position.y - offset,
      };

      // Ensure the node stays within the viewport bounds
      const nodeWidth = 505; // Approximate node width
      const nodeHeight = 350; // Approximate node height
      const boundedPosition = {
        x: Math.max(
          0,
          Math.min(finalPosition.x, reactFlowBounds.width - nodeWidth),
        ),
        y: Math.max(
          0,
          Math.min(finalPosition.y, reactFlowBounds.height - nodeHeight),
        ),
      };

      const newNode: Node = {
        id: `${agent.id}::${Date.now()}`,
        type: 'customNode',
        position: boundedPosition,
        data: {
          label: normalizeString(agent.name),
          description: agent.agent_schema.description,
          agent_id: id,
          type: agent?.type,
          isActive: agent?.is_active || false,
          onDelete: handleDeleteNode,
          isDeletable: true,
        },
        style: getNodeStyles(agent?.type, true),
      };
      setNodes(nds => nds.concat(newNode));
    },
    [setNodes],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Save logic
  const handleSave = async () => {
    setSaving(true);
    const flow = {
      name: flowName,
      description: flowDescription,
      flow: links.map(n => ({ id: n.agent_id, type: n.type })),
    };

    try {
      if (isNewFlow) {
        await createAgentFlow(flow);
      } else {
        await updateAgentFlow(id!, flow);
      }
      navigate('/agent-flows');
      toast.showSuccess('Agent Flow saved successfully');
    } catch (e) {
      toast.showError('Failed to save agent flow');
    } finally {
      setSaving(false);
    }
  };

  // Clear flow function
  const clearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setLinks([]);
    setFlowDescription('');
  }, []);

  // Fetch agents and flow data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const agentsData = (
          await agentService.getActiveAgents({ agent_type: AgentType.ALL })
        ).active_connections;
        const filteredAgents = agentsData.filter(
          agent => agent.type !== AgentType.FLOW,
        );

        setAgents(filteredAgents);

        if (isNewFlow) {
          clearFlow();
          setIsLoading(false);
          return;
        }

        const flowData = await getAgentFlow(id!);
        const genAiAgents = await getAgents();

        if (flowData) {
          setFlowName(removeUnderscore(flowData.name));
          setFlowDescription(flowData.description);

          // Create nodes from flow data with unique IDs
          const flowNodes: Node[] = flowData.flow.map(({ id }, index) => {
            const agent = agentsData.find(a => a.id === id);
            const nodeId = `${id}::${Date.now() + index}`;

            const label = agent
              ? normalizeString(agent?.name)
              : genAiAgents.find(a => a.agent_id === id)?.agent_name || '';

            return {
              id: nodeId,
              type: 'customNode',
              position: { x: 0, y: index * 200 },
              data: {
                label,
                description: agent?.agent_schema.description,
                agent_id: id,
                type: agent?.type,
                isActive: agent?.is_active || false,
                onDelete: handleDeleteNode,
                isDeletable: true,
              },
              style: getNodeStyles(agent?.type || '', agent?.is_active),
            };
          });
          setNodes(flowNodes);

          // Create edges connecting nodes sequentially
          const flowEdges: Edge[] = flowData.flow
            .slice(0, -1)
            .map((_, index) => {
              const sourceNode = flowNodes[index];
              const targetNode = flowNodes[index + 1];
              return {
                id: `e${sourceNode.id}-${targetNode.id}`,
                source: sourceNode.id,
                target: targetNode.id,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#008765',
                  fill: '#008765',
                },
              };
            });
          setEdges(flowEdges);
        }
      } catch (err) {
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isNewFlow]);

  // Search logic
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const lower = search.toLowerCase();
    setSearchResults(
      agents.filter(
        a =>
          (a.name && a.name.toLowerCase().includes(lower)) ||
          (a.agent_schema.description &&
            a.agent_schema.description.toLowerCase().includes(lower)),
      ),
    );
  }, [search, agents]);

  // Relationship display (edges)
  useEffect(() => {
    const nodes = transformEdgesToNodes(edges, agents);

    setLinks(nodes);
  }, [edges]);

  // Calculate node positions
  useEffect(() => {
    const handleNodeHeight = (event: CustomEvent) => {
      const { nodeId, height } = event.detail;
      setNodeHeights(prev => ({
        ...prev,
        [nodeId]: height,
      }));
    };

    window.addEventListener('nodeHeight', handleNodeHeight as EventListener);
    return () => {
      window.removeEventListener(
        'nodeHeight',
        handleNodeHeight as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (nodes.length === 0 || positionsSet.current) return;

    const gap = 100;
    let currentY = 0;

    setNodes(nds =>
      nds.map(node => {
        const height = nodeHeights[node.id] || 120;
        const position = { x: 0, y: currentY };
        currentY += height + gap;

        return {
          ...node,
          position,
        };
      }),
    );

    positionsSet.current = true;
  }, [nodeHeights]);

  if (isLoading) {
    return (
      <MainLayout currentPage="">
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
          <CircularProgress />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      currentPage={layoutTitle}
      actionItems={
        <HeaderButtons
          message={
            !isSaveEnabled ? 'Please make sure all nodes are connected.' : ''
          }
          onSave={() => setShowSaveModal(true)}
          onClear={clearFlow}
          isSaveDisabled={!isSaveEnabled}
        />
      }
    >
      <div className="flex h-full">
        <div className="flex flex-col flex-1">
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background />
              <Controls position="bottom-right" />
            </ReactFlow>

            <Button
              variant="secondary"
              onClick={() => setOpenDrawer(true)}
              className="absolute bottom-6 right-14 w-[140px]"
            >
              <Plus size={16} />
              Add Agents
            </Button>

            <Button
              variant="secondary"
              onClick={() => navigate('/agent-flows')}
              className="absolute top-6 left-6 w-[225px]"
            >
              <MoveLeft size={16} />
              Back to Agent Flows
            </Button>

            <Button
              onClick={() => setOpenBottomPanel(true)}
              className="absolute bottom-6 right-[206px] w-10 px-0"
            >
              <PanelBottomOpen size={16} />
            </Button>

            {openBottomPanel && (
              <BottomPanel
                setOpenBottomPanel={setOpenBottomPanel}
                links={links}
                description={flowDescription}
                setDescription={setFlowDescription}
              />
            )}
          </div>
        </div>

        <AgentsSidebar
          isOpen={openDrawer}
          setIsOpen={setOpenDrawer}
          search={search}
          setSearch={setSearch}
          nodes={nodes}
          agents={agents}
          searchResults={searchResults}
        />
      </div>

      <SaveFlowModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        flowName={flowName}
        onFlowNameChange={setFlowName}
        flowDescription={flowDescription}
        onFlowDescriptionChange={setFlowDescription}
        links={links}
        saving={saving}
        onSave={handleSave}
      />
    </MainLayout>
  );
};

export default AgentFlowsEditPage;
