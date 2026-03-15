搜索股票最新消息面信息 + 内幕交易数据。

## 用法
`/news NVDA,TSM`

## 执行步骤

### 1. 代码采集（结构化数据）
```bash
npm run news -- --symbols {$ARGUMENTS 中的股票代码}
```
读取 `data/daily/{今日日期}/news-{SYMBOL}.json`，包含：
- `twitter`: Twitter $SYMBOL cashtag 搜索（需 TWITTER_API_KEY）
- `reddit`: r/stocks, r/investing, r/wallstreetbets 搜索（需 REDDIT_COOKIE）
- `googleNews`: Google News RSS 近 30 天新闻
- `yahooNews`: Yahoo Finance 相关新闻
- `insiderTrading`: 内幕交易记录 + 买卖汇总

### 2. WebSearch 补充
对每只股票用 WebSearch 补充代码采集不到的深度信息：
- `{symbol} analyst rating upgrade downgrade {当前月份} {当前年份}`（评级变动详情）
- `{symbol} earnings date {当前年份}`（确认财报日距离）

### 3. KOL 发言检查
检查 `data/daily/{今日日期}/posts.json`（如果存在），查看关注的 KOL 是否有提及该 symbol 的发言。

## 输出

对每只股票汇总：
- 近期重大新闻和事件（财报、并购、产品发布等）
- 分析师评级变动（升级/降级/目标价调整）
- 社交媒体情绪倾向（看多/看空/中性）
- 内幕交易概况（近期高管买卖方向、金额、净买入/卖出）
- 关键风险提示
