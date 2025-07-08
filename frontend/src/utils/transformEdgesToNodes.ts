import { Edge } from 'reactflow';
import { FlowChainNode } from '@/types/flow';

export const transformEdgesToNodes = (edges: Edge[], agents: any[] = []) => {
  if (edges.length === 0) return [];
  const nodes: FlowChainNode[] = [];
  const processedIds = new Set<string>();

  // First, find the head node (node that is not a target in any edge)
  const allTargets = new Set(edges.map(edge => edge.target));
  const headNodeId = edges.find(edge => !allTargets.has(edge.source))?.source;

  if (!headNodeId) return nodes;

  // Start with the head node
  const headAgent = agents.find(a => a.id === headNodeId.split('::')[0]);
  nodes.push({
    id: headNodeId,
    agent_id: headNodeId.split('::')[0],
    name: headAgent?.agent_name || headNodeId,
    color: '#000000',
    nextId: null,
    type: headAgent?.type,
  });
  processedIds.add(headNodeId);

  // Follow the chain
  let currentId = headNodeId;
  while (true) {
    const nextEdge = edges.find(edge => edge.source === currentId);
    if (!nextEdge) break;

    const nextId = nextEdge.target;
    if (processedIds.has(nextId)) break; // Prevent cycles

    const nextAgent = agents.find(a => a.id === nextId.split('::')[0]);
    nodes.push({
      id: nextId,
      agent_id: nextId.split('::')[0],
      name: nextAgent?.agent_name || nextId,
      color: '#000000',
      nextId: null,
      type: nextAgent?.type,
    });
    processedIds.add(nextId);
    currentId = nextId;
  }

  return nodes;
};
