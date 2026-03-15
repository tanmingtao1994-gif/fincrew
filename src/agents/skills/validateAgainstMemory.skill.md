# validateAgainstMemory.skill

> 中文为主；英文专名与命令保留。

## 目标
- 将 TradingPlan 与记忆（principles/lessons/patterns）进行一致性比对，识别潜在违背项并给出建议。

## 输入
- tradingPlan: JSON
- memoryIds?: string[]（可选，限定校验范围）

## 输出
- compliant（boolean）、principles（id/title/weight/satisfied/reason）、violations、suggestions。

## 步骤（示例）
```bash
# TODO：接入记忆一致性校验脚本
# node ./scripts/memory/validate-against-memory.js --plan ./output/AAPL-plan.json --memory ./memory/index.json --out ./output/AAPL-memory-check.json
```

## 门禁（Gates）
- 明确列出触发的原则与理由；建议可操作。

## 审核
- 提交：一致性检查摘要 + 产物路径。
- 回收：按 Manager 建议调整后复核。
