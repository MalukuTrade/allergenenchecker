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
  if (!tekst.trim()) return { tokens: [], gevondenENummers: [], gevondenAllergenen: new Set(), gevondenIngredienten: [] };

  // Splits op komma's, puntkomma's, haakjes en naden maar behoud de scheidingstekens
  const ruwe = tekst.split(/([,;()\[\]]|\s+)/).filter(s => s !== '');

  const tokens = [];
  const gevondenENummers = [];
  const gevondenIngredienten = [];
  const gevondenAllergenen = new Set();
  const gezieneNummers = new Set(); // deduplicatie E-nummers

  for (const stuk of ruwe) {
    const schoon = stuk.trim();
    if (!schoon) {
      tokens.push({ tekst: stuk, type: 'normaal' });
      continue;
    }

    // 1. Controleer of het een E-nummer is (bijv. E621, e-621, e 621)
    const eNummerMatch = schoon.match(/^e[-\s]?(\d{3,4}[a-z]?)$/i);
    if (eNummerMatch) {
      const genormaliseerd = `E${eNummerMatch[1].toUpperCase()}`;
      const entry = ENUM_DATABASE[genormaliseerd];
      if (entry) {
        const heeftAllergeen = entry.allergenen.length > 0;
        const type = heeftAllergeen ? 'allergen' : 'e-nummer';
        tokens.push({ tekst: schoon, type, nummer: genormaliseerd, entry });
        if (!gezieneNummers.has(genormaliseerd)) {
          gevondenENummers.push({ nummer: genormaliseerd, entry });
          gezieneNummers.add(genormaliseerd);
        }
        if (heeftAllergeen) {
          entry.allergenen.forEach(a => gevondenAllergenen.add(a));
        }
        continue;
      }
    }

    // 2. Controleer op bekende naam/alias in ENUM_DATABASE
    const lowerStuk = schoon.toLowerCase();
    let gevonden = false;
    for (const [nummer, entry] of Object.entries(ENUM_DATABASE)) {
      const naamMatch  = entry.naam.toLowerCase() === lowerStuk;
      const aliasMatch = entry.aliases.some(a => a.toLowerCase() === lowerStuk);
      if (naamMatch || aliasMatch) {
        const heeftAllergeen = entry.allergenen.length > 0;
        const type = heeftAllergeen ? 'allergen' : 'e-nummer';
        tokens.push({ tekst: schoon, type, nummer, entry });
        if (!gezieneNummers.has(nummer)) {
          gevondenENummers.push({ nummer, entry });
          gezieneNummers.add(nummer);
        }
        if (heeftAllergeen) {
          entry.allergenen.forEach(a => gevondenAllergenen.add(a));
        }
        gevonden = true;
        break;
      }
    }
    if (gevonden) continue;

    // 3. Controleer op gangbare ingrediëntnaam uit INGREDIENTEN_ALLERGENEN
    if (typeof INGREDIENTEN_ALLERGENEN !== 'undefined') {
      const allergenenVoorIngredient = INGREDIENTEN_ALLERGENEN[lowerStuk];
      if (allergenenVoorIngredient) {
        tokens.push({ tekst: schoon, type: 'allergen', ingredientAllergenen: allergenenVoorIngredient });
        gevondenIngredienten.push({ tekst: schoon, allergenen: allergenenVoorIngredient });
        allergenenVoorIngredient.forEach(a => gevondenAllergenen.add(a));
        continue;
      }
    }

    tokens.push({ tekst: stuk, type: 'normaal' });
  }

  return { tokens, gevondenENummers, gevondenAllergenen, gevondenIngredienten };
}

function renderScanOutput(tokens) {
  return tokens.map(token => {
    if (token.type === 'normaal') {
      return `<span class="scan-token normaal">${escapeHtml(token.tekst)}</span>`;
    }
    let titel;
    if (token.ingredientAllergenen) {
      const namen = token.ingredientAllergenen.map(k => ALLERGEN_INFO[k] ? ALLERGEN_INFO[k].naam : k).join(', ');
      titel = `Allergeen: ${namen}`;
    } else if (token.entry) {
      titel = `${token.nummer}: ${token.entry.naam} (${token.entry.functie})`;
    } else {
      titel = token.tekst;
    }
    return `<span class="scan-token ${token.type}" title="${escapeHtml(titel)}">${escapeHtml(token.tekst)}</span>`;
  }).join('');
}

function renderScanSamenvatting(gevondenENummers, gevondenAllergenen, gevondenIngredienten) {
  const heeftAllergenen = gevondenAllergenen.size > 0;
  const allergeenNamen  = [...gevondenAllergenen].map(key => {
    const info = ALLERGEN_INFO[key];
    return info ? `${info.icon} ${info.naam}` : key;
  });
  const aantalHerkend = gevondenENummers.length + (gevondenIngredienten ? gevondenIngredienten.length : 0);

  let html = `<div class="samenvatting-kaart ${heeftAllergenen ? 'heeft-allergenen' : ''}">`;

  if (aantalHerkend === 0) {
    html += `<p class="samenvatting-titel">✅ Geen bekende stoffen of allergenen herkend in deze lijst.</p>`;
  } else {
    const onderdelen = [];
    if (gevondenENummers.length > 0) {
      onderdelen.push(`${gevondenENummers.length} E-nummer${gevondenENummers.length !== 1 ? 's' : ''}`);
    }
    if (gevondenIngredienten && gevondenIngredienten.length > 0) {
      onderdelen.push(`${gevondenIngredienten.length} ingrediënt${gevondenIngredienten.length !== 1 ? 'namen' : 'naam'}`);
    }

    html += `<p class="samenvatting-titel">
      ${heeftAllergenen ? '⚠️' : '✅'}
      ${onderdelen.join(' en ')} herkend${heeftAllergenen ? `, let op ${gevondenAllergenen.size} EU-allerge${gevondenAllergenen.size !== 1 ? 'nen' : 'een'}` : ', geen EU-allergenen gevonden'}
    </p>`;

    if (heeftAllergenen) {
      html += `<div class="samenvatting-gevonden">
        ${allergeenNamen.map(n => `<span class="allergeen-chip">${n}</span>`).join('')}
      </div>`;
    }

    const eNummerItems = gevondenENummers.map(({ nummer, entry }) => {
      const allergeenHtml = entry.allergenen.length
        ? `<span style="color:var(--rood);font-weight:600;font-size:.78rem;">⚠️ ${entry.allergenen.map(k => ALLERGEN_INFO[k] ? ALLERGEN_INFO[k].naam : k).join(', ')}</span>`
        : `<span style="color:var(--grijs-4);font-size:.78rem;">Geen EU-allergenen</span>`;
      return `<li style="list-style:none;padding:.7rem .85rem;background:var(--wit);border-radius:6px;border-left:3px solid var(--groen);box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-bottom:.2rem;">
          <code style="background:var(--groen-licht);color:var(--groen);padding:.1rem .4rem;border-radius:4px;font-size:.83rem;font-weight:700;">${escapeHtml(nummer)}</code>
          <strong style="font-size:.9rem;">${escapeHtml(entry.naam)}</strong>
          ${allergeenHtml}
        </div>
        <div style="font-size:.77rem;color:var(--grijs-4);margin-bottom:.3rem;">${escapeHtml(entry.functie)} &middot; ${escapeHtml(entry.herkomst)}</div>
        <div style="font-size:.83rem;color:var(--tekst);line-height:1.45;">${escapeHtml(entry.info)}</div>
      </li>`;
    });
    const ingredientItems = gevondenIngredienten ? gevondenIngredienten.map(({ tekst, allergenen }) => {
      const namen = allergenen.map(k => ALLERGEN_INFO[k] ? `${ALLERGEN_INFO[k].icon} ${ALLERGEN_INFO[k].naam}` : k).join(', ');
      return `<li style="list-style:none;padding:.7rem .85rem;background:var(--wit);border-radius:6px;border-left:3px solid var(--oranje);box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-bottom:.2rem;">
          <strong style="color:var(--oranje);font-size:.9rem;">${escapeHtml(tekst)}</strong>
          <span style="color:var(--rood);font-weight:600;font-size:.78rem;">⚠️ ${namen}</span>
        </div>
        <div style="font-size:.77rem;color:var(--grijs-4);">Herkend als allergeen ingrediënt</div>
      </li>`;
    }) : [];
    const alleItems = [...eNummerItems, ...ingredientItems];

    if (alleItems.length > 0) {
      html += `<details style="margin-top:.75rem;">
        <summary style="cursor:pointer;font-weight:600;color:var(--groen);font-size:.9rem;">Bekijk herkende stoffen (${alleItems.length})</summary>
        <ul style="margin:.75rem 0 0;padding:0;display:flex;flex-direction:column;gap:.5rem;">
          ${alleItems.join('')}
        </ul>
      </details>`;
    }
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

    const { tokens, gevondenENummers, gevondenAllergenen, gevondenIngredienten } = scanIngredientenlijst(tekst);

    output.innerHTML = renderScanOutput(tokens);
    output.classList.add('zichtbaar');

    samenvatting.innerHTML = renderScanSamenvatting(gevondenENummers, gevondenAllergenen, gevondenIngredienten);
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

/* ── Tabbladen (index.html) ──────────────────────────────────── */

function initTabs() {
  const tabs   = document.querySelectorAll('.tab-knop');
  const panels = document.querySelectorAll('.tab-panel');
  if (!tabs.length) return;

  function activeer(doel) {
    tabs.forEach(t => {
      const isActief = t === doel;
      t.classList.toggle('actief', isActief);
      t.setAttribute('aria-selected', isActief);
    });
    panels.forEach(p => {
      const isActief = p.id === doel.getAttribute('aria-controls');
      p.classList.toggle('actief', isActief);
      p.hidden = !isActief;
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activeer(tab));
    tab.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const lijst  = [...tabs];
        const huidig = lijst.indexOf(document.activeElement);
        const volgend = e.key === 'ArrowRight'
          ? (huidig + 1) % lijst.length
          : (huidig - 1 + lijst.length) % lijst.length;
        lijst[volgend].focus();
        activeer(lijst[volgend]);
      }
    });
  });

  // Als URL-parameter ?zoek= aanwezig is, open de zoektab direct
  const params = new URLSearchParams(window.location.search);
  if (params.get('zoek') || params.get('q')) {
    const zoekTab = document.getElementById('tab-zoek');
    if (zoekTab) activeer(zoekTab);
  }
}

/* ── Initialisatie ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  markeerActieveNavLink();
  initNav();
  initTabs();
  initZoeker();
  initScanner();
  initFAQ();
  initENummersPagina();
});
