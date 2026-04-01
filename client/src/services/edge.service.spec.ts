import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EdgeService } from './edge.service'
import api from './api'
import { Direction, Magnitude } from '../types'

vi.mock('./api')

const mockEdge = {
  id: 'e-1', blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
  direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM, theoryIds: [],
}

describe('EdgeService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findByBlueprint 呼叫 GET /edges 帶 blueprintId 參數', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockEdge] })
    const result = await EdgeService.findByBlueprint('bp-1')
    expect(api.get).toHaveBeenCalledWith('/edges', { params: { blueprintId: 'bp-1' } })
    expect(result).toEqual([mockEdge])
  })

  it('create 呼叫 POST /edges', async () => {
    const dto = {
      blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
      direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM,
    }
    vi.mocked(api.post).mockResolvedValue({ data: mockEdge })
    const result = await EdgeService.create(dto)
    expect(api.post).toHaveBeenCalledWith('/edges', dto)
    expect(result).toEqual(mockEdge)
  })

  it('update 呼叫 PUT /edges/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: mockEdge })
    await EdgeService.update('e-1', { direction: Direction.INHIBITS })
    expect(api.put).toHaveBeenCalledWith('/edges/e-1', { direction: Direction.INHIBITS })
  })

  it('remove 呼叫 DELETE /edges/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    await EdgeService.remove('e-1')
    expect(api.delete).toHaveBeenCalledWith('/edges/e-1')
  })
})
