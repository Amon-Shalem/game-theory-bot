import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBlueprintStore } from './blueprint.store'
import { BlueprintService } from '../services/blueprint.service'
import type { BlueprintDto } from '../types'

vi.mock('../services/blueprint.service')

const mockBlueprint: BlueprintDto = {
  id: 'bp-1',
  name: '測試藍圖',
  description: '描述',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('useBlueprintStore', () => {
  beforeEach(() => {
    // 重設 store 狀態
    useBlueprintStore.setState({ blueprints: [], isLoading: false, error: null })
    vi.clearAllMocks()
  })

  it('fetchAll 成功時更新 blueprints 並重置 isLoading', async () => {
    vi.mocked(BlueprintService.findAll).mockResolvedValue([mockBlueprint])

    await useBlueprintStore.getState().fetchAll()
    const state = useBlueprintStore.getState()

    expect(state.blueprints).toEqual([mockBlueprint])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('fetchAll 失敗時設定 error 訊息', async () => {
    vi.mocked(BlueprintService.findAll).mockRejectedValue(new Error('network'))

    await useBlueprintStore.getState().fetchAll()
    const state = useBlueprintStore.getState()

    expect(state.error).toBe('Failed to load blueprints')
    expect(state.isLoading).toBe(false)
    expect(state.blueprints).toEqual([])
  })

  it('create 將新藍圖插入列表最前方', async () => {
    useBlueprintStore.setState({ blueprints: [mockBlueprint] })
    const newBp: BlueprintDto = { ...mockBlueprint, id: 'bp-2', name: '新藍圖' }
    vi.mocked(BlueprintService.create).mockResolvedValue(newBp)

    const result = await useBlueprintStore.getState().create({ name: '新藍圖' })

    expect(result).toEqual(newBp)
    expect(useBlueprintStore.getState().blueprints[0].id).toBe('bp-2')
    expect(useBlueprintStore.getState().blueprints).toHaveLength(2)
  })

  it('remove 從列表移除指定藍圖', async () => {
    useBlueprintStore.setState({ blueprints: [mockBlueprint] })
    vi.mocked(BlueprintService.remove).mockResolvedValue(undefined as any)

    await useBlueprintStore.getState().remove('bp-1')

    expect(useBlueprintStore.getState().blueprints).toHaveLength(0)
    expect(BlueprintService.remove).toHaveBeenCalledWith('bp-1')
  })
})
