import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MoveNodesCommand } from './move-nodes.command'
import type { NodeMoveItem } from './move-nodes.command'
import { useCanvasStore } from '../stores/canvas.store'
import { NodeService } from '../services/node.service'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../types'
import type { NodeDto } from '../types'

vi.mock('../services/node.service')

const mockNode: NodeDto = {
  id: 'n-1', blueprintId: 'bp-1', type: NodeType.EVENT, size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE, title: '節點一', description: '', weight: 1.0,
  timeScale: TimeScale.MEDIUM, createdBy: 'user', parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z', positionX: 50, positionY: 80,
}

const moveItem: NodeMoveItem = {
  id: 'n-1', newX: 100, newY: 200, prevX: 50, prevY: 80,
}

describe('MoveNodesCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [mockNode], edges: [], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 updatePositions（新位置）並更新 store', async () => {
    const updatedNode = { ...mockNode, positionX: 100, positionY: 200 }
    vi.mocked(NodeService.updatePositions).mockResolvedValue([updatedNode])

    const cmd = new MoveNodesCommand([moveItem])
    await cmd.execute()

    expect(NodeService.updatePositions).toHaveBeenCalledWith([
      { id: 'n-1', positionX: 100, positionY: 200 },
    ])
    expect(useCanvasStore.getState().nodes[0].positionX).toBe(100)
    expect(useCanvasStore.getState().nodes[0].positionY).toBe(200)
  })

  it('undo 呼叫 updatePositions（舊位置）並還原 store', async () => {
    const movedNode = { ...mockNode, positionX: 100, positionY: 200 }
    vi.mocked(NodeService.updatePositions).mockResolvedValueOnce([movedNode])
    const restoredNode = { ...mockNode, positionX: 50, positionY: 80 }
    vi.mocked(NodeService.updatePositions).mockResolvedValueOnce([restoredNode])

    const cmd = new MoveNodesCommand([moveItem])
    await cmd.execute()
    await cmd.undo()

    expect(NodeService.updatePositions).toHaveBeenCalledTimes(2)
    const undoCall = vi.mocked(NodeService.updatePositions).mock.calls[1]
    expect(undoCall[0]).toEqual([{ id: 'n-1', positionX: 50, positionY: 80 }])
    expect(useCanvasStore.getState().nodes[0].positionX).toBe(50)
    expect(useCanvasStore.getState().nodes[0].positionY).toBe(80)
  })

  it('label 顯示移動節點數量', () => {
    const cmd = new MoveNodesCommand([moveItem])
    expect(cmd.label).toContain('1')
  })

  it('execute 失敗時 store 不被更新', async () => {
    vi.mocked(NodeService.updatePositions).mockRejectedValue(new Error('API error'))
    const cmd = new MoveNodesCommand([moveItem])

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().nodes[0].positionX).toBe(50)
  })
})
