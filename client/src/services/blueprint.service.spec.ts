import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BlueprintService } from './blueprint.service'
import api from './api'

vi.mock('./api')

const mockBp = { id: 'bp-1', name: '測試', description: '', createdAt: '', updatedAt: '' }

describe('BlueprintService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findAll 呼叫 GET /blueprints', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockBp] })
    const result = await BlueprintService.findAll()
    expect(api.get).toHaveBeenCalledWith('/blueprints')
    expect(result).toEqual([mockBp])
  })

  it('findOne 呼叫 GET /blueprints/:id', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockBp })
    const result = await BlueprintService.findOne('bp-1')
    expect(api.get).toHaveBeenCalledWith('/blueprints/bp-1')
    expect(result).toEqual(mockBp)
  })

  it('create 呼叫 POST /blueprints', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: mockBp })
    const result = await BlueprintService.create({ name: '測試' })
    expect(api.post).toHaveBeenCalledWith('/blueprints', { name: '測試' })
    expect(result).toEqual(mockBp)
  })

  it('update 呼叫 PUT /blueprints/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: mockBp })
    const result = await BlueprintService.update('bp-1', { name: '新名稱' })
    expect(api.put).toHaveBeenCalledWith('/blueprints/bp-1', { name: '新名稱' })
    expect(result).toEqual(mockBp)
  })

  it('remove 呼叫 DELETE /blueprints/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    await BlueprintService.remove('bp-1')
    expect(api.delete).toHaveBeenCalledWith('/blueprints/bp-1')
  })
})
