import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { BlueprintService } from './blueprint.service'
import { BlueprintController } from './blueprint.controller'

@Module({
  imports: [TypeOrmModule.forFeature([BlueprintEntity])],
  providers: [BlueprintService, DatabaseWriteService],
  controllers: [BlueprintController],
  exports: [BlueprintService],
})
export class BlueprintModule {}
