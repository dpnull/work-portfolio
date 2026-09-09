#!/usr/bin/env bash
# Encode work-grid tiles from the masters in ~/Documents/dpy2k-Portfolio-videos.
# Masters are NEVER moved or modified — this only writes derivatives into public/clips/.
# Re-run after changing a CUT line below; then update src/data/clips.json if ids change.
set -euo pipefail

SRC_DIR="${SRC_DIR:-$HOME/Documents/dpy2k-Portfolio-videos}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/clips"
mkdir -p "$OUT"

# id|source file (relative to SRC_DIR)|start seconds|duration seconds
CUTS=(
  "glow-up|0131-copy.mov|0|12"
  "mouth-taping|0405 (1)(1).mov|0|12"
  "posture|0401.mov|0|12"
  "rednote-potassium|rednote vids/rednote — potassium maxxing.mov|0|12"
)

for row in "${CUTS[@]}"; do
  IFS='|' read -r id file ss dur <<<"$row"
  src="$SRC_DIR/$file"
  [ -f "$src" ] || { echo "MISSING: $src" >&2; exit 1; }
  echo "→ $id  (${dur}s from ${ss}s)"

  # -ss before -i seeks fast; re-encode guarantees a keyframe at the cut point.
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$src" \
    -an -vf "scale=720:1280:flags=lanczos" \
    -c:v libx264 -profile:v high -crf 25 -preset slow -pix_fmt yuv420p \
    -g 60 -movflags +faststart "$OUT/$id.mp4"

  # Poster is the cut's first frame, so there is no jump when the video swaps in.
  ffmpeg -v error -y -ss "$ss" -i "$src" -frames:v 1 \
    -vf "scale=720:1280:flags=lanczos" -q:v 4 "$OUT/$id.jpg"
  ffmpeg -v error -y -ss "$ss" -i "$src" -frames:v 1 \
    -vf "scale=720:1280:flags=lanczos" -quality 72 "$OUT/$id.webp"
done

echo
ls -la "$OUT" | awk 'NR>3 {printf "%8.2f MB  %s\n", $5/1048576, $9}'
