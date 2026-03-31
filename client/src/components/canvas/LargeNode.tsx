import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/**
 * 大節點元件 — 里程碑事件
 * weight 動態驅動 opacity（視覺亮度）與 fontSize（視覺大小感知）
 */
export function LargeNode({ data, selected }: NodeProps) {
  const node = data as NodeDto
  const opacity = Math.max(0.3, Math.min(1, node.weight / 3.0))
  const borderColor = TYPE_COLORS[node.type] ?? '#888'

  return (
    <div style={{
      opacity,
      padding: '12px 16px',
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      background: 'white',
      minWidth: '140px',
      maxWidth: '220px',
      boxShadow: selected ? `0 0 8px ${borderColor}` : 'none',
      fontWeight: 'bold',
    }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: '11px', color: borderColor, marginBottom: '4px' }}>{node.type}</div>
      <div style={{ fontSize: '14px' }}>{node.title}</div>
      <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
        weight: {node.weight.toFixed(2)}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
