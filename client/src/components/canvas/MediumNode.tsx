import React from 'react'
import { Handle, Position, NodeProps, useStore } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'
import { getWeightVisual } from '../../utils/weight-visual'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/** 中節點連接上限：target 2 條、source 2 條，共 4 條邊 */
const MEDIUM_TARGET_LIMIT = 2
const MEDIUM_SOURCE_LIMIT = 2

/**
 * 中節點元件 — 連接上限共 4 條邊
 * isConnectable 根據現有連線數動態計算，達上限後 Handle 變為不可連線
 */
export function MediumNode({ id, data, selected }: NodeProps) {
  const node = data as unknown as NodeDto
  const { opacity, scale, borderWidth, borderStyle } = getWeightVisual(node.weight)
  const borderColor = TYPE_COLORS[node.type] ?? '#888'

  const incomingCount = useStore(s => s.edges.filter(e => e.target === id).length)
  const outgoingCount = useStore(s => s.edges.filter(e => e.source === id).length)

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      padding: '10px 14px',
      border: `${borderWidth}px ${borderStyle} ${borderColor}`,
      borderRadius: '6px',
      background: '#fafafa',
      minWidth: '120px',
      maxWidth: '200px',
      boxShadow: selected ? `0 0 8px ${borderColor}` : 'none',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={incomingCount < MEDIUM_TARGET_LIMIT}
      />
      <div style={{ fontSize: '10px', color: borderColor, marginBottom: '4px' }}>{node.type}</div>
      <div style={{ fontSize: '13px', fontWeight: 500 }}>{node.title}</div>
      <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
        weight: {node.weight.toFixed(2)}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={outgoingCount < MEDIUM_SOURCE_LIMIT}
      />
    </div>
  )
}
