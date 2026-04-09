import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BlueprintCanvas } from '../canvas/BlueprintCanvas'
import { NodeInfoPanel } from '../panels/NodeInfoPanel'
import { EdgeSettingsModal } from '../modals/EdgeSettingsModal'
import { NodeContextMenu } from '../menus/NodeContextMenu'
import { EdgeContextMenu } from '../menus/EdgeContextMenu'
import { useCanvasStore } from '../../stores/canvas.store'
import { useHistoryStore } from '../../stores/history.store'
import {
  AddNodeCommand, AddEdgeCommand, RemoveNodeCommand, RemoveEdgeCommand, UpdateEdgeCommand,
} from '../../commands'
import type { EdgeFormValues } from '../../commands'
import { NodeType, NodeSize, TimeScale } from '../../types'
import type { Connection } from '@xyflow/react'

/** Edge Settings Modal 狀態 */
type EdgeModalState =
  | { mode: 'create'; connection: Connection }
  | { mode: 'edit'; edgeId: string }
  | null

/** Context Menu 狀態 */
type ContextMenuState =
  | { type: 'node'; nodeId: string; x: number; y: number }
  | { type: 'edge'; edgeId: string; x: number; y: number }
  | null

/** 畫布主頁面 — 包含工具列、React Flow 畫布、節點資訊面板、Edge Modal、右鍵選單 */
export function CanvasPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>()
  const navigate = useNavigate()
  const { nodes, selectedNodeId } = useCanvasStore()
  const { undoStack, redoStack, undo, redo, clearHistory } = useHistoryStore()

  // 新增節點表單
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.EVENT)
  const [newNodeSize, setNewNodeSize] = useState<NodeSize>(NodeSize.LARGE)
  const [newTimeScale, setNewTimeScale] = useState<TimeScale>(TimeScale.MEDIUM)
  /** 新增子節點時記錄父節點 ID；null 表示新增頂層節點 */
  const [pendingParentNodeId, setPendingParentNodeId] = useState<string | null>(null)

  // Edge Settings Modal
  const [edgeModal, setEdgeModal] = useState<EdgeModalState>(null)

  // Context Menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  // 藍圖切換時清空歷史
  useEffect(() => {
    clearHistory()
  }, [blueprintId, clearHistory])

  // 鍵盤快捷鍵 Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (isCtrlOrCmd && e.key === 'y') ||
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  if (!blueprintId) return <div>找不到藍圖</div>

  // ---- 新增節點 ----
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNodeTitle.trim()) return
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new AddNodeCommand({
      blueprintId,
      type: newNodeType,
      size: newNodeSize,
      title: newNodeTitle.trim(),
      timeScale: newTimeScale,
      parentNodeId: pendingParentNodeId ?? undefined,
    }))
    setNewNodeTitle('')
    setShowAddForm(false)
    setPendingParentNodeId(null)
  }

  // ---- Edge Settings Modal handlers ----
  const handleConnectionAttempt = (connection: Connection) => {
    setEdgeModal({ mode: 'create', connection })
  }

  const handleEdgeModalConfirm = async (values: EdgeFormValues) => {
    const { executeCommand } = useHistoryStore.getState()
    if (edgeModal?.mode === 'create') {
      const { connection } = edgeModal
      await executeCommand(new AddEdgeCommand({
        blueprintId,
        sourceNodeId: connection.source!,
        targetNodeId: connection.target!,
        direction: values.direction,
        magnitude: values.magnitude,
        reasoning: values.reasoning,
        theoryIds: [],
      }))
    } else if (edgeModal?.mode === 'edit') {
      await executeCommand(new UpdateEdgeCommand(edgeModal.edgeId, values))
    }
    setEdgeModal(null)
  }

  const handleEdgeClick = (edgeId: string) => {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)
    if (!edge) return
    setEdgeModal({
      mode: 'edit',
      edgeId,
    })
  }

  // ---- Context Menu handlers ----
  const handleNodeRightClick = (nodeId: string, x: number, y: number) => {
    setContextMenu({ type: 'node', nodeId, x, y })
  }

  const handleEdgeRightClick = (edgeId: string, x: number, y: number) => {
    setContextMenu({ type: 'edge', edgeId, x, y })
  }

  const handleAddChild = (nodeId: string) => {
    setPendingParentNodeId(nodeId)
    setShowAddForm(true)
  }

  const handleDeleteNode = async (nodeId: string) => {
    setContextMenu(null)
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new RemoveNodeCommand(nodeId))
  }

  const handleEditEdge = (edgeId: string) => {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)
    if (!edge) return
    setEdgeModal({ mode: 'edit', edgeId })
  }

  const handleDeleteEdge = async (edgeId: string) => {
    setContextMenu(null)
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new RemoveEdgeCommand(edgeId))
  }

  // ---- EdgeSettingsModal initialValues（edit 模式） ----
  // 設計說明：在 render 期間直接讀取 store（而非在 handler 中）。
  // 這是合理的：edgeModal state 改變本身即觸發 re-render，此時讀取 store 與
  // 在 handler 中同步讀取效果相同，且使 handler 保持簡潔（不需額外傳遞 initialValues）。
  const edgeModalInitialValues: EdgeFormValues | undefined = (() => {
    if (edgeModal?.mode !== 'edit') return undefined
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeModal.edgeId)
    if (!edge) return undefined
    return { direction: edge.direction, magnitude: edge.magnitude, reasoning: edge.reasoning }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 工具列 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>← 返回列表</button>
        <button onClick={() => { setPendingParentNodeId(null); setShowAddForm(!showAddForm) }}>+ 新增節點</button>
        <button onClick={() => undo()} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">Undo</button>
        <button onClick={() => redo()} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">Redo</button>
      </div>

      {/* 新增節點表單 */}
      {showAddForm && (
        <form onSubmit={handleAddNode} style={{ padding: '8px 16px', borderBottom: '1px solid #eee', display: 'flex', gap: '8px' }}>
          <input placeholder="節點標題" value={newNodeTitle} onChange={e => setNewNodeTitle(e.target.value)} required />
          <select value={newNodeType} onChange={e => setNewNodeType(e.target.value as NodeType)}>
            {Object.values(NodeType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={newNodeSize} onChange={e => setNewNodeSize(e.target.value as NodeSize)}>
            {Object.values(NodeSize).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={newTimeScale} onChange={e => setNewTimeScale(e.target.value as TimeScale)}>
            {Object.values(TimeScale).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {pendingParentNodeId && (
            <span style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
              子節點 of {nodes.find(n => n.id === pendingParentNodeId)?.title ?? pendingParentNodeId}
            </span>
          )}
          <button type="submit">新增</button>
          <button type="button" onClick={() => { setShowAddForm(false); setPendingParentNodeId(null) }}>取消</button>
        </form>
      )}

      {/* 主體：畫布 + 側邊面板 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <BlueprintCanvas
            blueprintId={blueprintId}
            onConnectionAttempt={handleConnectionAttempt}
            onEdgeClick={handleEdgeClick}
            onNodeRightClick={handleNodeRightClick}
            onEdgeRightClick={handleEdgeRightClick}
          />
        </div>
        {selectedNodeId && (
          <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
            <NodeInfoPanel nodeId={selectedNodeId} blueprintId={blueprintId} />
          </div>
        )}
      </div>

      {/* Edge Settings Modal */}
      {edgeModal && (
        <EdgeSettingsModal
          mode={edgeModal.mode}
          initialValues={edgeModalInitialValues}
          onConfirm={handleEdgeModalConfirm}
          onCancel={() => setEdgeModal(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu?.type === 'node' && (() => {
        const node = nodes.find(n => n.id === contextMenu.nodeId)
        if (!node) return null
        return (
          <NodeContextMenu
            nodeId={contextMenu.nodeId}
            nodeSize={node.size}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onAddChild={handleAddChild}
            onDelete={handleDeleteNode}
          />
        )
      })()}
      {contextMenu?.type === 'edge' && (
        <EdgeContextMenu
          edgeId={contextMenu.edgeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={handleEditEdge}
          onDelete={handleDeleteEdge}
        />
      )}
    </div>
  )
}
