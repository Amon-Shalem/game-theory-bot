import { Controller, Post, Param, Body } from '@nestjs/common'
import type { ExpandNodeDto, SuggestEdgesDto, ExpandedNodeSuggestion, EdgeSuggestion } from '@game-theory-bot/shared'
import { SearchAIService } from './services/search.ai-service'
import { RelationshipAIService } from './services/relationship.ai-service'

@Controller('ai')
export class AIController {
  constructor(
    private readonly searchService: SearchAIService,
    private readonly relationshipService: RelationshipAIService,
  ) {}

  /**
   * AI 展開大節點為子節點建議
   * @param nodeId - 要展開的節點 ID（必須為 LARGE 或 MEDIUM）
   * @param dto - 包含 modelId 與可選 theoryIds
   */
  @Post('nodes/:nodeId/expand')
  expandNode(
    @Param('nodeId') nodeId: string,
    @Body() dto: ExpandNodeDto,
  ): Promise<ExpandedNodeSuggestion[]> {
    return this.searchService.expandNodeToSmallNodes(nodeId, dto.modelId, dto.theoryIds)
  }

  /**
   * AI 建議因果連結
   * @param nodeId - 來源節點 ID
   * @param dto - 包含 modelId 與可選 theoryIds
   */
  @Post('nodes/:nodeId/suggest-edges')
  suggestEdges(
    @Param('nodeId') nodeId: string,
    @Body() dto: SuggestEdgesDto,
  ): Promise<EdgeSuggestion[]> {
    return this.relationshipService.suggestEdges(nodeId, dto.modelId, dto.theoryIds)
  }
}
