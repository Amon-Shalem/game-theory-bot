import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RemoveEdgeCommand } from './remove-edge.command'
import { useCanvasStore } from '../stores/canvas.store'
import { EdgeService } from '../services/edge.service'
import { Direction, Magnitude } from '../types'
import type { EdgeDto } from '../types'

vi.mock('../services/edge.service')

const edge: EdgeDto = {
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

describe('RemoveEdgeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [edge], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 刪除邊', async () => {
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)
    const cmd = new RemoveEdgeCommand('e-1')
    await cmd.execute()

    expect(EdgeService.remove).toHaveBeenCalledWith('e-1')
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('undo 重建邊', async () => {
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(EdgeService.create).mockResolvedValue(edge)

    const cmd = new RemoveEdgeCommand('e-1')
    await cmd.execute()
    await cmd.undo()

    expect(EdgeService.create).toHaveBeenCalled()
    expect(useCanvasStore.getState().edges).toHaveLength(1)
  })
})
