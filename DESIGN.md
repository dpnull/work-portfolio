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

Use the shared size tokens: `--text-hero` (32–40px) for page titles, `--text-section` (24–32px) for section headings, `--text-subheading` (20–24px) for card/service titles, `--text-body` (16px) for prose and `--text-caption` (14px) for captions and secondary links. Do not introduce component-specific heading scales or enlarge paragraphs on desktop. Navigation and graphic/data labels have separate compact roles; display statistics remain distinct.

Kode Mono is reserved for runtimes, bookmark tabs, small schematic marks and developer controls. It is not a second body or heading face. `CINEMATIC` and `BRAND DEAL` must use the same label tokens.

## Layout

- Page content caps at `--container-page` (`76rem`).
- Standard page gutters are `24px` on small screens and `32px` from the `sm` breakpoint.
- Video previews cap at `--video-preview-width` (240px wide, about 427px tall at 9:16). Use two columns on phones, three from 640px and four from 1024px, with 24px gaps from 640px. Center capped grids rather than stretching previews to fill the page. Cinematic previews use the same cap and gain their third column at 640px.
- A three-card row keeps the same card width and gap, then centers the group in the container.
- Hero copy remains left-aligned but the copy block is centered inside its column.

## Colour and geometry

- Use the semantic colour tokens in `src/styles/global.css`; do not hardcode component colours.
- The approved palette is Chalk & Cobalt: chalk `#F1F3F4`, ink `#202C40`, cobalt `#3156D8`, and citron `#D5EF83`. Shared definitions also power the colour review page.
- Keep the added styling: lighter grain, citron heading marks and photo tabs, solid accent CTAs and the filled email-result circle. Use these accents selectively while preserving the existing layout.
- Corners stay square. Borders are normally one pixel and use the relevant `line` token.
- Cinematic work uses the cinema palette; text roles and spacing remain consistent with the main page.

## Component rules

- Header trial: centered floating paper frame, a shallow inset, an even 6px paper border and an independent citron wordmark sticker floating gently in the left gutter. This header is the exception to the flat geometry rule; keep its shadow quiet. The menu is 52px tall with a 28px desktop top offset; from 440px to 899px the menu aligns right with the sticker to its left; below 440px a smaller sticker sits above-left and the menu starts at 44px. Navigation stays in one compact row, using the shared sans face with equal 12px button side padding (8px on phones), no extra inset padding and no inter-button gap. On phones the booking label is shortened to "Book a call". The same fixed header persists across pages; only the active page highlight changes. Keep the shared booking action and omit the email address. Its named transition group stays above all moving photos and titles.
- The three Creative Tech case-study sections share one centered 672px content column, including headings, prose, database results and diagrams; do not mix a full-width proof section with narrow diagrams.
- Creative Tech diagrams share a 1016×256 source canvas, trimmed source margins and zero CSS inset padding, aligned left with the audience-results stage. Cap wide diagrams at `--graphic-stage-width` (672px); compact views use matching 264×275 panel crops and cap columns at `--graphic-panel-width` (144px).
- Proof strip: stat, label and explanation must read as three distinct levels.
- Bookmark tabs: same mono label styling, 30px height and one-pixel outline.
- Video titles use Instrument Sans medium; descriptions use Instrument Sans regular and the relevant dim colour.
- Portfolio descriptions are miniature case studies: name the creative approach and the strategic job it did. Do not narrate what the adjacent video already shows or repeat metrics already visible on the poster.
- Keep each description to one compact sentence. Use an outcome only when it adds meaning that is not already shown; otherwise describe the creative intent, production constraint or client objective. Never imply an unverified result.

## Review checklist

- Compare at 375px, 768px and the annotated 1081px desktop viewport.
- Check alignment visually after every layout change; a passing build is not visual acceptance.
- Run `npm run check && npm run build` before handoff.
