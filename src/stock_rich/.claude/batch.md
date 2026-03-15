# 批量期权交易分析

每行一个交易，格式：`股票代码 到期日 方向`

## 当前批次（编辑下方列表）
```
AMD 2026-03-13 call
INTC 2026-03-13 call
AMZN 2026-03-13 call
TSLA 2026-03-20 call
INTC 2026-03-18 call
ORCL 2026-03-13 call
MSFT 2026-03-13 call
GOOG 2026-03-20 call
ANET 2026-03-13 call
CRDO 2026-03-13 call
CRWD 2026-03-13 call
PLTR 2026-03-20 call
APH 2026-03-20 call
ALAB 2026-03-13 call
AVGO 2026-03-13 call
FIG 2026-03-20 call
COIN 2026-03-20 call
HOOD 2026-03-20 call
APLD 2026-03-13 call
CIFR 2026-03-13 call
LMND 2026-03-20 call
INOD 2026-03-13 call
ASTS 2026-03-13 call
IREN 2026-03-13 call
LEU 2026-03-13 call
RCAT 2026-03-20 call
RDW 2026-03-20 call
RKLB 2026-03-20 call
OKLO 2026-03-20 call
OUST 2026-03-13 call
MP 2026-03-13 call
```

## 使用说明
1. 编辑上方代码块中的交易列表
2. 每行格式：`股票代码 到期日(YYYY-MM-DD) 方向(call|put)`
3. 可以添加空行和注释（以 # 开头）
4. 执行 `/batch-trade` 开始批量分析

---
使用方法：`/batch-trade`
