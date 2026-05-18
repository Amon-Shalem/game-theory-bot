import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ReviewVerdict } from '@game-theory-bot/shared'
import { NodeEntity } from '../../../database/entities/node.entity'
import { EdgeEntity } from '../../../database/entities/edge.entity'
import { AbstractAIService } from '../abstract-ai.service'
import { OpenRouterGateway } from '../gateway/openrouter.gateway'
import { TheoryComposer } from '../theory-composer'
import { PromptContext } from '../prompt-context'

interface VerifyResult {
  verdict: ReviewVerdict
  evidenceSummary: string
}

/**
 * 驗證 AI Service
 * 負責評估節點預測的有效性並回傳判定結果
 */
@Injectable()
export class VerificationAIService extends AbstractAIService {
  protected readonly logger = new Logger(VerificationAIService.name)

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
   * 驗證單一節點的預測有效性
   * @param nodeId - 要驗證的節點 ID
   * @param model - 使用的 AI 模型識別碼
   * @param theoryIds - 套用的理論（可為空）
   * @returns 判定結果與佐證說明
   */
  async reviewNodeValidity(
    nodeId: string,
    model: string,
    theoryIds: string[] = [],
  ): Promise<VerifyResult> {
    const node = await this.nodeRepo.findOneBy({ id: nodeId })
    if (!node) throw new Error(`Node ${nodeId} not found`)

    const edges = await this.edgeRepo.find({
      where: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
    })

    const systemPrompt = await this.theoryComposer.compose(theoryIds)
    const userMessage = this.buildVerifyPrompt(node, edges)

    const context = PromptContext.build({
      operation: 'VERIFY',
      systemPrompt,
      userMessage,
    })

    const response = await this.execute(model, context)
    return this.parseJson<VerifyResult>(response.content)
  }

  private buildVerifyPrompt(node: NodeEntity, edges: EdgeEntity[]): string {
    const edgeSummary = edges.length > 0
      ? edges.map(e => `- ${e.sourceNodeId === node.id ? '→' : '←'} ${e.direction} (${e.magnitude}): ${e.reasoning}`).join('\n')
      : '（無因果連結）'

    return `請評估以下地緣政治預測節點的有效性。

節點資訊：
- 標題：${node.title}
- 類型：${node.type}
- 時間尺度：${node.timeScale}
- 描述：${node.description || '（無）'}

相關因果連結：
${edgeSummary}

請以 JSON 格式回覆，格式如下：
{
  "verdict": "CONFIRMED" | "REFUTED" | "PENDING",
  "evidenceSummary": "佐證或反駁說明（50~200字）"
}

判定標準：
- CONFIRMED：有明確證據支持此預測
- REFUTED：有明確證據反駁此預測
- PENDING：尚無足夠證據判定`
  }
}
