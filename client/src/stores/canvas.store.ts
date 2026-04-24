import { create } from 'zustand'
import { NodeDto, EdgeDto, CreateNodeDto, CreateEdgeDto, NodePositionItem } from '../types'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'

export type DisplayMode = 'all' | 'high-weight'

interface CanvasState {
  nodes: NodeDto[]
  edges: EdgeDto[]
  selectedNodeId: string | null
  isLoading: boolean
  /** 顯示模式：all = 顯示全部節點，high-weight = 僅顯示 weight >= 1.0 的節點 */
  displayMode: DisplayMode
  loadCanvas: (blueprintId: string) => Promise<void>
  addNode: (dto: CreateNodeDto) => Promise<void>
  removeNode: (id: string) => Promise<void>
  addEdge: (dto: CreateEdgeDto) => Promise<void>
  removeEdge: (id: string) => Promise<void>
  selectNode: (id: string | null) => void

  /** 純 state 操作：新增節點到 store（不呼叫 API） */
  addNodeToStore: (node: NodeDto) => void
  /** 純 state 操作：從 store 移除節點，不連帶移除邊（不呼叫 API） */
  removeNodeFromStore: (id: string) => void
  /** 純 state 操作：新增邊到 store（不呼叫 API） */
  addEdgeToStore: (edge: EdgeDto) => void
  /** 純 state 操作：從 store 移除邊（不呼叫 API） */
  removeEdgeFromStore: (id: string) => void
  /** 純 state 操作：更新 store 中的邊（不呼叫 API） */
  updateEdgeInStore: (edge: EdgeDto) => void
  /** 純 state 操作：批次更新節點 Canvas 位置（不呼叫 API） */
  updateNodePositionsInStore: (positions: NodePositionItem[]) => void
  /** 切換顯示模式 */
  setDisplayMode: (mode: DisplayMode) => void
}

/** 目前藍圖的畫布狀態（節點 + 連結） */
export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,
  displayMode: 'all',

  loadCanvas: async (blueprintId) => {
    set({ isLoading: true })
    const [nodes, edges] = await Promise.all([
      NodeService.findByBlueprint(blueprintId),
      EdgeService.findByBlueprint(blueprintId),
    ])
    set({ nodes, edges, isLoading: false })
  },

  addNode: async (dto) => {
    const node = await NodeService.create(dto)
    set(state => ({ nodes: [...state.nodes, node] }))
  },

  removeNode: async (id) => {
    await NodeService.remove(id)
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id),
    }))
  },

  addEdge: async (dto) => {
    const edge = await EdgeService.create(dto)
    set(state => ({ edges: [...state.edges, edge] }))
  },

  removeEdge: async (id) => {
    await EdgeService.remove(id)
    set(state => ({ edges: state.edges.filter(e => e.id !== id) }))
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  addNodeToStore: (node) => set(state => ({ nodes: [...state.nodes, node] })),

  /** 只移除節點，不連帶移除邊（邊由 Command 自行處理） */
  removeNodeFromStore: (id) => set(state => ({
    nodes: state.nodes.filter(n => n.id !== id),
  })),

  addEdgeToStore: (edge) => set(state => ({ edges: [...state.edges, edge] })),

  removeEdgeFromStore: (id) => set(state => ({
    edges: state.edges.filter(e => e.id !== id),
  })),

  updateEdgeInStore: (edge) => set(state => ({
    edges: state.edges.map(e => e.id === edge.id ? edge : e),
  })),

  setDisplayMode: (mode) => set({ displayMode: mode }),

  updateNodePositionsInStore: (positions) => set(state => {
    // 先建立 Map 以 O(m) 時間建表，讓後續每個節點查詢為 O(1)，整體降至 O(n+m)
    const posMap = new Map(positions.map(p => [p.id, p]))
    return {
      nodes: state.nodes.map(n => {
        const pos = posMap.get(n.id)
        return pos ? { ...n, positionX: pos.positionX, positionY: pos.positionY } : n
      }),
    }
  }),
}))
