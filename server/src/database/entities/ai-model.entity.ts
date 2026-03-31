import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm'
import { ModelTier } from '@game-theory-bot/shared'

@Entity('ai_models')
export class AIModelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  /** OpenRouter 模型識別碼，例如 "openai/gpt-4o" */
  @Column({ type: 'text', unique: true })
  modelId!: string

  @Column({ type: 'text' })
  displayName!: string

  @Column({ type: 'text', enum: ModelTier })
  tier!: ModelTier

  @Column({ type: 'text', default: '0' })
  pricingPrompt!: string

  @UpdateDateColumn()
  updatedAt!: Date
}
