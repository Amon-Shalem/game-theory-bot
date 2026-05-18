import { Controller, Post, Get, Param, Body } from '@nestjs/common'
import type { TriggerReviewDto, ReviewJobDto, ReviewRecordDto } from '@game-theory-bot/shared'
import { ReviewVerdict } from '@game-theory-bot/shared'
import { ReviewService } from './review.service'
import type { ReviewRecordEntity } from '../../database/entities/review-record.entity'

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * 手動觸發指定藍圖的回顧
   * @returns 任務 DTO（非同步執行，可透過 jobs/:jobId 查詢進度）
   */
  @Post('blueprints/:blueprintId')
  async triggerReview(
    @Param('blueprintId') blueprintId: string,
    @Body() dto: TriggerReviewDto = {},
  ): Promise<ReviewJobDto> {
    return this.reviewService.triggerReview(blueprintId, dto.modelId)
  }

  /** 查詢回顧任務進度 */
  @Get('jobs/:jobId')
  getJobStatus(@Param('jobId') jobId: string): ReviewJobDto {
    return this.reviewService.getJobStatus(jobId)
  }

  /** 查詢藍圖的所有回顧紀錄 */
  @Get('blueprints/:blueprintId/records')
  async getRecords(@Param('blueprintId') blueprintId: string): Promise<ReviewRecordDto[]> {
    const records = await this.reviewService.findRecordsByBlueprint(blueprintId)
    return records.map(this.toDto)
  }

  private toDto(record: ReviewRecordEntity): ReviewRecordDto {
    return {
      id: record.id,
      nodeId: record.nodeId,
      reviewedAt: record.reviewedAt.toISOString(),
      verdict: record.verdict as ReviewVerdict,
      evidenceSummary: record.evidenceSummary,
      weightBefore: record.weightBefore,
      weightAfter: record.weightAfter,
    }
  }
}
