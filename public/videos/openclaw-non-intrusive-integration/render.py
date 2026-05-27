#!/usr/bin/env python3
"""Directly import playwright from venv and capture frames."""
import sys, os, time, threading, http.server, asyncio, subprocess
from pathlib import Path

sys.path.insert(0, '/home/admin/.hermes/hermes-agent/venv/lib/python3.11/site-packages')

PROJECT = Path("/home/admin/tech-blog/public/videos/openclaw-non-intrusive-integration")
HTML = PROJECT / "index.html"
OUT_MP4 = PROJECT / "openclaw-non-intrusive-integration.mp4"

FRAMES = [
    (0.0,  "s1_start"), (2.5,  "s1_blocks"),
    (6.0,  "s2_start"), (8.5,  "s2_lanes"),
    (14.0, "s3_start"), (16.5, "s3_pillars"),
    (21.0, "s4_start"), (23.5, "s4_cards"),
    (28.0, "s5_start"), (30.5, "s5_rings"),
    (35.0, "s6_start"), (37.5, "s6_hold"), (40.0, "s6_end"),
]
SEG_DUR = 3.5
TOTAL = 41

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ERR cmd: {cmd[:60]}")
    return r.returncode == 0

def http_server():
    os.chdir(PROJECT)
    h = http.server.SimpleHTTPRequestHandler
    h.log_message = lambda *a: None
    s = http.server.HTTPServer(("127.0.0.1", 7893), h)
    t = threading.Thread(target=s.serve_forever, daemon=True)
    t.start()
    time.sleep(0.4)
    return s

def capture():
    from playwright.async_api import async_playwright

    async def main():
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1920, "height": 1080})

            try:
                await page.goto('http://127.0.0.1:7893/index.html',
                               wait_until='networkidle', timeout=20000)
                print("Page loaded OK")
            except Exception as e:
                print(f"GOTO_ERR: {e}")
                await browser.close()
                return False

            await page.wait_for_timeout(2500)

            try:
                await page.wait_for_function('typeof window.gsap !== "undefined"', timeout=8000)
                print("GSAP ready")
            except Exception as e:
                print(f"GSAP_ERR: {e}")

            ok_frames = 0
            for t, label in FRAMES:
                try:
                    await page.evaluate(f'(tt) => {{ window.gsap.globalTimeline.time(tt) }}', t)
                    await page.wait_for_timeout(600)
                    buf = await page.screenshot(
                        type='png', timeout=15000
                    )
                    out = PROJECT / f"_frame_{label}.png"
                    with open(out, 'wb') as f:
                        f.write(buf)
                    print(f"  Captured {label} ({len(buf)//1024}KB)")
                    ok_frames += 1
                except Exception as e:
                    print(f"  FRAME_ERR {label}: {e}")

            await browser.close()
            print(f"DONE {ok_frames}/{len(FRAMES)} frames")
            return ok_frames > 0

    return asyncio.run(main())

def segments():
    segs = []
    for _, label in FRAMES:
        png = PROJECT / f"_frame_{label}.png"
        if not png.exists():
            continue
        mp4 = PROJECT / f"_seg_{label}.mp4"
        # Write filtergraph to temp file to avoid shell quoting issues
        vf = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"
        cmd = [
            "ffmpeg", "-y", "-loop", "1", "-i", str(png), "-t", str(SEG_DUR),
            "-vf", vf, "-r", "30", "-c:v", "libx264", "-preset", "fast",
            "-pix_fmt", "yuv420p", str(mp4)
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print(f"  ffmpeg err {label}: {r.stderr[:80]}")
        elif mp4.exists():
            segs.append(str(mp4))
    return segs

def assemble(segs):
    if not segs:
        return
    txt = PROJECT / "_concat.txt"
    txt.write_text("\n".join(f"file '{s}'" for s in segs))
    raw = PROJECT / "_raw.mp4"
    r = subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(txt), "-c", "copy", str(raw)], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  concat err: {r.stderr[:80]}")
    r = subprocess.run(["ffmpeg", "-y", "-i", str(raw),
                       "-vf", f"fade=t=in:st=0:d=1,fade=t=out:st={TOTAL-2}:d=1.5",
                       "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", str(OUT_MP4)],
                      capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  fade err: {r.stderr[:80]}")
    for f in [txt, raw]:
        try:
            f.unlink()
        except:
            pass
    for f in list(PROJECT.glob("_frame_*.png")) + list(PROJECT.glob("_seg_*.mp4")):
        f.unlink()

def main():
    print("[1/3] HTTP + Playwright capture...")
    srv = http_server()
    ok = capture()
    srv.shutdown()

    print("[2/3] Building segments...")
    segs = segments()
    print(f"  {len(segs)} segments.")

    if segs:
        print("[3/3] Assembling...")
        assemble(segs)

    if OUT_MP4.exists():
        kb = OUT_MP4.stat().st_size // 1024
        print(f"\n  OK: {OUT_MP4} ({kb} KB)")
    else:
        print("\n  FAIL: no output")

if __name__ == "__main__":
    main()