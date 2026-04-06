import React, { useEffect, useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Connection, Node, Edge,
} from '@xyflow/react'
import { useCanvasStore } from '../../stores/canvas.store'
import { LargeNode } from './LargeNode'
import { SmallNode } from './SmallNode'
import { CausalEdge } from './CausalEdge'
import { NodeSize } from '../../types'

const NODE_TYPES = {
  large: LargeNode,
  small: SmallNode,
}

const EDGE_TYPES = {
  causal: CausalEdge,
}

interface Props {
  blueprintId: string
  /** 使用者完成連線拖拽後通知 CanvasPage，由 CanvasPage 開啟 EdgeSettingsModal */
  onConnectionAttempt: (connection: Connection) => void
  /** 點擊 edge（onEdgeContextMenu 觸發時需 stopPropagation 阻止此事件） */
  onEdgeClick: (edgeId: string) => void
  /** 右鍵節點 */
  onNodeRightClick: (nodeId: string, x: number, y: number) => void
  /** 右鍵 edge */
  onEdgeRightClick: (edgeId: string, x: number, y: number) => void
}

/**
 * 藍圖畫布主元件
 * 負責渲染 React Flow 並將互動事件向上通知 CanvasPage
 * 不自行管理 Modal / ContextMenu 狀態
 */
export function BlueprintCanvas({
  blueprintId,
  onConnectionAttempt,
  onEdgeClick,
  onNodeRightClick,
  onEdgeRightClick,
}: Props) {
  const { nodes: storeNodes, edges: storeEdges, loadCanvas, selectNode } = useCanvasStore()

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
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { loadCanvas(blueprintId) }, [blueprintId, loadCanvas])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      onConnectionAttempt(connection)
    },
    [onConnectionAttempt]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => { selectNode(node.id) },
    [selectNode]
  )

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => { onEdgeClick(edge.id) },
    [onEdgeClick]
  )

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault()
      onNodeRightClick(node.id, e.clientX, e.clientY)
    },
    [onNodeRightClick]
  )

  const handleEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      e.preventDefault()
      e.stopPropagation()
      onEdgeRightClick(edge.id, e.clientX, e.clientY)
    },
    [onEdgeRightClick]
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
        onEdgeClick={handleEdgeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
