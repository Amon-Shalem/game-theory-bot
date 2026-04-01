import type { CanvasCommand } from './canvas-command'
import type { CreateNodeDto, NodeDto } from '../types'
import { NodeService } from '../services/node.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 新增節點指令
 * execute: POST /nodes -> 加入 store
 * undo: DELETE /nodes/:id -> 從 store 移除
 */
export class AddNodeCommand implements CanvasCommand {
  public readonly label: string
  private createdNode: NodeDto | null = null

  constructor(private readonly dto: CreateNodeDto) {
    this.label = `新增節點: ${dto.title}`
  }

  async execute(): Promise<void> {
    const node = await NodeService.create(this.dto)
    this.createdNode = node
    useCanvasStore.getState().addNodeToStore(node)
  }

  async undo(): Promise<void> {
    if (!this.createdNode) return
    await NodeService.remove(this.createdNode.id)
    useCanvasStore.getState().removeNodeFromStore(this.createdNode.id)
  }
}
