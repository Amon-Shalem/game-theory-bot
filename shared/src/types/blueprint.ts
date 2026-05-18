/** 藍圖 DTO — 前後端共用 */
export interface BlueprintDto {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  /** 藍圖內的節點總數 */
  nodeCount: number
  /** 最近一次 AI 回顧的時間（ISO 字串），從未回顧則為 null */
  lastReviewedAt: string | null
}

export interface CreateBlueprintDto {
  name: string
  description?: string
}

export interface UpdateBlueprintDto {
  name?: string
  description?: string
}
