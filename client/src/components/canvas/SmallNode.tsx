import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/** 小節點元件 — 大節點的組成部分 */
export function SmallNode({ data, selected }: NodeProps) {
  const node = data as NodeDto
  const opacity = Math.max(0.3, Math.min(1, node.weight / 3.0))
  const borderColor = TYPE_COLORS[node.type] ?? '#888'

  return (
    <div style={{
      opacity,
      padding: '8px 12px',
      border: `1px solid ${borderColor}`,
      borderRadius: '20px',
      background: 'white',
      minWidth: '100px',
      boxShadow: selected ? `0 0 6px ${borderColor}` : 'none',
    }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: '10px', color: borderColor }}>{node.type}</div>
      <div style={{ fontSize: '12px' }}>{node.title}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
