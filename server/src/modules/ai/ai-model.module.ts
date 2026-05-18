import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AIModelEntity } from '../../database/entities/ai-model.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { AIModelService } from './ai-model.service'
import { AIModelController } from './ai-model.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AIModelEntity])],
  providers: [AIModelService, DatabaseWriteService],
  controllers: [AIModelController],
  exports: [AIModelService],
})
export class AIModelModule {}
