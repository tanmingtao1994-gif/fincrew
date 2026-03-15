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
src/agents/                 # 多智能集集合
├── skills/               # 通用技能（所有 agent 共享）
│   ├── _TEMPLATE.skill.md
│   ├── analyzeMarket.skill.md
│   ├── analyzeStock.skill.md
│   ├── analyzeTradeResult.skill.md
│   ├── checkRiskLimits.skill.md
│   ├── collect.skill.md
│   ├── createTradingPlan.skill.md
│   ├── executeTrade.skill.md
│   ├── extractLessons.skill.md
│   ├── generateReviewReport.skill.md
│   ├── requestUserConfirmation.skill.md
│   ├── rollbackTrade.skill.md
│   ├── validateAgainstMemory.skill.md
│   ├── validateRiskControls.skill.md
│   └── validateTradeRequest.skill.md
├── workspace-financial-manager     # 软链接到 ~/.openclaw/workspace-financial-manager
├── workspace-info-processor        # 软链接到 ~/.openclaw/workspace-info-processor
├── workspace-macro-analyst        # 软链接到 ~/.openclaw/workspace-macro-analyst
├── workspace-reviewer             # 软链接到 ~/.openclaw/workspace-reviewer
└── workspace-technical-analyst    # 软链接到 ~/.openclaw/workspace-technical-analyst

src/stock_rich/             # 现有数据收集模块
```

---

## OpenClaw Agent 架构

系统采用 OpenClaw 多 Agent 架构，每个 Agent 都有独立的 workspace：

### Agent 结构

- **financial-manager** - 主控 Agent，负责任务调度、分工和结果汇总
- **info-processor** - 信息处理 Agent，负责数据处理、记忆管理和用户偏好管理
- **macro-analyst** - 宏观分析 Agent，负责市场整体分析和热点识别
- **technical-analyst** - 技术分析 Agent，负责个股技术分析和投资建议
- **reviewer** - 复盘 Agent，负责交易结果复盘和经验总结

### Workspace 管理

每个 Agent 都有对应的 OpenClaw workspace，通过软链接方式管理：
- workspace-financial-manager -> ~/.openclaw/workspace-financial-manager
- workspace-info-processor -> ~/.openclaw/workspace-info-processor
- workspace-macro-analyst -> ~/.openclaw/workspace-macro-analyst
- workspace-reviewer -> ~/.openclaw/workspace-reviewer
- workspace-technical-analyst -> ~/.openclaw/workspace-technical-analyst

### Agent 规范

每个 Agent 的 OpenClaw workspace 中必须包含：
- IDENTITY.md - Agent 的身份标识
- SOUL.md - Agent 的"灵魂/定义"文档
- USER.md - Agent 对"用户"的理解
- BOOTSTRAP.md - Agent 的启动配置
- HEARTBEAT.md - Agent 的心跳检测
- TOOLS.md - Agent 可用的工具列表

---

## 基本用法

### 1. 使用 OpenClaw Agent

```bash
# 列出所有可用的 agents
openclaw agents list

# 切换到特定 agent
openclaw agents switch financial-manager

# 查看 agent 的状态
openclaw agents status
```

### 2. 调用 Skills

Skills 是所有 Agent 共享的功能模块，定义在 `src/agents/skills/` 目录中：

```typescript
// 示例：调用 collect skill
const result = await callSkill('collect', {
  ticker: 'AAPL',
  sources: ['news', 'twitter', 'youtube']
});

console.log(`Collected data for ${result.ticker}`);
```

### 3. Agent 协同工作流

```typescript
// 示例：financial-manager 协调其他 agents
async function analyzeAndTrade(ticker: string) {
  // 1. 调用 info-processor 收集数据
  const data = await callAgent('info-processor', 'collect', { ticker });
  
  // 2. 调用 macro-analyst 分析市场
  const marketAnalysis = await callAgent('macro-analyst', 'analyzeMarket', { 
    tickers: [ticker] 
  });
  
  // 3. 调用 technical-analyst 分析股票
  const stockAnalysis = await callAgent('technical-analyst', 'analyzeStock', {
    ticker,
    timeframe: '1d'
  });
  
  // 4. 生成交易计划
  const tradingPlan = await callSkill('createTradingPlan', {
    stockAnalysis,
    marketAnalysis
  });
  
  // 5. 请求用户确认
  const confirmation = await callSkill('requestUserConfirmation', {
    tradingPlan
  });
  
  // 6. 执行交易
  if (confirmation.confirmed) {
    const execution = await callSkill('executeTrade', {
      tradingPlan,
      dryRun: false
    });
    
    // 7. 调用 reviewer 复盘
    await callAgent('reviewer', 'analyzeTradeResult', {
      tradeId: execution.tradeRecord.id
    });
  }
}
```

---

## 配置

### 环境变量

在项目根目录创建 `.env` 文件：

```bash
# OpenClaw 配置
OPENCLAW_DEFAULT_AGENT=financial-manager
OPENCLAW_WORKSPACE_ROOT=~/.openclaw

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
**Last Updated**: 2026-03-15
