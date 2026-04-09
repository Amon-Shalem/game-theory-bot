# Game Theory Bot — Plan 1: Foundation & Data Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 進度追蹤（Context 中斷後從這裡繼續）

> **如何繼續：** 找到第一個未勾選的 Task，繼續執行。所有 Task 完成後執行 Task 17 驗證。

| Task | 說明 | 狀態 |
|------|------|------|
| Task 1 | Monorepo 根目錄設定 | ✅ 完成 |
| Task 2 | Shared 型別 Package | ✅ 完成 |
| Task 3 | NestJS 後端骨架 | ✅ 完成 |
| Task 4 | TypeORM + SQLite 設定與 Entities | ✅ 完成 |
| Task 5 | DatabaseWriteService（並發控制） | ✅ 完成 |
| Task 6 | Blueprint 模組 CRUD | ✅ 完成 |
| Task 7 | Node 模組 CRUD（含 parentNodeId 約束） | ✅ 完成 |
| Task 8 | Theory 模組 CRUD + 預設理論植入 | ✅ 完成 |
| Task 9 | Edge 模組 CRUD | ✅ 完成 |
| Task 10 | React 前端骨架 | ✅ 完成 |
| Task 11 | 前端 API 服務層 | ✅ 完成 |
| Task 12 | Zustand 狀態管理 | ✅ 完成 |
| Task 13 | 藍圖列表頁面 | ✅ 完成 |
| Task 14 | React Flow 畫布與自訂節點元件 | ✅ 完成 |
| Task 15 | 畫布頁面與節點建立面板 | ✅ 完成 |
| Task 16 | start.bat 啟動腳本 | ✅ 完成 |
| Task 17 | 全體測試執行確認 | ✅ 完成 |

---

**Goal:** 建立 Monorepo 基礎架構、所有資料模型的 TypeORM Entity、CRUD API、以及可在瀏覽器中操作藍圖與節點的基本 React Flow 畫布。

**Architecture:** Monorepo（npm workspaces）分為三個 package：`shared`（純型別）、`server`（NestJS + TypeORM + SQLite）、`client`（React + React Flow + Zustand）。共用型別在 `shared` 統一定義，前後端各自引用。後端所有寫入操作透過 `DatabaseWriteService`（async-mutex）串行化。

**Tech Stack:** Node.js 20+、TypeScript 5、NestJS 10、TypeORM 0.3、SQLite3、React 18、React Flow 11、Zustand 4、Vite 5、Jest（後端）、Vitest + React Testing Library（前端）

---

## 檔案結構

### 新增檔案

```
game-theory-bot/
├── package.json                              # Monorepo root，定義 workspaces
├── .gitignore
├── start.bat                                 # 一鍵啟動腳本
│
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                          # 統一 re-export
│       ├── types/blueprint.ts               # Blueprint DTO + enum
│       ├── types/node.ts                    # Node DTO + NodeType/NodeSize/NodeStatus/TimeScale
│       ├── types/theory.ts                  # Theory DTO
│       ├── types/edge.ts                    # Edge DTO + Direction/Magnitude
│       ├── types/ai-model.ts               # AIModel DTO + ModelTier
│       └── types/review-record.ts          # ReviewRecord DTO + ReviewVerdict
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts                           # 啟動入口，設定 CORS、WAL、Global Filter
│       ├── app.module.ts                     # 根模組
│       ├── database/
│       │   ├── database.module.ts            # TypeORM 設定（SQLite + WAL）
│       │   └── entities/
│       │       ├── blueprint.entity.ts
│       │       ├── node.entity.ts
│       │       ├── theory.entity.ts
│       │       ├── edge.entity.ts
│       │       ├── ai-model.entity.ts
│       │       └── review-record.entity.ts
│       ├── common/
│       │   ├── database-write.service.ts     # async-mutex 寫入串行化
│       │   └── ai-exception.filter.ts        # Global Exception Filter（預留給 Plan 2）
│       └── modules/
│           ├── blueprint/
│           │   ├── blueprint.module.ts
│           │   ├── blueprint.controller.ts   # CRUD endpoints
│           │   ├── blueprint.service.ts
│           │   └── blueprint.service.spec.ts
│           ├── node/
│           │   ├── node.module.ts
│           │   ├── node.controller.ts
│           │   ├── node.service.ts           # 含 parentNodeId 約束驗證
│           │   └── node.service.spec.ts
│           ├── theory/
│           │   ├── theory.module.ts
│           │   ├── theory.controller.ts
│           │   ├── theory.service.ts
│           │   ├── theory.seeder.ts          # 植入三個預設理論
│           │   └── theory.service.spec.ts
│           └── edge/
│               ├── edge.module.ts
│               ├── edge.controller.ts
│               ├── edge.service.ts
│               └── edge.service.spec.ts
│
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                           # 路由設定（react-router-dom）
        ├── types/index.ts                    # re-export shared types
        ├── services/
        │   ├── api.ts                        # axios base instance
        │   ├── blueprint.service.ts
        │   ├── node.service.ts
        │   ├── theory.service.ts
        │   └── edge.service.ts
        ├── stores/
        │   ├── blueprint.store.ts            # 藍圖列表狀態
        │   └── canvas.store.ts              # 當前藍圖的節點/邊狀態
        └── components/
            ├── pages/
            │   ├── BlueprintListPage.tsx
            │   └── CanvasPage.tsx
            ├── canvas/
            │   ├── BlueprintCanvas.tsx       # React Flow 根元件
            │   ├── LargeNode.tsx             # 大節點自訂元件
            │   ├── SmallNode.tsx             # 小節點自訂元件
            │   └── CausalEdge.tsx            # 因果連結自訂元件
            └── panels/
                ├── NodeInfoPanel.tsx         # 點擊節點開啟的側邊面板
                └── EdgeFormPanel.tsx         # 建立/編輯 Edge 的面板
```

---

## Task 1：Monorepo 根目錄設定

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1：建立根 package.json**

```json
{
  "name": "game-theory-bot",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "shared",
    "server",
    "client"
  ],
  "scripts": {
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client",
    "build:shared": "npm run build --workspace=shared",
    "test:server": "npm run test --workspace=server",
    "test:client": "npm run test --workspace=client"
  }
}
```

- [ ] **Step 2：建立 .gitignore**

```
node_modules/
dist/
*.db
*.db-shm
*.db-wal
.env
```

- [ ] **Step 3：Commit**

```bash
git add package.json .gitignore
git commit -m "chore: init monorepo root"
```

---

## Task 2：Shared 型別 Package

**Files:**
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/types/blueprint.ts`
- Create: `shared/src/types/node.ts`
- Create: `shared/src/types/theory.ts`
- Create: `shared/src/types/edge.ts`
- Create: `shared/src/types/ai-model.ts`
- Create: `shared/src/types/review-record.ts`
- Create: `shared/src/index.ts`

- [ ] **Step 1：建立 shared/package.json**

```json
{
  "name": "@game-theory-bot/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2：建立 shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3：建立所有型別檔案**

`shared/src/types/blueprint.ts`：
```typescript
/** 藍圖 DTO — 前後端共用 */
export interface BlueprintDto {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface CreateBlueprintDto {
  name: string
  description?: string
}

export interface UpdateBlueprintDto {
  name?: string
  description?: string
}
```

`shared/src/types/node.ts`：
```typescript
/** 節點類型：行為者、事件、利益 */
export enum NodeType {
  ACTOR = 'ACTOR',
  EVENT = 'EVENT',
  INTEREST = 'INTEREST',
}

/** 節點大小：業務屬性，決定是否可展開子節點 */
export enum NodeSize {
  SMALL = 'SMALL',
  LARGE = 'LARGE',
}

/** 節點狀態 */
export enum NodeStatus {
  ACTIVE = 'ACTIVE',
  VALIDATED = 'VALIDATED',
  INVALIDATED = 'INVALIDATED',
}

/** 預測時間尺度，用於回顧機制的到期門檻 */
export enum TimeScale {
  SHORT = 'SHORT',   // 到期門檻：4週
  MEDIUM = 'MEDIUM', // 到期門檻：12週
  LONG = 'LONG',     // 到期門檻：52週
}

export interface NodeDto {
  id: string
  blueprintId: string
  type: NodeType
  size: NodeSize
  status: NodeStatus
  title: string
  description: string
  weight: number
  timeScale: TimeScale
  createdBy: 'user' | 'ai'
  parentNodeId: string | null
  createdAt: string
}

export interface CreateNodeDto {
  blueprintId: string
  type: NodeType
  size: NodeSize
  title: string
  description?: string
  timeScale: TimeScale
  parentNodeId?: string
}

export interface UpdateNodeDto {
  title?: string
  description?: string
  timeScale?: TimeScale
  status?: NodeStatus
}
```

`shared/src/types/theory.ts`：
```typescript
export interface TheoryDto {
  id: string
  name: string
  promptFragment: string
  isPreset: boolean
  tags: string[]
  createdAt: string
}

export interface CreateTheoryDto {
  name: string
  promptFragment: string
  tags?: string[]
}

export interface UpdateTheoryDto {
  name?: string
  promptFragment?: string
  tags?: string[]
}
```

`shared/src/types/edge.ts`：
```typescript
/** 因果方向 */
export enum Direction {
  PROMOTES = 'PROMOTES',
  INHIBITS = 'INHIBITS',
  NEUTRAL = 'NEUTRAL',
}

/** 影響程度 */
export enum Magnitude {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export interface EdgeDto {
  id: string
  blueprintId: string
  sourceNodeId: string
  targetNodeId: string
  theoryIds: string[]
  direction: Direction
  magnitude: Magnitude
  reasoning: string
  createdBy: 'user' | 'ai'
}

export interface CreateEdgeDto {
  blueprintId: string
  sourceNodeId: string
  targetNodeId: string
  theoryIds?: string[]
  direction: Direction
  magnitude: Magnitude
  reasoning?: string
}

export interface UpdateEdgeDto {
  theoryIds?: string[]
  direction?: Direction
  magnitude?: Magnitude
  reasoning?: string
}
```

`shared/src/types/ai-model.ts`：
```typescript
export enum ModelTier {
  TOP = 'TOP',
  FREE = 'FREE',
}

export interface AIModelDto {
  id: string
  modelId: string
  displayName: string
  tier: ModelTier
  pricingPrompt: string
  updatedAt: string
}
```

`shared/src/types/review-record.ts`：
```typescript
export enum ReviewVerdict {
  CONFIRMED = 'CONFIRMED',
  REFUTED = 'REFUTED',
  PENDING = 'PENDING',
}

export interface ReviewRecordDto {
  id: string
  nodeId: string
  reviewedAt: string
  verdict: ReviewVerdict
  evidenceSummary: string
  weightBefore: number
  weightAfter: number
}
```

`shared/src/index.ts`：
```typescript
export * from './types/blueprint'
export * from './types/node'
export * from './types/theory'
export * from './types/edge'
export * from './types/ai-model'
export * from './types/review-record'
```

- [ ] **Step 4：Build shared package**

```bash
cd shared && npm run build
```

Expected: `shared/dist/` 目錄生成，無 TypeScript 錯誤。

- [ ] **Step 5：Commit**

```bash
cd ..
git add shared/
git commit -m "feat: add shared type definitions"
```

---

## Task 3：NestJS 後端骨架

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/nest-cli.json`
- Create: `server/src/main.ts`
- Create: `server/src/app.module.ts`

- [ ] **Step 1：安裝 NestJS 及相關依賴**

```bash
cd server
npm init -y
npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
npm install @nestjs/typeorm typeorm better-sqlite3
npm install @nestjs/schedule @nestjs/config
npm install async-mutex uuid
npm install --save-dev @nestjs/cli @nestjs/testing typescript ts-node ts-jest jest @types/jest @types/node @types/uuid @types/better-sqlite3
```

- [ ] **Step 2：建立 server/tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "strict": true,
    "paths": {
      "@game-theory-bot/shared": ["../shared/src/index.ts"]
    }
  }
}
```

- [ ] **Step 3：建立 server/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

- [ ] **Step 4：建立 server/src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors({ origin: 'http://localhost:5173' })

  await app.listen(3000)
  console.log('Server running on http://localhost:3000')
}

bootstrap()
```

- [ ] **Step 5：建立 server/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { BlueprintModule } from './modules/blueprint/blueprint.module'
import { NodeModule } from './modules/node/node.module'
import { TheoryModule } from './modules/theory/theory.module'
import { EdgeModule } from './modules/edge/edge.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    BlueprintModule,
    NodeModule,
    TheoryModule,
    EdgeModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6：Commit**

```bash
git add server/
git commit -m "chore: scaffold NestJS server"
```

---

## Task 4：TypeORM + SQLite 設定與 Entities

**Files:**
- Create: `server/src/database/database.module.ts`
- Create: `server/src/database/data-source.ts`
- Create: `server/src/database/entities/blueprint.entity.ts`
- Create: `server/src/database/entities/node.entity.ts`
- Create: `server/src/database/entities/theory.entity.ts`
- Create: `server/src/database/entities/edge.entity.ts`
- Create: `server/src/database/entities/ai-model.entity.ts`
- Create: `server/src/database/entities/review-record.entity.ts`

- [ ] **Step 1：建立 database.module.ts（含 WAL pragma）**

```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlueprintEntity } from './entities/blueprint.entity'
import { NodeEntity } from './entities/node.entity'
import { TheoryEntity } from './entities/theory.entity'
import { EdgeEntity } from './entities/edge.entity'
import { AIModelEntity } from './entities/ai-model.entity'
import { ReviewRecordEntity } from './entities/review-record.entity'

/**
 * 資料庫模組
 * extra.pragma 在連線建立時自動啟用 WAL 模式，由 TypeORM 管理連線生命週期
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'game-theory-bot.db',
      synchronize: true,
      entities: [
        BlueprintEntity,
        NodeEntity,
        TheoryEntity,
        EdgeEntity,
        AIModelEntity,
        ReviewRecordEntity,
      ],
      extra: {
        // 啟用 WAL 模式，提升並發讀取效能
        pragma: { journal_mode: 'WAL' },
      },
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 3：建立 blueprint.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/** 藍圖 Entity — 各藍圖完全隔離，不共享節點或連結 */
@Entity('blueprints')
export class BlueprintEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'text', default: '' })
  description: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

- [ ] **Step 4：建立 node.entity.ts**

```typescript
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
  id: string

  @Column({ type: 'text' })
  blueprintId: string

  @ManyToOne(() => BlueprintEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blueprintId' })
  blueprint: BlueprintEntity

  @Column({ type: 'text', enum: NodeType })
  type: NodeType

  @Column({ type: 'text', enum: NodeSize })
  size: NodeSize

  @Column({ type: 'text', enum: NodeStatus, default: NodeStatus.ACTIVE })
  status: NodeStatus

  @Column({ type: 'text' })
  title: string

  @Column({ type: 'text', default: '' })
  description: string

  /** 視覺驅動值，初始 1.0，範圍 0.1~3.0 */
  @Column({ type: 'real', default: 1.0 })
  weight: number

  @Column({ type: 'text', enum: TimeScale })
  timeScale: TimeScale

  @Column({ type: 'text', default: 'user' })
  createdBy: 'user' | 'ai'

  /** 小節點歸屬，僅 NodeSize.SMALL 可設定 */
  @Column({ type: 'text', nullable: true })
  parentNodeId: string | null

  @CreateDateColumn()
  createdAt: Date
}
```

- [ ] **Step 5：建立 theory.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

/** 理論 Entity — promptFragment 為餵給 AI 的 Prompt 片段 */
@Entity('theories')
export class TheoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'text' })
  promptFragment: string

  /** true = 系統預設（唯讀），false = 使用者自訂 */
  @Column({ type: 'integer', default: 0 })
  isPreset: boolean

  /** 以 JSON 字串儲存 string[] */
  @Column({ type: 'text', default: '[]' })
  tagsJson: string

  get tags(): string[] {
    return JSON.parse(this.tagsJson)
  }

  set tags(value: string[]) {
    this.tagsJson = JSON.stringify(value)
  }

  @CreateDateColumn()
  createdAt: Date
}
```

- [ ] **Step 6：建立 edge.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'
import { Direction, Magnitude } from '@game-theory-bot/shared'

/** 因果連結 Entity — theoryIds 允許為空陣列 */
@Entity('edges')
export class EdgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  blueprintId: string

  @Column({ type: 'text' })
  sourceNodeId: string

  @Column({ type: 'text' })
  targetNodeId: string

  /** 以 JSON 字串儲存 string[]，允許空陣列 */
  @Column({ type: 'text', default: '[]' })
  theoryIdsJson: string

  get theoryIds(): string[] {
    return JSON.parse(this.theoryIdsJson)
  }

  set theoryIds(value: string[]) {
    this.theoryIdsJson = JSON.stringify(value)
  }

  @Column({ type: 'text', enum: Direction })
  direction: Direction

  @Column({ type: 'text', enum: Magnitude })
  magnitude: Magnitude

  @Column({ type: 'text', default: '' })
  reasoning: string

  @Column({ type: 'text', default: 'user' })
  createdBy: 'user' | 'ai'
}
```

- [ ] **Step 7：建立 ai-model.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm'
import { ModelTier } from '@game-theory-bot/shared'

@Entity('ai_models')
export class AIModelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** OpenRouter 模型識別碼，例如 "openai/gpt-4o" */
  @Column({ type: 'text', unique: true })
  modelId: string

  @Column({ type: 'text' })
  displayName: string

  @Column({ type: 'text', enum: ModelTier })
  tier: ModelTier

  @Column({ type: 'text', default: '0' })
  pricingPrompt: string

  @UpdateDateColumn()
  updatedAt: Date
}
```

- [ ] **Step 8：建立 review-record.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'
import { ReviewVerdict } from '@game-theory-bot/shared'

@Entity('review_records')
export class ReviewRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text' })
  nodeId: string

  @CreateDateColumn()
  reviewedAt: Date

  @Column({ type: 'text', enum: ReviewVerdict })
  verdict: ReviewVerdict

  @Column({ type: 'text', default: '' })
  evidenceSummary: string

  @Column({ type: 'real' })
  weightBefore: number

  @Column({ type: 'real' })
  weightAfter: number
}
```

- [ ] **Step 9：Commit**

```bash
git add server/src/database/
git commit -m "feat: add TypeORM entities and database setup"
```

---

## Task 5：DatabaseWriteService（並發控制）

**Files:**
- Create: `server/src/common/database-write.service.ts`
- Create: `server/src/common/database-write.service.spec.ts`

- [ ] **Step 1：撰寫失敗測試**

`server/src/common/database-write.service.spec.ts`：
```typescript
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
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
cd server && npx jest database-write.service --no-coverage
```

Expected: FAIL — `DatabaseWriteService` 不存在

- [ ] **Step 3：實作 DatabaseWriteService**

`server/src/common/database-write.service.ts`：
```typescript
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
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npx jest database-write.service --no-coverage
```

Expected: PASS — 3 tests passed

- [ ] **Step 5：Commit**

```bash
git add server/src/common/
git commit -m "feat: add DatabaseWriteService with mutex serialization"
```

---

## Task 6：Blueprint 模組 CRUD

**Files:**
- Create: `server/src/modules/blueprint/blueprint.module.ts`
- Create: `server/src/modules/blueprint/blueprint.controller.ts`
- Create: `server/src/modules/blueprint/blueprint.service.ts`
- Create: `server/src/modules/blueprint/blueprint.service.spec.ts`

- [ ] **Step 1：撰寫失敗測試**

`server/src/modules/blueprint/blueprint.service.spec.ts`：
```typescript
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BlueprintService } from './blueprint.service'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'

describe('BlueprintService', () => {
  let service: BlueprintService
  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BlueprintService,
        DatabaseWriteService,
        { provide: getRepositoryToken(BlueprintEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(BlueprintService)
    jest.clearAllMocks()
  })

  it('should return all blueprints', async () => {
    const blueprints = [{ id: '1', name: 'Test' }]
    mockRepo.find.mockResolvedValue(blueprints)
    const result = await service.findAll()
    expect(result).toEqual(blueprints)
  })

  it('should create a blueprint via DatabaseWriteService', async () => {
    const dto = { name: 'New Blueprint', description: 'desc' }
    const entity = { id: 'abc', ...dto }
    mockRepo.create.mockReturnValue(entity)
    mockRepo.save.mockResolvedValue(entity)

    const result = await service.create(dto)
    expect(result.name).toBe('New Blueprint')
    expect(mockRepo.save).toHaveBeenCalledTimes(1)
  })

  it('should throw NotFoundException when blueprint not found', async () => {
    mockRepo.findOneBy.mockResolvedValue(null)
    await expect(service.findOne('nonexistent')).rejects.toThrow('Blueprint nonexistent not found')
  })
})
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npx jest blueprint.service --no-coverage
```

Expected: FAIL

- [ ] **Step 3：實作 BlueprintService**

`server/src/modules/blueprint/blueprint.service.ts`：
```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateBlueprintDto, UpdateBlueprintDto } from '@game-theory-bot/shared'

/**
 * 藍圖業務邏輯服務
 * 所有寫入操作透過 DatabaseWriteService 串行化
 */
@Injectable()
export class BlueprintService {
  constructor(
    @InjectRepository(BlueprintEntity)
    private readonly repo: Repository<BlueprintEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  /** 取得所有藍圖 */
  async findAll(): Promise<BlueprintEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } })
  }

  /** 取得單一藍圖，不存在則拋出 NotFoundException */
  async findOne(id: string): Promise<BlueprintEntity> {
    const blueprint = await this.repo.findOneBy({ id })
    if (!blueprint) {
      throw new NotFoundException(`Blueprint ${id} not found`)
    }
    return blueprint
  }

  /** 建立新藍圖 */
  async create(dto: CreateBlueprintDto): Promise<BlueprintEntity> {
    return this.dbWrite.write(async () => {
      const entity = this.repo.create(dto)
      return this.repo.save(entity)
    })
  }

  /** 更新藍圖，不存在則拋出 NotFoundException */
  async update(id: string, dto: UpdateBlueprintDto): Promise<BlueprintEntity> {
    const blueprint = await this.findOne(id)
    return this.dbWrite.write(async () => {
      Object.assign(blueprint, dto)
      return this.repo.save(blueprint)
    })
  }

  /** 刪除藍圖，不存在則拋出 NotFoundException */
  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.dbWrite.write(async () => {
      await this.repo.delete(id)
    })
  }
}
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npx jest blueprint.service --no-coverage
```

Expected: PASS — 3 tests passed

- [ ] **Step 5：實作 BlueprintController 及 Module**

`server/src/modules/blueprint/blueprint.controller.ts`：
```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { BlueprintService } from './blueprint.service'
import { CreateBlueprintDto, UpdateBlueprintDto } from '@game-theory-bot/shared'

@Controller('blueprints')
export class BlueprintController {
  constructor(private readonly service: BlueprintService) {}

  @Get()
  findAll() { return this.service.findAll() }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  create(@Body() dto: CreateBlueprintDto) { return this.service.create(dto) }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlueprintDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
```

`server/src/modules/blueprint/blueprint.module.ts`：
```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlueprintEntity } from '../../database/entities/blueprint.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { BlueprintService } from './blueprint.service'
import { BlueprintController } from './blueprint.controller'

@Module({
  imports: [TypeOrmModule.forFeature([BlueprintEntity])],
  providers: [BlueprintService, DatabaseWriteService],
  controllers: [BlueprintController],
  exports: [BlueprintService],
})
export class BlueprintModule {}
```

- [ ] **Step 6：Commit**

```bash
cd ..
git add server/src/modules/blueprint/
git commit -m "feat: add Blueprint CRUD module"
```

---

## Task 7：Node 模組 CRUD（含 parentNodeId 約束）

**Files:**
- Create: `server/src/modules/node/node.module.ts`
- Create: `server/src/modules/node/node.controller.ts`
- Create: `server/src/modules/node/node.service.ts`
- Create: `server/src/modules/node/node.service.spec.ts`

- [ ] **Step 1：撰寫失敗測試（含 parentNodeId 約束）**

`server/src/modules/node/node.service.spec.ts`：
```typescript
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { NodeService } from './node.service'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { NodeSize, NodeType, TimeScale } from '@game-theory-bot/shared'

describe('NodeService', () => {
  let service: NodeService
  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NodeService,
        DatabaseWriteService,
        { provide: getRepositoryToken(NodeEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(NodeService)
    jest.clearAllMocks()
  })

  it('should reject LARGE node with parentNodeId', async () => {
    await expect(
      service.create({
        blueprintId: 'bp1',
        type: NodeType.EVENT,
        size: NodeSize.LARGE,
        title: 'Big Node',
        timeScale: TimeScale.LONG,
        parentNodeId: 'some-parent',
      })
    ).rejects.toThrow(BadRequestException)
  })

  it('should reject SMALL node with parentNodeId pointing to a SMALL parent', async () => {
    const smallParent = { id: 'parent-id', size: NodeSize.SMALL }
    mockRepo.findOneBy.mockResolvedValue(smallParent)

    await expect(
      service.create({
        blueprintId: 'bp1',
        type: NodeType.ACTOR,
        size: NodeSize.SMALL,
        title: 'Small Node',
        timeScale: TimeScale.SHORT,
        parentNodeId: 'parent-id',
      })
    ).rejects.toThrow(BadRequestException)
  })

  it('should create SMALL node with valid LARGE parent', async () => {
    const largeParent = { id: 'parent-id', size: NodeSize.LARGE }
    mockRepo.findOneBy.mockResolvedValue(largeParent)
    const dto = {
      blueprintId: 'bp1', type: NodeType.ACTOR, size: NodeSize.SMALL,
      title: 'Small Node', timeScale: TimeScale.SHORT, parentNodeId: 'parent-id',
    }
    const entity = { id: 'new-id', ...dto, weight: 1.0, status: 'ACTIVE' }
    mockRepo.create.mockReturnValue(entity)
    mockRepo.save.mockResolvedValue(entity)

    const result = await service.create(dto)
    expect(result.id).toBe('new-id')
  })
})
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npx jest node.service --no-coverage
```

Expected: FAIL

- [ ] **Step 3：實作 NodeService**

`server/src/modules/node/node.service.ts`：
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateNodeDto, UpdateNodeDto, NodeSize } from '@game-theory-bot/shared'

/**
 * 節點業務邏輯服務
 * parentNodeId 約束規則：
 *   - LARGE 節點不可設定 parentNodeId
 *   - SMALL 節點的 parentNodeId 必須指向 LARGE 節點
 *   - 刪除 LARGE 節點時，子節點由 DB cascade 自動刪除（Entity 設定 onDelete: CASCADE）
 */
@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(NodeEntity)
    private readonly repo: Repository<NodeEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findByBlueprint(blueprintId: string): Promise<NodeEntity[]> {
    return this.repo.find({ where: { blueprintId }, order: { createdAt: 'ASC' } })
  }

  async findOne(id: string): Promise<NodeEntity> {
    const node = await this.repo.findOneBy({ id })
    if (!node) throw new NotFoundException(`Node ${id} not found`)
    return node
  }

  async create(dto: CreateNodeDto): Promise<NodeEntity> {
    await this.validateParentConstraint(dto.size, dto.parentNodeId)

    return this.dbWrite.write(async () => {
      const entity = this.repo.create({ ...dto, weight: 1.0 })
      return this.repo.save(entity)
    })
  }

  async update(id: string, dto: UpdateNodeDto): Promise<NodeEntity> {
    const node = await this.findOne(id)
    return this.dbWrite.write(async () => {
      Object.assign(node, dto)
      return this.repo.save(node)
    })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.dbWrite.write(async () => { await this.repo.delete(id) })
  }

  /**
   * 驗證 parentNodeId 的業務約束
   * @param size - 欲建立節點的大小
   * @param parentNodeId - 父節點 ID（可選）
   * @throws BadRequestException 若違反約束
   */
  private async validateParentConstraint(
    size: NodeSize,
    parentNodeId?: string,
  ): Promise<void> {
    if (size === NodeSize.LARGE && parentNodeId) {
      throw new BadRequestException('LARGE nodes cannot have a parent node')
    }

    if (size === NodeSize.SMALL && parentNodeId) {
      const parent = await this.repo.findOneBy({ id: parentNodeId })
      if (!parent) throw new NotFoundException(`Parent node ${parentNodeId} not found`)
      if (parent.size !== NodeSize.LARGE) {
        throw new BadRequestException('Parent node must be LARGE')
      }
    }
  }
}
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npx jest node.service --no-coverage
```

Expected: PASS — 3 tests passed

- [ ] **Step 5：實作 NodeController 及 Module**

`server/src/modules/node/node.controller.ts`：
```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { NodeService } from './node.service'
import { CreateNodeDto, UpdateNodeDto } from '@game-theory-bot/shared'

@Controller('nodes')
export class NodeController {
  constructor(private readonly service: NodeService) {}

  @Get()
  findByBlueprint(@Query('blueprintId') blueprintId: string) {
    return this.service.findByBlueprint(blueprintId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  create(@Body() dto: CreateNodeDto) { return this.service.create(dto) }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNodeDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
```

`server/src/modules/node/node.module.ts`：
```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NodeEntity } from '../../database/entities/node.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { NodeService } from './node.service'
import { NodeController } from './node.controller'

@Module({
  imports: [TypeOrmModule.forFeature([NodeEntity])],
  providers: [NodeService, DatabaseWriteService],
  controllers: [NodeController],
  exports: [NodeService],
})
export class NodeModule {}
```

- [ ] **Step 6：Commit**

```bash
git add server/src/modules/node/
git commit -m "feat: add Node CRUD module with parentNodeId validation"
```

---

## Task 8：Theory 模組 CRUD + 預設理論植入

**Files:**
- Create: `server/src/modules/theory/theory.module.ts`
- Create: `server/src/modules/theory/theory.controller.ts`
- Create: `server/src/modules/theory/theory.service.ts`
- Create: `server/src/modules/theory/theory.seeder.ts`
- Create: `server/src/modules/theory/theory.service.spec.ts`

- [ ] **Step 1：撰寫失敗測試**

`server/src/modules/theory/theory.service.spec.ts`：
```typescript
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { ForbiddenException } from '@nestjs/common'
import { TheoryService } from './theory.service'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'

describe('TheoryService', () => {
  let service: TheoryService
  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TheoryService,
        DatabaseWriteService,
        { provide: getRepositoryToken(TheoryEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(TheoryService)
    jest.clearAllMocks()
  })

  it('should throw ForbiddenException when deleting preset theory', async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: '1', isPreset: true })
    await expect(service.remove('1')).rejects.toThrow(ForbiddenException)
  })

  it('should allow deleting custom theory', async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: '2', isPreset: false })
    mockRepo.delete.mockResolvedValue({})
    await expect(service.remove('2')).resolves.not.toThrow()
    expect(mockRepo.delete).toHaveBeenCalledWith('2')
  })
})
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npx jest theory.service --no-coverage
```

Expected: FAIL

- [ ] **Step 3：實作 TheoryService**

`server/src/modules/theory/theory.service.ts`：
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateTheoryDto, UpdateTheoryDto } from '@game-theory-bot/shared'

/**
 * 理論業務邏輯服務
 * 預設理論（isPreset=true）只能查看，不能修改或刪除
 */
@Injectable()
export class TheoryService {
  constructor(
    @InjectRepository(TheoryEntity)
    private readonly repo: Repository<TheoryEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findAll(): Promise<TheoryEntity[]> {
    return this.repo.find({ order: { isPreset: 'DESC', createdAt: 'ASC' } })
  }

  async findOne(id: string): Promise<TheoryEntity> {
    const theory = await this.repo.findOneBy({ id })
    if (!theory) throw new NotFoundException(`Theory ${id} not found`)
    return theory
  }

  async create(dto: CreateTheoryDto): Promise<TheoryEntity> {
    return this.dbWrite.write(async () => {
      const entity = this.repo.create({ ...dto, isPreset: false })
      entity.tags = dto.tags ?? []
      return this.repo.save(entity)
    })
  }

  async update(id: string, dto: UpdateTheoryDto): Promise<TheoryEntity> {
    const theory = await this.findOne(id)
    if (theory.isPreset) throw new ForbiddenException('Preset theories cannot be modified')
    return this.dbWrite.write(async () => {
      if (dto.tags) theory.tags = dto.tags
      Object.assign(theory, { name: dto.name ?? theory.name, promptFragment: dto.promptFragment ?? theory.promptFragment })
      return this.repo.save(theory)
    })
  }

  async remove(id: string): Promise<void> {
    const theory = await this.findOne(id)
    if (theory.isPreset) throw new ForbiddenException('Preset theories cannot be deleted')
    await this.dbWrite.write(async () => { await this.repo.delete(id) })
  }
}
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npx jest theory.service --no-coverage
```

Expected: PASS

- [ ] **Step 5：建立預設理論植入器**

`server/src/modules/theory/theory.seeder.ts`：
```typescript
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'

/** 系統啟動時植入三個預設理論模板 */
@Injectable()
export class TheorySeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(TheoryEntity)
    private readonly repo: Repository<TheoryEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const presets = [
      {
        name: '攻勢現實主義',
        promptFragment: `在分析此事件時，請套用攻勢現實主義框架（米爾斯海默）：
- 大國在國際無政府狀態下追求權力最大化，安全競爭是結構性的
- 當一個大國感知到權力真空或競爭對手相對衰弱時，會主動採取擴張行動
- 霸權競爭者會阻止其他大國成為地區霸主
- 請識別此事件中的安全困境、權力轉移跡象及潛在的軍事化動機`,
        tags: ['地緣政治', '大國競爭', '安全困境'],
      },
      {
        name: '黑天鵝偵測',
        promptFragment: `在分析此事件時，請套用黑天鵝理論框架（塔勒布）：
- 主動標記低機率但高衝擊的尾部風險，不要因為罕見就忽視
- 警惕敘事謬誤：人類傾向於事後為隨機事件建構虛假的因果故事
- 識別系統中的脆弱點：什麼樣的衝擊會造成非線性的連鎖崩潰？
- 考慮反脆弱因素：哪些行為者或系統會在波動中受益？`,
        tags: ['風險評估', '黑天鵝', '尾部風險'],
      },
      {
        name: '行為賽局分析',
        promptFragment: `在分析此事件時，請套用行為賽局分析框架（江學勤）：
- 識別所有相關行為者（國家、企業、個人、組織），以及各方的利益函數
- 分析行為者的決策是否符合理性選擇，若不符合，考慮認知偏誤、國內政治壓力等因素
- 識別聯盟形成的可能性：哪些行為者有共同利益？哪些存在潛在衝突？
- 考慮博弈的重複性：這是一次性賽局還是長期博弈？信譽和承諾的可信度如何影響結果？`,
        tags: ['賽局理論', '行為者分析', '利益計算'],
      },
    ]

    for (const preset of presets) {
      const existing = await this.repo.findOneBy({ name: preset.name })
      if (!existing) {
        const entity = this.repo.create({ ...preset, isPreset: true })
        entity.tags = preset.tags
        await this.repo.save(entity)
      }
    }
  }
}
```

- [ ] **Step 6：建立 TheoryController 及 Module**

`server/src/modules/theory/theory.controller.ts`：
```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { TheoryService } from './theory.service'
import { CreateTheoryDto, UpdateTheoryDto } from '@game-theory-bot/shared'

@Controller('theories')
export class TheoryController {
  constructor(private readonly service: TheoryService) {}

  @Get() findAll() { return this.service.findAll() }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id) }
  @Post() create(@Body() dto: CreateTheoryDto) { return this.service.create(dto) }
  @Put(':id') update(@Param('id') id: string, @Body() dto: UpdateTheoryDto) { return this.service.update(id, dto) }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.service.remove(id) }
}
```

`server/src/modules/theory/theory.module.ts`：
```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TheoryEntity } from '../../database/entities/theory.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { TheoryService } from './theory.service'
import { TheoryController } from './theory.controller'
import { TheorySeeder } from './theory.seeder'

@Module({
  imports: [TypeOrmModule.forFeature([TheoryEntity])],
  providers: [TheoryService, TheorySeeder, DatabaseWriteService],
  controllers: [TheoryController],
  exports: [TheoryService],
})
export class TheoryModule {}
```

- [ ] **Step 7：Commit**

```bash
git add server/src/modules/theory/
git commit -m "feat: add Theory CRUD module with preset seeder"
```

---

## Task 9：Edge 模組 CRUD

**Files:**
- Create: `server/src/modules/edge/edge.module.ts`
- Create: `server/src/modules/edge/edge.controller.ts`
- Create: `server/src/modules/edge/edge.service.ts`
- Create: `server/src/modules/edge/edge.service.spec.ts`

- [ ] **Step 1：撰寫失敗測試**

`server/src/modules/edge/edge.service.spec.ts`：
```typescript
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EdgeService } from './edge.service'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { Direction, Magnitude } from '@game-theory-bot/shared'

describe('EdgeService', () => {
  let service: EdgeService
  const mockRepo = {
    find: jest.fn(), findOneBy: jest.fn(),
    create: jest.fn(), save: jest.fn(), delete: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EdgeService, DatabaseWriteService,
        { provide: getRepositoryToken(EdgeEntity), useValue: mockRepo },
      ],
    }).compile()

    service = module.get(EdgeService)
    jest.clearAllMocks()
  })

  it('should create edge with empty theoryIds', async () => {
    const dto = {
      blueprintId: 'bp1', sourceNodeId: 'n1', targetNodeId: 'n2',
      direction: Direction.PROMOTES, magnitude: Magnitude.LARGE,
    }
    const entity = { id: 'e1', ...dto, theoryIds: [] }
    mockRepo.create.mockReturnValue(entity)
    mockRepo.save.mockResolvedValue(entity)

    const result = await service.create(dto)
    expect(result.theoryIds).toEqual([])
  })
})
```

- [ ] **Step 2：執行測試，確認失敗**

```bash
npx jest edge.service --no-coverage
```

- [ ] **Step 3：實作 EdgeService、Controller、Module**

`server/src/modules/edge/edge.controller.ts`：
```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { EdgeService } from './edge.service'
import { CreateEdgeDto, UpdateEdgeDto } from '@game-theory-bot/shared'

@Controller('edges')
export class EdgeController {
  constructor(private readonly service: EdgeService) {}

  @Get()
  findByBlueprint(@Query('blueprintId') blueprintId: string) {
    return this.service.findByBlueprint(blueprintId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id) }

  @Post()
  create(@Body() dto: CreateEdgeDto) { return this.service.create(dto) }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEdgeDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id) }
}
```

`server/src/modules/edge/edge.module.ts`：
```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { EdgeService } from './edge.service'
import { EdgeController } from './edge.controller'

@Module({
  imports: [TypeOrmModule.forFeature([EdgeEntity])],
  providers: [EdgeService, DatabaseWriteService],
  controllers: [EdgeController],
  exports: [EdgeService],
})
export class EdgeModule {}
```

`server/src/modules/edge/edge.service.ts`：
```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EdgeEntity } from '../../database/entities/edge.entity'
import { DatabaseWriteService } from '../../common/database-write.service'
import { CreateEdgeDto, UpdateEdgeDto } from '@game-theory-bot/shared'

@Injectable()
export class EdgeService {
  constructor(
    @InjectRepository(EdgeEntity)
    private readonly repo: Repository<EdgeEntity>,
    private readonly dbWrite: DatabaseWriteService,
  ) {}

  async findByBlueprint(blueprintId: string): Promise<EdgeEntity[]> {
    return this.repo.find({ where: { blueprintId } })
  }

  async findOne(id: string): Promise<EdgeEntity> {
    const edge = await this.repo.findOneBy({ id })
    if (!edge) throw new NotFoundException(`Edge ${id} not found`)
    return edge
  }

  async create(dto: CreateEdgeDto): Promise<EdgeEntity> {
    return this.dbWrite.write(async () => {
      const entity = this.repo.create(dto)
      entity.theoryIds = dto.theoryIds ?? []
      return this.repo.save(entity)
    })
  }

  async update(id: string, dto: UpdateEdgeDto): Promise<EdgeEntity> {
    const edge = await this.findOne(id)
    return this.dbWrite.write(async () => {
      if (dto.theoryIds !== undefined) edge.theoryIds = dto.theoryIds
      Object.assign(edge, {
        direction: dto.direction ?? edge.direction,
        magnitude: dto.magnitude ?? edge.magnitude,
        reasoning: dto.reasoning ?? edge.reasoning,
      })
      return this.repo.save(edge)
    })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.dbWrite.write(async () => { await this.repo.delete(id) })
  }
}
```

- [ ] **Step 4：執行測試，確認通過**

```bash
npx jest edge.service --no-coverage
```

Expected: PASS

- [ ] **Step 5：Commit**

```bash
git add server/src/modules/edge/
git commit -m "feat: add Edge CRUD module"
```

---

## Task 10：React 前端骨架

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/types/index.ts`

- [ ] **Step 1：安裝前端依賴**

```bash
cd client
npm init -y
npm install react react-dom react-router-dom @xyflow/react zustand axios
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2：建立 client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@game-theory-bot/shared": ["../shared/src/index.ts"]
    }
  }
}
```

- [ ] **Step 3：建立 client/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@game-theory-bot/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 4：建立 test-setup.ts**

`client/src/test-setup.ts`：
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5：建立其餘骨架檔案**

`client/index.html`：
```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Game Theory Bot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`client/src/main.tsx`：
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@xyflow/react/dist/style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

`client/src/App.tsx`：
```typescript
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BlueprintListPage } from './components/pages/BlueprintListPage'
import { CanvasPage } from './components/pages/CanvasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlueprintListPage />} />
        <Route path="/canvas/:blueprintId" element={<CanvasPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

`client/src/types/index.ts`：
```typescript
// 統一從 shared 引入型別，前端不重複定義
export * from '@game-theory-bot/shared'
```

- [ ] **Step 5：Commit**

```bash
cd ..
git add client/
git commit -m "chore: scaffold React client"
```

---

## Task 11：前端 API 服務層

**Files:**
- Create: `client/src/services/api.ts`
- Create: `client/src/services/blueprint.service.ts`
- Create: `client/src/services/node.service.ts`
- Create: `client/src/services/edge.service.ts`

- [ ] **Step 1：建立 axios base instance**

`client/src/services/api.ts`：
```typescript
import axios from 'axios'

/** 統一的 axios instance，所有 API 呼叫都透過此 instance */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('[API Error]', error.response?.data ?? error.message)
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 2：建立各模組的 service**

`client/src/services/blueprint.service.ts`：
```typescript
import api from './api'
import type { BlueprintDto, CreateBlueprintDto, UpdateBlueprintDto } from '../types'

export const BlueprintService = {
  findAll: () => api.get<BlueprintDto[]>('/blueprints').then(r => r.data),
  findOne: (id: string) => api.get<BlueprintDto>(`/blueprints/${id}`).then(r => r.data),
  create: (dto: CreateBlueprintDto) => api.post<BlueprintDto>('/blueprints', dto).then(r => r.data),
  update: (id: string, dto: UpdateBlueprintDto) => api.put<BlueprintDto>(`/blueprints/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/blueprints/${id}`),
}
```

`client/src/services/node.service.ts`：
```typescript
import api from './api'
import type { NodeDto, CreateNodeDto, UpdateNodeDto } from '../types'

export const NodeService = {
  findByBlueprint: (blueprintId: string) =>
    api.get<NodeDto[]>('/nodes', { params: { blueprintId } }).then(r => r.data),
  create: (dto: CreateNodeDto) => api.post<NodeDto>('/nodes', dto).then(r => r.data),
  update: (id: string, dto: UpdateNodeDto) => api.put<NodeDto>(`/nodes/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/nodes/${id}`),
}
```

`client/src/services/edge.service.ts`：
```typescript
import api from './api'
import type { EdgeDto, CreateEdgeDto, UpdateEdgeDto } from '../types'

export const EdgeService = {
  findByBlueprint: (blueprintId: string) =>
    api.get<EdgeDto[]>('/edges', { params: { blueprintId } }).then(r => r.data),
  create: (dto: CreateEdgeDto) => api.post<EdgeDto>('/edges', dto).then(r => r.data),
  update: (id: string, dto: UpdateEdgeDto) => api.put<EdgeDto>(`/edges/${id}`, dto).then(r => r.data),
  remove: (id: string) => api.delete(`/edges/${id}`),
}
```

- [ ] **Step 3：Commit**

```bash
git add client/src/services/
git commit -m "feat: add frontend API service layer"
```

---

## Task 12：Zustand 狀態管理

**Files:**
- Create: `client/src/stores/blueprint.store.ts`
- Create: `client/src/stores/canvas.store.ts`

- [ ] **Step 1：建立 blueprint.store.ts**

```typescript
import { create } from 'zustand'
import { BlueprintDto, CreateBlueprintDto } from '../types'
import { BlueprintService } from '../services/blueprint.service'

interface BlueprintState {
  blueprints: BlueprintDto[]
  isLoading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  create: (dto: CreateBlueprintDto) => Promise<BlueprintDto>
  remove: (id: string) => Promise<void>
}

/** 藍圖列表全域狀態 */
export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprints: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const blueprints = await BlueprintService.findAll()
      set({ blueprints, isLoading: false })
    } catch (e) {
      set({ error: 'Failed to load blueprints', isLoading: false })
    }
  },

  create: async (dto) => {
    const blueprint = await BlueprintService.create(dto)
    set(state => ({ blueprints: [blueprint, ...state.blueprints] }))
    return blueprint
  },

  remove: async (id) => {
    await BlueprintService.remove(id)
    set(state => ({ blueprints: state.blueprints.filter(b => b.id !== id) }))
  },
}))
```

- [ ] **Step 2：建立 canvas.store.ts**

```typescript
import { create } from 'zustand'
import { NodeDto, EdgeDto, CreateNodeDto, CreateEdgeDto } from '../types'
import { NodeService } from '../services/node.service'
import { EdgeService } from '../services/edge.service'

interface CanvasState {
  nodes: NodeDto[]
  edges: EdgeDto[]
  selectedNodeId: string | null
  isLoading: boolean
  loadCanvas: (blueprintId: string) => Promise<void>
  addNode: (dto: CreateNodeDto) => Promise<void>
  removeNode: (id: string) => Promise<void>
  addEdge: (dto: CreateEdgeDto) => Promise<void>
  removeEdge: (id: string) => Promise<void>
  selectNode: (id: string | null) => void
}

/** 目前藍圖的畫布狀態（節點 + 連結） */
export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isLoading: false,

  loadCanvas: async (blueprintId) => {
    set({ isLoading: true })
    const [nodes, edges] = await Promise.all([
      NodeService.findByBlueprint(blueprintId),
      EdgeService.findByBlueprint(blueprintId),
    ])
    set({ nodes, edges, isLoading: false })
  },

  addNode: async (dto) => {
    const node = await NodeService.create(dto)
    set(state => ({ nodes: [...state.nodes, node] }))
  },

  removeNode: async (id) => {
    await NodeService.remove(id)
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.sourceNodeId !== id && e.targetNodeId !== id),
    }))
  },

  addEdge: async (dto) => {
    const edge = await EdgeService.create(dto)
    set(state => ({ edges: [...state.edges, edge] }))
  },

  removeEdge: async (id) => {
    await EdgeService.remove(id)
    set(state => ({ edges: state.edges.filter(e => e.id !== id) }))
  },

  selectNode: (id) => set({ selectedNodeId: id }),
}))
```

- [ ] **Step 3：Commit**

```bash
git add client/src/stores/
git commit -m "feat: add Zustand stores for blueprint and canvas"
```

---

## Task 13：藍圖列表頁面

**Files:**
- Create: `client/src/components/pages/BlueprintListPage.tsx`

- [ ] **Step 1：實作 BlueprintListPage**

```typescript
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBlueprintStore } from '../../stores/blueprint.store'

/** 首頁 — 顯示所有藍圖的卡片列表，支援新增與刪除 */
export function BlueprintListPage() {
  const navigate = useNavigate()
  const { blueprints, isLoading, fetchAll, create, remove } = useBlueprintStore()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const bp = await create({ name: newName.trim(), description: newDesc.trim() })
    setNewName('')
    setNewDesc('')
    setShowForm(false)
    navigate(`/canvas/${bp.id}`)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Game Theory Bot</h1>
        <button onClick={() => setShowForm(true)}>+ 新增藍圖</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ margin: '16px 0', padding: '16px', border: '1px solid #ccc' }}>
          <input
            placeholder="藍圖名稱"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <input
            placeholder="描述（選填）"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button type="submit">建立</button>
          <button type="button" onClick={() => setShowForm(false)}>取消</button>
        </form>
      )}

      {isLoading && <p>載入中...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {blueprints.map(bp => (
          <div
            key={bp.id}
            style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
            onClick={() => navigate(`/canvas/${bp.id}`)}
          >
            <h3>{bp.name}</h3>
            {bp.description && <p>{bp.description}</p>}
            <small>建立：{new Date(bp.createdAt).toLocaleDateString('zh-TW')}</small>
            <button
              onClick={e => { e.stopPropagation(); remove(bp.id) }}
              style={{ float: 'right' }}
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2：Commit**

```bash
git add client/src/components/pages/BlueprintListPage.tsx
git commit -m "feat: add BlueprintListPage"
```

---

## Task 14：React Flow 畫布與自訂節點元件

**Files:**
- Create: `client/src/components/canvas/LargeNode.tsx`
- Create: `client/src/components/canvas/SmallNode.tsx`
- Create: `client/src/components/canvas/CausalEdge.tsx`
- Create: `client/src/components/canvas/BlueprintCanvas.tsx`

- [ ] **Step 1：建立 LargeNode 元件**

`client/src/components/canvas/LargeNode.tsx`：
```typescript
import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/**
 * 大節點元件 — 里程碑事件
 * weight 動態驅動 opacity（視覺亮度）與 fontSize（視覺大小感知）
 */
export function LargeNode({ data, selected }: NodeProps) {
  const node = data as NodeDto
  const opacity = Math.max(0.3, Math.min(1, node.weight / 3.0))
  const borderColor = TYPE_COLORS[node.type] ?? '#888'

  return (
    <div style={{
      opacity,
      padding: '12px 16px',
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      background: 'white',
      minWidth: '140px',
      maxWidth: '220px',
      boxShadow: selected ? `0 0 8px ${borderColor}` : 'none',
      fontWeight: 'bold',
    }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: '11px', color: borderColor, marginBottom: '4px' }}>{node.type}</div>
      <div style={{ fontSize: '14px' }}>{node.title}</div>
      <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
        weight: {node.weight.toFixed(2)}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

- [ ] **Step 2：建立 SmallNode 元件**

`client/src/components/canvas/SmallNode.tsx`：
```typescript
import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { NodeDto, NodeType } from '../../types'

const TYPE_COLORS: Record<NodeType, string> = {
  [NodeType.ACTOR]: '#4A90D9',
  [NodeType.EVENT]: '#E67E22',
  [NodeType.INTEREST]: '#27AE60',
}

/** 小節點元件 — 大節點的組成部分 */
export function SmallNode({ data, selected }: NodeProps) {
  const node = data as NodeDto
  const opacity = Math.max(0.3, Math.min(1, node.weight / 3.0))
  const borderColor = TYPE_COLORS[node.type] ?? '#888'

  return (
    <div style={{
      opacity,
      padding: '8px 12px',
      border: `1px solid ${borderColor}`,
      borderRadius: '20px',
      background: 'white',
      minWidth: '100px',
      boxShadow: selected ? `0 0 6px ${borderColor}` : 'none',
    }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: '10px', color: borderColor }}>{node.type}</div>
      <div style={{ fontSize: '12px' }}>{node.title}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

- [ ] **Step 3：建立 CausalEdge 元件**

`client/src/components/canvas/CausalEdge.tsx`：
```typescript
import React from 'react'
import { EdgeProps, getBezierPath } from '@xyflow/react'
import { EdgeDto, Direction } from '../../types'

const DIRECTION_COLORS: Record<Direction, string> = {
  [Direction.PROMOTES]: '#27AE60',
  [Direction.INHIBITS]: '#E74C3C',
  [Direction.NEUTRAL]: '#95A5A6',
}

/** 因果連結元件 — 顏色代表方向（綠=促進、紅=抑制、灰=中性） */
export function CausalEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  const edge = data as EdgeDto
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const color = DIRECTION_COLORS[edge?.direction] ?? '#95A5A6'

  return (
    <path
      id={id}
      d={edgePath}
      stroke={color}
      strokeWidth={2}
      fill="none"
      markerEnd={`url(#arrow-${color.replace('#', '')})`}
    />
  )
}
```

- [ ] **Step 4：建立 BlueprintCanvas 主元件**

`client/src/components/canvas/BlueprintCanvas.tsx`：
```typescript
import React, { useEffect, useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Connection, Node, Edge,
} from '@xyflow/react'
import { useCanvasStore } from '../../stores/canvas.store'
import { LargeNode } from './LargeNode'
import { SmallNode } from './SmallNode'
import { CausalEdge } from './CausalEdge'
import { NodeDto, NodeSize, Direction, Magnitude } from '../../types'

const NODE_TYPES = {
  large: LargeNode,
  small: SmallNode,
}

const EDGE_TYPES = {
  causal: CausalEdge,
}

interface Props {
  blueprintId: string
}

/**
 * 藍圖畫布主元件
 * 將 canvasStore 的 NodeDto[] / EdgeDto[] 轉換為 React Flow 格式
 */
export function BlueprintCanvas({ blueprintId }: Props) {
  const { nodes: storeNodes, edges: storeEdges, loadCanvas, selectNode, addEdge: storeAddEdge } = useCanvasStore()

  const flowNodes: Node[] = storeNodes.map((n, idx) => ({
    id: n.id,
    type: n.size === NodeSize.LARGE ? 'large' : 'small',
    position: { x: (idx % 5) * 200, y: Math.floor(idx / 5) * 150 },
    data: n,
  }))

  const flowEdges: Edge[] = storeEdges.map(e => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    type: 'causal',
    data: e,
  }))

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { loadCanvas(blueprintId) }, [blueprintId, loadCanvas])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      storeAddEdge({
        blueprintId,
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        direction: Direction.PROMOTES,
        magnitude: Magnitude.MEDIUM,
        theoryIds: [],
      })
    },
    [blueprintId, storeAddEdge]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => { selectNode(node.id) },
    [selectNode]
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 5：Commit**

```bash
git add client/src/components/canvas/
git commit -m "feat: add React Flow canvas with custom node/edge components"
```

---

## Task 15：畫布頁面與節點建立面板

**Files:**
- Create: `client/src/components/pages/CanvasPage.tsx`
- Create: `client/src/components/panels/NodeInfoPanel.tsx`

- [ ] **Step 1：建立 CanvasPage**

`client/src/components/pages/CanvasPage.tsx`：
```typescript
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BlueprintCanvas } from '../canvas/BlueprintCanvas'
import { NodeInfoPanel } from '../panels/NodeInfoPanel'
import { useCanvasStore } from '../../stores/canvas.store'
import { NodeType, NodeSize, TimeScale } from '../../types'

/** 畫布主頁面 — 包含工具列、React Flow 畫布、節點資訊面板 */
export function CanvasPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>()
  const navigate = useNavigate()
  const { selectedNodeId, addNode } = useCanvasStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNodeTitle, setNewNodeTitle] = useState('')
  const [newNodeType, setNewNodeType] = useState<NodeType>(NodeType.EVENT)
  const [newNodeSize, setNewNodeSize] = useState<NodeSize>(NodeSize.LARGE)
  const [newTimeScale, setNewTimeScale] = useState<TimeScale>(TimeScale.MEDIUM)

  if (!blueprintId) return <div>找不到藍圖</div>

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNodeTitle.trim()) return
    await addNode({
      blueprintId,
      type: newNodeType,
      size: newNodeSize,
      title: newNodeTitle.trim(),
      timeScale: newTimeScale,
    })
    setNewNodeTitle('')
    setShowAddForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 工具列 */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>← 返回列表</button>
        <button onClick={() => setShowAddForm(!showAddForm)}>+ 新增節點</button>
      </div>

      {/* 新增節點表單 */}
      {showAddForm && (
        <form onSubmit={handleAddNode} style={{ padding: '8px 16px', borderBottom: '1px solid #eee', display: 'flex', gap: '8px' }}>
          <input placeholder="節點標題" value={newNodeTitle} onChange={e => setNewNodeTitle(e.target.value)} required />
          <select value={newNodeType} onChange={e => setNewNodeType(e.target.value as NodeType)}>
            {Object.values(NodeType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={newNodeSize} onChange={e => setNewNodeSize(e.target.value as NodeSize)}>
            {Object.values(NodeSize).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={newTimeScale} onChange={e => setNewTimeScale(e.target.value as TimeScale)}>
            {Object.values(TimeScale).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="submit">新增</button>
          <button type="button" onClick={() => setShowAddForm(false)}>取消</button>
        </form>
      )}

      {/* 主體：畫布 + 側邊面板 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <BlueprintCanvas blueprintId={blueprintId} />
        </div>
        {selectedNodeId && (
          <div style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
            <NodeInfoPanel nodeId={selectedNodeId} blueprintId={blueprintId} />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2：建立 NodeInfoPanel**

`client/src/components/panels/NodeInfoPanel.tsx`：
```typescript
import React from 'react'
import { useCanvasStore } from '../../stores/canvas.store'

interface Props {
  nodeId: string
  blueprintId: string
}

/** 點擊節點後顯示的側邊資訊面板（Plan 2 會加入 AI 功能） */
export function NodeInfoPanel({ nodeId, blueprintId }: Props) {
  const { nodes, edges, removeNode, selectNode } = useCanvasStore()
  const node = nodes.find(n => n.id === nodeId)
  const nodeEdges = edges.filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId)

  if (!node) return null

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{node.title}</h3>
        <button onClick={() => selectNode(null)}>✕</button>
      </div>
      <p><strong>類型：</strong>{node.type}</p>
      <p><strong>大小：</strong>{node.size}</p>
      <p><strong>狀態：</strong>{node.status}</p>
      <p><strong>時間尺度：</strong>{node.timeScale}</p>
      <p><strong>Weight：</strong>{node.weight.toFixed(2)}</p>
      <p><strong>建立者：</strong>{node.createdBy}</p>
      {node.description && <p><strong>描述：</strong>{node.description}</p>}

      <hr />
      <h4>相關連結（{nodeEdges.length}）</h4>
      {nodeEdges.map(e => (
        <div key={e.id} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #eee' }}>
          {e.sourceNodeId === nodeId ? '→' : '←'} {e.direction} / {e.magnitude}
        </div>
      ))}

      <hr />
      <button
        onClick={async () => { await removeNode(nodeId) }}
        style={{ color: 'red' }}
      >
        刪除此節點
      </button>
    </div>
  )
}
```

- [ ] **Step 3：Commit**

```bash
git add client/src/components/
git commit -m "feat: add CanvasPage and NodeInfoPanel"
```

---

## Task 16：start.bat 啟動腳本

**Files:**
- Create: `start.bat`

- [ ] **Step 1：建立 start.bat**

```bat
@echo off
echo ========================================
echo   Game Theory Bot - Starting...
echo ========================================

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo [2/3] Building shared types...
call npm run build:shared
if %errorlevel% neq 0 (
    echo ERROR: shared build failed
    pause
    exit /b 1
)

echo [3/3] Starting server and client...
echo Server: http://localhost:3000
echo Client: http://localhost:5173
echo Press Ctrl+C to stop

start "GTB Server" cmd /c "npm run dev:server"
timeout /t 3 /nobreak >nul
start "GTB Client" cmd /c "npm run dev:client"

echo Both processes started. Check the opened windows.
pause
```

- [ ] **Step 2：Commit**

```bash
git add start.bat
git commit -m "chore: add start.bat launcher script"
```

---

## Task 17：全體測試執行確認

- [ ] **Step 1：執行後端所有測試**

```bash
cd server && npx jest --no-coverage
```

Expected: 所有測試通過，無失敗

- [ ] **Step 2：啟動後端確認無錯誤**

```bash
npx ts-node src/main.ts
```

Expected: `Server running on http://localhost:3000`，資料庫初始化成功，三個預設理論植入

- [ ] **Step 3：驗證 API 端點**

```bash
curl http://localhost:3000/api/blueprints
# Expected: []

curl http://localhost:3000/api/theories
# Expected: 包含三個預設理論的 JSON 陣列
```

- [ ] **Step 4：啟動前端確認無編譯錯誤**

```bash
cd ../client && npx vite
```

Expected: `Local: http://localhost:5173/`，瀏覽器可開啟藍圖列表頁

- [ ] **Step 5：最終 Commit**

```bash
cd ..
git add .
git commit -m "chore: Plan 1 complete — foundation and data layer"
```

---

## 計劃範圍說明

**Plan 1 完成後可做的事：**
- 在瀏覽器中建立、查看、刪除藍圖
- 在 React Flow 畫布上手動建立節點（LARGE/SMALL）和連結（Edge）
- 查看節點詳細資訊

**Plan 2（AI 引擎）將加入：**
- OpenRouter API 整合
- TheoryComposer（Prompt 組合器）
- 4 個 AI Service（Search、Verification、Ideation、Relationship）
- 模型列表管理介面
- 右鍵 AI 展開節點功能

**Plan 3（回顧機制 + 完整 UI）將加入：**
- WeeklyReviewScheduler（每週自動回顧）
- Weight 計算與視覺更新
- 理論管理介面
- 回顧歷史頁面
