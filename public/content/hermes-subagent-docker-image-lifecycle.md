---
title: Hermes 子 Agent 的 Docker 镜像：从哪里来，是否需要重复安装
date: '2026-05-09'
tags: ['AI Agent', 'Hermes', 'Docker', '沙箱', '源码解读']
excerpt: 通过源码追溯子 agent 执行环境，澄清 Docker 镜像来源、容器生命周期，以及依赖是否需要重复安装。
category: AI Agent
---

# Hermes 子 Agent 的 Docker 镜像：从哪里来，是否需要重复安装

最近在调研 Hermes Agent 的 Skill 执行隔离方案，顺藤摸瓜把子 agent 的 Docker 镜像机制理清楚了。记录一下关键发现。

## 镜像从哪里来

不是 Hermes 自定义的镜像，直接用 Docker Hub 公开镜像：

```python
# tools/terminal_tool.py:601
default_image = "nikolaik/python-nodejs:python3.11-nodejs.20"
```

可配置，通过环境变量切换：

| 环境变量 | 用途 | 默认值 |
|---------|------|--------|
| `TERMINAL_DOCKER_IMAGE` | Docker 后端镜像 | `nikolaik/python-nodejs:python3.11-nodejs.20` |
| `TERMINAL_MODAL_IMAGE` | Modal 后端镜像 | 同上 |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 后端 | `docker://nikolaik/python-nodejs:...` |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 后端 | 同上 |

基础镜像只含 Python 3.11 + Node.js 20，其他依赖需要自己装。

## 子 agent 的容器会被销毁吗

**取决于 `container_persistent` 配置（默认 true）**。

持久模式下，容器启动后一直保持运行，idle 超时（默认 300 秒）才销毁：

```python
# terminal_tool.py:835-841
with _env_lock:
    for task_id, last_time in _last_activity.items():
        if current_time - last_time > lifetime_seconds:  # 默认 300 秒
            _active_environments.pop(task_id)
            env.cleanup()  # docker stop + docker rm
```

## 多次调用是否需要重复安装

**同一个 task_id 复用同一个容器，不需要重复安装。**

关键发现：所有子 agent 共享同一个 task_id（"default"）。看代码：

```python
# terminal_tool.py:1165
effective_task_id = task_id or "default"
```

`delegate_task` 创建子 agent 时不传自定义 task_id，所以子 agent 调用 terminal_tool 时全部走 `"default"`。这意味着：

- 同一会话内所有子 agent **共享同一个 Docker 容器**
- 子 agent A 安装的包，子 agent B 继续用，**无需重复安装**
- bind mount 目录 `~/.hermes/sandboxes/docker/default/` 持久化，容器销毁后下次重建仍可复用

## 完整生命周期

```
父会话启动
  ├── 第一次 terminal_tool 调用
  │     ├── task_id="default"（所有子 agent 共用）
  │     ├── docker run（拉镜像，启动 sleep infinity 容器）
  │     ├── 挂载 ~/.hermes/sandboxes/docker/default/
  │     └── 存入 _active_environments["default"]
  │
子 agent A: pip install xxx（容器内执行）
子 agent B: pip install yyy（同一容器，继续安装）
  │
  └── 300 秒无活动
        ├── cleanup 触发
        ├── docker stop + docker rm
        └── 容器销毁，bind mount 目录保留

下次 terminal 调用（300 秒后）
  └── 全新容器 + 重新拉镜像 + 重新安装
```

## 如果 base 镜像不够用怎么办

两种思路：

**思路一：自定义镜像**。提前构建包含所有依赖的镜像，通过 `TERMINAL_DOCKER_IMAGE` 环境变量指定。

**思路二：容器内自安装**。子 agent 在运行时执行 `pip install` / `npm install` / `apt-get install`，容器 root 有足够权限（`DAC_OVERRIDE`、`CHOWN`、`FOWNER` capabilities）。持久模式下安装结果保留在 bind mount 目录里。

## 小结

| 问题 | 答案 |
|------|------|
| 镜像来源 | Docker Hub 公开镜像 `nikolaik/python-nodejs:python3.11-nodejs.20` |
| 是否需要重复安装 | 同一 task_id 复用容器，不需要；不同会话或 idle 超时后需要 |
| 容器何时销毁 | idle 300 秒无调用，或父进程退出 |
| 基础镜像不够用 | 换自定义镜像，或在容器内自安装 |

来源：Hermes Agent 源码追溯，文件路径 `tools/terminal_tool.py` + `tools/environments/docker.py`。