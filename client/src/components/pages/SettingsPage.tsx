import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings } from '../../services/settings.service'
import type { CanvasBackgroundVariant } from '../../services/settings.service'

/** 背景樣式選項清單 */
const BG_VARIANTS: { value: CanvasBackgroundVariant; label: string }[] = [
  { value: 'dots',  label: '點陣（預設）' },
  { value: 'lines', label: '方格' },
  { value: 'cross', label: '十字' },
  { value: 'none',  label: '空白' },
]

/** 設定頁面 — 設定 OpenRouter API URL 與 Secret Key，以及畫布外觀 */
export function SettingsPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [modelId, setModelId] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bgVariant, setBgVariant] = useState<CanvasBackgroundVariant>('dots')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [patternColor, setPatternColor] = useState('#aaaaaa')

  useEffect(() => {
    const settings = getSettings()
    setUrl(settings.openRouterUrl)
    setSecret(settings.openRouterSecret)
    setModelId(settings.modelId)
    setBgVariant(settings.canvasBackgroundVariant)
    setBgColor(settings.canvasBackgroundColor)
    setPatternColor(settings.canvasPatternColor)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveSettings({
      openRouterUrl: url.trim(),
      openRouterSecret: secret.trim(),
      modelId: modelId.trim(),
      canvasBackgroundVariant: bgVariant,
      canvasBackgroundColor: bgColor,
      canvasPatternColor: patternColor,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Settings</h1>
        <button onClick={() => navigate('/')}>← Back</button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="openrouter-url" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            OpenRouter API URL
          </label>
          <input
            id="openrouter-url"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://openrouter.ai/api/v1"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="openrouter-secret" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            OpenRouter Secret Key
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="openrouter-secret"
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="sk-or-..."
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="button" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="model-id" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Model ID
          </label>
          <input
            id="model-id"
            type="text"
            value={modelId}
            onChange={e => setModelId(e.target.value)}
            placeholder="anthropic/claude-sonnet-4"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          <small style={{ color: '#666' }}>OpenRouter model ID, e.g. anthropic/claude-sonnet-4, openai/gpt-4o</small>
        </div>

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #eee' }} />

        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>畫布外觀</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            背景樣式
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {BG_VARIANTS.map(({ value, label }) => (
              <label
                key={value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  border: `2px solid ${bgVariant === value ? '#4A90D9' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: bgVariant === value ? '#eef5ff' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="bgVariant"
                  value={value}
                  checked={bgVariant === value}
                  onChange={() => setBgVariant(value)}
                  style={{ display: 'none' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              底色
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                style={{ width: '40px', height: '36px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#666' }}>{bgColor}</span>
            </div>
          </div>

          {bgVariant !== 'none' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                圖案顏色
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={patternColor}
                  onChange={e => setPatternColor(e.target.value)}
                  style={{ width: '40px', height: '36px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
                />
                <span style={{ fontSize: '13px', color: '#666' }}>{patternColor}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="submit">Save</button>
          {saved && <span style={{ color: 'green' }}>Saved!</span>}
        </div>
      </form>
    </div>
  )
}
