# allergenenchecker.nl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, deployable static website for allergenenchecker.nl with 150+ E-number database, live search tool, ingredient scanner, 5 HTML pages, and full SEO.

**Architecture:** Pure HTML/CSS/JS split across shared assets. `database.js` is the isolated data layer (replaceable with API later). `app.js` reads from `database.js` globals and drives the UI. Each HTML page links both. Mobile-first CSS in `style.css`. No build step, no dependencies.

**Tech Stack:** HTML5, CSS3 (custom properties + grid/flexbox), vanilla JS ES6+, JSON-LD structured data.

---

## File Map

| File | Responsibility |
|------|---------------|
| `assets/js/database.js` | Data only — `ENUM_DATABASE` object (150+ entries) + `ALLERGEN_INFO` + `CATEGORIEEN` constants |
| `assets/js/app.js` | UI logic — search, scanner, DOM rendering. Reads from `ENUM_DATABASE` global |
| `assets/css/style.css` | All styles — design tokens, layout, components, responsive |
| `index.html` | Homepage: search tool + ingredient scanner + FAQ (10q) + JSON-LD + OG |
| `e-nummers.html` | E-number overview, grouped by category, with filter |
| `allergenen.html` | 14 EU allergens explained with product examples |
| `horeca.html` | Hospitality page: NVWA regulations, HACCP, labelling obligations |
| `privacy.html` | Privacy policy suitable for Google AdSense approval |
| `README.md` | GitHub Pages + custom domain deployment guide |

## Data Schema (database.js)

```js
// Each E-number entry:
{
  naam: "Mononatriumglutamaat",
  functie: "Smaakversterker",
  herkomst: "Synthetisch / Gefermenteerd",
  categorie: "Smaakversterkers",
  aliases: ["msg", "glutamaat", "natriumglutamaat"],
  allergenen: [],        // subset of: gluten, schaal, eieren, vis, pinda, soja, melk, noten, selderij, mosterd, sesam, sulfiet, lupine, weekdieren
  info: "..."            // 1-2 zinnen uitleg in het Nederlands
}

// 14 EU allergens:
ALLERGEN_INFO["gluten"] = { naam: "Gluten", kleur: "#c0392b", beschrijving: "...", voorbeelden: ["tarwe", "rogge", "gerst"] }

// Categories:
CATEGORIEEN["Kleurstoffen"] = { range: "E100–E199", beschrijving: "..." }
```

---

### Task 1: Create database.js

**Files:**
- Create: `assets/js/database.js`

- [ ] Write `ALLERGEN_INFO` constant (14 EU allergens with naam, kleur, beschrijving, voorbeelden)
- [ ] Write `CATEGORIEEN` constant (9 categories with range and beschrijving)
- [ ] Write `ENUM_DATABASE` object with entries E100–E999 (150+ entries, all fields populated)
- [ ] Verify: open browser console, `Object.keys(ENUM_DATABASE).length` returns ≥ 150
- [ ] Commit: `git add assets/js/database.js && git commit -m "feat: add E-number database (150+ entries)"`

### Task 2: Create style.css

**Files:**
- Create: `assets/css/style.css`

- [ ] Write CSS custom properties (`:root` with color tokens, spacing, typography)
- [ ] Write reset + base styles
- [ ] Write nav component (hamburger on mobile, horizontal on desktop)
- [ ] Write hero/search section styles (above fold)
- [ ] Write result card component
- [ ] Write allergen badge grid (14 items, active/inactive states)
- [ ] Write ingredient scanner section
- [ ] Write highlighted token styles (normal/e-number/allergen)
- [ ] Write FAQ section styles
- [ ] Write footer styles
- [ ] Write `@media (max-width: 768px)` overrides
- [ ] Verify: open index.html in browser, check mobile (375px) and desktop (1280px)
- [ ] Commit: `git add assets/css/style.css && git commit -m "feat: add responsive stylesheet"`

### Task 3: Create app.js

**Files:**
- Create: `assets/js/app.js`

- [ ] Write `zoekENummer(query)` — case-insensitive match on nummer, naam, aliases; returns array of `[nummer, entry]` pairs
- [ ] Write `renderResultaat(nummer, entry)` — returns HTML string for a result card with all allergen badges
- [ ] Write `renderAllergeenBadges(allergenenArray)` — returns badge HTML for all 14, active class if in array
- [ ] Write `initZoeker()` — binds input event on `#zoek-input`, debounces 200ms, calls zoekENummer, renders into `#zoek-resultaten`
- [ ] Write `scanIngredientenlijst(text)` — tokenizes on comma/semicolon/whitespace, matches tokens against ENUM_DATABASE nummers and aliases, returns `{tokens, gevonden}` object
- [ ] Write `renderScanResultaat(scanResult)` — wraps each token in `<span class="token [type]">` where type is `normaal`, `e-nummer`, or `allergen`
- [ ] Write `initScanner()` — binds `#scan-btn` click, calls scanIngredientenlijst, renders into `#scan-output`, shows `#scan-samenvatting` with allergen count
- [ ] Write `renderENummerOverzicht()` — groups ENUM_DATABASE by categorie, renders full table for e-nummers.html
- [ ] Write `init()` — calls initZoeker() + initScanner() on DOMContentLoaded
- [ ] Verify: search "E621" returns result; search "glutamaat" returns same; paste "water, E621, E330, tarwe" in scanner, verify E621 highlighted orange, tarwe NOT highlighted (not an E-number)
- [ ] Commit: `git add assets/js/app.js && git commit -m "feat: add search and scanner logic"`

### Task 4: Create index.html

**Files:**
- Create: `index.html`

- [ ] Write `<head>` with title, meta description, OG tags, canonical, charset, viewport
- [ ] Write JSON-LD FAQPage schema (10 questions)
- [ ] Write nav with links to all 5 pages
- [ ] Write hero section with `#zoek-input` and `#zoek-resultaten`
- [ ] Write ingredient scanner section with textarea `#scan-input`, button `#scan-btn`, output `#scan-output`, summary `#scan-samenvatting`
- [ ] Write FAQ section (10 Q&A pairs visible on page, matches JSON-LD)
- [ ] Write footer with links + copyright
- [ ] Link style.css, database.js, app.js
- [ ] Verify: page loads, search works, scanner works, FAQ visible
- [ ] Commit: `git add index.html && git commit -m "feat: add homepage with search and scanner"`

### Task 5: Create e-nummers.html

**Files:**
- Create: `e-nummers.html`

- [ ] Write full page with shared nav/footer
- [ ] Write unique title + meta + OG
- [ ] Write intro paragraph
- [ ] Write `<div id="e-nummers-container">` — filled by `renderENummerOverzicht()` from app.js
- [ ] Write category filter buttons (Kleurstoffen, Conserveermiddelen, etc.)
- [ ] Bind filter buttons in app.js to show/hide categories
- [ ] Verify: all categories show, filter buttons work
- [ ] Commit: `git add e-nummers.html && git commit -m "feat: add E-numbers overview page"`

### Task 6: Create allergenen.html

**Files:**
- Create: `allergenen.html`

- [ ] Write full page with shared nav/footer
- [ ] Write unique title + meta + OG
- [ ] Write intro section (EU Regulation 1169/2011)
- [ ] Write one section per allergen (14 total), each with: naam, beschrijving, voorbeelden, E-nummers die het bevatten
- [ ] Verify: all 14 allergens present with content
- [ ] Commit: `git add allergenen.html && git commit -m "feat: add 14 EU allergens page"`

### Task 7: Create horeca.html

**Files:**
- Create: `horeca.html`

- [ ] Write full page with shared nav/footer
- [ ] Write unique title + meta + OG
- [ ] Write intro section about NVWA allergen labelling obligation
- [ ] Write section on EU Regulation 1169/2011 requirements for non-prepacked foods
- [ ] Write HACCP section (allergen management in kitchen)
- [ ] Write practical checklist for operators (menu cards, staff training, cross-contamination)
- [ ] Write FAQ for hospitality (5 questions)
- [ ] Verify: page renders correctly, all sections present
- [ ] Commit: `git add horeca.html && git commit -m "feat: add hospitality/NVWA page"`

### Task 8: Create privacy.html

**Files:**
- Create: `privacy.html`

- [ ] Write full AdSense-compliant privacy policy with: data controller info (allergenenchecker.nl), cookies section, Google AdSense disclosure, Analytics section (if applicable), user rights under GDPR/AVG, contact info
- [ ] Write unique title + meta + OG
- [ ] Verify: page renders, all required AdSense sections present
- [ ] Commit: `git add privacy.html && git commit -m "feat: add AdSense-ready privacy policy"`

### Task 9: Create README.md

**Files:**
- Create: `README.md`

- [ ] Write project description
- [ ] Write GitHub Pages deployment steps (repo settings, branch, URL)
- [ ] Write custom domain steps (DNS records: A records + CNAME, CNAME file in repo)
- [ ] Write local development instructions (just open index.html)
- [ ] Commit: `git add README.md && git commit -m "docs: add deployment README"`
