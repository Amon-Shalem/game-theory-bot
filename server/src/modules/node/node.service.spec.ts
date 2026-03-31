import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { NodeService } from './node.service'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { NodeSize, NodeType, TimeScale } from '@game-theory-bot/shared'

describe('NodeService', () => {
  let service: NodeService
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
        NodeService,
        DatabaseWriteService,
        { provide: getRepositoryToken(NodeEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(NodeService)
    jest.clearAllMocks()
  })

  it('should reject LARGE node with parentNodeId', async () => {
    await expect(
      service.create({
        blueprintId: 'bp1',
        type: NodeType.EVENT,
        size: NodeSize.LARGE,
        title: 'Big Node',
        timeScale: TimeScale.LONG,
        parentNodeId: 'some-parent',
      })
    ).rejects.toThrow(BadRequestException)
  })

  it('should reject SMALL node with parentNodeId pointing to a SMALL parent', async () => {
    const smallParent = { id: 'parent-id', size: NodeSize.SMALL }
    mockRepo.findOneBy.mockResolvedValue(smallParent)

    await expect(
      service.create({
        blueprintId: 'bp1',
        type: NodeType.ACTOR,
        size: NodeSize.SMALL,
        title: 'Small Node',
        timeScale: TimeScale.SHORT,
        parentNodeId: 'parent-id',
      })
    ).rejects.toThrow(BadRequestException)
  })

  it('should create SMALL node with valid LARGE parent', async () => {
    const largeParent = { id: 'parent-id', size: NodeSize.LARGE }
    mockRepo.findOneBy.mockResolvedValue(largeParent)
    const dto = {
      blueprintId: 'bp1', type: NodeType.ACTOR, size: NodeSize.SMALL,
      title: 'Small Node', timeScale: TimeScale.SHORT, parentNodeId: 'parent-id',
    }
    const entity = { id: 'new-id', ...dto, weight: 1.0, status: 'ACTIVE' }
    mockRepo.create.mockReturnValue(entity)
    mockRepo.save.mockResolvedValue(entity)

    const result = await service.create(dto)
    expect(result.id).toBe('new-id')
  })
})
