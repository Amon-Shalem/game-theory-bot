import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SmallNode } from './SmallNode'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../../types'
import type { NodeDto } from '../../types'
import React from 'react'

// NodeProps requires many React Flow internal fields; cast for test rendering
const TestSmallNode = SmallNode as unknown as React.ComponentType<{ id: string; data: NodeDto; selected: boolean; type: string }>

vi.mock('@xyflow/react', () => ({
  Handle: ({ type }: any) => <div data-testid={`handle-${type}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
  /** useStore mock：回傳空 edges，使 isConnectable 永遠為 true（handle 可連線） */
  useStore: (selector: (s: { edges: unknown[] }) => unknown) => selector({ edges: [] }),
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
  positionX: null,
  positionY: null,
}

describe('SmallNode', () => {
  it('顯示節點標題和類型', () => {
    render(<TestSmallNode data={baseNode} selected={false} id="n-s1" type="small" />)
    expect(screen.getByText('小節點標題')).toBeDefined()
    expect(screen.getByText('ACTOR')).toBeDefined()
  })

  it('weight 驅動 opacity（weight=2 -> opacity=1.0）', () => {
    const { container } = render(
      <TestSmallNode data={baseNode} selected={false} id="n-s1" type="small" />
    )
    const rootDiv = container.firstElementChild as HTMLElement
    // weight >= 2.0 → opacity = 1.0（依 getWeightVisual 規格）
    const opacity = parseFloat(rootDiv.style.opacity)
    expect(opacity).toBe(1.0)
  })

  it('渲染 target 和 source handle', () => {
    render(<TestSmallNode data={baseNode} selected={false} id="n-s1" type="small" />)
    expect(screen.getByTestId('handle-target')).toBeDefined()
    expect(screen.getByTestId('handle-source')).toBeDefined()
  })
})
