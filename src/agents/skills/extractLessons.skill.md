# extractLessons.skill

> 中文为主；英文专名与命令保留。

## 目标
- 从复盘结果中提炼可复用经验（principle/pattern/lesson），用于长期记忆存储。

## 输入
- reviewResult: JSON
- tradeRecord: JSON
- marketContext?: JSON（可选）

## 输出
- lessons（type/title/content/confidence/weight/relatedTickers/tags）、summary。

## 步骤（示例）
```bash
# TODO：接入经验抽取脚本
# node ./scripts/review/extract-lessons.js --review ./output/AAPL-review.json --trade ./output/AAPL-trade.json --out ./output/AAPL-lessons.json
```

## 审核
- 提交：经验条目列表与摘要；可追溯到 review/trade 证据。
