import api from './api'
import type { AIModelDto } from '../types'

/** AI 模型服務 — 封裝 /ai-models API */
export const AIModelService = {
  async findAll(): Promise<AIModelDto[]> {
    const res = await api.get<AIModelDto[]>('/ai-models')
    return res.data
  },

  /**
   * 觸發後端從 OpenRouter 同步模型清單
   * @param openRouterUrl - 設定中的 API base URL
   * @param openRouterSecret - 設定中的 Bearer token
   */
  async sync(openRouterUrl: string, openRouterSecret: string): Promise<AIModelDto[]> {
    const res = await api.post<AIModelDto[]>('/ai-models/sync', { openRouterUrl, openRouterSecret })
    return res.data
  },
}
