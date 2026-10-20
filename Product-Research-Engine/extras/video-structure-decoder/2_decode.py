#!/usr/bin/env python3
"""
2_decode.py — Structural decoder for Creator DNA.

For every video in ./raw_videos/, this extracts STRUCTURE only:
  - duration, fps, resolution
  - scene-cut timestamps (shot boundaries)
  - shot count, average/median shot length
  - "hook time" = timestamp of the first cut (how fast the opening moves)
  - pacing curve (shot length over time — front-loaded vs. even vs. back-loaded)
  - one small keyframe thumbnail per shot (for later captioning — NOT the clip itself)

Output: ./decoded_notes/<name>.json  (one structural note per video)
Thumbnails: ./decoded_notes/<name>_frames/shot_00.jpg, shot_01.jpg, ...

This never stores the source clip or a re-encoded copy of it — only numeric
structure + small still thumbnails, which is what the "keep structure, not
footage" design in your notes is asking for. After this runs, you can safely
delete raw_videos/.

Requirements:
  pip install scenedetect[opencv] --break-system-packages
  ffmpeg must be installed and on PATH (for thumbnail extraction + fallback probing)
"""

import json
import os
import statistics
import subprocess
import sys
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw_videos"
OUT_DIR = Path(__file__).parent / "decoded_notes"
OUT_DIR.mkdir(exist_ok=True)


def ffprobe_meta(path):
    """Pull duration/fps/resolution via ffprobe (technical metadata only)."""
    cmd = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,duration",
        "-show_entries", "format=duration",
        "-of", "json", str(path),
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data = json.loads(out.stdout)
        stream = (data.get("streams") or [{}])[0]
        fmt = data.get("format", {})
        duration = float(stream.get("duration") or fmt.get("duration") or 0)
        fr = stream.get("r_frame_rate", "0/1")
        num, den = (fr.split("/") + ["1"])[:2]
        fps = round(float(num) / float(den or 1), 2) if float(den or 1) else 0
        return {
            "duration_sec": round(duration, 2),
            "fps": fps,
            "width": stream.get("width"),
            "height": stream.get("height"),
        }
    except Exception as e:
        return {"error": f"ffprobe failed: {e}"}


def detect_scenes(path):
    """Return list of (start_sec, end_sec) shot boundaries using PySceneDetect."""
    from scenedetect import open_video, SceneManager
    from scenedetect.detectors import ContentDetector

    video = open_video(str(path))
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=27.0))
    scene_manager.detect_scenes(video)
    scene_list = scene_manager.get_scene_list()
    return [(s.get_seconds(), e.get_seconds()) for s, e in scene_list]


def extract_thumbnail(path, timestamp_sec, out_path):
    cmd = [
        "ffmpeg", "-y", "-ss", str(max(timestamp_sec, 0)), "-i", str(path),
        "-frames:v", "1", "-q:v", "3", str(out_path),
    ]
    subprocess.run(cmd, capture_output=True, timeout=30)


def pacing_curve(scenes):
    """Bucket shot lengths into thirds of the video to see front/mid/back pacing."""
    if not scenes:
        return {}
    total = scenes[-1][1]
    thirds = {"opening": [], "middle": [], "closing": []}
    for start, end in scenes:
        length = end - start
        pos = start / total if total else 0
        if pos < 0.33:
            thirds["opening"].append(length)
        elif pos < 0.66:
            thirds["middle"].append(length)
        else:
            thirds["closing"].append(length)
    return {
        k: round(statistics.mean(v), 2) if v else None
        for k, v in thirds.items()
    }


def decode_one(path: Path):
    name = path.stem
    frames_dir = OUT_DIR / f"{name}_frames"
    frames_dir.mkdir(exist_ok=True)

    meta = ffprobe_meta(path)

    try:
        scenes = detect_scenes(path)
    except Exception as e:
        scenes = []
        meta["scene_detect_error"] = str(e)

    shot_lengths = [round(e - s, 2) for s, e in scenes]
    note = {
        "source_file": path.name,
        "source_url": None,  # filled in by 3_build_library.py from the master list
        "duration_sec": meta.get("duration_sec"),
        "fps": meta.get("fps"),
        "resolution": f'{meta.get("width")}x{meta.get("height")}' if meta.get("width") else None,
        "shot_count": len(scenes),
        "avg_shot_len_sec": round(statistics.mean(shot_lengths), 2) if shot_lengths else None,
        "median_shot_len_sec": round(statistics.median(shot_lengths), 2) if shot_lengths else None,
        "hook_time_sec": round(shot_lengths[0], 2) if shot_lengths else None,  # length of first shot
        "cuts_sec": [round(s, 2) for s, _ in scenes],
        "pacing_curve": pacing_curve(scenes),
        # These two are intentionally left for a human or a vision-LLM pass —
        # structure alone can't tell you *why* it worked, only *how it's shaped*.
        "style_tags": [],
        "prompt_guess": None,
        "prompt_guess_confidence": None,
    }

    # Save one thumbnail per shot start (for the captioning step)
    for i, (start, _) in enumerate(scenes):
        extract_thumbnail(path, start + 0.15, frames_dir / f"shot_{i:02d}.jpg")

    with open(OUT_DIR / f"{name}.json", "w") as f:
        json.dump(note, f, indent=2)

    return note


def main():
    videos = sorted([p for p in RAW_DIR.glob("*") if p.suffix.lower() in (".mp4", ".mov", ".webm")])
    if not videos:
        print(f"No videos found in {RAW_DIR}. Run 1_download.sh first.")
        sys.exit(1)

    print(f"Decoding {len(videos)} videos...")
    for i, path in enumerate(videos, 1):
        print(f"[{i}/{len(videos)}] {path.name}")
        try:
            decode_one(path)
        except Exception as e:
            print(f"  FAILED: {e}")

    print(f"\nDone. Structural notes in: {OUT_DIR}")
    print("Next: run 3_caption_frames.py to add style_tags + prompt_guess via a vision model.")


if __name__ == "__main__":
    main()
