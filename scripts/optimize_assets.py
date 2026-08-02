from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MEMBER_IMAGE_ROOT = PROJECT_ROOT / "public" / "images" / "members"
OPTIMIZED_MEMBER_ROOT = MEMBER_IMAGE_ROOT / "optimized"
LOGIN_VIDEO = PROJECT_ROOT / "public" / "videos" / "login-bg.mp4"


def resized(image: Image.Image, width: int) -> Image.Image:
    if image.width <= width:
        return image.copy()

    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def optimize_member_images() -> None:
    OPTIMIZED_MEMBER_ROOT.mkdir(parents=True, exist_ok=True)

    for source in sorted(MEMBER_IMAGE_ROOT.glob("*.jpg")):
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")

        for width in (480, 960):
            variant = resized(image, width)
            variant.save(
                OPTIMIZED_MEMBER_ROOT / f"{source.stem}-{width}.webp",
                "WEBP",
                quality=82,
                method=6,
            )
            variant.save(
                OPTIMIZED_MEMBER_ROOT / f"{source.stem}-{width}.avif",
                "AVIF",
                quality=55,
            )

        fallback = resized(image, 1200)
        temporary_fallback = source.with_suffix(".optimized.jpg")
        fallback.save(
            temporary_fallback,
            "JPEG",
            quality=85,
            optimize=True,
            progressive=True,
        )
        os.replace(temporary_fallback, source)


def optimize_login_video(ffmpeg: Path) -> None:
    if not LOGIN_VIDEO.exists():
        raise FileNotFoundError(LOGIN_VIDEO)

    optimized_mp4 = LOGIN_VIDEO.with_name("login-bg.optimized.mp4")
    webm = LOGIN_VIDEO.with_suffix(".webm")
    # A short loop is enough for the login backdrop and avoids shipping the
    # original three-and-a-half-minute source on every first visit.
    scale_filter = "scale='min(960,iw)':-2:flags=lanczos,fps=24"

    subprocess.run(
        [
            str(ffmpeg), "-y", "-i", str(LOGIN_VIDEO), "-t", "45",
            "-vf", scale_filter,
            "-c:v", "libx264", "-preset", "medium", "-crf", "30",
            "-maxrate", "1M", "-bufsize", "2M",
            "-movflags", "+faststart", "-c:a", "aac", "-b:a", "64k",
            str(optimized_mp4),
        ],
        check=True,
    )
    subprocess.run(
        [
            str(ffmpeg), "-y", "-i", str(LOGIN_VIDEO), "-t", "45",
            "-vf", scale_filter,
            "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "700k",
            "-deadline", "good", "-cpu-used", "3",
            "-c:a", "libopus", "-b:a", "64k",
            str(webm),
        ],
        check=True,
    )
    os.replace(optimized_mp4, LOGIN_VIDEO)


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize the bundled login and member media.")
    parser.add_argument("--ffmpeg", type=Path, help="Optional path to ffmpeg for login video transcoding.")
    parser.add_argument("--video-only", action="store_true", help="Skip member-image generation.")
    args = parser.parse_args()

    if not args.video_only:
        optimize_member_images()
    if args.ffmpeg:
        optimize_login_video(args.ffmpeg.resolve())


if __name__ == "__main__":
    main()
