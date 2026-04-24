import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { NodeStatus, ModelTier, type ReviewJobDto, type ReviewJobStatus } from '@game-theory-bot/shared'
import { NodeEntity } from '../../database/entities/node.entity'
import { ReviewRecordEntity } from '../../database/entities/review-record.entity'
import { AIModelEntity } from '../../database/entities/ai-model.entity'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { VerificationAIService } from '../ai/services/verification.ai-service'
import { ReviewEvaluator } from './review-evaluator'

/** 執行中的回顧任務（in-memory，重啟後清除） */
interface ReviewJob {
  jobId: string
  blueprintId: string
  startedAt: Date
  status: ReviewJobStatus
  finishedAt?: Date
  error?: string
}

/**
 * 回顧業務邏輯服務
 * 支援手動觸發與週期排程，為各節點呼叫 VerificationAIService 並更新 weight
 */
@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name)
  /** 以 jobId 為 key 的 in-memory 任務狀態表 */
  private readonly jobs = new Map<string, ReviewJob>()

  constructor(
    @InjectRepository(NodeEntity)
    private readonly nodeRepo: Repository<NodeEntity>,
    @InjectRepository(ReviewRecordEntity)
    private readonly reviewRepo: Repository<ReviewRecordEntity>,
    @InjectRepository(AIModelEntity)
    private readonly aiModelRepo: Repository<AIModelEntity>,
    @InjectRepository(BlueprintEntity)
    private readonly blueprintRepo: Repository<BlueprintEntity>,
    private readonly dbWrite: DatabaseWriteService,
    private readonly verificationService: VerificationAIService,
    private readonly evaluator: ReviewEvaluator,
  ) {}

  /**
   * 非同步觸發指定藍圖的回顧，立即回傳 jobId
   * @param blueprintId - 藍圖 ID
   * @param modelId - 使用的模型識別碼（未傳時自動選擇 TOP tier 第一個）
   * @returns 任務初始狀態
   */
  async triggerReview(blueprintId: string, modelId?: string): Promise<ReviewJobDto> {
    const blueprint = await this.blueprintRepo.findOneBy({ id: blueprintId })
    if (!blueprint) throw new NotFoundException(`Blueprint ${blueprintId} not found`)

    const resolvedModel = modelId ?? await this.resolveDefaultModel()
    const job: ReviewJob = {
      jobId: randomUUID(),
      blueprintId,
      startedAt: new Date(),
      status: 'RUNNING',
    }
    this.jobs.set(job.jobId, job)

    // 非同步執行，不等待
    this.runBatchReview(job, resolvedModel).catch(err => {
      this.logger.error(`Review job ${job.jobId} failed`, err)
      job.status = 'FAILED'
      job.error = err?.message ?? 'Unknown error'
      job.finishedAt = new Date()
    })

    return this.toJobDto(job)
  }

  /**
   * 查詢任務進度
   * @param jobId - 任務 ID
   * @returns 任務狀態 DTO
   * @throws NotFoundException 若 jobId 不存在
   */
  getJobStatus(jobId: string): ReviewJobDto {
    const job = this.jobs.get(jobId)
    if (!job) throw new NotFoundException(`Review job ${jobId} not found`)
    return this.toJobDto(job)
  }

  /**
   * 查詢藍圖的所有回顧紀錄
   * @param blueprintId - 藍圖 ID
   * @returns 依時間倒序排列的回顧紀錄
   */
  async findRecordsByBlueprint(blueprintId: string): Promise<ReviewRecordEntity[]> {
    const nodeIds = await this.nodeRepo
      .find({ where: { blueprintId }, select: ['id'] })
      .then(nodes => nodes.map(n => n.id))

    if (!nodeIds.length) return []

    return this.reviewRepo
      .createQueryBuilder('r')
      .where('r.nodeId IN (:...nodeIds)', { nodeIds })
      .orderBy('r.reviewedAt', 'DESC')
      .getMany()
  }

  /**
   * 對所有藍圖執行批次回顧（供 WeeklyReviewScheduler 使用）
   * @param model - 使用的模型識別碼
   */
  async batchReviewAllBlueprints(model: string): Promise<void> {
    const blueprints = await this.blueprintRepo.find()
    for (const blueprint of blueprints) {
      const job: ReviewJob = {
        jobId: randomUUID(),
        blueprintId: blueprint.id,
        startedAt: new Date(),
        status: 'RUNNING',
      }
      this.jobs.set(job.jobId, job)
      await this.runBatchReview(job, model).catch(err => {
        this.logger.error(`Weekly review job ${job.jobId} failed`, err)
        job.status = 'FAILED'
        job.error = err?.message ?? 'Unknown error'
        job.finishedAt = new Date()
      })
    }
  }

  /** 執行單一藍圖的批次回顧（逐節點驗證並更新 weight） */
  private async runBatchReview(job: ReviewJob, model: string): Promise<void> {
    const nodes = await this.nodeRepo.find({
      where: { blueprintId: job.blueprintId, status: NodeStatus.ACTIVE },
    })
    this.logger.log(`Review job ${job.jobId}: processing ${nodes.length} nodes`)

    for (const node of nodes) {
      try {
        const result = await this.verificationService.reviewNodeValidity(node.id, model)
        const weeks = this.evaluator.weeksSince(node.createdAt)
        const newWeight = this.evaluator.calculateNewWeight(result.verdict, node.weight, node.timeScale, weeks)

        await this.dbWrite.write(async () => {
          const record = this.reviewRepo.create({
            nodeId: node.id,
            verdict: result.verdict,
            evidenceSummary: result.evidenceSummary,
            weightBefore: node.weight,
            weightAfter: newWeight,
          })
          await this.reviewRepo.save(record)
          node.weight = newWeight
          await this.nodeRepo.save(node)
        })
      } catch (err) {
        this.logger.warn(`Failed to review node ${node.id}: ${(err as Error).message}`)
      }
    }

    job.status = 'DONE'
    job.finishedAt = new Date()
    this.logger.log(`Review job ${job.jobId} completed`)
  }

  /** 自動選擇預設模型：優先取 TOP tier，其次 FREE tier */
  private async resolveDefaultModel(): Promise<string> {
    const top = await this.aiModelRepo.findOne({ where: { tier: ModelTier.TOP } })
    if (top) return top.modelId
    const free = await this.aiModelRepo.findOne({ where: { tier: ModelTier.FREE } })
    if (free) return free.modelId
    throw new Error('No AI models available. Please sync models first.')
  }

  private toJobDto(job: ReviewJob): ReviewJobDto {
    return {
      jobId: job.jobId,
      blueprintId: job.blueprintId,
      startedAt: job.startedAt.toISOString(),
      status: job.status,
      finishedAt: job.finishedAt?.toISOString(),
      error: job.error,
    }
  }
}
