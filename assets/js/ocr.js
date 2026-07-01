(function () {
  var TESSERACT_CDN = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js';

  function laadTesseract(cb) {
    if (window.Tesseract) { cb(null); return; }
    var s = document.createElement('script');
    s.src = TESSERACT_CDN;
    s.onload  = function () { cb(null); };
    s.onerror = function () { cb(new Error('laden mislukt')); };
    document.head.appendChild(s);
  }

  function setStatus(el, cls, tekst) {
    el.hidden = false;
    el.className = 'ocr-status ' + cls;
    el.textContent = tekst;
  }

  function verwerkAfbeelding(bestand) {
    var statusEl = document.getElementById('ocr-status');
    var prevEl   = document.getElementById('ocr-preview');
    var textarea = document.getElementById('scan-input');
    var knop     = document.getElementById('ocr-knop');

    // Toon miniatuur
    var reader = new FileReader();
    reader.onload = function (e) {
      prevEl.hidden = false;
      prevEl.innerHTML = '<img src="' + e.target.result + '" alt="Geüploade foto ingrediëntenlijst" class="ocr-preview-img">';
    };
    reader.readAsDataURL(bestand);

    setStatus(statusEl, 'ocr-status--bezig', 'OCR laden…');
    knop.disabled = true;

    laadTesseract(function (err) {
      if (err) {
        setStatus(statusEl, 'ocr-status--fout', 'Kon OCR niet laden. Controleer uw internetverbinding.');
        knop.disabled = false;
        return;
      }

      Tesseract.recognize(bestand, 'nld+eng', {
        logger: function (m) {
          if (m.status === 'recognizing text') {
            setStatus(statusEl, 'ocr-status--bezig', 'Tekst lezen… ' + Math.round(m.progress * 100) + '%');
          } else if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
            setStatus(statusEl, 'ocr-status--bezig', 'OCR initialiseren…');
          } else if (m.status === 'loading language traineddata' || m.status === 'initializing api') {
            setStatus(statusEl, 'ocr-status--bezig', 'Taalmodel laden…');
          }
        }
      }).then(function (resultaat) {
        knop.disabled = false;
        var tekst = resultaat.data.text.trim();
        if (tekst) {
          textarea.value = tekst;
          setStatus(statusEl, 'ocr-status--ok', '✓ Tekst gelezen! Controleer de tekst en klik op „Scan ingrediënten“.');
          textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          setStatus(statusEl, 'ocr-status--fout', 'Geen tekst gevonden. Probeer een scherpere of beter belichte foto.');
        }
      }).catch(function () {
        knop.disabled = false;
        setStatus(statusEl, 'ocr-status--fout', 'Er is een fout opgetreden bij het lezen. Probeer het opnieuw.');
      });
    });
  }

  function init() {
    var knop  = document.getElementById('ocr-knop');
    var invoer = document.getElementById('ocr-foto');
    if (!knop || !invoer) return;

    knop.addEventListener('click', function () { invoer.click(); });

    invoer.addEventListener('change', function () {
      var bestand = invoer.files[0];
      if (bestand) verwerkAfbeelding(bestand);
      invoer.value = ''; // zodat hetzelfde bestand opnieuw gekozen kan worden
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
