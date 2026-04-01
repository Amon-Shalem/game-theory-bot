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

    expect(cmd.execute).toHaveBeenCalledTimes(2)
    expect(useHistoryStore.getState().undoStack).toHaveLength(1)
    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
  })

  it('executeCommand 清空 redoStack', async () => {
    const cmd1 = createMockCommand('cmd1')
    const cmd2 = createMockCommand('cmd2')
    await useHistoryStore.getState().executeCommand(cmd1)
    await useHistoryStore.getState().undo()
    await useHistoryStore.getState().executeCommand(cmd2)

    expect(useHistoryStore.getState().redoStack).toHaveLength(0)
    expect(useHistoryStore.getState().undoStack).toHaveLength(1)
  })

  it('undoStack 上限 50，超過丟棄最舊的', async () => {
    for (let i = 0; i < 55; i++) {
      await useHistoryStore.getState().executeCommand(createMockCommand(`cmd-${i}`))
    }
    expect(useHistoryStore.getState().undoStack).toHaveLength(50)
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

    const p1 = useHistoryStore.getState().undo()
    const p2 = useHistoryStore.getState().undo()
    await Promise.all([p1, p2])

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

    const undoPromise = useHistoryStore.getState().undo()
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
