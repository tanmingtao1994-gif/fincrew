# Execution Tools Contract

**Version**: 1.0.0
**Status**: Draft
**Date**: 2026-03-12

## 概述

本文档定义了执行工具的 API 合约，这些工具提供了具有多层安全检查的交易执行的原子操作。

---

## Tool: validateTradeRequest

### 描述

根据业务规则和约束验证交易请求。

### 输入模式

```typescript
interface ValidateTradeRequestInput {
  tradingPlan: TradingPlan;   // 要验证的交易计划
  userPortfolio: UserPortfolio; // 当前投资组合
  userPreference: UserPreference; // 用户偏好
  dryRun?: boolean;           // 试运行模式（默认：false）
}
```

### 输出模式

```typescript
interface ValidateTradeRequestOutput {
  valid: boolean;
  checks: {
    tickerValid: boolean;
    priceValid: boolean;
    quantityValid: boolean;
    sufficientFunds: boolean;
    withinRiskLimits: boolean;
    principlesCompliant: boolean;
  };
  warnings: string[];
  errors: string[];
  estimatedCost?: number;       // 预计成本（如有效）
  estimatedImpact?: {          // 预计投资组合影响（如有效）
    newCashBalance: number;
    newPositionValue: number;
    totalValue: number;
  };
}
```

### 错误代码

- `INVALID_PLAN`: 交易计划无效
- `VALIDATION_ERROR`: 交易请求验证失败

### 示例

```typescript
const result = await validateTradeRequest({
  tradingPlan: tradingPlan,
  userPortfolio: currentPortfolio,
  userPreference: userPrefs,
  dryRun: true
});

// 输出:
// {
//   valid: true,
//   checks: {
//     tickerValid: true,
//     priceValid: true,
//     quantityValid: true,
//     sufficientFunds: true,
//     withinRiskLimits: true,
//     principlesCompliant: true
//   },
//   warnings: ['Position size is at maximum limit'],
//   errors: [],
//   estimatedCost: 8925.00,
//   estimatedImpact: {
//     newCashBalance: 41075.00,
//     newPositionValue: 8925.00,
//     totalValue: 50000.00
//   }
// }
```

---

## Tool: checkRiskLimits

### 描述

检查交易是否超出用户定义的风险限制。

### 输入模式

```typescript
interface CheckRiskLimitsInput {
  tradingPlan: TradingPlan;   // 要检查的交易计划
  userPortfolio: UserPortfolio; // 当前投资组合
  userPreference: UserPreference; // 用户偏好
}
```

### 输出模式

```typescript
interface CheckRiskLimitsOutput {
  passed: boolean;
  checks: {
    positionSizeCheck: {
      passed: boolean;
      actual: number;
      limit: number;
    };
    stopLossCheck: {
      passed: boolean;
      stopLossPercent: number;
      maxStopLossPercent: number;
    };
    dailyLossCheck: {
      passed: boolean;
      potentialLoss: number;
      dailyLimit: number;
    };
    concentrationCheck: {
      passed: boolean;
      newConcentration: number;
      maxConcentration: number;
    };
  };
  errors: string[];
}
```

### 错误代码

- `INVALID_INPUT`: 输入参数无效
- `RISK_CHECK_ERROR`: 风险限制检查失败

### 示例

```typescript
const result = await checkRiskLimits({
  tradingPlan: tradingPlan,
  userPortfolio: currentPortfolio,
  userPreference: userPrefs
});

// 输出:
// {
//   passed: true,
//   checks: {
//     positionSizeCheck: {
//       passed: true,
//       actual: 5,
//       limit: 10
//     },
//     stopLossCheck: {
//       passed: true,
//       stopLossPercent: 3.4,
//       maxStopLossPercent: 5
//     },
//     dailyLossCheck: {
//       passed: true,
//       potentialLoss: 300,
//       dailyLimit: 1000
//     },
//     concentrationCheck: {
//       passed: true,
//       newConcentration: 18,
//       maxConcentration: 25
//     }
//   },
//   errors: []
// }
```

---

## Tool: validateAgainstMemory

### 描述

根据存储在记忆中的投资原则验证交易。

### 输入模式

```typescript
interface ValidateAgainstMemoryInput {
  tradingPlan: TradingPlan;   // 要验证的交易计划
  memoryIds?: string[];        // 要检查的特定记忆（默认：所有原则）
}
```

### 输出模式

```typescript
interface ValidateAgainstMemoryOutput {
  compliant: boolean;
  principles: Array<{
    id: string;
    title: string;
    weight: number;
    satisfied: boolean;
    reason: string;
  }>;
  violations: string[];
  suggestions: string[];
}
```

### 错误代码

- `INVALID_PLAN`: 交易计划无效
- `MEMORY_ERROR`: 访问记忆失败

### 示例

```typescript
const result = await validateAgainstMemory({
  tradingPlan: tradingPlan
});

// 输出:
// {
//   compliant: true,
//   principles: [
//     {
//       id: 'princ-001',
//       title: '赚钱是第一优先级',
//       weight: 1.0,
//       satisfied: true,
//       reason: 'Trade has positive expected return'
//     },
//     {
//       id: 'princ-002',
//       title: '不做毛票',
//       weight: 0.9,
//       satisfied: true,
//       reason: 'AAPL is a quality stock'
//     }
//   ],
//   violations: [],
//   suggestions: ['Consider hedging with options']
// }
```

---

## Tool: requestUserConfirmation

### 描述

请求用户确认交易，并提供详细信息。

### 输入模式

```typescript
interface RequestUserConfirmationInput {
  tradingPlan: TradingPlan;   // 要确认的交易计划
  userPortfolio: UserPortfolio; // 当前投资组合
  riskCheckResult: CheckRiskLimitsOutput; // 风险检查结果
  memoryCheckResult: ValidateAgainstMemoryOutput; // 记忆检查结果
}
```

### 输出模式

```typescript
interface RequestUserConfirmationOutput {
  confirmed: boolean;
  confirmationId: string;      // 唯一确认 ID
  details: {
    tradeSummary: string;       // 人类可读的交易摘要
    riskSummary: string;        // 风险摘要
    impactSummary: string;       // 投资组合影响摘要
    memorySummary: string;       // 记忆/原则摘要
  };
  timestamp: Date;
}
```

### 错误代码

- `INVALID_INPUT`: 输入参数无效
- `CONFIRMATION_ERROR`: 请求确认失败

### 示例

```typescript
const result = await requestUserConfirmation({
  tradingPlan: tradingPlan,
  userPortfolio: currentPortfolio,
  riskCheckResult: riskCheck,
  memoryCheckResult: memoryCheck
});

// 输出:
// {
//   confirmed: true,
//   confirmationId: 'conf-001',
//   details: {
//     tradeSummary: 'Buy 50 shares of AAPL at $178.50',
//     riskSummary: 'Stop loss at $172.50, max loss $300',
//     impactSummary: 'Portfolio value: $50,000, cash: $41,075',
//     memorySummary: 'Complies with all investment principles'
//   },
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: executeTrade

### 描述

执行交易，具有多层安全检查和回滚能力。

### 输入模式

```typescript
interface ExecuteTradeInput {
  tradingPlan: TradingPlan;   // 要执行的交易计划
  confirmationId: string;      // 用户确认 ID
  dryRun?: boolean;           // 试运行模式（默认：false）
}
```

### 输出模式

```typescript
interface ExecuteTradeOutput {
  success: boolean;
  tradeRecord: {
    id: string;
    tradingPlanId: string;
    ticker: string;
    action: 'buy' | 'sell' | 'day_trade_buy' | 'day_trade_sell';
    quantity: number;
    price: number;
    execution: {
      orderId: string;
      timestamp: Date;
      status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected';
      filledQuantity: number;
      averagePrice: number;
      commission: number;
    };
    financials: {
      totalCost: number;
      currentValue: number;
      profitLoss: number;
      profitLossPercent: number;
    };
    createdAt: Date;
    updatedAt: Date;
  };
  rollbackAvailable: boolean;   // 是否可回滚
  warnings: string[];
  errors: string[];
}
```

### 错误代码

- `INVALID_CONFIRMATION`: 确认 ID 无效
- `VALIDATION_FAILED`: 执行前验证失败
- `EXECUTION_ERROR`: 交易执行失败
- `ROLLBACK_FAILED`: 错误后回滚失败

### 示例

```typescript
const result = await executeTrade({
  tradingPlan: tradingPlan,
  confirmationId: 'conf-001',
  dryRun: false
});

// 输出:
// {
//   success: true,
//   tradeRecord: {
//     id: 'trade-001',
//     tradingPlanId: 'trading-plan-001',
//     ticker: 'AAPL',
//     action: 'buy',
//     quantity: 50,
//     price: 178.50,
//     execution: {
//       orderId: 'ORDER-123456',
//       timestamp: new Date('2026-03-12T10:30:00Z'),
//       status: 'filled',
//       filledQuantity: 50,
//       averagePrice: 178.50,
//       commission: 4.95
//     },
//     financials: {
//       totalCost: 8929.95,
//       currentValue: 8925.00,
//       profitLoss: -4.95,
//       profitLossPercent: -0.06
//     },
//     createdAt: new Date('2026-03-12T10:30:00Z'),
//     updatedAt: new Date('2026-03-12T10:30:05Z')
//   },
//   rollbackAvailable: true,
//   warnings: [],
//   errors: []
// }
```

---

## Tool: rollbackTrade

### 描述

如果执行失败或用户请求取消，则回滚交易。

### 输入模式

```typescript
interface RollbackTradeInput {
  tradeId: string;             // 要回滚的交易 ID
  reason: string;              // 回滚原因
}
```

### 输出模式

```typescript
interface RollbackTradeOutput {
  success: boolean;
  tradeId: string;
  originalTrade: TradeRecord;   // 原始交易记录
  rollbackDetails: {
    timestamp: Date;
    reason: string;
    actions: string[];          // 回滚期间执行的操作
  };
  warnings: string[];
  errors: string[];
}
```

### 错误代码

- `INVALID_TRADE_ID`: 交易 ID 无效
- `ROLLBACK_NOT_AVAILABLE`: 此交易不可回滚
- `ROLLBACK_FAILED`: 交易回滚失败

### 示例

```typescript
const result = await rollbackTrade({
  tradeId: 'trade-001',
  reason: 'User cancelled due to market conditions'
});

// 输出:
// {
//   success: true,
//   tradeId: 'trade-001',
//   originalTrade: { /* 原始交易记录 */ },
//   rollbackDetails: {
//     timestamp: new Date('2026-03-12T10:35:00Z'),
//     reason: 'User cancelled due to market conditions',
//     actions: [
//       'Cancelled order ORDER-123456',
//       'Reversed portfolio holdings',
//       'Updated cash balance'
//     ]
//   },
//   warnings: [],
//   errors: []
// }
```

---

## 通用响应格式

### 成功响应

```typescript
{
  success: true;
  data: <ToolOutput>;
  timestamp: Date;
}
```

### 错误响应

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Date;
}
```

---

## 版本历史

| Version | Date | Changes |
|---------|-------|----------|
| 1.0.0 | 2026-03-12 | 初始版本 |
