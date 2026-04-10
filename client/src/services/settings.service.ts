const STORAGE_KEY = 'gtb-settings'

/** 畫布背景樣式選項 */
export type CanvasBackgroundVariant = 'none' | 'dots' | 'lines' | 'cross'

export interface AppSettings {
  openRouterUrl: string
  openRouterSecret: string
  modelId: string
  /** 畫布背景樣式：none=空白、dots=點陣、lines=方格、cross=十字 */
  canvasBackgroundVariant: CanvasBackgroundVariant
  /** 畫布底色（CSS hex 色碼） */
  canvasBackgroundColor: string
  /** 圖案顏色（點、線的 CSS hex 色碼） */
  canvasPatternColor: string
}

const DEFAULT_SETTINGS: AppSettings = {
  openRouterUrl: 'https://openrouter.ai/api/v1',
  openRouterSecret: '',
  modelId: 'anthropic/claude-sonnet-4',
  canvasBackgroundVariant: 'dots',
  canvasBackgroundColor: '#ffffff',
  canvasPatternColor: '#aaaaaa',
}

/**
 * 從 localStorage 讀取設定
 * 若無既有設定則回傳預設值
 */
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** 儲存設定到 localStorage */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/** 清除 localStorage 中的設定 */
export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY)
}
