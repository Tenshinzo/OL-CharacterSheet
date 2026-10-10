# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A character sheet web app for the Open Legend RPG with user accounts, a MySQL-backed API and live sync. Two parts:

- `client/` – the single-page frontend: HTML/CSS/vanilla JS (ES6+), no build step. External deps from CDN in `index.html`: Font Awesome (icons) and jsPDF (PDF export).
- `server/` – Fastify 5 (plain JS, ESM) + MySQL 8 backend: session-cookie auth (scrypt), invite-only registration, email verification/password reset via Resend, Discord OAuth, characters CRUD, GM groups, admin endpoints and a WebSocket hub for live updates. It also serves `client/` statically.

Production runs on a Hetzner box via Docker Compose (app + MySQL + Caddy for TLS) at https://ol-character.de. See `DEPLOY.md` for the runbook; `deploy/` holds Caddyfile, bootstrap/deploy/backup scripts; `.github/workflows/` has CI (lint + tests + docker build) and the deploy-on-push-to-main workflow.

## Running locally

```
docker compose -f docker-compose.dev.yml up -d     # MySQL on 127.0.0.1:3307
cd server && cp .env.example .env                 # edit DB_PORT=3307 etc.
npm install && npm run dev                        # http://localhost:3000, migrations run on start
node src/cli.js invite 1                          # invite code for registering a user
node src/cli.js promote <email>                   # make a user admin
node src/cli.js reset-password <email> <password>
```

Without `RESEND_API_KEY` mails are logged to stdout (verification/reset links). `npm test` (node:test, 51 API tests incl. WebSocket) needs the dev MySQL and a database `olchar_test` the `olchar` user can access; `npm run lint` runs ESLint. CI runs both.

Frontend changes are still verified by hand in a browser: the app logs heavily and shows a red overlay if `CharacterSheetApp` fails to construct. Note `createNewCharacter` and deletes use `prompt()`/`confirm()`, which block browser automation; stub them when driving the app from scripts.

## Architecture

### Server (`server/src`)
`app.js` builds the Fastify instance (cookie, rate-limit, websocket, static, `/api` prefix, JSON error handler, same-origin check for mutating requests). `index.js` runs migrations (`migrations/*.sql`, tracked in `schema_migrations`), seeds the `ADMIN_EMAIL` account, then listens. Routes live in `routes/` (auth, characters, userdata, groups, admin, ws); shared helpers in `lib/` (crypto, session, mail, validate, permissions, hub). `config.js` reads env vars (and a `.env` file in `server/` or the repo root).

Data model (`migrations/001_initial.sql`): `users`, `sessions` (hashed tokens), `invites`, `email_tokens`, `characters` (full character JSON in `data` plus denormalised `owner_id`, `kind`, `primary_character_id`, `version`), `user_data` (per-user JSON blobs: `settings`, `customBoons`, `customBanes`), `groups`, `group_members`, `group_characters`.

Access model (`lib/permissions.js`): owners have full access; the GM of a group gets read+edit on every primary character assigned to that group plus its alternate forms/companions (recursive CTE over `primary_character_id`). Only owners may delete (cascades through the hierarchy). Character ids are client-generated (UUIDs; legacy timestamp ids are accepted) and globally unique.

Live updates: every write broadcasts `character.created|updated|deleted` (and `group.*`, `characters.refresh`) via `lib/hub.js` to the owner and interested GMs, excluding the originating `X-Client-Id`. The client reconciles and never echoes.

### Client (`client/`)
Load order in `index.html`: `gameDatabase.js`, `api.js`, `auth-ui.js`, `groups-ui.js`, `admin-ui.js`, `feedback-ui.js` (bug report dialog → `POST /api/feedback` → GitHub issue), `script.js`. `api.js` exposes `window.OLCloud` (REST helpers, WebSocket with reconnect, and `sync`, a debounced outbound queue with offline retry and status events). The three `*-ui.js` modules render their pages into `#cloudPages` and expose `OLAuthUI` / `OLGroupsUI` / `OLAdminUI` with `mount()` / `show(route, params)`; their CSS is concatenated into `cloud.css`.

`script.js` defines the single class `CharacterSheetApp` (`window.app`). The `// === CLOUD SYNC, AUTH & ROUTING ===` block is the integration layer: `initializeCloud()` → `checkAuth()` → `onAuthenticated()` → `loadFromServer()`; hash routing via `handleRoute()` / `navigate()` / `showPage()`; `applyRemoteCharacter()` mutates characters in place (so `this.currentCharacter` stays valid) and `refreshOpenSheet()` re-renders without re-registering listeners or clobbering the focused input. `saveCharacters()` is the single write sink: it diffs each character against `this.cloud.snapshot` and queues only changed ones; deletes go through `deleteCharacter()` explicitly. `this.characterMeta[id]` holds `{ownerId, ownerName, access: 'owner'|'gm', version}`; GM-visible characters live in `this.characters` too and render in separate sections on the main page.

### `CharacterSheetApp` (script.js)
One monolithic class holding all state and behavior:
- `this.characters` — array of all character objects the user can see (own + GM-visible), loaded via `loadFromServer()` and synced through `saveCharacters()`.
- `this.currentCharacter` — the character currently shown on the sheet page. Most `update*`/`calculate*` methods read from it and DOM inputs, then write back.
- `this.customBoons` / `this.customBanes` — user-defined entries persisted per user on the server (`user_data`); they are merged with `GAME_DATABASE` entries wherever boons/banes are listed (`findBoonOrBane`, `getBoonOrBaneByName`).

Pages are plain `<div>`s toggled by `showMainPage()`, `showCharacterSheetPage(mode)`, `showOptionsListPage()` (`#mainPage`, `#characterSheetPage`, `#optionsListPage`) and `showPage(id)` for the cloud pages. Beware the CSS rule `[id$="Section"] { display:none !important }`: never give a page container an id ending in "Section". The sheet page has an edit mode and a view mode (`enableViewMode` / `disableViewMode`); some inputs exist twice (e.g. `wealthScore` vs `viewWealthScore`), so saving code must read whichever is active.

Saving: `saveCurrentCharacter()` (with notification) and `saveCurrentCharacterSilently()` / `autoSave()` copy form values into `currentCharacter` and call `saveCharacters()` (which syncs to the server). `setupAutoSave()` wires `change` listeners only on a handful of text inputs; attribute changes save through the +/- button path (`increaseAttribute` / `decreaseAttribute` → `validateAttributeChange`). When adding a new persisted field, make sure it is written in the silent save path and, if it has its own input, in `refreshOpenSheet()` too.

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
Character objects stored on the server are the full in-memory shape (see `createNewCharacter()` for the canonical default object). `applyLoadMigrations()` runs `migrateLegacyFields()` / `migrateAdvantageDisadvantageCounts()` on every character loaded from the server; add new client-side migrations there. `loadCharacters()` now only reads the old localStorage key for the one-time legacy import (`maybeOfferLegacyImport()`).

Export strips database-derived fields (`cleanCharacterForExport` keeps e.g. feat `name`/`tier`/`customDetails`), and import rehydrates them from `GAME_DATABASE` (`reconstructCharacterFromExport`). Keep these two in sync when adding fields to feats/boons/banes/equipment.

### `gameDatabase.js`
`GAME_DATABASE` has arrays `boons`, `banes`, `feats`, `perks`, `flaws`, `baseactions`, and an object `weaponProperties`. Entries are matched by `name` throughout script.js, and feats additionally by `tier`. Boons/banes carry `powerLevels`, `attributes`, `powerLevelDescriptions`; feats carry `cost`, `tiers`, `prerequisites`, `effects` keyed by tier, and optional `customInput*` fields that drive extra UI (see Alternate Form / Companion). Follow an existing entry as a template when adding content.

### `styles.css`
Design tokens are CSS custom properties on `:root` (brand colors, and per-category `--boon-*`, `--bane-*`, `--feat-*`, `--perk-*`, `--flaw-*` triples). Reuse them rather than hard-coding colors. The layout is mobile-first with many `@media` breakpoints.

## Conventions observed in the code
- Methods wrap risky DOM work in try/catch and surface failures with `showNotification(msg, type)` / `showErrorNotification`.
- `checkRequiredElements()` lists element IDs the app expects at startup; add new required IDs there if the app should fail loudly when they are missing.
- Section markers like `// === FAVORITE ACTIONS ===` delimit feature groups inside the class; add new feature methods in a similarly marked block.
