# UI Review — AllergenenChecker.nl

**Audited:** 2026-06-30
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md found)
**Screenshots:** Not captured (no dev server detected at localhost:3000/5173/8080)
**Audit scope:** index.html, e-nummers.html, allergenen.html, horeca.html, privacy.html, assets/css/style.css, assets/js/app.js

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Two confirmed typos in FAQ content; nav labels inconsistent across pages |
| 2. Visuals | 3/4 | Two semantically wrong icons; allergen card CSS class mismatch breaks hover styles |
| 3. Color | 4/4 | Consistent design token system; all primary contrast ratios pass WCAG AA |
| 4. Typography | 3/4 | Font size scale is overdense (14+ distinct sizes); no dedicated focus ring on buttons |
| 5. Spacing | 3/4 | Section rhythm is slightly inconsistent; stats dividers rendered but always hidden |
| 6. Experience Design | 3/4 | No cookie consent banner despite AdSense/Analytics; FAQ implementation differs across pages; no skip link |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **No cookie consent banner despite Google AdSense and Analytics** — The privacy policy at privacy.html explicitly describes AdSense cookie tracking, but there is no consent mechanism on the site. Under the Dutch Telecommunicatiewet and AVG, using advertising cookies without prior consent is a legal violation. Risk: regulatory fine from AP, AdSense policy breach. Fix: implement a cookie consent banner that blocks Analytics and AdSense until the user accepts. A lightweight solution like `cookieconsent` (MIT) or a custom banner writing a `cookie_consent=true` cookie is sufficient given the site has no framework.

2. **Allergen card CSS class mismatch on index.html** — The CSS defines `.allergen-kaartje` (style.css line 552) but index.html uses `class="allergeen-kaart"` (lines 239–322). This means the hover lift (`transform: translateY(-2px)`), border color change, and box-shadow on hover are all dead — none of the 14 allergen cards animate on mouse over. Fix: change all `allergeen-kaart` class references in index.html to `allergen-kaartje`, and rename child span classes from `allergeen-icoon`/`allergeen-naam`/`allergeen-sub` to `icon`/`naam` respectively, or create a matching CSS block for the existing HTML class names.

3. **Two typos in surfaced FAQ content** — "calciumwaterstofsufliet" and "kaliumwaterstofsufliet" (both spelled with "sufliet" instead of "sulfiet") appear in the JSON-LD schema on index.html line 86 and in the visible FAQ answer on line 443, plus "mosterdbplant" (mosterdbplant → mosterdplant) on allergenen.html line 393. The schema version is read by Google's rich results crawler. Fix: correct all three in the source HTML.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Strengths:**
- Dutch throughout, well-written, legally accurate descriptions of EU 1169/2011 and NVWA obligations
- FAQ answers are thorough and genuinely useful; each question is specific rather than generic
- Strong disclaimers consistently repeated across all pages
- CTAs are specific: "Scan ingrediënten", "Meer over alle 14 allergenen →", "Gebruik onze E-nummers & Allergenencheck →" — all action-oriented, no generic "Click here"
- Empty states are informative: "Typ een E-nummer (bijv. E621) of naam (bijv. glutamaat) om te zoeken" (app.js line 101)

**Issues:**

MINOR — Typos in FAQ text and JSON-LD schema:
- index.html line 86 (JSON-LD): "calciumwaterstofsufliet", "kaliumwaterstofsufliet" — should be "calciumwaterstof**sul**fiet" (spelling error in indexed schema)
- index.html line 443 (visible FAQ): same two typos repeated
- allergenen.html line 393: "mosterdb**plant**" → "mosterd**plant**"

MINOR — Navigation label inconsistency across pages:
- index.html: first nav link is "Home"
- privacy.html: first nav link is "Zoeken"
- allergenen.html: first nav link is "Zoektool"
- horeca.html: first nav link is "Zoektool"
- e-nummers.html adds an "Over ons" link that does not exist on any other page, pointing to a non-existent `over-ons.html`

MINOR — e-nummers.html footer links to `disclaimer.html` (line 318) and `over-ons.html#contact` (line 319), neither of which exists in the file listing.

MINOR — Footer heading mismatch on index.html: `<h3 class="footer-koptitel">` (lines 484, 495) vs all other pages which use `<h4>` in footer columns. The CSS only styles `footer-kolom h4` (style.css line 975), so these h3 headings render unstyled.

---

### Pillar 2: Visuals (3/4)

**Strengths:**
- 14 allergen grid is visually distinctive with emoji icons; emoji load reliably across all modern OS/browser combinations
- Result cards have a clean header strip with the E-number in a green pill, followed by a name, description list, and allergen badge row — good information hierarchy
- Scanner output renders inline highlighted tokens (yellow for E-numbers, red for allergens) which creates clear visual scanning
- Summary card correctly switches between green (safe) and red (allergens found) border-left accent

**Issues:**

CRITICAL — Allergen grid hover styles broken due to CSS class mismatch:
- CSS: `.allergen-kaartje` + `.allergen-kaartje:hover` (style.css lines 552–570)
- HTML: `class="allergeen-kaart"` (index.html lines 239–322)
- Result: hover transform, border-color change, and box-shadow are all missing. The grid cards appear flat and non-interactive.
- Child classes also mismatched: CSS expects `.icon` and `.naam`; HTML uses `.allergeen-icoon`, `.allergeen-naam`, `.allergeen-sub`

MINOR — Two semantically inaccurate emoji icons in the allergen grid:
- Mosterd (mustard): uses 🌻 (sunflower). Mustard comes from Brassica/Sinapis plants, not sunflowers. Better: 🟡 or a different plant emoji.
- Sesamzaad: uses 🌿 (herb/generic plant). The same 🌿 is used for the site logo ("AllergenenChecker.nl" in header). This creates visual ambiguity between brand and content. Better: use a more specific emoji or a simple seed illustration.
- Zwaveldioxide: ⚗️ (alembic/chemistry flask) is fine for a chemical but is quite obscure for a consumer audience. Acceptable but worth noting.

MINOR — The `stat-divider` elements on index.html (lines 341, 348) are rendered in HTML but the CSS sets `.stats-divider { display: none; }` (style.css line 1097). These are dead DOM nodes. Either implement the dividers visually or remove the HTML.

MINOR — No favicon defined in any page's `<head>`. The OG image is referenced (`og-image.png`) but a `<link rel="icon">` is missing, resulting in a blank tab icon.

---

### Pillar 3: Color (4/4)

**Strengths:**
- All colors are defined as CSS custom properties (design tokens) in `:root` with Dutch naming — well-structured, single source of truth
- Primary green (#2d7a4f) used for CTAs, active states, badges, section accents — consistent and not overused
- Clear semantic color coding:
  - Green = safe / active / primary action
  - Red = allergen alert / warning
  - Yellow = caution / advisory
  - Blue = informational banner
- Contrast ratios pass WCAG AA 4.5:1 for all body text:
  - `--tekst` (#212529) on white: ~16:1
  - `--groen` (#2d7a4f) on white: ~5.3:1 (AA pass for normal text)
  - `--grijs-4` (#6c757d) on white: ~4.6:1 (borderline AA — passes)
- Only two hardcoded hex values outside the token system: `#fff3cd` and `#856404` on style.css line 507 (scan token E-number highlight), and `#7d5a00` on line 790 (warning card heading). These are minor but should be added as tokens.
- `--blauw` (#2980b9) and `--paars` (#8e44ad) are defined in tokens but appear unused in the rendered pages — no dead weight in the HTML.

**Minor:**
- The banner-info hardcodes `background: #e3f2fd; color: #1565c0; border-left: 4px solid #1976d2` (style.css lines 868–870) — three more off-token values. These should become `--blauw-licht`, `--blauw-donker`, `--blauw` references for consistency.

---

### Pillar 4: Typography (3/4)

**Strengths:**
- System font stack is appropriate for a utility site: fast, legible, zero flash of invisible text
- `clamp()` for h1 and h2 ensures fluid scaling between mobile and desktop without breakpoint jumps
- Line-height 1.6 on body (style.css line 49) and 1.65 on FAQ answers — good reading comfort for Dutch long-form text
- Font weight variation is intentional: 700 for headings, 600 for labels/CTAs, 500 for nav links, 400 for body

**Issues:**

MINOR — Font size scale is overdense with 14+ discrete sizes across the stylesheet:
`2.5rem`, `2rem`, `1.75rem`, `1.3rem`, `1.2rem`, `1.1rem`, `1.05rem`, `1rem`, `.95rem`, `.93rem`, `.9rem`, `.88rem`, `.85rem`, `.82rem`, `.8rem`, `.78rem`, `.75rem`
This is more than twice the recommended 4–6 levels for a utility site. The differences between `.93rem` and `.95rem`, or `.82rem` and `.85rem`, are imperceptible to users and create maintenance overhead.

MINOR — No explicit `:focus-visible` ring on `.btn` and `.btn-groen` (style.css lines 249–279). Only `.zoek-input` (line 241) and `.scanner-textarea` (line 477) have focus styles. This means keyboard users activating the "Scan ingrediënten" button or "Zoeken" button see no focus indicator — a WCAG 2.1 SC 2.4.7 (Focus Visible) failure.

MINOR — `h3` is set to a fixed `1.1rem` (style.css line 66) with no responsive scaling, while h1/h2 use clamp. On small screens this means h3 and body text (1rem) are barely distinguishable in size — relying entirely on font-weight to differentiate.

---

### Pillar 5: Spacing (3/4)

**Strengths:**
- Container padding scales responsibly: 1rem mobile → 1.5rem tablet → 2rem → 2.5rem desktop
- Card padding is consistent at 1.25rem–1.5rem across `.resultaat-kaart`, `.info-kaart`, `.tools-kaart`, `.stat-item`
- Gap values follow a small set: 0.35rem (chips), 0.4–0.5rem (small row gaps), 0.75rem (card internals), 1rem–1.5rem (grid/section gaps) — reasonable rhythm

**Issues:**

MINOR — Section vertical spacing is inconsistent across pages. The `.sectie` utility class provides `3rem 0` padding (style.css line 82), but individual section overrides fragment this:
- `.tools-sectie`: `0 0 2.5rem` (line 391) — no top padding
- `.allergenen-sectie`: `2rem 0` (line 1096)
- `.stats-sectie`: `2rem 0` (line 1073)
- `.faq-sectie`: `3rem 0` (line 576)
- `.hero`: `2.5rem 0 2rem` plus a second override `padding-bottom: 3.5rem` (line 387)
This means sections have 2rem, 2.5rem, or 3rem vertical padding with no clear hierarchy — the visual rhythm changes from page to page.

MINOR — The stylesheet bottom (lines 1058–1097) is an "alias" block that redefines many rules already defined earlier:
- `.stats-sectie` defined at line 1073 duplicates behavior
- `.scanner-sectie` defined at line 453 then re-aliased at line 1071
- `.zoek-knop` (line 1064) is a pixel-for-pixel copy of `.btn-groen` (lines 266–271)
- `.knop-primair` (line 1076) is another identical copy
This adds ~2KB of dead duplicate CSS and makes maintenance harder.

MINOR — `allergenen.html` line 157: `<h2 style="margin-bottom:1.5rem;">` and multiple other inline styles across that file (23 total inline `style=` attributes). `horeca.html` has 11. These inline overrides undermine the design token system and are difficult to update globally.

---

### Pillar 6: Experience Design (3/4)

**Strengths:**
- Tab widget on index.html is fully ARIA-compliant: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, `aria-labelledby`, keyboard arrow navigation (app.js lines 459–468)
- URL parameter handling: `?zoek=E621` or `?q=E621` opens the search tab and pre-fills + runs the query (app.js lines 133–141)
- `aria-live="polite"` on all dynamic output regions (search results, scan summary, scan output) — screen readers announce results without aggressive interruption
- FAQ accordion correctly updates `aria-expanded` on the button
- Scanner "Wissen" button resets state and returns focus to textarea (app.js line 298)
- Debounced search at 220ms prevents excessive lookups during typing (app.js line 122)
- Empty states for search are descriptive with a concrete example: "Typ een E-nummer (bijv. E621) of naam (bijv. glutamaat)"
- No-results state shows a magnifying glass icon and a specific suggestion (app.js lines 109–114)

**Issues:**

CRITICAL — No cookie consent banner. The privacy policy (privacy.html sections 3–5) explicitly describes Google AdSense and Google Analytics cookie usage. Under Dutch Telecommunicatiewet article 11.7a, advertising cookies require prior informed consent. There is no banner, no consent gate, and no opt-in mechanism anywhere on the site. This is the most significant legal/UX gap in the current implementation.

MINOR — FAQ implementation differs across pages:
- `index.html`: uses `app.js initFAQ()` which toggles `.open` class, relies on `faq-antwoord { display: none }` with `.faq-antwoord.open { display: block }` from CSS
- `index.html` FAQ items start with `hidden` HTML attribute on the answer div — but `initFAQ()` in app.js never removes the `hidden` attribute, only adds/removes the `.open` class. The CSS `.faq-antwoord.open { display: block }` (line 632) will be overridden by the HTML `hidden` attribute, so **FAQ items on index.html may never open correctly**.
- `allergenen.html`: uses inline `onclick="toggleFaq(this)"` with an inline `<script>` at the bottom of the page (line 629), independent of app.js
- `horeca.html`: uses an IIFE in an inline `<script>` (lines 510–532) that correctly updates `aria-expanded`
- This fragmentation means each page uses a different pattern; the index.html pattern has the `hidden` + class conflict bug

MINOR — No skip navigation link on any page. Keyboard users must tab through the 5-item navigation on every page before reaching main content. This violates WCAG 2.4.1 (Bypass Blocks).

MINOR — Mobile hamburger menu: `allergenen.html` uses `onclick="toggleMobielMenu(this)"` (line 98) with an inline function, while `index.html` and `privacy.html` use `initNav()` from app.js and an IIFE respectively. No page initializes the mobile nav through the same mechanism, creating maintenance risk.

MINOR — Scanner gives no feedback when the user clicks "Scan ingrediënten" with an empty textarea — the output areas simply stay hidden with no message. A brief "Plak eerst een ingrediëntenlijst" message would improve the empty-submit experience.

MINOR — The `<details>` element used for the E-number list in scan results (app.js line 248) uses inline `style` attributes rather than CSS classes, and the `<summary>` uses `color:var(--groen)` inline. This is a minor consistency gap.

---

## Registry Safety

No `components.json` found. shadcn not initialized. Registry audit skipped.

---

## Files Audited

- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\index.html`
- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\assets\css\style.css`
- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\assets\js\app.js`
- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\e-nummers.html`
- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\allergenen.html`
- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\horeca.html`
- `c:\Users\PC\Documents\Claude code\allergenenchecker.nl\privacy.html`
