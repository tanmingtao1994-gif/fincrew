# Skill 模板（_TEMPLATE.skill.md）

> 语言规范：中文为主，英文专有名词保留。命令、文件路径与 API 名称使用英文。

## 目标（Goal）
- 简述该 Skill 的目的与适用场景。

## 输入（Input）
- 参数列表（名称、类型、必选/可选、默认值）
- 依赖前置条件（环境变量、配置文件）

## 输出（Output）
- 产物清单（文件/控制台输出/返回值）
- 校验要点（成功判定标准）

## 步骤（Steps）
- 使用 Node 调用 stock_rich 的示例：

```bash
# 示例：收集 AAPL 的基础数据（按需替换命令）
node ./stock_rich/dist/index.js collect --ticker AAPL --range 1d
# 或使用 npx
npx stock_rich collect --ticker AAPL --range 1d
```

- 如需并行：标注哪些子步骤可并行执行（[P]）。

## 错误与重试（Errors & Retry）
- 统一错误码（与 ToolError 对齐）：API_ERROR / INVALID_INPUT / RATE_LIMIT_EXCEEDED 等
- 重试策略：指数退避（1s, 2s, 4s ...，最大 N 次）
- 超时（Timeout）：为关键命令设置超时，避免阻塞

## 性能与资源（Performance）
- 限流与批量策略（batch size / rate limit）
- 大文件/大列表的分页或分片策略

## 审核（Review by Manager）
- 提交物：数据摘要/日志/产物路径
- 自检清单：输入输出契约是否满足、关键结论是否可追溯
- 失败回路：根据 Manager 的 revisions_requested 逐项修正
