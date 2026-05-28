# 虾米并发测试复盘：约束、瓶颈与解题思路

2026-05-28

---

今天花了大半天对虾米（OpenClaw Gateway）做了一次完整的并发压测，从 3 并发一路压到 20 并发，拿到了真实数据和日志。这篇把这个过程整理一下，重点说清楚我们发现了什么约束、遇到了什么问题、以及可能的解决方向。

**背景：** 虾米跑在 OpenClaw Gateway，对外暴露 Chat Completions API。我的任务是测试它的并发承载能力，找出瓶颈在哪里。

---

## 测试过程回顾

### 测试设计

测试脚本用 Python `aiohttp` 实现，发送同一个 payload：

```
请执行 github-trending skill，查看 GitHub 今日热榜前10。
```

这是一个**中等复杂度的 Skill 执行任务**，不像简单问答（几秒返回），也不像复杂代码生成（几分钟），典型耗时在 **20-100 秒**之间。这个长度刚好能压出并发问题。

### 测试结果总览

| 并发数 | 成功率 | 总耗时 | 效率比 | 备注 |
|:---:|:---:|:---:|:---:|:---|
| 3 | 3/3（100%） | 88.5s | 1.52x | 良好 |
| 4 | 4/4（100%） | 40.4s | 3.14x | 接近线性 |
| 5 | 5/5（100%） | 39.0s | 4.65x | 接近线性 |
| 6 | 6/6（100%） | 174.3s | 2.44x | 良好 |
| 10 | 10/10（100%） | 97.7s | 6.35x | 良好 |
| 20 | 12/20（60%） | 360.6s | 9.09x | 部分超时 |

> 效率比 = (单请求平均耗时 × 并发数) / 总耗时。理想情况下完全并行的效率比等于并发数。1x 表示纯串行。

---

## 发现的问题与约束

### 问题一：Token Plan 并发上限（旧模型）

在换模型之前，并发超过 3 就会触发 API 层限流：

```
Token Plan 主要面向个人开发者的交互式使用场景。
当前请求量较高，请稍后重试（错误码 2062）
```

**表现：** 4 并发全败（0/4），所有请求同时收到 2062 错误。换成更强的模型后，这个限制消失了——说明这是套餐层面的限制，不是 Gateway 本身的瓶颈。

**结论：** 如果要跑高并发，先确认你的 API 套餐支持足够的并发量。

---

### 问题二：Lane 并发上限（activeAhead = 6）

从 OpenClaw 的日志里看到关键指标：

```
lane wait exceeded: lane=main waitedMs=6408 queueAhead=0 activeAhead=4 activeNow=3 queueBehind=5
```

`activeAhead` 的值稳定在 4 或 6，表示 **Lane 的并发上限约为 6**。当 `activeNow` 达到这个值时，新的请求会开始排队，触发 `lane wait exceeded` 警告。

**表现：** 高并发下（≥10），部分请求会排队等待，`queueBehind` 从 0 逐渐增加到 90+，排队时间从几百毫秒到十几秒不等。排队的请求如果等待时间过长，会被主动取消（`AbortError: This operation was aborted`）。

---

### 问题三：SessionTakeoverError（Gateway 内部 Session 生命周期问题）

这是今天遇到最明确的错误：

```
EmbeddedAttemptSessionTakeoverError: session file changed while embedded prompt lock was released
```

我最初的分析认为这是"多个请求操作同一个 session 文件"导致的锁冲突——但这是错的。实际情况是：**每个 API 调用本身就在独立的 session 上下文中，Gateway 会自动为每个请求分配独立的 session**，不存在多请求共享同一个 session 文件的问题。

那这个错误是怎么发生的？从日志的上下文来看：

```
EmbeddedAttemptSessionTakeoverError: session file changed while embedded prompt lock was released
```

问题出在 Gateway 内部 session 文件的**生命周期管理**本身：当一个请求的 embedded prompt 锁释放后、但在正式 commit session 文件之前，如果另一个请求的操作改变了这个文件（可能是 Gateway 内部的 session 预写、锁重新获取、或者 session 文件的 GC 合并），就会触发这个保护性中断。

**发生规律：**
- 发生在高并发（≥4）时，与请求密度相关
- 不是多个请求争用同一个 session，而是 session 文件在其生命周期内的状态突变
- 错误发生时，该请求被主动中断，返回 `None`

**影响：** 导致部分请求中途断连，返回 `None`（不是 timeout，不是被拒绝，是更早就断了）。

---

### 问题四：超时与效率衰减

有两个超时阈值在起作用：

1. **脚本超时**（我设置的 180s，后来改成 360s）：请求超过这个时间直接断开
2. **Lane 内部超时**（约 250ms 级别）：从日志看，部分 `AbortError` 的 duration 是 250ms 集中分布，疑似 Lane 内部有请求处理超时阈值

**20 并发的结果：** 2 个请求达到脚本上限（Timeout），6 个请求中途断连（None）。这 8 个失败里，至少一半如果 timeout 设到 600s 应该能完成。

---

### 问题五：资源消耗（CPU/内存/磁盘）

| 并发 | CPU 峰值 | 内存峰值 | Load 峰值 | 磁盘写入峰值 |
|:---:|:---:|:---:|:---:|:---:|
| 6 | 66% | 2709M（72%） | 2.13 | 263 MB/s |
| 20 | 78% | 2722M（73%） | **3.11** | 494 MB/s |

**关键发现：**
- CPU 从未成为瓶颈（峰值 78%），主要限制是 I/O 和排队
- Load 3.11 说明系统已经开始承压，进程排队明显
- 磁盘写入在高并发下暴涨（494 MB/s），主要是 session 文件频繁写入
- 测试结束后，资源全部回落，无泄漏

---

## 约束全景图

```
API 层（Token Plan）
    ↓ 套餐并发限制（触发 2062）
Gateway 层（Lane 并发上限）
    ↓ activeAhead ≈ 6（触发 lane wait）
Session 层（生命周期状态突变）
    ↓ embedded prompt 锁释放后文件状态变化（触发 Takeover）
请求层（超时设置）
    ↓ 脚本 timeout 和 Lane 内部超时
资源层（CPU/内存/磁盘）
    ↓ 非瓶颈，I/O 是主要因素
```

每个层级都有对应的约束，超过就会触发不同类型的失败。

---

## 可能的解决方案

### 方案一：升级 API 套餐

**解决层级：** API 层（Token Plan）

换到按量付费套餐后，2062 错误消失，10 并发可以稳定跑通。这个是最直接、成本最高的方案。

---

### 方案二：调整 `agents.defaults.maxConcurrent`

**解决层级：** Gateway 层（Lane 并发上限）

日志里有一条关键信息：

```
config change detected; evaluating reload (agents.defaults.maxConcurrent, meta.lastTouchedAt)
Updated agents.defaults.maxConcurrent. Restart the gateway to apply.
```

说明 `maxConcurrent` 是可以动态配置的。如果把它从当前值（从日志推断约为 6）往上调，Lane 的并发上限也会提升。

**操作：** 修改 `/root/.openclaw/openclaw.json` 中的 `agents.defaults.maxConcurrent`，然后重启 Gateway。

---

### 方案三：降低 session 文件状态突变概率

**解决层级：** Session 层（生命周期状态突变）

`SessionTakeoverError` 的根因不是多请求争用同一个 session（每个请求本身已隔离），而是高并发下 session 文件在其生命周期内发生状态突变。可以通过减少并发密度（错峰执行）来降低触发概率。

---

### 方案四：提升脚本 timeout

**解决层级：** 请求层

把 timeout 从 360s 提升到 600s，可以减少 Timeout 类失败。20 并发里那 2 个超时请求（ID 8、13）在更宽松的 timeout 下大概率能完成。

---

### 方案五：优化 session 文件写入频率

**解决层级：** 资源层（磁盘 I/O）

494 MB/s 的磁盘写入主要是 session 文件频繁落盘。如果把 session 写入从同步改成异步（内存缓冲 + 批量落盘），可以显著降低 I/O 压力和 Lock 冲突概率。

---

## 总结

| 并发区间 | 表现 | 可用性 |
|:---:|:---|:---:|
| 3-6 并发 | ✅ 稳定，效率 1.5x - 4.7x | 可直接用于生产 |
| 10 并发 | ✅ 良好，效率 6.35x | 可直接用于生产 |
| 20 并发 | ⚠️ 60% 成功率，有改进空间 | 需优化后使用 |

今天验证了一件事：**OpenClaw Gateway 在合理并发下（≤10）是完全可以稳定工作的**。超过 10 之后，主要问题是 Lane 上限和 session 文件生命周期状态突变。要继续往上扩，核心路径是：调高 `maxConcurrent` → 降低并发密度（减少状态突变） → 配合更宽松的 timeout。

下一步可以实测调高 `maxConcurrent` 后的 20 并发表现。

---

来源: 本地压测 + OpenClaw 日志分析，2026-05-28