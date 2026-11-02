"""Generate responsive image assets without modifying originals (requires Pillow)."""

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "pics" / "optimized"
ASSETS = {
    "self": ("pics/self.jpg", (160, 320, 640)),
    "realcustom": ("pics/teaser_realcustom.jpg", (480, 960, 1280, 1592)),
    "uxo": ("pics/uxo_logo.jpg", (480, 960, 1280, 1920)),
    "lance": ("pics/lance.png", (480, 960, 1280, 1920)),
    "uno-logo": ("pics/logos/uno.jpg", (128,)),
    "uso-logo": ("pics/logos/uso.jpg", (128,)),
    "umo-logo": ("pics/logos/umo.jpg", (128,)),
}


def describe(path, width):
    data = path.read_bytes()
    version = hashlib.sha256(data).hexdigest()[:12]
    return {
        "width": width,
        "url": f"{path.relative_to(ROOT).as_posix()}?v={version}",
        "bytes": len(data),
    }


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name, (source, widths) in ASSETS.items():
        with Image.open(ROOT / source) as original:
            profile = original.info.get("icc_profile")
            oriented = ImageOps.exif_transpose(original)
            image = oriented.convert("RGBA" if "A" in oriented.getbands() else "RGB")
            metadata = {"icc_profile": profile} if profile else {}
            variants = []
            for width in widths:
                size = (width, round(image.height * width / image.width))
                resized = image.resize(size, Image.Resampling.LANCZOS)
                path = OUTPUT / f"{name}-{width}.webp"
                resized.save(path, "WEBP", quality=92, method=6, **metadata)
                variants.append(describe(path, width))
            fallback = OUTPUT / f"{name}-{widths[-1]}.jpg"
            jpeg = resized
            if resized.mode == "RGBA":
                jpeg = Image.new("RGB", resized.size, "white")
                jpeg.paste(resized, mask=resized.getchannel("A"))
            jpeg.save(
                fallback, "JPEG", quality=92, subsampling=0,
                progressive=True, optimize=True, **metadata,
            )
            manifest[name] = {
                "original": source,
                "original_bytes": (ROOT / source).stat().st_size,
                "variants": variants,
                "fallback": describe(fallback, widths[-1]),
            }
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
