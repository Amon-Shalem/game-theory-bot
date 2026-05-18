import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common'
import { AIException } from '../modules/ai/ai.exception'

/**
 * 將 AIException 轉換為 HTTP 503 回應
 * 格式：{ error: string, sessionId: string }
 */
@Catch(AIException)
export class AIExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AIExceptionFilter.name)

  catch(exception: AIException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = ctx.getResponse<any>()

    this.logger.error(
      `AIException: operation=${exception.operation} sessionId=${exception.sessionId}`,
      exception.originalCause,
    )

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: exception.message,
      sessionId: exception.sessionId,
    })
  }
}
