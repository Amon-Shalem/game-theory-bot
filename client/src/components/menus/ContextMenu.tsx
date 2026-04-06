import React, { useEffect, useRef, useState } from 'react'

interface Props {
  x: number
  y: number
  onClose: () => void
  children: React.ReactNode
}

/**
 * 通用右鍵選單容器
 * - fixed 定位於滑鼠座標
 * - 掛載後自動計算是否超出視口並調整位置
 * - 點選選單外部自動關閉
 */
export function ContextMenu({ x, y, onClose, children }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })
  const [visible, setVisible] = useState(false)

  // 計算位置是否超出視口
  useEffect(() => {
    if (!menuRef.current) return
    const { offsetWidth, offsetHeight } = menuRef.current
    const adjustedX = x + offsetWidth > window.innerWidth ? x - offsetWidth : x
    const adjustedY = y + offsetHeight > window.innerHeight ? y - offsetHeight : y
    setPosition({ x: adjustedX, y: adjustedY })
    setVisible(true)
  }, [x, y])

  // 監聽點選外部以關閉
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 2000,
        minWidth: '160px',
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  )
}
