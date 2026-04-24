import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EdgeSettingsModal } from './EdgeSettingsModal'
import { Direction, Magnitude } from '../../types'
import type { EdgeFormValues } from '../../commands'
import React from 'react'

vi.mock('../../services/theory.service', () => ({
  TheoryService: {
    findAll: vi.fn().mockResolvedValue([
      { id: 't-1', name: '攻勢現實主義', promptFragment: '...', isPreset: true, tags: [], createdAt: '' },
    ]),
  },
}))

describe('EdgeSettingsModal', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('create 模式以預設值渲染', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByText('新增連結')).toBeDefined()
    const dirSelect = screen.getByLabelText('方向') as HTMLSelectElement
    expect(dirSelect.value).toBe(Direction.PROMOTES)
    const magSelect = screen.getByLabelText('強度') as HTMLSelectElement
    expect(magSelect.value).toBe(Magnitude.MEDIUM)
  })

  it('edit 模式帶入 initialValues', () => {
    const initialValues: EdgeFormValues = {
      direction: Direction.INHIBITS,
      magnitude: Magnitude.LARGE,
      reasoning: '測試理由',
      theoryIds: [],
    }
    render(
      <EdgeSettingsModal
        mode="edit"
        initialValues={initialValues}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText('編輯連結')).toBeDefined()
    const dirSelect = screen.getByLabelText('方向') as HTMLSelectElement
    expect(dirSelect.value).toBe(Direction.INHIBITS)
    const reasoningInput = screen.getByLabelText('理由') as HTMLTextAreaElement
    expect(reasoningInput.value).toBe('測試理由')
  })

  it('submit 呼叫 onConfirm 帶正確值（含 theoryIds）', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    const dirSelect = screen.getByLabelText('方向')
    fireEvent.change(dirSelect, { target: { value: Direction.NEUTRAL } })
    fireEvent.click(screen.getByText('確認'))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ direction: Direction.NEUTRAL, theoryIds: [] })
    )
  })

  it('取消按鈕呼叫 onCancel', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('載入後顯示理論 checkbox，勾選後反映在 onConfirm', async () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    await waitFor(() => expect(screen.getByText('攻勢現實主義')).toBeDefined())
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('確認'))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ theoryIds: ['t-1'] })
    )
  })
})
