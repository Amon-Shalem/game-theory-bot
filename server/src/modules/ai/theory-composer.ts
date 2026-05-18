import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'

const BASE_SYSTEM_ROLE = `你是一個地緣政治分析師，擅長因果推演與預測評估。
分析時請保持客觀，基於提供的理論框架進行推演。
回覆必須以合法的 JSON 格式回傳，不得包含任何 markdown 或程式碼區塊標記。`

/**
 * 將使用者選定的多個 Theory 組合為 AI system prompt
 * 遵循規格：固定角色 → 動態理論透鏡 → 任務指令由子類別提供
 */
@Injectable()
export class TheoryComposer {
  constructor(
    @InjectRepository(TheoryEntity)
    private readonly theoryRepo: Repository<TheoryEntity>,
  ) {}

  /**
   * 根據 theoryIds 組合 system prompt
   * @param theoryIds - 使用者選定的理論 ID 陣列（可為空）
   * @returns 完整的 system prompt 字串
   */
  async compose(theoryIds: string[]): Promise<string> {
    if (!theoryIds.length) return BASE_SYSTEM_ROLE

    const theories = await this.theoryRepo.find({
      where: { id: In(theoryIds) },
    })

    if (!theories.length) return BASE_SYSTEM_ROLE

    const lensFragments = theories
      .map(t => `【${t.name}】\n${t.promptFragment}`)
      .join('\n\n')

    return `${BASE_SYSTEM_ROLE}\n\n以下是分析時應採用的理論框架：\n\n${lensFragments}`
  }
}
