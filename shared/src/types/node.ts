/** 節點類型：行為者、事件、利益 */
export enum NodeType {
  ACTOR = 'ACTOR',
  EVENT = 'EVENT',
  INTEREST = 'INTEREST',
}

/** 節點大小：業務屬性，決定連接上限與是否可展開子節點 */
export enum NodeSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

/** 節點狀態 */
export enum NodeStatus {
  ACTIVE = 'ACTIVE',
  VALIDATED = 'VALIDATED',
  INVALIDATED = 'INVALIDATED',
}

/** 預測時間尺度，用於回顧機制的到期門檻 */
export enum TimeScale {
  SHORT = 'SHORT',   // 到期門檻：4週
  MEDIUM = 'MEDIUM', // 到期門檻：12週
  LONG = 'LONG',     // 到期門檻：52週
}

export interface NodeDto {
  id: string
  blueprintId: string
  type: NodeType
  size: NodeSize
  status: NodeStatus
  title: string
  description: string
  weight: number
  timeScale: TimeScale
  createdBy: 'user' | 'ai'
  parentNodeId: string | null
  createdAt: string
  /** Canvas 上的 X 座標；null 表示尚未拖拽定位 */
  positionX: number | null
  /** Canvas 上的 Y 座標；null 表示尚未拖拽定位 */
  positionY: number | null
}

export interface CreateNodeDto {
  blueprintId: string
  type: NodeType
  size: NodeSize
  title: string
  description?: string
  timeScale: TimeScale
  parentNodeId?: string
}

export interface UpdateNodeDto {
  title?: string
  description?: string
  timeScale?: TimeScale
  status?: NodeStatus
}

/** 批次更新位置的單一項目 */
export interface NodePositionItem {
  id: string
  positionX: number
  positionY: number
}

/** PATCH /nodes/positions 的 request body */
export type UpdateNodePositionsDto = NodePositionItem[]
