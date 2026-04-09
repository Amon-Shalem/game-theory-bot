import { DatabaseWriteService } from './database-write.service'

describe('DatabaseWriteService', () => {
  let service: DatabaseWriteService

  beforeEach(() => {
    service = new DatabaseWriteService()
  })

  it('should execute write operation and return result', async () => {
    const result = await service.write(async () => 42)
    expect(result).toBe(42)
  })

  it('should serialize concurrent writes', async () => {
    const order: number[] = []

    const write1 = service.write(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      order.push(1)
    })

    const write2 = service.write(async () => {
      order.push(2)
    })

    await Promise.all([write1, write2])

    // write1 先取得 mutex，因此 1 必定在 2 之前
    expect(order).toEqual([1, 2])
  })

  it('should release mutex even when operation throws', async () => {
    await expect(
      service.write(async () => { throw new Error('db error') })
    ).rejects.toThrow('db error')

    // mutex 應已釋放，下一個 write 能正常執行
    const result = await service.write(async () => 'ok')
    expect(result).toBe('ok')
  })
})
