import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TheoryService } from './theory.service'
import api from './api'

vi.mock('./api')

const mockTheory = {
  id: 't-1', name: '攻勢現實主義', promptFragment: '國家以安全最大化為目標…',
  isPreset: true, tags: ['realism'], createdAt: '2026-01-01T00:00:00Z',
}

describe('TheoryService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('findAll 呼叫 GET /theories', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockTheory] })
    const result = await TheoryService.findAll()
    expect(api.get).toHaveBeenCalledWith('/theories')
    expect(result).toEqual([mockTheory])
  })

  it('create 呼叫 POST /theories', async () => {
    const dto = { name: '新理論', promptFragment: '內容…', tags: ['custom'] }
    vi.mocked(api.post).mockResolvedValue({ data: mockTheory })
    const result = await TheoryService.create(dto)
    expect(api.post).toHaveBeenCalledWith('/theories', dto)
    expect(result).toEqual(mockTheory)
  })

  it('update 呼叫 PUT /theories/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: mockTheory })
    const result = await TheoryService.update('t-1', { name: '更新名稱' })
    expect(api.put).toHaveBeenCalledWith('/theories/t-1', { name: '更新名稱' })
    expect(result).toEqual(mockTheory)
  })

  it('remove 呼叫 DELETE /theories/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({})
    await TheoryService.remove('t-1')
    expect(api.delete).toHaveBeenCalledWith('/theories/t-1')
  })
})
