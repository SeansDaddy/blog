# delegate_task vs tmux：Hermes 子 Agent 两种实现方式

## 什么是 Session

**Session**（会话）是 Hermes 中一次完整的对话上下文，包含用户和 agent 的所有交互历史。保存在 `~/.hermes/sessions/` 目录下，可随时 resume 继续。

## 两种核心机制

### 1. delegate_task（线程池，官方推荐）

**本质**：子 agent 运行在**线程池**里，和主 agent 在**同一个进程**中，通过新线程执行。

```python
# 来自 delegate_tool.py 源码
from concurrent.futures import ThreadPoolExecutor, as_completed

result = child.run_conversation(user_message=goal)
```

**通信方式**：直接函数调用 + callback，主 agent 阻塞等待返回值。

**特点**：
- 共享主进程，启动开销小
- 直接返回结果，无超时烦恼
- 适合快速并行子任务
- 官方优先推荐

**限制**：禁止递归嵌套（`max_depth = 2`）

---

### 2. tmux → 独立 hermes 进程（变通方案）

**本质**：通过 tmux 启动一个**完全独立的 hermes 进程**，通过"键盘注入 + 屏幕读取"来通信。

```bash
# 来自 hermes-agent skill 的示例
tmux new-session -d -s backend -x 120 -y 40 'hermes'
tmux send-keys -t backend 'Build REST API' Enter
tmux capture-pane -t backend -p | tail -50
```

**通信方式**：
- `tmux send-keys` → 往子 agent 塞字符（模拟用户输入）
- `tmux capture-pane` → 读子 agent 终端屏幕（获取输出）

**存在的问题**：
- ❌ 不知道什么时候结束——只能主动轮询，无法被动通知
- ❌ 容易超时——主 agent 无法感知子 agent 状态
- ❌ 没有结构化结果——只能读屏幕文本猜结果
- ❌ 通信粗糙——纯文本，无 API

**适用场景**：
- 长期独立运行的 agent
- 需要完全进程级隔离的 agent
- 人在旁边的长线任务

> 官方 skill 明确建议：**Prefer `delegate_task` for quick subtasks**

---

**实际例子：research-agent**

research-agent 就是用 tmux 方案跑起来的独立 hermes 实例：

```
~/.hermes/profiles/research-agent/
├── state.db          # 独立数据库
├── skills/          # 独立技能库（mlops、research 等）
├── sessions/         # 独立会话历史
├── SOUL.md           # 独立人格设定（Deep Research Specialist）
└── config.yaml       # 独立配置
```

启动方式本质上是：

```bash
tmux new-session -d -s research 'hermes --profile research-agent'
```

它有自己独立的 skills、memory、sessions，本质上是一个完全隔离的 hermes 进程，通过 tmux 和主 agent 保持松散协调。

---

## 架构对比

| | `delegate_task` | tmux → 独立 hermes 进程 |
|---|---|---|
| 进程 | 共享主进程 | 完全独立 |
| 通信 | 直接函数调用 + callback | tmux send-keys / capture-pane |
| 超时 | 无（同步等待） | 容易超时 |
| 生命周期 | 分钟级 | 可小时/天级 |
| 状态 | 无（每次全新） | 有（持久） |
| 官方推荐 | ✅ 优先 | ❌ 变通方案 |

---

## 关键结论

1. **尽量用 `delegate_task`**，官方内置机制，更可靠
2. **tmux 方案是 workaround**，适合长期独立 agent
3. research-agent 是 tmux 方案的具体应用实例
4. 需要通知和超时的场景，用 **cronjob** 比 tmux 更靠谱

---

## 相关文件

- 源码：`~/.hermes/hermes-agent/tools/delegate_tool.py`
- Skill 文档：`~/.hermes/skills/autonomous-ai-agents/hermes-agent/SKILL.md`
- research-agent：`~/.hermes/profiles/research-agent/`
