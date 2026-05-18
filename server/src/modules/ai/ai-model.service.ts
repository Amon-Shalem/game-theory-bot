import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AIModelEntity } from '../../database/entities/ai-model.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { ModelTier } from '@game-theory-bot/shared'

/** OpenRouter /models API 回傳的單一模型結構（只取需要的欄位） */
interface OpenRouterModel {
  id: string
  name: string
  context_length?: number
  pricing: { prompt: string }
}

/** 每個 tier 同步的模型數上限 */
const SYNC_LIMIT_PER_TIER = 5

/**
 * AI 模型服務
 * findAll：取出 DB 中的模型列表
 * syncFromOpenRouter：呼叫 OpenRouter API，篩選後 upsert 進 DB
 */
@Injectable()
export class AIModelService {
  constructor(
    @InjectRepository(AIModelEntity)
    private readonly repo: Repository<AIModelEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findAll(): Promise<AIModelEntity[]> {
    return this.repo.find({ order: { tier: 'ASC', displayName: 'ASC' } })
  }

  /**
   * 從 OpenRouter 拉取模型清單，篩選頂級（前 5）與免費（前 5）後寫入 DB
   * @param openRouterUrl - OpenRouter API base URL
   * @param secret - Bearer token
   */
  async syncFromOpenRouter(openRouterUrl: string, secret: string): Promise<AIModelEntity[]> {
    let models: OpenRouterModel[]
    try {
      const res = await fetch(`${openRouterUrl}/models`, {
        headers: { Authorization: `Bearer ${secret}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data: OpenRouterModel[] }
      models = json.data ?? []
    } catch (err) {
      throw new InternalServerErrorException(`OpenRouter 同步失敗: ${(err as Error).message}`)
    }

    const isFree = (m: OpenRouterModel) => m.pricing.prompt === '0' || m.pricing.prompt === '0.0'

    const topModels = models
      .filter(m => !isFree(m))
      .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0))
      .slice(0, SYNC_LIMIT_PER_TIER)
      .map(m => this.toPartialEntity(m, ModelTier.TOP))

    const freeModels = models
      .filter(m => isFree(m))
      .slice(0, SYNC_LIMIT_PER_TIER)
      .map(m => this.toPartialEntity(m, ModelTier.FREE))

    await this.dbWrite.write(async () => {
      // upsert by modelId（unique constraint）
      for (const partial of [...topModels, ...freeModels]) {
        const existing = await this.repo.findOneBy({ modelId: partial.modelId })
        if (existing) {
          Object.assign(existing, partial)
          await this.repo.save(existing)
        } else {
          await this.repo.save(this.repo.create(partial))
        }
      }
      // 移除不再列表中的舊模型
      const keepIds = [...topModels, ...freeModels].map(m => m.modelId)
      const all = await this.repo.find()
      const toRemove = all.filter(e => !keepIds.includes(e.modelId))
      if (toRemove.length) await this.repo.remove(toRemove)
    })

    return this.findAll()
  }

  private toPartialEntity(model: OpenRouterModel, tier: ModelTier): Partial<AIModelEntity> & { modelId: string } {
    return {
      modelId: model.id,
      displayName: model.name,
      tier,
      pricingPrompt: model.pricing.prompt,
    }
  }
}
