import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateTheoryDto, UpdateTheoryDto } from '@game-theory-bot/shared'

/**
 * 理論業務邏輯服務
 * 預設理論（isPreset=true）只能查看，不能修改或刪除
 */
@Injectable()
export class TheoryService {
  constructor(
    @InjectRepository(TheoryEntity)
    private readonly repo: Repository<TheoryEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findAll(): Promise<TheoryEntity[]> {
    return this.repo.find({ order: { isPreset: 'DESC', createdAt: 'ASC' } })
  }

  async findOne(id: string): Promise<TheoryEntity> {
    const theory = await this.repo.findOneBy({ id })
    if (!theory) throw new NotFoundException(`Theory ${id} not found`)
    return theory
  }

  async create(dto: CreateTheoryDto): Promise<TheoryEntity> {
    return this.dbWrite.write(async () => {
      const entity = this.repo.create({ ...dto, isPreset: false })
      entity.tags = dto.tags ?? []
      return this.repo.save(entity)
    })
  }

  async update(id: string, dto: UpdateTheoryDto): Promise<TheoryEntity> {
    const theory = await this.findOne(id)
    if (theory.isPreset) throw new ForbiddenException('Preset theories cannot be modified')
    return this.dbWrite.write(async () => {
      if (dto.tags) theory.tags = dto.tags
      Object.assign(theory, { name: dto.name ?? theory.name, promptFragment: dto.promptFragment ?? theory.promptFragment })
      return this.repo.save(theory)
    })
  }

  async remove(id: string): Promise<void> {
    const theory = await this.findOne(id)
    if (theory.isPreset) throw new ForbiddenException('Preset theories cannot be deleted')
    await this.dbWrite.write(async () => { await this.repo.delete(id) })
  }
}
