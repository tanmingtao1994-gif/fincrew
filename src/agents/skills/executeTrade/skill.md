# executeTrade

## 描述
执行交易，具有多层安全检查和回滚能力。

## 输入模式
```typescript
interface ExecuteTradeInput {
  tradingPlan: TradingPlan;   // 要执行的交易计划
  confirmationId: string;      // 用户确认 ID
  dryRun?: boolean;           // 试运行模式（默认：false）
}
```

## 输出模式
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

## 错误代码
- `INVALID_CONFIRMATION`: 确认 ID 无效
- `VALIDATION_FAILED`: 执行前验证失败
- `EXECUTION_ERROR`: 交易执行失败
- `ROLLBACK_FAILED`: 错误后回滚失败
