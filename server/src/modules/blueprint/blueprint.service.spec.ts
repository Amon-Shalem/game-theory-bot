import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BlueprintService } from './blueprint.service'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'

describe('BlueprintService', () => {
  let service: BlueprintService
  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlueprintService,
        DatabaseWriteService,
        { provide: getRepositoryToken(BlueprintEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(BlueprintService)
    jest.clearAllMocks()
  })

  it('should return all blueprints', async () => {
    const blueprints = [{ id: '1', name: 'Test' }]
    mockRepo.find.mockResolvedValue(blueprints)
    const result = await service.findAll()
    expect(result).toEqual(blueprints)
  })

  it('should create a blueprint via DatabaseWriteService', async () => {
    const dto = { name: 'New Blueprint', description: 'desc' }
    const entity = { id: 'abc', ...dto }
    mockRepo.create.mockReturnValue(entity)
    mockRepo.save.mockResolvedValue(entity)

    const result = await service.create(dto)
    expect(result.name).toBe('New Blueprint')
    expect(mockRepo.save).toHaveBeenCalledTimes(1)
  })

  it('should throw NotFoundException when blueprint not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null)
    await expect(service.findOne('nonexistent')).rejects.toThrow('Blueprint nonexistent not found')
  })
})
