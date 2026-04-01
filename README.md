# FinCrew

English | [简体中文](./README.zh.md)

A self-evolving multi-agent financial assistant powered by [OpenClaw](https://github.com/nicepkg/openclaw).

## Overview

FinCrew is a multi-agent financial assistant built on OpenClaw, featuring 5 specialized AI agents that collaborate on investment analysis, trading decisions, and portfolio management. Its core feature is a **self-evolution memory loop** that learns from every trade to continuously improve decision quality.

**Use Cases**:
- Daily market analysis and trading decision support for individual investors
- Track and integrate KOL opinions into investment decisions
- Customized analysis based on personal investment philosophy and risk preferences
- Trade reviews and experience accumulation

## Agent Architecture

```
┌─────────────────────────────────────────────────┐
│              Financial Manager                    │
│         Senior Private Wealth Advisor             │
│    Coordinates all agents & makes final decisions │
└───────────┬──────┬──────┬──────┬────────────────┘
            │      │      │      │
     ┌──────▼──┐ ┌─▼────┐ ┌▼─────┐ ┌▼────────┐
     │  Info    │ │Macro │ │Tech  │ │Reviewer  │
     │Processor│ │Analyst│ │Analyst│ │          │
     │         │ │       │ │      │ │          │
     │ Data     │ │Market │ │Chart │ │ Trade    │
     │Collection│ │Trends │ │Signals│ │ Review   │
     └─────────┘ └───────┘ └──────┘ └──────────┘
```

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Financial Manager** | Coordinator | Dispatch tasks, synthesize analysis, make buy/hold/sell decisions |
| **Info Processor** | Intelligence Officer | Collect stock data, news, KOL opinions, insider trading info |
| **Macro Analyst** | Macro Strategist | Evaluate market trends, sector rotation, geopolitical risks |
| **Technical Analyst** | Chart Expert | RSI, MACD, Bollinger Bands, Wyckoff analysis, support/resistance |
| **Reviewer** | Risk Auditor | Post-trade review, lesson extraction, performance coaching |

### Evaluation Results

Latest evaluation (2026-04-01):
- **Test Pass Rate**: 68% (30/44 cases passed)
- **LLM Judge Average Score**: 4.5/5
- Covers 44 test scenarios including single-agent capabilities and multi-agent workflows

### Self-Evolution Memory Loop

FinCrew's core feature is a **memory persistence loop** — a closed-loop learning system:

```
Trade Review → Lesson Extraction → Long-term Memory → Future Decision Reference
Books/Articles → Key Insight Extraction → Long-term Memory → Applied in Analysis
KOL Opinions → Validate & Summarize → Long-term Memory → Cross-referenced
```

Every review conclusion, book summary, KOL insight, and discussion outcome is persisted as long-term memory, making the system smarter over time.

**How to make agents remember your investment philosophy**:
1. Edit `~/.openclaw-dev/workspace-financial-manager/MEMORY.md`
2. Add your investment principles, risk preferences, decision framework
3. Agents will automatically reference these memories in every decision

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
│   │   ├── skills/               # Shared skills (incl. memory/)
│   │   └── templates/            # Agent prompt templates
│   ├── eval-ui/                  # Eval results visualization (React + Vite)
│   └── tools/                    # Data collection tools (each independently callable)
│       ├── getStockData/         # Fundamentals + technicals
│       ├── getNews/              # Multi-source news aggregation
│       ├── getKolOpinions/       # Twitter, Weibo, YouTube KOL tracking
│       └── getOptions/           # Options chain analysis
├── config/
│   ├── openclaw.json.sample      # OpenClaw config template
│   ├── kols.json.sample          # KOL watchlist template
│   └── watchlist.json.sample     # Stock watchlist template
├── data/
│   ├── info/daily/               # Daily collected data
│   └── memory/                   # Agent memory storage
├── eval/
│   ├── eval_dataset/               # Eval test cases
│   │   ├── zh/                     # Chinese eval cases
│   │   └── en/                     # English eval cases
│   ├── eval_results/               # Eval reports (gitignored)
│   └── llm_invoke_results/         # Raw LLM logs (gitignored)
└── scripts/                      # Deploy & eval scripts
```

## Getting Started

### Prerequisites

- Node.js >= 18
- [OpenClaw](https://github.com/nicepkg/openclaw) installed

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/tanmingtao1994-gif/fincrew.git
cd fincrew
npm install
```

### 2. Configure LLM Provider

Copy the config template and fill in your API key:

```bash
# Create OpenClaw config directory
mkdir -p ~/.openclaw

# Copy config template
cp config/openclaw.json.sample ~/.openclaw/openclaw.json

# Edit the config file with your LLM API info
# Supports OpenAI, Anthropic, Minimax, and other OpenAI-compatible providers
```

Config example (`~/.openclaw/openclaw.json`):
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

### 3. Deploy Agents to OpenClaw

```bash
npm run deploy
```

After deployment, 5 agents will be installed to `~/.openclaw/workspace-*` directories.

## Personalization

### Configure Your Watchlist

Edit `config/watchlist.json` (copy from template first):

```bash
cp config/watchlist.json.sample config/watchlist.json
```

Add stocks you want to track:
```json
{
  "stocks": [
    { "symbol": "NVDA", "name": "NVIDIA", "sector": "Semiconductor", "tags": ["AI chip", "GPU"] },
    { "symbol": "TSLA", "name": "Tesla", "sector": "Auto", "tags": ["FSD", "Robotaxi"] },
    { "symbol": "HK.09988", "name": "Alibaba", "sector": "Internet", "tags": ["Cloud", "E-commerce"] }
  ]
}
```

### Configure KOLs to Follow

Edit `config/kols.json` (copy from template first):

```bash
cp config/kols.json.sample config/kols.json
```

Add investment KOLs you trust:
```json
{
  "kols": [
    {
      "id": "analyst-name",
      "name": "Market Analyst",
      "platforms": {
        "twitter": { "username": "analyst_handle" }
      },
      "expertise": ["Technical Analysis", "Crypto"],
      "reliability": 5,
      "language": "en"
    }
  ]
}
```

**Field descriptions**:
- `reliability`: 1-5, credibility score affecting opinion weight
- `expertise`: Domain tags for agent filtering
- `platforms`: Supports `weibo` (Weibo UID), `twitter` (username)

### Configure Investment Philosophy

Configure your investment philosophy through conversation with Financial Manager:

```
I want to configure my investment philosophy. My risk tolerance is moderate to high, max 15% position per stock, 8% stop loss. I prefer growth stocks in tech, clean energy, semiconductors, holding period 3-12 months. Please save these principles to long-term memory.
```

The agent will save these principles to long-term memory and automatically reference them in every decision.

You can also add more principles through conversation:
- Decision framework: "My decision principle is 40% technical weight, 60% fundamental, value RSI oversold signals"
- Taboos: "Remember: Don't buy when RSI > 70, don't catch falling knives until downtrend reversal confirmed"
- Trade review: "Review last week's NVDA trade and save lessons to long-term memory"

### Obtaining Required API Keys

FinCrew needs the following API keys for data collection. Copy the environment template:

```bash
cp .env.example .env
```

#### 1. Twitter API (for Twitter KOL opinions)

Use your personal Twitter account's Cookie or Bearer Token:

1. Login to Twitter web version
2. Open browser DevTools (F12)
3. In Network tab, find any API request
4. Copy `authorization: Bearer ...` or Cookie from request headers
5. Fill in `.env`:
   ```
   TWITTER_BEARER_TOKEN=your_bearer_token
   # or
   TWITTER_COOKIE=your_cookie_string
   ```

**Cost**: Personal account, free

#### 2. Weibo API (for Weibo KOL opinions)

Use your personal Weibo account's Cookie:

1. Login to Weibo web version (weibo.com)
2. Open browser DevTools (F12)
3. In Application/Storage > Cookies, find Weibo cookies
4. Copy the complete Cookie string
5. Fill in `.env`:
   ```
   WEIBO_COOKIE=your_cookie_string
   ```

**Cost**: Personal account, free

#### 3. Reddit API (optional, for Reddit discussions)

**Steps**:
1. Visit [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "create another app", select "script" type
3. Get Client ID and Client Secret
4. Fill in `.env`:
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=FinCrew/1.0
   ```

**Cost**: Free

#### 4. Yahoo Finance API (for stock data)

**Steps**:
1. Visit [RapidAPI - Yahoo Finance](https://rapidapi.com/apidojo/api/yahoo-finance1)
2. Register and subscribe (free tier available)
3. Get API Key
4. Fill in `.env`:
   ```
   YAHOO_FINANCE_API_KEY=your_api_key
   ```

**Cost**: Free tier includes 500 requests/month

**Alternative**: Use `yfinance` Python library (no key needed, but stricter rate limits)

## Using FinCrew

### Basic Usage

After deployment, interact with Financial Manager through OpenClaw:

```bash
# Analyze stocks
"Analyze if NVDA is a good buy"

# Daily briefing
"Generate today's market brief for AAPL, MSFT, NVDA with trading recommendations"

# Trade review
"Review last week's NVDA trade, analyze lessons and save to long-term memory"
```

### Common Scenarios

**1. Daily Market Brief**
```
Generate today's market brief for AAPL, MSFT, NVDA with trading recommendations
```

**2. Buy Analysis**
```
Analyze if TSLA is a good buy now, reference my investment philosophy and historical experience
```

**3. Trade Review**
```
Review last week's NVDA trade, analyze lessons and save to long-term memory
```

**4. Sector Analysis**
```
What are the hot topics in semiconductor sector? Analyze opportunities
```

**5. KOL Opinion Integration**
```
Integrate recent KOL opinions on AI sector and assess market sentiment
```

### Data Collection Tools

Agents automatically call data collection tools, or you can manually pre-collect data:

```bash
# Collect KOL opinions (Twitter/Weibo)
npm run collect -- --date 2026-03-31

# Get stock data (fundamentals + technicals)
npm run data -- --symbols AAPL,MSFT,NVDA

# Aggregate news
npm run news -- --symbols AAPL

# Options chain analysis
npm run options -- --symbol NVDA --expiry 2026-04-18 --direction call
```

All data stored in `data/info/daily/<date>/`

## Evaluation System

FinCrew includes a comprehensive eval framework for testing agent behavior.

### Running Evals

```bash
# Run all Chinese eval cases (default)
npm run eval
# or explicitly: npm run eval:zh

# Run English eval cases
npm run eval:en

# View eval results in browser
npm run view
```

### Assertion Types

| Assertion | Description |
|-----------|-------------|
| `must_call` | Agent must invoke specific tools |
| `must_dispatch` | FM must delegate to specific sub-agents |
| `must_contain` | Response must include specific keywords |
| `must_write_memory` | Agent must persist experience to long-term memory |
| `llm_judge` | LLM-based quality assessment |

## Development Guide

### Development Environment Setup

If you need to modify agent code and test quickly, use development environment:

```bash
# Configure development environment
mkdir -p ~/.openclaw-dev
cp config/openclaw.json.sample ~/.openclaw-dev/openclaw.json

# Deploy to development environment
npm run deploy:dev

# Or use watch mode (auto-redeploy on code changes)
npm run deploy:watch
```

### Modifying Agent Behavior

1. Edit agent definition files (in `packages/openclaw-agents/workspace-{agent-name}/`):
   - `SOUL.md` — Core personality, decision rules, workflow
   - `TOOLS.md` — Available tools and when to use them
   - `IDENTITY.md` — Role and objective
   - `MEMORY.md` — Long-term memory (Financial Manager only)

2. Redeploy:
   ```bash
   npm run deploy:dev
   ```

3. Run evals to verify:
   ```bash
   npm run eval
   ```

## FAQ

**Q: How to make agents remember my investment preferences?**  
A: Through conversation, e.g., "Remember my investment philosophy: max 15% position per stock, 8% stop loss"

**Q: Data collection fails?**  
A: Check if API keys or Cookies in `.env` file are correctly configured.

**Q: How to switch LLM providers?**  
A: Edit `~/.openclaw/openclaw.json`, modify `providers` and `agents.defaults.model.primary` config.

**Q: Agent doesn't call expected tools?**  
A: Check agent's `TOOLS.md` file to ensure tool usage instructions are clear. Run evals to verify behavior.

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.





