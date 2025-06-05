import { useState, useEffect } from 'react';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import { AgentTrace } from '../types/agent';

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
      const nodePositions = traceData.map((_, index) => {
        const nodeId = `node-${index}`;
        const height = nodeHeights[nodeId] || 100; // Default height if not measured yet
        const position = { x: 100, y: currentY };
        currentY += height + 50; // Add 50px spacing between nodes
        return position;
      });

      // Create nodes with calculated positions
      const newNodes: Node[] = traceData.map((trace, index) => ({
        id: `node-${index}`,
        type: 'custom',
        position: nodePositions[index],
        data: {
          label: trace.name,
          input: trace.input,
          output: trace.output,
          flow: trace.flow,
        },
        style: {
          border: `2px solid ${trace.is_success || trace.flow?.at(-1)?.is_success ? '#4CAF50' : '#F44336'}`,
          borderRadius: '8px',
          padding: '10px',
          width: '180px',
          backgroundColor: trace.flow ? 'rgba(0, 0, 0, 0.05)' : 'white',
        },
      }));

      // Create edges for main flow
      const mainEdges: Edge[] = traceData.slice(0, -1).map((_, index) => ({
        id: `edge-${index}-${index + 1}`,
        source: `node-${index}`,
        target: `node-${index + 1}`,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#000',
          fill: '#000',
        },
        style: {
          strokeWidth: 2,
          stroke: '#000',
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
                  color: '#666',
                  fill: '#666',
                },
                style: {
                  strokeWidth: 1,
                  stroke: '#666',
                  strokeDasharray: '5,5',
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
