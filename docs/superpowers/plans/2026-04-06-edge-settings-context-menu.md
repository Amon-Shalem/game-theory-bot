# Edge Settings Modal + Context Menu 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 補完畫布操作 UX：建立 / 編輯 Edge 時可設定 direction / magnitude / reasoning，並透過右鍵選單操作節點與連結。

**Architecture:** Command Pattern 延伸（新增 UpdateEdgeCommand）；所有 Modal / ContextMenu 狀態集中在 CanvasPage，BlueprintCanvas 透過 callback prop 向上通知事件，不自行管理 UI 狀態。

**Tech Stack:** React, Zustand, React Flow, Vitest, @testing-library/react

---

## 檔案清單

| 動作 | 路徑 | 說明 |
|------|------|------|
| 修改 | `client/src/stores/canvas.store.ts` | 新增 `updateEdgeInStore` 方法 |
| 修改 | `client/src/stores/canvas.store.spec.ts` | 新增對應測試 |
| 新增 | `client/src/commands/update-edge.command.ts` | UpdateEdgeCommand |
| 新增 | `client/src/commands/update-edge.command.spec.ts` | UpdateEdgeCommand 測試 |
| 修改 | `client/src/commands/index.ts` | 匯出 UpdateEdgeCommand |
| 新增 | `client/src/components/modals/EdgeSettingsModal.tsx` | 建立/編輯 Edge 表單 Modal |
| 新增 | `client/src/components/modals/EdgeSettingsModal.spec.tsx` | Modal 測試 |
| 新增 | `client/src/components/menus/ContextMenu.tsx` | 通用右鍵選單容器 |
| 新增 | `client/src/components/menus/ContextMenu.spec.tsx` | ContextMenu 測試 |
| 新增 | `client/src/components/menus/NodeContextMenu.tsx` | 節點右鍵選單項目 |
| 新增 | `client/src/components/menus/NodeContextMenu.spec.tsx` | NodeContextMenu 測試 |
| 新增 | `client/src/components/menus/EdgeContextMenu.tsx` | 連結右鍵選單項目 |
| 新增 | `client/src/components/menus/EdgeContextMenu.spec.tsx` | EdgeContextMenu 測試 |
| 修改 | `client/src/components/canvas/BlueprintCanvas.tsx` | 新增 callback props |
| 修改 | `client/src/components/pages/CanvasPage.tsx` | 整合所有新狀態與元件 |
| 修改 | `client/src/components/pages/CanvasPage.spec.tsx` | 補充整合測試 |

---

## Task 1：canvas.store 新增 updateEdgeInStore

**Files:**
- Modify: `client/src/stores/canvas.store.ts`
- Modify: `client/src/stores/canvas.store.spec.ts`

- [ ] **Step 1：在 canvas.store.spec.ts 新增測試**

在現有 `describe('CanvasState')` 的最後加入：

```typescript
it('updateEdgeInStore 替換 store 中對應的 edge', () => {
  const existingEdge: EdgeDto = {
    id: 'e-1', blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
    theoryIds: [], direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM,
    reasoning: '', createdBy: 'user',
  }
  useCanvasStore.setState({ edges: [existingEdge] })
  const updated: EdgeDto = { ...existingEdge, direction: Direction.INHIBITS, magnitude: Magnitude.LARGE }
  useCanvasStore.getState().updateEdgeInStore(updated)
  expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.INHIBITS)
  expect(useCanvasStore.getState().edges[0].magnitude).toBe(Magnitude.LARGE)
})
```

- [ ] **Step 2：確認測試失敗**

```bash
cd client && npx vitest run src/stores/canvas.store.spec.ts
```

預期：FAIL（updateEdgeInStore is not a function）

- [ ] **Step 3：在 canvas.store.ts 新增介面宣告與實作**

在 `CanvasState` interface 的 `removeEdgeFromStore` 後加入：

```typescript
/** 純 state 操作：更新 store 中的邊（不呼叫 API） */
updateEdgeInStore: (edge: EdgeDto) => void
```

在 `create<CanvasState>` 實作的 `removeEdgeFromStore` 後加入：

```typescript
updateEdgeInStore: (edge) => set(state => ({
  edges: state.edges.map(e => e.id === edge.id ? edge : e),
})),
```

- [ ] **Step 4：確認測試通過**

```bash
cd client && npx vitest run src/stores/canvas.store.spec.ts
```

預期：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add client/src/stores/canvas.store.ts client/src/stores/canvas.store.spec.ts
git commit -m "feat(store): add updateEdgeInStore to canvas store"
```

---

## Task 2：UpdateEdgeCommand

**Files:**
- Create: `client/src/commands/update-edge.command.ts`
- Create: `client/src/commands/update-edge.command.spec.ts`
- Modify: `client/src/commands/index.ts`

### EdgeFormValues 型別說明

`EdgeFormValues` 是本地使用的 UI 表單型別（direction / magnitude / reasoning），與 shared 的 `UpdateEdgeDto` 相比少了 `theoryIds`。Command 內部的 undo 快照使用 `UpdateEdgeDto` 以保留 `theoryIds`。

- [ ] **Step 1：新增測試檔案 `client/src/commands/update-edge.command.spec.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateEdgeCommand } from './update-edge.command'
import type { EdgeFormValues } from './update-edge.command'
import { useCanvasStore } from '../stores/canvas.store'
import { EdgeService } from '../services/edge.service'
import { Direction, Magnitude } from '../types'
import type { EdgeDto } from '../types'

vi.mock('../services/edge.service')

const existingEdge: EdgeDto = {
  id: 'e-1', blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
  theoryIds: ['t-1'], direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM,
  reasoning: '原始理由', createdBy: 'user',
}

const newValues: EdgeFormValues = {
  direction: Direction.INHIBITS,
  magnitude: Magnitude.LARGE,
  reasoning: '新理由',
}

const updatedEdge: EdgeDto = {
  ...existingEdge,
  direction: Direction.INHIBITS,
  magnitude: Magnitude.LARGE,
  reasoning: '新理由',
}

describe('UpdateEdgeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [existingEdge], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 API 並更新 store', async () => {
    vi.mocked(EdgeService.update).mockResolvedValue(updatedEdge)
    const cmd = new UpdateEdgeCommand('e-1', newValues)
    await cmd.execute()

    expect(EdgeService.update).toHaveBeenCalledWith('e-1', newValues)
    expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.INHIBITS)
  })

  it('undo 還原為舊值（包含 theoryIds）', async () => {
    vi.mocked(EdgeService.update).mockResolvedValueOnce(updatedEdge)
    const restoredEdge: EdgeDto = { ...existingEdge }
    vi.mocked(EdgeService.update).mockResolvedValueOnce(restoredEdge)

    const cmd = new UpdateEdgeCommand('e-1', newValues)
    await cmd.execute()
    await cmd.undo()

    expect(EdgeService.update).toHaveBeenCalledTimes(2)
    const secondCall = vi.mocked(EdgeService.update).mock.calls[1]
    expect(secondCall[1]).toMatchObject({
      direction: Direction.PROMOTES,
      magnitude: Magnitude.MEDIUM,
      reasoning: '原始理由',
      theoryIds: ['t-1'],
    })
    expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.PROMOTES)
  })

  it('execute 失敗時 store 不被更新', async () => {
    vi.mocked(EdgeService.update).mockRejectedValue(new Error('API error'))
    const cmd = new UpdateEdgeCommand('e-1', newValues)

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().edges[0].direction).toBe(Direction.PROMOTES)
  })

  it('label 包含 sourceNodeId 和 targetNodeId', () => {
    const cmd = new UpdateEdgeCommand('e-1', newValues)
    expect(cmd.label).toContain('n-1')
    expect(cmd.label).toContain('n-2')
  })
})
```

- [ ] **Step 2：確認測試失敗**

```bash
cd client && npx vitest run src/commands/update-edge.command.spec.ts
```

預期：FAIL（Cannot find module）

- [ ] **Step 3：新增 `client/src/commands/update-edge.command.ts`**

注意：`EdgeFormValues` 需同步加入 `client/src/types/index.ts` 的重新匯出，或直接在此定義為本地介面。由於 shared 沒有此型別，在此定義為本地介面。

```typescript
import type { CanvasCommand } from './canvas-command'
import type { EdgeDto } from '../types'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'
import type { Direction, Magnitude } from '../types'

/**
 * EdgeFormValues：UI 表單值（不含 theoryIds，由後端保留）
 */
export interface EdgeFormValues {
  direction: Direction
  magnitude: Magnitude
  reasoning: string
}

/**
 * UndoSnapshot：undo 快照，欄位皆為必填（與 UpdateEdgeDto 的 optional 欄位語義不同）。
 * theoryIds 需一同快照，確保 undo 後資料完整還原，即使 UI 不顯示此欄位。
 */
interface UndoSnapshot {
  direction: Direction
  magnitude: Magnitude
  reasoning: string
  theoryIds: string[]
}

/**
 * 更新邊指令
 * execute: PUT /edges/:id -> 更新 store
 * undo: PUT /edges/:id（使用快照） -> 還原 store
 */
export class UpdateEdgeCommand implements CanvasCommand {
  public readonly label: string
  /** undo 快照包含 theoryIds，欄位皆為必填，確保完整還原 */
  private readonly previousValues: UndoSnapshot

  constructor(
    private readonly edgeId: string,
    private readonly newValues: EdgeFormValues,
  ) {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)!
    this.label = `編輯連結: ${edge.sourceNodeId} → ${edge.targetNodeId}`
    this.previousValues = {
      direction: edge.direction,
      magnitude: edge.magnitude,
      reasoning: edge.reasoning,
      theoryIds: edge.theoryIds,
    }
  }

  async execute(): Promise<void> {
    const updated = await EdgeService.update(this.edgeId, this.newValues)
    useCanvasStore.getState().updateEdgeInStore(updated)
  }

  async undo(): Promise<void> {
    const restored = await EdgeService.update(this.edgeId, this.previousValues)
    useCanvasStore.getState().updateEdgeInStore(restored)
  }
}
```

- [ ] **Step 4：將 UpdateEdgeCommand 加入 barrel export**

在 `client/src/commands/index.ts` 加入：

```typescript
export { UpdateEdgeCommand } from './update-edge.command'
export type { EdgeFormValues } from './update-edge.command'
```

- [ ] **Step 5：確認測試通過**

```bash
cd client && npx vitest run src/commands/update-edge.command.spec.ts
```

預期：全部 PASS

- [ ] **Step 6：Commit**

```bash
git add client/src/commands/update-edge.command.ts client/src/commands/update-edge.command.spec.ts client/src/commands/index.ts
git commit -m "feat(commands): add UpdateEdgeCommand with undo support"
```

---

## Task 3：EdgeSettingsModal

**Files:**
- Create: `client/src/components/modals/EdgeSettingsModal.tsx`
- Create: `client/src/components/modals/EdgeSettingsModal.spec.tsx`

- [ ] **Step 1：新增測試檔案 `client/src/components/modals/EdgeSettingsModal.spec.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EdgeSettingsModal } from './EdgeSettingsModal'
import { Direction, Magnitude } from '../../types'
import type { EdgeFormValues } from '../../commands'
import React from 'react'

describe('EdgeSettingsModal', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  it('create 模式以預設值渲染', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByText('新增連結')).toBeDefined()
    const dirSelect = screen.getByLabelText('方向') as HTMLSelectElement
    expect(dirSelect.value).toBe(Direction.PROMOTES)
    const magSelect = screen.getByLabelText('強度') as HTMLSelectElement
    expect(magSelect.value).toBe(Magnitude.MEDIUM)
  })

  it('edit 模式帶入 initialValues', () => {
    const initialValues: EdgeFormValues = {
      direction: Direction.INHIBITS,
      magnitude: Magnitude.LARGE,
      reasoning: '測試理由',
    }
    render(
      <EdgeSettingsModal
        mode="edit"
        initialValues={initialValues}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(screen.getByText('編輯連結')).toBeDefined()
    const dirSelect = screen.getByLabelText('方向') as HTMLSelectElement
    expect(dirSelect.value).toBe(Direction.INHIBITS)
    const reasoningInput = screen.getByLabelText('理由') as HTMLTextAreaElement
    expect(reasoningInput.value).toBe('測試理由')
  })

  it('submit 呼叫 onConfirm 帶正確值', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    const dirSelect = screen.getByLabelText('方向')
    fireEvent.change(dirSelect, { target: { value: Direction.NEUTRAL } })
    fireEvent.click(screen.getByText('確認'))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ direction: Direction.NEUTRAL })
    )
  })

  it('取消按鈕呼叫 onCancel', () => {
    render(<EdgeSettingsModal mode="create" onConfirm={onConfirm} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2：確認測試失敗**

```bash
cd client && npx vitest run src/components/modals/EdgeSettingsModal.spec.tsx
```

預期：FAIL（Cannot find module）

- [ ] **Step 3：新增 `client/src/components/modals/EdgeSettingsModal.tsx`**

```typescript
import React, { useState } from 'react'
import { Direction, Magnitude } from '../../types'
import type { EdgeFormValues } from '../../commands'

interface Props {
  mode: 'create' | 'edit'
  /** edit 模式必須提供；create 模式可省略 */
  initialValues?: EdgeFormValues
  onConfirm: (values: EdgeFormValues) => void
  onCancel: () => void
}

const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.PROMOTES]: '促進',
  [Direction.INHIBITS]: '抑制',
  [Direction.NEUTRAL]: '中性',
}

const MAGNITUDE_LABELS: Record<Magnitude, string> = {
  [Magnitude.SMALL]: '低',
  [Magnitude.MEDIUM]: '中',
  [Magnitude.LARGE]: '高',
}

const DEFAULT_VALUES: EdgeFormValues = {
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
}

/**
 * Edge 設定 Modal — 建立或編輯連結的表單
 * 本身不呼叫 API，僅收集表單值後呼叫 onConfirm
 */
export function EdgeSettingsModal({ mode, initialValues, onConfirm, onCancel }: Props) {
  const [values, setValues] = useState<EdgeFormValues>(initialValues ?? DEFAULT_VALUES)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(values)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '320px' }}
      >
        <h3 style={{ margin: '0 0 16px' }}>{mode === 'create' ? '新增連結' : '編輯連結'}</h3>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="edge-direction">方向</label>
          <select
            id="edge-direction"
            aria-label="方向"
            value={values.direction}
            onChange={e => setValues(prev => ({ ...prev, direction: e.target.value as Direction }))}
            style={{ display: 'block', width: '100%', marginTop: '4px' }}
          >
            {Object.values(Direction).map(d => (
              <option key={d} value={d}>{DIRECTION_LABELS[d]}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="edge-magnitude">強度</label>
          <select
            id="edge-magnitude"
            aria-label="強度"
            value={values.magnitude}
            onChange={e => setValues(prev => ({ ...prev, magnitude: e.target.value as Magnitude }))}
            style={{ display: 'block', width: '100%', marginTop: '4px' }}
          >
            {Object.values(Magnitude).map(m => (
              <option key={m} value={m}>{MAGNITUDE_LABELS[m]}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="edge-reasoning">理由</label>
          <textarea
            id="edge-reasoning"
            aria-label="理由"
            value={values.reasoning}
            onChange={e => setValues(prev => ({ ...prev, reasoning: e.target.value }))}
            style={{ display: 'block', width: '100%', marginTop: '4px', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel}>取消</button>
          <button type="submit">確認</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4：確認測試通過**

```bash
cd client && npx vitest run src/components/modals/EdgeSettingsModal.spec.tsx
```

預期：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add client/src/components/modals/EdgeSettingsModal.tsx client/src/components/modals/EdgeSettingsModal.spec.tsx
git commit -m "feat(modal): add EdgeSettingsModal for create/edit edge"
```

---

## Task 4：ContextMenu 通用容器

**Files:**
- Create: `client/src/components/menus/ContextMenu.tsx`
- Create: `client/src/components/menus/ContextMenu.spec.tsx`

- [ ] **Step 1：新增測試檔案 `client/src/components/menus/ContextMenu.spec.tsx`**

```typescript
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
```

- [ ] **Step 2：確認測試失敗**

```bash
cd client && npx vitest run src/components/menus/ContextMenu.spec.tsx
```

預期：FAIL（Cannot find module）

- [ ] **Step 3：新增 `client/src/components/menus/ContextMenu.tsx`**

```typescript
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
```

- [ ] **Step 4：確認測試通過**

```bash
cd client && npx vitest run src/components/menus/ContextMenu.spec.tsx
```

預期：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add client/src/components/menus/ContextMenu.tsx client/src/components/menus/ContextMenu.spec.tsx
git commit -m "feat(menu): add ContextMenu component with viewport overflow handling"
```

---

## Task 5：NodeContextMenu

**Files:**
- Create: `client/src/components/menus/NodeContextMenu.tsx`
- Create: `client/src/components/menus/NodeContextMenu.spec.tsx`

- [ ] **Step 1：新增測試檔案 `client/src/components/menus/NodeContextMenu.spec.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeContextMenu } from './NodeContextMenu'
import { NodeSize } from '../../types'
import React from 'react'

// Mock ContextMenu 簡化測試
vi.mock('./ContextMenu', () => ({
  ContextMenu: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="context-menu">
      {children}
      <button data-testid="close" onClick={onClose}>close</button>
    </div>
  ),
}))

describe('NodeContextMenu', () => {
  const baseProps = {
    nodeId: 'n-1',
    nodeSize: NodeSize.LARGE,
    x: 100,
    y: 100,
    onClose: vi.fn(),
    onAddChild: vi.fn(),
    onDelete: vi.fn(),
  }

  it('渲染「新增子節點」和「刪除節點」按鈕', () => {
    render(<NodeContextMenu {...baseProps} />)
    expect(screen.getByText('新增子節點')).toBeDefined()
    expect(screen.getByText('刪除節點')).toBeDefined()
  })

  it('nodeSize 為 LARGE 時顯示「AI 展開」（disabled）', () => {
    render(<NodeContextMenu {...baseProps} nodeSize={NodeSize.LARGE} />)
    const aiBtn = screen.getByText('AI 展開') as HTMLButtonElement
    expect(aiBtn.disabled).toBe(true)
  })

  it('nodeSize 為 SMALL 時不顯示「AI 展開」', () => {
    render(<NodeContextMenu {...baseProps} nodeSize={NodeSize.SMALL} />)
    expect(screen.queryByText('AI 展開')).toBeNull()
  })

  it('點擊「新增子節點」呼叫 onAddChild 並關閉', () => {
    render(<NodeContextMenu {...baseProps} />)
    fireEvent.click(screen.getByText('新增子節點'))
    expect(baseProps.onClose).toHaveBeenCalled()
    expect(baseProps.onAddChild).toHaveBeenCalledWith('n-1')
  })

  it('點擊「刪除節點」呼叫 onDelete', () => {
    render(<NodeContextMenu {...baseProps} />)
    fireEvent.click(screen.getByText('刪除節點'))
    expect(baseProps.onDelete).toHaveBeenCalledWith('n-1')
  })
})
```

- [ ] **Step 2：確認測試失敗**

```bash
cd client && npx vitest run src/components/menus/NodeContextMenu.spec.tsx
```

預期：FAIL（Cannot find module）

- [ ] **Step 3：新增 `client/src/components/menus/NodeContextMenu.tsx`**

```typescript
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
}

const MENU_ITEM_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 16px',
  background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
}

const DISABLED_ITEM_STYLE: React.CSSProperties = {
  ...MENU_ITEM_STYLE, color: '#aaa', cursor: 'not-allowed',
}

/** 節點右鍵選單 */
export function NodeContextMenu({ nodeId, nodeSize, x, y, onClose, onAddChild, onDelete }: Props) {
  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => {
          onClose()
          onAddChild(nodeId)
        }}
      >
        新增子節點
      </button>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => onDelete(nodeId)}
      >
        刪除節點
      </button>
      {nodeSize === NodeSize.LARGE && (
        <button style={DISABLED_ITEM_STYLE} disabled>AI 展開</button>
      )}
      <button style={DISABLED_ITEM_STYLE} disabled>AI 建議連結</button>
    </ContextMenu>
  )
}
```

- [ ] **Step 4：確認測試通過**

```bash
cd client && npx vitest run src/components/menus/NodeContextMenu.spec.tsx
```

預期：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add client/src/components/menus/NodeContextMenu.tsx client/src/components/menus/NodeContextMenu.spec.tsx
git commit -m "feat(menu): add NodeContextMenu with add-child, delete, and AI placeholder items"
```

---

## Task 6：EdgeContextMenu

**Files:**
- Create: `client/src/components/menus/EdgeContextMenu.tsx`
- Create: `client/src/components/menus/EdgeContextMenu.spec.tsx`

- [ ] **Step 1：新增測試檔案 `client/src/components/menus/EdgeContextMenu.spec.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EdgeContextMenu } from './EdgeContextMenu'
import React from 'react'

vi.mock('./ContextMenu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="context-menu">{children}</div>
  ),
}))

describe('EdgeContextMenu', () => {
  const props = {
    edgeId: 'e-1',
    x: 200,
    y: 200,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('渲染「編輯連結」和「刪除連結」按鈕', () => {
    render(<EdgeContextMenu {...props} />)
    expect(screen.getByText('編輯連結')).toBeDefined()
    expect(screen.getByText('刪除連結')).toBeDefined()
  })

  it('點擊「編輯連結」呼叫 onEdit 並關閉', () => {
    render(<EdgeContextMenu {...props} />)
    fireEvent.click(screen.getByText('編輯連結'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onEdit).toHaveBeenCalledWith('e-1')
  })

  it('點擊「刪除連結」呼叫 onDelete 並關閉', () => {
    render(<EdgeContextMenu {...props} />)
    fireEvent.click(screen.getByText('刪除連結'))
    expect(props.onClose).toHaveBeenCalled()
    expect(props.onDelete).toHaveBeenCalledWith('e-1')
  })
})
```

- [ ] **Step 2：確認測試失敗**

```bash
cd client && npx vitest run src/components/menus/EdgeContextMenu.spec.tsx
```

預期：FAIL（Cannot find module）

- [ ] **Step 3：新增 `client/src/components/menus/EdgeContextMenu.tsx`**

```typescript
import React from 'react'
import { ContextMenu } from './ContextMenu'

interface Props {
  edgeId: string
  x: number
  y: number
  onClose: () => void
  /** 「編輯連結」— 開啟 EdgeSettingsModal edit 模式 */
  onEdit: (edgeId: string) => void
  /** 「刪除連結」— 執行 RemoveEdgeCommand */
  onDelete: (edgeId: string) => void
}

const MENU_ITEM_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 16px',
  background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
}

/** 連結右鍵選單 */
export function EdgeContextMenu({ edgeId, x, y, onClose, onEdit, onDelete }: Props) {
  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => {
          onClose()
          onEdit(edgeId)
        }}
      >
        編輯連結
      </button>
      <button
        style={MENU_ITEM_STYLE}
        onClick={() => {
          onClose()
          onDelete(edgeId)
        }}
      >
        刪除連結
      </button>
    </ContextMenu>
  )
}
```

- [ ] **Step 4：確認測試通過**

```bash
cd client && npx vitest run src/components/menus/EdgeContextMenu.spec.tsx
```

預期：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add client/src/components/menus/EdgeContextMenu.tsx client/src/components/menus/EdgeContextMenu.spec.tsx
git commit -m "feat(menu): add EdgeContextMenu with edit and delete items"
```

---

## Task 7：BlueprintCanvas 介面變更

**Files:**
- Modify: `client/src/components/canvas/BlueprintCanvas.tsx`

spec 要求修改 Props，新增四個 callback，並改變 `onConnect` 的行為。
BlueprintCanvas 本身沒有單獨的 spec（使用 jsdom 測試 ReactFlow 困難），此 task 僅修改元件，由 CanvasPage 的整合測試驗證行為。

**相較現有版本的主要變更：**
- 移除 `addEdge` import（`@xyflow/react`）：此工具函式不再使用
- 移除 `useHistoryStore` import：`onConnect` 邏輯移至 CanvasPage，BlueprintCanvas 不再直接執行 Command
- 移除 `AddEdgeCommand` import：同上原因
- Props 從 `{ blueprintId }` 擴充為含四個 callback 的完整介面

- [ ] **Step 1：修改 `client/src/components/canvas/BlueprintCanvas.tsx`**

完整替換為：

```typescript
import React, { useEffect, useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Connection, Node, Edge,
} from '@xyflow/react'
import { useCanvasStore } from '../../stores/canvas.store'
import { LargeNode } from './LargeNode'
import { SmallNode } from './SmallNode'
import { CausalEdge } from './CausalEdge'
import { NodeDto, NodeSize } from '../../types'

const NODE_TYPES = {
  large: LargeNode,
  small: SmallNode,
}

const EDGE_TYPES = {
  causal: CausalEdge,
}

interface Props {
  blueprintId: string
  /** 使用者完成連線拖拽後通知 CanvasPage，由 CanvasPage 開啟 EdgeSettingsModal */
  onConnectionAttempt: (connection: Connection) => void
  /** 點擊 edge（onEdgeContextMenu 觸發時需 stopPropagation 阻止此事件） */
  onEdgeClick: (edgeId: string) => void
  /** 右鍵節點 */
  onNodeRightClick: (nodeId: string, x: number, y: number) => void
  /** 右鍵 edge */
  onEdgeRightClick: (edgeId: string, x: number, y: number) => void
}

/**
 * 藍圖畫布主元件
 * 負責渲染 React Flow 並將互動事件向上通知 CanvasPage
 * 不自行管理 Modal / ContextMenu 狀態
 */
export function BlueprintCanvas({
  blueprintId,
  onConnectionAttempt,
  onEdgeClick,
  onNodeRightClick,
  onEdgeRightClick,
}: Props) {
  const { nodes: storeNodes, edges: storeEdges, loadCanvas, selectNode } = useCanvasStore()

  const flowNodes: Node[] = storeNodes.map((n, idx) => ({
    id: n.id,
    type: n.size === NodeSize.LARGE ? 'large' : 'small',
    position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 150 },
    data: n,
  }))

  const flowEdges: Edge[] = storeEdges.map(e => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    type: 'causal',
    data: e,
  }))

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { loadCanvas(blueprintId) }, [blueprintId, loadCanvas])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      onConnectionAttempt(connection)
    },
    [onConnectionAttempt]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => { selectNode(node.id) },
    [selectNode]
  )

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => { onEdgeClick(edge.id) },
    [onEdgeClick]
  )

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault()
      onNodeRightClick(node.id, e.clientX, e.clientY)
    },
    [onNodeRightClick]
  )

  const handleEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      e.preventDefault()
      e.stopPropagation()
      onEdgeRightClick(edge.id, e.clientX, e.clientY)
    },
    [onEdgeRightClick]
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 2：確認全部現有測試仍通過**

```bash
cd client && npx vitest run
```

預期：全部 PASS（CanvasPage.spec.tsx 使用 mock，不受影響）

- [ ] **Step 3：Commit**

```bash
git add client/src/components/canvas/BlueprintCanvas.tsx
git commit -m "feat(canvas): update BlueprintCanvas props for edge settings and context menu"
```

---

## Task 8：CanvasPage 整合

**Files:**
- Modify: `client/src/components/pages/CanvasPage.tsx`
- Modify: `client/src/components/pages/CanvasPage.spec.tsx`

這是最大的 task，整合所有新元件到 CanvasPage。

- [ ] **Step 1：更新 CanvasPage.spec.tsx 的測試（完整替換整個檔案）**

整合測試需要捕獲 BlueprintCanvas 的 callback props，以便直接呼叫模擬 ReactFlow 事件。新的 mock 透過閉包儲存 props 供測試使用。

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasPage } from './CanvasPage'
import { useCanvasStore } from '../../stores/canvas.store'
import React from 'react'
import { Direction, Magnitude, NodeSize, NodeType, TimeScale } from '../../types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useParams: () => ({ blueprintId: 'bp-1' }),
  useNavigate: () => mockNavigate,
}))

// mock 捕獲 callback props，供測試直接呼叫模擬 ReactFlow 事件
let capturedCanvasCallbacks: {
  onConnectionAttempt?: (c: any) => void
  onEdgeClick?: (id: string) => void
  onNodeRightClick?: (id: string, x: number, y: number) => void
  onEdgeRightClick?: (id: string, x: number, y: number) => void
} = {}

vi.mock('../canvas/BlueprintCanvas', () => ({
  BlueprintCanvas: (props: any) => {
    capturedCanvasCallbacks = props
    return <div data-testid="blueprint-canvas">canvas-{props.blueprintId}</div>
  },
}))

vi.mock('../panels/NodeInfoPanel', () => ({
  NodeInfoPanel: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="node-info-panel">panel-{nodeId}</div>
  ),
}))

// mock ContextMenu 讓它直接渲染 children，避免 document.addEventListener 干擾
vi.mock('../menus/ContextMenu', () => ({
  ContextMenu: ({ children, onClose }: any) => (
    <div data-testid="context-menu">
      {children}
      <button data-testid="close-context-menu" onClick={onClose}>close</button>
    </div>
  ),
}))

const mockEdge = {
  id: 'e-1', blueprintId: 'bp-1', sourceNodeId: 'n-1', targetNodeId: 'n-2',
  theoryIds: [], direction: Direction.PROMOTES, magnitude: Magnitude.MEDIUM,
  reasoning: '', createdBy: 'user' as const,
}

const mockNode = {
  id: 'n-1', blueprintId: 'bp-1', type: NodeType.EVENT, size: NodeSize.LARGE,
  title: '節點A', status: 'ACTIVE' as any, timeScale: TimeScale.MEDIUM,
  weight: 0.5, createdBy: 'user' as const, theoryIds: [], description: undefined,
}

describe('CanvasPage', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [mockNode],
      edges: [mockEdge],
      selectedNodeId: null,
      isLoading: false,
    })
    capturedCanvasCallbacks = {}
    mockNavigate.mockClear()
  })

  it('渲染 BlueprintCanvas 元件', () => {
    render(<CanvasPage />)
    expect(screen.getByTestId('blueprint-canvas')).toBeDefined()
    expect(screen.getByText('canvas-bp-1')).toBeDefined()
  })

  it('無選取節點時不渲染 NodeInfoPanel', () => {
    render(<CanvasPage />)
    expect(screen.queryByTestId('node-info-panel')).toBeNull()
  })

  it('有選取節點時渲染 NodeInfoPanel', () => {
    useCanvasStore.setState({ selectedNodeId: 'n-1' })
    render(<CanvasPage />)
    expect(screen.getByTestId('node-info-panel')).toBeDefined()
    expect(screen.getByText('panel-n-1')).toBeDefined()
  })

  it('顯示返回列表與新增節點按鈕', () => {
    render(<CanvasPage />)
    expect(screen.getByText('← 返回列表')).toBeDefined()
    expect(screen.getByText('+ 新增節點')).toBeDefined()
  })

  it('點擊「+ 新增節點」顯示表單', () => {
    render(<CanvasPage />)
    fireEvent.click(screen.getByText('+ 新增節點'))
    expect(screen.getByPlaceholderText('節點標題')).toBeDefined()
  })

  it('onConnectionAttempt 觸發後顯示 EdgeSettingsModal（create 模式）', () => {
    render(<CanvasPage />)
    // 模擬 ReactFlow 完成連線拖拽
    capturedCanvasCallbacks.onConnectionAttempt?.({
      source: 'n-1', target: 'n-2', sourceHandle: null, targetHandle: null,
    })
    // EdgeSettingsModal 應出現，標題為「新增連結」
    expect(screen.getByText('新增連結')).toBeDefined()
  })

  it('onEdgeClick 觸發後顯示 EdgeSettingsModal（edit 模式）', () => {
    render(<CanvasPage />)
    capturedCanvasCallbacks.onEdgeClick?.('e-1')
    expect(screen.getByText('編輯連結')).toBeDefined()
  })

  it('onNodeRightClick 觸發後顯示 NodeContextMenu', () => {
    render(<CanvasPage />)
    capturedCanvasCallbacks.onNodeRightClick?.('n-1', 100, 200)
    expect(screen.getByText('新增子節點')).toBeDefined()
    expect(screen.getByText('刪除節點')).toBeDefined()
  })

  it('onEdgeRightClick 觸發後顯示 EdgeContextMenu', () => {
    render(<CanvasPage />)
    capturedCanvasCallbacks.onEdgeRightClick?.('e-1', 100, 200)
    expect(screen.getByText('編輯連結')).toBeDefined()
    expect(screen.getByText('刪除連結')).toBeDefined()
  })

  it('NodeContextMenu「新增子節點」開啟表單並帶入 parentNodeId 提示', () => {
    render(<CanvasPage />)
    capturedCanvasCallbacks.onNodeRightClick?.('n-1', 100, 200)
    fireEvent.click(screen.getByText('新增子節點'))
    // 表單出現，且顯示父節點提示
    expect(screen.getByPlaceholderText('節點標題')).toBeDefined()
    expect(screen.getByText(/節點A/)).toBeDefined()
  })
})
```

- [ ] **Step 2：確認新測試失敗（整合元件尚未接入）**

```bash
cd client && npx vitest run src/components/pages/CanvasPage.spec.tsx
```

預期：FAIL（EdgeSettingsModal / ContextMenu 相關測試失敗，因為舊版 CanvasPage 不含這些元件）

- [ ] **Step 3：修改 `client/src/components/pages/CanvasPage.tsx`**

完整替換為：

```typescript
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BlueprintCanvas } from '../canvas/BlueprintCanvas'
import { NodeInfoPanel } from '../panels/NodeInfoPanel'
import { EdgeSettingsModal } from '../modals/EdgeSettingsModal'
import { NodeContextMenu } from '../menus/NodeContextMenu'
import { EdgeContextMenu } from '../menus/EdgeContextMenu'
import { useCanvasStore } from '../../stores/canvas.store'
import { useHistoryStore } from '../../stores/history.store'
import {
  AddNodeCommand, AddEdgeCommand, RemoveNodeCommand, RemoveEdgeCommand, UpdateEdgeCommand,
} from '../../commands'
import type { EdgeFormValues } from '../../commands'
import { NodeType, NodeSize, TimeScale, Direction, Magnitude } from '../../types'
import type { Connection } from '@xyflow/react'

/** Edge Settings Modal 狀態 */
type EdgeModalState =
  | { mode: 'create'; connection: Connection }
  | { mode: 'edit'; edgeId: string }
  | null

/** Context Menu 狀態 */
type ContextMenuState =
  | { type: 'node'; nodeId: string; x: number; y: number }
  | { type: 'edge'; edgeId: string; x: number; y: number }
  | null

/** 畫布主頁面 — 包含工具列、React Flow 畫布、節點資訊面板、Edge Modal、右鍵選單 */
export function CanvasPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>()
  const navigate = useNavigate()
  const { nodes, edges, selectedNodeId } = useCanvasStore()
  const { undoStack, redoStack, undo, redo, clearHistory } = useHistoryStore()

  // 新增節點表單
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.EVENT)
  const [newNodeSize, setNewNodeSize] = useState<NodeSize>(NodeSize.LARGE)
  const [newTimeScale, setNewTimeScale] = useState<TimeScale>(TimeScale.MEDIUM)
  /** 新增子節點時記錄父節點 ID；null 表示新增頂層節點 */
  const [pendingParentNodeId, setPendingParentNodeId] = useState<string | null>(null)

  // Edge Settings Modal
  const [edgeModal, setEdgeModal] = useState<EdgeModalState>(null)

  // Context Menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  // 藍圖切換時清空歷史
  useEffect(() => {
    clearHistory()
  }, [blueprintId, clearHistory])

  // 鍵盤快捷鍵 Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (isCtrlOrCmd && e.key === 'y') ||
        (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  if (!blueprintId) return <div>找不到藍圖</div>

  // ---- 新增節點 ----
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNodeTitle.trim()) return
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new AddNodeCommand({
      blueprintId,
      type: newNodeType,
      size: newNodeSize,
      title: newNodeTitle.trim(),
      timeScale: newTimeScale,
      parentNodeId: pendingParentNodeId ?? undefined,
    }))
    setNewNodeTitle('')
    setShowAddForm(false)
    setPendingParentNodeId(null)
  }

  // ---- Edge Settings Modal handlers ----
  const handleConnectionAttempt = (connection: Connection) => {
    setEdgeModal({ mode: 'create', connection })
  }

  const handleEdgeModalConfirm = async (values: EdgeFormValues) => {
    const { executeCommand } = useHistoryStore.getState()
    if (edgeModal?.mode === 'create') {
      const { connection } = edgeModal
      await executeCommand(new AddEdgeCommand({
        blueprintId,
        sourceNodeId: connection.source!,
        targetNodeId: connection.target!,
        direction: values.direction,
        magnitude: values.magnitude,
        reasoning: values.reasoning,
        theoryIds: [],
      }))
    } else if (edgeModal?.mode === 'edit') {
      await executeCommand(new UpdateEdgeCommand(edgeModal.edgeId, values))
    }
    setEdgeModal(null)
  }

  const handleEdgeClick = (edgeId: string) => {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)
    if (!edge) return
    setEdgeModal({
      mode: 'edit',
      edgeId,
    })
  }

  // ---- Context Menu handlers ----
  const handleNodeRightClick = (nodeId: string, x: number, y: number) => {
    setContextMenu({ type: 'node', nodeId, x, y })
  }

  const handleEdgeRightClick = (edgeId: string, x: number, y: number) => {
    setContextMenu({ type: 'edge', edgeId, x, y })
  }

  const handleAddChild = (nodeId: string) => {
    setPendingParentNodeId(nodeId)
    setShowAddForm(true)
  }

  const handleDeleteNode = async (nodeId: string) => {
    setContextMenu(null)
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new RemoveNodeCommand(nodeId))
  }

  const handleEditEdge = (edgeId: string) => {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)
    if (!edge) return
    setEdgeModal({ mode: 'edit', edgeId })
  }

  const handleDeleteEdge = async (edgeId: string) => {
    setContextMenu(null)
    const { executeCommand } = useHistoryStore.getState()
    await executeCommand(new RemoveEdgeCommand(edgeId))
  }

  // ---- EdgeSettingsModal initialValues（edit 模式） ----
  // 設計說明：在 render 期間直接讀取 store（而非在 handler 中）。
  // 這是合理的：edgeModal state 改變本身即觸發 re-render，此時讀取 store 與
  // 在 handler 中同步讀取效果相同，且使 handler 保持簡潔（不需額外傳遞 initialValues）。
  const edgeModalInitialValues: EdgeFormValues | undefined = (() => {
    if (edgeModal?.mode !== 'edit') return undefined
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeModal.edgeId)
    if (!edge) return undefined
    return { direction: edge.direction, magnitude: edge.magnitude, reasoning: edge.reasoning }
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 工具列 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>← 返回列表</button>
        <button onClick={() => { setPendingParentNodeId(null); setShowAddForm(!showAddForm) }}>+ 新增節點</button>
        <button onClick={() => undo()} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">Undo</button>
        <button onClick={() => redo()} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">Redo</button>
      </div>

      {/* 新增節點表單 */}
      {showAddForm && (
        <form onSubmit={handleAddNode} style={{ padding: '8px 16px', borderBottom: '1px solid #eee', display: 'flex', gap: '8px' }}>
          <input placeholder="節點標題" value={newNodeTitle} onChange={e => setNewNodeTitle(e.target.value)} required />
          <select value={newNodeType} onChange={e => setNewNodeType(e.target.value as NodeType)}>
            {Object.values(NodeType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={newNodeSize} onChange={e => setNewNodeSize(e.target.value as NodeSize)}>
            {Object.values(NodeSize).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={newTimeScale} onChange={e => setNewTimeScale(e.target.value as TimeScale)}>
            {Object.values(TimeScale).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {pendingParentNodeId && (
            <span style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
              子節點 of {nodes.find(n => n.id === pendingParentNodeId)?.title ?? pendingParentNodeId}
            </span>
          )}
          <button type="submit">新增</button>
          <button type="button" onClick={() => { setShowAddForm(false); setPendingParentNodeId(null) }}>取消</button>
        </form>
      )}

      {/* 主體：畫布 + 側邊面板 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <BlueprintCanvas
            blueprintId={blueprintId}
            onConnectionAttempt={handleConnectionAttempt}
            onEdgeClick={handleEdgeClick}
            onNodeRightClick={handleNodeRightClick}
            onEdgeRightClick={handleEdgeRightClick}
          />
        </div>
        {selectedNodeId && (
          <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
            <NodeInfoPanel nodeId={selectedNodeId} blueprintId={blueprintId} />
          </div>
        )}
      </div>

      {/* Edge Settings Modal */}
      {edgeModal && (
        <EdgeSettingsModal
          mode={edgeModal.mode}
          initialValues={edgeModalInitialValues}
          onConfirm={handleEdgeModalConfirm}
          onCancel={() => setEdgeModal(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu?.type === 'node' && (() => {
        const node = nodes.find(n => n.id === contextMenu.nodeId)
        if (!node) return null
        return (
          <NodeContextMenu
            nodeId={contextMenu.nodeId}
            nodeSize={node.size}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onAddChild={handleAddChild}
            onDelete={handleDeleteNode}
          />
        )
      })()}
      {contextMenu?.type === 'edge' && (
        <EdgeContextMenu
          edgeId={contextMenu.edgeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={handleEditEdge}
          onDelete={handleDeleteEdge}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4：確認全部測試通過**

```bash
cd client && npx vitest run
```

預期：全部 PASS

- [ ] **Step 5：Commit**

```bash
git add client/src/components/pages/CanvasPage.tsx client/src/components/pages/CanvasPage.spec.tsx
git commit -m "feat(canvas-page): integrate EdgeSettingsModal, NodeContextMenu, EdgeContextMenu"
```

---

## Task 9：最終驗收

- [ ] **Step 1：執行全部測試**

```bash
cd client && npx vitest run
```

預期：全部 PASS，無警告

- [ ] **Step 2：確認 TypeScript 無型別錯誤**

```bash
cd client && npx tsc --noEmit
```

預期：無錯誤輸出

- [ ] **Step 3：推送 master**

```bash
git push origin master
```
