import React from 'react'
import { Handle, Position, NodeProps, useStore } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'
import { getWeightVisual } from '../../utils/weight-visual'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/** 小節點連接上限：target 1 條、source 1 條，共 2 條邊 */
const SMALL_TARGET_LIMIT = 1
const SMALL_SOURCE_LIMIT = 1

/**
 * 小節點元件 — 大節點的組成部分
 * isConnectable 根據現有連線數動態計算，達上限後 Handle 變為不可連線
 */
export function SmallNode({ id, data, selected }: NodeProps) {
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
      padding: '8px 12px',
      border: `${borderWidth}px ${borderStyle} ${borderColor}`,
      borderRadius: '20px',
      background: 'white',
      minWidth: '100px',
      boxShadow: selected ? `0 0 6px ${borderColor}` : 'none',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={incomingCount < SMALL_TARGET_LIMIT}
      />
      <div style={{ fontSize: '10px', color: borderColor }}>{node.type}</div>
      <div style={{ fontSize: '12px' }}>{node.title}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={outgoingCount < SMALL_SOURCE_LIMIT}
      />
    </div>
  )
}
