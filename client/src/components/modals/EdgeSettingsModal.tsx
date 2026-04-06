import React, { useState } from 'react'
import { Direction, Magnitude } from '../../types'
import type { EdgeFormValues } from '../../commands'

interface Props {
  mode: 'create' | 'edit'
  /** edit 模式必須提供；create 模式可省略 */
  initialValues?: EdgeFormValues
  onConfirm: (values: EdgeFormValues) => void
  onCancel: () => void
}

const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.PROMOTES]: '促進',
  [Direction.INHIBITS]: '抑制',
  [Direction.NEUTRAL]: '中性',
}

const MAGNITUDE_LABELS: Record<Magnitude, string> = {
  [Magnitude.SMALL]: '低',
  [Magnitude.MEDIUM]: '中',
  [Magnitude.LARGE]: '高',
}

const DEFAULT_VALUES: EdgeFormValues = {
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
}

/**
 * Edge 設定 Modal — 建立或編輯連結的表單
 * 本身不呼叫 API，僅收集表單值後呼叫 onConfirm
 */
export function EdgeSettingsModal({ mode, initialValues, onConfirm, onCancel }: Props) {
  const [values, setValues] = useState<EdgeFormValues>(initialValues ?? DEFAULT_VALUES)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(values)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '320px' }}
      >
        <h3 style={{ margin: '0 0 16px' }}>{mode === 'create' ? '新增連結' : '編輯連結'}</h3>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="edge-direction">方向</label>
          <select
            id="edge-direction"
            aria-label="方向"
            value={values.direction}
            onChange={e => setValues(prev => ({ ...prev, direction: e.target.value as Direction }))}
            style={{ display: 'block', width: '100%', marginTop: '4px' }}
          >
            {Object.values(Direction).map(d => (
              <option key={d} value={d}>{DIRECTION_LABELS[d]}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="edge-magnitude">強度</label>
          <select
            id="edge-magnitude"
            aria-label="強度"
            value={values.magnitude}
            onChange={e => setValues(prev => ({ ...prev, magnitude: e.target.value as Magnitude }))}
            style={{ display: 'block', width: '100%', marginTop: '4px' }}
          >
            {Object.values(Magnitude).map(m => (
              <option key={m} value={m}>{MAGNITUDE_LABELS[m]}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="edge-reasoning">理由</label>
          <textarea
            id="edge-reasoning"
            aria-label="理由"
            value={values.reasoning}
            onChange={e => setValues(prev => ({ ...prev, reasoning: e.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: '4px', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel}>取消</button>
          <button type="submit">確認</button>
        </div>
      </form>
    </div>
  )
}
