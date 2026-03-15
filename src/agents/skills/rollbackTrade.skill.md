# rollbackTrade.skill

> 中文为主；英文专名与命令保留。

## 目标
- 在执行失败或用户取消时，回滚交易并记录回滚详情。

## 输入
- tradeId: string
- reason: string

## 输出
- success、tradeId、originalTrade、rollbackDetails（timestamp/reason/actions）、warnings、errors。

## 步骤（示例）
```bash
# TODO：接入回滚脚本
# node ./scripts/exec/rollback-trade.js --trade ./output/AAPL-trade.json --reason "user_cancelled" --out ./output/AAPL-rollback.json
```

## 审核
- 提交：回滚详情；确保账户/持仓/现金状态一致。
