#!/usr/bin/env python3
"""
3_caption_frames.py — Fills in style_tags + prompt_guess for each decoded video
by showing its shot thumbnails to a vision-capable Claude model.

This is the "why it worked" layer on top of the "how it's shaped" structure
from step 2. It never sees or sends the original video file — only a handful
of small still thumbnails already extracted to decoded_notes/<name>_frames/.

Setup:
  pip install anthropic --break-system-packages
  export ANTHROPIC_API_KEY=sk-ant-...

Usage:
  python3 3_caption_frames.py
"""

import base64
import json
import os
from pathlib import Path

import anthropic

OUT_DIR = Path(__file__).parent / "decoded_notes"
MAX_FRAMES_PER_VIDEO = 6  # keep the prompt small; sample evenly across shots

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

SYSTEM_PROMPT = """You analyze short marketing/creative video STILL FRAMES to reverse-engineer
the *structural recipe* behind the edit — not to describe or reproduce any specific
copyrighted content. Focus only on transferable, style-level pattern: shot types,
lighting/color mood, subject framing, implied camera movement between frames, and
pacing feel. Then propose a generic, reusable text-to-video PROMPT TEMPLATE that
could recreate a video with this same structural style using a *different, original
subject* the user supplies later (use a placeholder like {subject} and {product}).

Respond ONLY with JSON:
{
  "style_tags": ["3-6 short tags, e.g. 'macro product shot', 'whip-pan transition', 'high-key lighting'"],
  "prompt_guess": "a single reusable prompt template with {subject}/{product} placeholders",
  "confidence": "low | medium | high"
}"""


def load_images_for(note_path: Path):
    frames_dir = OUT_DIR / f"{note_path.stem}_frames"
    if not frames_dir.exists():
        return []
    frames = sorted(frames_dir.glob("shot_*.jpg"))
    if not frames:
        return []
    # sample evenly if there are more than MAX_FRAMES_PER_VIDEO
    if len(frames) > MAX_FRAMES_PER_VIDEO:
        step = len(frames) / MAX_FRAMES_PER_VIDEO
        frames = [frames[int(i * step)] for i in range(MAX_FRAMES_PER_VIDEO)]
    return frames


def caption_video(note_path: Path):
    frames = load_images_for(note_path)
    if not frames:
        return None

    content = []
    for fp in frames:
        b64 = base64.b64encode(fp.read_bytes()).decode()
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
        })
    content.append({
        "type": "text",
        "text": "These are ordered shot-start thumbnails from one short video. "
                "Return the JSON described in your instructions.",
    })

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )
    text = "".join(b.text for b in resp.content if b.type == "text")
    text = text.strip().strip("`").replace("json\n", "", 1)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"style_tags": [], "prompt_guess": None, "confidence": "low", "raw": text}


def main():
    note_files = sorted(OUT_DIR.glob("*.json"))
    if not note_files:
        print(f"No decoded notes found in {OUT_DIR}. Run 2_decode.py first.")
        return

    for i, note_path in enumerate(note_files, 1):
        note = json.loads(note_path.read_text())
        if note.get("prompt_guess"):
            continue  # already captioned
        print(f"[{i}/{len(note_files)}] {note_path.name}")
        result = caption_video(note_path)
        if result:
            note["style_tags"] = result.get("style_tags", [])
            note["prompt_guess"] = result.get("prompt_guess")
            note["prompt_guess_confidence"] = result.get("confidence")
            note_path.write_text(json.dumps(note, indent=2))
        else:
            print("  no frames found, skipped")

    print("\nDone. Every note now has style_tags + a reusable prompt_guess.")
    print("Next: run 4_build_library.py to merge everything into one searchable library.")


if __name__ == "__main__":
    main()
