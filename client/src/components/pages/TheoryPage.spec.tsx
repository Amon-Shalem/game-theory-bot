import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TheoryPage } from './TheoryPage'
import { TheoryService } from '../../services/theory.service'
import React from 'react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))
vi.mock('../../services/theory.service')

const presetTheory = {
  id: 't-preset', name: '攻勢現實主義', promptFragment: '國家以安全最大化為目標',
  isPreset: true, tags: ['realism'], createdAt: '2026-01-01T00:00:00Z',
}
const customTheory = {
  id: 't-custom', name: '黑天鵝', promptFragment: '極端偏差事件',
  isPreset: false, tags: ['risk'], createdAt: '2026-02-01T00:00:00Z',
}

describe('TheoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(TheoryService.findAll).mockResolvedValue([presetTheory, customTheory])
  })

  it('載入後顯示預設與自訂理論', async () => {
    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('攻勢現實主義')).toBeDefined())
    expect(screen.getByText('黑天鵝')).toBeDefined()
  })

  it('預設理論不顯示編輯與刪除按鈕', async () => {
    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('攻勢現實主義')).toBeDefined())
    // 只有自訂理論有按鈕，不應有兩組
    const editBtns = screen.getAllByText('編輯')
    expect(editBtns).toHaveLength(1)
  })

  it('點擊「+ 新增理論」顯示建立表單', async () => {
    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('攻勢現實主義')).toBeDefined())
    fireEvent.click(screen.getByText('+ 新增理論'))
    expect(screen.getByText('新增理論')).toBeDefined()
    expect(screen.getByLabelText('名稱')).toBeDefined()
  })

  it('提交新增表單呼叫 TheoryService.create 並更新列表', async () => {
    const newTheory = { ...customTheory, id: 't-new', name: '新理論' }
    vi.mocked(TheoryService.create).mockResolvedValue(newTheory)

    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('黑天鵝')).toBeDefined())

    fireEvent.click(screen.getByText('+ 新增理論'))
    fireEvent.change(screen.getByLabelText('名稱'), { target: { value: '新理論' } })
    fireEvent.change(screen.getByLabelText('Prompt 片段'), { target: { value: '內容' } })
    fireEvent.click(screen.getByText('儲存'))

    await waitFor(() => expect(TheoryService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '新理論', promptFragment: '內容' })
    ))
  })

  it('點擊「編輯」顯示帶有舊值的表單', async () => {
    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('黑天鵝')).toBeDefined())
    fireEvent.click(screen.getByText('編輯'))
    expect((screen.getByLabelText('名稱') as HTMLInputElement).value).toBe('黑天鵝')
  })

  it('點擊「刪除」呼叫 TheoryService.remove 並移除卡片', async () => {
    vi.mocked(TheoryService.remove).mockResolvedValue()
    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('黑天鵝')).toBeDefined())
    fireEvent.click(screen.getByText('刪除'))
    await waitFor(() => expect(TheoryService.remove).toHaveBeenCalledWith('t-custom'))
    expect(screen.queryByText('黑天鵝')).toBeNull()
  })

  it('點擊「← 返回」導航到首頁', async () => {
    render(<TheoryPage />)
    await waitFor(() => expect(screen.getByText('← 返回')).toBeDefined())
    fireEvent.click(screen.getByText('← 返回'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
