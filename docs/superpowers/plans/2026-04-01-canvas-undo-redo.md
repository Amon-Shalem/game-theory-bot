# Canvas Undo/Redo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為畫布頁面實作 Command Pattern 的 undo/redo 功能，涵蓋節點與邊的新增/刪除，前後端同步。

**Architecture:** 每個畫布操作封裝為 CanvasCommand（含 execute/undo 方法），由獨立的 History Store 管理 undo/redo 堆疊。Canvas Store 拆分為純 state 操作（供 Command 使用）與原有 API 方法。透過 Ctrl+Z/Y 鍵盤快捷鍵及工具列按鈕觸發。

**Tech Stack:** TypeScript, Zustand, Vitest, React

**Spec:** `docs/superpowers/specs/2026-04-01-canvas-undo-redo-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `client/src/commands/canvas-command.ts` | CanvasCommand 介面定義 |
| `client/src/commands/add-node.command.ts` | 新增節點 Command |
| `client/src/commands/remove-node.command.ts` | 刪除節點 Command（含關聯邊快照） |
| `client/src/commands/add-edge.command.ts` | 新增邊 Command |
| `client/src/commands/remove-edge.command.ts` | 刪除邊 Command |
| `client/src/commands/index.ts` | Barrel export |
| `client/src/stores/history.store.ts` | 歷史堆疊 Zustand store |
| `client/src/commands/add-node.command.spec.ts` | AddNodeCommand 測試 |
| `client/src/commands/remove-node.command.spec.ts` | RemoveNodeCommand 測試 |
| `client/src/commands/add-edge.command.spec.ts` | AddEdgeCommand 測試 |
| `client/src/commands/remove-edge.command.spec.ts` | RemoveEdgeCommand 測試 |
| `client/src/stores/history.store.spec.ts` | History Store 測試 |

### Modified Files
| File | Change |
|------|--------|
| `client/src/stores/canvas.store.ts` | 新增純 state 操作方法，保留原有 API 方法 |
| `client/src/components/pages/CanvasPage.tsx` | 鍵盤監聽 + undo/redo 按鈕 + executeCommand 整合 + 藍圖切換清空歷史 |
| `client/src/components/canvas/BlueprintCanvas.tsx` | onConnect 改用 executeCommand |
| `client/src/components/panels/NodeInfoPanel.tsx` | removeNode 改用 executeCommand |

---

### Task 1: Command 介面與 Canvas Store 純 state 方法

**Files:**
- Create: `client/src/commands/canvas-command.ts`
- Modify: `client/src/stores/canvas.store.ts`

- [ ] **Step 1: 建立 CanvasCommand 介面**

```typescript
// client/src/commands/canvas-command.ts

/**
 * 畫布操作指令介面
 * 每個操作封裝為一個 Command，包含 execute 和 undo 方法
 */
export interface CanvasCommand {
  /** 執行操作（呼叫 API + 更新 store） */
  execute(): Promise<void>
  /** 撤銷操作（呼叫反向 API + 更新 store） */
  undo(): Promise<void>
  /** 顯示名稱，用於 UI tooltip（如 "新增節點: Actor1"） */
  label: string
}
```

- [ ] **Step 2: 在 canvas.store.ts 新增純 state 操作方法**

在現有 CanvasState interface 新增以下方法，並實作：

```typescript
// 在 CanvasState interface 新增：
addNodeToStore: (node: NodeDto) => void
removeNodeFromStore: (id: string) => void   // 只移除節點，不連帶移除邊
addEdgeToStore: (edge: EdgeDto) => void
removeEdgeFromStore: (id: string) => void
```

實作（在 create 內新增）：

```typescript
addNodeToStore: (node) => set(state => ({ nodes: [...state.nodes, node] })),

/** 只移除節點，不連帶移除邊（邊由 Command 自行處理） */
removeNodeFromStore: (id) => set(state => ({
  nodes: state.nodes.filter(n => n.id !== id),
})),

addEdgeToStore: (edge) => set(state => ({ edges: [...state.edges, edge] })),

removeEdgeFromStore: (id) => set(state => ({
  edges: state.edges.filter(e => e.id !== id),
})),
```

- [ ] **Step 3: 執行測試確認 canvas.store 未被破壞**

Run: `cd client && npx vitest run src/stores/canvas.store.spec.ts`
Expected: 全部 PASS（既有測試不受影響）

- [ ] **Step 4: Commit**

```bash
git add client/src/commands/canvas-command.ts client/src/stores/canvas.store.ts
git commit -m "feat(undo): add CanvasCommand interface and pure state methods to canvas store"
```

---

### Task 2: History Store

**Files:**
- Create: `client/src/stores/history.store.ts`
- Test: `client/src/stores/history.store.spec.ts`

- [ ] **Step 1: 寫 history.store 的失敗測試**

```typescript
// client/src/stores/history.store.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHistoryStore } from './history.store'
import type { CanvasCommand } from '../commands/canvas-command'

/** 建立 mock command */
function createMockCommand(label = 'test'): CanvasCommand {
  return {
    label,
    execute: vi.fn().mockResolvedValue(undefined),
    undo: vi.fn().mockResolvedValue(undefined),
  }
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory()
  })

  it('executeCommand 推入 undoStack 並清空 redoStack', async () => {
    const cmd = createMockCommand()
    const result = await useHistoryStore.getState().executeCommand(cmd)

    expect(result).toBe(true)
    expect(cmd.execute).toHaveBeenCalledOnce()
    expect(useHistoryStore.getState().undoStack).toHaveLength(1)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('undo 將指令從 undoStack 移到 redoStack', async () => {
    const cmd = createMockCommand()
    await useHistoryStore.getState().executeCommand(cmd)
    await useHistoryStore.getState().undo()

    expect(cmd.undo).toHaveBeenCalledOnce()
    expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    expect(useHistoryStore.getState().redoStack).toHaveLength(1)
  })

  it('redo 將指令從 redoStack 移回 undoStack', async () => {
    const cmd = createMockCommand()
    await useHistoryStore.getState().executeCommand(cmd)
    await useHistoryStore.getState().undo()
    await useHistoryStore.getState().redo()

    // execute 被呼叫兩次：一次 executeCommand，一次 redo
    expect(cmd.execute).toHaveBeenCalledTimes(2)
    expect(useHistoryStore.getState().undoStack).toHaveLength(1)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('executeCommand 清空 redoStack', async () => {
    const cmd1 = createMockCommand('cmd1')
    const cmd2 = createMockCommand('cmd2')
    await useHistoryStore.getState().executeCommand(cmd1)
    await useHistoryStore.getState().undo()
    // 此時 redoStack 有 cmd1
    await useHistoryStore.getState().executeCommand(cmd2)

    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    expect(useHistoryStore.getState().undoStack).toHaveLength(1)
  })

  it('undoStack 上限 50，超過丟棄最舊的', async () => {
    for (let i = 0; i < 55; i++) {
      await useHistoryStore.getState().executeCommand(createMockCommand(`cmd-${i}`))
    }
    expect(useHistoryStore.getState().undoStack).toHaveLength(50)
    // 最舊的 5 個被丟棄，最舊的應該是 cmd-5
    expect(useHistoryStore.getState().undoStack[0].label).toBe('cmd-5')
  })

  it('undo 空堆疊時不做任何事', async () => {
    await useHistoryStore.getState().undo()
    expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('redo 空堆疊時不做任何事', async () => {
    await useHistoryStore.getState().redo()
    expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('isUndoRedoing 期間拒絕新的 undo/redo', async () => {
    const slowCmd = createMockCommand()
    slowCmd.undo = vi.fn().mockImplementation(() => new Promise(r => setTimeout(r, 100)))
    await useHistoryStore.getState().executeCommand(slowCmd)

    // 同時觸發兩次 undo
    const p1 = useHistoryStore.getState().undo()
    const p2 = useHistoryStore.getState().undo()
    await Promise.all([p1, p2])

    // undo 只應被呼叫一次
    expect(slowCmd.undo).toHaveBeenCalledOnce()
  })

  it('clearHistory 清空兩個堆疊', async () => {
    await useHistoryStore.getState().executeCommand(createMockCommand())
    await useHistoryStore.getState().executeCommand(createMockCommand())
    useHistoryStore.getState().clearHistory()

    expect(useHistoryStore.getState().undoStack).toHaveLength(0)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('execute 失敗時不推入 undoStack 並回傳 false', async () => {
    const failCmd = createMockCommand()
    failCmd.execute = vi.fn().mockRejectedValue(new Error('API error'))

    const result = await useHistoryStore.getState().executeCommand(failCmd)

    expect(result).toBe(false)
    expect(useHistoryStore.getState().undoStack).toHaveLength(0)
  })

  it('isUndoRedoing 期間 executeCommand 回傳 false', async () => {
    const slowCmd = createMockCommand()
    slowCmd.undo = vi.fn().mockImplementation(() => new Promise(r => setTimeout(r, 100)))
    await useHistoryStore.getState().executeCommand(slowCmd)

    // 開始 undo（會設定 isUndoRedoing = true）
    const undoPromise = useHistoryStore.getState().undo()
    // 在 undo 進行中嘗試 executeCommand
    const result = await useHistoryStore.getState().executeCommand(createMockCommand())
    await undoPromise

    expect(result).toBe(false)
  })

  it('undo 失敗時指令留在 undoStack', async () => {
    const cmd = createMockCommand()
    await useHistoryStore.getState().executeCommand(cmd)
    cmd.undo = vi.fn().mockRejectedValue(new Error('API error'))

    await useHistoryStore.getState().undo()

    expect(useHistoryStore.getState().undoStack).toHaveLength(1)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('redo 失敗時指令留在 redoStack', async () => {
    const cmd = createMockCommand()
    await useHistoryStore.getState().executeCommand(cmd)
    await useHistoryStore.getState().undo()
    cmd.execute = vi.fn().mockRejectedValue(new Error('API error'))

    await useHistoryStore.getState().redo()

    expect(useHistoryStore.getState().redoStack).toHaveLength(1)
    expect(useHistoryStore.getState().undoStack).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd client && npx vitest run src/stores/history.store.spec.ts`
Expected: FAIL（history.store.ts 不存在）

- [ ] **Step 3: 實作 history.store.ts**

```typescript
// client/src/stores/history.store.ts
import { create } from 'zustand'
import type { CanvasCommand } from '../commands/canvas-command'

const MAX_HISTORY = 50

interface HistoryState {
  undoStack: CanvasCommand[]
  redoStack: CanvasCommand[]
  isUndoRedoing: boolean

  /** 執行指令並推入 undoStack，清空 redoStack。回傳 true 表示成功 */
  executeCommand: (cmd: CanvasCommand) => Promise<boolean>
  /** 撤銷最近一個指令 */
  undo: () => Promise<void>
  /** 重做最近撤銷的指令 */
  redo: () => Promise<void>
  /** 清空所有歷史（藍圖切換時呼叫） */
  clearHistory: () => void
}

/**
 * 歷史堆疊 store
 * 管理 undo/redo 堆疊，不可使用 persist / devtools middleware
 * （Command 為 class 實例，無法 JSON 序列化）
 */
export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  isUndoRedoing: false,

  executeCommand: async (cmd) => {
    // undo/redo 進行中時拒絕新指令
    if (get().isUndoRedoing) return false
    try {
      await cmd.execute()
    } catch (error) {
      console.error(`[HistoryStore] Command execute failed: ${cmd.label}`, error)
      return false
    }
    set(state => {
      const newStack = [...state.undoStack, cmd]
      // 超過上限時丟棄最舊的指令
      if (newStack.length > MAX_HISTORY) {
        newStack.splice(0, newStack.length - MAX_HISTORY)
      }
      return { undoStack: newStack, redoStack: [] }
    })
    return true
  },

  undo: async () => {
    const { isUndoRedoing, undoStack } = get()
    if (isUndoRedoing || undoStack.length === 0) return
    set({ isUndoRedoing: true })
    const cmd = undoStack[undoStack.length - 1]
    try {
      await cmd.undo()
      set(state => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, cmd],
      }))
    } catch (error) {
      console.error(`[HistoryStore] Command undo failed: ${cmd.label}`, error)
    } finally {
      set({ isUndoRedoing: false })
    }
  },

  redo: async () => {
    const { isUndoRedoing, redoStack } = get()
    if (isUndoRedoing || redoStack.length === 0) return
    set({ isUndoRedoing: true })
    const cmd = redoStack[redoStack.length - 1]
    try {
      await cmd.execute()
      set(state => ({
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, cmd],
      }))
    } catch (error) {
      console.error(`[HistoryStore] Command redo failed: ${cmd.label}`, error)
    } finally {
      set({ isUndoRedoing: false })
    }
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),
}))
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd client && npx vitest run src/stores/history.store.spec.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/stores/history.store.ts client/src/stores/history.store.spec.ts
git commit -m "feat(undo): add history store with undo/redo stack management"
```

---

### Task 3: AddNodeCommand

**Files:**
- Create: `client/src/commands/add-node.command.ts`
- Test: `client/src/commands/add-node.command.spec.ts`

- [ ] **Step 1: 寫失敗測試**

```typescript
// client/src/commands/add-node.command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddNodeCommand } from './add-node.command'
import { useCanvasStore } from '../stores/canvas.store'
import { NodeService } from '../services/node.service'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '../types'
import type { CreateNodeDto, NodeDto } from '../types'

vi.mock('../services/node.service')

const dto: CreateNodeDto = {
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  title: 'Test Node',
  timeScale: TimeScale.MEDIUM,
}

const createdNode: NodeDto = {
  id: 'n-new',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: 'Test Node',
  description: '',
  weight: 1.0,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('AddNodeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 API 並加入 store', async () => {
    vi.mocked(NodeService.create).mockResolvedValue(createdNode)
    const cmd = new AddNodeCommand(dto)
    await cmd.execute()

    expect(NodeService.create).toHaveBeenCalledWith(dto)
    expect(useCanvasStore.getState().nodes).toEqual([createdNode])
  })

  it('undo 呼叫 DELETE API 並從 store 移除', async () => {
    vi.mocked(NodeService.create).mockResolvedValue(createdNode)
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)

    const cmd = new AddNodeCommand(dto)
    await cmd.execute()
    await cmd.undo()

    expect(NodeService.remove).toHaveBeenCalledWith('n-new')
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
  })

  it('label 包含節點標題', () => {
    const cmd = new AddNodeCommand(dto)
    expect(cmd.label).toContain('Test Node')
  })

  it('execute 失敗時不修改 store', async () => {
    vi.mocked(NodeService.create).mockRejectedValue(new Error('API error'))
    const cmd = new AddNodeCommand(dto)

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd client && npx vitest run src/commands/add-node.command.spec.ts`
Expected: FAIL

- [ ] **Step 3: 實作 AddNodeCommand**

```typescript
// client/src/commands/add-node.command.ts
import type { CanvasCommand } from './canvas-command'
import type { CreateNodeDto, NodeDto } from '../types'
import { NodeService } from '../services/node.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 新增節點指令
 * execute: POST /nodes -> 加入 store
 * undo: DELETE /nodes/:id -> 從 store 移除
 */
export class AddNodeCommand implements CanvasCommand {
  public readonly label: string
  private createdNode: NodeDto | null = null

  constructor(private readonly dto: CreateNodeDto) {
    this.label = `新增節點: ${dto.title}`
  }

  async execute(): Promise<void> {
    const node = await NodeService.create(this.dto)
    this.createdNode = node
    useCanvasStore.getState().addNodeToStore(node)
  }

  async undo(): Promise<void> {
    if (!this.createdNode) return
    await NodeService.remove(this.createdNode.id)
    useCanvasStore.getState().removeNodeFromStore(this.createdNode.id)
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd client && npx vitest run src/commands/add-node.command.spec.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/commands/add-node.command.ts client/src/commands/add-node.command.spec.ts
git commit -m "feat(undo): add AddNodeCommand with tests"
```

---

### Task 4: RemoveNodeCommand（含關聯邊快照）

**Files:**
- Create: `client/src/commands/remove-node.command.ts`
- Test: `client/src/commands/remove-node.command.spec.ts`

- [ ] **Step 1: 寫失敗測試**

```typescript
// client/src/commands/remove-node.command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RemoveNodeCommand } from './remove-node.command'
import { useCanvasStore } from '../stores/canvas.store'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'
import { NodeType, NodeSize, NodeStatus, TimeScale, Direction, Magnitude } from '../types'
import type { NodeDto, EdgeDto } from '../types'

vi.mock('../services/node.service')
vi.mock('../services/edge.service')

const node: NodeDto = {
  id: 'n-1',
  blueprintId: 'bp-1',
  type: NodeType.EVENT,
  size: NodeSize.LARGE,
  status: NodeStatus.ACTIVE,
  title: 'Node 1',
  description: '',
  weight: 1.0,
  timeScale: TimeScale.MEDIUM,
  createdBy: 'user',
  parentNodeId: null,
  createdAt: '2026-01-01T00:00:00Z',
}

const relatedEdge: EdgeDto = {
  id: 'e-1',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

const unrelatedEdge: EdgeDto = {
  id: 'e-2',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-3',
  targetNodeId: 'n-4',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

describe('RemoveNodeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [node],
      edges: [relatedEdge, unrelatedEdge],
      selectedNodeId: null,
      isLoading: false,
    })
    vi.clearAllMocks()
  })

  it('execute 刪除節點及關聯邊', async () => {
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)

    const cmd = new RemoveNodeCommand('n-1')
    await cmd.execute()

    expect(NodeService.remove).toHaveBeenCalledWith('n-1')
    expect(EdgeService.remove).toHaveBeenCalledWith('e-1')
    expect(useCanvasStore.getState().nodes).toHaveLength(0)
    // unrelatedEdge 應保留
    expect(useCanvasStore.getState().edges).toEqual([unrelatedEdge])
  })

  it('undo 重建節點及關聯邊', async () => {
    vi.mocked(NodeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(NodeService.create).mockResolvedValue(node)
    vi.mocked(EdgeService.create).mockResolvedValue(relatedEdge)

    const cmd = new RemoveNodeCommand('n-1')
    await cmd.execute()
    await cmd.undo()

    expect(NodeService.create).toHaveBeenCalled()
    expect(EdgeService.create).toHaveBeenCalled()
    const state = useCanvasStore.getState()
    expect(state.nodes).toHaveLength(1)
    // unrelatedEdge + 重建的 relatedEdge
    expect(state.edges).toHaveLength(2)
  })

  it('label 包含節點標題', () => {
    const cmd = new RemoveNodeCommand('n-1')
    expect(cmd.label).toContain('Node 1')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd client && npx vitest run src/commands/remove-node.command.spec.ts`
Expected: FAIL

- [ ] **Step 3: 實作 RemoveNodeCommand**

```typescript
// client/src/commands/remove-node.command.ts
import type { CanvasCommand } from './canvas-command'
import type { NodeDto, EdgeDto, CreateNodeDto, CreateEdgeDto } from '../types'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 刪除節點指令（含關聯邊快照）
 * execute: DELETE 關聯邊 + DELETE /nodes/:id -> 從 store 移除
 * undo: POST /nodes + POST 關聯邊（用快照重建）-> 加回 store
 * 注意：多步 API 呼叫無事務保障，中途失敗可能導致不同步
 */
export class RemoveNodeCommand implements CanvasCommand {
  public readonly label: string
  private nodeSnapshot: NodeDto | null = null
  private edgeSnapshots: EdgeDto[] = []

  constructor(private readonly nodeId: string) {
    const state = useCanvasStore.getState()
    const node = state.nodes.find(n => n.id === nodeId)
    this.label = `刪除節點: ${node?.title ?? nodeId}`
    // 建構時快照，以備 undo 使用
    this.nodeSnapshot = node ?? null
    this.edgeSnapshots = state.edges.filter(
      e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    )
  }

  async execute(): Promise<void> {
    const store = useCanvasStore.getState()
    // 先刪除關聯邊（API + store）
    for (const edge of this.edgeSnapshots) {
      await EdgeService.remove(edge.id)
      store.removeEdgeFromStore(edge.id)
    }
    // 再刪除節點（API + store）
    await NodeService.remove(this.nodeId)
    // 注意：removeNodeFromStore 只移除節點，不連帶移除邊（邊已在上面處理）
    store.removeNodeFromStore(this.nodeId)
  }

  // 限制說明：execute 中多步 API 呼叫無事務保障，
  // 若中途失敗可能導致 API 與 store 不同步。
  // 目前無後端 batch delete 支援，此為已知限制。

  async undo(): Promise<void> {
    if (!this.nodeSnapshot) return
    // 明確建構 CreateNodeDto，避免 rest spread 帶入多餘欄位
    const createNodeDto: CreateNodeDto = {
      blueprintId: this.nodeSnapshot.blueprintId,
      type: this.nodeSnapshot.type,
      size: this.nodeSnapshot.size,
      title: this.nodeSnapshot.title,
      description: this.nodeSnapshot.description,
      timeScale: this.nodeSnapshot.timeScale,
      parentNodeId: this.nodeSnapshot.parentNodeId ?? undefined,
    }
    const newNode = await NodeService.create(createNodeDto)
    useCanvasStore.getState().addNodeToStore(newNode)

    // 再重建關聯邊（使用新節點 ID 替換舊 ID）
    for (const edgeSnap of this.edgeSnapshots) {
      const createDto: CreateEdgeDto = {
        blueprintId: edgeSnap.blueprintId,
        sourceNodeId: edgeSnap.sourceNodeId === this.nodeId ? newNode.id : edgeSnap.sourceNodeId,
        targetNodeId: edgeSnap.targetNodeId === this.nodeId ? newNode.id : edgeSnap.targetNodeId,
        direction: edgeSnap.direction,
        magnitude: edgeSnap.magnitude,
        theoryIds: edgeSnap.theoryIds,
        reasoning: edgeSnap.reasoning,
      }
      const newEdge = await EdgeService.create(createDto)
      useCanvasStore.getState().addEdgeToStore(newEdge)
    }
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd client && npx vitest run src/commands/remove-node.command.spec.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/commands/remove-node.command.ts client/src/commands/remove-node.command.spec.ts
git commit -m "feat(undo): add RemoveNodeCommand with cascade edge snapshot"
```

---

### Task 5: AddEdgeCommand

**Files:**
- Create: `client/src/commands/add-edge.command.ts`
- Test: `client/src/commands/add-edge.command.spec.ts`

- [ ] **Step 1: 寫失敗測試**

```typescript
// client/src/commands/add-edge.command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddEdgeCommand } from './add-edge.command'
import { useCanvasStore } from '../stores/canvas.store'
import { EdgeService } from '../services/edge.service'
import { Direction, Magnitude } from '../types'
import type { CreateEdgeDto, EdgeDto } from '../types'

vi.mock('../services/edge.service')

const dto: CreateEdgeDto = {
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  theoryIds: [],
}

const createdEdge: EdgeDto = {
  id: 'e-new',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

describe('AddEdgeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 呼叫 API 並加入 store', async () => {
    vi.mocked(EdgeService.create).mockResolvedValue(createdEdge)
    const cmd = new AddEdgeCommand(dto)
    await cmd.execute()

    expect(EdgeService.create).toHaveBeenCalledWith(dto)
    expect(useCanvasStore.getState().edges).toEqual([createdEdge])
  })

  it('undo 呼叫 DELETE API 並從 store 移除', async () => {
    vi.mocked(EdgeService.create).mockResolvedValue(createdEdge)
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)

    const cmd = new AddEdgeCommand(dto)
    await cmd.execute()
    await cmd.undo()

    expect(EdgeService.remove).toHaveBeenCalledWith('e-new')
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('execute 失敗時不修改 store', async () => {
    vi.mocked(EdgeService.create).mockRejectedValue(new Error('API error'))
    const cmd = new AddEdgeCommand(dto)

    await expect(cmd.execute()).rejects.toThrow('API error')
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd client && npx vitest run src/commands/add-edge.command.spec.ts`
Expected: FAIL

- [ ] **Step 3: 實作 AddEdgeCommand**

```typescript
// client/src/commands/add-edge.command.ts
import type { CanvasCommand } from './canvas-command'
import type { CreateEdgeDto, EdgeDto } from '../types'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 新增邊指令
 * execute: POST /edges -> 加入 store
 * undo: DELETE /edges/:id -> 從 store 移除
 */
export class AddEdgeCommand implements CanvasCommand {
  public readonly label = '新增連結'
  private createdEdge: EdgeDto | null = null

  constructor(private readonly dto: CreateEdgeDto) {}

  async execute(): Promise<void> {
    const edge = await EdgeService.create(this.dto)
    this.createdEdge = edge
    useCanvasStore.getState().addEdgeToStore(edge)
  }

  async undo(): Promise<void> {
    if (!this.createdEdge) return
    await EdgeService.remove(this.createdEdge.id)
    useCanvasStore.getState().removeEdgeFromStore(this.createdEdge.id)
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd client && npx vitest run src/commands/add-edge.command.spec.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/commands/add-edge.command.ts client/src/commands/add-edge.command.spec.ts
git commit -m "feat(undo): add AddEdgeCommand with tests"
```

---

### Task 6: RemoveEdgeCommand

**Files:**
- Create: `client/src/commands/remove-edge.command.ts`
- Test: `client/src/commands/remove-edge.command.spec.ts`

- [ ] **Step 1: 寫失敗測試**

```typescript
// client/src/commands/remove-edge.command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RemoveEdgeCommand } from './remove-edge.command'
import { useCanvasStore } from '../stores/canvas.store'
import { EdgeService } from '../services/edge.service'
import { Direction, Magnitude } from '../types'
import type { EdgeDto } from '../types'

vi.mock('../services/edge.service')

const edge: EdgeDto = {
  id: 'e-1',
  blueprintId: 'bp-1',
  sourceNodeId: 'n-1',
  targetNodeId: 'n-2',
  theoryIds: [],
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  reasoning: '',
  createdBy: 'user',
}

describe('RemoveEdgeCommand', () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [edge], selectedNodeId: null, isLoading: false })
    vi.clearAllMocks()
  })

  it('execute 刪除邊', async () => {
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)
    const cmd = new RemoveEdgeCommand('e-1')
    await cmd.execute()

    expect(EdgeService.remove).toHaveBeenCalledWith('e-1')
    expect(useCanvasStore.getState().edges).toHaveLength(0)
  })

  it('undo 重建邊', async () => {
    vi.mocked(EdgeService.remove).mockResolvedValue(undefined as any)
    vi.mocked(EdgeService.create).mockResolvedValue(edge)

    const cmd = new RemoveEdgeCommand('e-1')
    await cmd.execute()
    await cmd.undo()

    expect(EdgeService.create).toHaveBeenCalled()
    expect(useCanvasStore.getState().edges).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `cd client && npx vitest run src/commands/remove-edge.command.spec.ts`
Expected: FAIL

- [ ] **Step 3: 實作 RemoveEdgeCommand**

```typescript
// client/src/commands/remove-edge.command.ts
import type { CanvasCommand } from './canvas-command'
import type { EdgeDto, CreateEdgeDto } from '../types'
import { EdgeService } from '../services/edge.service'
import { useCanvasStore } from '../stores/canvas.store'

/**
 * 刪除邊指令
 * execute: DELETE /edges/:id -> 從 store 移除
 * undo: POST /edges（用快照重建）-> 加回 store
 */
export class RemoveEdgeCommand implements CanvasCommand {
  public readonly label = '刪除連結'
  private edgeSnapshot: EdgeDto | null = null

  constructor(private readonly edgeId: string) {
    const state = useCanvasStore.getState()
    this.edgeSnapshot = state.edges.find(e => e.id === edgeId) ?? null
  }

  async execute(): Promise<void> {
    await EdgeService.remove(this.edgeId)
    useCanvasStore.getState().removeEdgeFromStore(this.edgeId)
  }

  async undo(): Promise<void> {
    if (!this.edgeSnapshot) return
    const createDto: CreateEdgeDto = {
      blueprintId: this.edgeSnapshot.blueprintId,
      sourceNodeId: this.edgeSnapshot.sourceNodeId,
      targetNodeId: this.edgeSnapshot.targetNodeId,
      direction: this.edgeSnapshot.direction,
      magnitude: this.edgeSnapshot.magnitude,
      theoryIds: this.edgeSnapshot.theoryIds,
      reasoning: this.edgeSnapshot.reasoning,
    }
    const newEdge = await EdgeService.create(createDto)
    useCanvasStore.getState().addEdgeToStore(newEdge)
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `cd client && npx vitest run src/commands/remove-edge.command.spec.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/commands/remove-edge.command.ts client/src/commands/remove-edge.command.spec.ts
git commit -m "feat(undo): add RemoveEdgeCommand with tests"
```

---

### Task 7: Barrel Export

**Files:**
- Create: `client/src/commands/index.ts`

- [ ] **Step 1: 建立 barrel export**

```typescript
// client/src/commands/index.ts
export type { CanvasCommand } from './canvas-command'
export { AddNodeCommand } from './add-node.command'
export { RemoveNodeCommand } from './remove-node.command'
export { AddEdgeCommand } from './add-edge.command'
export { RemoveEdgeCommand } from './remove-edge.command'
```

- [ ] **Step 2: Commit**

```bash
git add client/src/commands/index.ts
git commit -m "feat(undo): add commands barrel export"
```

---

### Task 8: 整合至 UI 元件

**Files:**
- Modify: `client/src/components/pages/CanvasPage.tsx`
- Modify: `client/src/components/canvas/BlueprintCanvas.tsx`
- Modify: `client/src/components/panels/NodeInfoPanel.tsx`

- [ ] **Step 1: 修改 CanvasPage.tsx**

改動摘要：
1. import `useHistoryStore` 和 `AddNodeCommand`
2. `handleAddNode` 改用 `executeCommand(new AddNodeCommand(dto))`
3. 加 undo/redo 按鈕到工具列
4. 加 `useEffect` 鍵盤監聽 Ctrl+Z / Ctrl+Y
5. 加 `useEffect` 在 `blueprintId` 變更時清空歷史

完整修改後的 CanvasPage.tsx：

```typescript
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BlueprintCanvas } from '../canvas/BlueprintCanvas'
import { NodeInfoPanel } from '../panels/NodeInfoPanel'
import { useCanvasStore } from '../../stores/canvas.store'
import { useHistoryStore } from '../../stores/history.store'
import { AddNodeCommand } from '../../commands'
import { NodeType, NodeSize, TimeScale } from '../../types'

/** 畫布主頁面 — 包含工具列、React Flow 畫布、節點資訊面板 */
export function CanvasPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>()
  const navigate = useNavigate()
  const { selectedNodeId } = useCanvasStore()
  const { undoStack, redoStack, undo, redo, clearHistory } = useHistoryStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.EVENT)
  const [newNodeSize, setNewNodeSize] = useState<NodeSize>(NodeSize.LARGE)
  const [newTimeScale, setNewTimeScale] = useState<TimeScale>(TimeScale.MEDIUM)

  // 藍圖切換時清空歷史
  useEffect(() => {
    clearHistory()
  }, [blueprintId, clearHistory])

  // 鍵盤快捷鍵
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
    }))
    setNewNodeTitle('')
    setShowAddForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 工具列 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>← 返回列表</button>
        <button onClick={() => setShowAddForm(!showAddForm)}>+ 新增節點</button>
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
          <button type="submit">新增</button>
          <button type="button" onClick={() => setShowAddForm(false)}>取消</button>
        </form>
      )}

      {/* 主體：畫布 + 側邊面板 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <BlueprintCanvas blueprintId={blueprintId} />
        </div>
        {selectedNodeId && (
          <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
            <NodeInfoPanel nodeId={selectedNodeId} blueprintId={blueprintId} />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 修改 BlueprintCanvas.tsx — onConnect 改用 executeCommand**

將 `onConnect` 中的 `storeAddEdge(...)` 改為：

```typescript
// 舊：
storeAddEdge({...})

// 新：
import { useHistoryStore } from '../../stores/history.store'
import { AddEdgeCommand } from '../../commands'

// 在 onConnect callback 內：
const { executeCommand } = useHistoryStore.getState()
executeCommand(new AddEdgeCommand({
  blueprintId,
  sourceNodeId: connection.source,
  targetNodeId: connection.target,
  direction: Direction.PROMOTES,
  magnitude: Magnitude.MEDIUM,
  theoryIds: [],
}))
```

同時從 `useCanvasStore` 的解構中移除 `addEdge: storeAddEdge`。

- [ ] **Step 3: 修改 NodeInfoPanel.tsx — removeNode 改用 executeCommand**

將刪除按鈕的 onClick 改為：

```typescript
import { useHistoryStore } from '../../stores/history.store'
import { RemoveNodeCommand } from '../../commands'

// 刪除按鈕 onClick：
onClick={async () => {
  const { executeCommand } = useHistoryStore.getState()
  const success = await executeCommand(new RemoveNodeCommand(nodeId))
  // 只在刪除成功時才關閉面板
  if (success) selectNode(null)
}}
```

從 `useCanvasStore` 的解構中移除 `removeNode`。

- [ ] **Step 4: 執行所有測試確認未破壞既有功能**

Run: `cd client && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/pages/CanvasPage.tsx client/src/components/canvas/BlueprintCanvas.tsx client/src/components/panels/NodeInfoPanel.tsx
git commit -m "feat(undo): integrate undo/redo into CanvasPage, BlueprintCanvas, NodeInfoPanel"
```

---

### Task 9: 全部測試 + 推送

- [ ] **Step 1: 執行全部測試**

Run: `cd client && npx vitest run`
Expected: 全部 PASS

- [ ] **Step 2: 推送到 remote**

```bash
git push origin master
```

- [ ] **Step 3: 更新 PR #1 或建立新 PR**

如果需要建立新 PR：
```bash
gh pr create --base main --head master --title "feat: canvas undo/redo with Command Pattern" --body "..."
```
