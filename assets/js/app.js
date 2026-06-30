/**
 * allergenenchecker.nl — Application logic
 * Leest ENUM_DATABASE, ALLERGEN_INFO en CATEGORIEEN uit database.js
 */

'use strict';

/* ── Hulpfuncties ────────────────────────────────────────────── */

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

/* ── Zoeklogica ──────────────────────────────────────────────── */

/**
 * Zoek in ENUM_DATABASE op E-nummer of naam/alias.
 * Geeft array terug van max 10 { nummer, entry } objecten.
 */
function zoekENummer(query) {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const resultaten = [];

  for (const [nummer, entry] of Object.entries(ENUM_DATABASE)) {
    if (resultaten.length >= 10) break;

    const nrMatch    = nummer.toLowerCase().includes(q);
    const naamMatch  = entry.naam.toLowerCase().includes(q);
    const aliasMatch = entry.aliases.some(a => a.toLowerCase().includes(q));

    if (nrMatch || naamMatch || aliasMatch) {
      resultaten.push({ nummer, entry });
    }
  }

  // Exacte treffer bovenaan
  resultaten.sort((a, b) => {
    const aExact = a.nummer.toLowerCase() === q || a.entry.naam.toLowerCase() === q;
    const bExact = b.nummer.toLowerCase() === q || b.entry.naam.toLowerCase() === q;
    return (bExact ? 1 : 0) - (aExact ? 1 : 0);
  });

  return resultaten;
}

/* ── Render hulpfuncties ─────────────────────────────────────── */

function renderAllergeenBadges(allergenenArray) {
  return Object.entries(ALLERGEN_INFO).map(([key, info]) => {
    const actief = allergenenArray.includes(key);
    const stijl  = actief
      ? `background:${info.achtergrond};color:${info.kleur};border-color:${info.kleur};`
      : '';
    const cls    = actief ? '' : ' inactief';
    return `<span class="allergen-badge${cls}" style="${stijl}" title="${escapeHtml(info.beschrijving)}">
      <span class="badge-icon">${info.icon}</span> ${escapeHtml(info.naam)}
    </span>`;
  }).join('');
}

function renderResultaatKaart(nummer, entry) {
  const heeftAllergenen = entry.allergenen.length > 0;
  return `
    <div class="resultaat-kaart">
      <div class="resultaat-header">
        <span class="e-nummer-label">${escapeHtml(nummer)}</span>
        <span class="resultaat-naam">${escapeHtml(entry.naam)}</span>
      </div>
      <dl class="resultaat-meta">
        <dt>Functie</dt><dd>${escapeHtml(entry.functie)}</dd>
        <dt>Herkomst</dt><dd>${escapeHtml(entry.herkomst)}</dd>
        <dt>Categorie</dt><dd>${escapeHtml(entry.categorie)}</dd>
      </dl>
      <p class="resultaat-info">${escapeHtml(entry.info)}</p>
      <div class="allergenen-rij">
        ${renderAllergeenBadges(entry.allergenen)}
      </div>
    </div>`;
}

/* ── Zoeker (index.html) ─────────────────────────────────────── */

function initZoeker() {
  const input      = document.getElementById('zoek-input');
  const container  = document.getElementById('zoek-resultaten');
  if (!input || !container) return;

  function render(query) {
    if (!query.trim() || query.trim().length < 2) {
      container.innerHTML = '<p class="lege-staat">Typ een E-nummer (bijv. E621) of naam (bijv. glutamaat) om te zoeken.</p>';
      return;
    }

    const hits = zoekENummer(query);

    if (hits.length === 0) {
      container.innerHTML = `
        <div class="geen-resultaten">
          <div class="icon">🔍</div>
          <p>Geen resultaten voor <strong>${escapeHtml(query)}</strong>.<br>
          Probeer een ander E-nummer of ingrediëntnaam.</p>
        </div>`;
      return;
    }

    container.innerHTML = hits.map(({ nummer, entry }) =>
      renderResultaatKaart(nummer, entry)
    ).join('');
  }

  const debouncedRender = debounce(render, 220);

  input.addEventListener('input', () => debouncedRender(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      render(input.value);
    }
  });

  // URL-parameter afhandeling: ?zoek=E621
  const params = new URLSearchParams(window.location.search);
  const zoekParam = params.get('zoek') || params.get('q');
  if (zoekParam) {
    input.value = zoekParam;
    render(zoekParam);
    input.focus();
  } else {
    container.innerHTML = '<p class="lege-staat">Typ een E-nummer (bijv. E621) of naam (bijv. glutamaat) om te zoeken.</p>';
  }
}

/* ── Ingrediëntenscanner (index.html) ────────────────────────── */

/**
 * Tokeniseer een ingrediëntenlijst en identificeer E-nummers en allergenen.
 * Retourneert een array van { tekst, type } objecten.
 * type = 'normaal' | 'e-nummer' | 'allergen'
 */
function scanIngredientenlijst(tekst) {
  if (!tekst.trim()) return { tokens: [], gevondenENummers: [], gevondenAllergenen: new Set() };

  // Splits op komma's, puntkomma's, haakjes en naden maar behoud de scheidingstekens
  const ruwe = tekst.split(/([,;()\[\]]|\s+)/).filter(s => s !== '');

  const tokens = [];
  const gevondenENummers = [];
  const gevondenAllergenen = new Set();

  for (const stuk of ruwe) {
    const schoon = stuk.trim();
    if (!schoon) {
      tokens.push({ tekst: stuk, type: 'normaal' });
      continue;
    }

    // Controleer of het een E-nummer is (bijv. E621, e-621, e 621)
    const eNummerMatch = schoon.match(/^e[-\s]?(\d{3,4}[a-z]?)$/i);
    if (eNummerMatch) {
      const genormaliseerd = `E${eNummerMatch[1].toUpperCase()}`;
      const entry = ENUM_DATABASE[genormaliseerd];
      if (entry) {
        const heeftAllergeen = entry.allergenen.length > 0;
        const type = heeftAllergeen ? 'allergen' : 'e-nummer';
        tokens.push({ tekst: schoon, type, nummer: genormaliseerd, entry });
        gevondenENummers.push({ nummer: genormaliseerd, entry });
        if (heeftAllergeen) {
          entry.allergenen.forEach(a => gevondenAllergenen.add(a));
        }
        continue;
      }
    }

    // Controleer op bekende naam/alias in het token
    const lowerStuk = schoon.toLowerCase();
    let gevonden = false;
    for (const [nummer, entry] of Object.entries(ENUM_DATABASE)) {
      const naamMatch  = entry.naam.toLowerCase() === lowerStuk;
      const aliasMatch = entry.aliases.some(a => a.toLowerCase() === lowerStuk);
      if (naamMatch || aliasMatch) {
        const heeftAllergeen = entry.allergenen.length > 0;
        const type = heeftAllergeen ? 'allergen' : 'e-nummer';
        tokens.push({ tekst: schoon, type, nummer, entry });
        gevondenENummers.push({ nummer, entry });
        if (heeftAllergeen) {
          entry.allergenen.forEach(a => gevondenAllergenen.add(a));
        }
        gevonden = true;
        break;
      }
    }

    if (!gevonden) {
      tokens.push({ tekst: stuk, type: 'normaal' });
    }
  }

  return { tokens, gevondenENummers, gevondenAllergenen };
}

function renderScanOutput(tokens) {
  return tokens.map(token => {
    if (token.type === 'normaal') {
      return `<span class="scan-token normaal">${escapeHtml(token.tekst)}</span>`;
    }
    const titel = token.entry
      ? `${token.nummer}: ${token.entry.naam} — ${token.entry.functie}`
      : token.tekst;
    return `<span class="scan-token ${token.type}" title="${escapeHtml(titel)}">${escapeHtml(token.tekst)}</span>`;
  }).join('');
}

function renderScanSamenvatting(gevondenENummers, gevondenAllergenen) {
  const heeftAllergenen = gevondenAllergenen.size > 0;
  const allergeenNamen  = [...gevondenAllergenen].map(key => {
    const info = ALLERGEN_INFO[key];
    return info ? `${info.icon} ${info.naam}` : key;
  });

  let html = `<div class="samenvatting-kaart ${heeftAllergenen ? 'heeft-allergenen' : ''}">`;

  if (gevondenENummers.length === 0) {
    html += `<p class="samenvatting-titel">✅ Geen E-nummers herkend in deze lijst.</p>`;
  } else {
    html += `<p class="samenvatting-titel">
      ${heeftAllergenen ? '⚠️' : '✅'}
      ${gevondenENummers.length} E-nummer${gevondenENummers.length !== 1 ? 's' : ''} herkend
      ${heeftAllergenen ? `— let op ${gevondenAllergenen.size} EU-allerge${gevondenAllergenen.size !== 1 ? 'nen' : 'en'}` : '— geen EU-allergenen gevonden'}
    </p>`;

    if (heeftAllergenen) {
      html += `<div class="samenvatting-gevonden">
        ${allergeenNamen.map(n => `<span class="allergeen-chip">${n}</span>`).join('')}
      </div>`;
    }

    html += `<details style="margin-top:.75rem;font-size:.88rem;">
      <summary style="cursor:pointer;font-weight:600;color:var(--groen);">Bekijk gevonden E-nummers</summary>
      <ul style="margin-top:.5rem;padding-left:1.25rem;">
        ${gevondenENummers.map(({ nummer, entry }) =>
          `<li><strong>${nummer}</strong> — ${escapeHtml(entry.naam)}${entry.allergenen.length ? ` <span style="color:var(--rood)">(⚠️ ${entry.allergenen.map(k => ALLERGEN_INFO[k]?.naam || k).join(', ')})</span>` : ''}</li>`
        ).join('')}
      </ul>
    </details>`;
  }

  html += `</div>`;
  return html;
}

function initScanner() {
  const textarea   = document.getElementById('scan-input');
  const scanBtn    = document.getElementById('scan-btn');
  const wisBtn     = document.getElementById('scan-wis');
  const output     = document.getElementById('scan-output');
  const samenvatting = document.getElementById('scan-samenvatting');
  if (!textarea || !scanBtn) return;

  function uitvoeren() {
    const tekst = textarea.value;
    if (!tekst.trim()) {
      output.classList.remove('zichtbaar');
      samenvatting.classList.remove('zichtbaar');
      return;
    }

    const { tokens, gevondenENummers, gevondenAllergenen } = scanIngredientenlijst(tekst);

    output.innerHTML = renderScanOutput(tokens);
    output.classList.add('zichtbaar');

    samenvatting.innerHTML = renderScanSamenvatting(gevondenENummers, gevondenAllergenen);
    samenvatting.classList.add('zichtbaar');

    samenvatting.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  scanBtn.addEventListener('click', uitvoeren);

  if (wisBtn) {
    wisBtn.addEventListener('click', () => {
      textarea.value = '';
      output.classList.remove('zichtbaar');
      samenvatting.classList.remove('zichtbaar');
      output.innerHTML = '';
      samenvatting.innerHTML = '';
      textarea.focus();
    });
  }
}

/* ── FAQ accordeon ───────────────────────────────────────────── */

function initFAQ() {
  document.querySelectorAll('.faq-vraag').forEach(knop => {
    knop.addEventListener('click', () => {
      const antwoord = knop.nextElementSibling;
      const isOpen   = antwoord.classList.contains('open');

      // Sluit alle andere items
      document.querySelectorAll('.faq-antwoord.open').forEach(el => {
        el.classList.remove('open');
        el.previousElementSibling.classList.remove('open');
      });

      if (!isOpen) {
        antwoord.classList.add('open');
        knop.classList.add('open');
      }
    });
  });
}

/* ── Navigatie hamburger ─────────────────────────────────────── */

function initNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobielMenu = document.getElementById('nav-mobiel');
  if (!hamburger || !mobielMenu) return;

  hamburger.addEventListener('click', () => {
    mobielMenu.classList.toggle('open');
    const isOpen = mobielMenu.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Sluit menu bij klik op link
  mobielMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobielMenu.classList.remove('open'));
  });
}

/* ── E-nummers overzichtpagina ───────────────────────────────── */

function renderENummerOverzicht(filterCategorie) {
  const container = document.getElementById('e-nummers-container');
  if (!container) return;

  const categorieGroepen = {};
  for (const [nummer, entry] of Object.entries(ENUM_DATABASE)) {
    if (!categorieGroepen[entry.categorie]) {
      categorieGroepen[entry.categorie] = [];
    }
    categorieGroepen[entry.categorie].push({ nummer, entry });
  }

  let html = '';

  for (const [categorie, items] of Object.entries(categorieGroepen)) {
    if (filterCategorie && filterCategorie !== categorie) continue;

    const catInfo = Object.values(CATEGORIEEN).find(c => {
      // match op naam (sleutels zijn de namen)
      return true;
    });
    const range = CATEGORIEEN[categorie] ? CATEGORIEEN[categorie].range : '';

    html += `<div class="categorie-blok" data-categorie="${escapeHtml(categorie)}">
      <div class="categorie-titel">
        <h2>${escapeHtml(categorie)}</h2>
        ${range ? `<span class="categorie-range">${range}</span>` : ''}
      </div>
      <div style="overflow-x:auto;">
      <table class="e-tabel">
        <thead>
          <tr>
            <th>E-nummer</th>
            <th>Naam</th>
            <th>Functie</th>
            <th>Herkomst</th>
            <th>EU-Allergenen</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(({ nummer, entry }) => `
            <tr>
              <td class="e-num">${escapeHtml(nummer)}</td>
              <td><strong>${escapeHtml(entry.naam)}</strong></td>
              <td>${escapeHtml(entry.functie)}</td>
              <td>${escapeHtml(entry.herkomst)}</td>
              <td>${entry.allergenen.length
                ? entry.allergenen.map(a => {
                    const info = ALLERGEN_INFO[a];
                    return `<span class="allergeen-chip">${info ? info.icon + ' ' + info.naam : a}</span>`;
                  }).join('')
                : '<span style="color:var(--grijs-4);font-size:.8rem;">—</span>'
              }</td>
            </tr>`).join('')}
        </tbody>
      </table>
      </div>
    </div>`;
  }

  container.innerHTML = html || '<p>Geen E-nummers gevonden voor deze categorie.</p>';
}

function initENummersPagina() {
  if (!document.getElementById('e-nummers-container')) return;

  renderENummerOverzicht(null);

  // Filter knoppen
  document.querySelectorAll('.filter-btn').forEach(knop => {
    knop.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('actief'));
      knop.classList.add('actief');
      const filter = knop.dataset.filter === 'alle' ? null : knop.dataset.filter;
      renderENummerOverzicht(filter);
    });
  });
}

/* ── Actieve nav-link markeren ───────────────────────────────── */

function markeerActieveNavLink() {
  const pad = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobiel a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === pad || (pad === '' && href === 'index.html') || (pad === 'index.html' && href === 'index.html')) {
      link.classList.add('actief');
    }
  });
}

/* ── Initialisatie ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  markeerActieveNavLink();
  initNav();
  initZoeker();
  initScanner();
  initFAQ();
  initENummersPagina();
});
