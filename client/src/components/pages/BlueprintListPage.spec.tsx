import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BlueprintListPage } from './BlueprintListPage'
import { useBlueprintStore } from '../../stores/blueprint.store'
import { BlueprintService } from '../../services/blueprint.service'
import React from 'react'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../services/blueprint.service')

const mockBp = {
  id: 'bp-1',
  name: '測試藍圖',
  description: '描述文字',
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
}

describe('BlueprintListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    useBlueprintStore.setState({
      blueprints: [],
      isLoading: false,
      error: null,
    })
    vi.mocked(BlueprintService.findAll).mockResolvedValue([])
    vi.mocked(BlueprintService.remove).mockResolvedValue(undefined as any)
  })

  it('載入時呼叫 fetchAll', async () => {
    vi.mocked(BlueprintService.findAll).mockResolvedValue([mockBp])
    render(<BlueprintListPage />)
    await waitFor(() => {
      expect(BlueprintService.findAll).toHaveBeenCalled()
    })
  })

  it('顯示藍圖卡片', async () => {
    useBlueprintStore.setState({ blueprints: [mockBp] })
    render(<BlueprintListPage />)
    expect(screen.getByText('測試藍圖')).toBeDefined()
    expect(screen.getByText('描述文字')).toBeDefined()
  })

  it('isLoading 時顯示載入文字', () => {
    useBlueprintStore.setState({ isLoading: true })
    render(<BlueprintListPage />)
    expect(screen.getByText('載入中...')).toBeDefined()
  })

  it('點擊 + 新增藍圖 按鈕顯示表單', () => {
    render(<BlueprintListPage />)
    fireEvent.click(screen.getByText('+ 新增藍圖'))
    expect(screen.getByPlaceholderText('藍圖名稱')).toBeDefined()
  })

  it('點擊藍圖卡片導航到畫布頁面', () => {
    useBlueprintStore.setState({ blueprints: [mockBp] })
    render(<BlueprintListPage />)
    fireEvent.click(screen.getByText('測試藍圖'))
    expect(mockNavigate).toHaveBeenCalledWith('/canvas/bp-1')
  })

  it('點擊刪除按鈕呼叫 remove 且不觸發導航', async () => {
    useBlueprintStore.setState({ blueprints: [mockBp] })
    render(<BlueprintListPage />)
    fireEvent.click(screen.getByText('刪除'))
    await waitFor(() => {
      expect(BlueprintService.remove).toHaveBeenCalledWith('bp-1')
    })
    // 刪除按鈕 stopPropagation，不應觸發卡片導航
    expect(mockNavigate).not.toHaveBeenCalledWith('/canvas/bp-1')
  })
})
