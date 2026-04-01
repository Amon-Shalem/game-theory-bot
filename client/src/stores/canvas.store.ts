import { create } from 'zustand'
import { NodeDto, EdgeDto, CreateNodeDto, CreateEdgeDto } from '../types'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'

interface CanvasState {
  nodes: NodeDto[]
  edges: EdgeDto[]
  selectedNodeId: string | null
  isLoading: boolean
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
}

/** 目前藍圖的畫布狀態（節點 + 連結） */
export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,

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
}))
