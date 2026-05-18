import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediumNode } from './MediumNode'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../../types'
import type { NodeDto } from '../../types'
import React from 'react'

// NodeProps requires many React Flow internal fields; cast for test rendering
const TestMediumNode = MediumNode as unknown as React.ComponentType<{ id: string; data: NodeDto; selected: boolean; type: string }>

vi.mock('@xyflow/react', () => ({
  Handle: ({ type }: any) => <div data-testid={`handle-${type}`} />,
  Position: { Top: 'top', Bottom: 'bottom' },
  /** useStore mock：回傳空 edges，使 isConnectable 永遠為 true（handle 可連線） */
  useStore: (selector: (s: { edges: unknown[] }) => unknown) => selector({ edges: [] }),
}))

const baseNode: NodeDto = {
  id: 'n-m1',
  blueprintId: 'bp-1',
  type: NodeType.ACTOR,
  size: NodeSize.MEDIUM,
  status: NodeStatus.ACTIVE,
  title: '中節點標題',
  description: '',
  weight: 1.5,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
  positionX: null,
  positionY: null,
}

describe('MediumNode', () => {
  it('顯示節點標題和類型', () => {
    render(<TestMediumNode data={baseNode} selected={false} id="n-m1" type="medium" />)
    expect(screen.getByText('中節點標題')).toBeDefined()
    expect(screen.getByText('ACTOR')).toBeDefined()
  })

  it('顯示 weight 值', () => {
    render(<TestMediumNode data={baseNode} selected={false} id="n-m1" type="medium" />)
    expect(screen.getByText('weight: 1.50')).toBeDefined()
  })

  it('渲染 target 和 source handle', () => {
    render(<TestMediumNode data={baseNode} selected={false} id="n-m1" type="medium" />)
    expect(screen.getByTestId('handle-target')).toBeDefined()
    expect(screen.getByTestId('handle-source')).toBeDefined()
  })
})
