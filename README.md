# FinCrew

A self-evolving multi-agent financial assistant powered by [OpenClaw](https://github.com/nicepkg/openclaw).

## Overview

FinCrew is a team of 5 specialized AI agents that collaborate to provide comprehensive financial analysis, trading decisions, and portfolio management. Built on the OpenClaw multi-agent framework, it features a self-evolution memory loop that learns from past trades and continuously improves its decision-making.

### Agent Architecture

```
┌─────────────────────────────────────────────────┐
│              Financial Manager (FM)               │
│         Senior Private Wealth Manager             │
│    Orchestrates all agents & final decisions       │
└───────────┬──────┬──────┬──────┬────────────────┘
            │      │      │      │
     ┌──────▼──┐ ┌─▼────┐ ┌▼─────┐ ┌▼────────┐
     │  Info    │ │Macro │ │Tech  │ │Reviewer  │
     │Processor│ │Analyst│ │Analyst│ │          │
     │         │ │       │ │      │ │          │
     │ Data &  │ │Market │ │Chart │ │ Trade    │
     │ News    │ │Trends │ │Signals│ │ Review   │
     └─────────┘ └───────┘ └──────┘ └──────────┘
```

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Financial Manager** | Orchestrator | Dispatches tasks, synthesizes analysis, makes final buy/hold/sell decisions |
| **Info Processor** | Intelligence Officer | Collects stock data, news, KOL opinions, and insider trading info |
| **Macro Analyst** | Global Strategist | Evaluates market trends, sector rotation, geopolitical risks |
| **Technical Analyst** | Chart Expert | RSI, MACD, Bollinger Bands, Wyckoff analysis, support/resistance |
| **Reviewer** | Risk Auditor | Post-trade review, lesson extraction, performance coaching |

### Self-Evolution Memory Loop

FinCrew's distinguishing feature is its **memory persistence loop** — a closed-loop learning system:

```
Trade Review → Lesson Extraction → Long-term Memory → Future Decision Reference
Book/Article → Key Insight Extraction → Long-term Memory → Applied in Analysis
KOL Opinion → Validate & Summarize → Long-term Memory → Cross-referenced
```

Every review conclusion, book summary, KOL insight, and discussion outcome is persisted as long-term memory, making the system smarter over time.

## Project Structure

```
fincrew/
├── packages/
│   ├── openclaw-agents/          # Agent definitions & skills
│   │   ├── workspace-financial-manager/
│   │   ├── workspace-info-processor/
│   │   ├── workspace-macro-analyst/
│   │   ├── workspace-technical-analyst/
│   │   ├── workspace-reviewer/
│   │   ├── skills/               # Shared agent skills (incl. memory/)
│   │   └── templates/            # Agent prompt templates
│   ├── eval-ui/                  # Eval results visualization (React + Vite)
│   │   ├── eval-view.ts          # Eval data aggregation server
│   │   └── src/                  # React components & pages
│   └── tools/                    # Data collection & analysis tools (each independently callable)
│       ├── getStockData/         # Fundamental & technical data
│       │   ├── cli.ts            # Independent CLI entry
│       │   ├── fundamental.ts
│       │   └── technical.ts
│       ├── getNews/              # Multi-source news aggregation
│       │   ├── cli.ts            # Independent CLI entry
│       │   └── news.ts
│       ├── getKolOpinions/       # Twitter, Weibo, YouTube KOL tracking
│       │   ├── cli.ts            # Independent CLI entry
│       │   ├── twitter.ts
│       │   ├── weibo.ts
│       │   └── youtube.ts
│       ├── getOptions/           # Options chain analysis
│       │   ├── cli.ts            # Independent CLI entry
│       │   └── options.ts
│       ├── shared/               # Shared utilities (Yahoo Finance, caching, date)
│       └── index.ts              # Backward-compatible dispatcher
├── data/
│   ├── info/                     # All tool outputs
│   │   ├── daily/                # Per-date collected data (stockdata, news, posts, options)
│   │   └── cache/                # API response caches (fundamentals, OHLCV, options-chain)
│   └── memory/                   # Agent memory storage
├── scripts/
│   ├── deploy.sh                 # Unified deploy (--env dev|prod)
│   ├── deploy-watch.sh           # Watch mode for development
│   ├── eval-utils.ts             # Shared eval utilities
│   ├── eval-runner.ts            # Eval case executor
│   ├── eval-compare.ts           # Eval result assertion engine
│   ├── eval.sh                   # Eval pipeline entry point
│   ├── update-agents-doc.ts      # Auto-generate AGENTS.md from agent dirs
│   └── prompt/
│       └── llm-judge.md          # LLM judge prompt template
├── config/
│   ├── openclaw.json             # OpenClaw configuration template
│   ├── kols.json                 # KOL watchlist
│   └── watchlist.json            # Stock watchlist
├── tests/
│   ├── eval_dataset/             # Eval test cases
│   │   ├── single_agent/         # Per-agent capability tests
│   │   ├── workflow/             # Multi-agent orchestration tests
│   │   └── workflow_subset/      # Subset for quick iteration
│   ├── eval_results/             # Generated eval reports (gitignored)
│   └── llm_invoke_results/       # Raw LLM invocation logs (gitignored)
├── eval.config.json              # Eval runner configuration
├── .env.example                  # Environment variables template
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [OpenClaw CLI](https://github.com/nicepkg/openclaw) installed globally
- An LLM provider API key (see `config/openclaw.json`)

### Installation

```bash
git clone https://github.com/user/fincrew.git
cd fincrew
npm install
```

### Configuration

1. **LLM Provider**: Copy and edit the OpenClaw config:
   ```bash
   cp config/openclaw.json ~/.openclaw-dev/openclaw.json
   # Edit ~/.openclaw-dev/openclaw.json — fill in your API key and base URL
   ```

2. **Environment Variables**: Copy and edit `.env`:
   ```bash
   cp .env.example .env
   # Fill in TWITTER_API_KEY, YAHOO_FINANCE_API_KEY, etc.
   ```

3. **Deploy Agents**:
   ```bash
   # One-time deploy to development environment
   npm run deploy:dev
   
   # Or watch mode (auto-redeploy on file changes)
   npm run deploy:watch
   ```

## Usage

### Running the Financial Manager

```bash
# Development mode (uses ~/.openclaw-dev)
openclaw --dev agent --agent financial-manager --message "Analyze AAPL for a potential buy"

# Production mode (uses ~/.openclaw)
openclaw agent --agent financial-manager --message "Generate today's market briefing for AAPL, MSFT, NVDA"
```

### Example Prompts

| Scenario | Prompt |
|----------|--------|
| Daily Briefing | `"做今天的市场晨报，拉取 AAPL、MSFT、NVDA 的数据，分析消息面，给出操作建议"` |
| Trade Review | `"复盘上周 NVDA 的交易，分析问题并记录经验教训到长期记忆"` |
| Buy Analysis | `"分析 TSLA 是否适合现在买入，参考之前沉淀的经验教训"` |
| Sector Analysis | `"最近半导体板块有什么热点？帮我分析一下"` |

### Data Collection Tools

Each tool can be called independently or via `npm run`:

```bash
# Collect KOL opinions from Twitter/Weibo/YouTube
npm run collect -- --date 2026-03-31
# or directly: npx tsx packages/tools/getKolOpinions/cli.ts --date 2026-03-31

# Fetch stock data (fundamentals + technicals)
npm run data -- --symbols AAPL,MSFT,NVDA
# or directly: npx tsx packages/tools/getStockData/cli.ts --symbols AAPL,MSFT,NVDA

# Aggregate news from multiple sources
npm run news -- --symbols AAPL
# or directly: npx tsx packages/tools/getNews/cli.ts --symbols AAPL

# Options chain analysis
npm run options -- --symbol NVDA --expiry 2026-04-18 --direction call
# or directly: npx tsx packages/tools/getOptions/cli.ts --symbol NVDA --expiry 2026-04-18 --direction call
```

All tool outputs are stored under `data/info/daily/<date>/`.

## Evaluation

FinCrew includes a comprehensive eval framework for testing agent behavior.

### Eval Configuration

Edit `eval.config.json` to switch between CLI backends:

```json
{
  "runner": {
    "command": "openclaw",   // or "coco" for coco CLI
    "mode": "dev"            // "dev" adds --dev flag, "prod" for production
  }
}
```

### Running Evals

```bash
# Run all eval cases
npm run eval

# Run a specific eval directory
npm run eval -- workflow

# Run eval steps separately
npm run eval:run -- --dir workflow --timestamp 2026-03-31-14-00-00
npm run eval:compare -- --timestamp 2026-03-31-14-00-00

# View eval results in browser
npm run view
```

### Eval Dataset Structure

```
tests/eval_dataset/
├── single_agent/               # Test individual agent capabilities
│   ├── info_processor.json
│   ├── macro_analyst.json
│   ├── technical_analyst.json
│   └── reviewer.json
└── workflow/                   # Test multi-agent orchestration
    └── financial_manager.json  # 26 cases covering 7 scenario dimensions
```

### Assertion Types

| Assertion | Description |
|-----------|-------------|
| `must_call` | Agent must invoke specific tools |
| `must_dispatch` | FM must delegate to specific sub-agents |
| `must_contain` | Response must include specific keywords |
| `must_reject` | Agent must refuse invalid requests |
| `must_write_memory` | Agent must persist experience to long-term memory |
| `must_read_memory` | Agent must reference historical experience |
| `llm_judge` | LLM-based quality assessment with custom criteria |

## Development

### Agent Development Workflow

1. **Edit agent definitions** in `packages/openclaw-agents/workspace-{agent-name}/`
   - `SOUL.md` — Core personality, decision rules, workflow
   - `TOOLS.md` — Available tools and when to use them
   - `IDENTITY.md` — Role and objective
   - `MEMORY.md` — Long-term memory (Financial Manager only)

2. **Deploy changes**:
   ```bash
   npm run deploy:dev    # one-time
   npm run deploy:watch  # continuous
   ```

3. **Test interactively**:
   ```bash
   openclaw --dev agent --agent financial-manager --message "your test prompt"
   ```

4. **Run evals** to validate changes:
   ```bash
   npm run eval -- workflow
   ```

5. **Review results** in the eval UI:
   ```bash
   npm run view
   ```

### Adding a New Eval Case

Add to the appropriate JSON file in `tests/eval_dataset/`:

```json
{
  "test_id": "fm_workflow_my_new_case",
  "agent_target": "workspace-financial-manager",
  "input_prompt": "Your test prompt here",
  "expected_behavior": {
    "must_dispatch": ["workspace-info-processor", "workspace-macro-analyst"],
    "must_contain": ["keyword1", "keyword2"],
    "must_write_memory": true,
    "llm_judge": {
      "criteria": "Evaluate whether the response provides actionable advice",
      "pass_threshold": 7
    }
  }
}
```

## Deployment

```bash
# Development (recommended for testing)
npm run deploy:dev

# Production (with confirmation prompt)
npm run deploy:prod
```

Both commands use a unified `scripts/deploy.sh` under the hood:
1. Sync agent definitions to `~/.openclaw-dev` (or `~/.openclaw`)
2. Deploy shared skills and templates
3. Copy `openclaw.json` config (first-time only, won't overwrite existing)

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.
