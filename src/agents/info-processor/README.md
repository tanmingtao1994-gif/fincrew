# Info Processor Agent（信息处理）

> 子域：soul / memory / user

## 角色与职责
- 统一管理记忆（memory）与用户画像（user）：沉淀经验、维护偏好，供其他 Agents 引用。
- 为 Manager 与分析/复盘链路提供上下文检索（<2s）。

## 能力划分
- soul：本 Agent 的目标、能力边界、调用的 Skills、依赖约束。
- memory：长期记忆条目（原则/模式/教训）与有效性反馈。
- user：用户偏好（风险承受度、风格、黑/白名单、提示词偏好等）。

## 典型交互
- 为 technical-analyst 提供与标的相关的记忆/偏好上下文。
- 接收 reviewer 的复盘输出，归档到 memory，并更新有效性。

## 提交/回收（与 Manager）
- 提交：检索摘要 + 写入变更清单 + 路径与日志
- 回收：根据 revisions_requested 指定的条目增补/修正后再提交
