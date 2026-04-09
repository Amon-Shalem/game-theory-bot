import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateEdgeDto, UpdateEdgeDto } from '@game-theory-bot/shared'

@Injectable()
export class EdgeService {
  constructor(
    @InjectRepository(EdgeEntity)
    private readonly repo: Repository<EdgeEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findByBlueprint(blueprintId: string): Promise<EdgeEntity[]> {
    return this.repo.find({ where: { blueprintId } })
  }

  async findOne(id: string): Promise<EdgeEntity> {
    const edge = await this.repo.findOneBy({ id })
    if (!edge) throw new NotFoundException(`Edge ${id} not found`)
    return edge
  }

  async create(dto: CreateEdgeDto): Promise<EdgeEntity> {
    return this.dbWrite.write(async () => {
      const entity = this.repo.create(dto)
      entity.theoryIds = dto.theoryIds ?? []
      return this.repo.save(entity)
    })
  }

  async update(id: string, dto: UpdateEdgeDto): Promise<EdgeEntity> {
    const edge = await this.findOne(id)
    return this.dbWrite.write(async () => {
      if (dto.theoryIds !== undefined) edge.theoryIds = dto.theoryIds
      Object.assign(edge, {
        direction: dto.direction ?? edge.direction,
        magnitude: dto.magnitude ?? edge.magnitude,
        reasoning: dto.reasoning ?? edge.reasoning,
      })
      return this.repo.save(edge)
    })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.dbWrite.write(async () => { await this.repo.delete(id) })
  }
}
