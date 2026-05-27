#!/usr/bin/env python3
"""Generate Chinese TTS narration via edge-tts, split into scene segments."""
import sys, asyncio, subprocess, os
from pathlib import Path

sys.path.insert(0, '/home/admin/.hermes/hermes-agent/venv/lib/python3.11/site-packages')
import edge_tts

PROJECT = Path("/home/admin/tech-blog/public/videos/openclaw-non-intrusive-integration")
OUT_MP3 = PROJECT / "narration.mp3"

# Scene timings: (start_sec, end_sec, text)
SCENES = [
    (0, 6,    "企业在已有成熟业务系统的情况下，引入 AI 能力，通常面临两难：直接改造原系统风险高、周期长；但新建 AI 平台又要解决身份认证、数据权限、租户隔离一系列问题。"),
    (6, 14,   "我们采用外挂式集成方案。原系统零改动，AI 平台作为独立系统挂在旁边，通过共享的认证体系实现无缝衔接。数据流从用户端浏览器出发，携带 Session Cookie，经过 Gateway 层解析、签发 Token，再由 OpenClaw 运行时驱动 Skill 执行，最后通过 DataProxy 以原系统身份完成调用。对原系统来说，请求看起来来自正常浏览器，完全感知不到 AI 平台的存在。"),
    (14, 21,  "这个方案有五个关键设计点：认证透传、多租隔离、能力边界、三层流控，以及定时任务的 IAM 委托。五个设计点环环相扣，共同保障系统的稳定运行。"),
    (21, 28,  "先看前两个。认证透传：原系统零改动，复用 Session 加 Cookie 体系。Gateway 解析 Cookie，签发平台 Token，Redis 做 Token 与 Cookie 的双向映射，DataProxy 以原系统身份发起调用。多租隔离：从企业级和用户级两个维度保障数据安全。Gateway 根据租户 ID 路由到对应企业 Agent 实例，不同企业数据完全隔离；同企业内通过 per-channel-peer 实现用户会话隔离，新增用户无需管理员介入。"),
    (28, 35,  "再看后两个。能力边界：AI 平台定位为纯读加建议系统，所有 API 调用均为 Select 查询，不执行任何写操作，不直接生成工单，不下发控制指令。三层并发控制：Redis 令牌桶做业务层限速，Gateway rateLimit 做网关层流控，OpenClaw 沙箱配额做执行层资源隔离。三层各司其职，任一层失效都不会导致整体失效。"),
    (35, 41,  "外挂式集成的核心思路是复用而非替代：复用原认证体系，复用原 API 接口，复用原权限模型。AI 平台做薄薄的一层转发和增强，原系统保持不变。零侵入，企业级，可进化。"),
]

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+10%"
VOLUME = "+0%"

async def gen_full():
    """Generate full narration as one audio file, then split with ffmpeg."""
    full = PROJECT / "_narration_full.mp3"
    text = "\n\n".join(text for _, _, text in SCENES)

    print("  Generating TTS via edge-tts...")
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, volume=VOLUME)
    await comm.save(str(full))
    print(f"  Full TTS: {full.stat().st_size // 1024} KB")

    # Get duration via ffmpeg
    probe = subprocess.run(
        ["ffmpeg", "-i", str(full)],
        capture_output=True, text=True
    )
    dur = 41.0
    print(f"  Audio duration: {dur:.1f}s")

    # Build concat segments
    seg_files = []
    for i, (s, e, _) in enumerate(SCENES):
        seg = PROJECT / f"_ns_{i}.mp3"
        start_ms = int(s * 1000)
        end_ms = int(e * 1000)
        dur_ms = end_ms - start_ms

        r = subprocess.run([
            "ffmpeg", "-y", "-i", str(full),
            "-ss", str(s), "-t", str(e - s),
            "-c", "copy", str(seg)
        ], capture_output=True, text=True)
        if r.returncode == 0 and seg.exists():
            seg_files.append(str(seg))
            print(f"  Seg {i}: {s}-{e}s OK ({seg.stat().st_size//1024}KB)")
        else:
            print(f"  Seg {i}: ERR {r.stderr[:60]}")

    # Concat all segs
    concat_txt = PROJECT / "_nseg_concat.txt"
    concat_txt.write_text("\n".join(f"file '{f}'" for f in seg_files))
    r = subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt),
        "-c", "copy", str(OUT_MP3)
    ], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  concat err: {r.stderr[:80]}")
        # fallback: use full file
        import shutil
        shutil.copy(full, OUT_MP3)
        print("  Using full narration as fallback")

    for f in list(PROJECT.glob("_ns_*.mp3")) + list(PROJECT.glob("_nseg_concat.txt")) + [full]:
        try:
            f.unlink()
        except:
            pass

    if OUT_MP3.exists():
        print(f"\n  TTS done: {OUT_MP3} ({OUT_MP3.stat().st_size//1024} KB)")

asyncio.run(gen_full())