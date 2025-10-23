'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './nodes';
import { WorkflowState } from '@/lib/automation/types';

interface WorkflowCanvasProps {
  initialWorkflow?: WorkflowState;
  onWorkflowChange?: (workflow: WorkflowState) => void;
  onNodeSelect?: (node: Node | null) => void;
}

export function WorkflowCanvas({
  initialWorkflow,
  onWorkflowChange,
  onNodeSelect,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Sync external workflow changes to internal state
  // Only update when the node/edge count or structure actually changes
  useEffect(() => {
    if (initialWorkflow) {
      const nodesChanged = JSON.stringify(nodes.map(n => n.id).sort()) !== JSON.stringify(initialWorkflow.nodes.map((n: any) => n.id).sort());
      const edgesChanged = JSON.stringify(edges.map(e => e.id).sort()) !== JSON.stringify(initialWorkflow.edges.map((e: any) => e.id).sort());

      if (nodesChanged) {
        setNodes(initialWorkflow.nodes as any);
      }
      if (edgesChanged) {
        setEdges(initialWorkflow.edges as any);
      }
    }
  }, [initialWorkflow?.nodes.length, initialWorkflow?.edges.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdges = addEdge({ ...params, type: 'smoothstep', animated: true }, edges);
      setEdges(newEdges);
      onWorkflowChange?.({ nodes, edges: newEdges });
    },
    [edges, nodes, setEdges, onWorkflowChange]
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      // Notify parent of changes after a short delay to batch updates
      setTimeout(() => {
        onWorkflowChange?.({ nodes, edges });
      }, 100);
    },
    [nodes, edges, onNodesChange, onWorkflowChange]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'trigger') return '#a855f7';
            if (node.type === 'action') return '#3b82f6';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
