import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ForbiddenException } from '@nestjs/common'
import { TheoryService } from './theory.service'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'

describe('TheoryService', () => {
  let service: TheoryService
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
        TheoryService,
        DatabaseWriteService,
        { provide: getRepositoryToken(TheoryEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(TheoryService)
    jest.clearAllMocks()
  })

  it('should throw ForbiddenException when deleting preset theory', async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: '1', isPreset: true })
    await expect(service.remove('1')).rejects.toThrow(ForbiddenException)
  })

  it('should allow deleting custom theory', async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: '2', isPreset: false })
    mockRepo.delete.mockResolvedValue({})
    await expect(service.remove('2')).resolves.not.toThrow()
    expect(mockRepo.delete).toHaveBeenCalledWith('2')
  })
})
