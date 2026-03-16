# haruka

**haruka** is a web-based keyboard configurator for [kanata](https://github.com/jtroo/kanata) and [Karabiner-Elements](https://karabiner-elements.pqrs.org/). Create configuration files visually in your browser — no install required.

**Try it now:** **[https://ohtk79.github.io/haruka/](https://ohtk79.github.io/haruka/)**

---

## Features

- Visual keyboard UI for editing key mappings
- Export to kanata (.kbd) / Karabiner-Elements (.json) / both
- Up to 8 layers with rename & reorder support
- Tap-Hold actions (different behavior for tap vs. hold)
- Layer-while-held / Layer-switch layer control
- Transparent / No-op action assignment
- Per-key modifier output (Ctrl, Shift, Alt, Meta — left/right independent)
- JIS → US remap (output US layout from JIS template)
- Global Tapping Term setting (applied to both kanata & Karabiner-Elements)
- Share configurations via URL (compressed encoding)
- Auto-save to localStorage
- Japanese / English UI switcher

## Supported Keyboard Layouts

| Template | kanata (.kbd) | Karabiner-Elements (.json) |
|---|:---:|:---:|
| 109 (JIS) | ✓ | ✓ |
| 104 (ANSI) | ✓ | ✓ |
| 112 (JIS) Apple | — | ✓ |
| 109 (US) Apple | — | ✓ |

Apple templates include the Fn key and are Karabiner-Elements only.

## Key Actions

| Action | Description |
|---|---|
| Key | Standard key output (with optional modifiers) |
| Transparent | Delegate to lower layer |
| No-op | Do nothing |
| Tap-Hold | Different action on tap vs. hold |
| Layer (while held) | Activate layer while key is pressed |
| Layer (switch) | Permanently switch the base layer |

Tap-Hold variants: `tap-hold` / `tap-hold-press` / `tap-hold-release`

## Getting Started

1. Open [haruka](https://ohtk79.github.io/haruka/)
2. Select a template (109 JIS / 104 ANSI / Apple)
3. Click a key on the keyboard to select it
4. Configure action type, output key, and modifiers in the action panel
5. Add and switch layers using the layer tabs
6. Export `.kbd` / `.json` / both from the header

### Sharing

Click the share button in the header to encode your current configuration as a URL. Recipients can import the configuration simply by opening the link.

### Preview

The preview panel at the bottom shows the generated kanata (.kbd) and Karabiner-Elements (.json) output in real time.

## Compatibility

- kanata: v1.11.0 (output validated via `kanata --check` in CI)
- Karabiner-Elements: current version

---

## Development

### Setup

```bash
pnpm install
pnpm dev
```

### Build & Preview

```bash
pnpm build
pnpm preview
```

### Test

```bash
pnpm vitest run            
```

### Type Check

```bash
pnpm exec svelte-check --threshold warning
```

### Deploy

Deployment to GitHub Pages runs automatically on push to `main` (GitHub Actions).


### Tech Stack

- [SvelteKit](https://svelte.dev/) (Svelte 5 runes) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [CodeMirror 6](https://codemirror.net/) (preview editor)
- [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (i18n)
- [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) (testing)

## License

MIT
