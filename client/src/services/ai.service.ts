import api from './api'
import type { ExpandedNodeSuggestion, EdgeSuggestion, ExpandNodeDto, SuggestEdgesDto } from '../types'

/** AI 功能 API 服務 */
export const AIService = {
  /**
   * AI 展開大節點，回傳子節點建議清單
   * @param nodeId - 要展開的節點 ID（LARGE 或 MEDIUM）
   * @param dto - 包含 modelId 與可選 theoryIds
   */
  async expandNode(nodeId: string, dto: ExpandNodeDto): Promise<ExpandedNodeSuggestion[]> {
    const res = await api.post<ExpandedNodeSuggestion[]>(`/ai/nodes/${nodeId}/expand`, dto)
    return res.data
  },

  /**
   * AI 建議因果連結
   * @param nodeId - 來源節點 ID
   * @param dto - 包含 modelId 與可選 theoryIds
   */
  async suggestEdges(nodeId: string, dto: SuggestEdgesDto): Promise<EdgeSuggestion[]> {
    const res = await api.post<EdgeSuggestion[]>(`/ai/nodes/${nodeId}/suggest-edges`, dto)
    return res.data
  },
}
