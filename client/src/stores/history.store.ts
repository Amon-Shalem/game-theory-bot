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
