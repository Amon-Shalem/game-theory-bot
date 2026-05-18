import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AIModelService } from './ai-model.service'
import { SyncAIModelsDto } from '@game-theory-bot/shared'

@Controller('ai-models')
export class AIModelController {
  constructor(private readonly service: AIModelService) {}

  /** 取得 DB 中所有已同步的模型 */
  @Get()
  findAll() {
    return this.service.findAll()
  }

  /** 從 OpenRouter 同步模型清單並回傳更新後的列表 */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(@Body() dto: SyncAIModelsDto) {
    return this.service.syncFromOpenRouter(dto.openRouterUrl, dto.openRouterSecret)
  }
}
