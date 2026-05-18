import React from 'react'
import { ContextMenu } from './ContextMenu'
import { NodeSize } from '../../types'

interface Props {
  nodeId: string
  nodeSize: NodeSize
  x: number
  y: number
  onClose: () => void
  /** 「新增子節點」— 由 CanvasPage 處理後續狀態 */
  onAddChild: (nodeId: string) => void
  /** 「刪除節點」— 由 CanvasPage 執行 RemoveNodeCommand */
  onDelete: (nodeId: string) => void
  /** AI 展開大節點（僅 LARGE/MEDIUM 節點顯示） */
  onAIExpand?: (nodeId: string) => void
  /** AI 建議連結 */
  onAISuggestEdges?: (nodeId: string) => void
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

const DISABLED_ITEM_STYLE: React.CSSProperties = {
  ...MENU_ITEM_STYLE,
  color: '#aaa',
  cursor: 'not-allowed',
}

/** 節點右鍵選單 */
export function NodeContextMenu({
  nodeId,
  nodeSize,
  x,
  y,
  onClose,
  onAddChild,
  onDelete,
  onAIExpand,
  onAISuggestEdges,
}: Props) {
  const canExpand = nodeSize === NodeSize.LARGE || nodeSize === NodeSize.MEDIUM

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => { onClose(); onAddChild(nodeId) }}
      >
        新增子節點
      </button>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => { onClose(); onDelete(nodeId) }}
      >
        刪除節點
      </button>
      {canExpand && (
        <button
          style={onAIExpand ? MENU_ITEM_STYLE : DISABLED_ITEM_STYLE}
          disabled={!onAIExpand}
          onClick={() => { onClose(); onAIExpand?.(nodeId) }}
        >
          AI 展開
        </button>
      )}
      <button
        style={onAISuggestEdges ? MENU_ITEM_STYLE : DISABLED_ITEM_STYLE}
        disabled={!onAISuggestEdges}
        onClick={() => { onClose(); onAISuggestEdges?.(nodeId) }}
      >
        AI 建議連結
      </button>
    </ContextMenu>
  )
}
