import { randomUUID } from 'crypto'
import type { AIOperation, Message } from '@game-theory-bot/shared'

/**
 * 單次 AI 呼叫的完整上下文
 * 每次呼叫皆為無狀態獨立請求，不共享對話歷史
 */
export class PromptContext {
  readonly sessionId: string
  readonly operation: AIOperation
  readonly systemPrompt: string
  readonly messages: Message[]

  private constructor(params: {
    operation: AIOperation
    systemPrompt: string
    messages: Message[]
  }) {
    this.sessionId = randomUUID()
    this.operation = params.operation
    this.systemPrompt = params.systemPrompt
    this.messages = params.messages
  }

  /**
   * 建立 PromptContext，自動產生唯一 sessionId
   * @param operation - AI 操作種類（SEARCH / VERIFY / IDEATE / LINK）
   * @param systemPrompt - 由 TheoryComposer 組合的完整系統提示
   * @param userMessage - 任務指令與上下文資料
   */
  static build(params: {
    operation: AIOperation
    systemPrompt: string
    userMessage: string
  }): PromptContext {
    return new PromptContext({
      operation: params.operation,
      systemPrompt: params.systemPrompt,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
    })
  }
}
