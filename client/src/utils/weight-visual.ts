export interface WeightVisual {
  opacity: number
  /** CSS transform scale，範圍 0.75~1.0 */
  scale: number
  borderWidth: number
  borderStyle: 'solid' | 'dashed'
}

/**
 * 根據節點 weight 值推算視覺樣式
 * 對應規格 § 六視覺映射：weight 驅動透明度、尺寸、邊框
 */
export function getWeightVisual(weight: number): WeightVisual {
  if (weight >= 2.0) return { opacity: 1.0, scale: 1.0,  borderWidth: 3, borderStyle: 'solid' }
  if (weight >= 1.0) return { opacity: 0.7, scale: 0.95, borderWidth: 2, borderStyle: 'solid' }
  if (weight >= 0.5) return { opacity: 0.5, scale: 0.85, borderWidth: 1, borderStyle: 'solid' }
  return                    { opacity: 0.3, scale: 0.75, borderWidth: 1, borderStyle: 'dashed' }
}
