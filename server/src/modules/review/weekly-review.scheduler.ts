import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ModelTier } from '@game-theory-bot/shared'
import { AIModelEntity } from '../../database/entities/ai-model.entity'
import { ReviewService } from './review.service'

/**
 * 每週回顧排程
 * 每週日凌晨 2:00 自動觸發所有藍圖的 AI 回顧
 */
@Injectable()
export class WeeklyReviewScheduler {
  private readonly logger = new Logger(WeeklyReviewScheduler.name)

  constructor(
    private readonly reviewService: ReviewService,
    @InjectRepository(AIModelEntity)
    private readonly aiModelRepo: Repository<AIModelEntity>,
  ) {}

  /** 每週日凌晨 2:00 執行 */
  @Cron('0 2 * * 0')
  async handleWeeklyReview(): Promise<void> {
    this.logger.log('Weekly review started')
    const model = await this.resolveModel()
    if (!model) {
      this.logger.warn('No AI models available, skipping weekly review')
      return
    }
    await this.reviewService.batchReviewAllBlueprints(model)
    this.logger.log('Weekly review completed')
  }

  private async resolveModel(): Promise<string | null> {
    const top = await this.aiModelRepo.findOne({ where: { tier: ModelTier.TOP } })
    if (top) return top.modelId
    const free = await this.aiModelRepo.findOne({ where: { tier: ModelTier.FREE } })
    return free?.modelId ?? null
  }
}
