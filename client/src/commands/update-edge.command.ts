import type { CanvasCommand } from './canvas-command'
import type { EdgeDto } from '../types'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'
import type { Direction, Magnitude } from '../types'

/**
 * EdgeFormValues：UI 表單值（不含 theoryIds，由後端保留）
 */
export interface EdgeFormValues {
  direction: Direction
  magnitude: Magnitude
  reasoning: string
}

/**
 * UndoSnapshot：undo 快照，欄位皆為必填（與 UpdateEdgeDto 的 optional 欄位語義不同）。
 * theoryIds 需一同快照，確保 undo 後資料完整還原，即使 UI 不顯示此欄位。
 */
interface UndoSnapshot {
  direction: Direction
  magnitude: Magnitude
  reasoning: string
  theoryIds: string[]
}

/**
 * 更新邊指令
 * execute: PUT /edges/:id -> 更新 store
 * undo: PUT /edges/:id（使用快照） -> 還原 store
 */
export class UpdateEdgeCommand implements CanvasCommand {
  public readonly label: string
  /** undo 快照包含 theoryIds，欄位皆為必填，確保完整還原 */
  private readonly previousValues: UndoSnapshot

  constructor(
    private readonly edgeId: string,
    private readonly newValues: EdgeFormValues,
  ) {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)!
    this.label = `編輯連結: ${edge.sourceNodeId} → ${edge.targetNodeId}`
    this.previousValues = {
      direction: edge.direction,
      magnitude: edge.magnitude,
      reasoning: edge.reasoning,
      theoryIds: edge.theoryIds,
    }
  }

  async execute(): Promise<void> {
    const updated = await EdgeService.update(this.edgeId, this.newValues)
    useCanvasStore.getState().updateEdgeInStore(updated)
  }

  async undo(): Promise<void> {
    const restored = await EdgeService.update(this.edgeId, this.previousValues)
    useCanvasStore.getState().updateEdgeInStore(restored)
  }
}
