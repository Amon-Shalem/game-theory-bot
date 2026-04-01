import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCanvasStore } from './canvas.store'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'
import { NodeType, NodeSize, NodeStatus, TimeScale, Direction, Magnitude } from '../types'
import type { NodeDto, EdgeDto } from '../types'

vi.mock('../services/node.service')
vi.mock('../services/edge.service')

const mockNode: NodeDto = {
  id: 'n-1',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: '節點一',
  description: '',
  weight: 1.0,
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

describe('useCanvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [], edges: [], selectedNodeId: null, isLoading: false,
    })
    vi.clearAllMocks()
  })

  it('loadCanvas 同時載入 nodes 和 edges', async () => {
    vi.mocked(NodeService.findByBlueprint).mockResolvedValue([mockNode])
    vi.mocked(EdgeService.findByBlueprint).mockResolvedValue([mockEdge])

    await useCanvasStore.getState().loadCanvas('bp-1')
    const state = useCanvasStore.getState()

    expect(state.nodes).toEqual([mockNode])
    expect(state.edges).toEqual([mockEdge])
    expect(state.isLoading).toBe(false)
    expect(NodeService.findByBlueprint).toHaveBeenCalledWith('bp-1')
    expect(EdgeService.findByBlueprint).toHaveBeenCalledWith('bp-1')
  })

  it('addNode 將新節點加入列表', async () => {
    vi.mocked(NodeService.create).mockResolvedValue(mockNode)

    await useCanvasStore.getState().addNode({
      blueprintId: 'bp-1',
      type: NodeType.EVENT,
      size: NodeSize.LARGE,
      title: '節點一',
      timeScale: TimeScale.MEDIUM,
    })

    expect(useCanvasStore.getState().nodes).toEqual([mockNode])
  })

  it('removeNode 同時移除節點及其關聯的 edges', async () => {
    useCanvasStore.setState({ nodes: [mockNode], edges: [mockEdge] })
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)

    await useCanvasStore.getState().removeNode('n-1')
    const state = useCanvasStore.getState()

    expect(state.nodes).toHaveLength(0)
    // mockEdge 的 sourceNodeId 是 n-1，應被一併移除
    expect(state.edges).toHaveLength(0)
  })

  it('addEdge 將新 edge 加入列表', async () => {
    vi.mocked(EdgeService.create).mockResolvedValue(mockEdge)

    await useCanvasStore.getState().addEdge({
      blueprintId: 'bp-1',
      sourceNodeId: 'n-1',
      targetNodeId: 'n-2',
      direction: Direction.PROMOTES,
      magnitude: Magnitude.MEDIUM,
      theoryIds: [],
    })

    expect(useCanvasStore.getState().edges).toEqual([mockEdge])
  })

  it('removeEdge 移除指定 edge', async () => {
    useCanvasStore.setState({ edges: [mockEdge] })
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)

    await useCanvasStore.getState().removeEdge('e-1')

    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('selectNode 設定 selectedNodeId', () => {
    useCanvasStore.getState().selectNode('n-1')
    expect(useCanvasStore.getState().selectedNodeId).toBe('n-1')

    useCanvasStore.getState().selectNode(null)
    expect(useCanvasStore.getState().selectedNodeId).toBeNull()
  })
})
