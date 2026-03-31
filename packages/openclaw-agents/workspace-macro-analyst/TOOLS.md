# Tools: Macro Analyst
## Core Skills
- analyzeMarket: 分析市场情绪、板块趋势、热门话题和系统性风险
- collect: 收集市场数据、新闻、KOL观点（与 Info Processor 共享的数据采集能力）
## Data Access
- Read access to Daily Data Storage: `~/projects/ai/financial-agent/data/info/daily/<date>/`
  - stockdata.json: 股票价格、技术指标、基本面数据
  - posts.json / twitter.json / weibo.json: KOL 社交媒体观点
  - news-<TICKER>.json: 个股新闻
## External
- stock_rich: 底层数据源（通过 collect skill 间接使用）
