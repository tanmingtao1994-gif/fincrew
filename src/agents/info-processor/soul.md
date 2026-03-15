# soul（Info Processor）

## 目标
- 提供 memory 与 user 上下文服务：高效检索（<2s）、安全写入、版本留痕。

## 职责范围
- memory：原则/模式/教训的结构化存储与索引刷新（rebuildIndex）。
- user：偏好维护（风险、风格、黑白名单、提示词偏好）。

## 输入/输出契约（Skills 视图）
- storeMemory / retrieveMemory / rebuildIndex / updateMemoryEffectiveness。
