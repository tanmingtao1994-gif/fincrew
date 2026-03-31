# Data Model: AI Financial Assistant

**Feature**: AI个人理财助手
**Date**: 2026-03-12
**Phase**: 1 - 设计与合约

## 概述

本文档定义了 AI 个人理财助手系统的核心数据实体、它们之间的关系、验证规则和状态转换。

---

## 1. 市场数据实体

### StockData

表示股票基本信息和当前市场数据。

```typescript
interface StockData {
  // 标识信息
  ticker: string;              // 股票代码（例如 "AAPL", "0700.HK"）
  name: string;                // 公司名称
  exchange: string;            // 交易所（例如 "NASDAQ", "HKEX"）
  currency: string;             // 货币（例如 "USD", "HKD"）

  // 当前市场数据
  price: number;               // 当前价格
  change: number;              // 价格变化
  changePercent: number;        // 价格变化百分比
  volume: number;             // 交易量
  marketCap: number;           // 市值

  // 时间戳
  timestamp: Date;             // 数据时间戳
  lastUpdate: Date;            // 最后更新时间

  // 元数据
  source: string;              // 数据源（例如 "Yahoo Finance"）
}
```

**验证规则**:
- `ticker`: 必须匹配正则表达式 `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
- `price`: 必须 > 0
- `volume`: 必须 >= 0
- `timestamp`: 不能是未来时间

---

### TechnicalIndicator

表示股票的技术分析指标。

```typescript
interface TechnicalIndicator {
  // 标识信息
  ticker: string;              // 股票代码
  indicator: string;           // 指标类型（例如 "MA", "RSI", "MACD"）
  timeframe: string;           // 时间周期（例如 "1d", "1wk", "1mo"）

  // 指标值
  values: {
    [key: string]: number;     // 基于指标类型的动态值
    // MA 示例: { "MA20": 150.5, "MA50": 148.2 }
    // RSI 示例: { "RSI": 65.3 }
    // MACD 示例: { "MACD": 2.5, "Signal": 2.1, "Histogram": 0.4 }
  };

  // 时间戳
  timestamp: Date;             // 数据时间戳
  lastUpdate: Date;            // 最后更新时间
}
```

**验证规则**:
- `ticker`: 必须匹配正则表达式 `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
- `indicator`: 必须是 ["MA", "RSI", "MACD", "BB", "ATR", "OBV"] 之一
- `timeframe`: 必须是 ["1d", "1wk", "1mo"] 之一

---

### MarketNews

表示与投资标的相关的新闻文章。

```typescript
interface MarketNews {
  // 标识信息
  id: string;                 // 唯一新闻 ID
  title: string;               // 新闻标题
  content: string;             // 新闻内容/摘要
  url: string;                // 来源 URL

  // 元数据
  source: string;              // 新闻来源（例如 "Reuters", "Bloomberg"）
  author?: string;             // 作者姓名（可选）
  category: string;            // 新闻类别（例如 "Earnings", "M&A"）

  // 相关性
  relatedTickers: string[];     // 相关股票代码
  sentiment: 'positive' | 'negative' | 'neutral'; // 情感分析

  // 时间戳
  publishedAt: Date;           // 发布日期
  scrapedAt: Date;            // 抓取时间戳
}
```

**验证规则**:
- `id`: 必须唯一
- `title`: 不能为空
- `url`: 必须是有效的 URL
- `sentiment`: 必须是 ["positive", "negative", "neutral"] 之一
- `publishedAt`: 不能是未来时间

---

### KOLView

表示关键意见领袖（KOL）的观点和建议。

```typescript
interface KOLView {
  // 标识信息
  id: string;                 // 唯一观点 ID
  kolName: string;             // KOL 名称
  kolHandle: string;          // KOL 账号（例如 "@trader_joe"）
  platform: string;           // 平台（例如 "Twitter", "YouTube"）

  // 内容
  content: string;             // 观点内容
  type: 'recommendation' | 'analysis' | 'prediction'; // 观点类型

  // 建议详情
  recommendedTickers: string[]; // 推荐的股票代码
  action: 'buy' | 'sell' | 'hold' | 'watch'; // 推荐操作
  confidence: number;          // 信心水平（0-1）

  // 时间戳
  postedAt: Date;             // 发布日期
  scrapedAt: Date;            // 抓取时间戳
}
```

**验证规则**:
- `id`: 必须唯一
- `kolName`: 不能为空
- `platform`: 必须是 ["Twitter", "YouTube", "Weibo"] 之一
- `confidence`: 必须在 0 和 1 之间
- `postedAt`: 不能是未来时间

---

### OptionData

表示期权合约数据和分析。

```typescript
interface OptionData {
  // 标识信息
  ticker: string;              // 标的股票代码
  contractSymbol: string;       // 期权合约代码
  type: 'call' | 'put';      // 期权类型

  // 合约详情
  strikePrice: number;         // 行权价
  expirationDate: Date;        // 到期日
  daysToExpiration: number;     // 距到期天数

  // 定价
  bid: number;                // 买价
  ask: number;                // 卖价
  lastPrice: number;           // 最后成交价
  impliedVolatility: number;    // 隐含波动率（%）

  // Greeks
  greeks: {
    delta: number;             // Delta
    gamma: number;             // Gamma
    theta: number;             // Theta
    vega: number;              // Vega
    rho: number;               // Rho
  };

  // 分析
  ivr: number;                // 隐含波动率排名（0-100）
  ivRvSpread: number;         // IV - RV 价差
  maxPain: number;            // 最大痛点价格

  // 时间戳
  timestamp: Date;             // 数据时间戳
}
```

**验证规则**:
- `ticker`: 必须匹配正则表达式 `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
- `type`: 必须是 ["call", "put"] 之一
- `strikePrice`: 必须 > 0
- `impliedVolatility`: 必须在 0 和 100 之间
- `ivr`: 必须在 0 和 100 之间

---

## 2. 决策分析实体

### MarketAnalysis

表示市场分析结果，包括情感和板块分析。

```typescript
interface MarketAnalysis {
  // 标识信息
  id: string;                 // 唯一分析 ID
  timestamp: Date;             // 分析时间戳

  // 市场情感
  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;             // 情感得分（-1 到 1）
    factors: {
      news: number;           // 新闻情感贡献
      social: number;         // 社交媒体情感贡献
      technical: number;       // 技术指标贡献
    };
  };

  // 板块分析
 板块: {
    [sectorName: string]: {
      trend: 'up' | 'down' | 'sideways';
      strength: number;        // 趋势强度（0-1）
      topStocks: string[];    // 板块内表现最好的股票
    };
  };

  // 热点
  hotTopics: string[];         // 热门话题/主题
  hotStocks: string[];         // 热门股票

  // 风险评估
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];        // 识别的风险因素
}
```

**验证规则**:
- `id`: 必须唯一
- `sentiment.score`: 必须在 -1 和 1 之间
- `riskLevel`: 必须是 ["low", "medium", "high"] 之一

---

### StockAnalysis

表示个股分析结果。

```typescript
interface StockAnalysis {
  // 标识信息
  ticker: string;              // 股票代码
  id: string;                 // 唯一分析 ID
  timestamp: Date;             // 分析时间戳

  // 分析结果
  conclusion: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;          // 信心水平（0-1）

  // 评估维度
  assessment: {
    fundamental: {
      score: number;           // 基本面得分（0-1）
      keyPoints: string[];     // 关键基本面要点
    };
    technical: {
      score: number;           // 技术面得分（0-1）
      keyPoints: string[];     // 关键技术面要点
    };
    sentiment: {
      score: number;           // 情感得分（0-1）
      keyPoints: string[];     // 关键情感要点
    };
  };

  // 风险评估
  risk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];         // 风险因素
    stopLoss: number;          // 建议止损价格
  };

  // 投资建议
  recommendation: {
    action: 'buy' | 'sell' | 'hold' | 'watch';
    entryPrice: number;        // 建议入场价格
    targetPrice: number;       // 目标价格
    timeHorizon: string;       // 时间周期（例如 "1-3 months"）
    positionSize: number;      // 建议仓位大小（%）
  };

  // 理由
  rationale: string;           // 建议的详细理由
  sources: string[];          // 使用的数据源
}
```

**验证规则**:
- `ticker`: 必须匹配正则表达式 `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
- `confidence`: 必须在 0 和 1 之间
- `conclusion`: 必须是 ["buy", "sell", "hold", "watch"] 之一
- `recommendation.entryPrice`: 必须 > 0
- `recommendation.targetPrice`: 必须 > 0

---

### TradingPlan

表示具有特定操作和风险控制的交易计划。

```typescript
interface TradingPlan {
  // 标识信息
  id: string;                 // 唯一计划 ID
  timestamp: Date;             // 计划创建时间戳

  // 交易详情
  ticker: string;              // 股票代码
  action: 'buy' | 'sell' | 'day_trade'; // 操作类型

  // 执行参数
  execution: {
    orderType: 'market' | 'limit' | 'stop';
    price?: number;            // 限价/止损价格（如适用）
    quantity: number;          // 股数
    timing: 'immediate' | 'conditional'; // 执行时机
    condition?: string;         // 执行条件（如为条件执行）
  };

  // 风险控制
  riskControls: {
    stopLoss: number;          // 止损价格
    takeProfit: number;        // 止盈价格
    maxLoss: number;          // 最大损失金额
    positionSize: number;      // 仓位大小（投资组合的 %）
  };

  // 理由
  reasoning: string;           // 交易的详细理由
  analysisId: string;         // 引用 StockAnalysis
  memoryIds: string[];        // 使用的相关记忆

  // 状态
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'user_confirmed';
  statusHistory: {
    status: string;
    timestamp: Date;
    reason?: string;
  }[];
}
```

**验证规则**:
- `id`: 必须唯一
- `ticker`: 必须匹配正则表达式 `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
- `action`: 必须是 ["buy", "sell", "day_trade"] 之一
- `execution.quantity`: 必须 > 0
- `riskControls.stopLoss`: 必须 > 0
- `riskControls.takeProfit`: 必须 > 0

**状态转换**:
```
pending → approved → user_confirmed → executed
pending → rejected
pending → user_confirmed → executed (快速通道)
```

---

### RiskControl

表示交易的风险控制措施。

```typescript
interface RiskControl {
  // 标识信息
  id: string;                 // 唯一控制 ID
  tradingPlanId: string;       // 引用 TradingPlan

  // 风险参数
  stopLoss: {
    enabled: boolean;
    price: number;              // 止损价格
    type: 'fixed' | 'percentage' | 'trailing';
    trailingPercent?: number;    // 移动止损百分比（如适用）
  };

  takeProfit: {
    enabled: boolean;
    price: number;              // 止盈价格
    type: 'fixed' | 'percentage';
  };

  // 仓位管理
  positionSizing: {
    method: 'fixed' | 'percentage' | 'kelly' | 'risk_parity';
    maxPositionSize: number;     // 最大仓位大小（%）
    riskPerTrade: number;      // 每笔交易风险（%）
  };

  // 每日限额
  dailyLimits: {
    maxLoss: number;           // 最大每日损失金额
    maxTrades: number;         // 每日最大交易次数
  };
}
```

**验证规则**:
- `id`: 必须唯一
- `stopLoss.price`: 必须 > 0
- `takeProfit.price`: 必须 > 0
- `positionSizing.maxPositionSize`: 必须在 0 和 100 之间
- `positionSizing.riskPerTrade`: 必须在 0 和 100 之间

---

## 3. 交易执行实体

### TradeRecord

表示已完成或待处理的交易。

```typescript
interface TradeRecord {
  // 标识信息
  id: string;                 // 唯一交易 ID
  tradingPlanId: string;       // 引用 TradingPlan

  // 交易详情
  ticker: string;              // 股票代码
  action: 'buy' | 'sell' | 'day_trade_buy' | 'day_trade_sell';
  quantity: number;            // 股数
  price: number;              // 成交价格

  // 执行详情
  execution: {
    orderId: string;           // 券商订单 ID
    timestamp: Date;          // 执行时间戳
    status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected';
    filledQuantity: number;    // 成交数量
    averagePrice: number;      // 平均成交价
    commission: number;        // 支付的佣金
  };

  // 财务影响
  financials: {
    totalCost: number;        // 总成本（包括佣金）
    currentValue: number;     // 当前价值
    profitLoss: number;       // 盈亏
    profitLossPercent: number; // 盈亏百分比
  };

  // 元数据
  notes: string;               // 交易备注
  tags: string[];             // 交易标签
  createdAt: Date;            // 记录创建时间戳
  updatedAt: Date;            // 最后更新时间戳
}
```

**验证规则**:
- `id`: 必须唯一
- `ticker`: 必须匹配正则表达式 `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
- `quantity`: 必须 > 0
- `price`: 必须 > 0

**状态转换**:
```
pending → filled
pending → partial → filled
pending → cancelled
pending → rejected
```

---

### ReviewResult

表示交易审查和分析的结果。

```typescript
interface ReviewResult {
  // 标识信息
  id: string;                 // 唯一审查 ID
  tradeId: string;             // 引用 TradeRecord
  timestamp: Date;             // 审查时间戳

  // 评估
  evaluation: {
    success: boolean;           // 交易是否成功？
    score: number;             // 总体得分（0-1）
    grade: 'A' | 'B' | 'C' | 'D' | 'F'; // 绩效等级
  };

  // 分析
  analysis: {
    decisionQuality: {
      score: number;           // 决策质量得分（0-1）
      reasoning: string;       // 决策为何好/坏？
    };
    executionQuality: {
      score: number;           // 执行质量得分（0-1）
      reasoning: string;       // 执行情况如何？
    };
    timing: {
      score: number;           // 时机得分（0-1）
      reasoning: string;       // 时机是否恰当？
    };
  };

  // 经验教训
  lessons: {
    whatWentWell: string[];    // 做得好的地方
    whatWentWrong: string[];   // 做得不好的地方
    improvements: string[];     // 改进建议
  };

  // 记忆更新
  memoryUpdates: {
    principles: string[];      // 需要更新/添加的原则
    patterns: string[];        // 发现的模式
    lessons: string[];        // 学到的教训
  };

  // 后续操作
  followUp: {
    needsReview: boolean;      // 需要进一步审查？
    reviewDate?: Date;        // 审查日期（如适用）
    actions: string[];        // 推荐的操作
  };
}
```

**验证规则**:
- `id`: 必须唯一
- `evaluation.score`: 必须在 0 和 1 之间
- `evaluation.grade`: 必须是 ["A", "B", "C", "D", "F"] 之一

---

## 4. 长期记忆实体

### MemoryNode

表示分层记忆结构中的节点。

```typescript
interface MemoryNode {
  // 标识信息
  id: string;                 // 唯一记忆 ID
  parentId?: string;           // 父节点 ID（根节点没有父节点）
  type: 'root' | 'principle' | 'external_learning' | 'trading_review' | 'lesson';

  // 内容
  title: string;               // 记忆标题
  content: string;             // 记忆内容
  metadata: {
    [key: string]: any;       // 灵活的元数据
    weight?: number;           // 重要性权重（0-1）
    confidence?: number;        // 信心水平（0-1）
    tags?: string[];           // 用于索引的标签
  };

  // 关系
  children: string[];          // 子节点 ID
  relatedMemories: string[];   // 相关记忆 ID
  relatedTickers: string[];    // 相关股票代码

  // 时间戳
  createdAt: Date;            // 创建时间戳
  updatedAt: Date;            // 最后更新时间戳
  lastAccessed: Date;         // 最后访问时间戳（用于 LRU）

  // 访问跟踪
  accessCount: number;         // 访问次数
  effectiveness: number;      // 敏感度得分（0-1）
}
```

**验证规则**:
- `id`: 必须唯一
- `type`: 必须是 ["root", "principle", "external_learning", "trading_review", "lesson"] 之一
- `metadata.weight`: 必须在 0 和 1 之间（如果存在）
- `metadata.confidence`: 必须在 0 和 1 之间（如果存在）

---

### MemoryIndex

表示用于快速记忆检索的索引结构。

```typescript
interface MemoryIndex {
  // 关键词倒排索引
  keywordIndex: {
    [keyword: string]: Set<string>; // 关键词 → 记忆 ID
  };

  // 基于股票代码的索引
  tickerIndex: {
    [ticker: string]: Set<string>; // 股票代码 → 记忆 ID
  };

  // 基于类型的索引
  typeIndex: {
    [type: string]: Set<string>; // 类型 → 记忆 ID
  };

  // 时间索引
  temporalIndex: {
    [date: string]: Set<string>; // 日期 (YYYY-MM-DD) → 记忆 ID
  };

  // 语义嵌入（可选，用于相似性搜索）
  embeddings?: {
    [memoryId: string]: number[]; // 记忆 ID → 向量嵌入
  };

  // 索引元数据
  version: number;              // 索引版本
  lastUpdated: Date;           // 最后更新时间戳
}
```

**验证规则**:
- `version`: 必须 >= 0

---

### MemoryQuery

表示记忆检索查询。

```typescript
interface MemoryQuery {
  // 查询参数
  keywords?: string[];         // 要搜索的关键词
  tickers?: string[];          // 相关股票代码
  types?: string[];            // 要过滤的记忆类型
  dateRange?: {
    start: Date;              // 开始日期
    end: Date;                // 结束日期
  };

  // 语义搜索（可选）
  text?: string;              // 用于语义搜索的文本
  minSimilarity?: number;      // 最小相似度阈值（0-1）

  // 过滤器
  minWeight?: number;          // 最小权重阈值
  minConfidence?: number;      // 最小信心阈值
  limit?: number;             // 最大结果数

  // 排序
  sortBy?: 'relevance' | 'date' | 'weight' | 'access_count';
  sortOrder?: 'asc' | 'desc';
}
```

**验证规则**:
- `minSimilarity`: 必须在 0 和 1 之间（如果存在）
- `minWeight`: 必须在 0 和 1 之间（如果存在）
- `min`Confidence`: 必须在 0 和 1 之间（如果存在）
- `limit`: 必须 > 0（如果存在）

---

## 5. 用户实体

### UserPortfolio

表示用户当前的投资组合和持仓。

```typescript
interface UserPortfolio {
  // 标识信息
  userId: string;              // 用户 ID
  timestamp: Date;             // 投资组合快照时间戳

  // 持仓
  holdings: {
    [ticker: string]: {
      quantity: number;        // 股数
      averageCost: number;     // 平均成本基础
      currentPrice: number;    // 当前价格
      marketValue: number;     // 市值
      profitLoss: number;      // 盈亏
      profitLossPercent: number; // 盈亏百分比
    };
  };

  // 投资组合摘要
  summary: {
    totalValue: number;        // 投资组合总价值
    totalCost: number;         // 总成本基础
    totalProfitLoss: number;    // 总盈亏
    totalProfitLossPercent: number; // 总盈亏百分比
    cashBalance: number;       // 可用现金
  };

  // 风险指标
  riskMetrics: {
    portfolioBeta: number;     // 投资组合 Beta
    portfolioVolatility: number; // 投资组合波动率
    maxDrawdown: number;      // 最大回撤
    sharpeRatio: number;      // 夏普比率
  };
}
```

**验证规则**:
- `userId`: 不能为空
- `summary.totalValue`: 必须 >= 0
- `summary.cashBalance`: 必须 >= 0

---

### Watchlist

表示用户的股票观察列表。

```typescript
interface Watchlist {
  // 标识信息
  userId: string;              // 用户 ID
  timestamp: Date;             // 观察列表快照时间戳

  // 观察列表项
  items: {
    [ticker: string]: {
      addedAt: Date;          // 添加到观察列表的日期
      reason: string;         // 观察原因
      notes?: string;         // 附加备注
      alertPrice?: number;     // 提醒价格（如设置）
      alertDirection?: 'above' | 'below'; // 提醒方向
    };
  };

  // 观察列表摘要
  summary: {
    totalItems: number;        // 总项数
    categories: string[];      // 类别/原因
  };
}
```

**验证规则**:
- `userId`: 不能为空
- `summary.totalItems`: 必须 >= 0

---

### UserPreference

表示用户的投资偏好和风险承受能力。

```typescript
interface UserPreference {
  // 标识信息
  userId: string;              // 用户 ID
  timestamp: Date;             // 偏好时间戳

  // 风险承受能力
  riskTolerance: {
    level: 'conservative' | 'moderate' | 'aggressive';
    maxDrawdown: number;      // 最大可接受回撤（%）
    maxPositionSize: number;   // 最大仓位大小（%）
  };

  // 投资风格
  investmentStyle: {
    horizon: 'short' | 'medium' | 'long';
    approach: 'value' | 'growth' | 'technical' | 'balanced';
    tradingFrequency: 'low' | 'medium' | 'high';
  };

  // 收益预期
  returnExpectations: {
    targetReturn: number;      // 目标年化收益（%）
    minAcceptableReturn: number; // 最低可接受收益（%）
  };

  // 交易偏好
  tradingPreferences: {
    useStopLoss: boolean;     // 使用止损
    useTakeProfit: boolean;   // 使用止盈
    dayTradingEnabled: boolean; // 启用日内交易
    optionsTradingEnabled: boolean; // 启用期权交易
  };

  // 通知偏好
  notificationPreferences: {
    tradeAlerts: boolean;    // 交易执行提醒
    priceAlerts: boolean;    // 价格提醒
    newsAlerts: boolean;     // 新闻提醒
    reviewAlerts: boolean;   // 审查完成提醒
  };
}
```

**验证规则**:
- `userId`: 不能为空
- `riskTolerance.maxDrawdown`: 必须在 0 和 100 之间
- `riskTolerance.maxPositionSize`:必须 在 0 和 100 之间
- `returnExpectations.targetReturn`: 必须在 0 和 100 之间

---

## 6. 实体关系

### 核心关系

```
StockData (1) ── (1) TechnicalIndicator
StockData (1) ── (N) MarketNews
StockData (1) ── (N) KOLView
StockData (1) ── (N) OptionData

StockData (1) ── (N) StockAnalysis
StockAnalysis (1) ── (1) TradingPlan
TradingPlan (1) ── (1) RiskControl
TradingPlan (1) ── (N) TradeRecord
TradeRecord (1) ── (N) ReviewResult

MemoryNode (1) ── (N) MemoryNode (自引用，父子关系)
MemoryNode (N) ── (N) MemoryNode (相关记忆)
MemoryReview (1) ── (N) MemoryNode

UserPortfolio (1) ── (N) StockData (持仓)
Watchlist (1) ── (N) StockData (项)
UserPreference (1) ── (1) UserPortfolio
UserPreference (1) ── (1) Watchlist
```

### 记忆层次结构

```
MemoryNode (root)
├── MemoryNode (principle)
│   ├── "赚钱是第一优先级"
│   ├── "不做毛票"
│   └── "妖股"
├── MemoryNode (external_learning)
│   ├── "经典投资书籍"
│   ├── "股票高手博文"
│   └── "与我Discuss"
└── MemoryNode (trading_review)
    └── MemoryNode (review_entry)
        ├── analysis
        ├── decision
        ├── reanalysis
        └── review
```

---

## 7. 数据验证摘要

### 通用验证模式

1. **股票代码验证**: `^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$`
2. **百分比验证**: 必须在 0 和 100 之间
3. **得分验证**: 必须在 0 和 1 之间
4. **日期验证**: 不能是未来时间（计划/目标除外）
5. **ID 验证**: 在实体类型内必须唯一
6. **非负验证**: 必须 >= 0
7. **正数验证**: 必须 > 0

### 验证实现

```typescript
// 通用验证器
function validateEntity<T>(entity: T, rules: ValidationRules<T>): ValidationResult {
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = (entity as any)[field];
    const result = rule(value);

    if (!result.valid) {
      errors.push(`${field}: ${result.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 使用示例
const stockDataRules = {
  ticker: (value: string) => ({
    valid: /^[A-Z0-9]{1,5}(\.[A-Z]{2,3})?$/.test(value),
    message: 'Invalid ticker format'
  }),
  price: (value: number) => ({
    valid: value > 0,
    message: 'Price must be positive'
  }),
  // ... 更多规则
};
```

---

## 8. 下一步

定义数据模型后，继续进行：
1. 为 Tools 和 Skills 生成 API 合约
2. 为开发者创建快速入门指南
3. 使用新的数据结构更新 agent 上下文
