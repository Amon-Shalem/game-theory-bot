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

- `theoryIds` 選擇 UI（等 Theory UI 完成後補入；但 UpdateEdgeCommand 的 undo 快照仍須包含 theoryIds 以維持資料完整性）
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
  → 使用者填表後確認 → executeCommand(new AddEdgeCommand({ ...connection, ...formValues }))
  → 使用者按取消 → setEdgeModal(null)（edge 尚未建立，無需清理 store）

點擊 edge（onEdgeContextMenu 觸發時呼叫 e.stopPropagation() 阻止此事件）
  → BlueprintCanvas.onEdgeClick(edgeId)
  → CanvasPage: setEdgeModal({ mode: 'edit', edgeId })
  → 使用者修改後確認 → executeCommand(new UpdateEdgeCommand(edgeId, formValues))

右鍵節點
  → BlueprintCanvas.onNodeRightClick(nodeId, x, y)
  → CanvasPage: setContextMenu({ type: 'node', nodeId, x, y })

右鍵 edge（呼叫 e.stopPropagation() 阻止觸發 onEdgeClick）
  → BlueprintCanvas.onEdgeRightClick(edgeId, x, y)
  → CanvasPage: setContextMenu({ type: 'edge', edgeId, x, y })
```

---

## 四、元件設計

### EdgeSettingsModal

```typescript
interface EdgeSettingsModalProps {
  mode: 'create' | 'edit'
  /** create 模式可省略；edit 模式必須提供完整的既有值 */
  initialValues?: EdgeFormValues
  onConfirm: (values: EdgeFormValues) => void
  onCancel: () => void
}

interface EdgeFormValues {
  direction: Direction
  magnitude: Magnitude
  reasoning: string
}
```

**欄位（依 shared/src/types/edge.ts 實際定義）：**
- direction：SELECT
  - PROMOTES（顯示為「促進」）
  - INHIBITS（顯示為「抑制」）
  - NEUTRAL（顯示為「中性」）
  - 預設 PROMOTES
- magnitude：SELECT
  - SMALL（顯示為「低」）
  - MEDIUM（顯示為「中」）
  - LARGE（顯示為「高」）
  - 預設 MEDIUM
- reasoning：TEXTAREA，可留空

**行為：**
- Modal 本身不呼叫 API，只收集表單值後呼叫 `onConfirm`
- edit 模式由 `initialValues` 帶入現有值（欄位保證完整，無需 null guard）
- 按取消或點選背景關閉，呼叫 `onCancel`
- create 模式按取消：僅 `setEdgeModal(null)`，edge 尚未建立無需其他清理

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
- **位置溢出處理**：初始渲染設 `visibility: hidden` 遮蔽閃爍；元件掛載後透過 `useRef` 取得選單實際寬高，再透過 `useEffect` 計算是否超出視口（`x + menuWidth > window.innerWidth` 時向左偏移，`y` 同理），確認位置後設回 `visibility: visible`

### NodeContextMenu 項目

| 項目 | 行為 | 狀態 |
|------|------|------|
| 新增子節點 | 關閉選單 → setPendingParentNodeId → 開啟 add-node 表單 | 可用 |
| 刪除節點 | `executeCommand(new RemoveNodeCommand(nodeId))` | 可用 |
| AI 展開 | 無動作，僅 `node.size === NodeSize.LARGE` 時顯示 | disabled |
| AI 建議連結 | 無動作 | disabled |

### EdgeContextMenu 項目

| 項目 | 行為 |
|------|------|
| 編輯連結 | 關閉選單 → 開啟 EdgeSettingsModal（edit 模式） |
| 刪除連結 | `executeCommand(new RemoveEdgeCommand(edgeId))` |

---

## 五、BlueprintCanvas 介面變更

```typescript
interface Props {
  blueprintId: string
  onConnectionAttempt: (connection: Connection) => void
  /** onEdgeContextMenu 觸發時需 stopPropagation 阻止此事件 */
  onEdgeClick: (edgeId: string) => void
  onNodeRightClick: (nodeId: string, x: number, y: number) => void
  onEdgeRightClick: (edgeId: string, x: number, y: number) => void
}
```

- `onConnect` 改為呼叫 `onConnectionAttempt`（不再直接 executeCommand）
- `onEdgeContextMenu` 中需呼叫 `event.stopPropagation()` 以阻止同時觸發 `onEdgeClick`

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

**edit 模式的 initialValues 來源：** `CanvasPage` 在 `setEdgeModal({ mode: 'edit', edgeId })` 時，同步從 `useCanvasStore.getState().edges` 查找對應 edge，將其 `direction`、`magnitude`、`reasoning` 作為 `initialValues` 傳入 Modal，不需要額外的 API call。

**「新增子節點」流程：**
1. `setContextMenu(null)` 關閉選單
2. `setPendingParentNodeId(nodeId)`
3. `setShowAddForm(true)` 開啟現有 add-node 表單
4. 表單送出時帶入 `parentNodeId: pendingParentNodeId ?? undefined`
5. 送出成功或按取消：`setPendingParentNodeId(null)`

**工具列「+ 新增節點」按鈕：** 點擊時先 `setPendingParentNodeId(null)` 再開啟表單，避免殘留舊值。

---

## 七、UpdateEdgeCommand

```typescript
class UpdateEdgeCommand implements CanvasCommand {
  public readonly label: string
  /** 快照包含 theoryIds，確保 undo 完整還原 */
  private previousValues: UpdateEdgeDto

  constructor(
    private readonly edgeId: string,
    private readonly newValues: EdgeFormValues
  ) {
    const edge = useCanvasStore.getState().edges.find(e => e.id === edgeId)!
    this.label = `編輯連結: ${edge.sourceNodeId} → ${edge.targetNodeId}`
    this.previousValues = {
      direction: edge.direction,
      magnitude: edge.magnitude,
      reasoning: edge.reasoning,
      theoryIds: edge.theoryIds,   // 完整快照，避免 undo 後遺失
    }
  }

  async execute(): Promise<void> {
    // API 失敗時例外向上傳播，store 不更新（與 AddEdgeCommand 等現有 Command 慣例一致）
    // history store 的 executeCommand 在 execute() 拋出時不推入 undo stack
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
// CanvasState interface 新增：
updateEdgeInStore: (edge: EdgeDto) => void

// 實作：
updateEdgeInStore: (edge) => set(state => ({
  edges: state.edges.map(e => e.id === edge.id ? edge : e),
})),
```

---

## 八、前提確認（Task 1 驗證）

根據現有程式碼確認狀態：

| 項目 | 狀態 | 位置 |
|------|------|------|
| `PUT /edges/:id` 後端端點 | 已存在（`@Put(':id')`） | `server/src/modules/edge/edge.controller.ts:20` |
| `UpdateEdgeDto` shared 型別 | 已存在 | `shared/src/types/edge.ts` |
| `EdgeService.update()` | 已存在（使用 `api.put`） | `client/src/services/edge.service.ts:8` |

Task 1 僅需確認以上三項，若有異動則補齊。

---

## 九、測試策略

| 測試對象 | 測試內容 |
|---------|---------|
| `UpdateEdgeCommand` | execute 呼叫 API 並更新 store；undo 還原舊值（含 theoryIds）；execute 失敗時 store 不被更新 |
| `EdgeSettingsModal` | 表單以預設值渲染（create 模式）；edit 模式帶入 initialValues；submit 呼叫 onConfirm 帶正確值；取消呼叫 onCancel |
| `ContextMenu` | 點選外部關閉；children 正確渲染；接近視口邊緣時位置正確調整 |
| `NodeContextMenu` | 四個項目正確渲染；「新增子節點」與「刪除節點」可點擊；AI 展開僅 LARGE 節點顯示，SMALL 節點不顯示 |
| `EdgeContextMenu` | 兩個項目正確渲染並可點擊 |

---

## 十、新增檔案清單

| 檔案 | 類型 |
|------|------|
| `client/src/components/modals/EdgeSettingsModal.tsx` | 新增 |
| `client/src/components/modals/EdgeSettingsModal.spec.tsx` | 新增 |
| `client/src/components/menus/ContextMenu.tsx` | 新增 |
| `client/src/components/menus/ContextMenu.spec.tsx` | 新增 |
| `client/src/components/menus/NodeContextMenu.tsx` | 新增 |
| `client/src/components/menus/NodeContextMenu.spec.tsx` | 新增 |
| `client/src/components/menus/EdgeContextMenu.tsx` | 新增 |
| `client/src/components/menus/EdgeContextMenu.spec.tsx` | 新增 |
| `client/src/commands/update-edge.command.ts` | 新增 |
| `client/src/commands/update-edge.command.spec.ts` | 新增 |
| `client/src/components/canvas/BlueprintCanvas.tsx` | 修改 |
| `client/src/components/pages/CanvasPage.tsx` | 修改 |
| `client/src/stores/canvas.store.ts` | 修改 |
| `client/src/commands/index.ts` | 修改 |
