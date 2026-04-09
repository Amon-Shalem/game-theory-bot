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
