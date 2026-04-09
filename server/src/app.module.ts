import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { BlueprintModule } from './modules/blueprint/blueprint.module'
import { NodeModule } from './modules/node/node.module'
import { TheoryModule } from './modules/theory/theory.module'
import { EdgeModule } from './modules/edge/edge.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    BlueprintModule,
    NodeModule,
    TheoryModule,
    EdgeModule,
  ],
})
export class AppModule {}
