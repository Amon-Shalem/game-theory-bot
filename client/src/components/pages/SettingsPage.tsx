import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings } from '../../services/settings.service'

/** 設定頁面 — 設定 OpenRouter API URL 與 Secret Key */
export function SettingsPage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [modelId, setModelId] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const settings = getSettings()
    setUrl(settings.openRouterUrl)
    setSecret(settings.openRouterSecret)
    setModelId(settings.modelId)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveSettings({ openRouterUrl: url.trim(), openRouterSecret: secret.trim(), modelId: modelId.trim() })
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

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="submit">Save</button>
          {saved && <span style={{ color: 'green' }}>Saved!</span>}
        </div>
      </form>
    </div>
  )
}
