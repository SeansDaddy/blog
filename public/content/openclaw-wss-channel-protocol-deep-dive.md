# 揭秘 OpenClaw WSS 通道：从握手到流式 AI 对话

> 2026-05-29 · AI Agent · OpenClaw · WebSocket · 协议解析
> 本文记录对 OpenClaw Gateway WSS 协议的完整探索过程，从源码追踪到 Python 原生实现，拿到可运行的端到端演示。

## 背景

之前的并发测试一直围绕 HTTP API 打转。对 AI 对话场景，HTTP 轮询总显得笨重——能不能像官方 TUI 那样，用一条 WSS 长连接把对话跑通，把流式响应直接推进通道里？

本文是一次完整的探路记录：从协议类型定义到源码定位，从连接参数选型到 Python 原生实现，最后拿到一个可独立运行的 Demo。

---

## 一、协议层面的几个关键发现

### 1. URL 必须用 `ws://` 而非 `wss://`

服务器对 `wss://` 协议会返回 `WRONG_VERSION_NUMBER`，换成 `ws://` 后立即握手成功。这说明 Gateway 前端可能没有 TLS 卸载，或者 TLS 终止在别处处理。

### 2. `client.id` 决定 scope 是否被保留

这是最大的坑。

从源码 `connect-policy.ts` 里找到的判断逻辑：

```typescript
// 只有 openclaw-tui 和 openclaw-control-ui 这两个 ID
// 会绕过 scope 清除逻辑，其他 ID（即使是 gateway-client）
// 只要 authMethod === "token"，scope 就会被清空成 []
function shouldClearUnboundScopesForMissingDeviceIdentity(params) {
  return (
    params.authMethod === "token" ||
    params.authMethod === "password" ||
    params.authMethod === "trusted-proxy"
    // ... 其他条件
  );
}
```

**只有 `openclaw-tui` 能保持显式传入的 scopes**，其他所有客户端 ID 都会被清空权限。

### 3. `send` vs `chat.send`：两个不同的方法

| 方法 | 用途 | 回复路由 |
|------|------|---------|
| `send` | 推送消息到飞书/微信 | 消息发出去，AI 不通过 WSS 回复 |
| `chat.send` | 发起 AI 对话 | AI 响应通过 WSS 事件返回 |

### 4. AI 响应的事件格式

发起 `chat.send` 后，WSS 通道里会收到一组事件流：

```json
// 第一步：方法响应
{"type":"res","id":"<req_id>","ok":true,"runId":"sr-xxx","status":"started"}

// 第二步：流式文本（增量）
{"type":"event","id":"<req_id>","event":"chat",
 "payload":{"state":"delta","deltaText":"🦐 虾","runId":"sr-xxx"}}

// 第三步：最终状态
{"type":"event","id":"<req_id>","event":"chat",
 "payload":{"state":"final","message":"🦐 虾米","runId":"sr-xxx"}}

// 第四步：结束标记
{"type":"event","id":"<req_id>","event":"agent",
 "payload":{"kind":"command","data":{"phase":"end","summary":"🦐 虾米"}}}
```

AI 文本在 `payload.deltaText` 字段里，增量拼接即为完整回复。

---

## 二、完整连接流程

### 连接参数

```python
CONNECT_PARAMS = {
    "type": "req", "id": "1", "method": "connect",
    "params": {
        "minProtocol": 3, "maxProtocol": 4,
        "client": {
            "id": "openclaw-tui",          # ← 必须是这个 ID
            "version": "1.0.0",
            "platform": "linux",
            "mode": "backend"
        },
        "role": "operator",
        "auth": {"token": "<YOUR_TOKEN>"},
        "scopes": [                         # ← 显式声明权限
            "operator.admin",
            "operator.read",
            "operator.write"
        ]
    }
}
```

### 发送对话请求

```python
def chat_send(ws, session_key: str, message: str, req_id: str):
    """发送 chat.send 请求"""
    payload = {
        "type": "req", "id": req_id,
        "method": "chat.send",
        "params": {
            "sessionKey": session_key,      # ← 必须是 UUID 格式
            "message": message,
            "idempotencyKey": req_id
        }
    }
    ws.send(json.dumps(payload))
```

### 后台事件监听（关键实现）

```python
def ws_reader(ws, responses: dict, stop_event: threading.Event):
    """后台线程：持续读取 WSS 事件，写入 responses[req_id]"""
    while not stop_event.is_set():
        try:
            msg = ws.recv()
            data = json.loads(msg)
            if data.get("type") == "event":
                req_id = data.get("id")
                if data.get("event") == "chat":
                    delta = data["payload"].get("deltaText", "")
                    if delta:
                        responses.setdefault(req_id, [])
                        responses[req_id].append(delta)
                elif (data.get("event") == "agent" and
                      data.get("payload", {}).get("data", {}).get("phase") == "end"):
                    req_id = data.get("id")
                    final_text = data["payload"]["data"].get("summary", "")
                    responses.setdefault(req_id, [])
                    responses[req_id].append(f"[FINAL:{final_text}]")
                    stop_event.set()
        except Exception:
            break
```

---

## 三、可独立运行的完整 Demo

```python
#!/usr/bin/env python3
"""
openclaw-wss-demo.py
通过 WSS 通道连接 OpenClaw Gateway，发起 AI 对话并接收流式响应
"""
import json, uuid, threading, time
import websocket

GATEWAY_URL = "ws://<GATEWAY_HOST>:<PORT>"
TOKEN = "<YOUR_TOKEN>"

# ── 连接 ──────────────────────────────────────────────
def connect(ws):
    params = {
        "type": "req", "id": "1", "method": "connect",
        "params": {
            "minProtocol": 3, "maxProtocol": 4,
            "client": {"id": "openclaw-tui", "version": "1.0.0",
                       "platform": "linux", "mode": "backend"},
            "role": "operator",
            "auth": {"token": TOKEN},
            "scopes": ["operator.admin", "operator.read", "operator.write"]
        }
    }
    ws.send(json.dumps(params))

# ── 事件读取线程 ──────────────────────────────────────
def reader_loop(ws, stop_evt):
    responses = {}
    while not stop_evt.is_set():
        try:
            msg = ws.recv()
            data = json.loads(msg)
            if data.get("type") == "event":
                req_id  = data.get("id")
                payload = data.get("payload", {})
                if data.get("event") == "chat":
                    delta = payload.get("deltaText", "")
                    if delta:
                        responses.setdefault(req_id, [])
                        responses[req_id].append(delta)
                elif (data.get("event") == "agent" and
                      payload.get("data", {}).get("phase") == "end"):
                    summary = payload["data"].get("summary", "")
                    responses.setdefault(req_id, []).append(f"[FINAL:{summary}]")
                    stop_evt.set()
        except Exception:
            break

# ── 单次对话 ──────────────────────────────────────────
def ask(ws, question: str) -> str:
    req_id  = str(uuid.uuid4())[:8]
    session = str(uuid.uuid4())
    responses = {}
    stop_evt  = threading.Event()

    # 启动事件监听
    t = threading.Thread(target=reader_loop, args=(ws, stop_evt))
    t.start()

    # 发送请求
    ws.send(json.dumps({
        "type": "req", "id": req_id, "method": "chat.send",
        "params": {"sessionKey": session,
                   "message": question, "idempotencyKey": req_id}
    }))

    # 等待回复（超时 30s）
    stop_evt.wait(timeout=30)
    t.join()
    text = "".join(responses.get(req_id, []))
    return text.replace(f"[FINAL:", "").rstrip("]")

# ── 主程序 ────────────────────────────────────────────
if __name__ == "__main__":
    ws = websocket.create_connection(GATEWAY_URL)
    print("已连接")
    connect(ws)

    questions = [
        "用3个字介绍自己",
        "1+1等于几？简洁",
        "今天星期几",
        "你是谁？",
    ]
    for q in questions:
        a = ask(ws, q)
        print(f"Q: {q}\nA: {a}\n")

    ws.close()
```

运行效果：

```
Q: 用3个字介绍自己
A: 🦐 虾米

Q: 1+1等于几？简洁
A: 2

Q: 今天星期几
A: 星期五

Q: 你是谁？
A: 我是虾米 🦐，你的 AI 助手。有什么可以帮你的？
```

---

## 四、几个值得注意的细节

**1. `sessionKey` 必须是 UUID 格式**
不能用普通字符串前缀（如 `session-1`），Gateway 会拒绝。建议直接用 `uuid.uuid4()` 每次生成新的。

**2. 后台 reader 线程不能使用阻塞 recv**
Python 的 `ws.recv()` 在没有消息时默认会永久阻塞，所以必须用独立线程监听事件，主线程负责发送和结果收集。

**3. 增量文本需要拼接**
`deltaText` 是增量推送，每收到一条就追加到列表里，收到 `phase=end` 事件后拼接为完整回复。

**4. `client.id` 选型清单**
从 Gateway 源码里找到的官方白名单：

```
webchat-ui, openclaw-control-ui, openclaw-tui,
webchat, cli, gateway-client,
openclaw-macos, openclaw-ios, openclaw-android,
node-host, test, fingerprint, openclaw-probe
```

其中只有 `openclaw-tui` 和 `openclaw-control-ui` 支持权限保留，其余 ID 在 token 认证模式下 scopes 都会被清空。

---

## 五、并发测试：广播机制发现

拿到单连接的正确姿势后，满心欢喜跑 4并发，结果让人一愣：4个连接全部收到相同的响应，4个连接都显示 `2`。

### 测试现象

同时用 4 个独立连接发送 4 个完全不同的问题：

```python
# 同时发
session("用3个字介绍自己", "T1")
session("1+1等于几？简洁", "T2")
session("今天星期几", "T3")
session("你是谁？", "T4")
```

结果：4 个连接全部显示 `2`——这是一个问题，因为每个连接问的都不一样。

### 根因定位

设计一系列分层验证实验：

**实验 1：单连接顺序发**

单连接顺序发送 4 个问题，4/4 全部收到正确响应 ✅

**实验 2：同时发 4 个不同问题**

4 个连接同时发，收到相同的响应（全是最后发出的那个问题的响应）❌

**实验 3：同时发 4 个相同问题**

4 个连接同时发，收到相同响应——但如果广播，应该收到所有 AI 响应的拼接才对，实际只有一条 ✅

**实验 4：3 个相同 + 1 个独特问题**

3 个连接问 `1+1=?`，1 个连接问 `今天西安天气`，4 个连接全部收到 `22`（`1+1=?` 的响应）✅

### 结论：Gateway 广播机制

```
同一 Token 的多个 WSS 连接
         │
         ↓
  Gateway 识别为同一个"用户会话"
         │
         ↓
  AI 每次响应 → 广播给所有连接
         │
         ↓
  4 个连接中只有 1 个幸运儿能 recv 到响应
```

**每个连接的 `res` 响应是独立的**（含正确的 `runId`），但 **AI 响应的事件帧会广播给所有连接**，且只有最新一条 AI 响应被保留（老的被新的覆盖）。

### 单连接顺序 vs 多 Token 并发

基于广播机制，并发扩展有两条路径：

**路径 A：单连接顺序**（同 Token，完全串行）

```python
# 一个连接，顺序发请求，不存在广播竞争
for q in questions:
    result = ask(ws, q)  # 等上一个回答收到再发下一个
```

实测单连接顺序 4 问 → 4/4 全部正确。

**路径 B：多 Token 独立广播域**（真正并行）

每个 Token 对应独立的广播域，4 个 Token → 4 个独立连接 → 各自收到自己的响应。

```python
TOKENS = ["token1", "token2", "token3", "token4"]

def run_session(question, token):
    ws = websocket.create_connection(GATEWAY_URL)
    connect(ws, token=token)  # 每个连接用不同 token
    return ask(ws, question)
```

---

## 七、设备身份认证：突破 scopes 清空的最后一步

### 问题重现

用原始 token 连接，`scopes` 一开始是空的：

```python
# 不带设备信息 → scopes 被清空
{"type":"req","id":"1","method":"connect","params":{
    "auth": {"token": "fee120..."},
    "scopes": ["operator.admin", "operator.read", "operator.write"]
}}
# → {"ok": true, "scopes": []}  ❌
```

即使显式传入 `scopes` 参数，Gateway 的 `shouldClearUnboundScopesForMissingDeviceIdentity()` 仍然会把它清空。

### 根因：设备身份缺失

源码 `handshake-auth-helpers.ts` 揭示了判断链：

```typescript
function shouldClearUnboundScopesForMissingDeviceIdentity(params) {
  if (params.authMethod === "token") {
    // 只有 gateway-client + mode=backend 在本地时 bypass
    // 其余所有情况：auth token 没有对应设备记录 → scopes 全部清除
    return !shouldSkipLocalBackendSelfPairing(params);
  }
}
```

解决路径：**在连接时提供设备身份（Device Identity）**，让 Gateway 认定这是"已知设备发起的请求"，从而保留 scopes。

### 设备配对流程（完整 4 步）

#### Step 1：生成 ECDSA P-256 密钥对

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

pk = ec.generate_private_key(ec.SECP256R1(), default_backend())
priv_pem = pk.private_bytes(
    serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
    serialization.NoEncryption()
).decode()
pub_pem = pk.public_key().public_bytes(
    serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
).decode()
```

#### Step 2：连接时传递设备签名

连接时在 `params.device` 里附上公钥和签名：

```python
def build_payload_v3(device_id, client_id, client_mode, role, scopes,
                      signed_at_ms, token, nonce, platform, device_family):
    return "|".join([
        "v3", device_id, client_id, client_mode, role, ",".join(scopes),
        str(signed_at_ms), token, nonce,
        platform.lower(), device_family.lower()
    ])

# 签名内容 = "v3|deviceId|clientId|clientMode|role|scopes|signedAtMs|token|nonce|platform|deviceFamily"
payload_v3 = build_payload_v3(device_id, "openclaw-tui", "backend", "operator",
                              scopes, signed_at_ms, token, connect_nonce, "linux", "")
signature = b64url_encode(pk.sign(
    payload_v3.encode("utf8"), ec.ECDSA(hashes.SHA256())
))
```

#### Step 3：附在 connect 请求里

```python
req = {
    "type": "req", "id": "1", "method": "connect",
    "params": {
        "minProtocol": 3, "maxProtocol": 4,
        "client": {"id": "openclaw-tui", "version": "1.0.0",
                   "platform": "linux", "mode": "backend"},
        "role": "operator",
        "auth": {"token": GATEWAY_TOKEN},
        "device": {                          # ← 设备身份是关键
            "id": device_id,
            "publicKey": pub_b64url,         # ECDSA P-256 公钥（raw, base64url）
            "signature": signature,          # payload_v3 的 ECDSA 签名
            "signedAt": signed_at_ms,
            "nonce": connect_nonce           # 必须和 connect challenge nonce 一致
        },
        "scopes": ["operator.admin", "operator.read", "operator.write"]
    }
}
```

#### Step 4：验证 scopes 保留

带设备签名连接后，`auth.scopes` 终于显示正确：

```python
# → {"ok": true, "auth": {"role": "operator", "scopes": [
#     "operator.admin", "operator.read", "operator.write"
#   ]}}
```

### 4 并发连接测试结果

用设备身份认证跑 4 并发，每个连接使用同一个设备 ID + 不同 nonce 签名，同时各问不同问题：

| 连接 | 问题 | connId | scopes |
|------|------|--------|--------|
| 0 | 回复一个单词：是 | `780e2ef8-...` | ✅ admin/read/write |
| 1 | 回复一个单词：否 | `11d604ab-...` | ✅ admin/read/write |
| 2 | 回复一个单词：苹果 | `8198f8ee-...` | ✅ admin/read/write |
| 3 | 回复一个单词：香蕉 | `5fb1c5b0-...` | ✅ admin/read/write |

- **独立 connId：4/4**（每个连接唯一）
- **chat.send 全部成功：4/4**
- **scopes 全部正确：4/4**

### 并发串台测试

用 4 个并发连接同时各发一个不同问题，验证是否存在广播串台：

```
连接0 → "是"   连接1 → "否"   连接2 → "苹果"   连接3 → "香蕉"
```

**结果：4 个连接全部收到相同的回答 "否"**（最后一个到达的响应覆盖了前面的）。

**根因：广播域按 Token 划分，不是按连接或设备划分。** AI 响应事件通过 Gateway 广播给所有持有同一 Token 的 WSS 连接，事件本身不携带请求 ID（`event.id` 始终为 `None`），导致客户端无法区分来源，只能被覆盖。

**结论：**

- 设备签名认证 ✅ 解决了 scopes 清空问题
- 独立 connId ✅ 每个连接唯一
- 并发无串台 ❌ 同一 Token 下的连接共享广播域，AI 响应会相互覆盖
- **如果要真正并发无串台，需要每个连接使用不同的 Token**，对应各自独立的广播域

关键发现：**设备签名认证**绕过了 `shouldClearUnboundScopesForMissingDeviceIdentity()` 的 scopes 清除逻辑，让每个连接都能以完整权限身份运行。

---

## 八、附：WSS 消息总动员

**连接请求：**
```json
{"type":"req","id":"1","method":"connect","params":{...}}
```

**方法响应：**
```json
{"type":"res","id":"xxx","ok":true,"runId":"sr-xxx","status":"started"}
```

**AI 流式事件：**
```json
{"type":"event","id":"xxx","event":"chat","payload":{"state":"delta","deltaText":"文本","runId":"sr-xxx"}}
{"type":"event","id":"xxx","event":"chat","payload":{"state":"final","message":"完整文本"}}
```

**对话结束事件：**
```json
{"type":"event","id":"xxx","event":"agent","payload":{"kind":"command","data":{"phase":"end","summary":"最终总结文本"}}}
```

---

*源码参考：[OpenClaw Gateway Protocol](https://github.com/openclaw/openclaw/tree/main/packages/gateway-protocol)，认证策略见 `connect-policy.ts`。*