# requestUserConfirmation.skill

> 中文为主；英文专名与命令保留。

## 目标
- 在执行交易前向用户呈现 TradingPlan 与风险/记忆检查摘要，显式收集确认（confirmed）。

## 输入
- tradingPlan: JSON
- userPortfolio: JSON
- riskCheckResult: JSON
- memoryCheckResult: JSON

## 输出
- confirmed（boolean）、confirmationId、details（tradeSummary/riskSummary/impactSummary/memorySummary）。

## 步骤（示例）
```bash
# TODO：接入交互/记录脚本
# node ./scripts/exec/request-confirmation.js --plan ./output/AAPL-plan.json --risk ./output/AAPL-risk.json --memory ./output/AAPL-memory-check.json --out ./output/AAPL-confirmation.json
```

## 门禁（Gates）
- 总结内容完整、清晰；记录 confirmationId。

## 审核
- 提交：确认结果与摘要；未确认则给出原因（如风险超限等）。
