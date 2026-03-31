# 研究文档：AI 理财助手

**功能**: AI个人理财助手
**日期**: 2026-03-12
**阶段**: 0 - 研究与技术选择

## 概述

本文档整合了实现 AI 理财助手的研究发现，重点关注决策制定、交易执行、复盘和长期记忆管理的技术选择、最佳实践和架构模式。

---

## 1. OpenClaw 框架集成

### 决策：使用 OpenClaw 的 Tool 和 Skill 模式

**理由**：
- OpenClaw 提供了原子操作（Tools）和编排（Skills）之间的清晰分离
- 完全符合章程的原子性原则
- 内置错误处理和类型安全
- 支持 AI 智能体的自然语言接口

**实现模式**：
```typescript
// Tool 层 - 原子化、无状态函数
async function getStockPrice(ticker: string): Promise<StockPrice> {
  // 单一职责：获取股票价格
}

// Skill 层 - 编排
async function analyzeTradingOpportunity(ticker: string) {
  const price = await getStockPrice(ticker);
  const fundamentals = await getFundamentals(ticker);
  const analysis = await analyzeStock({ price, fundamentals });
  return analysis;
}
```

**考虑的替代方案**：
- 直接函数调用：灵活性较差，难以测试
- 单体服务：违反单一职责原则

---

## 2. 长期记忆存储架构

### 决策：基于索引的文件系统 JSON 存储

**理由**：
- 单用户系统不需要分布式数据库
- JSON 文件提供人类可读、可版本控制的存储
- 文件系统允许轻松备份和迁移
- 内存中的索引提供快速检索（< 2秒要求）

**记忆结构**：
```json
{
  "memory": {
    "principles": {
      "赚钱是第一优先级": { "weight": 1.0, "created": "2026-03-01" },
      "不做毛票": { "weight": 0.9, "created": "2026-03-01" }
    },
    "external_learning": {
      "经典投资书籍": {
    "trading_review": {
      "2026-03-10_AAPL买入": {
        "decision": "买入AAPL",
        "result": "盈利5%",
        "lessons": ["技术面强势", "资金管理合理"]
      }
    }
  },
  "index": {
    "AAPL": ["2026-03-10_AAPL买入"],
    "盈利": ["2026-03-10_AAPL买入"]
  }
}
```

**性能优化**：
- 内存索引用于快速查找
- 记忆分支的延迟加载
- 频繁访问记忆的 LRU 缓存
- 后台索引更新

**考虑的替代方案**：
- SQLite：对单用户来说过于复杂，增加复杂性
- Redis：外部依赖，对单用户来说过于复杂
- 向量数据库：结构化树记忆不需要

---

## 3. AI 决策系统架构

### 决策：多阶段决策管道与记忆集成

**理由**：
- 分离关注点：数据收集 → 分析 → 决策 → 执行
- 每个阶段可以独立测试
- 每个阶段的记忆集成实现持续学习
- 与 stock_rich 现有的数据收集能力对齐

**决策管道**：
```
1. 数据收集（stock_rich）
   ├─ 市场数据（价格、成交量、技术指标）
   ├─ 新闻和 KOL 观点
   └─ 期权数据

2. 分析
   ├─ 市场情绪分析
   ├─ 板块趋势分析
   └─ 个股分析

3. 决策制定
   ├─ 应用记忆中的投资原则
   ├─ 风险评估
   └─ 生成交易计划

4. 执行
   ├─ 用户确认
   ├─ 执行交易
   └─ 记录交易

5. 复盘
   ├─ 监控交易结果
   ├─ 分析成功/失败
   └─ 用经验教训更新记忆
```

**最佳实践**：
- 每个决策必须可追溯到其理由
- 风险控制是不可协商的（止损、仓位管理）
- 记忆更新异步进行，不阻塞决策
- 所有交易决策都需要人工在环

**考虑的替代方案**：
- 端到端 AI 决策：风险太大，缺乏可解释性
- 基于规则的系统：过于僵化，无法适应市场变化

---

## 4. 交易执行安全机制

### 决策：多层安全检查与模拟运行模式

**理由**：
- 金融交易需要最大安全性
- 模拟运行模式允许在不使用真实资金的情况下进行测试
- 多层检查防止灾难性错误
- 所有操作的审计跟踪

**安全层**：
```typescript
// 第 1 层：预验证
function validateTradeRequest(request: TradeRequest): ValidationResult {
  // 检查代码有效性、价格范围、数量限制
}

// 第 2 层：风险控制
function checkRiskLimits(request: TradeRequest, portfolio: Portfolio): RiskCheck {
  // 检查仓位大小、止损、每日损失限制
}

// 第 3 层：记忆一致性
function validateAgainstMemory(request: TradeRequest): MemoryCheck {
  // 根据原则检查（例如，不做毛票）
}

// 第 4 层：用户确认
function requestUserConfirmation(trade: TradePlan): boolean {
  // 显示交易详情并获得明确确认
}

// 第 5 层：带回滚的执行
async function executeTradeWithRollback(trade: TradePlan): Promise<TradeResult> {
  // 执行交易，必要时能够回滚
}
```

**审计跟踪**：
- 每笔交易都记录有时间戳、用户和上下文
- 记录所有安全检查结果
- 错误交易的回滚能力
- 执行状态的实时监控

**考虑的替代方案**：
- 直接执行：风险太大，没有安全网
- 简单验证：对金融操作来说不够

---

## 5. 记忆索引和检索优化

### 决策：混合索引（语义和关键词搜索）

**理由**：
- 需要根据多个条件（代码、日期、课程类型）检索记忆
- 语义搜索有助于找到相关经验
- 关键词搜索提供精确匹配
- < 2秒检索要求需要高效索引

**索引策略**：
```typescript
interface MemoryIndex {
  // 关键词的倒排索引
  keywords: Map<string, Set<string>>; // keyword -> memory IDs

  // 相似性搜索的语义嵌入
  embeddings: Map<string, number[]>; // memory ID -> vector

  // 基于时间的索引
  timeline: Map<string, string[]>; // date -> memory IDs

  // 基于代码的索引
  tickers: Map<string, Set<string>>; // ticker -> memory IDs
}

// 检索策略
async function retrieveMemories(query: MemoryQuery): Promise<Memory[]> {
  const results = new Set<string>();

  // 关键词搜索
  if (query.keywords) {
    query.keywords.forEach(kw => {
      const ids = index.keywords.get(kw);
      ids?.forEach(id => results.add(id));
    });
  }

  // 语义搜索
  if (query.text) {
    const similar = findSimilarEmbeddings(query.text);
    similar.forEach(id => results.add(id));
  }

  // 代码过滤
  if (query.ticker) {
    const tickerIds = index.tickers.get(query.ticker);
    // 与结果求交集
  }

  return loadMemories(Array.from(results));
}
```

**性能优化**：
- 内存索引用于 < 2秒检索
- 记忆内容的延迟加载
- 记忆更新时的后台重新索引
- 缓存频繁访问的记忆

**考虑的替代方案**：
- JSON 文件上的全文搜索：太慢
- 数据库查询：对单用户系统来说过于复杂

---

## 6. stock_rich 集成模式

### 决策：npm 包与 Tool 包装器

**理由**：
- stock_rich 已经实现了数据收集和分析
- 发布为 npm 包可以实现干净的依赖管理
- Tool 包装器提供 OpenClaw 兼容接口
- 允许独立更新 stock_rich

**集成模式**：
```typescript
// stock_rich 包导出
export * from './src/analysis' as Analysis;
export * from './src/collectors' as Collectors;
export * from './src/utils' as Utils;

// 新项目中的 Tool 包装器
import { Analysis, Collectors } from 'stock_rich';

/**
 * 获取股票基本面数据
 * @description 包装 stock_rich 基本面分析
 */
async function getFundamentals(ticker: string): Promise<FundamentalData> {
  return await Analysis.fundamental.getFundamentals(ticker);
}

/**
 * 收集市场新闻
 * @description 包装 stock_rich 新闻收集器
 */
async function collectNews(ticker: string): Promise<News[]> {
  return await Collectors.news.collectNews(ticker);
}
```

**数据流**：
```
OpenClaw Skill
    ↓
Tool 包装器（TypeScript）
    ↓
stock_rich 包（npm）
    ↓
数据源（Yahoo Finance、Twitter 等）
```

**优势**：
- 关注点清晰分离
- 包边界的类型安全
- 使用模拟轻松测试
- 通过 npm 进行版本管理

**考虑的替代方案**：
- 直接代码包含：紧密耦合，难以维护
- API 调用：不必要的开销，更慢

---

## 7. 测试策略

### 决策：三层测试方法

**理由**：
- 金融系统需要高可靠性
- 不同的测试级别捕获不同类型的错误
- 集成测试确保模块协同工作
- 契约测试验证数据完整性

**测试层级**：

1. **单元测试（Tools）**
   - 隔离测试每个 Tool
   - 模拟外部依赖
   - 关键路径 100% 覆盖率
   - 示例：`test_getStockPrice.ts`

2. **集成测试（Skills）**
   - 测试 Tool 交互
   - 使用真实 stock_rich 数据
   - 验证决策管道
   - 示例：`test_tradingDecisionSkill.ts`

3. **契约测试**
   - 验证数据架构
   - 测试 API 契约
   - 验证记忆结构
   - 示例：`test_memoryContract.ts`

**测试工具**：
- Jest 用于单元和集成测试
- TypeScript 编译器用于类型检查
- ESLint 用于代码质量
- 交易执行的手动测试（模拟运行模式）

**考虑的替代方案**：
- 仅单元测试：错过集成问题
- 仅集成测试：太慢，难以调试

---

## 8. 错误处理和恢复

### 决策：结构化错误处理与重试逻辑

**理由**：
- 金融系统必须具有弹性
- 数据源可能不可靠
- 用户需要清晰的错误消息
- 系统应该从瞬态故障中恢复

**错误处理模式**：
```typescript
class FinancialError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean,
    public context?: Record<string, any>
  ) {
    super(message);
  }
}

// 瞬态故障的重试逻辑
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || !error.recoverable) {
        throw error;
      }
      await sleep(delay * (i + 1));
    }
  }
  throw new FinancialError('MAX_RETRIES', '超过最大重试次数', false);
}
```

**错误类别**：
- **瞬态错误**：网络超时、API 速率限制（可恢复）
- **数据错误**：无效代码、缺失数据（不可恢复）
- **系统错误**：内存不足、磁盘已满（不可恢复）
- **业务错误**：资金不足、超过风险限制（（不可恢复）

**考虑的替代方案**：
- 简单 try-catch：上下文不足，没有重试逻辑
- 错误时恐慌：过于激进，丢失状态

---

## 9. 配置管理

### 决策：基于环境的配置与验证

**理由**：
- 不同环境（开发、测试、生产）需要不同的设置
- API 密钥和机密必须安全
- 配置错误应该尽早捕获
- 易于在模拟运行和实时交易之间切换

**配置结构**：
```typescript
interface Config {
  // 环境
  env: 'development' | 'test' | 'production';

  // 交易设置
  trading: {
    dryRun: boolean;
    maxPositionSize: number;
    stopLossPercent: number;
    dailyLossLimit: number;
  };

  // 数据源
  dataSources: {
    yahooFinance: {
      apiKey: string;
      rateLimit: number;
    };
    twitter: {
      apiKey: string;
      rateLimit: number;
    };
  };

  // 记忆设置
  memory: {
    storagePath: string;
    maxCacheSize: number;
    indexRefreshInterval: number;
  };
}

// 启动时验证
function validateConfig(config: Config): void {
  if (config.trading.maxPositionSize <= 0) {
    throw new Error('无效的 maxPositionSize');
  }
  // ... 更多验证
}
```

**考虑的替代方案**：
- 硬编码设置：不灵活，安全风险
- 仅环境变量：无验证，难以结构化

---

## 关键决策总结

| 领域 | 决策 | 关键优势 |
|-------|----------|-------------|
| 框架 | OpenClaw（Tool/Skill 模式） | 干净的架构、类型安全 |
| 记忆存储 | 文件系统 JSON + 索引 | 简单、快速、可版本控制 |
| 决策制定 | 多阶段管道 | 可测试、可解释、记忆集成 |
| 交易安全 | 多层检查 | 最大安全性、审计跟踪 |
| 索引 | 混合（关键词 + 语义） | 快速检索、灵活查询 |
| stock_rich 集成 | npm 包 + Tool 包装器 | 干净分离、类型安全 |
| 测试 | 三层（单元/集成/契约） | 高可靠性 |
| 错误处理 | 结构化与重试 | 弹性、用户友好 |
| 配置 | 基于环境与验证 | 安全、灵活 |

---

## 下一步

研究完成后，继续进行 **阶段 1：设计与契约** 以：
1. 根据这些决策定义数据模型
2. 为 Tools 和 Skills 生成 API 契约
3. 为开发者创建快速入门指南
4. 用新技术更新智能体上下文
