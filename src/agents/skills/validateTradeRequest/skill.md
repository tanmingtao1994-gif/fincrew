---
name: validateTradeRequest
description: Validate a user's trade request against business rules, portfolio constraints, and risk parameters.
---

# validateTradeRequest

## 描述
根据业务规则和约束验证交易请求。

## 输入模式
```typescript
interface ValidateTradeRequestInput {
  tradingPlan: TradingPlan;   // 要验证的交易计划
  userPortfolio: UserPortfolio; // 当前投资组合
  userPreference: UserPreference; // 用户偏好
  dryRun?: boolean;           // 试运行模式（默认：false）
}
```

## 输出模式
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

## 错误代码
- `INVALID_PLAN`: 交易计划无效
- `VALIDATION_ERROR`: 交易请求验证失败
