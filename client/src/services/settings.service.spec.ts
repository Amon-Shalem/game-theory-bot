import { describe, it, expect, beforeEach } from 'vitest'
import { getSettings, saveSettings, clearSettings } from './settings.service'

describe('settings.service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getSettings 無資料時回傳預設值', () => {
    const settings = getSettings()
    expect(settings.openRouterUrl).toBe('https://openrouter.ai/api/v1')
    expect(settings.openRouterSecret).toBe('')
    expect(settings.modelId).toBe('anthropic/claude-sonnet-4')
  })

  it('saveSettings 儲存後 getSettings 可讀取', () => {
    saveSettings({ openRouterUrl: 'https://custom.api/v1', openRouterSecret: 'sk-test-123', modelId: 'openai/gpt-4o' })
    const settings = getSettings()
    expect(settings.openRouterUrl).toBe('https://custom.api/v1')
    expect(settings.openRouterSecret).toBe('sk-test-123')
    expect(settings.modelId).toBe('openai/gpt-4o')
  })

  it('clearSettings 清除後回傳預設值', () => {
    saveSettings({ openRouterUrl: 'https://custom.api/v1', openRouterSecret: 'sk-test', modelId: 'openai/gpt-4o' })
    clearSettings()
    const settings = getSettings()
    expect(settings.openRouterUrl).toBe('https://openrouter.ai/api/v1')
    expect(settings.openRouterSecret).toBe('')
    expect(settings.modelId).toBe('anthropic/claude-sonnet-4')
  })

  it('getSettings 處理損壞的 JSON 回傳預設值', () => {
    localStorage.setItem('gtb-settings', '{invalid json}')
    const settings = getSettings()
    expect(settings.openRouterUrl).toBe('https://openrouter.ai/api/v1')
  })

  it('getSettings 缺少部分欄位時補上預設值', () => {
    localStorage.setItem('gtb-settings', JSON.stringify({ openRouterUrl: 'https://my-api.com' }))
    const settings = getSettings()
    expect(settings.openRouterUrl).toBe('https://my-api.com')
    expect(settings.openRouterSecret).toBe('')
    expect(settings.modelId).toBe('anthropic/claude-sonnet-4')
  })
})
