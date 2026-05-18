import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { ReviewRecordEntity } from '../../database/entities/review-record.entity'
import { AIModelEntity } from '../../database/entities/ai-model.entity'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { AIModule } from '../ai/ai.module'
import { ReviewService } from './review.service'
import { ReviewController } from './review.controller'
import { WeeklyReviewScheduler } from './weekly-review.scheduler'
import { ReviewEvaluator } from './review-evaluator'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NodeEntity,
      EdgeEntity,
      ReviewRecordEntity,
      AIModelEntity,
      BlueprintEntity,
      TheoryEntity,
    ]),
    AIModule,
  ],
  providers: [ReviewService, ReviewEvaluator, WeeklyReviewScheduler, DatabaseWriteService],
  controllers: [ReviewController],
})
export class ReviewModule {}
