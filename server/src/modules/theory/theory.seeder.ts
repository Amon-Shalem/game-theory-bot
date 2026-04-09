import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'

/** 系統啟動時植入三個預設理論模板 */
@Injectable()
export class TheorySeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TheoryEntity)
    private readonly repo: Repository<TheoryEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const presets = [
      {
        name: '攻勢現實主義',
        promptFragment: `在分析此事件時，請套用攻勢現實主義框架（米爾斯海默）：
- 大國在國際無政府狀態下追求權力最大化，安全競爭是結構性的
- 當一個大國感知到權力真空或競爭對手相對衰弱時，會主動採取擴張行動
- 霸權競爭者會阻止其他大國成為地區霸主
- 請識別此事件中的安全困境、權力轉移跡象及潛在的軍事化動機`,
        tags: ['地緣政治', '大國競爭', '安全困境'],
      },
      {
        name: '黑天鵝偵測',
        promptFragment: `在分析此事件時，請套用黑天鵝理論框架（塔勒布）：
- 主動標記低機率但高衝擊的尾部風險，不要因為罕見就忽視
- 警惕敘事謬誤：人類傾向於事後為隨機事件建構虛假的因果故事
- 識別系統中的脆弱點：什麼樣的衝擊會造成非線性的連鎖崩潰？
- 考慮反脆弱因素：哪些行為者或系統會在波動中受益？`,
        tags: ['風險評估', '黑天鵝', '尾部風險'],
      },
      {
        name: '行為賽局分析',
        promptFragment: `在分析此事件時，請套用行為賽局分析框架（江學勤）：
- 識別所有相關行為者（國家、企業、個人、組織），以及各方的利益函數
- 分析行為者的決策是否符合理性選擇，若不符合，考慮認知偏誤、國內政治壓力等因素
- 識別聯盟形成的可能性：哪些行為者有共同利益？哪些存在潛在衝突？
- 考慮博弈的重複性：這是一次性賽局還是長期博弈？信譽和承諾的可信度如何影響結果？`,
        tags: ['賽局理論', '行為者分析', '利益計算'],
      },
    ]

    for (const preset of presets) {
      const existing = await this.repo.findOneBy({ name: preset.name })
      if (!existing) {
        const entity = this.repo.create({ ...preset, isPreset: true })
        entity.tags = preset.tags
        await this.repo.save(entity)
      }
    }
  }
}
