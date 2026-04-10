import type { CanvasCommand } from './canvas-command'
import { NodeService } from '../services/node.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 單次拖拽的節點移動資訊
 * newX/Y：拖拽結束後的新位置
 * prevX/Y：拖拽開始前的 React Flow 位置（用於 undo 還原）
 */
export interface NodeMoveItem {
  id: string
  newX: number
  newY: number
  prevX: number
  prevY: number
}

/**
 * 批次移動節點指令（支援多選同時拖拽）
 * execute: PATCH /nodes/positions（新位置）-> 更新 store
 * undo: PATCH /nodes/positions（前一位置）-> 還原 store（同時觸發 BlueprintCanvas 同步 React Flow 位置）
 */
export class MoveNodesCommand implements CanvasCommand {
  public readonly label: string

  /**
   * @param movedItems - 每個被拖拽節點的 id 及新舊位置
   */
  constructor(private readonly movedItems: NodeMoveItem[]) {
    this.label = `移動節點 (${movedItems.length})`
  }

  async execute(): Promise<void> {
    const positions = this.movedItems.map(item => ({
      id: item.id,
      positionX: item.newX,
      positionY: item.newY,
    }))
    await NodeService.updatePositions(positions)
    useCanvasStore.getState().updateNodePositionsInStore(positions)
  }

  async undo(): Promise<void> {
    const positions = this.movedItems.map(item => ({
      id: item.id,
      positionX: item.prevX,
      positionY: item.prevY,
    }))
    await NodeService.updatePositions(positions)
    useCanvasStore.getState().updateNodePositionsInStore(positions)
  }
}
