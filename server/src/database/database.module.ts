import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlueprintEntity } from './entities/blueprint.entity'
import { NodeEntity } from './entities/node.entity'
import { TheoryEntity } from './entities/theory.entity'
import { EdgeEntity } from './entities/edge.entity'
import { AIModelEntity } from './entities/ai-model.entity'
import { ReviewRecordEntity } from './entities/review-record.entity'

/**
 * 資料庫模組
 * extra.pragma 在連線建立時自動啟用 WAL 模式，由 TypeORM 管理連線生命週期
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'game-theory-bot.db',
      synchronize: true,
      entities: [
        BlueprintEntity,
        NodeEntity,
        TheoryEntity,
        EdgeEntity,
        AIModelEntity,
        ReviewRecordEntity,
      ],
      extra: {
        // 啟用 WAL 模式，提升並發讀取效能
        pragma: { journal_mode: 'WAL' },
      },
    }),
  ],
})
export class DatabaseModule {}
