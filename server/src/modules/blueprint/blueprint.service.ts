import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { NodeEntity } from '../../database/entities/node.entity'
import { ReviewRecordEntity } from '../../database/entities/review-record.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import type { BlueprintDto, CreateBlueprintDto, UpdateBlueprintDto } from '@game-theory-bot/shared'

/**
 * 藍圖業務邏輯服務
 * 所有寫入操作透過 DatabaseWriteService 串行化
 */
@Injectable()
export class BlueprintService {
  constructor(
    @InjectRepository(BlueprintEntity)
    private readonly repo: Repository<BlueprintEntity>,
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    @InjectRepository(ReviewRecordEntity)
    private readonly reviewRepo: Repository<ReviewRecordEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  /**
   * 取得所有藍圖，並附帶節點數與最近一次回顧時間
   * 使用兩次彙整查詢（GROUP BY）避免 N+1
   */
  async findAll(): Promise<BlueprintDto[]> {
    const blueprints = await this.repo.find({ order: { createdAt: 'DESC' } })
    if (!blueprints.length) return []

    // 計算各藍圖的節點數
    const nodeCounts: { blueprintId: string; count: string }[] = await this.nodeRepo
      .createQueryBuilder('n')
      .select('n.blueprintId', 'blueprintId')
      .addSelect('COUNT(n.id)', 'count')
      .groupBy('n.blueprintId')
      .getRawMany()

    const nodeCountMap = new Map(nodeCounts.map(r => [r.blueprintId, parseInt(r.count, 10)]))

    // 查詢各藍圖最近一次回顧時間（透過 nodes 關聯到 review_records）
    const lastReviews: { blueprintId: string; lastReviewedAt: string }[] = await this.reviewRepo
      .createQueryBuilder('rr')
      .innerJoin(NodeEntity, 'n', 'n.id = rr.nodeId')
      .select('n.blueprintId', 'blueprintId')
      .addSelect('MAX(rr.reviewedAt)', 'lastReviewedAt')
      .groupBy('n.blueprintId')
      .getRawMany()

    const lastReviewMap = new Map(lastReviews.map(r => [r.blueprintId, r.lastReviewedAt]))

    return blueprints.map(bp => ({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      createdAt: bp.createdAt.toISOString(),
      updatedAt: bp.updatedAt.toISOString(),
      nodeCount: nodeCountMap.get(bp.id) ?? 0,
      lastReviewedAt: lastReviewMap.get(bp.id) ?? null,
    }))
  }

  /** 取得單一藍圖，不存在則拋出 NotFoundException */
  async findOne(id: string): Promise<BlueprintEntity> {
    const blueprint = await this.repo.findOneBy({ id })
    if (!blueprint) {
      throw new NotFoundException(`Blueprint ${id} not found`)
    }
    return blueprint
  }

  /** 建立新藍圖 */
  async create(dto: CreateBlueprintDto): Promise<BlueprintEntity> {
    return this.dbWrite.write(async () => {
      const entity = this.repo.create(dto)
      return this.repo.save(entity)
    })
  }

  /** 更新藍圖，不存在則拋出 NotFoundException */
  async update(id: string, dto: UpdateBlueprintDto): Promise<BlueprintEntity> {
    const blueprint = await this.findOne(id)
    return this.dbWrite.write(async () => {
      Object.assign(blueprint, dto)
      return this.repo.save(blueprint)
    })
  }

  /** 刪除藍圖，不存在則拋出 NotFoundException */
  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.dbWrite.write(async () => {
      await this.repo.delete(id)
    })
  }
}
