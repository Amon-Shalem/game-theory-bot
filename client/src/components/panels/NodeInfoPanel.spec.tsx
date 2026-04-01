import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeInfoPanel } from './NodeInfoPanel'
import { useCanvasStore } from '../../stores/canvas.store'
import { NodeType, NodeSize, NodeStatus, TimeScale, Direction, Magnitude } from '../../types'
import type { NodeDto, EdgeDto } from '../../types'
import React from 'react'

const mockNode: NodeDto = {
  id: 'n-1',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: '測試節點',
  description: '節點描述',
  weight: 1.5,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
}

const mockEdge: EdgeDto = {
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

describe('NodeInfoPanel', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [mockNode],
      edges: [mockEdge],
      selectedNodeId: 'n-1',
      isLoading: false,
    })
  })

  it('顯示節點基本資訊', () => {
    render(<NodeInfoPanel nodeId="n-1" blueprintId="bp-1" />)
    expect(screen.getByText('測試節點')).toBeDefined()
    expect(screen.getByText('EVENT')).toBeDefined()
    expect(screen.getByText('LARGE')).toBeDefined()
    expect(screen.getByText('ACTIVE')).toBeDefined()
    expect(screen.getByText('MEDIUM')).toBeDefined()
    expect(screen.getByText('1.50')).toBeDefined()
    expect(screen.getByText('user')).toBeDefined()
  })

  it('顯示描述文字', () => {
    render(<NodeInfoPanel nodeId="n-1" blueprintId="bp-1" />)
    expect(screen.getByText('節點描述')).toBeDefined()
  })

  it('顯示相關 edges 數量', () => {
    render(<NodeInfoPanel nodeId="n-1" blueprintId="bp-1" />)
    expect(screen.getByText(/相關連結（1）/)).toBeDefined()
  })

  it('source edge 顯示 → 方向', () => {
    render(<NodeInfoPanel nodeId="n-1" blueprintId="bp-1" />)
    expect(screen.getByText(/→.*PROMOTES.*MEDIUM/)).toBeDefined()
  })

  it('target edge 顯示 ← 方向', () => {
    const targetEdge: EdgeDto = { ...mockEdge, id: 'e-2', sourceNodeId: 'n-3', targetNodeId: 'n-1' }
    useCanvasStore.setState({ edges: [targetEdge] })
    render(<NodeInfoPanel nodeId="n-1" blueprintId="bp-1" />)
    expect(screen.getByText(/←.*PROMOTES.*MEDIUM/)).toBeDefined()
  })

  it('節點不存在時不渲染內容', () => {
    const { container } = render(<NodeInfoPanel nodeId="nonexistent" blueprintId="bp-1" />)
    expect(container.innerHTML).toBe('')
  })

  it('點擊 X 按鈕將 selectedNodeId 設為 null', () => {
    useCanvasStore.setState({ selectedNodeId: 'n-1' })
    render(<NodeInfoPanel nodeId="n-1" blueprintId="bp-1" />)
    fireEvent.click(screen.getByText('X'))
    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })
})
