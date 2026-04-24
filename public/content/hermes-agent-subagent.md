# Hermes Agent 子 Agent 架构与 API Key 配置

## 一、子 Agent 是如何启动的

Hermes Agent 使用 `delegate_task` 工具（`tools/delegate_tool.py`）来启动子 Agent：

1. 父 Agent 调用 `delegate_task(goal="...", context="...", toolsets=[...])`
2. `_build_child_agent()` 构造子 AIAgent 实例
3. `_run_single_child()` 在独立线程中运行子 Agent
4. 子 Agent 与父 Agent 共享同一个进程，但有独立上下文

```python
# delegate_task 参数
goal: str                      # 子 Agent 的任务
context: Optional[str]         # 背景信息（文件路径、约束等）
toolsets: Optional[List[str]]  # 工具集（默认继承父 Agent）
max_iterations: int            # 最大迭代次数（默认 50）
acp_command: Optional[str]     # ACP 命令（如 'claude'，让子 Agent 用外部 CLI）
acp_args: Optional[List[str]]  # ACP 参数
```

## 二、子 Agent 的 API Key 从哪里来

关键函数：`_resolve_delegation_credentials(cfg, parent_agent)`（第 945 行）

### 三条路径，按优先级：

### 路径 1：直接 base_url（最简单）

```yaml
# ~/.hermes/config.yaml
delegation:
  base_url: https://api.minimaxi.com/anthropic
  api_key: your-key-here
  model: MiniMax-M2.7
```

子 Agent 直接请求这个 URL。`api_key` 可以直接写，也可以用 `OPENAI_API_KEY` 环境变量。

### 路径 2：通过 provider 名称（推荐）

```yaml
# ~/.hermes/config.yaml
delegation:
  provider: minimax-cn
  model: MiniMax-M2.7
```

调用 `resolve_runtime_provider('minimax-cn')`，它会：
1. 查找 `PROVIDER_REGISTRY['minimax-cn']`
2. 读取其 `api_key_env_vars = ("MINIMAX_CN_API_KEY",)`
3. **从 `.env` 文件中读取环境变量值**

### 路径 3：继承父 Agent（默认）

如果 `delegation` 下没有配置 `base_url` / `provider`，子 Agent 直接继承父 Agent 的 api_key、base_url、model。

---

## 三、profile 的 config.yaml 陷阱

**`delegation` 配置只能写在主 `~/.hermes/config.yaml`，profile 的 config.yaml 不起作用！**

`delegation` 配置通过 `load_config()` 读取，而这个函数只读主配置文件，不读 profile 目录下的 config.yaml。

profile 的 config.yaml 只能配置：
- `FEISHU_HOME_CHANNEL`
- `model.provider` / `model.base_url` / `model.name`
- Skills、cron、sessions 等

---

## 四、.env 文件的加载机制

`hermes -p research-agent chat` 的流程：

1. CLI 入口解析 `--profile/-p` 参数
2. 调用 `resolve_profile_env(profile_name)` → 返回 `~/.hermes/profiles/research-agent/`
3. 设置 `HERMES_HOME=~/.hermes/profiles/research-agent/`
4. 调用 `load_hermes_dotenv()` → 读取 `~/.hermes/profiles/research-agent/.env`

**如果 profile 的 .env 不存在，退化为读主 `~/.hermes/.env`！**

如果 `.env` 里用 `# MINIMAX_CN_API_KEY=` 注释掉了，环境变量就是空的。

---

## 五、minimax-cn provider 的 API Key 解析

`PROVIDER_REGISTRY['minimax-cn']`:
```python
ProviderConfig(
    id="minimax-cn",
    name="MiniMax (China)",
    auth_type="api_key",
    inference_base_url="https://api.minimaxi.com/anthropic",
    api_key_env_vars=("MINIMAX_CN_API_KEY",),
    base_url_env_var="MINIMAX_CN_BASE_URL",
)
```

`resolve_runtime_provider('minimax-cn')` → `_resolve_api_key_provider_secret()` → 读 `MINIMAX_CN_API_KEY` 环境变量。

**`~/.hermes/.env` 中必须有真实的 key：**
```
MINIMAX_CN_API_KEY=sk-cp-uUBX...  （不是注释）
```

---

## 六、错误排查

### 症状：子 Agent 报 401 Authentication Error

**原因 1：profile 的 `.env` 没有或被注释了**
```bash
# 检查 research-agent 的 .env
grep MINIMAX ~/.hermes/profiles/research-agent/.env
```
修复：`cp ~/.hermes/.env ~/.hermes/profiles/research-agent/.env` 然后去掉注释符号

**原因 2：delegation 配置写在 profile 的 config.yaml 里而不是主 config.yaml**
修复：写到 `~/.hermes/config.yaml` 的 `delegation:` 块下

**原因 3：profile config.yaml 里 api_key 用了占位符**
```yaml
# 错误 - 占位符无效
model:
  api_key: sk-cp-...i500   # ← 这个不是真实 key

# 正确 - 删除 api_key，让它从 .env 读取
model:
  provider: minimax-cn
```

### 症状：子 Agent 直接继承父 Agent 的认证（导致串话或 Key 泄露）

**原因：delegation 配置完全空白，子 Agent 和父 Agent 用同一个 Key**

---

## 七、最佳实践

1. **给每个 profile 创建独立的 `.env`**，写入对应的 API Key
2. **delegation 配置统一写在主 `~/.hermes/config.yaml`**，不写在 profile config.yaml
3. **用 provider 方式配置**，不直接写 api_key 在 yaml 里
4. **主 `.env` 中的 key 保持不注释**，`profile/.env` 通过 `# export` 或单独文件覆盖
