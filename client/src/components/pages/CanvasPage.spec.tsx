import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanvasPage } from './CanvasPage'
import { useCanvasStore } from '../../stores/canvas.store'
import React from 'react'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useParams: () => ({ blueprintId: 'bp-1' }),
  useNavigate: () => mockNavigate,
}))

// Mock BlueprintCanvas（內含 ReactFlow 不適合在 jsdom 中完整渲染）
vi.mock('../canvas/BlueprintCanvas', () => ({
  BlueprintCanvas: ({ blueprintId }: { blueprintId: string }) => (
    <div data-testid="blueprint-canvas">canvas-{blueprintId}</div>
  ),
}))

// Mock NodeInfoPanel
vi.mock('../panels/NodeInfoPanel', () => ({
  NodeInfoPanel: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="node-info-panel">panel-{nodeId}</div>
  ),
}))

describe('CanvasPage', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isLoading: false,
    })
    mockNavigate.mockClear()
  })

  it('渲染 BlueprintCanvas 元件', () => {
    render(<CanvasPage />)
    expect(screen.getByTestId('blueprint-canvas')).toBeDefined()
    expect(screen.getByText('canvas-bp-1')).toBeDefined()
  })

  it('無選取節點時不渲染 NodeInfoPanel', () => {
    render(<CanvasPage />)
    expect(screen.queryByTestId('node-info-panel')).toBeNull()
  })

  it('有選取節點時渲染 NodeInfoPanel', () => {
    useCanvasStore.setState({ selectedNodeId: 'n-1' })
    render(<CanvasPage />)
    expect(screen.getByTestId('node-info-panel')).toBeDefined()
    expect(screen.getByText('panel-n-1')).toBeDefined()
  })

  it('顯示返回列表與新增節點按鈕', () => {
    render(<CanvasPage />)
    expect(screen.getByText('← 返回列表')).toBeDefined()
    expect(screen.getByText('+ 新增節點')).toBeDefined()
  })
})
