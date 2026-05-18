import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { CausalEdge } from './CausalEdge'
import { Direction, Magnitude } from '../../types'
import type { EdgeDto } from '../../types'
import React from 'react'
import type { EdgeProps } from '@xyflow/react'

// EdgeProps requires many React Flow internal fields; cast for test rendering
const TestCausalEdge = CausalEdge as React.ComponentType<Partial<EdgeProps> & { id: string; data?: Record<string, unknown> }>

vi.mock('@xyflow/react', () => ({
  getBezierPath: () => ['M 0 0 C 50 50 100 100 150 150'],
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}))

const baseEdge: EdgeDto = {
  id: 'e-1',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

const baseProps = {
  id: 'e-1',
  sourceX: 0, sourceY: 0,
  targetX: 100, targetY: 100,
  sourcePosition: 'bottom' as any,
  targetPosition: 'top' as any,
  source: 'n-1',
  target: 'n-2',
}

describe('CausalEdge', () => {
  it('PROMOTES 方向使用綠色', () => {
    const { container } = render(
      <svg>
        <TestCausalEdge {...baseProps} data={baseEdge as unknown as Record<string, unknown>} />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#27AE60')
  })

  it('INHIBITS 方向使用紅色', () => {
    const inhibitEdge = { ...baseEdge, direction: Direction.INHIBITS }
    const { container } = render(
      <svg>
        <TestCausalEdge {...baseProps} data={inhibitEdge as unknown as Record<string, unknown>} />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#E74C3C')
  })

  it('NEUTRAL 方向使用灰色', () => {
    const neutralEdge = { ...baseEdge, direction: Direction.NEUTRAL }
    const { container } = render(
      <svg>
        <TestCausalEdge {...baseProps} data={neutralEdge as unknown as Record<string, unknown>} />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#95A5A6')
  })

  it('無 data 時 fallback 為灰色', () => {
    const { container } = render(
      <svg>
        <TestCausalEdge {...baseProps} data={undefined} />
      </svg>
    )
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#95A5A6')
  })
})
