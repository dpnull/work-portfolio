#!/usr/bin/env bash
# Right-sized derivatives of files that are ALREADY in public/. Nothing here reads a master
# and nothing existing is modified, moved or replaced: every output is a new filename.
# Needs ffmpeg built with libwebp and libx264 (cwebp is not required). Safe to re-run.
set -euo pipefail

PUB="$(cd "$(dirname "$0")/.." && pwd)/public"

# 1. Grid posters at 540w beside the 720w originals.
#    Tiles render 163-183 CSS px wide on phones and ~268 on desktop, so 540 covers a 390pt
#    iPhone at 3x (489 px) and a 2x laptop (536 px); only larger phones and wider layouts
#    still take the 720. Cut from the high-quality JPEG poster so it is the same frame.
for id in water mewing ice-face posture its-all-a-lie 530am-run unrot; do
  ffmpeg -v error -y -i "$PUB/clips/$id.jpg" -vf "scale=540:960:flags=lanczos" \
    -c:v libwebp -quality 72 -compression_level 6 "$PUB/clips/$id-540.webp"
done

# 2. Cover portrait at 600w beside the 800w. The print is 168-276 CSS px wide, so 600 covers
#    every 1x and 2x screen (552 px at most); 3x phones need 699 px and keep the 800.
ffmpeg -v error -y -i "$PUB/hero-portrait-m.jpg" -vf "scale=600:800:flags=lanczos" \
  -c:v libwebp -quality 80 -compression_level 6 "$PUB/hero-portrait-m-600.webp"

# 3. Cover reel. The print shows it 94-160 CSS px wide: 320 px on a 2x laptop, 411 px on a
#    3x phone, so 432x768 still oversamples every screen (360x640 measured soft on phones
#    and in the small overlay type). The 540x960 original stays for pages that show it larger.
#    Its first frame is the poster, so there is no jump when the video starts.
ffmpeg -v error -y -i "$PUB/clips/about-preview.mp4" -an -vf "scale=432:768:flags=lanczos" \
  -c:v libx264 -profile:v high -crf 26 -preset slow -pix_fmt yuv420p -g 60 \
  -movflags +faststart "$PUB/clips/about-preview-432.mp4"
# The poster is on screen only until the first frame decodes, so it stays at 360x640.
ffmpeg -v error -y -i "$PUB/clips/about-preview.mp4" -frames:v 1 -vf "scale=360:640:flags=lanczos" \
  -c:v libwebp -quality 62 -compression_level 6 "$PUB/clips/about-preview-poster.webp"

echo
ls -l "$PUB"/clips/*-540.webp "$PUB"/hero-portrait-m-600.webp "$PUB"/clips/about-preview-432.mp4 "$PUB"/clips/about-preview-poster.webp \
  | awk '{printf "%8.1f KB  %s\n", $5/1024, $9}'
