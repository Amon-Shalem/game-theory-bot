import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeContextMenu } from './NodeContextMenu'
import { NodeSize } from '../../types'
import React from 'react'

// Mock ContextMenu 簡化測試
vi.mock('./ContextMenu', () => ({
  ContextMenu: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="context-menu">
      {children}
      <button data-testid="close" onClick={onClose}>close</button>
    </div>
  ),
}))

describe('NodeContextMenu', () => {
  const baseProps = {
    nodeId: 'n-1',
    nodeSize: NodeSize.LARGE,
    x: 100,
    y: 100,
    onClose: vi.fn(),
    onAddChild: vi.fn(),
    onDelete: vi.fn(),
  }

  it('渲染「新增子節點」和「刪除節點」按鈕', () => {
    render(<NodeContextMenu {...baseProps} />)
    expect(screen.getByText('新增子節點')).toBeDefined()
    expect(screen.getByText('刪除節點')).toBeDefined()
  })

  it('nodeSize 為 LARGE 時顯示「AI 展開」（disabled）', () => {
    render(<NodeContextMenu {...baseProps} nodeSize={NodeSize.LARGE} />)
    const aiBtn = screen.getByText('AI 展開') as HTMLButtonElement
    expect(aiBtn.disabled).toBe(true)
  })

  it('nodeSize 為 SMALL 時不顯示「AI 展開」', () => {
    render(<NodeContextMenu {...baseProps} nodeSize={NodeSize.SMALL} />)
    expect(screen.queryByText('AI 展開')).toBeNull()
  })

  it('點擊「新增子節點」呼叫 onAddChild 並關閉', () => {
    render(<NodeContextMenu {...baseProps} />)
    fireEvent.click(screen.getByText('新增子節點'))
    expect(baseProps.onClose).toHaveBeenCalled()
    expect(baseProps.onAddChild).toHaveBeenCalledWith('n-1')
  })

  it('點擊「刪除節點」呼叫 onDelete', () => {
    render(<NodeContextMenu {...baseProps} />)
    fireEvent.click(screen.getByText('刪除節點'))
    expect(baseProps.onDelete).toHaveBeenCalledWith('n-1')
  })
})
