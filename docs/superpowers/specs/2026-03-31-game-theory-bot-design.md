# Game Theory Bot — 系統設計規格

**日期**：2026-03-31
**狀態**：草稿

---

## 一、專案概述

一個融合 AI 的地緣政治預測系統。使用者與 AI 共同在圖結構（Graph）中建構因果推演網路，對未來事件做出方向性預測，並透過每週自動回顧評估預測的準確性。系統以「節點（Node）」和「理論（Theory）」為核心元素，AI 依據可組合的理論框架進行推演與驗證。

### 核心價值

- 把複雜的地緣政治事件分解為可操作的結構化節點
- 透過理論框架（攻勢現實主義、黑天鵝理論、行為賽局分析）驅動 AI 推演
- 以視覺化的方式呈現預測的「存活狀況」，正確的預測鏈隨時間成長，錯誤的分支逐漸萎縮

---

## 二、技術選型

| 層次 | 技術 | 原因 |
|------|------|------|
| 前端框架 | React + TypeScript | 生態系成熟，搭配 React Flow 處理圖視覺化 |
| 圖視覺化 | React Flow | 開箱即用的節點圖編輯，支援自訂節點元件 |
| 狀態管理 | Zustand | 輕量，適合圖這種複雜本地狀態 |
| 後端框架 | NestJS（TypeScript） | 天然 OOP、依賴注入、模組化，符合可擴展性需求 |
| 資料庫 | SQLite（TypeORM） | 輕量易部署，WAL 模式處理並發，日後可換 PostgreSQL |
| 並發控制 | SQLite WAL + async-mutex | 不引入 Redis，以輕量 mutex 串行化寫入操作 |
| AI 整合 | OpenRouter API | 統一入口，支援多家模型，可篩選免費模型 |
| 排程 | NestJS @Cron | 內建排程，無需額外依賴 |
| 部署 | Docker（第二期） / batch 腳本（第一期） | 先求能跑，後求標準化 |
| 專案結構 | npm workspaces（Monorepo） | 前後端共用型別定義 |

---

## 三、專案目錄結構

```
game-theory-bot/
├── client/                      # React + TypeScript 前端
│   ├── src/
│   │   ├── components/          # UI 元件
│   │   ├── services/            # API 呼叫層
│   │   ├── stores/              # Zustand 狀態管理
│   │   └── types/               # 引用 shared/ 型別
│   └── package.json
│
├── server/                      # NestJS 後端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── blueprint/       # 藍圖管理模組
│   │   │   ├── node/            # 節點 CRUD + 層級管理
│   │   │   ├── theory/          # 理論管理 + Prompt 組合引擎
│   │   │   ├── edge/            # 節點間連結（因果關係）
│   │   │   ├── ai/              # OpenRouter 整合 + 模型管理
│   │   │   └── review/          # 每週回顧排程 + 評估邏輯
│   │   ├── database/            # TypeORM 設定 + SQLite
│   │   └── common/              # 共用 Guard、Filter、Interceptor
│   └── package.json
│
├── shared/                      # 前後端共用型別定義
│   └── types/
│       ├── node.ts
│       ├── theory.ts
│       ├── edge.ts
│       └── blueprint.ts
│
├── start.bat                    # Windows batch 啟動腳本
├── Dockerfile                   # 未來 Docker 部署
└── package.json                 # Monorepo 根設定
```

---

## 四、資料模型

### Blueprint（藍圖）

```typescript
class Blueprint {
  id: string
  name: string          // 例如「中東局勢 2025」
  description: string
  createdAt: Date
  updatedAt: Date
}
```

各藍圖完全隔離，不共享節點或連結。

---

### Node（節點）

```typescript
enum NodeType   { ACTOR, EVENT, INTEREST }
enum NodeSize   { SMALL, LARGE }
enum NodeStatus { ACTIVE, VALIDATED, INVALIDATED }
enum TimeScale  { SHORT, MEDIUM, LONG }

class Node {
  id: string
  blueprintId: string
  type: NodeType
  size: NodeSize            // 業務屬性：決定節點是否可展開子節點、是否支援 AI 展開
  status: NodeStatus
  title: string
  description: string
  weight: number            // 視覺驅動值，初始 1.0，範圍 0.1 ~ 3.0，由回顧機制動態調整
  timeScale: TimeScale      // 此節點預測的時間尺度，用於回顧機制的到期門檻計算
  createdBy: 'user' | 'ai'
  parentNodeId?: string     // 小節點歸屬於哪個大節點（SMALL 節點專用）
  createdAt: Date
}
```

**節點分類說明：**
- **大節點（LARGE）**：里程碑事件，代表一個方向上的重要轉折；可展開子節點，支援 AI 展開功能
- **小節點（SMALL）**：大節點的組成部分，可以是具體人物（ACTOR）、具體行動（EVENT）、或利益動機（INTEREST）；不可再有子節點（層級上限為兩層）

**`NodeSize` 與 `weight` 的關係：**
- `NodeSize` 是業務屬性，決定節點的功能權限（LARGE 才能展開子節點）
- `weight` 是 UI 視覺驅動值，動態決定節點在畫布上顯示的大小與亮度，與 `NodeSize` 無關

**`parentNodeId` 約束規則：**
- 只有 `NodeSize.SMALL` 的節點才可設定 `parentNodeId`
- `parentNodeId` 所指向的父節點必須是 `NodeSize.LARGE`
- 此約束在 Service 層驗證（非 DB constraint，以維持彈性）
- 刪除父節點時，子節點執行 cascade delete（一併刪除所有子節點）

---

### Theory（理論）

```typescript
class Theory {
  id: string
  name: string              // 例如「攻勢現實主義」
  promptFragment: string    // 實際餵給 AI 的 Prompt 片段
  isPreset: boolean         // true = 系統預設，false = 使用者自訂
  tags: string[]            // 便於搜尋與組合
  createdAt: Date
}
```

**預設理論模板：**

| 名稱 | 來源 | 核心方向 |
|------|------|---------|
| 攻勢現實主義 | 米爾斯海默 | 大國必然擴張、安全兩難、霸權競爭 |
| 黑天鵝偵測 | 塔勒布 | 標記尾部風險、避免敘事謬誤、非線性衝擊 |
| 行為賽局分析 | 江學勤 | 行為者利益計算、聯盟形成、策略互動 |

---

### Edge（因果連結）

```typescript
enum Direction  { PROMOTES, INHIBITS, NEUTRAL }
enum Magnitude  { SMALL, MEDIUM, LARGE }

class Edge {
  id: string
  blueprintId: string
  sourceNodeId: string
  targetNodeId: string
  theoryIds: string[]       // 支撐這條連結的理論（可多個，有機組合；允許空陣列）
  direction: Direction
  magnitude: Magnitude
  reasoning: string         // AI 或使用者對這條連結的說明
  createdBy: 'user' | 'ai'
}
```

**`theoryIds` 規則：**
- 允許為空陣列（使用者可建立無理論支撐的連結）
- AI 自動建立的 Edge，`theoryIds` 填入觸發該次 AI 操作時使用者選定的理論 ID；若無選定理論則為空陣列
- 前端不強制要求，但 UI 在 `theoryIds` 為空時顯示提示（非錯誤）

---

### AIModel（AI 模型）

```typescript
enum ModelTier { TOP, FREE }

class AIModel {
  id: string
  modelId: string         // OpenRouter 識別碼，例如 "openai/gpt-4o"
  displayName: string
  tier: ModelTier
  pricingPrompt: string   // 每 token 費用（字串，保留原始精度）
  updatedAt: Date
}
```

---

### ReviewRecord（回顧紀錄）

```typescript
enum ReviewVerdict { CONFIRMED, REFUTED, PENDING }

class ReviewRecord {
  id: string
  nodeId: string
  reviewedAt: Date
  verdict: ReviewVerdict
  evidenceSummary: string   // AI 提供的佐證或反駁說明
  weightBefore: number
  weightAfter: number
}
```

---

## 五、AI 引擎設計

### 類別層次結構

```
IAIGateway（interface）
    └── OpenRouterGateway          ← 目前實作，日後可替換
            ↑
        TheoryComposer             ← 負責組合 Prompt 片段
            ↑
        AbstractAIService          ← 抽象基礎類別，統一請求入口
            ├── SearchAIService
            ├── VerificationAIService
            ├── IdeationAIService
            └── RelationshipAIService
```

### 上下文隔離原則

每次 AI 呼叫都是無狀態的獨立請求，不共享對話歷史。所有子類別只能透過 `AbstractAIService.execute()` 唯一入口呼叫 AI。

```typescript
class PromptContext {
  readonly sessionId: string           // 唯一 ID，用於 log 追蹤
  readonly operation: AIOperation      // SEARCH / VERIFY / IDEATE / LINK
  readonly systemPrompt: string        // 由 TheoryComposer 組合的理論透鏡
  readonly messages: Message[]
  readonly metadata: Record<string, unknown>

  static build(params: PromptContextParams): PromptContext
}

abstract class AbstractAIService {
  protected async execute(context: PromptContext): Promise<AIResponse>
  protected getActiveModel(): string
  private readonly gateway: IAIGateway  // 子類別不可直接存取
}

// 統一的 AI 錯誤類型，execute() 內部捕捉並包裝所有來自 gateway 的錯誤
class AIException extends Error {
  constructor(
    public readonly operation: AIOperation,
    public readonly sessionId: string,
    public readonly cause: unknown,
  ) { super(`AI operation ${operation} failed`) }
}
```

`execute()` 的錯誤處理合約：
- OpenRouter 呼叫失敗（網路錯誤、rate limit、模型不可用）一律拋出 `AIException`
- 子類別不需自行捕捉，讓 `AIException` 冒泡至 NestJS 的 Global Exception Filter
- Exception Filter 將 `AIException` 轉換為 HTTP 503 回應，格式為 `{ error: string, sessionId: string }`
```

### AI 功能方法清單

**搜尋（SearchAIService）**
- `expandNodeToSmallNodes(nodeId)` — 展開大節點為相關小節點
- `findRelatedActors(nodeId)` — 找出相關行為者
- `findRelatedInterests(nodeId)` — 找出潛在利益動機

**驗證（VerificationAIService）**
- `reviewNodeValidity(nodeId, context)` — 單一節點驗證，回傳 verdict + 佐證說明
- `batchReviewBlueprint(blueprintId)` — 對藍圖內所有活躍節點逐一呼叫 `reviewNodeValidity`，為 `WeeklyReviewScheduler` 的入口；也可透過 REST API 手動觸發
- `updateNodeWeight(nodeId, verdict)` — 根據判定結果更新 weight

**發想（IdeationAIService）**
- `generateCausalChain(prompt, theoryIds)` — 依據理論透鏡生成因果推演鏈
- `suggestNextNodes(blueprintId)` — 主動提出接下來可能出現的節點
- `proposeNewTheory(edgeIds)` — 從現有連結歸納出新的理論 Prompt 片段

**鏈接關係（RelationshipAIService）**
- `suggestEdges(nodeId)` — 建議應與哪些現有節點連結
- `explainEdge(sourceId, targetId, theoryIds)` — 生成連結的 reasoning 說明
- `detectConflictingEdges(blueprintId)` — 偵測圖中邏輯矛盾的連結

### IAIGateway 介面定義

所有 AI 呼叫統一透過此介面，不得繞過：

```typescript
interface IAIGateway {
  /**
   * 發送一次完整的對話請求
   * @param model - OpenRouter 模型識別碼，例如 "openai/gpt-4o"
   * @param messages - 完整的對話訊息陣列（含 system / user / assistant 角色）
   * @returns AI 回覆的文字內容
   */
  chat(model: string, messages: Message[]): Promise<string>

  /**
   * 發送串流對話請求，逐步回傳文字片段
   * @param model - OpenRouter 模型識別碼
   * @param messages - 完整的對話訊息陣列
   * @returns 非同步迭代器，每次 yield 一個文字片段
   */
  streamChat(model: string, messages: Message[]): AsyncIterableIterator<string>
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  content: string
  tokensUsed: number
  modelUsed: string
}
```

### Theory 驅動 Prompt 組合機制

`TheoryComposer` 負責將使用者選定的多個 Theory 組合成 system prompt 注入：

```
[固定系統角色]
你是一個地緣政治分析師，擅長因果推演與預測評估。

[動態理論透鏡] ← 由 TheoryComposer 根據 theoryIds 組合
{theory_1.promptFragment}

{theory_2.promptFragment}

[任務指令] ← 由各 AIService 子類別提供
{operation_specific_instruction}

[上下文資料] ← 由各 AIService 子類別從資料庫查詢後注入
{relevant_nodes_and_edges}
```

`TheoryComposer` 的組合規則：
- 多個 Theory 的 `promptFragment` 以換行分隔依序注入
- 若未選擇任何 Theory，則只使用固定系統角色
- 組合結果作為 `PromptContext.systemPrompt` 傳入 `execute()`

### 模型管理（ModelManager）

使用者點擊「更新模型列表」時：
1. 呼叫 OpenRouter `/api/v1/models`
2. 篩選頂級推理模型（依能力與定價，取前 5 名）
3. 篩選最佳免費模型（`pricing.prompt === "0"`，取前 5 名）
4. 存入資料庫，UI 分組顯示

---

## 六、回顧機制

### 觸發方式

- **自動**：`WeeklyReviewScheduler` 每週日凌晨 2:00 觸發，呼叫 `batchReviewBlueprint()` 對所有藍圖執行
- **手動**：`POST /api/review/blueprints/:blueprintId` — 立即觸發指定藍圖的回顧，回傳 `{ jobId: string, startedAt: Date }`（非同步執行，前端可透過 `GET /api/review/jobs/:jobId` 查詢進度）

### 流程

```
WeeklyReviewScheduler（每週日凌晨 2:00）或手動 API
    ↓
VerificationAIService.batchReviewBlueprint(blueprintId)
    ↓ 對每個活躍節點逐一執行
VerificationAIService.reviewNodeValidity(nodeId, context)
    ↓
ReviewEvaluator.calculateNewWeight(
  verdict,
  currentWeight,
  node.timeScale,          ← 從 Node 自身的 timeScale 欄位取得
  weeksSinceCreation
)
    ↓
NodeRepository.updateWeight(nodeId, newWeight)（透過 DatabaseWriteService.write()）
    ↓
ReviewRecord 寫入資料庫
```

### Weight 計算邏輯

初始值：`1.0`，範圍：`0.1 ~ 3.0`

| 判定結果 | 計算方式 | 說明 |
|---------|---------|------|
| CONFIRMED | `weight * 1.3`，上限 3.0 | 節點變大變亮 |
| REFUTED | `weight * 0.6`，下限 0.1 | 節點縮小變暗 |
| PENDING（未到期） | 不變 | 尚在時間尺度內 |
| PENDING（已到期） | `weight * 0.95`，下限 0.1 | 時間價值緩慢流失 |

**到期門檻（可設定常數）：**
- SHORT：4 週後開始衰減
- MEDIUM：12 週後開始衰減
- LONG：52 週後開始衰減

### 視覺映射

| weight 範圍 | 節點尺寸 | 亮度 | 邊線 |
|------------|---------|------|------|
| >= 2.0 | Large | 100% | 實線加粗 |
| 1.0 ~ 2.0 | Medium | 70% | 實線 |
| 0.5 ~ 1.0 | Small | 50% | 實線細 |
| < 0.5 | Extra Small | 30% | 虛線 |

---

## 七、UI/UX 設計

### 介面一：藍圖列表（首頁）

- 所有藍圖以卡片形式呈現（名稱、建立日期、節點數、上次回顧時間）
- 新增藍圖按鈕
- 點擊卡片進入圖編輯器

### 介面二：圖編輯器（核心介面）

**畫布操作：**
- 拖拽移動節點、滾輪縮放、框選多節點
- 點擊節點開啟側邊資訊面板（詳情、歸屬理論、回顧歷史）
- 拖拽連線建立 Edge，自動開啟 Edge 設定面板

**節點外觀：**
- 大節點：圓角方框；小節點：橢圓
- NodeType 對應不同顏色（ACTOR / EVENT / INTEREST）
- weight 動態驅動尺寸與透明度

**右鍵選單：**
- 新增子節點
- AI 展開（大節點限定）
- AI 建議連結
- 刪除節點

**工具列：**
- AI 模型選擇下拉（分「頂級」與「免費」兩組）
- 更新模型列表按鈕
- 手動觸發回顧按鈕
- 顯示模式切換（全部 / 僅高 weight 節點）

### 介面三：理論管理

- 列出所有理論，區分預設與自訂
- 新增、編輯、刪除自訂理論
- 預設理論唯讀
- 標籤篩選

### 介面四：回顧歷史

- 時間軸顯示每次回顧紀錄
- 點開單次回顧查看各節點判定結果與 AI 佐證說明
- 可跳轉回圖編輯器並高亮受影響的節點

---

## 八、並發處理

SQLite 啟用 WAL（Write-Ahead Logging）模式，讀取操作不阻塞寫入。寫入操作透過 `async-mutex` 套件的 `Mutex` 類別串行化，不引入 Redis 或 Bull Queue，維持輕量部署原則。

```typescript
// DatabaseWriteService 統一管理所有寫入操作
class DatabaseWriteService {
  private readonly mutex = new Mutex()

  /**
   * 串行化執行寫入操作，確保同一時間只有一個寫入在進行
   * @param operation - 要執行的寫入函式
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

所有 Repository 的寫入方法（create / update / delete）必須透過 `DatabaseWriteService.write()` 執行。讀取操作可直接存取，無需經過 mutex。

---

## 九、啟動方式

### 第一期（batch 腳本）

```bat
start.bat
```

腳本執行：安裝依賴 → 初始化資料庫 → 啟動後端（port 3000）→ 啟動前端（port 5173）

### 第二期（Docker）

```bash
docker compose up
```

---

## 十、shared/ 型別分層規則

`shared/` 只放**前後端都需要的純型別定義（DTO 與 enum）**，不放 TypeORM Entity（Entity 只屬於後端）。

| 放在 shared/ | 不放在 shared/ |
|-------------|---------------|
| enum（NodeType、Direction 等） | TypeORM Entity（含裝飾器） |
| DTO（CreateNodeDto、UpdateEdgeDto） | Repository class |
| 回應型別（ApiResponse、AIResponse） | NestJS Service / Controller |
| 前後端共用介面（IAIGateway 的 Message 型別） | 資料庫遷移檔案 |

前端的 `client/src/types/` 只做 re-export，不另外定義型別。

---

## 十一、擴展性考量

- `IAIGateway` 抽象化，日後替換 AI 供應商只需新增 Gateway 實作
- 各 NestJS 模組完全獨立，新增功能不影響現有模組
- `shared/types` 統一型別，前後端同步更新
- Weight 計算相關常數全部集中在設定檔，不硬編碼
- 資料庫透過 TypeORM，日後切換至 PostgreSQL 只需修改設定
