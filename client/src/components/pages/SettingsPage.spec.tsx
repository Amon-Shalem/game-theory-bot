import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsPage } from './SettingsPage'
import { getSettings, saveSettings } from '../../services/settings.service'
import React from 'react'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../services/settings.service', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    vi.mocked(getSettings).mockReturnValue({
      openRouterUrl: 'https://openrouter.ai/api/v1',
      openRouterSecret: '',
      modelId: 'anthropic/claude-sonnet-4',
    })
  })

  it('渲染 URL、Secret 和 Model ID 輸入欄位', () => {
    render(<SettingsPage />)
    expect(screen.getByLabelText('OpenRouter API URL')).toBeDefined()
    expect(screen.getByLabelText('OpenRouter Secret Key')).toBeDefined()
    expect(screen.getByLabelText('Model ID')).toBeDefined()
  })

  it('載入時從 getSettings 讀取既有值', () => {
    vi.mocked(getSettings).mockReturnValue({
      openRouterUrl: 'https://custom.api/v1',
      openRouterSecret: 'sk-existing',
      modelId: 'openai/gpt-4o',
    })
    render(<SettingsPage />)
    expect((screen.getByLabelText('OpenRouter API URL') as HTMLInputElement).value).toBe('https://custom.api/v1')
    expect((screen.getByLabelText('OpenRouter Secret Key') as HTMLInputElement).value).toBe('sk-existing')
    expect((screen.getByLabelText('Model ID') as HTMLInputElement).value).toBe('openai/gpt-4o')
  })

  it('Secret 預設為 password 類型', () => {
    render(<SettingsPage />)
    expect((screen.getByLabelText('OpenRouter Secret Key') as HTMLInputElement).type).toBe('password')
  })

  it('點擊 Show 切換 Secret 顯示', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Show'))
    expect((screen.getByLabelText('OpenRouter Secret Key') as HTMLInputElement).type).toBe('text')
    expect(screen.getByText('Hide')).toBeDefined()
  })

  it('點擊 Save 呼叫 saveSettings 並顯示成功提示', async () => {
    render(<SettingsPage />)
    fireEvent.change(screen.getByLabelText('OpenRouter API URL'), { target: { value: 'https://new.api' } })
    fireEvent.change(screen.getByLabelText('OpenRouter Secret Key'), { target: { value: 'sk-new' } })
    fireEvent.change(screen.getByLabelText('Model ID'), { target: { value: 'openai/gpt-4o' } })
    fireEvent.click(screen.getByText('Save'))

    expect(saveSettings).toHaveBeenCalledWith({
      openRouterUrl: 'https://new.api',
      openRouterSecret: 'sk-new',
      modelId: 'openai/gpt-4o',
    })
    expect(screen.getByText('Saved!')).toBeDefined()
  })

  it('點擊 Back 導航回首頁', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('← Back'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
