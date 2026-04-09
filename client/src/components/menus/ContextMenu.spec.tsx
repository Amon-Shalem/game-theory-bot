import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'
import React from 'react'

describe('ContextMenu', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    onClose.mockClear()
  })

  it('渲染 children', () => {
    render(
      <ContextMenu x={100} y={100} onClose={onClose}>
        <button>動作 A</button>
      </ContextMenu>
    )
    expect(screen.getByText('動作 A')).toBeDefined()
  })

  it('點選選單外部時呼叫 onClose', () => {
    render(
      <div>
        <ContextMenu x={100} y={100} onClose={onClose}>
          <button>動作 A</button>
        </ContextMenu>
        <div data-testid="outside">外部</div>
      </div>
    )
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalled()
  })

  it('點選選單內部不呼叫 onClose', () => {
    render(
      <ContextMenu x={100} y={100} onClose={onClose}>
        <button>動作 A</button>
      </ContextMenu>
    )
    fireEvent.mouseDown(screen.getByText('動作 A'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('x 超出視口右側時選單位置向左調整', () => {
    // jsdom 的 offsetWidth 預設為 0；透過 prototype getter spy 模擬選單寬度為 160
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(160)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
    Object.defineProperty(window, 'innerWidth', { value: 300, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true, configurable: true })

    const { container } = render(
      <ContextMenu x={280} y={100} onClose={onClose}>
        <button>動作 A</button>
      </ContextMenu>
    )

    // x=280 + width=160 > innerWidth=300 → 向左調整為 280 - 160 = 120
    const menuEl = container.firstChild as HTMLDivElement
    expect(menuEl.style.left).toBe('120px')

    vi.restoreAllMocks()
  })
})
