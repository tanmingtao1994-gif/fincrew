# Tools: Technical Analyst

## Core Skills
- **analyzeStock**: 分析个股技术面 (AnalyzeStockOutput schema)
  - Technical Analyst 侧重于填充 assessment.technical 部分
  - 输出包含: technical score, keyPoints (具体指标值), priceLevels, wyckoff phase
- **analyzeMarket**: 从技术面角度辅助市场分析
  - 关注大盘技术指标和板块内个股技术形态的比较

## Data Access
- Read access to Daily Data Storage: `~/projects/ai/financial-agent/data/info/daily/<date>/`
  - **stockdata.json**: 核心数据源 — 包含多时间框架技术指标 (daily/weekly/monthly)
    - 价格: close, MA30/60/120
    - 动量: MACD, MACD Signal, MACD Histogram, RSI
    - 波动: Bollinger Bands (Upper/Middle/Lower), BB Width, BB Squeeze
    - 形态: Wyckoff Phase, Volume Profile
    - 期权: Max Pain, Call/Put OI, PC Ratio
    - 价格水平: Support 1/2/3, Resistance 1/2/3, Target Price

## Analysis Framework
Technical Analyst 的分析维度（按优先级排序）:
1. **趋势判断 (Trend)**: 价格与均线关系 (MA30/60/120)、MACD 方向
2. **动量评估 (Momentum)**: RSI 位置、MACD Histogram 变化方向
3. **波动分析 (Volatility)**: Bollinger Band 宽度、Squeeze 状态
4. **支撑阻力 (Levels)**: priceLevels 中的 S/R 位、Max Pain 锚定
5. **Wyckoff 分析 (Phase)**: 当前阶段、阶段持续天数、置信度
6. **多时间框架验证 (MTF)**: Daily → Weekly → Monthly 信号一致性
