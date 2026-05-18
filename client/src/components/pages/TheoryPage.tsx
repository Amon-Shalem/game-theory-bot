import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TheoryService } from '../../services/theory.service'
import type { TheoryDto } from '../../types'

interface FormState {
  name: string
  promptFragment: string
  tags: string
}

const EMPTY_FORM: FormState = { name: '', promptFragment: '', tags: '' }

/**
 * 理論管理頁面
 * - 預設理論唯讀（isPreset = true）
 * - 自訂理論可編輯、刪除
 * - 支援新增自訂理論
 */
export function TheoryPage() {
  const navigate = useNavigate()
  const [theories, setTheories] = useState<TheoryDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  /** null = 不顯示表單；'create' = 新增；string(id) = 編輯該理論 */
  const [formMode, setFormMode] = useState<null | 'create' | string>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    TheoryService.findAll()
      .then(setTheories)
      .finally(() => setIsLoading(false))
  }, [])

  /** 將逗號分隔的 tags 字串轉為陣列（過濾空白） */
  const parseTags = (raw: string): string[] =>
    raw.split(',').map(t => t.trim()).filter(Boolean)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormMode('create')
  }

  const openEdit = (theory: TheoryDto) => {
    setForm({ name: theory.name, promptFragment: theory.promptFragment, tags: theory.tags.join(', ') })
    setFormMode(theory.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dto = { name: form.name.trim(), promptFragment: form.promptFragment.trim(), tags: parseTags(form.tags) }
    if (formMode === 'create') {
      const created = await TheoryService.create(dto)
      setTheories(prev => [...prev, created])
    } else if (formMode) {
      const updated = await TheoryService.update(formMode, dto)
      setTheories(prev => prev.map(t => t.id === formMode ? updated : t))
    }
    setFormMode(null)
    setForm(EMPTY_FORM)
  }

  const handleDelete = async (id: string) => {
    await TheoryService.remove(id)
    setTheories(prev => prev.filter(t => t.id !== id))
  }

  const preset = theories.filter(t => t.isPreset)
  const custom = theories.filter(t => !t.isPreset)

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>理論管理</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openCreate}>+ 新增理論</button>
          <button onClick={() => navigate('/')}>← 返回</button>
        </div>
      </div>

      {formMode && (
        <form
          onSubmit={handleSubmit}
          style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '24px' }}
        >
          <h3 style={{ margin: '0 0 12px' }}>{formMode === 'create' ? '新增理論' : '編輯理論'}</h3>
          <div style={{ marginBottom: '8px' }}>
            <label htmlFor="theory-name" style={{ display: 'block', marginBottom: '4px' }}>名稱</label>
            <input
              id="theory-name"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label htmlFor="theory-prompt" style={{ display: 'block', marginBottom: '4px' }}>Prompt 片段</label>
            <textarea
              id="theory-prompt"
              value={form.promptFragment}
              onChange={e => setForm(prev => ({ ...prev, promptFragment: e.target.value }))}
              required
              rows={4}
              style={{ width: '100%', padding: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="theory-tags" style={{ display: 'block', marginBottom: '4px' }}>標籤（逗號分隔）</label>
            <input
              id="theory-tags"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="例：realism, geopolitics"
              style={{ width: '100%', padding: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit">儲存</button>
            <button type="button" onClick={() => setFormMode(null)}>取消</button>
          </div>
        </form>
      )}

      {isLoading && <p>載入中…</p>}

      {preset.length > 0 && (
        <section>
          <h2 style={{ fontSize: '16px', color: '#666' }}>預設理論（唯讀）</h2>
          {preset.map(t => (
            <TheoryCard key={t.id} theory={t} readonly />
          ))}
        </section>
      )}

      {custom.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', color: '#666' }}>自訂理論</h2>
          {custom.map(t => (
            <TheoryCard key={t.id} theory={t} onEdit={() => openEdit(t)} onDelete={() => handleDelete(t.id)} />
          ))}
        </section>
      )}

      {!isLoading && theories.length === 0 && (
        <p style={{ color: '#999' }}>尚無理論。點擊「+ 新增理論」建立第一個。</p>
      )}
    </div>
  )
}

interface TheoryCardProps {
  theory: TheoryDto
  readonly?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

/** 單一理論卡片 */
function TheoryCard({ theory, readonly = false, onEdit, onDelete }: TheoryCardProps) {
  return (
    <div style={{ padding: '12px 16px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <strong>{theory.name}</strong>
          {theory.tags.length > 0 && (
            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
              {theory.tags.join(' · ')}
            </span>
          )}
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#555', whiteSpace: 'pre-wrap' }}>
            {theory.promptFragment.length > 120
              ? theory.promptFragment.slice(0, 120) + '…'
              : theory.promptFragment}
          </p>
        </div>
        {!readonly && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
            <button onClick={onEdit}>編輯</button>
            <button onClick={onDelete} style={{ color: 'red' }}>刪除</button>
          </div>
        )}
      </div>
    </div>
  )
}
