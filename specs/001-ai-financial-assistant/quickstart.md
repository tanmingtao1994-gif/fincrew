# Quickstart Guide: AI Financial Assistant

**Feature**: AI个人理财助手
**Date**: 2026-03-12
**Phase**: 1 - 设计与合约

## 概述

本指南提供了 AI 个人理财助手系统的快速入门，包括设置、基本用法和常见工作流程。

---

## 前置条件

- Node.js 18+ 已安装
- npm 或 pnpm 包管理器
- TypeScript 5.x
- Git（用于版本控制）
- 访问 stock_rich npm 包（或本地开发）

---

## 安装

### 1. 克隆仓库

```bash
git clone git@code.byted.org:i18n_ecom_fe/stock-rich.git
cd stock-rich
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 3. 构建项目

```bash
npm run build
# 或
pnpm build
```

### 4. 运行测试

```bash
npm test
# 或
pnpm test
```

---

## 项目结构

```
stock_rich/                 # 现有数据收集模块
src/
├── decision/              # 决策逻辑
├── execution/             # 交易执行
├── review/                # 交易审查
├── memory/                # 长期记忆
├── tools/                 # OpenClaw 工具
└── skills/                # OpenClaw 技能
```

---

## 基本用法

### 1. 获取股票数据

```typescript
import { getStockPrice } from './src/tools/market-data-tools';

const stockData = await getStockPrice({
  ticker: 'AAPL',
  includePreMarket: true
});

console.log(`AAPL Price: $${stockData.price}`);
console.log(`Change: ${stockData.changePercent}%`);
```

### 2. 分析股票

```typescript
import { analyzeStock } from './src/tools/decision-tools';

const analysis = await analyzeStock({
  ticker: 'AAPL',
  timeframe: '1d',
  includeMemory: true
});

console.log(`Recommendation: ${analysis.recommendation.action}`);
console.log(`Confidence: ${analysis.confidence}`);
console.log(`Rationale: ${analysis.rationale}`);
```

### 3. 创建交易计划

```typescript
import { createTradingPlan } from './src/tools/decision-tools';

const tradingPlan = await createTradingPlan({
  stockAnalysis: analysis,
  userPortfolio: currentPortfolio,
.
  userPreference: userPrefs
});

console.log(`Action: ${tradingPlan.action}`);
console.log(`Quantity: ${tradingPlan.execution.quantity}`);
console.log(`Stop Loss: $${tradingPlan.riskControls.stopLoss}`);
```

### 4. 执行交易

```typescript
import {
  validateTradeRequest,
  checkRiskLimits,
  validateAgainstMemory,
  requestUserConfirmation,
  executeTrade
} from './src/tools/execution-tools';

// 多层安全检查
const validation = await validateTradeRequest({
  tradingPlan,
  userPortfolio: currentPortfolio,
  userPreference: userPrefs
});

if (!validation.valid) {
  console.error('Trade validation failed:', validation.errors);
  return;
}

const riskCheck = await checkRiskLimits({
  tradingPlan,
  userPortfolio: currentPortfolio,
  userPreference: userPrefs
});

if (!riskCheck.passed) {
  console.error('Risk check failed:', riskCheck.errors);
  return;
}

const memoryCheck = await validateAgainstMemory({
  tradingPlan
});

if (!memoryCheck.compliant) {
  console.error('Memory check failed:', memoryCheck.violations);
  return;
}

// 请求用户确认
const confirmation = await requestUserConfirmation({
  tradingPlan,
  userPortfolio: currentPortfolio,
  riskCheckResult: riskCheck,
  memoryCheckResult: memoryCheck
});

if (!confirmation.confirmed) {
  console.log('Trade cancelled by user');
  return;
}

// 执行交易
const execution = await executeTrade({
  tradingPlan,
  confirmationId: confirmation.confirmationId,
  dryRun: false  // 设置为 true 用于测试
});

if (execution.success) {
  console.log('Trade executed successfully!');
  console.log('Order ID:', execution.tradeRecord.execution.orderId);
} else {
  console.error('Trade execution failed:', execution.errors);
}
```

### 5. 存储和检索记忆

```typescript
import {
  storeMemory,
  retrieveMemory,
  updateMemoryEffectiveness
} from './src/tools/memory-tools';

// 存储新记忆
const memory = await storeMemory({
  parentId: 'root',
  type: 'principle',
  title: 'Strong earnings momentum',
  content: 'When a stock beats earnings estimates with strong guidance...',
  metadata: {
    weight: 0.85,
    confidence: 0.9,
    tags: ['earnings', 'momentum']
  },
  relatedTickers: ['AAPL', 'MSFT']
});

console.log('Memory stored with ID:', memory.id);

// 检索记忆
const results = await retrieveMemory({
  query: {
    keywords: ['earnings', 'momentum'],
    tickers: ['AAPL'],
    limit: 5
  }
});

console.log(`Found ${results.total} memories`);
results.memories.forEach(m => {
  console.log(`- ${m.node.title} (relevance: ${m.relevanceScore})`);
});

// 更新记忆敏感度
await updateMemoryEffectiveness({
  id: memory.id,
  feedback: {
    helpful: true,
    correct: true,
    confidence: 0.9
  },
  reason: 'Memory correctly predicted earnings momentum'
});
```

### 6. 审查交易

```typescript
import {
  analyzeTradeResult,
  extractLessons,
  generateReviewReport
} from './src/tools/review-tools';

// 分析交易结果
const review = await analyzeTradeResult({
  tradeId: 'trade-001',
  currentPrice: 185.50
});

console.log(`Trade Grade: ${review.evaluation.grade}`);
console.log(`Success: ${review.evaluation.success ? 'Yes' : 'No'}`);

// 提取教训
const lessons = await extractLessons({
  reviewResult: review,
  tradeRecord: tradeRecord
});

console.log(`Extracted ${lessons.summary.totalLessons} lessons`);
lessons.lessons.forEach(lesson => {
  console.log(`- ${lesson.title}: ${lesson.content}`);
});

// 生成审查报告
const report = await generateReviewReport({
  tradeId: 'trade-001',
  reviewResult: review,
  format: 'markdown'
});

console.log(report.content);
```

---

## 常见工作流程

### 工作流程 1：每日市场分析

```typescript
import { analyzeMarket } from './src/tools/decision-tools';

// 1. 分析整体市场
const marketAnalysis = await analyzeMarket({
  timeframe: '1d'
});

console.log('Market Sentiment:', marketAnalysis.sentiment.overall);
console.log('Risk Level:', marketAnalysis.riskLevel);

// 2. 检查热门股票
marketAnalysis.hotStocks.forEach(ticker => {
  console.log('Hot Stock:', ticker);
});

// 3. 审查板块
Object.entries(marketAnalysis.sectors).forEach(([sector, data]) => {
  console.log(`${sector}: ${data.trend} (strength: ${data.strength})`);
});
```

### 工作流程 2：股票分析和交易决策

```typescript
import {
  getStockPrice,
  analyzeStock,
  createTradingPlan,
  validateTradeRequest,
  executeTrade
} from './src/tools';

async function analyzeAndTrade(ticker: string) {
  // 1. 获取当前价格
  const priceData = await getStockPrice({ ticker });

  // 2. 分析股票
  const analysis = await analyzeStock({
    ticker,
    timeframe: '1d',
    includeMemory: true
  });

  // 3. 如果建议是买入/卖出，则创建交易计划
  if (['buy', 'sell'].includes(analysis.recommendation.action)) {
    const plan = await createTradingPlan({
      stockAnalysis: analysis,
      userPortfolio: currentPortfolio,
      userPreference: userPrefs
    });

    // 4. 验证和执行
    const validation = await validateTradeRequest({
      tradingPlan: plan,
      userPortfolio: currentPortfolio,
      userPreference: userPrefs
    });

    if (validation.valid) {
      const execution = await execute
Trade({
        tradingPlan: plan,
        confirmationId: 'auto-generated', // 用于自动交易
        dryRun: true  // 始终先使用试运行
      });

      if (execution.success) {
        console.log(`Trade executed: ${execution.tradeRecord.id}`);
      }
    }
  }
}

// 使用
analyzeAndTrade('AAPL');
```

### 工作流程 3：从交易中学习

```typescript
import {
  analyzeTradeResult,
  extractLessons,
  storeMemory
} from './src/tools';

async function learnFromTrade(tradeId: string) {
  // 1. 分析交易结果
  const review = await analyzeTradeResult({ tradeId });

  // 2. 提取教训
  const lessons = await extractLessons({
    reviewResult: review,
    tradeRecord: tradeRecord
  });

  // 3. 将教训存储为记忆
  for (const lesson of lessons.lessons) {
    const memory = await storeMemory({
      parentId: 'root',
      type: lesson.type,
      title: lesson.title,
      content: lesson.content,
      metadata: {
        weight: lesson.weight,
        confidence: lesson.confidence,
        tags: lesson.tags
      },
      relatedTickers: lesson.relatedTickers
    });

    console.log(`Stored memory: ${memory.id}`);
  }
}

// 使用
learnFromTrade('trade-001');
```

### 工作流程 4：记忆增强的决策

```typescript
import {
  retrieveMemory,
  analyzeStock,
  createTradingPlan
} from './src/tools';

async function makeMemoryEnhancedDecision(ticker: string) {
  // 1. 检索相关记忆
  const memories = await retrieveMemory({
    query: {
      tickers: [ticker],
      types: ['principle', 'lesson'],
      limit: 10
    }
  });

  console.log(`Found ${memories.total} relevant memories`);

  // 2. 使用记忆上下文分析股票
  const analysis = await analyzeStock({
    ticker,
    timeframe: '1d',
    includeMemory: true
  });

  // 3. 检查分析是否符合记忆
  const memoryViolations = memories.memories.filter(m => {
    // 检查分析是否违反任何记忆原则
    return !checkMemoryCompliance(m.node, analysis);
  });

  if (memoryViolations.length > 0) {
    console.warn('Analysis may violate memory principles:');
    memoryViolations.forEach(v => {
      console.warn(`- ${v.node.title}`);
    });
  }

  // 4. 创建交易计划
  const plan = await createTradingPlan({
    stockAnalysis: analysis,
    userPortfolio: currentPortfolio,
    userPreference: userPrefs,
    memoryIds: memories.memories.map(m => m.node.id)
  });

  return plan;
}

// 使用
const plan = await makeMemoryEnhancedDecision('AAPL');
```

---

## 配置

### 环境变量

在项目根目录创建 `.env` 文件：

```bash
# 交易设置
TRADING_DRY_RUN=true
TRADING_MAX_POSITION_SIZE=10
TRADING_STOP_LOSS_PERCENT=5
TRADING_DAILY_LOSS_LIMIT=1000

# 数据源
YAHOO_FINANCE_API_KEY=your_api_key
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret

# 记忆设置
MEMORY_STORAGE_PATH=./data/memory
MEMORY_MAX_CACHE_SIZE=1000
MEMORY_INDEX_REFRESH_INTERVAL=3600000
```

### 加载配置

```typescript
import { loadConfig } from './src/utils/config';

const config = loadConfig();

console.log('Dry Run:', config.trading.dryRun);
console.log('Max Position Size:', config.trading.maxPositionSize);
```

---

## 测试

### 运行单元测试

```bash
npm test
# 或
pnpm test
```

### 运行集成测试

```bash
npm run test:integration
# 或
pnpm test:integration
```

### 运行合约测试

```bash
npm run test:contract
# 或
pnpm test:contract
```

### 测试覆盖率

```bash
npm run test:coverage
# 或
pnpm test:coverage
```

---

## 错误处理

所有工具返回标准化的响应格式：

```typescript
interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Date;
}
```

### 处理错误

```typescript
const result = await getStockPrice({ ticker: 'INVALID' });

if (!result.success) {
  console.error(`Error [${result.error.code}]: ${result.error.message}`);
  if (result.error.details) {
    console.error('Details:', result.error.details);
  }
  // 适当处理错误
} else {
  // 使用 result.data
}
```

### 常见错误代码

- `INVALID_TICKER`: 股票代码格式无效
- `API_ERROR`: 从 API 获取数据失败
- `RATE_LIMIT_EXCEEDED`: API 速率限制超出
- `NO_DATA`: 无数据可用
- `VALIDATION_ERROR`: 验证失败
- `RISK_LIMIT_EXCEEDED`: 交易超出风险限制
- `PRINCIPLE_VIOLATION`: 交易违反投资原则

---

## 性能提示

1. **使用记忆缓存**：启用记忆缓存以减少冗余 API 调用
2. **批量操作**：尽可能在单个请求中获取多个股票
3. **索引优化**：定期重建记忆索引以获得最佳性能
4. **异步操作**：使用 async/await 进行非阻塞操作
5. **试运行模式**：在实时交易前始终使用试运行模式进行测试

---

## 下一步

- 阅读 [data-model.md](./data-model.md) 了解详细的实体定义
- 查看 [contracts/](./contracts/) 了解 API 规范
- 查看 [research.md](./research.md) 了解技术决策
- 探索 `src/` 目录中的源代码

---

## 支持

如有问题或疑问：
1. 查看 [文档](./)
2. 查看 [错误代码](#error-handling)
3. 查看 [测试用例](../../tests/)
4. 联系开发团队

---

**Version**: 1.0.0
**Last Updated**: 2026-03-12
