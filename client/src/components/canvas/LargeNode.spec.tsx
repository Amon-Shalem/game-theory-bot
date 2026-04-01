import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LargeNode } from './LargeNode'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../../types'
import type { NodeDto } from '../../types'
import React from 'react'

/**
 * LargeNode 使用 React Flow Handle，需要 mock @xyflow/react
 * 以避免在 jsdom 環境中因 SVG/DOM 限制而報錯
 */
vi.mock('@xyflow/react', () => ({
  Handle: ({ type, position }: any) => <div data-testid={`handle-${type}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

const baseNode: NodeDto = {
  id: 'n-1',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: '大節點標題',
  description: '',
  weight: 1.5,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('LargeNode', () => {
  it('顯示節點標題和類型', () => {
    render(<LargeNode data={baseNode} selected={false} id="n-1" type="large" />)
    expect(screen.getByText('大節點標題')).toBeDefined()
    expect(screen.getByText('EVENT')).toBeDefined()
  })

  it('顯示 weight 值', () => {
    render(<LargeNode data={baseNode} selected={false} id="n-1" type="large" />)
    expect(screen.getByText('weight: 1.50')).toBeDefined()
  })

  it('weight 為 0 時 opacity 下限為 0.3', () => {
    const zeroWeightNode = { ...baseNode, weight: 0 }
    const { container } = render(
      <LargeNode data={zeroWeightNode} selected={false} id="n-1" type="large" />
    )
    const rootDiv = container.firstElementChild as HTMLElement
    expect(rootDiv.style.opacity).toBe('0.3')
  })

  it('weight 為 10 時 opacity 上限為 1', () => {
    const highWeightNode = { ...baseNode, weight: 10 }
    const { container } = render(
      <LargeNode data={highWeightNode} selected={false} id="n-1" type="large" />
    )
    const rootDiv = container.firstElementChild as HTMLElement
    expect(rootDiv.style.opacity).toBe('1')
  })

  it('渲染 target 和 source handle', () => {
    render(<LargeNode data={baseNode} selected={false} id="n-1" type="large" />)
    expect(screen.getByTestId('handle-target')).toBeDefined()
    expect(screen.getByTestId('handle-source')).toBeDefined()
  })
})
