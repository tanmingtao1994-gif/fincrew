---
name: validateAgainstMemory
description: Validate a trading plan against investment principles stored in long-term memory.
---

# validateAgainstMemory

## 描述
根据存储在记忆中的投资原则验证交易。

## 输入模式
```typescript
interface ValidateAgainstMemoryInput {
  tradingPlan: TradingPlan;   // 要验证的交易计划
  memoryIds?: string[];        // 要检查的特定记忆（默认：所有原则）
}
```

## 输出模式
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

## 错误代码
- `INVALID_PLAN`: 交易计划无效
- `MEMORY_ERROR`: 访问记忆失败
