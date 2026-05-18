import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReviewService } from '../../services/review.service'
import type { ReviewRecordDto } from '../../types'
import { ReviewVerdict } from '../../types'

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

/** 回顧歷史頁面 — 顯示指定藍圖所有節點的 AI 評估紀錄 */
export function ReviewHistoryPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>()
  const navigate = useNavigate()
  const [records, setRecords] = useState<ReviewRecordDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!blueprintId) return
    ReviewService.getRecords(blueprintId)
      .then(setRecords)
      .catch(err => setError((err as Error).message ?? '載入失敗'))
      .finally(() => setLoading(false))
  }, [blueprintId])

  if (!blueprintId) return <div>找不到藍圖</div>

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate(`/canvas/${blueprintId}`)}>← 返回畫布</button>
        <h2 style={{ margin: 0 }}>回顧歷史</h2>
      </div>

      {loading && <p>載入中...</p>}
      {error && <p style={{ color: '#ff4d4f' }}>{error}</p>}

      {!loading && !error && records.length === 0 && (
        <p style={{ color: '#888' }}>尚無回顧紀錄。請在畫布工具列點擊「觸發回顧」開始評估。</p>
      )}

      {records.map(record => (
        <RecordCard key={record.id} record={record} blueprintId={blueprintId} />
      ))}
    </div>
  )
}

function RecordCard({ record, blueprintId }: { record: ReviewRecordDto; blueprintId: string }) {
  const navigate = useNavigate()
  const verdict = record.verdict as ReviewVerdict
  const weightDelta = record.weightAfter - record.weightBefore
  const reviewedAt = new Date(record.reviewedAt).toLocaleString('zh-TW')

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            background: VERDICT_COLOR[verdict],
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            marginRight: '8px',
          }}>
            {VERDICT_LABEL[verdict]}
          </span>
          <span style={{ fontSize: '12px', color: '#888' }}>{reviewedAt}</span>
        </div>
        <button
          style={{ fontSize: '12px' }}
          onClick={() => navigate(`/canvas/${blueprintId}?highlight=${record.nodeId}`)}
        >
          在畫布中檢視
        </button>
      </div>

      <p style={{ margin: '8px 0 4px', fontSize: '14px' }}>{record.evidenceSummary}</p>

      <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '16px' }}>
        <span>節點 ID：{record.nodeId.slice(0, 8)}…</span>
        <span>
          weight：{record.weightBefore.toFixed(2)} →{' '}
          <strong style={{ color: weightDelta >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {record.weightAfter.toFixed(2)}
          </strong>
          {' '}({weightDelta >= 0 ? '+' : ''}{weightDelta.toFixed(2)})
        </span>
      </div>
    </div>
  )
}
