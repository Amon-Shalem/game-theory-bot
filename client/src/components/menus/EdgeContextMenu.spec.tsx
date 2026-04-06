import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EdgeContextMenu } from './EdgeContextMenu'
import React from 'react'

vi.mock('./ContextMenu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="context-menu">{children}</div>
  ),
}))

describe('EdgeContextMenu', () => {
  const props = {
    edgeId: 'e-1',
    x: 200,
    y: 200,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('渲染「編輯連結」和「刪除連結」按鈕', () => {
    render(<EdgeContextMenu {...props} />)
    expect(screen.getByText('編輯連結')).toBeDefined()
    expect(screen.getByText('刪除連結')).toBeDefined()
  })

  it('點擊「編輯連結」呼叫 onEdit 並關閉', () => {
    render(<EdgeContextMenu {...props} />)
    fireEvent.click(screen.getByText('編輯連結'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onEdit).toHaveBeenCalledWith('e-1')
  })

  it('點擊「刪除連結」呼叫 onDelete 並關閉', () => {
    render(<EdgeContextMenu {...props} />)
    fireEvent.click(screen.getByText('刪除連結'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onDelete).toHaveBeenCalledWith('e-1')
  })
})
