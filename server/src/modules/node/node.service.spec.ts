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

  it('should reject MEDIUM node with parentNodeId', async () => {
    await expect(
      service.create({
        blueprintId: 'bp1',
        type: NodeType.EVENT,
        size: NodeSize.MEDIUM,
        title: 'Medium Node',
        timeScale: TimeScale.MEDIUM,
        parentNodeId: 'some-parent',
      })
    ).rejects.toThrow(BadRequestException)
  })

  it('should create SMALL node with valid MEDIUM parent', async () => {
    const mediumParent = { id: 'parent-id', size: NodeSize.MEDIUM }
    mockRepo.findOneBy.mockResolvedValue(mediumParent)
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

  describe('updatePositions', () => {
    it('依序更新所有節點的位置並回傳更新後的節點列表', async () => {
      const node1 = { id: 'n-1', positionX: 0, positionY: 0 }
      const node2 = { id: 'n-2', positionX: 0, positionY: 0 }
      const updated1 = { ...node1, positionX: 100, positionY: 200 }
      const updated2 = { ...node2, positionX: 300, positionY: 400 }

      // findOneBy 依序回傳兩個節點
      mockRepo.findOneBy.mockResolvedValueOnce(node1).mockResolvedValueOnce(node2)
      // save 依序回傳更新後的節點
      mockRepo.save.mockResolvedValueOnce(updated1).mockResolvedValueOnce(updated2)

      const result = await service.updatePositions([
        { id: 'n-1', positionX: 100, positionY: 200 },
        { id: 'n-2', positionX: 300, positionY: 400 },
      ])

      expect(mockRepo.save).toHaveBeenCalledTimes(2)
      expect(result).toEqual([updated1, updated2])
    })

    it('單一節點 id 找不到時拋出 NotFoundException', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      await expect(
        service.updatePositions([{ id: 'ghost', positionX: 0, positionY: 0 }])
      ).rejects.toThrow(NotFoundException)
    })
  })
})
