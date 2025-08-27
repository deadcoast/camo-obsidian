# CAMO - Camouflage for Codeblocks (Obsidian Plugin)

CAMO provides layered privacy and aesthetics for Markdown codeblocks in Obsidian using presets, flags, and inline camoMetaData.

- Obsidian-compliant:
  - Each preset is a separate language (e.g., `camo-blackout`)
  - Flags go on the first content line (not after the language)
  - Metadata lines start with `::`/`:^:` and are parsed from content
  - CSS-first effects; no direct DOM manipulation

## Install (Development)

1. Clone this repo into your vault under `.obsidian/plugins/camo-codeblock`.
2. Run `npm install` in the plugin folder.
3. Run `npm run dev` (or `npm run build` for production bundle).
4. In Obsidian, enable CAMO in Settings → Community plugins → Installed plugins.

## Usage

### 1) Presets (Languages)

````markdown
```camo-blackout
Hidden content (click/hover to reveal depending on flags/settings)
```
````

Other presets (languages): `camo-blueprint`, `camo-modern95`, `camo-ghost`, `camo-matrix`, `camo-classified`.

### 2) Flags (First content line)

Place flags on the first line of the block content:

````markdown
```camo-blackout
--hover --blur:6 --timer:5
Your content here
```
````

Supported flags: `--hover`, `--click`, `--timer:n`, `--blur[:n]`.

### 3) camoMetaData (Inline)

Start lines with `::`/`:^:` to apply effects and interactions. Examples:

````markdown
```camo
:: set[blur] // content[all] % {intensity}(8) -> {visual[blurred]}
:: set[background] // content[all] % {color}(#0D1F2D) -> {visual[color]}
:: set[text] // color % {color}(#4FC3F7) -> {text[color]}
:: reveal[hover] // content[all] % {delay}(0ms) -> {state[visible]}

Documentation or sensitive content here…
```
````

Currently supported metadata operations:
- `set[blur]` with `{intensity}(n)`
- `set[background]` with `{color}(#hex)`
- `set[opacity]` with `{value}(0..1)`
- `set[text]` with `{color}(#hex)`
- `reveal[hover]`, `reveal[click]`

### 4) Settings

Settings tab provides:
- Default preset (applied to `camo` blocks)
- Reveal on hover by default (if no other interaction is specified)
- Enable animations
- Performance mode
- Debug mode (shows inline metadata errors)

### 5) Commands

- Reveal all CAMO blocks
- Hide all CAMO blocks

### State & Maintenance

- Reveal state persists per block (per-file:line). Layout changes refresh visible states.
- Old state entries are cleaned hourly.

## Notes

- Follows project Docs (`Docs/1_OVERVIEW.md`, `Docs/2_ALLABOUT-camoMetaData.md`, `Docs/3_camoIR.md`) for architecture and syntax.
- Built with CSS-based effects for theme compatibility and performance.

## License

MIT
