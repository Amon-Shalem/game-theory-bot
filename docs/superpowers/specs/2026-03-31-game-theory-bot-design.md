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

class Node {
  id: string
  blueprintId: string
  type: NodeType
  size: NodeSize
  status: NodeStatus
  title: string
  description: string
  weight: number          // 視覺大小/亮度，初始值 1.0，範圍 0.1 ~ 3.0
  createdBy: 'user' | 'ai'
  parentNodeId?: string   // 小節點歸屬於哪個大節點
  createdAt: Date
}
```

**節點分類說明：**
- **大節點（LARGE）**：里程碑事件，代表一個方向上的重要轉折
- **小節點（SMALL）**：大節點的組成部分，可以是具體人物（ACTOR）、具體行動（EVENT）、或利益動機（INTEREST）

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
enum TimeScale  { SHORT, MEDIUM, LONG }

class Edge {
  id: string
  blueprintId: string
  sourceNodeId: string
  targetNodeId: string
  theoryIds: string[]       // 支撐這條連結的理論（可多個，有機組合）
  direction: Direction
  magnitude: Magnitude
  timeScale: TimeScale
  reasoning: string         // AI 或使用者對這條連結的說明
  createdBy: 'user' | 'ai'
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
```

### AI 功能方法清單

**搜尋（SearchAIService）**
- `expandNodeToSmallNodes(nodeId)` — 展開大節點為相關小節點
- `findRelatedActors(nodeId)` — 找出相關行為者
- `findRelatedInterests(nodeId)` — 找出潛在利益動機

**驗證（VerificationAIService）**
- `reviewNodeValidity(nodeId, context)` — 單一節點驗證，回傳 verdict + 佐證說明
- `batchReviewBlueprint(blueprintId)` — 批次驗證整張藍圖
- `updateNodeWeight(nodeId, verdict)` — 根據判定結果更新 weight

**發想（IdeationAIService）**
- `generateCausalChain(prompt, theoryIds)` — 依據理論透鏡生成因果推演鏈
- `suggestNextNodes(blueprintId)` — 主動提出接下來可能出現的節點
- `proposeNewTheory(edgeIds)` — 從現有連結歸納出新的理論 Prompt 片段

**鏈接關係（RelationshipAIService）**
- `suggestEdges(nodeId)` — 建議應與哪些現有節點連結
- `explainEdge(sourceId, targetId, theoryIds)` — 生成連結的 reasoning 說明
- `detectConflictingEdges(blueprintId)` — 偵測圖中邏輯矛盾的連結

### 模型管理（ModelManager）

使用者點擊「更新模型列表」時：
1. 呼叫 OpenRouter `/api/v1/models`
2. 篩選頂級推理模型（依能力與定價，取前 5 名）
3. 篩選最佳免費模型（`pricing.prompt === "0"`，取前 5 名）
4. 存入資料庫，UI 分組顯示

---

## 六、回顧機制

### 流程

```
WeeklyReviewScheduler（每週日凌晨 2:00）
    ↓
ReviewOrchestrator.runBlueprintReview(blueprintId)
    ↓ 對每個活躍節點
VerificationAIService.reviewNodeValidity(nodeId, context)
    ↓
ReviewEvaluator.calculateNewWeight(verdict, currentWeight, timeScale, weeksSinceCreation)
    ↓
NodeRepository.updateWeight(nodeId, newWeight)
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

SQLite 啟用 WAL（Write-Ahead Logging）模式：讀取操作不阻塞，寫入操作透過 NestJS Bull Queue 排隊處理，確保多人同時操作時資料一致性。

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

## 十、擴展性考量

- `IAIGateway` 抽象化，日後替換 AI 供應商只需新增 Gateway 實作
- 各 NestJS 模組完全獨立，新增功能不影響現有模組
- `shared/types` 統一型別，前後端同步更新
- Weight 計算相關常數全部集中在設定檔，不硬編碼
- 資料庫透過 TypeORM，日後切換至 PostgreSQL 只需修改設定
