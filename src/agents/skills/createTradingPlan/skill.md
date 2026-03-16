# createTradingPlan

## 描述
基于股票分析和风险控制创建详细的交易计划。

## 输入模式
```typescript
interface CreateTradingPlanInput {
  stockAnalysis: StockAnalysis; // 股票分析结果
  userPortfolio: UserPortfolio; // 当前投资组合
  userPreference: UserPreference; // 用户偏好
  memoryIds?: string[];        // 要引用的相关记忆
}
```

## 输出模式
```typescript
interface CreateTradingPlanOutput {
  id: string;
  timestamp: Date;

  ticker: string;
  action: 'buy' | 'sell' | 'day_trade';

  execution: {
    orderType: 'market' | 'limit' | 'stop';
    price?: number;
    quantity: number;
    timing: 'immediate' | 'conditional';
    condition?: string;
  };

  riskControls: {
    stopLoss: number;
    takeProfit: number;
    maxLoss: number;
    positionSize: number;
  };

  reasoning: string;
  analysisId: string;
  memoryIds: string[];

  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'user_confirmed';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    reason?: string;
  }>;
}
```

## 错误代码
- `INVALID_ANALYSIS`: 股票分析无效
- `INSUFFICIENT_FUNDS`: 资金不足，无法交易
- `RISK_LIMIT_EXCEEDED`: 交易超出风险限制
- `PRINCIPLE_VIOLATION`: 交易违反投资原则
