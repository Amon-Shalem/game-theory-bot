import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateNodeDto, UpdateNodeDto, NodeSize, NodePositionItem } from '@game-theory-bot/shared'

/**
 * 節點業務邏輯服務
 * parentNodeId 約束規則：
 *   - LARGE / MEDIUM 節點不可設定 parentNodeId（頂層節點）
 *   - SMALL 節點的 parentNodeId 必須指向 LARGE 或 MEDIUM 節點
 *   - 刪除 LARGE / MEDIUM 節點時，子節點由 DB cascade 自動刪除（Entity 設定 onDelete: CASCADE）
 */
@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly repo: Repository<NodeEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findByBlueprint(blueprintId: string): Promise<NodeEntity[]> {
    return this.repo.find({ where: { blueprintId }, order: { createdAt: 'ASC' } })
  }

  async findOne(id: string): Promise<NodeEntity> {
    const node = await this.repo.findOneBy({ id })
    if (!node) throw new NotFoundException(`Node ${id} not found`)
    return node
  }

  async create(dto: CreateNodeDto): Promise<NodeEntity> {
    await this.validateParentConstraint(dto.size, dto.parentNodeId)

    return this.dbWrite.write(async () => {
      const entity = this.repo.create({ ...dto, weight: 1.0 })
      return this.repo.save(entity)
    })
  }

  async update(id: string, dto: UpdateNodeDto): Promise<NodeEntity> {
    const node = await this.findOne(id)
    return this.dbWrite.write(async () => {
      Object.assign(node, dto)
      return this.repo.save(node)
    })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.dbWrite.write(async () => { await this.repo.delete(id) })
  }

  /**
   * 批次更新節點 Canvas 位置
   * @param items - 要更新的節點 ID 與位置列表
   * @returns 更新後的節點列表
   * @throws NotFoundException 若任一節點 ID 不存在
   */
  async updatePositions(items: NodePositionItem[]): Promise<NodeEntity[]> {
    return this.dbWrite.write(async () => {
      const results: NodeEntity[] = []
      for (const item of items) {
        const node = await this.findOne(item.id)
        node.positionX = item.positionX
        node.positionY = item.positionY
        results.push(await this.repo.save(node))
      }
      return results
    })
  }

  /**
   * 驗證 parentNodeId 的業務約束
   * @param size - 欲建立節點的大小
   * @param parentNodeId - 父節點 ID（可選）
   * @throws BadRequestException 若違反約束
   */
  private async validateParentConstraint(
    size: NodeSize,
    parentNodeId?: string,
  ): Promise<void> {
    if ((size === NodeSize.LARGE || size === NodeSize.MEDIUM) && parentNodeId) {
      throw new BadRequestException(`${size} nodes cannot have a parent node`)
    }

    if (size === NodeSize.SMALL && parentNodeId) {
      const parent = await this.repo.findOneBy({ id: parentNodeId })
      if (!parent) throw new NotFoundException(`Parent node ${parentNodeId} not found`)
      if (parent.size !== NodeSize.LARGE && parent.size !== NodeSize.MEDIUM) {
        throw new BadRequestException('Parent node must be LARGE or MEDIUM')
      }
    }
  }
}
