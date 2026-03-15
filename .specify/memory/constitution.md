<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles: 新增 VI. 语言呈现规范 (Language Presentation)
- Added sections: VI. 语言呈现规范 (Language Presentation)
- Removed sections: 无
- Templates requiring updates:
  ✅ plan-template.md - 无需改动（宪章检查自动引用本文件）
  ✅ spec-template.md - 无需改动
  ✅ tasks-template.md - 无需改动
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): 如需记录历史最初通过日期的确切来源，请补充佐证说明（当前保留既有日期）
-->

# Stock Rich Agent Constitution

## Core Principles

### I. 原子化设计 (Atomicity)

**定义 Tool 与 Skill 的边界。Tool 必须是无状态的、职责单一的。**

**规则：**
- 每个 Tool 必须是无状态的（无实例变量、无全局状态）
- 每个 Tool 必须只做一件事（单一职责原则）
- Tool 专注于单一功能，不涉及复杂业务逻辑
- Skill 作为编排层，负责协调多个 Tool 的交互
- 避免在 Tool 中实现复杂的业务流程

**示例：**

✅ **正确示例：**
```typescript
// 单一职责的 Tool
async function getStockPrice(ticker: string): Promise<number> {
  return await fetch(`https://api.example.com/price/${ticker}`);
}

// 单一职责的 Tool
async function validateTicker(ticker: string): Promise<boolean> {
  return /^[A-Z]{1,5}$/.test(ticker);
}
```

❌ **错误示例：**
```typescript
// 违反单一职责原则 - 包含多个职责
async function analyzeAndTradePortfolio(portfolio: Portfolio): Promise<TradeResult> {
  const analysis = await analyzePortfolio(portfolio);  // 分析
  const decision = makeTradingDecision(analysis);       // 决策
  return executeTrade(decision);                         // 执行
}
```

**理由：** 原子化设计使 Tool 易于测试、复用和维护。复杂的业务逻辑应该在 Skill 层处理，而不是在 Tool 中。

---

### II. 接口契约 (Interface Contract)

**强制使用 TypeScript 定义输入输出（Input/Output Schema），确保 OpenClaw 在调用时有明确的 Context。**

**规则：**
- 所有 Tool 必须定义严格的输入输出类型
- 使用 TypeScript 接口或类型定义
- 明确标注必填和可选参数
- 提供清晰的类型描述和约束

**示例：**

✅ **正确示例：**
```typescript
interface StockPriceInput {
  ticker: string;        // 股票代码，必填
  date?: Date;           // 查询日期，可选，默认为当前日期
  currency?: 'USD' | 'CNY';  // 货币类型，可选
}

interface StockPriceOutput {
  price: number;
  currency: string;
  timestamp: Date;
  source: string;
}

async function getStockPrice(input: StockPriceInput): Promise<StockPriceOutput> {
  // 实现细节...
}
```

❌ **错误示例：**
```typescript
// 缺少类型定义，使用 any
async function getStockPrice(ticker: any, date?: any): Promise<any> {
  // 实现细节...
}
```

**理由：** 明确的类型定义使 AI 能够理解 Tool 的使用方式，减少调用错误，提高代码的可靠性和可维护性。

---

### III. 依赖倒置 (Dependency Inversion)

**规范 NPM 包之间的调用逻辑，严禁循环依赖。**

**规则：**
- 高层模块不应依赖低层模块，两者都应依赖抽象
- 抽象不应依赖细节，细节应依赖抽象
- 严禁循环依赖（A 依赖 B，B 依赖 A）
- 依赖关系必须单向流动

**示例：**

✅ **正确示例：**
```typescript
// 抽象接口定义
interface IStockDataProvider {
  getPrice(ticker: string): Promise<number>;
}

// 低层模块实现抽象
class YahooFinanceProvider implements IStockDataProvider {
  async getPrice(ticker: string): Promise<number> {
    return await fetchFromYahoo(ticker);
  }
}

// 高层模块依赖抽象
class StockAnalyzer {
  constructor(private provider: IStockDataProvider) {}

  async analyze(ticker: string) {
    const price = await this.provider.getPrice(ticker);
    // 分析逻辑...
  }
}
```

❌ **错误示例：**
```typescript
// 循环依赖
// package-a 依赖 package-b
import { bFunction } from 'package-b';
export function aFunction() {
  return bFunction();
}

// package-b 依赖 package-a
import { aFunction } from 'package-a';
export function bFunction() {
  return aFunction();
}
```

**理由：** 依赖倒置原则使系统更易于扩展和维护。消除循环依赖可以避免复杂的初始化问题和难以调试的错误。

---

### IV. 异常传播机制 (Exception Propagation)

**统一 Tool 报错的格式，确保 AI 能理解错误原因并尝试修复。**

**规则：**
- 定义统一的错误类型和格式
- 错误信息必须包含足够的上下文
- 区分可恢复错误和不可恢复错误
- 提供清晰的错误代码和描述

**示例：**

✅ **正确示例：**
```typescript
class ToolError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

async function getStockPrice(ticker: string): Promise<number> {
  try {
    const response = await fetch(`https://api.example.com/price/${ticker}`);
    if (!response.ok) {
      throw new ToolError(
        'API_ERROR',
        `Failed to fetch stock price for ${ticker}`,
        { ticker, status: response.status }
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ToolError) {
      throw error;  // 重新抛出已知的 ToolError
    }
    throw new ToolError(
      'UNKNOWN_ERROR',
      'Unexpected error occurred',
      { originalError: error }
    );
  }
}
```

❌ **错误示例：**
```typescript
// 错误信息不清晰，缺少上下文
async function getStockPrice(ticker: string): Promise<number> {
  const response = await fetch(`https://api.example.com/price/${ticker}`);
  if (!response.ok) {
    throw new Error('Error');  // 太模糊，AI 无法理解原因
  }
  return await response.json();
}
```

**理由：** 统一的错误格式使 AI 能够理解错误原因，并提供有意义的修复建议。清晰的错误信息也便于调试和监控。

---

### V. 文档化代码 (Documented Code)

**规定 JSDoc 的编写标准，以便 OpenClaw 能够自动提取 Tool 的元数据（Metadata）。**

**规则：**
- 每个 Tool 必须包含完整的 JSDoc 注释
- JSDoc 必须包含：描述、参数说明、返回值说明、可能抛出的错误
- 提供使用示例（特别是复杂的 Tool）
- 保持文档与代码同步更新

**示例：**

✅ **正确示例：**
```typescript
/**
 * 获取指定股票的当前价格
 *
 * @description 从 Yahoo Finance API 获取实时股票价格。支持美股和港股。
 *
 * @param {string} ticker - 股票代码，例如 "AAPL" 或 "0700.HK"
 * @param {Object} [options] - 可选参数
 * @param {string} [options.currency='USD'] - 返回价格的货币单位
 * @param {boolean} [options.includePreMarket=false] - 是否包含盘前价格
 *
 * @returns {Promise<StockPrice>} 返回股票价格信息
 * @returns {number} StockPrice.price - 股票价格
 * @returns {string} StockPrice.currency - 货币单位
 * @returns {Date} StockPrice.timestamp - 价格时间戳
 *
 * @throws {ToolError} 当股票代码无效时抛出错误（code: 'INVALID_TICKER'）
 * @throws {ToolError} 当 API 请求失败时抛出错误（code: 'API_ERROR'）
 *
 * @example
 * ```typescript
 * const price = await getStockPrice('AAPL', { currency: 'USD' });
 * console.log(`AAPL price: ${price.price} ${price.currency}`);
 * ```
 */
async function getStockPrice(
  ticker: string,
  options?: { currency?: string; includePreMarket?: boolean }
): Promise<StockPrice> {
  // 实现细节...
}
```

❌� **错误示例：**
```typescript
// 缺少 JSDoc 或 JSDoc 不完整
async function getStockPrice(ticker: string, options?: any) {
  // 实现细节...
}
```

**理由：** 完整的文档使 AI 能够自动提取 Tool 的元数据，理解 Tool 的用途和使用方式。文档也是代码可维护性的关键。

---

### VI. 语言呈现规范 (Language Presentation)

**目标：** 输出与文档以中文为主，保留必要的英文专有名词，确保可读性与专业度。

**强制规则（MUST）：**
- 文档、报表、错误信息、注释默认使用中文；专有名词（例如接口名、TypeScript 类型名、API 错误码、库名称、命令行标志、Skill/Agent 名称）保留英文。
- 代码标识符、文件名、目录名保持英文（避免混用语言导致维护成本上升）。
- 对外展示/日志如含用户原文，必须原样保留；翻译时使用括注方式保留英文关键字。
- 出现歧义时，以“中文表述 + 英文专名”并列说明为准。

**推荐规则（SHOULD）：**
- 统一术语表（Glossary）在文档根维护，新增术语须补充中英对照。
- 模板/注释中的中英混排遵循“中文句式，英文专名内联”。

**理由：** 统一语言风格有助于团队协作与审阅，保留英文专名确保与生态（API、库、规范）对齐。

---

## Technical Constraints

**技术栈要求：**
- 使用 TypeScript 严格模式（strict: true）
- 禁止使用 `any` 类型（使用 `unknown` 或具体类型）
- 启用 `noImplicitAny` 和 `strictNullChecks`
- 使用 ESLint 强制代码风格
- 所有 Tool 必须通过 TypeScript 编译检查

---

## Development Workflow

**开发流程要求：**
- 所有 Pull Request 必须通过 TypeScript 类型检查
- 所有 Pull Request 必须通过 ESLint 检查
- 所有 Pull Request 必须包含至少一人审查
- 所有 Tool 必须包含完整的 JSDoc 注释
- 所有 Tool 必须定义明确的输入输出类型
- 代码审查必须验证是否符合章程原则

---

## Governance

**章程管理：**
- 本章程是项目的最高准则，所有开发活动必须遵守
- 章程的修改需要经过正式的文档记录和团队审批
- 重大修改（原则变更）需要提供迁移计划
- 所有 Pull Request 必须验证是否符合章程要求
- 复杂性必须提供充分的理由
- 使用本章程作为开发指导

**版本控制：**
- 版本号遵循语义化版本控制（MAJOR.MINOR.PATCH）
- MAJOR：重大原则变更或删除（向后不兼容）
- MINOR：新增原则或重要扩展
- PATCH：澄清、措辞改进、非语义性调整

---

**Version**: 1.1.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-12
