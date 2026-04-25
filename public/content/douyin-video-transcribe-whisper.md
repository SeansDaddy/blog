# 抖音 & 视频号 视频内容提取技术方案

> 创建时间：2026-04-25
> 标签：#AI工具 #音视频 #Whisper #内容提取
> 来源：内部调研

---

## 核心结论

抖音和视频号均为封闭平台，无官方 API，常规爬虫方案风险高。**最推荐的合规方案：视频下载 + Whisper 语音识别**，可提取任意视频的口播内容，准确率 95%+。

---

## 平台限制对比

| 平台 | 公开可访问性 | 登录态要求 | 反爬强度 | 官方 API |
|------|------------|-----------|---------|---------|
| 抖音 | 部分可访问 | 需要 | 高 | 无（封闭）|
| 微信视频号 | 几乎不可访问 | 强制需要 | 极高 | 无（封闭）|

**视频号**：外部浏览器直接被拦截，需微信内置环境（UA 含 MicroMessenger）。

---

## 方案对比

| 方案 | 获取内容 | 合规性 | 难度 | 适用场景 |
|------|---------|-------|------|---------|
| 视频下载 + Whisper | 视频口播内容 | ✅ 合规 | 中 | 提取配音/解说词 |
| 第三方数据平台（新榜/蝉妈妈）| 评论/弹幕/账号数据 | ✅ 合规 | 低 | 企业批量数据，需付费 |
| Playwright 模拟登录 | 登录后可见内容 | ⚠️ 有风险 | 高 | 评论区抓取，易被封号 |
| 视频下载 + OCR | 视频内嵌入字幕 | ✅ 合规 | 中高 | 视频有硬字幕 |
| 搜索引擎抓取 | 标题/简介（已SEO内容）| ✅ 合规 | 低 | 仅公开信息 |

---

## 最推荐方案：视频下载 + Whisper 语音识别

### 原理
```
抖音/视频号链接 → yt-dlp 下载视频 → ffmpeg 提取音频 → Whisper 语音识别 → 文本/SRT
```

### 技术栈

| 组件 | 工具 | 说明 |
|------|------|------|
| 视频下载 | `yt-dlp` | 支持抖音/视频号，更新活跃 |
| 音频提取 | `ffmpeg` | 标准音视频处理工具 |
| 语音识别 | `faster-whisper` 或 `openai-whisper` | CPU/GPU 均可，faster-whisper 更快 |
| 可选 OCR | `EasyOCR` / `Tesseract` | 识别视频硬字幕 |

### 核心代码

```python
import subprocess
import whisper

def download_video(url, output="video.mp4"):
    """yt-dlp 下载视频"""
    subprocess.run(["yt-dlp", "-o", output, "--no-playlist", url], capture_output=True)
    return output

def extract_audio(video_path, audio="audio.mp3"):
    """ffmpeg 提取音频"""
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "libmp3lame", "-q:a", "2", audio
    ], capture_output=True)
    return audio

def transcribe(audio_path, model_size="base"):
    """Whisper 语音识别"""
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path, language="zh")
    return result["text"], result.get("segments", [])

# 使用
video_path = download_video("https://www.douyin.com/video/xxxxx")
audio_path = extract_audio(video_path)
text, segments = transcribe(audio_path)
print(text)  # 完整文本
# segments 含时间戳，可生成 SRT 字幕
```

### 环境依赖

```bash
pip install whisper yt-dlp ffmpeg-python
# 或更快版本
pip install faster-whisper
# Playwright（如需浏览器自动化）
pip install playwright && playwright install chromium
```

---

## 合规边界

| 行为 | 合规性 |
|------|--------|
| 下载自己的视频 + Whisper 处理 | ✅ 完全合规 |
| 使用 Whisper 识别公开视频 | ✅ 本地处理，不抓平台数据 |
| 破解登录态/逆向 API | ❌ 违规，有封号风险 |
| 批量爬取用户数据 | ❌ 侵犯用户隐私权 |

---

## 相关工具

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — 视频下载，支持抖音/视频号
- [Whisper](https://github.com/openai/whisper) — OpenAI 语音识别
- [faster-whisper](https://github.com/guillaumekln/faster-whisper) — Whisper 加速版（CPU 更快）
- [新榜](https://www.newrank.cn) — 抖音数据平台（需付费）
- [蝉妈妈](https://www.chanmama.com) — 抖音电商数据（需付费）

---

## 相关文档

- `~/Documents/Research/douyin_wechat_research/抖音视频号文本内容获取方案调研报告.md` — 完整调研报告（含代码示例）
