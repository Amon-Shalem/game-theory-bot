import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { EdgeSuggestion } from '@game-theory-bot/shared'
import { NodeEntity } from '../../../database/entities/node.entity'
import { EdgeEntity } from '../../../database/entities/edge.entity'
import { AbstractAIService } from '../abstract-ai.service'
import { OpenRouterGateway } from '../gateway/openrouter.gateway'
import { TheoryComposer } from '../theory-composer'
import { PromptContext } from '../prompt-context'

/**
 * 鏈接關係 AI Service
 * 負責建議節點之間的因果連結
 */
@Injectable()
export class RelationshipAIService extends AbstractAIService {
  protected readonly logger = new Logger(RelationshipAIService.name)

  constructor(
    gateway: OpenRouterGateway,
    private readonly theoryComposer: TheoryComposer,
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    @InjectRepository(EdgeEntity)
    private readonly edgeRepo: Repository<EdgeEntity>,
  ) {
    super(gateway)
  }

  /**
   * 建議應與哪些現有節點建立因果連結
   * @param nodeId - 來源節點 ID
   * @param model - 使用的 AI 模型識別碼
   * @param theoryIds - 套用的理論（可為空）
   * @returns 建議的 Edge 清單（最多 5 個）
   */
  async suggestEdges(
    nodeId: string,
    model: string,
    theoryIds: string[] = [],
  ): Promise<EdgeSuggestion[]> {
    const node = await this.nodeRepo.findOneBy({ id: nodeId })
    if (!node) throw new Error(`Node ${nodeId} not found`)

    // 取得同藍圖其他節點（排除自身）
    const siblings = await this.nodeRepo.find({
      where: { blueprintId: node.blueprintId },
    })
    const candidates = siblings.filter(n => n.id !== nodeId)
    if (!candidates.length) return []

    // 已存在的連結（避免重複建議）
    const existingEdges = await this.edgeRepo.find({
      where: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
    })
    const connectedIds = new Set(existingEdges.flatMap(e => [e.sourceNodeId, e.targetNodeId]))

    const systemPrompt = await this.theoryComposer.compose(theoryIds)
    const userMessage = this.buildSuggestPrompt(node, candidates, connectedIds)

    const context = PromptContext.build({
      operation: 'LINK',
      systemPrompt,
      userMessage,
    })

    const response = await this.execute(model, context)
    const parsed = this.parseJson<{ suggestions: EdgeSuggestion[] }>(response.content)
    return parsed.suggestions ?? []
  }

  private buildSuggestPrompt(
    node: NodeEntity,
    candidates: NodeEntity[],
    connectedIds: Set<string>,
  ): string {
    const candidateList = candidates
      .map(n => `- ID: ${n.id} | ${n.title} (${n.type}, ${n.timeScale})${connectedIds.has(n.id) ? ' [已連結]' : ''}`)
      .join('\n')

    return `請分析以下節點，並建議 2~5 個應建立因果連結的目標節點。

來源節點：
- ID: ${node.id}
- 標題：${node.title}
- 類型：${node.type}
- 時間尺度：${node.timeScale}

藍圖中其他節點：
${candidateList}

請避免建議已連結（[已連結]）的節點，除非現有連結方向或性質值得改變。

請以 JSON 格式回覆：
{
  "suggestions": [
    {
      "targetNodeId": "目標節點ID",
      "direction": "PROMOTES" | "INHIBITS" | "NEUTRAL",
      "magnitude": "SMALL" | "MEDIUM" | "LARGE",
      "reasoning": "因果說明（30~100字）"
    }
  ]
}`
  }
}
