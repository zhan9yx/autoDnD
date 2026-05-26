# Tasks

## Planning Document

- [x] Read Feynman gap list and existing asset pipeline, inventory, roadmap, manifests, and runtime binding files.
- [x] Add scene prompts as single full-bleed image briefs.
- [x] Add sprite-sheet prompts for action, spell, scroll, status, class/profession, equipment, reward/economy, and weather/environment assets.
- [x] Define a reusable icon style anchor and negative prompt.
- [x] Add spell completeness matrix aligned to current `SPELLS`.
- [x] Add description map rows with required binding and bilingual description fields.
- [x] Add later image-generation to validation workflow.

## Guardrails

- [x] Do not generate or add images.
- [x] Do not change manifests.
- [x] Do not change runtime JS or UI code.
- [x] Keep planned assets out of `generated` or `integrated` status.

## Verification

- [x] Run `git diff --check` for touched files.
- [x] Run `npm run harness:status`.

## Still Open After This Change

- [ ] Generate images from the prompts.
- [ ] Slice/chroma-key generated sheets and run alpha/full-bleed checks.
- [ ] Register real files in the generated manifest after image files exist.
- [ ] Bind reviewed frames to runtime owners and exact player surfaces.
- [ ] Run generated asset tests and browser-visible surface QA after integration.
