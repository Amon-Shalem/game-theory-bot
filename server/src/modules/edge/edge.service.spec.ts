import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EdgeService } from './edge.service'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { Direction, Magnitude } from '@game-theory-bot/shared'

describe('EdgeService', () => {
  let service: EdgeService
  const mockRepo = {
    find: jest.fn(), findOneBy: jest.fn(),
    create: jest.fn(), save: jest.fn(), delete: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EdgeService, DatabaseWriteService,
        { provide: getRepositoryToken(EdgeEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(EdgeService)
    jest.clearAllMocks()
  })

  it('should create edge with empty theoryIds', async () => {
    const dto = {
      blueprintId: 'bp1', sourceNodeId: 'n1', targetNodeId: 'n2',
      direction: Direction.PROMOTES, magnitude: Magnitude.LARGE,
    }
    const entity = { id: 'e1', ...dto, theoryIds: [] }
    mockRepo.create.mockReturnValue(entity)
    mockRepo.save.mockResolvedValue(entity)

    const result = await service.create(dto)
    expect(result.theoryIds).toEqual([])
  })
})
