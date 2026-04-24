import { Logger } from '@nestjs/common'
import type { AIResponse } from '@game-theory-bot/shared'
import { AIException } from './ai.exception'
import type { IAIGateway } from './gateway/i-ai-gateway'
import type { PromptContext } from './prompt-context'

/**
 * 所有 AI Service 的抽象基礎類別
 * 統一錯誤處理：OpenRouter 失敗一律包裝為 AIException
 * 子類別透過 execute() 發起 AI 呼叫，不可直接存取 gateway
 */
export abstract class AbstractAIService {
  protected abstract readonly logger: Logger

  constructor(private readonly gateway: IAIGateway) {}

  /**
   * 執行 AI 呼叫的唯一入口
   * @param model - OpenRouter 模型識別碼
   * @param context - 由 PromptContext.build() 建立的呼叫上下文
   * @returns AIResponse
   * @throws AIException 當 gateway 呼叫失敗時
   */
  protected async execute(model: string, context: PromptContext): Promise<AIResponse> {
    this.logger.log(`AI call: operation=${context.operation} sessionId=${context.sessionId} model=${model}`)
    try {
      const content = await this.gateway.chat(model, context.messages)
      return { content, tokensUsed: 0, modelUsed: model }
    } catch (error) {
      this.logger.error(`AI call failed: operation=${context.operation} sessionId=${context.sessionId}`, error)
      throw new AIException(context.operation, context.sessionId, error)
    }
  }

  /**
   * 解析 AI 回覆的 JSON 內容
   * @param content - AI 回覆的原始文字
   * @returns 解析後的 JavaScript 物件
   * @throws Error 若 JSON 格式不合法
   */
  protected parseJson<T>(content: string): T {
    // 清除可能包裹的 markdown code block
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    return JSON.parse(cleaned) as T
  }
}
