# checkRiskLimits

## 描述
检查交易是否超出用户定义的风险限制。

## 输入模式
```typescript
interface CheckRiskLimitsInput {
  tradingPlan: TradingPlan;   // 要检查的交易计划
  userPortfolio: UserPortfolio; // 当前投资组合
  userPreference: UserPreference; // 用户偏好
}
```

## 输出模式
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

## 错误代码
- `INVALID_INPUT`: 输入参数无效
- `RISK_CHECK_ERROR`: 风险限制检查失败
