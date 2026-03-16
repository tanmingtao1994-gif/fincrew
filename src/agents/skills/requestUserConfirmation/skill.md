---
name: requestUserConfirmation
description: Request user confirmation for a trade, providing detailed trade, risk, and impact summaries.
---

# requestUserConfirmation

## 描述
请求用户确认交易，并提供详细信息。

## 输入模式
```typescript
interface RequestUserConfirmationInput {
  tradingPlan: TradingPlan;   // 要确认的交易计划
  userPortfolio: UserPortfolio; // 当前投资组合
  riskCheckResult: CheckRiskLimitsOutput; // 风险检查结果
  memoryCheckResult: ValidateAgainstMemoryOutput; // 记忆检查结果
}
```

## 输出模式
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

## 错误代码
- `INVALID_INPUT`: 输入参数无效
- `CONFIRMATION_ERROR`: 请求确认失败
