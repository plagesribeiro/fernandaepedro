"""Generate favicon files from chrysanthemum-hero.png with rounded corners and white bg."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "hero" / "chrysanthemum-hero.png"
APP_DIR = ROOT / "src" / "app"


def prepare_subject(source: Image.Image, padding_ratio: float = 0.08) -> Image.Image:
    """Crop to the non-transparent subject bbox, center it on a square canvas with padding."""
    art = source.convert("RGBA")
    bbox = art.split()[-1].getbbox()  # alpha channel bbox
    art = art.crop(bbox)

    side = max(art.size)
    pad = int(side * padding_ratio)
    canvas_side = side + pad * 2
    square = Image.new("RGBA", (canvas_side, canvas_side), (255, 255, 255, 0))
    offset = ((canvas_side - art.size[0]) // 2, (canvas_side - art.size[1]) // 2)
    square.paste(art, offset, art)
    return square


def rounded_icon(prepared: Image.Image, size: int, radius_ratio: float = 0.22) -> Image.Image:
    """Return a square RGBA icon with white bg and rounded corners from a prepared subject."""
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    art = prepared.resize((size, size), Image.LANCZOS)
    canvas = Image.alpha_composite(canvas, art)

    radius = int(size * radius_ratio)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    canvas.putalpha(mask)
    return canvas


def main() -> None:
    src = Image.open(SRC)
    prepared = prepare_subject(src)

    # Next.js app router conventions
    # icon.png -> small favicon, apple-icon.png -> iOS home screen
    sizes = {
        "icon.png": 64,           # Next.js will reference this for <link rel="icon">
        "apple-icon.png": 180,    # iOS
    }
    for name, size in sizes.items():
        out = rounded_icon(prepared, size)
        out.save(APP_DIR / name, format="PNG", optimize=True)
        print(f"wrote {APP_DIR / name} ({size}x{size})")

    # favicon.ico with multiple embedded sizes
    ico_sizes = [16, 32, 48, 64]
    ico_images = [rounded_icon(prepared, s) for s in ico_sizes]
    ico_path = APP_DIR / "favicon.ico"
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )
    print(f"wrote {ico_path} (sizes: {ico_sizes})")


if __name__ == "__main__":
    main()
