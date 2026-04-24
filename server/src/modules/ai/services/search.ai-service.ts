import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { ExpandedNodeSuggestion } from '@game-theory-bot/shared'
import { NodeEntity } from '../../../database/entities/node.entity'
import { AbstractAIService } from '../abstract-ai.service'
import { OpenRouterGateway } from '../gateway/openrouter.gateway'
import { TheoryComposer } from '../theory-composer'
import { PromptContext } from '../prompt-context'

/**
 * 搜尋 AI Service
 * 負責展開大節點為相關小節點建議
 */
@Injectable()
export class SearchAIService extends AbstractAIService {
  protected readonly logger = new Logger(SearchAIService.name)

  constructor(
    gateway: OpenRouterGateway,
    private readonly theoryComposer: TheoryComposer,
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
  ) {
    super(gateway)
  }

  /**
   * 展開大節點，生成相關子節點建議
   * @param nodeId - 要展開的節點 ID（必須為 LARGE 或 MEDIUM）
   * @param model - 使用的 AI 模型識別碼
   * @param theoryIds - 套用的理論（可為空）
   * @returns 建議的子節點清單（最多 5 個）
   */
  async expandNodeToSmallNodes(
    nodeId: string,
    model: string,
    theoryIds: string[] = [],
  ): Promise<ExpandedNodeSuggestion[]> {
    const node = await this.nodeRepo.findOneBy({ id: nodeId })
    if (!node) throw new Error(`Node ${nodeId} not found`)

    const systemPrompt = await this.theoryComposer.compose(theoryIds)
    const userMessage = this.buildExpandPrompt(node)

    const context = PromptContext.build({
      operation: 'SEARCH',
      systemPrompt,
      userMessage,
    })

    const response = await this.execute(model, context)
    const parsed = this.parseJson<{ suggestions: ExpandedNodeSuggestion[] }>(response.content)
    return parsed.suggestions ?? []
  }

  private buildExpandPrompt(node: NodeEntity): string {
    return `請分析以下地緣政治節點，並建議 3~5 個相關的子節點。

節點資訊：
- 標題：${node.title}
- 類型：${node.type}
- 時間尺度：${node.timeScale}
- 描述：${node.description || '（無）'}

子節點可以是相關行為者（ACTOR）、具體事件（EVENT）、或潛在利益（INTEREST）。
每個子節點應有清楚的因果連結理由。

請以 JSON 格式回覆：
{
  "suggestions": [
    {
      "title": "子節點標題",
      "type": "ACTOR" | "EVENT" | "INTEREST",
      "timeScale": "SHORT" | "MEDIUM" | "LONG"
    }
  ]
}`
  }
}
