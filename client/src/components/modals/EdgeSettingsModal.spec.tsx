import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EdgeSettingsModal } from './EdgeSettingsModal'
import { Direction, Magnitude } from '../../types'
import type { EdgeFormValues } from '../../commands'
import React from 'react'

describe('EdgeSettingsModal', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

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

  it('submit 呼叫 onConfirm 帶正確值', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    const dirSelect = screen.getByLabelText('方向')
    fireEvent.change(dirSelect, { target: { value: Direction.NEUTRAL } })
    fireEvent.click(screen.getByText('確認'))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ direction: Direction.NEUTRAL })
    )
  })

  it('取消按鈕呼叫 onCancel', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })
})
