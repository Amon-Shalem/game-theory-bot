/** 因果方向 */
export enum Direction {
  PROMOTES = 'PROMOTES',
  INHIBITS = 'INHIBITS',
  NEUTRAL = 'NEUTRAL',
}

/** 影響程度 */
export enum Magnitude {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export interface EdgeDto {
  id: string
  blueprintId: string
  sourceNodeId: string
  targetNodeId: string
  theoryIds: string[]
  direction: Direction
  magnitude: Magnitude
  reasoning: string
  createdBy: 'user' | 'ai'
}

export interface CreateEdgeDto {
  blueprintId: string
  sourceNodeId: string
  targetNodeId: string
  theoryIds?: string[]
  direction: Direction
  magnitude: Magnitude
  reasoning?: string
}

export interface UpdateEdgeDto {
  theoryIds?: string[]
  direction?: Direction
  magnitude?: Magnitude
  reasoning?: string
}
