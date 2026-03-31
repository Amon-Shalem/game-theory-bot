import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { NodeType, NodeSize, NodeStatus, TimeScale } from '@game-theory-bot/shared'
import { BlueprintEntity } from './blueprint.entity'

/**
 * 節點 Entity
 * - size 是業務屬性（LARGE 可展開子節點），weight 是 UI 視覺驅動值
 * - parentNodeId 約束由 NodeService 在 Service 層驗證
 */
@Entity('nodes')
export class NodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  blueprintId!: string

  @ManyToOne(() => BlueprintEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blueprintId' })
  blueprint!: BlueprintEntity

  @Column({ type: 'text', enum: NodeType })
  type!: NodeType

  @Column({ type: 'text', enum: NodeSize })
  size!: NodeSize

  @Column({ type: 'text', enum: NodeStatus, default: NodeStatus.ACTIVE })
  status!: NodeStatus

  @Column({ type: 'text' })
  title!: string

  @Column({ type: 'text', default: '' })
  description!: string

  /** 視覺驅動值，初始 1.0，範圍 0.1~3.0 */
  @Column({ type: 'real', default: 1.0 })
  weight!: number

  @Column({ type: 'text', enum: TimeScale })
  timeScale!: TimeScale

  @Column({ type: 'text', default: 'user' })
  createdBy!: 'user' | 'ai'

  /** 小節點歸屬，僅 NodeSize.SMALL 可設定 */
  @Column({ type: 'text', nullable: true })
  parentNodeId!: string | null

  @CreateDateColumn()
  createdAt!: Date
}
