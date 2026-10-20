# Creator DNA — Decode Pipeline (v0)

A working prototype of the idea from your notes: decode structure from many
videos, cluster the patterns, and land on ONE fixed prompt per style —
instead of storing footage or retraining a model on it.

## Pipeline

```
1_download.sh        →  raw_videos/*.mp4                    (temporary)
2_decode.py           →  decoded_notes/<name>.json + thumbnails   (structure only)
3_caption_frames.py   →  fills in style_tags + prompt_guess per video (via Claude vision)
4_build_library.py    →  creator_dna_library.jsonl + creator_dna_clusters.json
```

After step 2 finishes, **you can delete `raw_videos/`.** Everything downstream
runs on numeric structure (cut timestamps, shot lengths, pacing) plus a
handful of tiny still thumbnails per video — never the source clip.

## Setup

```bash
pip install scenedetect[opencv] anthropic --break-system-packages
brew install ffmpeg aria2      # or: sudo apt install ffmpeg aria2
export ANTHROPIC_API_KEY=sk-ant-...
```

## Run it

```bash
chmod +x 1_download.sh
./1_download.sh
python3 2_decode.py
python3 3_caption_frames.py
python3 4_build_library.py
```

## What each note looks like (`decoded_notes/<name>.json`)

```json
{
  "source_file": "042.mp4",
  "source_url": "https://cdn.higgsfield.ai/.../....mp4",
  "category": "Product motion",
  "duration_sec": 6.4,
  "fps": 30,
  "resolution": "1080x1920",
  "shot_count": 5,
  "avg_shot_len_sec": 1.28,
  "hook_time_sec": 0.6,
  "cuts_sec": [0.0, 0.6, 1.9, 3.4, 5.1],
  "pacing_curve": {"opening": 0.7, "middle": 1.4, "closing": 1.9},
  "style_tags": ["macro product shot", "whip-pan transition", "high-key lighting"],
  "prompt_guess": "A {product} on a reflective surface, macro close-up opening shot (<1s), whip-pan to a wide hero shot, high-key studio lighting, 3 quick cuts, ending on a slow hold of {product} with soft rim light",
  "prompt_guess_confidence": "medium"
}
```

## The "fixed prompt" workflow — answering your actual question

Right now, without this, you re-prompt from scratch every time and hope the
model lands on the right pacing/hook/lighting. That's the "always retrying"
problem you flagged.

With this pipeline:

1. **Cluster first.** `4_build_library.py` buckets videos by structural
   fingerprint (shot count + hook speed). Everything in one bucket shares an
   editing *shape*, even if the subjects are totally different products.
2. **Pick one prompt per cluster, not per video.** Look at the
   `prompt_guess` values inside a cluster in `creator_dna_clusters.json` —
   they'll converge on similar language. Merge them into one clean template
   with `{subject}`/`{product}` placeholders. That's your **fixed prompt**
   for that style.
3. **Validate structurally, not visually.** Generate a new video with the
   fixed prompt, run it back through `2_decode.py`, and check whether its
   `shot_count` / `hook_time_sec` land in the same bucket as the cluster it's
   supposed to match. If it drifts, adjust the prompt template — you're
   tuning against numbers, not eyeballing whether it "looks similar."
4. **Grow the library, not the model.** Every new video you decode either
   confirms an existing cluster (prompt template holds) or reveals a new one
   (time to write a new fixed prompt). No fine-tuning, no footage storage —
   just an expanding table of (structural signature → prompt template).

## Where this pipeline is intentionally rough (v0)

- **Clustering is a simple bucket rule**, not embeddings/k-means. Fine for
  proving the workflow; swap in a real clustering step once you have >200
  decoded videos and want tighter groups.
- **`prompt_guess` is an inference**, not ground truth — you don't have the
  original creator's actual prompt, only a plausible reconstruction from
  visual structure. Treat it as a starting template to tune, not a fact.
- **Only ~83 video URLs are in the starter list** — the 65 from the static
  Marketing Studio preset grid (exhaustive) plus 18 samples from the
  homepage's live community feeds (those feeds reshuffle constantly, so
  that part is illustrative, not exhaustive — point the downloader at
  `/seedance-2-5-community`, `/marketing-studio-community`, etc. directly if
  you want deeper, page-specific pulls later).
