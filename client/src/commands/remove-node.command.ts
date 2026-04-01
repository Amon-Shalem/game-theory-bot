import type { CanvasCommand } from './canvas-command'
import type { NodeDto, EdgeDto, CreateNodeDto, CreateEdgeDto } from '../types'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 刪除節點指令（含關聯邊快照）
 * execute: DELETE 關聯邊 + DELETE /nodes/:id -> 從 store 移除
 * undo: POST /nodes + POST 關聯邊（用快照重建）-> 加回 store
 * 注意：多步 API 呼叫無事務保障，中途失敗可能導致不同步
 */
export class RemoveNodeCommand implements CanvasCommand {
  public readonly label: string
  private nodeSnapshot: NodeDto | null = null
  private edgeSnapshots: EdgeDto[] = []

  constructor(private readonly nodeId: string) {
    const state = useCanvasStore.getState()
    const node = state.nodes.find(n => n.id === nodeId)
    this.label = `刪除節點: ${node?.title ?? nodeId}`
    // 建構時快照，以備 undo 使用
    this.nodeSnapshot = node ?? null
    this.edgeSnapshots = state.edges.filter(
      e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    )
  }

  async execute(): Promise<void> {
    const store = useCanvasStore.getState()
    // 先刪除關聯邊（API + store）
    for (const edge of this.edgeSnapshots) {
      await EdgeService.remove(edge.id)
      store.removeEdgeFromStore(edge.id)
    }
    // 再刪除節點（API + store）
    await NodeService.remove(this.nodeId)
    // removeNodeFromStore 只移除節點，不連帶移除邊（邊已在上面處理）
    store.removeNodeFromStore(this.nodeId)
  }

  async undo(): Promise<void> {
    if (!this.nodeSnapshot) return
    // 明確建構 CreateNodeDto，避免 rest spread 帶入多餘欄位
    const createNodeDto: CreateNodeDto = {
      blueprintId: this.nodeSnapshot.blueprintId,
      type: this.nodeSnapshot.type,
      size: this.nodeSnapshot.size,
      title: this.nodeSnapshot.title,
      description: this.nodeSnapshot.description,
      timeScale: this.nodeSnapshot.timeScale,
      parentNodeId: this.nodeSnapshot.parentNodeId ?? undefined,
    }
    const newNode = await NodeService.create(createNodeDto)
    useCanvasStore.getState().addNodeToStore(newNode)

    // 重建關聯邊（用新節點 ID 替換舊 ID）
    for (const edgeSnap of this.edgeSnapshots) {
      const createDto: CreateEdgeDto = {
        blueprintId: edgeSnap.blueprintId,
        sourceNodeId: edgeSnap.sourceNodeId === this.nodeId ? newNode.id : edgeSnap.sourceNodeId,
        targetNodeId: edgeSnap.targetNodeId === this.nodeId ? newNode.id : edgeSnap.targetNodeId,
        direction: edgeSnap.direction,
        magnitude: edgeSnap.magnitude,
        theoryIds: edgeSnap.theoryIds,
        reasoning: edgeSnap.reasoning,
      }
      const newEdge = await EdgeService.create(createDto)
      useCanvasStore.getState().addEdgeToStore(newEdge)
    }
  }
}
