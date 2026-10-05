# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page character sheet web app for the Open Legend RPG. Pure HTML/CSS/vanilla JS (ES6+), no build step, no package manager, no test suite, no linter. All persistence is browser `localStorage`. The only external dependencies are loaded from CDN in `index.html`: Font Awesome (icons) and jsPDF (single-character PDF export).

## Running

Serve the directory statically (no bundling needed), then open http://localhost:8000:

```
python -m http.server 8000
```

`run_server.bat` / `run_server.ps1` wrap the same command for Windows. Opening `index.html` directly via `file://` mostly works but a server is preferred.

There are no automated tests. Verify changes by loading the app in a browser and watching the console; the app logs heavily and shows a fixed red error overlay if `CharacterSheetApp` fails to construct. Import/export can be smoke-tested by exporting a character and re-importing the JSON.

## Architecture

Four files carry everything. They are very large (script.js ~15k lines, styles.css ~11k, gameDatabase.js ~3k, index.html ~2k), so grep for method names rather than reading whole files.

### Load order and globals
`index.html` loads `gameDatabase.js` then `script.js` at the bottom of `<body>`. `gameDatabase.js` defines `const GAME_DATABASE` and attaches it as `window.GAME_DATABASE` (also CommonJS-exported, unused). `script.js` defines a single class `CharacterSheetApp` and instantiates it on `DOMContentLoaded` (with a 100ms delay) as `window.app`. All UI handlers reach the app through `window.app` / `this`.

### `CharacterSheetApp` (script.js)
One monolithic class holding all state and behavior:
- `this.characters` — array of all character objects, loaded from / saved to `localStorage['openLegendCharacters']` via `loadCharacters()` / `saveCharacters()`.
- `this.currentCharacter` — the character currently shown on the sheet page. Most `update*`/`calculate*` methods read from it and DOM inputs, then write back.
- `this.customBoons` / `this.customBanes` — user-defined entries persisted under `openLegendCustomBoons` / `openLegendCustomBanes`; they are merged with `GAME_DATABASE` entries wherever boons/banes are listed (`findBoonOrBane`, `getBoonOrBaneByName`).

Three "pages" are plain `<div>`s toggled by `showMainPage()`, `showCharacterSheetPage(mode)` and `showOptionsListPage()` (`#mainPage`, `#characterSheetPage`, `#optionsListPage`). The sheet page has an edit mode and a view mode (`enableViewMode` / `disableViewMode`); some inputs exist twice (e.g. `wealthScore` vs `viewWealthScore`), so saving code must read whichever is active.

Saving: `saveCurrentCharacter()` (with notification) and `saveCurrentCharacterSilently()` / `autoSave()` copy form values into `currentCharacter` and call `saveCharacters()`. `setupAutoSave()` wires `change` listeners only on a handful of text inputs; attribute changes save through the +/- button path (`increaseAttribute` / `decreaseAttribute` → `validateAttributeChange`). When adding a new persisted field, make sure it is written in the silent save path too, or it will be lost.

Rendering pattern: data mutation → `populateX()` rebuilds that section's DOM from `currentCharacter` → `updateDefenseStats()` / `updateMaxHP()` / `updateAttributeDisplays()` recompute derived numbers. `displayCharacter()` is the full re-render used when loading a character.

### Character hierarchy (alternate forms & companions)
Characters are flat entries in `this.characters`, linked by IDs rather than nesting:
- Alternate Form feat: form characters have `isAlternateForm`, `primaryCharacterId`, `maxAttributePoints`; the primary has `alternateForms: [{characterId, ...}]`.
- Companion feat: companions have `isCompanion`, `companionTier`; the parent has `companions: [{characterId, tier, name}]`.

`sync*ToRelatedCharacters()` methods (damage, legend points, XP, boons, banes, equipment, perks, flaws) propagate shared state across a hierarchy; `getAllCharactersInHierarchy()` / `getRelatedCharacters()` resolve the links. `recalculateAlternateFormMaxPoints` / `recalculateCompanionMaxPoints` derive point budgets from the primary's level. Export/import must preserve these links (`showSingleCharacterExportModalWithHierarchy`, `processImportedCharacterHierarchy`), and imported characters receive new IDs, so remapping is required.

### Rules formulas (where they live)
- Level = `1 + floor(XP / 3)`; attribute points = `40 + 3 * XP` for primaries (`getCharacterAvailableAttributePoints`).
- Attribute cost is triangular: `score * (score + 1) / 2` (`calculateAttributeCost`). Max attribute by level in `getMaxAttributeValue`.
- Max HP = `10 + 2 * (Fortitude + Presence + Will)` plus Tough as Nails and `customHealthBuff` (`calculateMaxHP`). HP is tracked via `totalDamageTaken` and `lethalDamage` so it survives form changes.
- Defenses in `updateDefenseStats`, with equipment/feat/boon-bane modifiers from `getEquipmentBonus`, `getFeatBonus`, `getBoonsBanesBonus`, and feat-based attribute substitution in `getEffectiveAttributeScore`.
- Many feats and banes have hard-coded special handling by name (e.g. `hasFeat('...')`, `add<Bane>Effects` / `remove<Bane>Effects` for conditions like Blinded, Fatigued, Provoked). When renaming database entries, grep script.js for the literal name.

### Persistence, migration, export
Character objects stored in localStorage are the full in-memory shape (see `createNewCharacter()` for the canonical default object). `loadCharacters()` runs `migrateLegacyFields()` / `migrateEquipmentStructure()` / `migrateCharacterAttributes()` on every load; add new migrations there when changing stored shape instead of breaking old saves.

Export strips database-derived fields (`cleanCharacterForExport` keeps e.g. feat `name`/`tier`/`customDetails`), and import rehydrates them from `GAME_DATABASE` (`reconstructCharacterFromExport`). Keep these two in sync when adding fields to feats/boons/banes/equipment.

### `gameDatabase.js`
`GAME_DATABASE` has arrays `boons`, `banes`, `feats`, `perks`, `flaws`, `baseactions`, and an object `weaponProperties`. Entries are matched by `name` throughout script.js, and feats additionally by `tier`. Boons/banes carry `powerLevels`, `attributes`, `powerLevelDescriptions`; feats carry `cost`, `tiers`, `prerequisites`, `effects` keyed by tier, and optional `customInput*` fields that drive extra UI (see Alternate Form / Companion). Follow an existing entry as a template when adding content.

### `styles.css`
Design tokens are CSS custom properties on `:root` (brand colors, and per-category `--boon-*`, `--bane-*`, `--feat-*`, `--perk-*`, `--flaw-*` triples). Reuse them rather than hard-coding colors. The layout is mobile-first with many `@media` breakpoints.

## Conventions observed in the code
- Methods wrap risky DOM work in try/catch and surface failures with `showNotification(msg, type)` / `showErrorNotification`.
- `checkRequiredElements()` lists element IDs the app expects at startup; add new required IDs there if the app should fail loudly when they are missing.
- Section markers like `// === FAVORITE ACTIONS ===` delimit feature groups inside the class; add new feature methods in a similarly marked block.
