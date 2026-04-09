/** 節點類型：行為者、事件、利益 */
export enum NodeType {
  ACTOR = 'ACTOR',
  EVENT = 'EVENT',
  INTEREST = 'INTEREST',
}

/** 節點大小：業務屬性，決定是否可展開子節點 */
export enum NodeSize {
  SMALL = 'SMALL',
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
