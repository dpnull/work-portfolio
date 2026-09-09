# Portfolio design system

This file is the visual contract for the portfolio. Component-level CSS may solve layout, but it should not invent new typefaces, text roles, colours, radii or spacing logic.

## Direction

- Editorial and cinematic, not app-like.
- Square geometry, fused hairline borders and deliberate flat colour.
- Use contrast and alignment for hierarchy; avoid decorative depth, soft cards and generic UI styling.
- Preserve the educational Work grid and distinguish cinematic work without making it feel like a separate website.

## Typography

The font files and shared tokens live in `src/styles/global.css`.

| Role | Typeface | Treatment |
| --- | --- | --- |
| Headlines and section titles | Instrument Sans | Semibold, tight tracking |
| Body, navigation and descriptions | Instrument Sans | Regular or medium, normal tracking |
| Compact UI labels | Kode Mono | Uppercase, `--text-label`, `--tracking-label` |

Kode Mono is reserved for runtimes, bookmark tabs, small schematic marks and developer controls. It is not a second body or heading face. `CINEMATIC` and `BRAND DEAL` must use the same label tokens.

## Layout

- Page content caps at `--container-page` (`76rem`).
- Standard page gutters are `24px` on small screens and `32px` from the `sm` breakpoint.
- Desktop work cards use a four-column rhythm with a `24px` gap.
- A three-card row keeps the same card width and gap, then centers the group in the container.
- Hero copy remains left-aligned but the copy block is centered inside its column.

## Colour and geometry

- Use the semantic colour tokens in `src/styles/global.css`; do not hardcode component colours.
- The accent colour is a signal, not a general background. Use it for the primary CTA and active playback progress.
- Corners stay square. Borders are normally one pixel and use the relevant `line` token.
- Cinematic work uses the cinema palette; text roles and spacing remain consistent with the main page.

## Component rules

- Header CTA: one compact schematic accent plus a clear action label; it should be more visible than navigation without becoming a banner.
- Proof strip: stat, label and explanation must read as three distinct levels.
- Bookmark tabs: same mono label styling, 30px height and one-pixel outline.
- Video titles use Instrument Sans medium; descriptions use Instrument Sans regular and the relevant dim colour.
- Portfolio descriptions are miniature case studies: name the creative approach and the strategic job it did. Do not narrate what the adjacent video already shows or repeat metrics already visible on the poster.
- Keep each description to one compact sentence. Use an outcome only when it adds meaning that is not already shown; otherwise describe the creative intent, production constraint or client objective. Never imply an unverified result.

## Review checklist

- Compare at 375px, 768px and the annotated 1081px desktop viewport.
- Check alignment visually after every layout change; a passing build is not visual acceptance.
- Run `npm run check && npm run build` before handoff.
