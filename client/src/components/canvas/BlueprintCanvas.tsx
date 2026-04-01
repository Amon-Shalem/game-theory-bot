import React, { useEffect, useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Connection, Node, Edge,
} from '@xyflow/react'
import { useCanvasStore } from '../../stores/canvas.store'
import { LargeNode } from './LargeNode'
import { SmallNode } from './SmallNode'
import { CausalEdge } from './CausalEdge'
import { NodeDto, NodeSize, Direction, Magnitude } from '../../types'

const NODE_TYPES = {
  large: LargeNode,
  small: SmallNode,
}

const EDGE_TYPES = {
  causal: CausalEdge,
}

interface Props {
  blueprintId: string
}

/**
 * 藍圖畫布主元件
 * 將 canvasStore 的 NodeDto[] / EdgeDto[] 轉換為 React Flow 格式
 */
export function BlueprintCanvas({ blueprintId }: Props) {
  const { nodes: storeNodes, edges: storeEdges, loadCanvas, selectNode, addEdge: storeAddEdge } = useCanvasStore()

  const flowNodes: Node[] = storeNodes.map((n, idx) => ({
    id: n.id,
    type: n.size === NodeSize.LARGE ? 'large' : 'small',
    position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 150 },
    data: n,
  }))

  const flowEdges: Edge[] = storeEdges.map(e => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    type: 'causal',
    data: e,
  }))

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { loadCanvas(blueprintId) }, [blueprintId, loadCanvas])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      storeAddEdge({
        blueprintId,
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        direction: Direction.PROMOTES,
        magnitude: Magnitude.MEDIUM,
        theoryIds: [],
      })
    },
    [blueprintId, storeAddEdge]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => { selectNode(node.id) },
    [selectNode]
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
