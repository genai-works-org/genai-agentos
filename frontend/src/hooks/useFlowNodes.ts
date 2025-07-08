import { useState, useEffect } from 'react';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';

import { AgentTrace } from '@/types/agent';
import { getNodeStyles } from '@/utils/getNodeStyles';
import { removeUnderscore } from '@/utils/normalizeString';

export const useFlowNodes = (traceData: AgentTrace[] | null) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});

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
    if (traceData) {
      // Calculate node positions based on actual heights
      let currentY = 0;
      const currentX = (window.innerWidth - 1150) / 2;

      const nodePositions = traceData.map((_, index) => {
        const nodeId = `node-${index}`;
        const height = nodeHeights[nodeId] || 100; // Default height if not measured yet
        const position = { x: currentX, y: currentY };
        currentY += height + 100; // Add 100px spacing between nodes
        return position;
      });

      // Create nodes with calculated positions
      const newNodes: Node[] = traceData.map((trace, index) => ({
        id: `node-${index}`,
        type: 'custom',
        position: nodePositions[index],
        data: {
          label: removeUnderscore(trace.name),
          input: trace.input,
          output: trace.output,
          flow: trace.flow,
          type: trace?.type,
        },
        style: getNodeStyles(
          trace?.type || '',
          trace.is_success || trace.flow?.at(-1)?.is_success,
        ),
      }));

      // Create edges for main flow
      const mainEdges: Edge[] = traceData.slice(0, -1).map((_, index) => ({
        id: `edge-${index}-${index + 1}`,
        source: `node-${index}`,
        target: `node-${index + 1}`,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#008765',
          fill: '#008765',
        },
      }));

      // Create edges for sub-agents within flows
      const flowEdges: Edge[] = traceData.reduce(
        (edges: Edge[], trace, nodeIndex) => {
          if (trace.flow) {
            const flowNodeEdges = trace.flow
              .slice(0, -1)
              .map((_, flowIndex) => ({
                id: `flow-edge-${nodeIndex}-${flowIndex}-${flowIndex + 1}`,
                source: `flow-source-${nodeIndex}-${flowIndex}`,
                target: `flow-target-${nodeIndex}-${flowIndex + 1}`,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#008765',
                  fill: '#008765',
                },
              }));
            return [...edges, ...flowNodeEdges];
          }
          return edges;
        },
        [],
      );

      setNodes(newNodes);
      setEdges([...mainEdges, ...flowEdges]);
    }
  }, [traceData, nodeHeights]);

  return { nodes, edges, onNodesChange, onEdgesChange };
};
