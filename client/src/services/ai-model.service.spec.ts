import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIModelService } from './ai-model.service'
import api from './api'
import { ModelTier } from '../types'

vi.mock('./api')

const mockModel = {
  id: 'm-1', modelId: 'openai/gpt-4o', displayName: 'GPT-4o',
  tier: ModelTier.TOP, pricingPrompt: '0.000005', updatedAt: '2026-01-01T00:00:00Z',
}

describe('AIModelService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('findAll 呼叫 GET /ai-models', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockModel] })
    const result = await AIModelService.findAll()
    expect(api.get).toHaveBeenCalledWith('/ai-models')
    expect(result).toEqual([mockModel])
  })

  it('sync 呼叫 POST /ai-models/sync 帶憑證', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: [mockModel] })
    const result = await AIModelService.sync('https://openrouter.ai/api/v1', 'sk-test')
    expect(api.post).toHaveBeenCalledWith('/ai-models/sync', {
      openRouterUrl: 'https://openrouter.ai/api/v1',
      openRouterSecret: 'sk-test',
    })
    expect(result).toEqual([mockModel])
  })
})
