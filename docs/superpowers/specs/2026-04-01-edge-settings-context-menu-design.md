# Edge 設定面板 + 右鍵選單 — 系統設計規格

**日期**：2026-04-01
**狀態**：草稿

---

## 一、目標

補完畫布操作 UX：
1. 建立 / 編輯 Edge 時可設定 direction、magnitude、reasoning
2. 右鍵節點與 Edge 顯示操作選單

---

## 二、範圍

### 納入

- EdgeSettingsModal（create / edit 兩種模式）
- ContextMenu 通用容器
- NodeContextMenu（新增子節點、刪除節點、AI 占位按鈕）
- EdgeContextMenu（編輯連結、刪除連結）
- UpdateEdgeCommand（含 undo/redo）
- canvas.store 新增 `updateEdgeInStore`

### 排除

- `theoryIds` 選擇（等 Theory UI 完成後補入）
- AI 功能實作（占位 disabled 按鈕預留位置）

---

## 三、架構

### 狀態管理原則

所有 Modal / ContextMenu 的顯示狀態集中在 `CanvasPage`，`BlueprintCanvas` 透過 callback prop 向上通知事件，不自行管理 UI 狀態。

### 資料流

```
拖拽連線完成
  → BlueprintCanvas.onConnectionAttempt(connection)
  → CanvasPage: setEdgeModal({ mode: 'create', connection })
  → 使用者填表後確認
  → executeCommand(new AddEdgeCommand({ ...connection, ...formValues }))

點擊 edge
  → BlueprintCanvas.onEdgeClick(edgeId)
  → CanvasPage: setEdgeModal({ mode: 'edit', edgeId })
  → 使用者修改後確認
  → executeCommand(new UpdateEdgeCommand(edgeId, formValues))

右鍵節點
  → BlueprintCanvas.onNodeRightClick(nodeId, x, y)
  → CanvasPage: setContextMenu({ type: 'node', nodeId, x, y })

右鍵 edge
  → BlueprintCanvas.onEdgeRightClick(edgeId, x, y)
  → CanvasPage: setContextMenu({ type: 'edge', edgeId, x, y })
```

---

## 四、元件設計

### EdgeSettingsModal

```typescript
interface EdgeSettingsModalProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<EdgeFormValues>
  onConfirm: (values: EdgeFormValues) => void
  onCancel: () => void
}

interface EdgeFormValues {
  direction: Direction
  magnitude: Magnitude
  reasoning: string
}
```

**欄位：**
- direction：SELECT（PROMOTES / INHIBITS），預設 PROMOTES
- magnitude：SELECT（LOW / MEDIUM / HIGH），預設 MEDIUM
- reasoning：TEXTAREA，可留空

**行為：**
- Modal 本身不呼叫 API，只收集表單值後呼叫 `onConfirm`
- edit 模式由 `initialValues` 帶入現有值
- 按取消或點選背景關閉

### ContextMenu（通用容器）

```typescript
interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  children: React.ReactNode
}
```

- `position: fixed` 定位在滑鼠座標
- `useEffect` 監聽 `document mousedown`，點選範圍外自動關閉

### NodeContextMenu 項目

| 項目 | 行為 | 狀態 |
|------|------|------|
| 新增子節點 | 開啟 add-node 表單，帶入 parentNodeId | 可用 |
| 刪除節點 | `executeCommand(new RemoveNodeCommand(nodeId))` | 可用 |
| AI 展開 | 無動作（僅 NodeSize.LARGE 顯示） | disabled |
| AI 建議連結 | 無動作 | disabled |

### EdgeContextMenu 項目

| 項目 | 行為 |
|------|------|
| 編輯連結 | 開啟 EdgeSettingsModal（edit 模式） |
| 刪除連結 | `executeCommand(new RemoveEdgeCommand(edgeId))` |

---

## 五、BlueprintCanvas 介面變更

```typescript
interface Props {
  blueprintId: string
  onConnectionAttempt: (connection: Connection) => void
  onEdgeClick: (edgeId: string) => void
  onNodeRightClick: (nodeId: string, x: number, y: number) => void
  onEdgeRightClick: (edgeId: string, x: number, y: number) => void
}
```

- `onConnect` 改為呼叫 `onConnectionAttempt`（不再直接 executeCommand）
- `onEdgeContextMenu`、`onNodeContextMenu` 為 React Flow 內建 callback，直接對應 prop

---

## 六、CanvasPage 狀態新增

```typescript
// Edge Settings Modal
const [edgeModal, setEdgeModal] = useState<{
  mode: 'create'
  connection: Connection
} | {
  mode: 'edit'
  edgeId: string
} | null>(null)

// Context Menu
const [contextMenu, setContextMenu] = useState<{
  type: 'node'
  nodeId: string
  x: number
  y: number
} | {
  type: 'edge'
  edgeId: string
  x: number
  y: number
} | null>(null)

// 新增子節點用
const [pendingParentNodeId, setPendingParentNodeId] = useState<string | null>(null)
```

「新增子節點」流程：
1. `setContextMenu(null)` 關閉選單
2. `setPendingParentNodeId(nodeId)`
3. `setShowAddForm(true)` 開啟現有 add-node 表單
4. 表單送出時帶入 `parentNodeId: pendingParentNodeId`

---

## 七、UpdateEdgeCommand

```typescript
class UpdateEdgeCommand implements CanvasCommand {
  label = '編輯連結'
  private previousValues: EdgeFormValues

  constructor(
    private readonly edgeId: string,
    private readonly newValues: EdgeFormValues
  ) {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)!
    this.previousValues = {
      direction: edge.direction,
      magnitude: edge.magnitude,
      reasoning: edge.reasoning,
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

### canvas.store 新增

```typescript
updateEdgeInStore: (edge: EdgeDto) => void
// 實作：
updateEdgeInStore: (edge) => set(state => ({
  edges: state.edges.map(e => e.id === edge.id ? edge : e),
})),
```

---

## 八、前提確認（Task 1 驗證）

實作前需確認後端是否已有：
- `PATCH /edges/:id` 端點
- `UpdateEdgeDto` 在 shared types
- `EdgeService.update()` 在前端服務層

若缺漏則補齊後再繼續。

---

## 九、測試策略

| 測試對象 | 測試內容 |
|---------|---------|
| `UpdateEdgeCommand` | execute 呼叫 API 並更新 store；undo 還原舊值 |
| `EdgeSettingsModal` | 表單渲染正確；submit 呼叫 onConfirm 帶正確值；取消呼叫 onCancel |
| `ContextMenu` | 點選外部關閉；children 正確渲染 |

---

## 十、新增檔案清單

| 檔案 | 類型 |
|------|------|
| `client/src/components/modals/EdgeSettingsModal.tsx` | 新增 |
| `client/src/components/modals/EdgeSettingsModal.spec.tsx` | 新增 |
| `client/src/components/menus/ContextMenu.tsx` | 新增 |
| `client/src/components/menus/NodeContextMenu.tsx` | 新增 |
| `client/src/components/menus/EdgeContextMenu.tsx` | 新增 |
| `client/src/commands/update-edge.command.ts` | 新增 |
| `client/src/commands/update-edge.command.spec.ts` | 新增 |
| `client/src/components/canvas/BlueprintCanvas.tsx` | 修改 |
| `client/src/components/pages/CanvasPage.tsx` | 修改 |
| `client/src/stores/canvas.store.ts` | 修改 |
| `client/src/commands/index.ts` | 修改 |
