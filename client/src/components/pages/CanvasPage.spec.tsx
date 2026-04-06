import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CanvasPage } from './CanvasPage'
import { useCanvasStore } from '../../stores/canvas.store'
import React from 'react'
import { Direction, Magnitude, NodeSize, NodeType, TimeScale } from '../../types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useParams: () => ({ blueprintId: 'bp-1' }),
  useNavigate: () => mockNavigate,
}))

// mock 捕獲 callback props，供測試直接呼叫模擬 ReactFlow 事件
let capturedCanvasCallbacks: {
  onConnectionAttempt?: (c: any) => void
  onEdgeClick?: (id: string) => void
  onNodeRightClick?: (id: string, x: number, y: number) => void
  onEdgeRightClick?: (id: string, x: number, y: number) => void
} = {}

vi.mock('../canvas/BlueprintCanvas', () => ({
  BlueprintCanvas: (props: any) => {
    capturedCanvasCallbacks = props
    return <div data-testid="blueprint-canvas">canvas-{props.blueprintId}</div>
  },
}))

vi.mock('../panels/NodeInfoPanel', () => ({
  NodeInfoPanel: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="node-info-panel">panel-{nodeId}</div>
  ),
}))

// mock ContextMenu 讓它直接渲染 children，避免 document.addEventListener 干擾
vi.mock('../menus/ContextMenu', () => ({
  ContextMenu: ({ children, onClose }: any) => (
    <div data-testid="context-menu">
      {children}
      <button data-testid="close-context-menu" onClick={onClose}>close</button>
    </div>
  ),
}))

const mockEdge = {
  id: 'e-1', blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
  theoryIds: [], direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM,
  reasoning: '', createdBy: 'user' as const,
}

const mockNode = {
  id: 'n-1', blueprintId: 'bp-1', type: NodeType.EVENT, size: NodeSize.LARGE,
  title: '節點A', status: 'ACTIVE' as any, timeScale: TimeScale.MEDIUM,
  weight: 0.5, createdBy: 'user' as const, theoryIds: [], description: '',
  parentNodeId: null, createdAt: '2026-01-01T00:00:00.000Z',
}

describe('CanvasPage', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [mockNode],
      edges: [mockEdge],
      selectedNodeId: null,
      isLoading: false,
    })
    capturedCanvasCallbacks = {}
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

  it('點擊「+ 新增節點」顯示表單', () => {
    render(<CanvasPage />)
    fireEvent.click(screen.getByText('+ 新增節點'))
    expect(screen.getByPlaceholderText('節點標題')).toBeDefined()
  })

  it('onConnectionAttempt 觸發後顯示 EdgeSettingsModal（create 模式）', () => {
    render(<CanvasPage />)
    // 模擬 ReactFlow 完成連線拖拽，需用 act 包裝以確保 React state 更新同步
    act(() => {
      capturedCanvasCallbacks.onConnectionAttempt?.({
        source: 'n-1', target: 'n-2', sourceHandle: null, targetHandle: null,
      })
    })
    // EdgeSettingsModal 應出現，標題為「新增連結」
    expect(screen.getByText('新增連結')).toBeDefined()
  })

  it('onEdgeClick 觸發後顯示 EdgeSettingsModal（edit 模式）', () => {
    render(<CanvasPage />)
    act(() => {
      capturedCanvasCallbacks.onEdgeClick?.('e-1')
    })
    expect(screen.getByText('編輯連結')).toBeDefined()
  })

  it('onNodeRightClick 觸發後顯示 NodeContextMenu', () => {
    render(<CanvasPage />)
    act(() => {
      capturedCanvasCallbacks.onNodeRightClick?.('n-1', 100, 200)
    })
    expect(screen.getByText('新增子節點')).toBeDefined()
    expect(screen.getByText('刪除節點')).toBeDefined()
  })

  it('onEdgeRightClick 觸發後顯示 EdgeContextMenu', () => {
    render(<CanvasPage />)
    act(() => {
      capturedCanvasCallbacks.onEdgeRightClick?.('e-1', 100, 200)
    })
    expect(screen.getByText('編輯連結')).toBeDefined()
    expect(screen.getByText('刪除連結')).toBeDefined()
  })

  it('NodeContextMenu「新增子節點」開啟表單並帶入 parentNodeId 提示', () => {
    render(<CanvasPage />)
    act(() => {
      capturedCanvasCallbacks.onNodeRightClick?.('n-1', 100, 200)
    })
    fireEvent.click(screen.getByText('新增子節點'))
    // 表單出現，且顯示父節點提示
    expect(screen.getByPlaceholderText('節點標題')).toBeDefined()
    expect(screen.getByText(/節點A/)).toBeDefined()
  })
})
