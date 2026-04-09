import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlueprintStore } from '../../stores/blueprint.store'

/** 首頁 — 顯示所有藍圖的卡片列表，支援新增與刪除 */
export function BlueprintListPage() {
  const navigate = useNavigate()
  const { blueprints, isLoading, fetchAll, create, remove } = useBlueprintStore()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const bp = await create({ name: newName.trim(), description: newDesc.trim() })
    setNewName('')
    setNewDesc('')
    setShowForm(false)
    navigate(`/canvas/${bp.id}`)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Game Theory Bot</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowForm(true)}>+ 新增藍圖</button>
          <button onClick={() => navigate('/settings')}>Settings</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ margin: '16px 0', padding: '16px', border: '1px solid #ccc' }}>
          <input
            placeholder="藍圖名稱"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <input
            placeholder="描述（選填）"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button type="submit">建立</button>
          <button type="button" onClick={() => setShowForm(false)}>取消</button>
        </form>
      )}

      {isLoading && <p>載入中...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {blueprints.map(bp => (
          <div
            key={bp.id}
            style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => navigate(`/canvas/${bp.id}`)}
          >
            <h3>{bp.name}</h3>
            {bp.description && <p>{bp.description}</p>}
            <small>建立：{new Date(bp.createdAt).toLocaleDateString('zh-TW')}</small>
            <button
              onClick={e => { e.stopPropagation(); remove(bp.id) }}
              style={{ float: 'right' }}
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
