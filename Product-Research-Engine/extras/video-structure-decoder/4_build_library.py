#!/usr/bin/env python3
"""
4_build_library.py — Merges every decoded_notes/*.json into one
creator_dna_library.jsonl, re-attaches the original source URL, and groups
videos into rough structural clusters so you can pick ONE fixed prompt
template per cluster instead of re-deriving one every time.

Clustering here is intentionally simple (bucket by shot_count + hook_time) —
a starting point, not a final answer. Swap in embeddings/k-means later if you
want tighter clusters; the point of this step is just to prove the workflow:
  decode -> caption -> cluster -> pick one representative prompt per cluster
  -> validate by comparing a NEW render's decoded structure to the cluster,
     not by comparing pixels/footage.

Usage:
  python3 4_build_library.py
"""

import json
from pathlib import Path
from collections import defaultdict

NOTES_DIR = Path(__file__).parent / "decoded_notes"
MASTER_LIST = Path(__file__).parent / "creator_dna_video_master.json"
LIBRARY_OUT = Path(__file__).parent / "creator_dna_library.jsonl"
CLUSTERS_OUT = Path(__file__).parent / "creator_dna_clusters.json"


def shot_bucket(count):
    if count is None:
        return "unknown"
    if count <= 3:
        return "few_cuts"
    if count <= 8:
        return "moderate_cuts"
    return "many_cuts"


def hook_bucket(sec):
    if sec is None:
        return "unknown"
    if sec <= 1.0:
        return "instant_hook"
    if sec <= 3.0:
        return "fast_hook"
    return "slow_build"


def main():
    url_by_filename = {}
    if MASTER_LIST.exists():
        for entry in json.loads(MASTER_LIST.read_text()):
            url_by_filename[Path(entry["url"]).name] = entry

    notes = []
    for note_path in sorted(NOTES_DIR.glob("*.json")):
        note = json.loads(note_path.read_text())
        # try to reattach the original URL/category by matching the downloaded filename
        matched = None
        for fname, entry in url_by_filename.items():
            if fname in note.get("source_file", ""):
                matched = entry
                break
        if matched:
            note["source_url"] = matched["url"]
            note["category"] = matched["category"]
            note["name"] = matched["name"]
        notes.append(note)

    with open(LIBRARY_OUT, "w") as f:
        for n in notes:
            f.write(json.dumps(n) + "\n")

    clusters = defaultdict(list)
    for n in notes:
        key = f'{shot_bucket(n.get("shot_count"))}__{hook_bucket(n.get("hook_time_sec"))}'
        clusters[key].append({
            "name": n.get("name") or n.get("source_file"),
            "source_url": n.get("source_url"),
            "prompt_guess": n.get("prompt_guess"),
            "style_tags": n.get("style_tags"),
        })

    cluster_summary = {}
    for key, members in clusters.items():
        prompt_guesses = [m["prompt_guess"] for m in members if m["prompt_guess"]]
        cluster_summary[key] = {
            "member_count": len(members),
            "members": members,
            "suggested_fixed_prompt": prompt_guesses[0] if prompt_guesses else None,
            "note": "Pick/merge one prompt_guess from this cluster as your fixed "
                     "template for this structural style. Validate new generations "
                     "by re-running 2_decode.py on the output and checking its "
                     "shot_count/hook_time land in this same bucket.",
        }

    with open(CLUSTERS_OUT, "w") as f:
        json.dump(cluster_summary, f, indent=2)

    print(f"Library written: {LIBRARY_OUT}  ({len(notes)} videos)")
    print(f"Clusters written: {CLUSTERS_OUT}  ({len(cluster_summary)} clusters)")
    for key, c in cluster_summary.items():
        print(f"  - {key}: {c['member_count']} videos")


if __name__ == "__main__":
    main()
