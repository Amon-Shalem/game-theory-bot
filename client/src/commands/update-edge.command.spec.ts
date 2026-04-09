import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateEdgeCommand } from './update-edge.command'
import type { EdgeFormValues } from './update-edge.command'
import { useCanvasStore } from '../stores/canvas.store'
import { EdgeService } from '../services/edge.service'
import { Direction, Magnitude } from '../types'
import type { EdgeDto } from '../types'

vi.mock('../services/edge.service')

const existingEdge: EdgeDto = {
  id: 'e-1', blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
  theoryIds: ['t-1'], direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM,
  reasoning: '原始理由', createdBy: 'user',
}

const newValues: EdgeFormValues = {
  direction: Direction.INHIBITS,
  magnitude: Magnitude.LARGE,
  reasoning: '新理由',
}

const updatedEdge: EdgeDto = {
  ...existingEdge,
  direction: Direction.INHIBITS,
  magnitude: Magnitude.LARGE,
  reasoning: '新理由',
}

describe('UpdateEdgeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [existingEdge], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 API 並更新 store', async () => {
    vi.mocked(EdgeService.update).mockResolvedValue(updatedEdge)
    const cmd = new UpdateEdgeCommand('e-1', newValues)
    await cmd.execute()

    expect(EdgeService.update).toHaveBeenCalledWith('e-1', newValues)
    expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.INHIBITS)
  })

  it('undo 還原為舊值（包含 theoryIds）', async () => {
    vi.mocked(EdgeService.update).mockResolvedValueOnce(updatedEdge)
    const restoredEdge: EdgeDto = { ...existingEdge }
    vi.mocked(EdgeService.update).mockResolvedValueOnce(restoredEdge)

    const cmd = new UpdateEdgeCommand('e-1', newValues)
    await cmd.execute()
    await cmd.undo()

    expect(EdgeService.update).toHaveBeenCalledTimes(2)
    const secondCall = vi.mocked(EdgeService.update).mock.calls[1]
    expect(secondCall[1]).toMatchObject({
      direction: Direction.PROMOTES,
      magnitude: Magnitude.MEDIUM,
      reasoning: '原始理由',
      theoryIds: ['t-1'],
    })
    expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.PROMOTES)
  })

  it('execute 失敗時 store 不被更新', async () => {
    vi.mocked(EdgeService.update).mockRejectedValue(new Error('API error'))
    const cmd = new UpdateEdgeCommand('e-1', newValues)

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.PROMOTES)
  })

  it('label 包含 sourceNodeId 和 targetNodeId', () => {
    const cmd = new UpdateEdgeCommand('e-1', newValues)
    expect(cmd.label).toContain('n-1')
    expect(cmd.label).toContain('n-2')
  })
})
