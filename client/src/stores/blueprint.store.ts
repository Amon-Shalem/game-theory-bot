import { create } from 'zustand'
import { BlueprintDto, CreateBlueprintDto } from '../types'
import { BlueprintService } from '../services/blueprint.service'

interface BlueprintState {
  blueprints: BlueprintDto[]
  isLoading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  create: (dto: CreateBlueprintDto) => Promise<BlueprintDto>
  remove: (id: string) => Promise<void>
}

/** 藍圖列表全域狀態 */
export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprints: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const blueprints = await BlueprintService.findAll()
      set({ blueprints, isLoading: false })
    } catch (e) {
      set({ error: 'Failed to load blueprints', isLoading: false })
    }
  },

  create: async (dto) => {
    const blueprint = await BlueprintService.create(dto)
    set(state => ({ blueprints: [blueprint, ...state.blueprints] }))
    return blueprint
  },

  remove: async (id) => {
    await BlueprintService.remove(id)
    set(state => ({ blueprints: state.blueprints.filter(b => b.id !== id) }))
  },
}))
