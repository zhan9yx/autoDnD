#!/usr/bin/env python3
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description="Slice a ChatGPT image generation sprite sheet into transparent project assets.")
    parser.add_argument("--input", required=True, help="Source sprite sheet image.")
    parser.add_argument("--out-dir", required=True, help="Output directory for sliced assets.")
    parser.add_argument("--group", required=True, help="Manifest group, for example generated-icons.")
    parser.add_argument("--prefix", required=True, help="Asset id prefix.")
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--manifest", default="assets/generated/manifest.json")
    parser.add_argument("--source-kind", default="chatgpt-image-generation")
    parser.add_argument("--sheet-id", default=None)
    parser.add_argument("--sheet-name", default=None)
    parser.add_argument("--category-id", default="generated")
    parser.add_argument("--asset-type", default="raster")
    parser.add_argument("--prompt-id", default=None)
    parser.add_argument("--prompt", default="")
    parser.add_argument("--names", default="", help="Comma-separated asset names. Defaults to generated ids.")
    parser.add_argument("--chroma-key", action="store_true", help="Remove green chroma-key background before slicing.")
    parser.add_argument("--replace", action="store_true", help="Replace the manifest instead of appending this sheet.")
    parser.add_argument("--threshold", type=int, default=70)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = Path(args.manifest)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    source_hash = sha256_file(Path(args.input))
    prompt_id = args.prompt_id or args.prefix
    sheet_id = args.sheet_id or f"{args.prefix}-sheet-001"
    sheet_name = args.sheet_name or titleize(sheet_id)
    names = [name.strip() for name in args.names.split(",") if name.strip()]
    license_payload = {
        "id": "chatgpt-image-generation",
        "name": "ChatGPT image generation output",
        "usage": "AIDM raster marketplace sprites and scene cards."
    }
    base_provenance = {
        "source": "ChatGPT image generation",
        "generator": args.source_kind,
        "promptId": prompt_id,
        "prompt": args.prompt,
        "sourceSheet": str(args.input),
        "sourceSha256": source_hash,
        "generatedAt": generated_at
    }

    tile_width = source.width // args.cols
    tile_height = source.height // args.rows
    assets = []
    asset_ids = []

    for row in range(args.rows):
        for col in range(args.cols):
            index = row * args.cols + col + 1
            asset_id = f"{args.prefix}-{index:02d}"
            asset_name = names[index - 1] if index - 1 < len(names) else titleize(asset_id)
            crop = source.crop((col * tile_width, row * tile_height, (col + 1) * tile_width, (row + 1) * tile_height))
            prepared = remove_chroma_key(crop, args.threshold) if args.chroma_key else crop
            trimmed = normalize_tile(prepared)
            png_path = out_dir / f"{asset_id}.png"
            svg_path = out_dir / f"{asset_id}.svg"
            trimmed.save(png_path)
            svg_path.write_text(render_svg_wrapper(asset_id, png_path.name, trimmed.width, trimmed.height), encoding="utf8")
            asset_ids.append(asset_id)
            assets.append({
                "id": asset_id,
                "name": asset_name,
                "group": args.group,
                "categoryId": args.category_id,
                "assetType": args.asset_type,
                "type": "raster-icon" if args.asset_type == "raster" else args.asset_type,
                "file": str(png_path),
                "svgFile": str(svg_path),
                "sheetId": sheet_id,
                "frame": {
                    "x": col * tile_width,
                    "y": row * tile_height,
                    "width": tile_width,
                    "height": tile_height
                },
                "index": index - 1,
                "sourceSheet": str(args.input),
                "provenance": {
                    **base_provenance,
                    "assetId": asset_id,
                    "row": row,
                    "col": col
                },
                "license": license_payload,
                "tags": [args.group, args.prefix, "imagegen", "transparent" if args.chroma_key else "scene-card"]
            })

    sheet_payload = {
        "id": sheet_id,
        "name": sheet_name,
        "categoryId": args.category_id,
        "assetType": "raster-sheet",
        "file": str(args.input),
        "format": "png",
        "dimensions": {"width": source.width, "height": source.height},
        "tile": {"width": tile_width, "height": tile_height, "columns": args.cols, "rows": args.rows},
        "assetIds": asset_ids,
        "license": license_payload,
        "provenance": base_provenance
    }

    payload = empty_manifest(args.source_kind, generated_at, license_payload, base_provenance)
    if manifest_path.exists() and not args.replace:
        payload = json.loads(manifest_path.read_text(encoding="utf8"))
        payload = normalize_manifest(payload, args.source_kind, generated_at, license_payload, base_provenance)

    payload["generatedSheets"] = [sheet for sheet in payload["generatedSheets"] if sheet.get("id") != sheet_id]
    payload["rasterAssets"] = [asset for asset in payload["rasterAssets"] if asset.get("sheetId") != sheet_id]
    payload["generatedSheets"].append(sheet_payload)
    payload["rasterAssets"].extend(assets)
    payload["sheets"] = payload["generatedSheets"]
    payload["assets"] = payload["rasterAssets"]

    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf8")
    print(json.dumps({
        "ok": True,
        "assets": len(assets),
        "manifest": str(manifest_path)
    }, indent=2))


def empty_manifest(source_kind, generated_at, license_payload, provenance):
    return {
        "version": 2,
        "sourceKind": source_kind,
        "generatedAt": generated_at,
        "license": license_payload,
        "provenance": provenance,
        "marketplace": {
            "categories": [
                {
                    "id": "generated",
                    "name": "Generated",
                    "description": "ChatGPT image generation sheets and sliced reusable assets.",
                    "groups": ["generated-marketplace", "generated-scenes"],
                    "assetTypes": ["raster"]
                }
            ]
        },
        "generatedSheets": [],
        "rasterAssets": [],
        "sheets": [],
        "assets": []
    }


def normalize_manifest(payload, source_kind, generated_at, license_payload, provenance):
    payload.setdefault("version", 2)
    payload.setdefault("sourceKind", source_kind)
    payload.setdefault("generatedAt", generated_at)
    payload.setdefault("license", license_payload)
    payload.setdefault("provenance", provenance)
    payload.setdefault("marketplace", {})
    payload["marketplace"].setdefault("categories", empty_manifest(source_kind, generated_at, license_payload, provenance)["marketplace"]["categories"])
    payload["generatedSheets"] = payload.get("generatedSheets") or payload.get("sheets") or []
    payload["rasterAssets"] = payload.get("rasterAssets") or payload.get("assets") or []
    return payload


def remove_chroma_key(image, threshold):
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if g > 150 and g - r > threshold and g - b > threshold:
                pixels[x, y] = (r, g, b, 0)
    return image


def normalize_tile(image):
    bbox = image.getbbox()
    if not bbox:
        return image
    trimmed = image.crop(bbox)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    scale = min(440 / max(trimmed.width, 1), 440 / max(trimmed.height, 1), 1)
    size = (max(1, int(trimmed.width * scale)), max(1, int(trimmed.height * scale)))
    resized = trimmed.resize(size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((512 - size[0]) // 2, (512 - size[1]) // 2))
    return canvas


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def render_svg_wrapper(asset_id, png_name, width, height):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title">
  <title id="title">{titleize(asset_id)}</title>
  <image href="{png_name}" width="{width}" height="{height}" preserveAspectRatio="xMidYMid meet"/>
</svg>
'''


def titleize(value):
    return value.replace("-", " ").title()


if __name__ == "__main__":
    main()
