import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmallNode } from './SmallNode'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../../types'
import type { NodeDto } from '../../types'
import React from 'react'

vi.mock('@xyflow/react', () => ({
  Handle: ({ type }: any) => <div data-testid={`handle-${type}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
}))

const baseNode: NodeDto = {
  id: 'n-s1',
  blueprintId: 'bp-1',
  type: NodeType.ACTOR,
  size: NodeSize.SMALL,
  status: NodeStatus.ACTIVE,
  title: '小節點標題',
  description: '',
  weight: 2.0,
  timeScale: TimeScale.SHORT,
  createdBy: 'user',
  parentNodeId: 'n-1',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('SmallNode', () => {
  it('顯示節點標題和類型', () => {
    render(<SmallNode data={baseNode} selected={false} id="n-s1" type="small" />)
    expect(screen.getByText('小節點標題')).toBeDefined()
    expect(screen.getByText('ACTOR')).toBeDefined()
  })

  it('weight 驅動 opacity（weight=2 -> opacity=0.67）', () => {
    const { container } = render(
      <SmallNode data={baseNode} selected={false} id="n-s1" type="small" />
    )
    const rootDiv = container.firstElementChild as HTMLElement
    // weight / 3.0 = 2 / 3 ≈ 0.667
    const opacity = parseFloat(rootDiv.style.opacity)
    expect(opacity).toBeGreaterThan(0.6)
    expect(opacity).toBeLessThan(0.7)
  })

  it('渲染 target 和 source handle', () => {
    render(<SmallNode data={baseNode} selected={false} id="n-s1" type="small" />)
    expect(screen.getByTestId('handle-target')).toBeDefined()
    expect(screen.getByTestId('handle-source')).toBeDefined()
  })
})
