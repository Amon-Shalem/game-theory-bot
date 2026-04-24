import type { AIOperation } from '@game-theory-bot/shared'

/**
 * AI 呼叫失敗時統一拋出此例外
 * NestJS Global Exception Filter 會將其轉換為 HTTP 503
 */
export class AIException extends Error {
  readonly originalCause: unknown

  constructor(
    public readonly operation: AIOperation,
    public readonly sessionId: string,
    originalCause: unknown,
  ) {
    super(`AI operation ${operation} failed (session: ${sessionId})`)
    this.originalCause = originalCause
  }
}
