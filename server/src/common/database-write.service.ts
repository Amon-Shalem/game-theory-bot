import { Injectable } from '@nestjs/common'
import { Mutex } from 'async-mutex'

/**
 * 統一管理所有資料庫寫入操作的服務
 * 使用 Mutex 確保 SQLite 寫入串行化，避免並發衝突
 * 所有 Repository 的 create / update / delete 必須透過此服務執行
 */
@Injectable()
export class DatabaseWriteService {
  private readonly mutex = new Mutex()

  /**
   * 串行化執行寫入操作
   * @param operation - 要執行的非同步寫入函式
   * @returns 寫入操作的回傳值
   * @throws 原始錯誤（mutex 保證即使拋出錯誤也會釋放鎖）
   */
  async write<T>(operation: () => Promise<T>): Promise<T> {
    const release = await this.mutex.acquire()
    try {
      return await operation()
    } finally {
      release()
    }
  }
}
