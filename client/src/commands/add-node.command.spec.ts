import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddNodeCommand } from './add-node.command'
import { useCanvasStore } from '../stores/canvas.store'
import { NodeService } from '../services/node.service'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../types'
import type { CreateNodeDto, NodeDto } from '../types'

vi.mock('../services/node.service')

const dto: CreateNodeDto = {
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  title: 'Test Node',
  timeScale: TimeScale.MEDIUM,
}

const createdNode: NodeDto = {
  id: 'n-new',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: 'Test Node',
  description: '',
  weight: 1.0,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('AddNodeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 API 並加入 store', async () => {
    vi.mocked(NodeService.create).mockResolvedValue(createdNode)
    const cmd = new AddNodeCommand(dto)
    await cmd.execute()

    expect(NodeService.create).toHaveBeenCalledWith(dto)
    expect(useCanvasStore.getState().nodes).toEqual([createdNode])
  })

  it('undo 呼叫 DELETE API 並從 store 移除', async () => {
    vi.mocked(NodeService.create).mockResolvedValue(createdNode)
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)

    const cmd = new AddNodeCommand(dto)
    await cmd.execute()
    await cmd.undo()

    expect(NodeService.remove).toHaveBeenCalledWith('n-new')
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
  })

  it('label 包含節點標題', () => {
    const cmd = new AddNodeCommand(dto)
    expect(cmd.label).toContain('Test Node')
  })

  it('execute 失敗時不修改 store', async () => {
    vi.mocked(NodeService.create).mockRejectedValue(new Error('API error'))
    const cmd = new AddNodeCommand(dto)

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
  })
})
