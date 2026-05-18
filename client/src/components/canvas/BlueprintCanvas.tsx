import React, { useEffect, useCallback, useRef } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState,
  Connection, Node, Edge, ReactFlowInstance,
} from '@xyflow/react'
import { useCanvasStore } from '../../stores/canvas.store'
import { LargeNode } from './LargeNode'
import { MediumNode } from './MediumNode'
import { SmallNode } from './SmallNode'
import { CausalEdge } from './CausalEdge'
import { NodeSize } from '../../types'
import { getSettings } from '../../services/settings.service'
import type { CanvasBackgroundVariant } from '../../services/settings.service'
import type { NodeMoveItem } from '../../commands'

/** 將設定的 variant 字串對應至 React Flow BackgroundVariant enum */
const VARIANT_MAP: Record<Exclude<CanvasBackgroundVariant, 'none'>, BackgroundVariant> = {
  dots:  BackgroundVariant.Dots,
  lines: BackgroundVariant.Lines,
  cross: BackgroundVariant.Cross,
}

const NODE_TYPES = {
  large: LargeNode,
  medium: MediumNode,
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
  /**
   * 拖拽結束後通知 CanvasPage，傳入每個被拖拽節點的新舊位置
   * CanvasPage 依此建立 MoveNodesCommand 並執行
   */
  onNodeDragStop: (items: NodeMoveItem[]) => void
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
  onNodeDragStop,
}: Props) {
  const { nodes: allNodes, edges: storeEdges, loadCanvas, selectNode, displayMode } = useCanvasStore()
  /** displayMode 過濾：high-weight 模式只顯示 weight >= 1.0 的節點 */
  const storeNodes = displayMode === 'high-weight'
    ? allNodes.filter(n => n.weight >= 1.0)
    : allNodes

  /** React Flow instance ref，用於計算 viewport 中心座標 */
  const reactFlowRef = useRef<ReactFlowInstance | null>(null)
  /** 追蹤拖拽開始前的 React Flow 節點位置，用於 MoveNodesCommand 的 prevX/Y */
  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  /** 從 localStorage 讀取背景設定（canvas 掛載時讀取一次；變更後需重回此頁才生效） */
  const { canvasBackgroundVariant, canvasBackgroundColor, canvasPatternColor } = getSettings()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => { loadCanvas(blueprintId) }, [blueprintId, loadCanvas])

  /**
   * 將 storeNodes 同步至 React Flow 節點狀態
   * - 已存在的節點：若 store 有持久化位置且與 RF 位置不同（undo 後），以 store 為準；否則保留 RF 拖拽位置
   * - 新增的節點：優先使用 DB 儲存的位置，否則定位於 viewport 中心
   */
  useEffect(() => {
    setNodes(prev => {
      const prevMap = new Map(prev.map(n => [n.id, n]))
      return storeNodes.map((n, idx) => {
        const existing = prevMap.get(n.id)
        if (existing) {
          // 若 store 有持久化位置且與 React Flow 目前位置不同（undo 後 store 被還原），以 store 為準
          if (n.positionX !== null && n.positionY !== null) {
            if (existing.position.x !== n.positionX || existing.position.y !== n.positionY) {
              return { ...existing, position: { x: n.positionX, y: n.positionY }, data: n as unknown as Record<string, unknown> }
            }
          }
          // 正常情況：保留 React Flow 的拖拽位置，只更新 data
          return { ...existing, data: n as unknown as Record<string, unknown> }
        }
        // 新節點：優先使用 DB 儲存的位置
        if (n.positionX !== null && n.positionY !== null) {
          return {
            id: n.id,
            type: n.size === NodeSize.LARGE ? 'large' : n.size === NodeSize.MEDIUM ? 'medium' : 'small',
            position: { x: n.positionX, y: n.positionY },
            data: n as unknown as Record<string, unknown>,
          }
        }
        // 新節點且無儲存位置：嘗試使用 viewport 中心
        let position = { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 150 }
        const rf = reactFlowRef.current
        if (rf) {
          const container = document.querySelector('.react-flow') as HTMLElement | null
          if (container) {
            const rect = container.getBoundingClientRect()
            position = rf.screenToFlowPosition({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            })
          }
        }
        return {
          id: n.id,
          type: n.size === NodeSize.LARGE ? 'large' : n.size === NodeSize.MEDIUM ? 'medium' : 'small',
          position,
          data: n as unknown as Record<string, unknown>,
        }
      })
    })
  }, [storeNodes, setNodes])

  /**
   * 將 storeEdges 同步至 React Flow 邊狀態
   */
  useEffect(() => {
    setEdges(storeEdges.map(e => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: 'causal',
      data: e as unknown as Record<string, unknown>,
    })))
  }, [storeEdges, setEdges])

  /** 儲存 ReactFlow instance 以供 viewport 計算使用 */
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance
  }, [])

  /**
   * 拖拽開始時記錄所有選中節點的當前位置，作為 undo 的還原基準
   */
  const handleNodeDragStart = useCallback(
    (_: React.MouseEvent, __: Node, nodes: Node[]) => {
      prevPositionsRef.current = new Map(nodes.map(n => [n.id, { x: n.position.x, y: n.position.y }]))
    },
    []
  )

  /**
   * 拖拽結束時組合新舊位置，通知 CanvasPage 建立 MoveNodesCommand
   */
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, __: Node, nodes: Node[]) => {
      const items: NodeMoveItem[] = nodes.map(n => {
        const prev = prevPositionsRef.current.get(n.id) ?? { x: n.position.x, y: n.position.y }
        return {
          id: n.id,
          newX: n.position.x,
          newY: n.position.y,
          prevX: prev.x,
          prevY: prev.y,
        }
      })
      onNodeDragStop(items)
    },
    [onNodeDragStop]
  )

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
      // 無需 stopPropagation：onNodeContextMenu 與 onNodeClick 是不同事件，不會互相觸發
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
    <div style={{ width: '100%', height: '100%', background: canvasBackgroundColor }}>
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
        onInit={handleInit}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        fitView
      >
        {canvasBackgroundVariant !== 'none' && (
          <Background
            variant={VARIANT_MAP[canvasBackgroundVariant]}
            color={canvasPatternColor}
          />
        )}
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
