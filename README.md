# AllergenesChecker.nl

Gratis, statische website waarmee consumenten en horecaondernemers snel kunnen opzoeken welke E-nummers en allergenen in levensmiddelen voorkomen. De website bevat een live zoekfunctie, een ingredientenscanner, een volledig overzicht van 150+ E-nummers, uitleg over de 14 EU-allergenen en een informatiepagina voor de horeca.

Geen buildstap, geen dependencies, geen server vereist — puur HTML, CSS en vanilla JavaScript.

## Live site

[https://allergenenchecker.nl](https://allergenenchecker.nl)

---

## Lokaal draaien

Open `index.html` rechtstreeks in uw browser. Er is geen buildstap of lokale server vereist.

```
Bestand > Openen > index.html
```

Of vanuit de terminal:

```bash
# macOS / Linux
open index.html

# Windows
start index.html
```

---

## Deployen via GitHub Pages

### Stap 1: Maak een GitHub repository aan

1. Ga naar [github.com](https://github.com) en log in op uw account.
2. Klik rechtsboven op het **+**-icoon en kies **New repository**.
3. Geef de repository een naam, bijvoorbeeld `allergenenchecker.nl` of `allergenenchecker`.
4. Stel de zichtbaarheid in op **Public** (verplicht voor gratis GitHub Pages).
5. Laat de optie "Initialize this repository with a README" **uitgevinkt** (u uploadt de bestanden zelf).
6. Klik op **Create repository**.

---

### Stap 2: Upload de bestanden

#### Optie A — Via de GitHub-website (geen terminal nodig)

1. Open de zojuist aangemaakte repository op GitHub.
2. Klik op **Add file** > **Upload files**.
3. Sleep alle bestanden en mappen uit uw projectmap naar het uploadvenster, of gebruik de bestandskiezer.
4. Zorg dat u ook de map `assets/` (met daarin `css/` en `js/`) meeneemt.
5. Voer een korte beschrijving in bij "Commit changes", bijvoorbeeld: `Initial commit: allergenenchecker.nl`.
6. Klik op **Commit changes**.

#### Optie B — Via Git (terminal)

```bash
# Initialiseer git in de projectmap (eenmalig)
git init

# Voeg alle bestanden toe aan de staging area
git add .

# Maak de eerste commit
git commit -m "Initial commit: allergenenchecker.nl"

# Hernoem de standaardbranch naar 'main'
git branch -M main

# Koppel aan uw GitHub-repository (vervang GEBRUIKERSNAAM door uw GitHub-gebruikersnaam)
git remote add origin https://github.com/GEBRUIKERSNAAM/allergenenchecker.nl.git

# Push naar GitHub
git push -u origin main
```

---

### Stap 3: Activeer GitHub Pages

1. Ga naar de **Settings** van uw repository (tandwiel-icoon in de tabbalk bovenaan).
2. Scroll naar beneden in het linkermenu en klik op **Pages**.
3. Onder **Source**: kies **Deploy from a branch**.
4. Selecteer branch **main** en map **/ (root)**.
5. Klik op **Save**.

Na enkele minuten is uw site bereikbaar op:

```
https://GEBRUIKERSNAAM.github.io/allergenenchecker.nl/
```

---

### Stap 4: Custom domein instellen (allergenenchecker.nl)

#### DNS instellen bij uw domeinprovider

Log in bij uw domeinprovider (bijv. TransIP, Antagonist, Versio, GoDaddy) en voeg de volgende **A-records** toe aan uw DNS-zone voor het hoofddomein (`@`):

| Type | Naam | Waarde              |
|------|------|---------------------|
| A    | @    | 185.199.108.153     |
| A    | @    | 185.199.109.153     |
| A    | @    | 185.199.110.153     |
| A    | @    | 185.199.111.153     |

Voor de **www-versie** voegt u een CNAME-record toe:

| Type  | Naam | Waarde                              |
|-------|------|-------------------------------------|
| CNAME | www  | GEBRUIKERSNAAM.github.io            |

Vervang `GEBRUIKERSNAAM` door uw eigen GitHub-gebruikersnaam.

> DNS-wijzigingen kunnen 24–48 uur duren voordat ze wereldwijd zijn doorgevoerd.

#### CNAME-bestand aanmaken in de repository

Maak een bestand genaamd `CNAME` (zonder bestandsextensie) in de **root** van uw repository. Dit bestand moet precies één regel bevatten:

```
allergenenchecker.nl
```

U kunt dit bestand via de GitHub-website aanmaken:

1. Klik in uw repository op **Add file** > **Create new file**.
2. Naam: `CNAME`.
3. Inhoud: `allergenenchecker.nl`.
4. Klik op **Commit new file**.

#### GitHub Pages custom domein instellen

1. Ga naar **Settings** > **Pages** in uw repository.
2. Vul onder **Custom domain** het volgende in: `allergenenchecker.nl`.
3. Klik op **Save**.
4. Vink **Enforce HTTPS** aan zodra de knop beschikbaar is (dit kan een paar minuten tot een dag duren na DNS-propagatie).

Uw site is daarna bereikbaar op `https://allergenenchecker.nl` en wordt automatisch omgeleid naar HTTPS.

---

## Bestandsstructuur

```
allergenenchecker.nl/
├── index.html              # Homepage: zoekfunctie + ingredientenscanner + FAQ
├── e-nummers.html          # Volledig overzicht van E-nummers per categorie
├── allergenen.html         # Uitleg over de 14 EU-allergenen
├── horeca.html             # Informatie voor horecaondernemers (NVWA, HACCP)
├── privacy.html            # Privacybeleid (AVG / Google AdSense-conform)
├── README.md               # Dit bestand
├── CNAME                   # Custom domein voor GitHub Pages
└── assets/
    ├── css/
    │   └── style.css       # Alle stijlen — design tokens, layout, componenten
    └── js/
        ├── database.js     # Data: ENUM_DATABASE (150+ E-nummers), ALLERGEN_INFO, CATEGORIEEN
        └── app.js          # UI-logica: zoeken, scannen, renderen
```

---

## Database uitbreiden

Alle E-nummers staan gedefinieerd in `assets/js/database.js` als het globale object `ENUM_DATABASE`.

Elk E-nummer heeft de volgende structuur:

```js
ENUM_DATABASE["E621"] = {
  naam:      "Mononatriumglutamaat",
  functie:   "Smaakversterker",
  herkomst:  "Synthetisch / Gefermenteerd",
  categorie: "Smaakversterkers",
  aliases:   ["msg", "glutamaat", "natriumglutamaat"],
  allergenen: [],
  // Welke van de 14 EU-allergenen van toepassing zijn, bijv.:
  // allergenen: ["gluten", "soja"],
  info: "Bekendste smaakversterker, veelgebruikt in Aziatische keuken en snacks."
};
```

**Een nieuw E-nummer toevoegen:**

1. Open `assets/js/database.js` in een tekstverwerker.
2. Voeg een nieuwe entry toe binnen het `ENUM_DATABASE`-object, na de laaste bestaande entry en voor de sluitende `};`.
3. Gebruik de bovenstaande structuur en vul alle velden in.
4. Sla het bestand op en open `index.html` in uw browser om te testen of het nieuwe E-nummer vindbaar is.

**Toegestane waarden voor het veld `allergenen`:**

```
gluten, schaal, eieren, vis, pinda, soja, melk, noten,
selderij, mosterd, sesam, sulfiet, lupine, weekdieren
```

---

## Google AdSense toevoegen

Zodra uw AdSense-aanvraag is goedgekeurd, ontvangt u van Google een `<script>`-tag die er ongeveer zo uitziet:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
```

**Plak dit script in de `<head>` van elk HTML-bestand**, direct voor de afsluitende tag `</head>`:

```html
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
       crossorigin="anonymous"></script>

</head>
```

Vervang `ca-pub-XXXXXXXXXX` door uw eigen publisher-ID.

De bestanden waarin u dit script moet toevoegen zijn:

- `index.html`
- `e-nummers.html`
- `allergenen.html`
- `horeca.html`
- `privacy.html`

Individuele advertentieblokken (ad units) plaatst u op de gewenste posities in de `<body>` van elke pagina, conform de instructies in uw AdSense-dashboard.
