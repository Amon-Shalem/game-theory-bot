import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NodeService } from './node.service'
import api from './api'
import { NodeType, NodeSize, TimeScale } from '../types'

vi.mock('./api')

const mockNode = {
  id: 'n-1', blueprintId: 'bp-1', type: NodeType.EVENT, size: NodeSize.LARGE,
  title: '測試節點', weight: 1, timeScale: TimeScale.MEDIUM,
}

describe('NodeService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findByBlueprint 呼叫 GET /nodes 帶 blueprintId 參數', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockNode] })
    const result = await NodeService.findByBlueprint('bp-1')
    expect(api.get).toHaveBeenCalledWith('/nodes', { params: { blueprintId: 'bp-1' } })
    expect(result).toEqual([mockNode])
  })

  it('create 呼叫 POST /nodes', async () => {
    const dto = { blueprintId: 'bp-1', type: NodeType.EVENT, size: NodeSize.LARGE, title: '新節點', timeScale: TimeScale.MEDIUM }
    vi.mocked(api.post).mockResolvedValue({ data: mockNode })
    const result = await NodeService.create(dto)
    expect(api.post).toHaveBeenCalledWith('/nodes', dto)
    expect(result).toEqual(mockNode)
  })

  it('update 呼叫 PUT /nodes/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: mockNode })
    await NodeService.update('n-1', { title: '新標題' })
    expect(api.put).toHaveBeenCalledWith('/nodes/n-1', { title: '新標題' })
  })

  it('remove 呼叫 DELETE /nodes/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    await NodeService.remove('n-1')
    expect(api.delete).toHaveBeenCalledWith('/nodes/n-1')
  })
})
