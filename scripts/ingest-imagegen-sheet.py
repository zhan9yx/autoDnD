#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

Image = None
ARM64_REEXEC_ENV = "AIDM_IMAGEGEN_INGEST_ARM64_REEXEC"

RECOMMENDED_ARM64_PYTHON = (
    Path.home()
    / ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
)


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
    parser.add_argument("--metadata-plan-id", default=None, help="Apply a plannedSheets metadata template from the manifest.")
    parser.add_argument("--visibility", choices=["internal", "player-safe"], default="internal")
    parser.add_argument("--ui-surfaces", default="", help="Comma-separated UI surfaces. Defaults to catalog-internal for internal assets.")
    parser.add_argument("--chroma-key", action="store_true", help="Remove green chroma-key background before slicing.")
    parser.add_argument("--preserve-tile", action="store_true", help="Save each slice as the full tile instead of normalizing to a transparent 512px icon canvas.")
    parser.add_argument("--replace", action="store_true", help="Replace the manifest instead of appending this sheet.")
    parser.add_argument("--threshold", type=int, default=70)
    args = parser.parse_args()

    load_pillow()

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
    metadata_plan = load_metadata_plan(manifest_path, args.metadata_plan_id or sheet_id or prompt_id)
    default_surfaces = parse_csv(args.ui_surfaces) or ["catalog-internal"]
    if args.visibility == "player-safe" and not metadata_plan:
        raise SystemExit("player-safe generated assets require a manifest plannedSheets metadata template")

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
            trimmed = prepared if args.preserve_tile else normalize_tile(prepared)
            png_path = out_dir / f"{asset_id}.png"
            svg_path = out_dir / f"{asset_id}.svg"
            trimmed.save(png_path)
            svg_path.write_text(render_svg_wrapper(asset_id, png_path.name, trimmed.width, trimmed.height), encoding="utf8")
            asset_ids.append(asset_id)
            asset_payload = {
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
                "tags": [args.group, args.prefix, "imagegen", "transparent" if args.chroma_key else "scene-card"],
                "visibility": args.visibility,
                "uiSurface": default_surfaces,
                "quality": {
                    "approved": False,
                    "reviewStatus": "ingested",
                    "duplicateRisk": "unknown",
                    "safetyFlags": ["metadata-review-required"]
                }
            }
            apply_frame_metadata(asset_payload, metadata_plan, index)
            validate_player_safe_asset(asset_payload)
            assets.append(asset_payload)

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
    payload.setdefault("plannedSheets", [])
    refresh_catalog_counts(payload)

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
    payload.setdefault("plannedSheets", [])
    return payload


def refresh_catalog_counts(payload):
    assets = payload.get("rasterAssets", [])
    payload.setdefault("assetCatalog", {})
    payload["assetCatalog"]["actualGeneratedRasterAssets"] = len(assets)
    payload["assetCatalog"]["playerSafeAssets"] = len([asset for asset in assets if asset.get("visibility") == "player-safe"])
    payload["assetCatalog"]["internalAssets"] = len([asset for asset in assets if asset.get("visibility") == "internal"])

    scene_assets = [
        asset for asset in assets
        if asset.get("assetType") == "raster"
        and asset.get("categoryId") == "scenes"
        and asset.get("group") == "generated-scenes"
    ]
    payload.setdefault("sceneLibrary", {})
    payload["sceneLibrary"]["actualGeneratedRasterScenes"] = len(scene_assets)


def parse_csv(value):
    return [entry.strip() for entry in value.split(",") if entry.strip()]


def load_metadata_plan(manifest_path, plan_id):
    if not manifest_path.exists() or not plan_id:
        return None

    payload = json.loads(manifest_path.read_text(encoding="utf8"))
    for plan in payload.get("plannedSheets", []):
        aliases = {
            plan.get("id"),
            plan.get("sheetId"),
            plan.get("promptId"),
            plan.get("metadataPlanId"),
        }
        if plan_id in aliases:
            return plan
    return None


def apply_frame_metadata(asset_payload, metadata_plan, index):
    if not metadata_plan:
        return

    template = metadata_plan.get("metadataTemplate", {})
    for key in ["visibility", "uiSurface"]:
        if key in template:
            asset_payload[key] = template[key]

    asset_payload.setdefault("tags", []).extend(template.get("tags", []))
    asset_payload.setdefault("quality", {}).update(template.get("qualityDefaults", {}))
    frame_templates = template.get("frameTemplates", [])
    frame = next((entry for entry in frame_templates if entry.get("index") == index), None)
    if not frame:
        return

    for key in [
        "id",
        "name",
        "zhName",
        "type",
        "displayName",
        "description",
        "semanticKey",
        "variantOf",
        "variantAxes",
        "gameplay",
        "gameplayBinding",
        "sceneSlug",
        "taxonomy",
        "soundscapeHints",
        "mood",
        "timeOfDay",
        "weather",
        "threatLevel",
        "narrativeUses",
        "visibility",
        "uiSurface",
        "quality",
        "tags",
    ]:
        if key not in frame:
            continue
        if key == "tags":
            asset_payload.setdefault("tags", []).extend(frame[key])
        elif key == "quality":
            asset_payload.setdefault("quality", {}).update(frame[key])
        else:
            asset_payload[key] = frame[key]


def validate_player_safe_asset(asset):
    if asset.get("visibility") != "player-safe":
        return

    errors = []

    def require(condition, message):
        if not condition:
            errors.append(message)

    require(asset.get("categoryId"), "categoryId")
    require(asset.get("name"), "name")
    require(asset.get("semanticKey"), "semanticKey")
    require(asset.get("tags"), "tags")
    require(asset.get("quality", {}).get("approved") is True, "quality.approved")
    require(asset.get("displayName", {}).get("en"), "displayName.en")
    require(asset.get("displayName", {}).get("zh"), "displayName.zh")

    surfaces = asset.get("uiSurface") or []
    require(isinstance(surfaces, list) and len(surfaces) > 0, "uiSurface")
    require("catalog-internal" not in surfaces, "uiSurface must not include catalog-internal")

    description = asset.get("description")
    if asset.get("categoryId") == "scenes":
        require(isinstance(description, str) and word_count(description) >= 12, "description")
        require(not is_provenance_description(description), "description must not be provenance text")
        require(asset.get("zhName"), "zhName")
        require(asset.get("sceneSlug"), "sceneSlug")
        require(asset.get("taxonomy"), "taxonomy")
        hints = asset.get("soundscapeHints") or []
        require(isinstance(hints, list) and len(hints) >= 2, "soundscapeHints")
        narrative_uses = asset.get("narrativeUses") or []
        require(isinstance(narrative_uses, list) and len(narrative_uses) >= 2, "narrativeUses")
        for key in ["mood", "timeOfDay", "weather", "threatLevel"]:
            require(asset.get(key), key)
    else:
        require(isinstance(description, dict), "description")
        require(word_count(description.get("en", "")) >= 10, "description.en")
        require(bool(description.get("zh")), "description.zh")
        require(not is_provenance_description(description.get("en", "")), "description.en must not be provenance text")
        require(not is_provenance_description(description.get("zh", "")), "description.zh must not be provenance text")
        require(asset.get("variantOf"), "variantOf")
        variant_axes = asset.get("variantAxes") or {}
        gameplay = asset.get("gameplay") or {}
        binding = asset.get("gameplayBinding") or {}
        require(variant_axes.get("itemKind") or variant_axes.get("kind"), "variantAxes.itemKind or variantAxes.kind")
        require(
            variant_axes.get("rarity")
            or isinstance(gameplay.get("valueGp"), int)
            or binding.get("requiresNpcDefinition")
            or binding.get("requiresSpellDefinition")
            or binding.get("requiresConditionDefinition"),
            "variantAxes.rarity, gameplay.valueGp, or data-backed non-item binding"
        )

    if errors:
        raise SystemExit(
            f"player-safe asset {asset.get('id', '<unknown>')} is missing required metadata: "
            + ", ".join(errors)
        )


def word_count(value):
    return len([part for part in str(value).split() if part.strip()])


def is_provenance_description(value):
    forbidden = [
        "ChatGPT image generation",
        "sourceSheet",
        "sourceSha256",
        "promptId",
        "generatedAt",
        "provenance",
        "由模型生成",
        "模型生成",
    ]
    return any(token.lower() in str(value).lower() for token in forbidden)


def load_pillow():
    ensure_arm64_python_for_pillow()

    global Image
    try:
        from PIL import Image as pillow_image
    except (ImportError, OSError) as exc:
        print(
            "AIDM sheet slicing could not import Pillow in the current Python runtime.",
            file=sys.stderr,
        )
        print(
            f"Current interpreter is {platform.machine()}: {sys.executable}",
            file=sys.stderr,
        )
        print(
            "Use the bundled arm64 runtime instead:",
            file=sys.stderr,
        )
        print(
            f"{RECOMMENDED_ARM64_PYTHON} scripts/ingest-imagegen-sheet.py ...",
            file=sys.stderr,
        )
        raise SystemExit(2) from exc

    Image = pillow_image


def ensure_arm64_python_for_pillow():
    if not should_reject_rosetta_python():
        return

    if os.environ.get(ARM64_REEXEC_ENV) == "1":
        print(
            "AIDM sheet slicing must use arm64 Python on Apple Silicon before importing Pillow.",
            file=sys.stderr,
        )
        print(
            f"Current interpreter is {platform.machine()}: {sys.executable}",
            file=sys.stderr,
        )
        print(
            "Use the bundled runtime instead:",
            file=sys.stderr,
        )
        print(
            f"{RECOMMENDED_ARM64_PYTHON} scripts/ingest-imagegen-sheet.py ...",
            file=sys.stderr,
        )
        raise SystemExit(2)

    if RECOMMENDED_ARM64_PYTHON.exists():
        command = [
            str(RECOMMENDED_ARM64_PYTHON),
            str(Path(__file__).resolve()),
            *sys.argv[1:],
        ]
        print(
            "Re-executing AIDM sheet ingester with bundled arm64 Python before importing Pillow.",
            file=sys.stderr,
        )
        print(
            f"Current interpreter is {platform.machine()}: {sys.executable}",
            file=sys.stderr,
        )
        print(
            f"Next interpreter: {RECOMMENDED_ARM64_PYTHON}",
            file=sys.stderr,
        )
        os.environ[ARM64_REEXEC_ENV] = "1"
        try:
            os.execv(str(RECOMMENDED_ARM64_PYTHON), command)
        except OSError as exc:
            print(
                f"Failed to re-exec bundled arm64 Python: {exc}",
                file=sys.stderr,
            )
            print(
                f"Run manually: {RECOMMENDED_ARM64_PYTHON} scripts/ingest-imagegen-sheet.py ...",
                file=sys.stderr,
            )
            raise SystemExit(2) from exc

    print(
        "AIDM sheet slicing must use arm64 Python on Apple Silicon before importing Pillow.",
        file=sys.stderr,
    )
    print(
        f"Current interpreter is {platform.machine()}: {sys.executable}",
        file=sys.stderr,
    )
    print(
        f"Bundled arm64 Python was not found at {RECOMMENDED_ARM64_PYTHON}",
        file=sys.stderr,
    )
    raise SystemExit(2)


def should_reject_rosetta_python():
    return sys.platform == "darwin" and platform.machine() != "arm64"


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
