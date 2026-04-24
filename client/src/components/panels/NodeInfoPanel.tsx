import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '../../stores/canvas.store'
import { useHistoryStore } from '../../stores/history.store'
import { RemoveNodeCommand } from '../../commands'
import { ReviewService } from '../../services/review.service'
import type { ReviewRecordDto } from '../../types'
import { ReviewVerdict } from '../../types'

interface Props {
  nodeId: string
  blueprintId: string
}

const VERDICT_LABEL: Record<ReviewVerdict, string> = {
  [ReviewVerdict.CONFIRMED]: '確認',
  [ReviewVerdict.REFUTED]: '反駁',
  [ReviewVerdict.PENDING]: '待定',
}

const VERDICT_COLOR: Record<ReviewVerdict, string> = {
  [ReviewVerdict.CONFIRMED]: '#52c41a',
  [ReviewVerdict.REFUTED]: '#ff4d4f',
  [ReviewVerdict.PENDING]: '#faad14',
}

/** 點擊節點後顯示的側邊資訊面板 */
export function NodeInfoPanel({ nodeId, blueprintId }: Props) {
  const { nodes, edges, selectNode } = useCanvasStore()
  const node = nodes.find(n => n.id === nodeId)
  const nodeEdges = edges.filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId)

  const [reviews, setReviews] = useState<ReviewRecordDto[]>([])

  useEffect(() => {
    ReviewService.getRecords(blueprintId)
      .then(records => setReviews(records.filter(r => r.nodeId === nodeId)))
      .catch(() => {})
  }, [blueprintId, nodeId])

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
      <h4>回顧歷史（{reviews.length}）</h4>
      {reviews.length === 0 && <p style={{ fontSize: '12px', color: '#aaa' }}>尚無回顧紀錄</p>}
      {reviews.slice(0, 5).map(r => {
        const verdict = r.verdict as ReviewVerdict
        const delta = r.weightAfter - r.weightBefore
        return (
          <div key={r.id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: VERDICT_COLOR[verdict], fontWeight: 600, marginRight: '6px' }}>
              {VERDICT_LABEL[verdict]}
            </span>
            <span style={{ color: '#888' }}>{new Date(r.reviewedAt).toLocaleDateString('zh-TW')}</span>
            <span style={{ marginLeft: '8px', color: delta >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
            </span>
          </div>
        )
      })}

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
