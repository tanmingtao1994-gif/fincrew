# Stock Rich — 项目上下文

## 项目简介
每日 KOL 观点追踪与股票分析系统。代码负责数据采集和金融数据获取，Claude Code LLM 负责语义匹配、深度分析、战法判断和日报撰写。

## 核心文档
- `DESIGN.md` — 完整需求与设计文档（必读）
- `.claude/personal.md` — 个人操作指南（11个期权战法 + 2026宏观推演）

## 技术栈
- Node.js + TypeScript (主框架)
- yahoo-finance2 v3 (金融数据, 需 `new YahooFinance()` 实例化)
- technicalindicators (技术指标计算: SMA, BollingerBands, MACD, RSI, 威科夫, 期权最大痛点)
- rettiwt-api (Twitter 采集, API Key+Guest 模式)
- weibo.com AJAX API (微博采集, 纯 Node.js, 需 Cookie)
- youtube-transcript + fast-xml-parser (YouTube 字幕 + RSS)

## 架构原则

**代码做四件事（API 调用 + 数学计算）：**
- `npm run collect` — 采集 KOL 发言
- `npm run data` — 获取真实金融数据（基本面 + 技术面 + BB Squeeze + 威科夫）
- `npm run options` — 期权量化分析 V2（Greeks+Vanna/Charm, IVR, IV-RV, Skew, 期限结构, GEX S², MC Jump Diffusion, Squeeze/Crash检测, 宏观快照）
- `npm run news` — 消息面多源搜索 + 内幕交易（Twitter/Reddit/Google News/Yahoo Finance/Insider）

**数据复用规则：**
- `npm run data` 和 `npm run news` 自动检查当天已有数据，跳过已存在的 symbol
- /daily 和 /trade 共享 stockdata.json 和 news-*.json，避免重复抓取
- options-*.json 始终重新获取（期权数据时效性强，4h 缓存由代码层控制）

**Claude Code LLM 做所有分析（语义理解 + 判断 + 生成）：**
- 语义匹配（KOL 发言 → 自选股）
- 情绪判断
- 战法匹配（结合 personal.md 11大战法 + 全维度数据）
- 消息面搜索（npm run news 结构化数据 + WebSearch 补充）
- 日报撰写
- 期权交易综合研判（/trade skill V2：6大利润驱动源 + 11战法辅助 + 7维度交叉比对 → 交易建议）

## 每日工作流

### 第一类：KOL 日报流程
```
/daily              # 今日
/daily 2026-02-19   # 指定日期
```
自动执行 采集 → 匹配 → 分析 全流程，在 3 个关键节点暂停让用户确认/补充：
1. ⏸️ 采集完成后：展示 KOL 发言摘要，可编辑 posts.json
2. ⏸️ 匹配完成后：展示匹配到的股票，可增删调整
3. ⏸️ 日报生成后：可要求补充分析或调整结论

### 第二类：期权交易分析
```
/trade NVDA 2026-02-27 call   # 分析 NVDA 看涨期权
/trade TSM 2026-03-07 put     # 分析 TSM 看跌期权
```
完整流程：获取基本面+技术面 → 期权量化分析 V2 → 消息面搜索 → LLM 综合研判（6大利润驱动源 + 11战法辅助） → 交易建议
输出：宏观环境 + 量化仪表盘(含IV-RV/期限结构/Squeeze/Crash) + Top 3~5 推荐行权价(含MC概率) + 驱动源判定 + 战法匹配 + 最终建议

### 单独调用子 skill
```
/data NVDA,TSM      # 获取基本面+技术面真实数据 → stockdata.json
/news NVDA,TSM      # 多源消息面搜索 + 内幕交易 → news-*.json
/analyze NVDA,TSM   # 完整分析流程（数据+消息面+日报）
/trade NVDA 2026-02-27 call  # 期权交易分析
```

### 底层 npm 脚本（skill 内部调用）
```bash
npm run collect              # 采集 KOL 数据 → posts.json
npm run collect -- --platform twitter
npm run data -- --symbols NVDA,TSM   # 真实基本面+技术面 → stockdata.json
npm run news -- --symbols NVDA,TSM   # 消息面+内幕交易 → news-*.json
npm run options -- --symbol NVDA --expiry 2026-02-27 --direction call  # 期权量化 → options-*.json
```

### Skills 定义
`.claude/commands/` 目录下：
- `daily.md` — 完整交互式流程（推荐）
- `analyze.md` — 深度分析流程
- `data.md` — 获取真实金融数据
- `news.md` — 多源消息面搜索 + 内幕交易
- `trade.md` — 期权交易分析 V2（6大利润驱动源 + 11战法辅助 + 7维度交叉比对 + 量化+综合研判）

## 项目结构
```
src/
├── index.ts                 # CLI 入口（collect, data, options, news 四个命令）
├── collectors/
│   ├── twitter.ts           # rettiwt-api KOL 采集
│   ├── weibo.ts             # weibo.com AJAX API
│   ├── youtube.ts           # RSS + 字幕采集
│   └── news.ts              # 消息面多源搜索（Twitter搜索/Reddit/Google News/Yahoo News/内幕交易）
├── analysis/
│   ├── fundamental.ts       # 批量基本面获取
│   ├── technical.ts         # 技术指标 + BB Squeeze + 威科夫 + 目标价/支撑阻力位
│   └── options.ts           # 期权量化引擎 V2（Greeks+Vanna/Charm/IVR/IV-RV/Skew/期限结构/GEX S²/MC/Squeeze/Crash/宏观）
└── utils/
    ├── yahoo.ts             # yahoo-finance2 封装（限速+重试+缓存+期权链+新闻+内幕交易+宏观快照）
    ├── cache.ts             # 数据缓存
    └── date.ts              # 日期工具
```

## 重要约束
- 用户每日 token 预算 $40，每周 $160
- 每次 session 结束前必须更新本文件的进度
- 日报语言：KOL 内容保留原始语言，分析部分用中文
- 自选股约 100 只，90% 美股 + 10% 港股
- yahoo-finance2 需限速 (1.5s/请求) + 重试 + 缓存

### 环境变量
- `TWITTER_API_KEY` — Twitter 认证（base64 编码的 cookie，用于 KOL 采集 + 消息面搜索）
- `WEIBO_COOKIE` — 微博 Cookie（用于 KOL 采集）
- `REDDIT_COOKIE` — Reddit Cookie（用于消息面搜索，从浏览器复制；不设置则跳过 Reddit）

### 已知限制
- Twitter 搜索（`tweet.search`）在 Node 18 下因 jsdom 兼容问题可能失败，升级 Node >= 22 可解决
- Reddit JSON API 需要 Cookie 认证，未设置 REDDIT_COOKIE 时跳过
- Yahoo Finance 内幕交易数据来自 SEC Form 4，可能有 1-2 天延迟；如需更实时数据可后续接入 OpenInsider.com

### 文件操作规范

**创建/写入文件**：

- ✅ **优先使用** `Write` 工具 - 适用于所有文件大小
  ```typescript
  // Write 工具是 Claude Code 推荐的标准方法
  // 支持中小型文件（< 1000 行）
  // 类型安全，简单直接
  ```
- ✅ **大文件策略** - 当文件超过 1000 行时：
  - **方案 A**：分段创建多个小文件，最后合并
  - **方案 B**：使用 Write 工具创建主体，Edit 工具补充细节
  - **方案 C**：创建文件骨架，让用户补充内容
- ❌ **禁止使用** `Bash` 的 `cat`/`echo`/`printf` 创建文件
  - 原因：违反项目规范，难以维护，不利于类型检查
  - 例外：仅在 Write 工具确实无法工作时作为紧急备用

**文件操作最佳实践**：

1. **读取优先**：编辑现有文件前必须先用 `Read` 工具读取
2. **精确编辑**：使用 `Edit` 工具进行精确字符串替换
3. **路径规范**：始终使用绝对路径，避免相对路径
4. **编码安全**：确保文件使用 UTF-8 编码
5. **验证结果**：文件操作后使用 `Read` 或 `Bash ls` 验证