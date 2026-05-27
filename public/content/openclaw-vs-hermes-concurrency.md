---
title: OpenClaw vs Hermes Agent 并发机制对比研究
date: 2026-05-27
tags: [OpenClaw, Hermes Agent, AI Agent, 并发, 架构设计]
---

# OpenClaw vs Hermes Agent 并发机制对比研究

---

## 两种架构，解决同一个问题

多入口并发时如何保证状态不乱？这是 AI Agent 工程化落地最核心的问题之一。OpenClaw 和 Hermes Agent 走了两条完全不同的路。

| 维度 | OpenClaw | Hermes Agent |
|------|---------|-------------|
| 并发单元 | Lane（车道） | Session Key（会话键） |
| 单元粒度 | SessionId → 独立 AsyncQueue | platform + chat_id + thread_id → 独立锁 |
| 全局并发上限 | `maxConcurrent` 参数（默认 1） | 无全局上限 |
| 并行条件 | 不同 Lane | 不同 session_key |
| 典型场景 | Claude Code 企业多用户并发 | 飞书 + 微信多平台用户 |

---

## OpenClaw：Lane 车道机制

### 核心数据结构

OpenClaw Gateway 内部维护一个车道映射表：

```typescript
laneQueue: Map<SessionId, AsyncQueue>
```

每个 `SessionId` 对应一条独立的 Lane。同一 Lane 内的所有消息串行排队，不同 Lane 之间互不干扰。

SessionId 的组成规则：

| 消息类型 | SessionId 格式 | 示例 |
|---------|--------------|------|
| 私聊 DM | `dm:<peer_id>:<agentId>` | `dm:user_123:agent_1` |
| 群组消息 | `group:<room_id>:<agentId>` | `group:room_456:agent_1` |
| 频道消息 | `channel:<channel_id>:<agentId>` | `channel:telegram:agent_1` |

### 单写入者不变量

OpenClaw 强制保证：**每个 Session 在任意时刻最多只有一个任务在运行**。这从根本上消除了同 Session 内的状态竞争。

### 并行度控制：Lane 间有限并行

两个维度的约束：

- **Lane 内部**：严格串行，同一 Session 的任务必须排队
- **全局级别**：`maxConcurrent` 控制同时运行的 Lane 数量

```
Lane A（user_1）→ [Task 1] → [Task 2] → [Task 3] → ...
Lane B（user_2）→ [Task 1] → [Task 2] →  ✓ 并行执行
Lane C（user_3）→ [Task 1] →  ✓ 并行执行
         ↑
    maxConcurrent = 3（最多同时运行 3 条 Lane）
```

默认 `maxConcurrent = 1`，意味着**所有 Session 共享一条 Lane，强制全局串行**。这是 Claude Code 企业版的安全保守策略。

### 三种队列模式

每条 Lane 支持三种排队策略：

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| `collect`（默认） | 合并多个等待中的消息为一次执行 | 高频短操作 |
| `followup` | 必须等当前任务完成后才处理下一条 | 需要严格顺序的写操作 |
| `always` | 允许任务执行中被新消息抢占 | 长任务可中断、快速响应优先 |

---

## Hermes Agent：Session Key 锁机制

### 核心锁机制

Hermes Agent 的并发控制以 `session_key` 为粒度，使用 `_running_agents` 字典实现：

```python
# gateway/run.py，line 3404
self._running_agents[_quick_key] = _AGENT_PENDING_SENTINEL
```

`_quick_key` 由 `build_session_key(source)` 生成，包含 `platform`（feishu / weixin）、`chat_id`、`thread_id`。

### 并行条件：不同 session_key 即并行

因为锁是按 `session_key` 独立的，不同平台或不同会话天然并行：

| 用户 | Platform | session_key | 锁 |
|------|----------|-------------|---|
| 飞书用户A | feishu | `feishu:chat_xxx:...` | 锁 A |
| 微信用户B | weixin | `weixin:chat_yyy:...` | 锁 B |
| 同一个飞书群两条消息 | feishu | 相同 session_key | 锁 A（排队） |

**结论**：飞书和微信两个用户可以真正并行执行——两个独立 session，互不阻塞。

### 无全局并发上限

Hermes Agent **没有 `maxConcurrent` 那样的全局并发限制**。能并行多少个 session，取决于 CPU 核心数、内存和模型 provider 的 rate limit。

### Sentinel 机制：防止竞态

在 AIAgent 实例真正创建之前有一个 asyncio await 间隙，Sentinel 机制防止在这个间隙内第二条消息绕过检查：

```python
# line 3404：立即写入 sentinel，在 await 期间锁定 session
self._running_agents[_quick_key] = _AGENT_PENDING_SENTINEL

# 异常时清理，防止 session 被永久锁死
if self._running_agents.get(_quick_key) is _AGENT_PENDING_SENTINEL:
    self._release_running_agent_state(_quick_key)
```

### AIAgent 实例缓存

每个 session 有独立的 AIAgent 实例缓存，避免每次消息都重建实例（重建会导致系统 prompt 重新构建，失去 prefix cache 优势）：

```python
self._agent_cache: "OrderedDict[str, tuple]" = OrderedDict()
self._agent_cache_lock = _threading.Lock()
```

---

## 关键差异总结

| 对比项 | OpenClaw | Hermes Agent |
|-------|---------|-------------|
| 并发单元 | Lane（按 SessionId） | session_key（按 platform+chat_id） |
| 全局并发上限 | `maxConcurrent`（默认 1） | 无硬上限 |
| 同平台多用户 | 不同 Lane → 并行 | 不同 session_key → 并行 |
| 同用户多消息 | 同 Lane → 串行（可配队列模式） | 同 session_key → 串行 |
| 队列模式 | collect / followup / always | 无此机制 |
| 预占机制 | `always` 模式支持任务抢占 | 无抢占，按序排队 |
| 源码位置 | OpenClaw 官方仓库 | `~/.hermes/hermes-agent/gateway/run.py` |

---

## 选型建议

**需要 OpenClaw Lane 机制的场景：**
- 企业版 Claude Code 部署，需要全局并发上限保护下游 API
- 需要 `followup` 模式保证写操作顺序
- 需要任务抢占（`always` 模式）让长任务可被中断

**适合 Hermes Agent 模型的场景：**
- 多平台集成（飞书 + 微信 + ...）
- 不想手动调 `maxConcurrent` 配置
- 希望最大化利用多核 CPU
- 天然支持不同平台用户并行，无需额外配置

---

## 参考资料

- OpenClaw 官方 GitHub 仓库（`src/` 目录）
- OpenClaw Lane 机制源码解读（SegmentFault 思否、腾讯云开发者社区）
- Hermes Agent 源码：`~/.hermes/hermes-agent/gateway/run.py`

*来源：综合 OpenClaw 官方源码、Helmes Agent 本地源码及历史对话调研*
