import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import { ReviewVerdict } from '@game-theory-bot/shared'

@Entity('review_records')
export class ReviewRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  nodeId!: string

  @CreateDateColumn()
  reviewedAt!: Date

  @Column({ type: 'text', enum: ReviewVerdict })
  verdict!: ReviewVerdict

  @Column({ type: 'text', default: '' })
  evidenceSummary!: string

  @Column({ type: 'real' })
  weightBefore!: number

  @Column({ type: 'real' })
  weightAfter!: number
}
