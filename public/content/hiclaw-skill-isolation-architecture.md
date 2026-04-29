# HiClaw 架构与 Skill 隔离方案：一次企业级 Agent 编排系统的深度分析

## 背景

最近有机会深入看了 HiClaw 的源码，这是一个很有意思的项目——定位不是"又一个 AI Agent"，而是"多 Agent 协作的编排层"。它本身不实现 Agent 逻辑，而是把 OpenClaw、QwenPaw、Hermes 这些 Agent 框架通过容器的方式跑起来，通过中心化的 Manager 协调它们。

这次分析重点关注两个核心问题：

1. HiClaw 的 Manager-Workers 架构是怎么运作的
2. 在容器环境里，Skill 的隔离是怎么做到的

---

## Manager-Workers 架构

HiClaw 的核心架构非常简单清晰：

```
┌─────────────────────────────────────────────────────────┐
│                     HiClaw 系统                          │
│                                                         │
│  ┌─────────────┐                                        │
│  │   Manager   │  ← 宿主机上的常驻容器                    │
│  │  (容器)      │    持有真实 API Key / GitHub Token       │
│  └──────┬──────┘                                        │
│         │  Docker API (via DockerAPIProxy)                │
│         ↓                                               │
│  ┌──────────────────────────────────────────┐           │
│  │         Higress AI Gateway                │           │
│  │  (宿主机)  所有 Worker 容器流量的统一入口     │           │
│  └──────┬──────────────────────────────┬───┘           │
│         │                              │                │
│    ┌────┴────┐                  ┌────┴────┐           │
│    │ Hermes  │                  │  CoPaw  │  ...       │
│    │ Worker  │                  │ Worker  │            │
│    │(容器)    │                  │(容器)    │            │
│    └─────────┘                  └─────────┘            │
│         ↑                              ↑                │
│         │      ┌────────────────┐      │                │
│         └──────│     MinIO      │──────┘                │
│                │  (共享文件系统)  │                       │
│                └────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

**Manager** 是中心协调者，跑在宿主机的一个容器里，持有真实的 API Key 和 GitHub Token。**Workers** 是干活的 Agent，每个也是独立容器，可以跑 Hermes、CoPaw 或其他框架。

它们之间的协作通过 **Matrix IM**（一个去中心化聊天协议）进行——用户、Manager 和所有 Worker 都在同一个 IM 房间里，任何人都能看到所有 Agent 在干什么，随时插话。

---

## Skill 隔离：三层机制

这是最值得关注的部分。HiClaw 的 Skill 隔离靠三层机制：

### 第一层：容器级隔离

每个 Worker 运行在独立容器里，容器内文件系统、进程、网络都是隔离的。Worker 看到的只是自己的容器内部，看不到宿主机。

### 第二层：MinIO 共享文件系统

问题来了——如果每个 Worker 都在自己容器里，它们之间怎么共享 Skill？怎么拿到 Manager 分发的配置？

答案是 **MinIO**（一个兼容 S3 协议的对象存储）：

```
MinIO Bucket 结构：
hiclaw/
  workers/
    worker-1/
      hermes-home/
        skills/        ← Skill 目录（从 MinIO 同步下来）
        sessions/      ← 会话历史
        state.db       ← 状态数据库
        SOUL.md        ← Agent 人格设定
        openclaw.json
    worker-2/
      copaw-home/
        skills/
        sessions/
```

Worker 启动时先从 MinIO 全量拉取（`mirror_all`），运行期间通过增量同步保持状态。Skill 文件存在 MinIO 里，不存在容器内部——这样所有 Worker 都能访问同一套 Skill，但每次运行是在自己的容器里执行。

### 第三层：DockerAPIProxy + SecurityValidator

这是最关键的一层，也是最有趣的设计。

**问题**：Worker 容器在运行过程中有时候需要创建子容器（比如某些 Skill 需要在一个独立环境里运行），这意味着 Worker 需要访问 **Docker API**。但如果直接把宿主机的 Docker Socket 映射进容器，容器就拥有了完整的 root 权限——太危险了。

**HiClaw 方案**：在宿主机上部署一个 **Docker API 代理**（Go 语言实现），Worker 容器的所有 Docker 请求必须先经过这个代理，由 SecurityValidator 审查后才放行。

```go
// 来自 hiclaw-controller/internal/proxy/security.go
type SecurityValidator struct {
    AllowedRegistries []string    // 只允许特定镜像源
    ContainerPrefix   string      // 容器名必须此前缀
    DangerousCaps     map[string]bool  // 禁止危险 Capabilities
}

// 每次容器创建请求必须通过以下检查：
// 1. 容器名必须以 "hiclaw-worker-" 开头
// 2. 镜像必须来自：本地镜像、localhost、Higress 镜像仓库、或白名单仓库
// 3. 禁止 Bind Mount（强制使用 MinIO）
// 4. 禁止 Privileged 模式
// 5. 禁止 Host 网络模式
// 6. 禁止 Host PID 模式
// 7. 禁止危险 Capabilities：SYS_ADMIN, SYS_PTRACE, DAC_OVERRIDE, NET_ADMIN ...
```

同时，Docker API 的路由做了白名单限制——只有 `containers/create`、`containers/*/start|stop|kill`、`exec/start` 等明确需要的操作被放行，其他全部拒绝。

---

## 与 Hermes 的对比

看完 HiClaw 的架构，自然会想问：这和 Hermes 的 subagent 机制有什么区别？

| | HiClaw | Hermes |
|---|---|---|
| 架构 | Manager-Workers（多容器） | 单进程 + 线程池 |
| 隔离单位 | 容器级（Docker） | 线程级（进程内） |
| 子 Agent 通信 | IM 消息（Matrix）+ MinIO 文件 | 直接函数调用 + callback |
| Skill 隔离 | 容器隔离 + MinIO 共享 + DockerAPIProxy | 无容器隔离，Skill 在同进程 |
| 适用场景 | 企业多团队协作 | 个人 / 小团队 |
| 部署复杂度 | 高 | 低 |

**最核心的区别**：HiClaw 的 Worker 是**常驻容器**，有持久状态；Hermes 的 subagent（delegate_task）是**临时线程**，每次任务结束就销毁。

---

## 总结

HiClaw 是一个定位清晰的企业级多 Agent 编排方案。它不重新造 Agent 的轮子，而是通过容器隔离、MinIO 共享存储和 DockerAPIProxy 三层机制，解决了"多个 Agent 如何安全地共享 Skill 又保持隔离"这个核心问题。

如果你的场景是个人或小团队，Hermes 的单进程方案更轻量。但如果你是企业，需要多个团队的 Agent 在同一个环境里安全地协作，HiClaw 的架构值得研究。

---

## 相关源码

- 安全代理：`hiclaw-controller/internal/proxy/security.go`
- Docker 代理路由：`hiclaw-controller/internal/proxy/proxy.go`
- Hermes Worker：`hermes/src/hermes_worker/worker.py`
- CoPaw Worker：`copaw/src/copaw_worker/worker.py`
- MinIO 文件同步：`copaw/src/copaw_worker/sync.py`
