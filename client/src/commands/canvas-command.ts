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
