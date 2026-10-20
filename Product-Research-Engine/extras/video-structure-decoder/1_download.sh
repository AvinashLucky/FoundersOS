#!/usr/bin/env bash
# Downloads all 83 combined video links (Marketing Studio + Homepage samples)
# into ./raw_videos/. Run on your own machine — needs access to
# cdn.higgsfield.ai and *.cloudfront.net.
#
# Usage:
#   chmod +x 1_download.sh
#   ./1_download.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/raw_videos"
mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

URL_FILE="$SCRIPT_DIR/creator_dna_video_master.txt"

if command -v aria2c >/dev/null 2>&1; then
  echo "Using aria2c..."
  aria2c -i "$URL_FILE" -j 8 -x 4 -s 4 -c -d "$OUT_DIR"
elif command -v yt-dlp >/dev/null 2>&1; then
  echo "Using yt-dlp..."
  yt-dlp -a "$URL_FILE" -o "%(autonumber)03d.%(ext)s"
else
  echo "Falling back to wget..."
  n=1
  while IFS= read -r url; do
    [ -z "$url" ] && continue
    printf -v idx "%03d" "$n"
    wget -c -O "${idx}_$(basename "$url")" "$url"
    n=$((n+1))
  done < "$URL_FILE"
fi

echo "Done. Raw videos in: $OUT_DIR"
echo "Next: run 2_decode.py to extract structure (then you can delete these raw files)."
