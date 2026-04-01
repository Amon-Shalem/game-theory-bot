import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BlueprintCanvas } from '../canvas/BlueprintCanvas'
import { NodeInfoPanel } from '../panels/NodeInfoPanel'
import { useCanvasStore } from '../../stores/canvas.store'
import { NodeType, NodeSize, TimeScale } from '../../types'

/** 畫布主頁面 — 包含工具列、React Flow 畫布、節點資訊面板 */
export function CanvasPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>()
  const navigate = useNavigate()
  const { selectedNodeId, addNode } = useCanvasStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.EVENT)
  const [newNodeSize, setNewNodeSize] = useState<NodeSize>(NodeSize.LARGE)
  const [newTimeScale, setNewTimeScale] = useState<TimeScale>(TimeScale.MEDIUM)

  if (!blueprintId) return <div>找不到藍圖</div>

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNodeTitle.trim()) return
    await addNode({
      blueprintId,
      type: newNodeType,
      size: newNodeSize,
      title: newNodeTitle.trim(),
      timeScale: newTimeScale,
    })
    setNewNodeTitle('')
    setShowAddForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 工具列 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>← 返回列表</button>
        <button onClick={() => setShowAddForm(!showAddForm)}>+ 新增節點</button>
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
          <button type="submit">新增</button>
          <button type="button" onClick={() => setShowAddForm(false)}>取消</button>
        </form>
      )}

      {/* 主體：畫布 + 側邊面板 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <BlueprintCanvas blueprintId={blueprintId} />
        </div>
        {selectedNodeId && (
          <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
            <NodeInfoPanel nodeId={selectedNodeId} blueprintId={blueprintId} />
          </div>
        )}
      </div>
    </div>
  )
}
