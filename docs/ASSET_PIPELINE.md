# Asset Pipeline

## Structure

- `assets/manifest.json`: source of truth for reusable assets.
- `assets/species/`: species identity icons.
- `assets/classes/`: class role icons.
- `assets/scenes/`: location cards.
- `assets/weapons/`: weapon icons.
- `assets/spells/`: spell icons.
- `assets/items/`: item icons.

## Generate

```bash
npm run assets:generate
```

The generator creates deterministic SVG assets from `scripts/generate-assets.mjs`. These are code-native assets so they can be versioned, tested, recolored, and reused without extra binary storage.

## Quality Gate

`tests/assets.test.js` verifies the manifest, minimum group counts, tags, and file existence.
