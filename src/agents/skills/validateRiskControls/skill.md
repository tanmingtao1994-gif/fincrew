# validateRiskControls

## 描述
根据用户偏好和投资组合约束验证风险控制措施。

## 输入模式
```typescript
interface ValidateRiskControlsInput {
  ticker: string;
  action: 'buy' | 'sell' | 'day_trade';
  proposedQuantity: number;
  proposedPrice: number;
  userPortfolio: UserPortfolio;
  userPreference: UserPreference;
}
```

## 输出模式
```typescript
interface ValidateRiskControlsOutput {
  valid: boolean;
  riskControls: {
    stopLoss: number;
    takeProfit: number;
    maxLoss: number;
    positionSize: number;
  };
  warnings: string[];
  errors: string[];
}
```

## 错误代码
- `INVALID_INPUT`: 输入参数无效
- `VALIDATION_ERROR`: 风险控制验证失败
