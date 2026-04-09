# Canvas Undo/Redo Design Spec

## Overview

為畫布（CanvasPage）實作 undo/redo 功能，使用 Command Pattern。涵蓋畫布內的節點與邊操作，前後端同步。

## Scope

### 包含
- 新增/刪除節點
- 新增/刪除邊

### 不包含
- 更新節點屬性（目前 UI 無編輯入口，待編輯功能完成後再新增 `UpdateNodeCommand`）
- 更新邊屬性（未來可擴展）
- 藍圖層級操作（建立/刪除/重新命名藍圖）
- 節點拖拉位置變更（目前位置未持久化到後端。若未來要持久化節點位置，需新增 `MoveNodeCommand`）

## Architecture

### Command Interface

```typescript
interface CanvasCommand {
  /** 執行操作（呼叫 API + 更新 store） */
  execute(): Promise<void>
  /** 撤銷操作（呼叫反向 API + 更新 store） */
  undo(): Promise<void>
  /** 顯示名稱，用於 UI tooltip */
  label: string
}
```

### Command Classes

| Command | execute() | undo() |
|---------|-----------|--------|
| `AddNodeCommand` | POST /nodes -> 加入 store | DELETE /nodes/:id -> 從 store 移除 |
| `RemoveNodeCommand` | DELETE /nodes/:id + 關聯邊 -> 從 store 移除 | POST /nodes + POST 關聯邊（用快照重建）-> 加回 store |
| `AddEdgeCommand` | POST /edges -> 加入 store | DELETE /edges/:id -> 從 store 移除 |
| `RemoveEdgeCommand` | DELETE /edges/:id -> 從 store 移除 | POST /edges (用快照資料重建) -> 加回 store |

每個 Command 在建構時保存足夠的快照資料，以便 undo 時重建：
- `RemoveNodeCommand` 保存被刪除的完整 `NodeDto` **以及所有關聯的 `EdgeDto[]`**，undo 時先重建節點再重建每條關聯邊
- `RemoveEdgeCommand` 保存被刪除的完整 `EdgeDto`
- `AddNodeCommand` / `AddEdgeCommand` 在 execute 後記住新建資源的 ID，供 undo 時刪除

### API 呼叫順序約定

所有 Command 一律採用 **先 API，成功後才更新 store** 的順序（非樂觀更新）。API 失敗時 store 不會被修改，無需 rollback。

### History Store

獨立的 Zustand store 管理歷史堆疊：

```typescript
interface HistoryState {
  undoStack: CanvasCommand[]   // 已執行的指令
  redoStack: CanvasCommand[]   // 被撤銷的指令
  isUndoRedoing: boolean       // 防止 undo/redo 過程中重複觸發

  executeCommand(cmd: CanvasCommand): Promise<void>
  undo(): Promise<void>
  redo(): Promise<void>
  clearHistory(): void
}
```

規則：
- 堆疊上限 50 步，超過時丟棄最舊的指令
- 執行新指令時清空 redoStack
- `isUndoRedoing` 防護在 store 層實作（非 UI 層），入口處檢查後直接 return：

```typescript
undo: async () => {
  const { isUndoRedoing, undoStack } = get()
  if (isUndoRedoing || undoStack.length === 0) return
  set({ isUndoRedoing: true })
  try { /* ... */ } finally { set({ isUndoRedoing: false }) }
}
```

- API 呼叫失敗時保持堆疊不變，console.error 記錄錯誤
- `canUndo` / `canRedo` 不在 store 中存為 state，改在元件中用 selector 計算：`undoStack.length > 0`
- **注意：** history store 不可使用 persist / devtools middleware（Command 為 class 實例，無法 JSON 序列化）

### 藍圖切換清空歷史

當 `blueprintId` 變更時（路由切換），必須呼叫 `clearHistory()` 清空 undoStack 和 redoStack，避免跨藍圖的 Command 引用錯誤的節點/邊 ID。

## Integration

### Canvas Store 改造

現有的 `addNode`、`removeNode` 等方法拆分為：
- **純 state 操作**（不含 API 呼叫）：如 `addNodeToStore(node)` / `removeNodeFromStore(id)` 等，供 Command 內部使用
- API 呼叫移到 Command 內

### 觸發方式

**鍵盤快捷鍵**（在 CanvasPage 加 `useEffect` 監聽 `keydown`）：
- `Ctrl+Z` (Windows) / `Cmd+Z` (Mac) -> undo()
- `Ctrl+Y` / `Ctrl+Shift+Z` / `Cmd+Shift+Z` -> redo()

**工具列按鈕**：
- "Undo" 按鈕，`disabled` 由 `undoStack.length === 0` 控制
- "Redo" 按鈕，`disabled` 由 `redoStack.length === 0` 控制

## File Changes

### 新增檔案

| 檔案 | 用途 |
|------|------|
| `client/src/commands/canvas-command.ts` | Command 介面定義 |
| `client/src/commands/add-node.command.ts` | 新增節點指令 |
| `client/src/commands/remove-node.command.ts` | 刪除節點指令（含關聯邊快照） |
| `client/src/commands/add-edge.command.ts` | 新增邊指令 |
| `client/src/commands/remove-edge.command.ts` | 刪除邊指令 |
| `client/src/commands/index.ts` | Barrel export |
| `client/src/stores/history.store.ts` | 歷史堆疊 store |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `client/src/stores/canvas.store.ts` | API 呼叫移出，新增純 state 操作方法 |
| `client/src/components/pages/CanvasPage.tsx` | 加鍵盤監聽 + undo/redo 按鈕 + 用 executeCommand 取代直接呼叫 + 藍圖切換時清空歷史 |
| `client/src/components/canvas/BlueprintCanvas.tsx` | onConnect 改用 executeCommand |
| `client/src/components/panels/NodeInfoPanel.tsx` | removeNode 改用 executeCommand |

## Error Handling

- Command 一律先 API 後 store，失敗時堆疊與 store 均不變
- 失敗時 console.error 記錄錯誤
- `isUndoRedoing` flag 在 store 層確保操作完成前不接受新的 undo/redo 請求

## Testing

測試檔案放在同目錄（沿用現有慣例）。

每個 Command 需要單元測試，覆蓋：
- execute() 正確呼叫 API 並更新 store
- undo() 正確呼叫反向 API 並還原 store
- RemoveNodeCommand 的關聯邊快照與還原
- API 失敗時的錯誤處理

History Store 需要測試：
- executeCommand 推入 undoStack 並清空 redoStack
- undo/redo 正確移動指令在堆疊之間
- 堆疊上限 50 步的行為
- isUndoRedoing 防止重複觸發
- clearHistory 正確清空兩個堆疊

測試檔案：
- `client/src/commands/add-node.command.spec.ts`
- `client/src/commands/remove-node.command.spec.ts`
- `client/src/commands/add-edge.command.spec.ts`
- `client/src/commands/remove-edge.command.spec.ts`
- `client/src/stores/history.store.spec.ts`
