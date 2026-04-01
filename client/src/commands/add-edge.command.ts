import type { CanvasCommand } from './canvas-command'
import type { CreateEdgeDto, EdgeDto } from '../types'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 新增邊指令
 * execute: POST /edges -> 加入 store
 * undo: DELETE /edges/:id -> 從 store 移除
 */
export class AddEdgeCommand implements CanvasCommand {
  public readonly label = '新增連結'
  private createdEdge: EdgeDto | null = null

  constructor(private readonly dto: CreateEdgeDto) {}

  async execute(): Promise<void> {
    const edge = await EdgeService.create(this.dto)
    this.createdEdge = edge
    useCanvasStore.getState().addEdgeToStore(edge)
  }

  async undo(): Promise<void> {
    if (!this.createdEdge) return
    await EdgeService.remove(this.createdEdge.id)
    useCanvasStore.getState().removeEdgeFromStore(this.createdEdge.id)
  }
}
