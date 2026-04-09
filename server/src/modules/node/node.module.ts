import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { NodeService } from './node.service'
import { NodeController } from './node.controller'

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity])],
  providers: [NodeService, DatabaseWriteService],
  controllers: [NodeController],
  exports: [NodeService],
})
export class NodeModule {}
