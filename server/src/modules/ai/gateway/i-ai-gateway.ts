import type { Message } from '@game-theory-bot/shared'

/**
 * AI 閘道抽象介面
 * 所有 AI 呼叫必須透過此介面，不得直接存取 HTTP 客戶端
 */
export interface IAIGateway {
  /**
   * 發送單次對話請求
   * @param model - OpenRouter 模型識別碼，例如 "openai/gpt-4o"
   * @param messages - 完整訊息陣列（含 system / user / assistant 角色）
   * @returns AI 回覆的文字內容
   */
  chat(model: string, messages: Message[]): Promise<string>
}
