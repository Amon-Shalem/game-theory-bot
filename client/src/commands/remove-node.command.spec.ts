import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RemoveNodeCommand } from './remove-node.command'
import { useCanvasStore } from '../stores/canvas.store'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'
import { NodeType, NodeSize, NodeStatus, TimeScale, Direction, Magnitude } from '../types'
import type { NodeDto, EdgeDto } from '../types'

vi.mock('../services/node.service')
vi.mock('../services/edge.service')

const node: NodeDto = {
  id: 'n-1',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: 'Node 1',
  description: '',
  weight: 1.0,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
}

const relatedEdge: EdgeDto = {
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

const unrelatedEdge: EdgeDto = {
  id: 'e-2',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-3',
  targetNodeId: 'n-4',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

describe('RemoveNodeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [node],
      edges: [relatedEdge, unrelatedEdge],
      selectedNodeId: null,
      isLoading: false,
    })
    vi.clearAllMocks()
  })

  it('execute 刪除節點及關聯邊', async () => {
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)

    const cmd = new RemoveNodeCommand('n-1')
    await cmd.execute()

    expect(NodeService.remove).toHaveBeenCalledWith('n-1')
    expect(EdgeService.remove).toHaveBeenCalledWith('e-1')
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
    // unrelatedEdge 應保留
    expect(useCanvasStore.getState().edges).toEqual([unrelatedEdge])
  })

  it('undo 重建節點及關聯邊', async () => {
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(NodeService.create).mockResolvedValue(node)
    vi.mocked(EdgeService.create).mockResolvedValue(relatedEdge)

    const cmd = new RemoveNodeCommand('n-1')
    await cmd.execute()
    await cmd.undo()

    expect(NodeService.create).toHaveBeenCalled()
    expect(EdgeService.create).toHaveBeenCalled()
    const state = useCanvasStore.getState()
    expect(state.nodes).toHaveLength(1)
    // unrelatedEdge + 重建的 relatedEdge
    expect(state.edges).toHaveLength(2)
  })

  it('label 包含節點標題', () => {
    const cmd = new RemoveNodeCommand('n-1')
    expect(cmd.label).toContain('Node 1')
  })
})
