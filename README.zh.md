# FinCrew

[English](./README.md) | 简体中文

A self-evolving multi-agent financial assistant powered by [OpenClaw](https://github.com/nicepkg/openclaw).

## Overview

FinCrew 是一个基于 OpenClaw 的多智能体金融助手，由 5 个专业 AI 智能体协作完成投资分析、交易决策和组合管理。它的核心特性是**自我进化记忆循环**——从每次交易中学习，持续优化决策质量。

**适用场景**：
- 个人投资者的日常市场分析和交易决策辅助
- 追踪关注的 KOL 观点并整合到投资决策中
- 基于个人投资理念和风险偏好的定制化分析
- 交易复盘和经验沉淀

## 智能体架构

```
┌─────────────────────────────────────────────────┐
│         Financial Manager (财务经理)              │
│         高级私人财富管理顾问                        │
│    协调所有智能体并做出最终决策                      │
└───────────┬──────┬──────┬──────┬────────────────┘
            │      │      │      │
     ┌──────▼──┐ ┌─▼────┐ ┌▼─────┐ ┌▼────────┐
     │  Info    │ │Macro │ │Tech  │ │Reviewer  │
     │Processor│ │Analyst│ │Analyst│ │          │
     │ 信息处理  │ │宏观分析│ │技术分析│ │ 交易复盘  │
     │         │ │       │ │      │ │          │
     │ 数据采集  │ │市场趋势│ │图表信号│ │ 经验沉淀  │
     │ 新闻整合  │ │板块轮动│ │RSI/MACD│ │ 绩效评估  │
     └─────────┘ └───────┘ └──────┘ └──────────┘
```

| 智能体 | 角色 | 职责 |
|-------|------|------|
| **Financial Manager** | 协调者 | 分派任务、综合分析、做出买入/持有/卖出决策 |
| **Info Processor** | 情报官 | 采集股票数据、新闻、KOL 观点、内部交易信息 |
| **Macro Analyst** | 宏观策略师 | 评估市场趋势、板块轮动、地缘政治风险 |
| **Technical Analyst** | 图表专家 | RSI、MACD、布林带、威科夫分析、支撑阻力位 |
| **Reviewer** | 风控审计 | 交易后复盘、经验提取、绩效辅导 |

### 评测结果

最新评测（2026-04-01）：
- **硬性评测通过率**：68%（44个用例中30个通过）
- **LLM Judge 平均评分**：4.5/5
- 覆盖44个测试场景，包括单智能体能力和多智能体协作工作流

### 自我进化记忆循环

FinCrew 的核心特性是**记忆持久化循环**——一个闭环学习系统：

```
交易复盘 → 经验提取 → 长期记忆 → 未来决策参考
书籍/文章 → 关键洞察提取 → 长期记忆 → 应用于分析
KOL 观点 → 验证并总结 → 长期记忆 → 交叉引用
```

每次复盘结论、书籍总结、KOL 洞察和讨论结果都会持久化为长期记忆，让系统随时间变得更智能。

**如何让智能体记住你的投资理念**：
1. 编辑 `~/.openclaw-dev/workspace-financial-manager/MEMORY.md`
2. 添加你的投资原则、风险偏好、决策框架
3. 智能体会在每次决策时自动参考这些记忆

## 项目结构

```
fincrew/
├── packages/
│   ├── openclaw-agents/          # 智能体定义和技能
│   │   ├── workspace-financial-manager/
│   │   ├── workspace-info-processor/
│   │   ├── workspace-macro-analyst/
│   │   ├── workspace-technical-analyst/
│   │   ├── workspace-reviewer/
│   │   ├── skills/               # 共享技能（包含 memory/）
│   │   └── templates/            # 智能体提示词模板
│   ├── eval-ui/                  # 评测结果可视化（React + Vite）
│   └── tools/                    # 数据采集工具（每个可独立调用）
│       ├── getStockData/         # 基本面 + 技术面数据
│       ├── getNews/              # 多源新闻聚合
│       ├── getKolOpinions/       # Twitter、微博、YouTube KOL 追踪
│       └── getOptions/           # 期权链分析
├── config/
│   ├── openclaw.json.sample      # OpenClaw 配置模板
│   ├── kols.json.sample          # KOL 关注列表模板
│   └── watchlist.json.sample     # 股票关注列表模板
├── data/
│   ├── info/daily/               # 每日采集的数据
│   └── memory/                   # 智能体记忆存储
├── eval/
│   ├── eval_dataset/               # 评测用例
│   │   ├── zh/                     # 中文评测用例
│   │   └── en/                     # 英文评测用例
│   ├── eval_results/               # 评测报告（gitignored）
│   └── llm_invoke_results/         # LLM 调用日志（gitignored）
└── scripts/                      # 部署和评测脚本
```

## Getting Started

### 前置要求

- Node.js >= 18
- 已安装 [OpenClaw](https://github.com/nicepkg/openclaw)

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/tanmingtao1994-gif/fincrew.git
cd fincrew
npm install
```

### 2. 配置 LLM 提供商

复制配置模板并填入你的 API 密钥：

```bash
# 创建 OpenClaw 配置目录
mkdir -p ~/.openclaw

# 复制配置模板
cp config/openclaw.json.sample ~/.openclaw/openclaw.json

# 编辑配置文件，填入你的 LLM API 信息
# 支持 OpenAI、Anthropic、Minimax 等兼容 OpenAI API 的提供商
```

配置示例（`~/.openclaw/openclaw.json`）：
```json
{
  "models": {
    "providers": {
      "minimax": {
        "baseUrl": "https://api.minimax.chat/v1",
        "apiKey": "YOUR_API_KEY_HERE",
        "models": [
          {
            "id": "Minimax-M2.5",
            "name": "Minimax-M2.5"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "minimax/Minimax-M2.5"
      }
    }
  }
}
```

### 3. 部署智能体到 OpenClaw

```bash
npm run deploy
```

部署完成后，5 个智能体会被安装到 `~/.openclaw/workspace-*` 目录。

## 个性化配置

### 配置关注的股票

编辑 `config/watchlist.json`（首次使用需从模板复制）：

```bash
cp config/watchlist.json.sample config/watchlist.json
```

添加你关注的股票：
```json
{
  "stocks": [
    { "symbol": "NVDA", "name": "NVIDIA", "sector": "半导体", "tags": ["AI芯片", "GPU"] },
    { "symbol": "TSLA", "name": "特斯拉", "sector": "汽车", "tags": ["FSD", "Robotaxi"] },
    { "symbol": "HK.09988", "name": "阿里巴巴", "sector": "互联网", "tags": ["云计算", "电商"] }
  ]
}
```

### 配置关注的 KOL

编辑 `config/kols.json`（首次使用需从模板复制）：

```bash
cp config/kols.json.sample config/kols.json
```

添加你信任的投资 KOL：
```json
{
  "kols": [
    {
      "id": "混沌与概率1997",
      "name": "混沌与概率1997",
      "platforms": {
        "weibo": { "uid": "1648195723" }
      },
      "expertise": ["宏观", "美股"],
      "reliability": 4,
      "language": "zh"
    },
    {
      "id": "your-twitter-kol",
      "name": "Your Favorite Analyst",
      "platforms": {
        "twitter": { "username": "analyst_handle" }
      },
      "expertise": ["技术分析", "加密货币"],
      "reliability": 5,
      "language": "en"
    }
  ]
}
```

**字段说明**：
- `reliability`: 1-5，可信度评分，影响观点权重
- `expertise`: 擅长领域标签，用于智能体筛选相关观点
- `platforms`: 支持 `weibo`（微博 UID）、`twitter`（用户名）

### 配置投资理念和风险偏好

通过与 Financial Manager 对话来配置你的投资理念：

```
我想配置我的投资理念。我的风险承受能力是中等偏高，单笔最大仓位不超过15%，止损线是8%。我偏好成长股，关注科技、新能源、半导体板块，持仓周期3-12个月。请帮我记录这些投资原则到长期记忆中。
```

智能体会将这些原则保存到长期记忆中，并在每次决策时自动参考。

你也可以通过对话添加更多投资原则：
- 决策框架："我的决策原则是技术面40%权重，基本面60%，重视RSI超卖信号"
- 禁忌规则："记住：RSI>70不买入，下跌趋势未确认反转前不抄底"
- 交易复盘："复盘上周NVDA交易，记录经验教训到长期记忆"

### 获取必要的 API 密钥

FinCrew 需要以下 API 密钥来采集数据。复制环境变量模板：

```bash
cp .env.example .env
```

#### 1. Twitter API（采集 Twitter KOL 观点）

使用个人 Twitter 账号的 Cookie 或 Bearer Token：

1. 登录 Twitter 网页版
2. 打开浏览器开发者工具 (F12)
3. 在 Network 标签中找到任意 API 请求
4. 复制请求头中的 `authorization: Bearer ...` 或 Cookie
5. 填入 `.env`：
   ```
   TWITTER_BEARER_TOKEN=your_bearer_token
   # 或
   TWITTER_COOKIE=your_cookie_string
   ```

**费用**：使用个人账号，免费

#### 2. 微博 API（采集微博 KOL 观点）

使用个人微博账号的 Cookie：

1. 登录微博网页版 (weibo.com)
2. 打开浏览器开发者工具 (F12)
3. 在 Application/Storage > Cookies 中找到微博的 Cookie
4. 复制完整的 Cookie 字符串
5. 填入 `.env`：
   ```
   WEIBO_COOKIE=your_cookie_string
   ```

**费用**：使用个人账号，免费

#### 3. Reddit API（可选，采集 Reddit 讨论）

**获取步骤**：
1. 访问 [Reddit Apps](https://www.reddit.com/prefs/apps)
2. 点击 "create another app"，选择 "script" 类型
3. 获取 Client ID 和 Client Secret
4. 填入 `.env`：
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=FinCrew/1.0
   ```

**费用**：免费

#### 4. Yahoo Finance API（股票数据）

**获取步骤**：
1. 访问 [RapidAPI - Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1)
2. 注册并订阅（有免费套餐）
3. 获取 API Key
4. 填入 `.env`：
   ```
   YAHOO_FINANCE_API_KEY=your_api_key
   ```

**费用**：免费套餐每月 500 次请求

**替代方案**：如果不想申请 API，可以使用 `yfinance` Python 库（无需密钥，但速率限制更严格）

## 使用 FinCrew

### 基本用法

部署完成后，通过 OpenClaw 与 Financial Manager 对话：

```bash
# 分析股票
"分析 NVDA 是否适合买入"

# 每日简报
"做今天的市场晨报，分析 AAPL、MSFT、NVDA，给出操作建议"

# 交易复盘
"复盘上周 NVDA 的交易，分析得失并记录到长期记忆"
```

### 常用场景

**1. 每日市场简报**
```
做今天的市场晨报，分析 AAPL、MSFT、NVDA，给出操作建议
```

**2. 买入分析**
```
分析 TSLA 现在是否适合买入，参考我的投资理念和历史经验
```

**3. 交易复盘**
```
复盘上周 NVDA 的交易，分析得失并记录到长期记忆
```

**4. 板块分析**
```
最近半导体板块有什么热点？帮我分析一下机会
```

**5. KOL 观点整合**
```
整合最近关于 AI 板块的 KOL 观点，给出市场情绪判断
```

### 数据采集工具

智能体会自动调用数据采集工具，你也可以手动预先采集数据：

```bash
# 采集 KOL 观点（Twitter/微博）
npm run collect -- --date 2026-03-31

# 获取股票数据（基本面 + 技术面）
npm run data -- --symbols AAPL,MSFT,NVDA

# 聚合新闻
npm run news -- --symbols AAPL

# 期权链分析
npm run options -- --symbol NVDA --expiry 2026-04-18 --direction call
```

所有数据存储在 `data/info/daily/<date>/`

## 评测系统

FinCrew 包含完整的评测框架用于测试智能体行为。

### 运行评测

```bash
# 运行所有评测用例
npm run eval

# 运行特定目录的评测
npm run eval -- workflow

# 查看评测结果（浏览器可视化）
npm run view
```

### 评测断言类型

| 断言 | 说明 |
|------|------|
| `must_call` | 智能体必须调用特定工具 |
| `must_dispatch` | FM 必须委派给特定子智能体 |
| `must_contain` | 回复必须包含特定关键词 |
| `must_write_memory` | 智能体必须将经验持久化到长期记忆 |
| `llm_judge` | 基于 LLM 的质量评估 |

## 开发指南

### 开发环境设置

如果需要修改智能体代码并快速测试，使用开发环境：

```bash
# 配置开发环境
mkdir -p ~/.openclaw-dev
cp config/openclaw.json.sample ~/.openclaw-dev/openclaw.json

# 部署到开发环境
npm run deploy:dev

# 或使用监听模式（代码改动自动重新部署）
npm run deploy:watch
```

### 修改智能体行为

1. 编辑智能体定义文件（位于 `packages/openclaw-agents/workspace-{agent-name}/`）：
   - `SOUL.md` — 核心个性、决策规则、工作流程
   - `TOOLS.md` — 可用工具及使用时机
   - `IDENTITY.md` — 角色和目标
   - `MEMORY.md` — 长期记忆（仅 Financial Manager）

2. 重新部署：
   ```bash
   npm run deploy:dev
   ```

3. 运行评测验证：
   ```bash
   npm run eval
   ```

## 常见问题

**Q: 如何让智能体记住我的投资偏好？**  
A: 通过对话让智能体记录，例如："记住我的投资理念：单笔最大仓位15%，止损线8%"

**Q: 数据采集失败怎么办？**  
A: 检查 `.env` 文件中的 API 密钥或 Cookie 是否正确配置。

**Q: 如何切换 LLM 提供商？**  
A: 编辑 `~/.openclaw/openclaw.json`，修改 `providers` 和 `agents.defaults.model.primary` 配置。

**Q: 智能体没有调用预期的工具？**  
A: 检查智能体的 `TOOLS.md` 文件，确保工具使用说明清晰。运行评测验证行为。

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.
