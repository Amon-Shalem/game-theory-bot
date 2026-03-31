import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { Direction, Magnitude } from '@game-theory-bot/shared'

/** 因果連結 Entity — theoryIds 允許為空陣列 */
@Entity('edges')
export class EdgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  blueprintId!: string

  @Column({ type: 'text' })
  sourceNodeId!: string

  @Column({ type: 'text' })
  targetNodeId!: string

  /** 以 JSON 字串儲存 string[]，允許空陣列 */
  @Column({ type: 'text', default: '[]' })
  theoryIdsJson!: string

  get theoryIds(): string[] {
    return JSON.parse(this.theoryIdsJson)
  }

  set theoryIds(value: string[]) {
    this.theoryIdsJson = JSON.stringify(value)
  }

  @Column({ type: 'text', enum: Direction })
  direction!: Direction

  @Column({ type: 'text', enum: Magnitude })
  magnitude!: Magnitude

  @Column({ type: 'text', default: '' })
  reasoning!: string

  @Column({ type: 'text', default: 'user' })
  createdBy!: 'user' | 'ai'
}
