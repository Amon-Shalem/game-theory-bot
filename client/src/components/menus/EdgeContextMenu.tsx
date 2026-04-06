import React from 'react'
import { ContextMenu } from './ContextMenu'

interface Props {
  edgeId: string
  x: number
  y: number
  onClose: () => void
  /** 「編輯連結」— 開啟 EdgeSettingsModal edit 模式 */
  onEdit: (edgeId: string) => void
  /** 「刪除連結」— 執行 RemoveEdgeCommand */
  onDelete: (edgeId: string) => void
}

const MENU_ITEM_STYLE: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 16px',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
}

/** 連結右鍵選單 */
export function EdgeContextMenu({
  edgeId,
  x,
  y,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => {
          onClose()
          onEdit(edgeId)
        }}
      >
        編輯連結
      </button>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => {
          onClose()
          onDelete(edgeId)
        }}
      >
        刪除連結
      </button>
    </ContextMenu>
  )
}
