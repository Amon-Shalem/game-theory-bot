import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

/** 理論 Entity — promptFragment 為餵給 AI 的 Prompt 片段 */
@Entity('theories')
export class TheoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text' })
  promptFragment!: string

  /** true = 系統預設（唯讀），false = 使用者自訂 */
  @Column({ type: 'integer', default: 0 })
  isPreset!: boolean

  /** 以 JSON 字串儲存 string[] */
  @Column({ type: 'text', default: '[]' })
  tagsJson!: string

  get tags(): string[] {
    return JSON.parse(this.tagsJson)
  }

  set tags(value: string[]) {
    this.tagsJson = JSON.stringify(value)
  }

  @CreateDateColumn()
  createdAt!: Date
}
