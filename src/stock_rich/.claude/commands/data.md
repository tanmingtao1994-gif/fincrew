获取股票真实基本面 + 技术面数据。

## 用法
`/data NVDA,TSM,AAPL`

## 执行步骤

1. 运行以下命令获取真实数据（来自 yahoo-finance2 + technicalindicators）：
```bash
npm run data -- --symbols $ARGUMENTS
```

2. 读取输出文件 `data/daily/{今日日期}/stockdata.json`

3. 以简洁表格形式展示每只股票的关键数据：
   - 基本面：股价、PE、市值、营收、利润率、FCF/Capex、分析师目标价、做空数据、机构持股、下次财报日
   - 技术面：MA30/60/120 位置、RSI、MACD 状态、布林带位置、威科夫阶段、期权最大痛点

如果命令执行失败，检查 symbols 拼写是否正确（需要是合法的美股/港股代码）。
