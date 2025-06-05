import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { FC, DragEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Save, Search, Pencil, Trash } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MainLayout } from '../components/MainLayout';
import { AgentFlowCreate } from '../types/agent';
import { agentService } from '../services/agentService';
import { FlowChain } from '../components/FlowChain';
import { SaveFlowModal } from '../components/SaveFlowModal';
import { AgentType, ActiveConnection } from '../types/agent';
import { normalizeString } from '../utils/normalizeString';

const getDefaultFlowName = () => `Agents-flow-${Date.now()}`;

const highlightMatch = (
  text: string,
  match: string,
  isDescription: boolean = false,
) => {
  if (!match) return text;
  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx === -1) return text;

  if (!isDescription) {
    // For name, show full text with highlight
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: 'yellow', fontWeight: 600 }}>
          {text.slice(idx, idx + match.length)}
        </span>
        {text.slice(idx + match.length)}
      </>
    );
  } else {
    // For description, show only portion around match
    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + match.length + 20);
    return (
      <>
        {start > 0 ? '...' : ''}
        {text.slice(start, idx)}
        <span style={{ background: 'yellow', fontWeight: 600 }}>
          {text.slice(idx, idx + match.length)}
        </span>
        {text.slice(idx + match.length, end)}
        {end < text.length ? '...' : ''}
      </>
    );
  }
};

export const transformEdgesToNodes = (
  edges: any[],
  agents: any[] = [],
  usedAgentColors: Record<string, string> = {},
): Node[] => {
  if (edges.length === 0) return [];
  const nodes: any[] = [];
  const processedIds = new Set<string>();

  // First, find the head node (node that is not a target in any edge)
  const allTargets = new Set(edges.map(edge => edge.target));
  const headNodeId = edges.find(edge => !allTargets.has(edge.source))?.source;

  if (!headNodeId) return nodes;

  // Start with the head node
  const headAgent = agents.find(a => a.agent_id === headNodeId.split('::')[0]);
  nodes.push({
    id: headNodeId,
    agent_id: headNodeId.split('::')[0],
    name: headAgent?.agent_name || headNodeId,
    color: usedAgentColors[headNodeId.split('::')[0]] || '#000000',
    nextId: null,
  });
  processedIds.add(headNodeId);

  // Follow the chain
  let currentId = headNodeId;
  while (true) {
    const nextEdge = edges.find(edge => edge.source === currentId);
    if (!nextEdge) break;

    const nextId = nextEdge.target;
    if (processedIds.has(nextId)) break; // Prevent cycles

    const nextAgent = agents.find(a => a.agent_id === nextId.split('::')[0]);
    nodes.push({
      id: nextId,
      agent_id: nextId.split('::')[0],
      name: nextAgent?.agent_name || nextId,
      color: usedAgentColors[nextId.split('::')[0]] || '#000000',
      nextId: null,
    });
    processedIds.add(nextId);
    currentId = nextId;
  }

  return nodes;
};

export const AgentFlowsEditPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewFlow = useMemo(() => id === 'new', [id]);
  const layoutTitle = isNewFlow ? 'New Agent Flow' : 'Edit Agent Flow';

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState(getDefaultFlowName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [flowDescription, setFlowDescription] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [agents, setAgents] = useState<ActiveConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ActiveConnection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usedAgentColors, setUsedAgentColors] = useState<
    Record<string, string>
  >({});
  const [links, setLinks] = useState<any[]>([]);

  // Generate a random color for an agent
  const getAgentColor = useCallback(
    (agentId: string) => {
      if (usedAgentColors[agentId]) {
        return usedAgentColors[agentId];
      }
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const color = `rgb(${r}, ${g}, ${b})`;
      setUsedAgentColors(prev => ({ ...prev, [agentId]: color }));
      return color;
    },
    [usedAgentColors],
  );

  // Fetch agents and flow data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const agentsData = (
          await agentService.getActiveAgents({ agent_type: AgentType.ALL })
        ).active_connections;

        setAgents(agentsData);

        if (isNewFlow) {
          clearFlow();
          setIsLoading(false);
          return;
        }

        const flowData = await agentService.getAgentFlow(id!);

        if (flowData) {
          setFlowName(flowData.name);
          setFlowDescription(flowData.description || '');

          // Create nodes from flow data with unique IDs
          const flowNodes: Node[] = flowData.flow.map((flowItem, index) => {
            const agent = agentsData.find(a => a.id === flowItem.agent_id);
            const nodeId = `${flowItem.agent_id}::${Date.now() + index}`;
            return {
              id: nodeId,
              type: 'default',
              position: { x: 0, y: index * 75 },
              data: {
                label: normalizeString(agent?.name || flowItem.agent_id),
                description: agent?.agent_schema.description,
                agent_id: flowItem.agent_id,
              },
              style: {
                border: `2px solid ${getAgentColor(flowItem.agent_id)}`,
                borderRadius: '8px',
              },
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
                  color: '#000',
                  fill: '#000',
                },
                style: {
                  strokeWidth: 2,
                  stroke: '#000',
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

  // React Flow handlers
  const onConnect = useCallback(
    (params: Connection) => {
      const edgeWithStyle = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#000',
          fill: '#000',
        },
        style: {
          strokeWidth: 2,
          stroke: '#000',
        },
      };
      setEdges(eds => addEdge(edgeWithStyle, eds));
    },
    [setEdges],
  );

  // Custom edge change handler
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      // Filter out any changes that are not removals
      const removals = changes.filter(change => change.type === 'remove');
      if (removals.length > 0) {
        // Get the IDs of edges to remove
        const edgeIdsToRemove = removals.map(change => change.id);
        // Update edges by filtering out the removed ones
        setEdges(eds => eds.filter(edge => !edgeIdsToRemove.includes(edge.id)));
      } else {
        // For other changes, use the default handler
        onEdgesChange(changes);
      }
    },
    [onEdgesChange, setEdges],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
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
      const nodeWidth = 200; // Approximate node width
      const nodeHeight = 100; // Approximate node height
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

      const color = getAgentColor(agent.id);
      const newNode: Node = {
        id: `${agent.id}::${Date.now()}`,
        type: 'default',
        position: boundedPosition,
        data: {
          label: normalizeString(agent.name),
          description: agent.agent_schema.description,
          color,
        },
        style: {
          border: `2px solid ${color}`,
          borderRadius: '8px',
        },
      };
      setNodes(nds => nds.concat(newNode));
    },
    [setNodes, getAgentColor],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Save logic
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const flow: AgentFlowCreate = {
      name: flowName,
      description: flowDescription,
      flow: links.map(n => ({ agent_id: n.agent_id })),
    };
    try {
      if (isNewFlow) {
        await agentService.createAgentFlow(flow);
      } else {
        await agentService.updateAgentFlow(id!, flow);
      }
      navigate('/agent-flows');
    } catch (e) {
      setSaveError('Failed to save agent flows');
    } finally {
      setSaving(false);
    }
  };

  // Relationship display (edges)
  useEffect(() => {
    const nodes = transformEdgesToNodes(edges, agents, usedAgentColors);

    setLinks(nodes);
  }, [edges]);

  // Editable name input logic
  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // Clear flow function
  const clearFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setLinks([]);
    setFlowName(getDefaultFlowName());
    setFlowDescription('');
    setUsedAgentColors({});
  }, []);

  if (isLoading) {
    return (
      <MainLayout currentPage={layoutTitle}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="calc(100vh - 64px)"
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentPage={layoutTitle}>
      <Box display="flex" height="100%">
        {/* Main Flow Area */}
        <Box flex={1} display="flex" flexDirection="column" position="relative">
          {/* Top bar */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={2}
            py={1}
          >
            <Box display="flex" alignItems="center">
              {isEditingName ? (
                <TextField
                  inputRef={nameInputRef}
                  value={flowName}
                  onChange={e => setFlowName(e.target.value.slice(0, 100))}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') setIsEditingName(false);
                  }}
                  size="small"
                  sx={{
                    minWidth: 220,
                    '& .MuiInputBase-root': {
                      overflow: 'auto',
                      maxHeight: '100px',
                    },
                  }}
                  inputProps={{
                    maxLength: 100,
                  }}
                  helperText={`${flowName.length}/100 characters`}
                />
              ) : (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="h6"
                    sx={{
                      cursor: 'pointer',
                      userSelect: 'none',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {flowName}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setIsEditingName(true)}
                    sx={{ p: 0.5 }}
                  >
                    <Pencil size={16} />
                  </IconButton>
                </Box>
              )}
            </Box>
            <Box display="flex">
              <IconButton
                color="primary"
                onClick={clearFlow}
                sx={{
                  mr: 1,
                  background: '#FF5722',
                  color: 'white',
                  '&:hover': { background: '#F4511E' },
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                size="large"
              >
                <Trash />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => setShowSaveModal(true)}
                sx={{
                  background: '#FF5722',
                  color: 'white',
                  '&:hover': { background: '#F4511E' },
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                size="large"
              >
                <Save />
              </IconButton>
            </Box>
          </Box>

          {/* React Flow Canvas */}
          <Box
            flex={1}
            minHeight={400}
            position="relative"
            borderRadius={2}
            overflow="hidden"
            border={1}
            borderColor="grey.300"
            m={2}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </Box>

          {/* Description textarea */}
          <Box px={2} pb={1}>
            <TextField
              label="Flow Description"
              value={flowDescription}
              onChange={e => setFlowDescription(e.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiInputBase-root': {
                  overflow: 'auto',
                  maxHeight: '200px',
                },
              }}
            />
          </Box>

          {/* Relationship display */}
          <Box px={2} pb={1}>
            <FlowChain links={links} />
          </Box>
        </Box>

        {/* Right Sidebar */}
        <Box
          minWidth={125}
          width={{ xs: 125, sm: 280, md: 340 }}
          bgcolor="#fafbfc"
          borderLeft={1}
          borderColor="grey.200"
          p={2}
          sx={{
            '@media (max-width: 1000px)': {
              width: 280,
            },
          }}
        >
          <Typography variant="h6" mb={2}>
            Add Agents
          </Typography>
          <TextField
            fullWidth
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          {isLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={120}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box maxHeight={500} overflow="auto">
              {(search.length >= 2 ? searchResults : agents).map(agent => {
                const color = usedAgentColors[agent.id] || 'transparent';
                return (
                  <Card
                    key={agent.id}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      cursor: 'grab',
                      border: `2px solid ${color}`,
                      borderRadius: '8px',
                      boxShadow:
                        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    }}
                    draggable
                    onDragStart={e =>
                      e.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify(agent),
                      )
                    }
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        {highlightMatch(
                          normalizeString(agent.name || ''),
                          search,
                          false,
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        {highlightMatch(
                          agent.agent_schema.description,
                          search,
                          true,
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
              {(search.length >= 2 && searchResults.length === 0) ||
              agents.length === 0 ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight={120}
                >
                  <Typography variant="body2" color="text.secondary">
                    No agents found
                  </Typography>
                </Box>
              ) : null}
            </Box>
          )}
        </Box>
      </Box>

      {/* Save Modal */}
      <SaveFlowModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        flowName={flowName}
        onFlowNameChange={setFlowName}
        flowDescription={flowDescription}
        onFlowDescriptionChange={setFlowDescription}
        links={links}
        saveError={saveError}
        saving={saving}
        onSave={handleSave}
      />
    </MainLayout>
  );
};
