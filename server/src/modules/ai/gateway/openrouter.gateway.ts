import { Injectable, Logger } from '@nestjs/common'
import type { Message } from '@game-theory-bot/shared'
import type { IAIGateway } from './i-ai-gateway'

interface OpenRouterChatResponse {
  choices: Array<{ message: { content: string } }>
  usage?: { total_tokens: number }
  model?: string
}

/**
 * OpenRouter API 閘道實作
 * 使用 Node 18+ 原生 fetch，不引入額外 HTTP 客戶端
 */
@Injectable()
export class OpenRouterGateway implements IAIGateway {
  private readonly logger = new Logger(OpenRouterGateway.name)

  /**
   * 發送對話請求至 OpenRouter
   * @param model - OpenRouter 模型識別碼
   * @param messages - 完整訊息陣列
   * @returns AI 回覆文字內容
   * @throws Error 若請求失敗或回應格式不符預期
   */
  async chat(model: string, messages: Message[]): Promise<string> {
    const openRouterUrl = process.env['OPENROUTER_URL'] ?? 'https://openrouter.ai/api/v1'
    const openRouterSecret = process.env['OPENROUTER_SECRET'] ?? ''

    const url = `${openRouterUrl}/chat/completions`
    this.logger.debug(`Calling OpenRouter: model=${model}, messages=${messages.length}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterSecret}`,
      },
      body: JSON.stringify({ model, messages, stream: false }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`OpenRouter HTTP ${response.status}: ${text}`)
    }

    const data = await response.json() as OpenRouterChatResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('OpenRouter response missing content')
    return content
  }
}
