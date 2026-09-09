#!/usr/bin/env bash
# Encode FULL-LENGTH, WITH SOUND versions of Dom's picks for the work grid.
# Masters are NEVER moved or modified — this only writes derivatives into
# public/clips/. Companion to encode-clips.sh, which cuts silent 12s loops;
# this one keeps the whole edit and its audio, because the grid now shows the
# work rather than a teaser of it (Dom, 2026-09-08).
#
# 1080x1920, not 720x1280: these are the pieces a brand judges the edit on, and
# the grade and the motion-graphics type do not survive 720.
#
# -maxrate 3.5M is not a quality choice, it is a DEPLOY choice. Cloudflare Pages
# refuses any single asset over 25 MiB, so the cap keeps the longest clip (Water,
# 54s) at roughly 20 MB with headroom. If a future clip runs much past 60s it
# cannot be self-hosted at this quality — that is the point where the library
# moves to Cloudflare Stream or Mux (clips.json already carries muxPlaybackId
# alongside src so the swap is a data edit).
set -euo pipefail

SRC_DIR="${SRC_DIR:-$HOME/Documents/dpy2k-Portfolio-videos}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/clips"
mkdir -p "$OUT"

# id|source file (relative to SRC_DIR)|poster timestamp (seconds into the clip)
FEATURES=(
  "water|Water.MOV|1"
  "mewing|Mewing.MOV|1"
  "ice-face|Ice Face.mov|1"
  "posture|Posture.mp4|20"
  "its-all-a-lie|It's all a lie—Cinematic.mp4|20"
)

for row in "${FEATURES[@]}"; do
  IFS='|' read -r id file pt <<<"$row"
  src="$SRC_DIR/$file"
  [ -f "$src" ] || { echo "MISSING: $src" >&2; exit 1; }
  echo "→ $id"

  ffmpeg -v error -y -i "$src" \
    -vf "scale='min(1080,iw)':-2:flags=lanczos" \
    -c:v libx264 -profile:v high -crf 23 -preset medium -pix_fmt yuv420p \
    -maxrate 3.5M -bufsize 7M -g 60 \
    -c:a aac -b:a 128k -ac 2 \
    -movflags +faststart "$OUT/$id.mp4"

  # Poster a second in — frame zero is black or mid-fade on most of these.
  ffmpeg -v error -y -ss "$pt" -i "$src" -frames:v 1 \
    -vf "scale=720:1280:flags=lanczos" -q:v 4 "$OUT/$id.jpg"
  ffmpeg -v error -y -ss "$pt" -i "$src" -frames:v 1 \
    -vf "scale=720:1280:flags=lanczos" -quality 72 "$OUT/$id.webp"
done

echo
for row in "${FEATURES[@]}"; do
  IFS='|' read -r id _ _ <<<"$row"
  printf "%-16s %7.2f MB  %ss\n" "$id" \
    "$(echo "scale=2; $(stat -f%z "$OUT/$id.mp4") / 1048576" | bc)" \
    "$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUT/$id.mp4" | cut -d. -f1)"
done
