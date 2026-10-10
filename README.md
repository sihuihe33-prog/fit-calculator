# ISO Fit Calculator

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

## Example

Ø25 H7/g6:

- Hole: +0.021 / 0 mm
- Shaft: −0.007 / −0.020 mm
- Clearance: 0.007 – 0.041 mm

## Tech

Plain HTML/CSS/JavaScript ES modules. No build step, no dependencies.

- Calculation engine: `iso286.js`
- Tests: `test/`, run with `node --test`

## Run locally

```sh
npx serve .
```

Or use any static server, then open the printed URL. ES modules require http, not `file://`.

## Deploy

Cloudflare Pages:

- Framework preset: None
- Build command: (none)
- Output directory: `/`

## Disclaimer

Values are based on the ISO 286-1:2010 and ISO 286-2:2010 tables. Verify against the standard for critical applications.

## License

MIT © 2026 sihuihe33-prog. See [LICENSE](LICENSE).
