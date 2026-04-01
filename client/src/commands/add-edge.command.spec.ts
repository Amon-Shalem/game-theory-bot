import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddEdgeCommand } from './add-edge.command'
import { useCanvasStore } from '../stores/canvas.store'
import { EdgeService } from '../services/edge.service'
import { Direction, Magnitude } from '../types'
import type { CreateEdgeDto, EdgeDto } from '../types'

vi.mock('../services/edge.service')

const dto: CreateEdgeDto = {
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  theoryIds: [],
}

const createdEdge: EdgeDto = {
  id: 'e-new',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

describe('AddEdgeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 API 並加入 store', async () => {
    vi.mocked(EdgeService.create).mockResolvedValue(createdEdge)
    const cmd = new AddEdgeCommand(dto)
    await cmd.execute()

    expect(EdgeService.create).toHaveBeenCalledWith(dto)
    expect(useCanvasStore.getState().edges).toEqual([createdEdge])
  })

  it('undo 呼叫 DELETE API 並從 store 移除', async () => {
    vi.mocked(EdgeService.create).mockResolvedValue(createdEdge)
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)

    const cmd = new AddEdgeCommand(dto)
    await cmd.execute()
    await cmd.undo()

    expect(EdgeService.remove).toHaveBeenCalledWith('e-new')
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('execute 失敗時不修改 store', async () => {
    vi.mocked(EdgeService.create).mockRejectedValue(new Error('API error'))
    const cmd = new AddEdgeCommand(dto)

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })
})
