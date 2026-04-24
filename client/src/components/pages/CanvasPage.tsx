import React, { useState, useEffect, useCallback } from 'react'
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
  MoveNodesCommand,
} from '../../commands'
import type { EdgeFormValues, NodeMoveItem } from '../../commands'
import type { Connection } from '@xyflow/react'
import { NodeType, NodeSize, TimeScale, ModelTier } from '../../types'
import type { AIModelDto } from '../../types'
import { AIModelService } from '../../services/ai-model.service'
import { AIService } from '../../services/ai.service'
import { ReviewService } from '../../services/review.service'
import { getSettings, saveSettings } from '../../services/settings.service'
import type { ExpandedNodeSuggestion, EdgeSuggestion } from '../../types'

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
  const { nodes, selectedNodeId, displayMode, setDisplayMode } = useCanvasStore()
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

  // 位置儲存錯誤狀態
  const [positionSaveError, setPositionSaveError] = useState<string | null>(null)

  // AI 模型選擇
  const [models, setModels] = useState<AIModelDto[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>(() => getSettings().modelId ?? '')
  const [isSyncing, setIsSyncing] = useState(false)

  // AI 展開節點
  const [aiExpandNodeId, setAiExpandNodeId] = useState<string | null>(null)
  const [aiExpandSuggestions, setAiExpandSuggestions] = useState<ExpandedNodeSuggestion[]>([])
  const [isAIExpanding, setIsAIExpanding] = useState(false)

  // AI 建議連結
  const [aiEdgeNodeId, setAiEdgeNodeId] = useState<string | null>(null)
  const [aiEdgeSuggestions, setAiEdgeSuggestions] = useState<EdgeSuggestion[]>([])
  const [isAISuggesting, setIsAISuggesting] = useState(false)

  // 回顧狀態
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewStatusMsg, setReviewStatusMsg] = useState<string | null>(null)

  // 藍圖切換時清空歷史
  useEffect(() => {
    clearHistory()
  }, [blueprintId, clearHistory])

  // 載入已同步的模型清單
  useEffect(() => {
    AIModelService.findAll().then(setModels).catch(() => {})
  }, [])

  /** 從 OpenRouter 同步模型，並更新設定中的 selectedModelId */
  const handleSyncModels = useCallback(async () => {
    const settings = getSettings()
    if (!settings.openRouterUrl || !settings.openRouterSecret) {
      alert('請先在設定頁面填寫 OpenRouter URL 與 Secret')
      return
    }
    setIsSyncing(true)
    try {
      const synced = await AIModelService.sync(settings.openRouterUrl, settings.openRouterSecret)
      setModels(synced)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  /** 選擇模型時同步寫入 localStorage */
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    saveSettings({ ...getSettings(), modelId })
  }, [])

  /** AI 展開大節點為子節點建議 */
  const handleAIExpand = useCallback(async (nodeId: string) => {
    const modelId = selectedModelId || getSettings().modelId
    if (!modelId) { alert('請先在工具列選擇 AI 模型，或在 Settings 頁面設定 Model ID'); return }
    setAiExpandNodeId(nodeId)
    setAiExpandSuggestions([])
    setIsAIExpanding(true)
    try {
      const suggestions = await AIService.expandNode(nodeId, { modelId })
      setAiExpandSuggestions(suggestions)
    } catch {
      alert('AI 展開失敗，請稍後再試')
      setAiExpandNodeId(null)
    } finally {
      setIsAIExpanding(false)
    }
  }, [selectedModelId])

  /** 將 AI 建議的子節點加入畫布 */
  const handleAddSuggestedNode = useCallback(async (suggestion: ExpandedNodeSuggestion) => {
    if (!aiExpandNodeId || !blueprintId) return
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new AddNodeCommand({
      blueprintId,
      type: suggestion.type,
      size: NodeSize.SMALL,
      title: suggestion.title,
      timeScale: suggestion.timeScale,
      parentNodeId: aiExpandNodeId,
    }))
  }, [aiExpandNodeId, blueprintId])

  /** AI 建議節點間的因果連結 */
  const handleAISuggestEdges = useCallback(async (nodeId: string) => {
    const modelId = selectedModelId || getSettings().modelId
    if (!modelId) { alert('請先在工具列選擇 AI 模型，或在 Settings 頁面設定 Model ID'); return }
    setAiEdgeNodeId(nodeId)
    setAiEdgeSuggestions([])
    setIsAISuggesting(true)
    try {
      const suggestions = await AIService.suggestEdges(nodeId, { modelId })
      setAiEdgeSuggestions(suggestions)
    } catch {
      alert('AI 建議連結失敗，請稍後再試')
      setAiEdgeNodeId(null)
    } finally {
      setIsAISuggesting(false)
    }
  }, [selectedModelId])

  /** 將 AI 建議的 Edge 加入畫布 */
  const handleAddSuggestedEdge = useCallback(async (suggestion: EdgeSuggestion) => {
    if (!aiEdgeNodeId || !blueprintId) return
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new AddEdgeCommand({
      blueprintId,
      sourceNodeId: aiEdgeNodeId,
      targetNodeId: suggestion.targetNodeId,
      direction: suggestion.direction,
      magnitude: suggestion.magnitude,
      reasoning: suggestion.reasoning,
      theoryIds: [],
    }))
  }, [aiEdgeNodeId, blueprintId])

  /** 手動觸發 AI 回顧，非同步輪詢任務狀態 */
  const handleTriggerReview = useCallback(async () => {
    if (!blueprintId) return
    setIsReviewing(true)
    setReviewStatusMsg('觸發中...')
    try {
      const job = await ReviewService.trigger(blueprintId, { modelId: selectedModelId || undefined })
      setReviewStatusMsg(`回顧中 (${job.jobId.slice(0, 8)}…)`)

      const interval = setInterval(async () => {
        const status = await ReviewService.getJobStatus(job.jobId).catch(() => null)
        if (!status || status.status === 'DONE') {
          clearInterval(interval)
          setIsReviewing(false)
          setReviewStatusMsg('回顧完成')
          setTimeout(() => setReviewStatusMsg(null), 3000)
        } else if (status.status === 'FAILED') {
          clearInterval(interval)
          setIsReviewing(false)
          setReviewStatusMsg(`回顧失敗：${status.error ?? '未知錯誤'}`)
          setTimeout(() => setReviewStatusMsg(null), 5000)
        }
      }, 3000)
    } catch {
      setIsReviewing(false)
      setReviewStatusMsg('觸發失敗')
      setTimeout(() => setReviewStatusMsg(null), 3000)
    }
  }, [blueprintId, selectedModelId])

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
        theoryIds: values.theoryIds,
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

  /**
   * 節點拖拽結束後建立 MoveNodesCommand 並執行（支援 undo/redo）
   * @param items - 每個被拖拽節點的新舊位置資訊
   *
   * 注意：executeCommand 內部已 catch 所有例外並回傳 false，
   * 因此這裡改為檢查回傳的布林值，而非使用 try/catch。
   */
  const handleNodeDragStop = useCallback(async (items: NodeMoveItem[]) => {
    const { executeCommand } = useHistoryStore.getState()
    const succeeded = await executeCommand(new MoveNodesCommand(items))
    if (!succeeded) {
      setPositionSaveError('節點位置儲存失敗，請稍後再試')
      setTimeout(() => setPositionSaveError(null), 3000)
    }
  }, [])

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
    return { direction: edge.direction, magnitude: edge.magnitude, reasoning: edge.reasoning, theoryIds: edge.theoryIds }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }} onContextMenu={e => e.preventDefault()}>
      {/* 工具列 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>← 返回列表</button>
        <button onClick={() => { setPendingParentNodeId(null); setShowAddForm(!showAddForm) }}>+ 新增節點</button>
        <button onClick={() => undo()} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">Undo</button>
        <button onClick={() => redo()} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">Redo</button>
        <button
          onClick={() => setDisplayMode(displayMode === 'all' ? 'high-weight' : 'all')}
          title={displayMode === 'all' ? '切換為僅顯示高 weight 節點' : '切換為顯示全部節點'}
          style={{ background: displayMode === 'high-weight' ? '#1677ff' : undefined, color: displayMode === 'high-weight' ? '#fff' : undefined }}
        >
          {displayMode === 'all' ? '全部節點' : '高 Weight'}
        </button>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedModelId}
            onChange={e => handleModelChange(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="">-- 選擇模型 --</option>
            {models.some(m => m.tier === ModelTier.TOP) && (
              <optgroup label="付費模型">
                {models.filter(m => m.tier === ModelTier.TOP).map(m => (
                  <option key={m.id} value={m.modelId}>{m.displayName}</option>
                ))}
              </optgroup>
            )}
            {models.some(m => m.tier === ModelTier.FREE) && (
              <optgroup label="免費模型">
                {models.filter(m => m.tier === ModelTier.FREE).map(m => (
                  <option key={m.id} value={m.modelId}>{m.displayName}</option>
                ))}
              </optgroup>
            )}
          </select>
          <button onClick={handleSyncModels} disabled={isSyncing}>
            {isSyncing ? '同步中...' : '更新模型清單'}
          </button>
          <button onClick={handleTriggerReview} disabled={isReviewing} title="觸發 AI 回顧（評估所有節點預測有效性）">
            {reviewStatusMsg ?? '觸發回顧'}
          </button>
          <button onClick={() => navigate(`/canvas/${blueprintId}/review`)}>回顧歷史</button>
        </span>
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
            onNodeDragStop={handleNodeDragStop}
          />
        </div>
        {selectedNodeId && (
          <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
            <NodeInfoPanel nodeId={selectedNodeId} blueprintId={blueprintId} />
          </div>
        )}
      </div>

      {/* 位置儲存失敗通知 */}
      {positionSaveError && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          background: '#ff4d4f',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {positionSaveError}
        </div>
      )}

      {/* AI 展開建議面板 */}
      {(isAIExpanding || aiExpandSuggestions.length > 0) && aiExpandNodeId && (
        <div style={{
          position: 'fixed', top: '60px', right: '20px', width: '280px',
          background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
          padding: '16px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong>AI 展開建議</strong>
            <button onClick={() => { setAiExpandNodeId(null); setAiExpandSuggestions([]) }}>✕</button>
          </div>
          {isAIExpanding && <p style={{ color: '#888' }}>AI 分析中...</p>}
          {aiExpandSuggestions.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '13px' }}>{s.title} <span style={{ color: '#888', fontSize: '11px' }}>({s.type})</span></span>
              <button style={{ fontSize: '12px' }} onClick={() => handleAddSuggestedNode(s)}>+ 加入</button>
            </div>
          ))}
        </div>
      )}

      {/* AI 建議連結面板 */}
      {(isAISuggesting || aiEdgeSuggestions.length > 0) && aiEdgeNodeId && (
        <div style={{
          position: 'fixed', top: '60px', right: '320px', width: '280px',
          background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
          padding: '16px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong>AI 建議連結</strong>
            <button onClick={() => { setAiEdgeNodeId(null); setAiEdgeSuggestions([]) }}>✕</button>
          </div>
          {isAISuggesting && <p style={{ color: '#888' }}>AI 分析中...</p>}
          {aiEdgeSuggestions.map((s, i) => (
            <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>→ {s.targetNodeId.slice(0, 8)}… ({s.direction})</span>
                <button style={{ fontSize: '12px' }} onClick={() => handleAddSuggestedEdge(s)}>+ 加入</button>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#555' }}>{s.reasoning}</p>
            </div>
          ))}
        </div>
      )}

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
            onAIExpand={handleAIExpand}
            onAISuggestEdges={handleAISuggestEdges}
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
