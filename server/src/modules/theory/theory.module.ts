import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { TheoryService } from './theory.service'
import { TheoryController } from './theory.controller'
import { TheorySeeder } from './theory.seeder'

@Module({
  imports: [TypeOrmModule.forFeature([TheoryEntity])],
  providers: [TheoryService, TheorySeeder, DatabaseWriteService],
  controllers: [TheoryController],
  exports: [TheoryService],
})
export class TheoryModule {}
