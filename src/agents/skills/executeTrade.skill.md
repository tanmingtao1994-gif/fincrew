# executeTrade.skill

> 中文为主；英文专名与命令保留。为安全起见默认 dry-run。

## 目标
- 按已确认的 TradingPlan 执行交易（优先 dry-run），产出 TradeRecord；支持失败回滚（rollback）。

## 输入
- tradingPlan: JSON
- confirmationId: string
- dryRun?: boolean（默认 true）

## 输出
- success、tradeRecord、rollbackAvailable、warnings、errors。

## 步骤（示例）
```bash
# TODO：接入执行脚本；默认 dry-run
# node ./scripts/exec/execute-trade.js --plan ./output/AAPL-plan.json --confirmation ./output/AAPL-confirmation.json --dryRun true --out ./output/AAPL-trade.json
```

## 门禁（Gates）
- 执行前必须完成 validateTradeRequest / checkRiskLimits / validateAgainstMemory / requestUserConfirmation。

## 审核
- 提交：TradeRecord 与摘要；失败需附回滚建议。
