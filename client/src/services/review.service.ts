import api from './api'
import type { ReviewJobDto, ReviewRecordDto, TriggerReviewDto } from '../types'

/** 回顧 API 服務 */
export const ReviewService = {
  /**
   * 手動觸發指定藍圖的回顧
   * @param blueprintId - 藍圖 ID
   * @param dto - 可選 modelId（未傳時後端自動選擇）
   * @returns 任務初始狀態（非同步執行）
   */
  async trigger(blueprintId: string, dto: TriggerReviewDto = {}): Promise<ReviewJobDto> {
    const res = await api.post<ReviewJobDto>(`/review/blueprints/${blueprintId}`, dto)
    return res.data
  },

  /**
   * 查詢回顧任務進度
   * @param jobId - 任務 ID
   */
  async getJobStatus(jobId: string): Promise<ReviewJobDto> {
    const res = await api.get<ReviewJobDto>(`/review/jobs/${jobId}`)
    return res.data
  },

  /**
   * 取得藍圖的所有回顧紀錄
   * @param blueprintId - 藍圖 ID
   */
  async getRecords(blueprintId: string): Promise<ReviewRecordDto[]> {
    const res = await api.get<ReviewRecordDto[]>(`/review/blueprints/${blueprintId}/records`)
    return res.data
  },
}
