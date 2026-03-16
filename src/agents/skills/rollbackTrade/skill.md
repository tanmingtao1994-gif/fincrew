# rollbackTrade

## 描述
如果执行失败或用户请求取消，则回滚交易。

## 输入模式
```typescript
interface RollbackTradeInput {
  tradeId: string;             // 要回滚的交易 ID
  reason: string;              // 回滚原因
}
```

## 输出模式
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

## 错误代码
- `INVALID_TRADE_ID`: 交易 ID 无效
- `ROLLBACK_NOT_AVAILABLE`: 此交易不可回滚
- `ROLLBACK_FAILED`: 交易回滚失败
