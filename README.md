# Mechanical Design Toolbox

A free, fast, ad-free calculator for ISO 286 hole/shaft tolerances and fits (clearance / transition / interference).

## Features

- Nominal sizes 0–500 mm
- Hole letters A–U and shaft letters a–u, including JS/js, J/j, K/k, M/m, N/n
- Tolerance grades IT1–IT18
- Limit deviations shown in µm and mm
- Max/min clearance or interference
- Tolerance zone diagram
- 10 preferred hole-basis fits as quick picks
- English / 中文 interface
- Shareable links (e.g. `#d=25&fit=H7/g6`)

### Bolt torque calculator (`/bolt`)

- Tightening torque and maximum assembly preload per VDI 2230 (simplified)
- Metric coarse threads M3–M36, property classes 4.6–12.9, hex bolts or socket head cap screws
- Friction presets or custom μG / μK, adjustable yield utilization
- Torque breakdown (bolt stretch vs. thread friction vs. head friction) and a quick-reference table

### More tools

- **Spur gears** (`/gear`): geometry with profile shift, working pressure angle, contact ratio, span measurement, undercut / pointed-tip checks
- **Shaft strength** (`/shaft`): minimum diameter from torsion (with keyway allowance, hollow shafts) and combined bending–torsion check
- **Bearing life** (`/bearing`): equivalent dynamic load, L10 / L10h, reliability factor, required dynamic load rating
- **Parallel keys** (`/key`): GB/T 1095/1096 key size lookup, bearing-pressure check, drawing callouts
- **Unit converter** (`/units`): force, torque, stress, power, speed, temperature and more, plus a power–torque–speed calculator

## Example

Ø25 H7/g6:

- Hole: +0.021 / 0 mm
- Shaft: −0.007 / −0.020 mm
- Clearance: 0.007 – 0.041 mm

## Tech

Plain HTML/CSS/JavaScript ES modules. No build step, no dependencies.

- Shared site shell: `site.js` (tool registry, language, navigation)
- Calculation engines: `iso286.js`, `bolt.js`, `gear.js`, `shaft.js`, `bearing.js`, `key.js`, `units.js` — one per tool, no DOM
- Tests: `test/`, run with `node --test`

## Run locally

```sh
npx serve .
```

Or use any static server, then open the printed URL. ES modules require http, not `file://`.

## Cache busting

Run `node scripts/stamp.mjs` before committing (the local pre-commit hook does this automatically). It appends a content hash (`?v=…`) to every local `.js` / `.css` reference so browsers never mix stale cached files with a new deploy.

## Deploy

Cloudflare Pages:

- Framework preset: None
- Build command: (none)
- Output directory: `/`

## Disclaimer

Values are based on the ISO 286-1:2010 and ISO 286-2:2010 tables. Verify against the standard for critical applications.

## License

MIT © 2026 sihuihe33-prog. See [LICENSE](LICENSE).
