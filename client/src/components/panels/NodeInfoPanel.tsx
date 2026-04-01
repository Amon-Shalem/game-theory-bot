import React from 'react'
import { useCanvasStore } from '../../stores/canvas.store'
import { useHistoryStore } from '../../stores/history.store'
import { RemoveNodeCommand } from '../../commands'

interface Props {
  nodeId: string
  blueprintId: string
}

/** 點擊節點後顯示的側邊資訊面板（Plan 2 會加入 AI 功能） */
export function NodeInfoPanel({ nodeId, blueprintId }: Props) {
  const { nodes, edges, selectNode } = useCanvasStore()
  const node = nodes.find(n => n.id === nodeId)
  const nodeEdges = edges.filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId)

  if (!node) return null

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{node.title}</h3>
        <button onClick={() => selectNode(null)}>X</button>
      </div>
      <p><strong>類型：</strong>{node.type}</p>
      <p><strong>大小：</strong>{node.size}</p>
      <p><strong>狀態：</strong>{node.status}</p>
      <p><strong>時間尺度：</strong>{node.timeScale}</p>
      <p><strong>Weight：</strong>{node.weight.toFixed(2)}</p>
      <p><strong>建立者：</strong>{node.createdBy}</p>
      {node.description && <p><strong>描述：</strong>{node.description}</p>}

      <hr />
      <h4>相關連結（{nodeEdges.length}）</h4>
      {nodeEdges.map(e => (
        <div key={e.id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #eee' }}>
          {e.sourceNodeId === nodeId ? '→' : '←'} {e.direction} / {e.magnitude}
        </div>
      ))}

      <hr />
      <button
        onClick={async () => {
          const { executeCommand } = useHistoryStore.getState()
          const success = await executeCommand(new RemoveNodeCommand(nodeId))
          // 只在刪除成功時才關閉面板
          if (success) selectNode(null)
        }}
        style={{ color: 'red' }}
      >
        刪除此節點
      </button>
    </div>
  )
}
