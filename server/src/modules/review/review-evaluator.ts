import { Injectable } from '@nestjs/common'
import { ReviewVerdict, TimeScale } from '@game-theory-bot/shared'

/** 到期門檻（週數），超過此週數且仍 PENDING 的節點開始緩慢衰減 */
const DECAY_THRESHOLD_WEEKS: Record<TimeScale, number> = {
  [TimeScale.SHORT]: 4,
  [TimeScale.MEDIUM]: 12,
  [TimeScale.LONG]: 52,
}

const WEIGHT_MIN = 0.1
const WEIGHT_MAX = 3.0
const CONFIRMED_MULTIPLIER = 1.3
const REFUTED_MULTIPLIER = 0.6
const PENDING_EXPIRED_MULTIPLIER = 0.95

/**
 * 根據 AI 判定結果計算節點新 weight
 * 規則詳見 docs/superpowers/specs/2026-03-31-game-theory-bot-design.md § 六
 */
@Injectable()
export class ReviewEvaluator {
  /**
   * 計算回顧後的新 weight
   * @param verdict - AI 判定結果
   * @param currentWeight - 節點目前的 weight
   * @param timeScale - 節點的時間尺度
   * @param weeksSinceCreation - 節點建立至今的週數
   * @returns 更新後的 weight（已 clamp 至 0.1~3.0）
   */
  calculateNewWeight(
    verdict: ReviewVerdict,
    currentWeight: number,
    timeScale: TimeScale,
    weeksSinceCreation: number,
  ): number {
    let newWeight = currentWeight

    if (verdict === ReviewVerdict.CONFIRMED) {
      newWeight = currentWeight * CONFIRMED_MULTIPLIER
    } else if (verdict === ReviewVerdict.REFUTED) {
      newWeight = currentWeight * REFUTED_MULTIPLIER
    } else {
      // PENDING — 判斷是否已超過到期門檻
      const threshold = DECAY_THRESHOLD_WEEKS[timeScale]
      if (weeksSinceCreation > threshold) {
        newWeight = currentWeight * PENDING_EXPIRED_MULTIPLIER
      }
    }

    return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, newWeight))
  }

  /**
   * 計算節點建立至今的週數
   * @param createdAt - 節點建立時間
   * @returns 週數（無條件捨去）
   */
  weeksSince(createdAt: Date): number {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    return Math.floor((Date.now() - createdAt.getTime()) / msPerWeek)
  }
}
