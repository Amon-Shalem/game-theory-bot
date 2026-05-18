import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { AIModelEntity } from '../../database/entities/ai-model.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { AIModelService } from './ai-model.service'
import { AIModelController } from './ai-model.controller'
import { OpenRouterGateway } from './gateway/openrouter.gateway'
import { TheoryComposer } from './theory-composer'
import { VerificationAIService } from './services/verification.ai-service'
import { SearchAIService } from './services/search.ai-service'
import { RelationshipAIService } from './services/relationship.ai-service'
import { AIController } from './ai.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([NodeEntity, EdgeEntity, TheoryEntity, AIModelEntity]),
  ],
  providers: [
    DatabaseWriteService,
    AIModelService,
    OpenRouterGateway,
    TheoryComposer,
    VerificationAIService,
    SearchAIService,
    RelationshipAIService,
  ],
  controllers: [AIModelController, AIController],
  exports: [AIModelService, VerificationAIService, SearchAIService, RelationshipAIService],
})
export class AIModule {}
