import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateBlueprintDto, UpdateBlueprintDto } from '@game-theory-bot/shared'

/**
 * 藍圖業務邏輯服務
 * 所有寫入操作透過 DatabaseWriteService 串行化
 */
@Injectable()
export class BlueprintService {
  constructor(
    @InjectRepository(BlueprintEntity)
    private readonly repo: Repository<BlueprintEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  /** 取得所有藍圖 */
  async findAll(): Promise<BlueprintEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } })
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
