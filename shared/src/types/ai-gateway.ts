/** AI 操作種類，用於 AIException 追蹤與 log */
export type AIOperation = 'SEARCH' | 'VERIFY' | 'IDEATE' | 'LINK'

/** OpenRouter 對話訊息格式 */
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** AI 呼叫回傳結果 */
export interface AIResponse {
  content: string
  tokensUsed: number
  modelUsed: string
}

/** 展開大節點時建議的子節點資料 */
export interface ExpandedNodeSuggestion {
  title: string
  type: import('./node').NodeType
  timeScale: import('./node').TimeScale
}

/** AI 建議的 Edge 資料 */
export interface EdgeSuggestion {
  targetNodeId: string
  direction: import('./edge').Direction
  magnitude: import('./edge').Magnitude
  reasoning: string
}

/** 觸發 AI 展開節點的請求 */
export interface ExpandNodeDto {
  modelId: string
  theoryIds?: string[]
}

/** 觸發 AI 建議連結的請求 */
export interface SuggestEdgesDto {
  modelId: string
  theoryIds?: string[]
}

/** 手動觸發回顧的請求 */
export interface TriggerReviewDto {
  /** 未傳時後端自動選擇第一個可用的 TOP 模型 */
  modelId?: string
}

/** 回顧任務狀態 */
export type ReviewJobStatus = 'RUNNING' | 'DONE' | 'FAILED'

/** 回顧任務 DTO（前端查詢進度用） */
export interface ReviewJobDto {
  jobId: string
  blueprintId: string
  startedAt: string
  status: ReviewJobStatus
  finishedAt?: string
  error?: string
}
