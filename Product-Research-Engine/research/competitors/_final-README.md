# Avion Competitive Intelligence Hub
**Version**: 1.0 | **Date**: 2026-08-12

This folder is the cross-competitor synthesis layer — the output of Track 6 (Master Competitive Intelligence Mission).

## Files In This Hub

| File | Purpose | Status |
|---|---|---|
| `FINAL-AVION-RESEARCH.md` | Master cross-competitor analysis — start here | ✅ Complete |
| `competitor-matrix.json` | Feature-by-feature comparison JSON (machine + human readable) | ✅ Complete |
| `00-README.md` | This file | ✅ |

## Per-Competitor Intelligence (5-Layer)

Each competitor folder (`../higgsfield/`, `../openart/`, `../heygen/`, `../kling/`, `../runway/`, `../invideo/`) contains:

```
intelligence/
  L1-ui-map.md           Layer 1: Surface / UI (nav, elements, states)
  L1-ui-map.json         Machine-readable L1
  L2-behavior-map.md     Layer 2: Interaction / Behavior (requires crawl run)
  L2-behavior-map.json   Machine-readable L2
  L3-network-map.md      Layer 3: Network / API endpoints (requires --network flag)
  L3-network-map.json    Machine-readable L3
  L4-content-intelligence.md  Layer 4: Content / Templates / Presets / Trend system
  L4-template-map.json   Machine-readable preset catalog
  L5-synthesis.md        Layer 5: Strategic synthesis + Avion implications
```

## Crawl Commands (Run in Terminal)

```bash
# MANDATORY — Kling captured wrong URL, must re-run
node research/explorers/crawl.js kling --auth

# Recommended — new sections added (A08+)
node research/explorers/crawl.js higgsfield --auth
node research/explorers/crawl.js heygen --auth
node research/explorers/crawl.js openart --auth

# Layer 3 capture (add --network to any auth run)
node research/explorers/crawl.js kling --auth --network
node research/explorers/crawl.js higgsfield --auth --network
```

## Layer Completion Status

| Competitor | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| Higgsfield | ✅ | Stub | Stub | ✅ | ✅ |
| OpenArt | ✅ | Stub | Stub | ✅ | ✅ |
| HeyGen | ✅ | Stub | Stub | ✅ | ✅ |
| Kling | ✅ App data | Stub | Stub | ✅ 70+ presets | ✅ |
| Runway | ✅ Public | Stub | Stub | ✅ | ✅ |
| InVideo | ✅ 145+ models | Stub | Stub | ✅ | ✅ |

L2 (Behavior) and L3 (Network) require crawl runs with `--network` flag to populate.
