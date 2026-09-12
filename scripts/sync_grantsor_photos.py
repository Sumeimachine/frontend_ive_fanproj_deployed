"""Rebuild the permitted GrantSor photo derivatives from their original X media.

Run from any directory with Python and Pillow installed:
    python scripts/sync_grantsor_photos.py

Downloads are held in memory. Only proportional WebP derivatives are retained;
no cropping, watermark removal, generative editing, or color grading is applied.
HTTP failures, unexpected image dimensions, or invalid output terminate the run.
See public/images/grantsor/CREDITS.md for permission and source provenance.
"""

from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public/images/grantsor"
WIDTHS = (480, 960, 1600)
# Slug, original X media ID, original pixel width, original pixel height.
SOURCES = (
    ("yujin-gaeul-roses", "GXSYFuZawAAOivR", 4096, 2731),
    ("yujin-peace", "GSjE0xRbIAIhQ_N", 2731, 4096),
    ("gaeul-heart", "GStX13bboAA1HZx", 2731, 4096),
    ("rei-peace", "GTdKtYbaMAAcw1J", 2730, 4096),
    ("wonyoung-flower-crown", "GSjhDmlacAE4L5G", 2730, 4096),
    ("liz-peace", "GTKX-mEbkAAcPDA", 2731, 4096),
    ("leeseo-tiger", "GS8FDz2bIAY-oz4", 2731, 4096),
)


def sync_photo(source: tuple[str, str, int, int]) -> tuple[str, int]:
    slug, media_id, original_width, original_height = source
    url = f"https://pbs.twimg.com/media/{media_id}?format=jpg&name=orig"
    request = Request(url, headers={"User-Agent": "DiveIntoIVE-photo-sync/1.0"})
    with urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected HTTP {response.status} for {url}")
        if response.headers.get_content_type() != "image/jpeg":
            raise RuntimeError(f"Expected JPEG content for {url}")
        original = response.read()

    total_bytes = 0
    with Image.open(BytesIO(original)) as downloaded:
        downloaded.load()
        if downloaded.size != (original_width, original_height):
            raise ValueError(f"Unexpected source dimensions for {slug}: {downloaded.size}")
        with downloaded.convert("RGB") as frame:
            for width in WIDTHS:
                height = round(original_height * width / original_width)
                path = OUTPUT_DIR / f"{slug}-{width}.webp"
                with frame.resize((width, height), Image.Resampling.LANCZOS) as variant:
                    variant.save(path, format="WEBP", quality=84, method=6)
                with Image.open(path) as verified:
                    if verified.format != "WEBP" or verified.size != (width, height):
                        raise ValueError(f"Invalid derivative: {path}")
                    verified.verify()
                total_bytes += path.stat().st_size
    return slug, total_bytes


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(sync_photo, SOURCES))
    for slug, size in results:
        print(f"{slug}: {len(WIDTHS)} full-frame variants, {size:,} bytes")
    print(f"Verified {len(SOURCES) * len(WIDTHS)} WebP files ({sum(size for _, size in results):,} bytes).")


if __name__ == "__main__":
    main()
