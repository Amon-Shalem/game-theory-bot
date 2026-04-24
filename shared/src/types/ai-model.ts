export enum ModelTier {
  TOP = 'TOP',
  FREE = 'FREE',
}

export interface AIModelDto {
  id: string
  modelId: string
  displayName: string
  tier: ModelTier
  pricingPrompt: string
  updatedAt: string
}

/** 觸發從 OpenRouter 同步模型列表所需的憑證 */
export interface SyncAIModelsDto {
  openRouterUrl: string
  openRouterSecret: string
}
