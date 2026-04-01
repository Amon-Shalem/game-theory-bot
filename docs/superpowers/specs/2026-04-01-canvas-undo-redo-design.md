# Canvas Undo/Redo Design Spec

## Overview

為畫布（CanvasPage）實作 undo/redo 功能，使用 Command Pattern。涵蓋畫布內的節點與邊操作，前後端同步。

## Scope

### 包含
- 新增/刪除節點
- 新增/刪除邊
- 更新節點屬性（title, description, timeScale, status）

### 不包含
- 藍圖層級操作（建立/刪除/重新命名藍圖）
- 節點拖拉位置變更（目前位置未持久化到後端）
- 更新邊屬性（未來可擴展）

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
| `RemoveNodeCommand` | DELETE /nodes/:id -> 從 store 移除 | POST /nodes (用快照資料重建) -> 加回 store |
| `AddEdgeCommand` | POST /edges -> 加入 store | DELETE /edges/:id -> 從 store 移除 |
| `RemoveEdgeCommand` | DELETE /edges/:id -> 從 store 移除 | POST /edges (用快照資料重建) -> 加回 store |
| `UpdateNodeCommand` | PUT /nodes/:id (新值) -> 更新 store | PUT /nodes/:id (舊值) -> 更新 store |

每個 Command 在建構時保存足夠的快照資料，以便 undo 時重建。例如 `RemoveNodeCommand` 保存被刪除的完整 `NodeDto`。

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

  canUndo: boolean
  canRedo: boolean
}
```

規則：
- 堆疊上限 50 步，超過時丟棄最舊的指令
- 執行新指令時清空 redoStack
- `isUndoRedoing` flag 防止連點造成競態條件
- API 呼叫失敗時保持堆疊不變，顯示錯誤訊息

## Integration

### Canvas Store 改造

現有的 `addNode`、`removeNode` 等方法拆分為：
- **純 state 操作**（不含 API 呼叫）：供 Command 內部使用
- API 呼叫移到 Command 內

### 觸發方式

**鍵盤快捷鍵**（在 CanvasPage 加 `useEffect` 監聽 `keydown`）：
- `Ctrl+Z` (Windows) / `Cmd+Z` (Mac) -> undo()
- `Ctrl+Y` / `Ctrl+Shift+Z` / `Cmd+Shift+Z` -> redo()

**工具列按鈕**：
- "Undo" 按鈕，`disabled={!canUndo}`
- "Redo" 按鈕，`disabled={!canRedo}`

## File Changes

### 新增檔案

| 檔案 | 用途 |
|------|------|
| `client/src/commands/canvas-command.ts` | Command 介面定義 |
| `client/src/commands/add-node.command.ts` | 新增節點指令 |
| `client/src/commands/remove-node.command.ts` | 刪除節點指令 |
| `client/src/commands/add-edge.command.ts` | 新增邊指令 |
| `client/src/commands/remove-edge.command.ts` | 刪除邊指令 |
| `client/src/commands/update-node.command.ts` | 更新節點指令 |
| `client/src/stores/history.store.ts` | 歷史堆疊 store |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `client/src/stores/canvas.store.ts` | API 呼叫移出，保留純 state 操作方法 |
| `client/src/components/pages/CanvasPage.tsx` | 加鍵盤監聽 + undo/redo 按鈕 + 用 executeCommand 取代直接呼叫 |

## Error Handling

- Command 的 `execute()` / `undo()` 失敗時，不修改堆疊狀態
- 失敗時 console.error 記錄錯誤，並可透過 store 暴露 error state 供 UI 顯示
- `isUndoRedoing` flag 確保操作完成前不接受新的 undo/redo 請求

## Testing

每個 Command 需要單元測試，覆蓋：
- execute() 正確呼叫 API 並更新 store
- undo() 正確呼叫反向 API 並還原 store
- API 失敗時的錯誤處理

History Store 需要測試：
- executeCommand 推入 undoStack 並清空 redoStack
- undo/redo 正確移動指令在堆疊之間
- 堆疊上限 50 步的行為
- isUndoRedoing 防止重複觸發
