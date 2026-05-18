import React from 'react'
import { Handle, Position, NodeProps, useStore } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'
import { getWeightVisual } from '../../utils/weight-visual'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/** 大節點連接上限：target 4 條、source 4 條，共 8 條邊 */
const LARGE_TARGET_LIMIT = 4
const LARGE_SOURCE_LIMIT = 4

/**
 * 大節點元件 — 里程碑事件
 * weight 動態驅動 opacity（視覺亮度）與 fontSize（視覺大小感知）
 * isConnectable 根據現有連線數動態計算，達上限後 Handle 變為不可連線
 */
export function LargeNode({ id, data, selected }: NodeProps) {
  const node = data as unknown as NodeDto
  const { opacity, scale, borderWidth, borderStyle } = getWeightVisual(node.weight)
  const borderColor = TYPE_COLORS[node.type] ?? '#888'

  /** 訂閱 React Flow store 的 edges，計算此節點的現有連線數 */
  const incomingCount = useStore(s => s.edges.filter(e => e.target === id).length)
  const outgoingCount = useStore(s => s.edges.filter(e => e.source === id).length)

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      padding: '12px 16px',
      border: `${borderWidth}px ${borderStyle} ${borderColor}`,
      borderRadius: '8px',
      background: 'white',
      minWidth: '140px',
      maxWidth: '220px',
      boxShadow: selected ? `0 0 8px ${borderColor}` : 'none',
      fontWeight: 'bold',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={incomingCount < LARGE_TARGET_LIMIT}
      />
      <div style={{ fontSize: '11px', color: borderColor, marginBottom: '4px' }}>{node.type}</div>
      <div style={{ fontSize: '14px' }}>{node.title}</div>
      <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
        weight: {node.weight.toFixed(2)}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={outgoingCount < LARGE_SOURCE_LIMIT}
      />
    </div>
  )
}
