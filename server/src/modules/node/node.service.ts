import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateNodeDto, UpdateNodeDto, NodeSize } from '@game-theory-bot/shared'

/**
 * 節點業務邏輯服務
 * parentNodeId 約束規則：
 *   - LARGE 節點不可設定 parentNodeId
 *   - SMALL 節點的 parentNodeId 必須指向 LARGE 節點
 *   - 刪除 LARGE 節點時，子節點由 DB cascade 自動刪除（Entity 設定 onDelete: CASCADE）
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
   * 驗證 parentNodeId 的業務約束
   * @param size - 欲建立節點的大小
   * @param parentNodeId - 父節點 ID（可選）
   * @throws BadRequestException 若違反約束
   */
  private async validateParentConstraint(
    size: NodeSize,
    parentNodeId?: string,
  ): Promise<void> {
    if (size === NodeSize.LARGE && parentNodeId) {
      throw new BadRequestException('LARGE nodes cannot have a parent node')
    }

    if (size === NodeSize.SMALL && parentNodeId) {
      const parent = await this.repo.findOneBy({ id: parentNodeId })
      if (!parent) throw new NotFoundException(`Parent node ${parentNodeId} not found`)
      if (parent.size !== NodeSize.LARGE) {
        throw new BadRequestException('Parent node must be LARGE')
      }
    }
  }
}
