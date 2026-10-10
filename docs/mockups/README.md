# Redesign mockups (issue #8)

Two directions for a more authentic fantasy / pen-and-paper look. Each folder has a
self-contained `index.html` (open it in a browser, it uses Google Fonts) plus renders at
desktop (1280px) and phone (420px) width. Both show the same two screens with the same
sample data: the character overview (with the GM "party" section) and the character sheet.

No application code is touched by these mockups.

## A · Chat-RPG style (`a-chatrpg/`)

Leans into the look of rpg.sola.rip: retro pixel RPG.

- Palette taken from that site's own tokens: ground `#0d0a14`, panel `#1b1430`, ink `#efe8db`,
  gold `#f2c359`, plus attack red `#ea6a54`, defense blue `#61a8e8`, good green `#7bc86c`.
- Type: VT323 for everything readable, Press Start 2P for titles, numbers and buttons.
- Panels with a double rule (light edge + dark outline), hard 4px shadows, zero radius,
  tab chips, item cards with a square icon slot. A faint dot grid on the background.
- Tone: bright, playful, high contrast. Works very well on OLED phones. Risk: the pixel
  font makes long descriptions (feat texts, boon descriptions) tiring to read.

## B · Vellum & ink (`b-vellum/`)

Own direction: the sheet is a physical object. A vellum page with a double ruled border and
faint ruling lines lies on a dark oak table; the app chrome is a strip of green leather with
brass buttons and a wax seal as logo.

- Palette: table `#1d1512`, leather `#2f3a2e`, vellum `#e9dcc0`, ink `#2a2118`,
  brass `#a8832f`, wax red `#8a1c2b` (level seal, damage), verdigris `#3f6b5e` (healing,
  boons), iron `#4f5a66` (defenses).
- Type: IM Fell English (an 18th-century book face) for body text, its small-caps cut for
  labels, Cinzel for names and numbers.
- Devices with meaning: attributes are inked circles (dashed when 0), HP is a row of
  filled/empty/blackened boxes like a paper tracker, defenses are shield shapes, level is a
  wax seal, characters on the overview are index cards pinned with brass tacks, GM-visible
  cards carry a green spine. One handwritten note in the margin ("mind the Fatigue, S.")
  hints at how GM annotations could look later.
- Tone: calm, warm, readable for long text. Risk: lower contrast than A; needs care for
  accessibility on cheap screens, and the parchment texture must stay subtle.

## Shared layout decisions

- The character sheet uses two columns on desktop: attributes left, vitality / active
  effects / favorite actions right, so the numbers you touch most in play are always
  visible. On phones the right column follows the attributes.
- Section tabs remain, but as chips (A) or ribbons (B) instead of a full-width nav bar.
- The header carries the sync status ("saved") and the user avatar, matching the live-sync
  features of the cloud version.
