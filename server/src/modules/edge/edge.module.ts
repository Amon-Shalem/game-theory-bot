import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { EdgeService } from './edge.service'
import { EdgeController } from './edge.controller'

@Module({
  imports: [TypeOrmModule.forFeature([EdgeEntity])],
  providers: [EdgeService, DatabaseWriteService],
  controllers: [EdgeController],
  exports: [EdgeService],
})
export class EdgeModule {}
