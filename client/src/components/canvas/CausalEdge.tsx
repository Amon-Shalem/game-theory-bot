import React from 'react'
import { EdgeProps, getBezierPath } from '@xyflow/react'
import { EdgeDto, Direction } from '../../types'

const DIRECTION_COLORS: Record<Direction, string> = {
  [Direction.PROMOTES]: '#27AE60',
  [Direction.INHIBITS]: '#E74C3C',
  [Direction.NEUTRAL]: '#95A5A6',
}

/** 因果連結元件 — 顏色代表方向（綠=促進、紅=抑制、灰=中性） */
export function CausalEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  const edge = data as EdgeDto
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const color = DIRECTION_COLORS[edge?.direction] ?? '#95A5A6'

  return (
    <path
      id={id}
      d={edgePath}
      stroke={color}
      strokeWidth={2}
      fill="none"
      markerEnd={`url(#arrow-${color.replace('#', '')})`}
    />
  )
}
