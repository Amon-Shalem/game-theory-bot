import type { CanvasCommand } from './canvas-command'
import type { EdgeDto, CreateEdgeDto } from '../types'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 刪除邊指令
 * execute: DELETE /edges/:id -> 從 store 移除
 * undo: POST /edges（用快照重建）-> 加回 store
 */
export class RemoveEdgeCommand implements CanvasCommand {
  public readonly label = '刪除連結'
  private edgeSnapshot: EdgeDto | null = null

  constructor(private readonly edgeId: string) {
    const state = useCanvasStore.getState()
    this.edgeSnapshot = state.edges.find(e => e.id === edgeId) ?? null
  }

  async execute(): Promise<void> {
    await EdgeService.remove(this.edgeId)
    useCanvasStore.getState().removeEdgeFromStore(this.edgeId)
  }

  async undo(): Promise<void> {
    if (!this.edgeSnapshot) return
    const createDto: CreateEdgeDto = {
      blueprintId: this.edgeSnapshot.blueprintId,
      sourceNodeId: this.edgeSnapshot.sourceNodeId,
      targetNodeId: this.edgeSnapshot.targetNodeId,
      direction: this.edgeSnapshot.direction,
      magnitude: this.edgeSnapshot.magnitude,
      theoryIds: this.edgeSnapshot.theoryIds,
      reasoning: this.edgeSnapshot.reasoning,
    }
    const newEdge = await EdgeService.create(createDto)
    useCanvasStore.getState().addEdgeToStore(newEdge)
  }
}
