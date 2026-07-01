(function () {
  var SLEUTEL = 'ac_cookie_consent';
  // Vervang door uw echte AdSense publisher-ID zodra goedgekeurd
  var ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';

  function laadAdSense() {
    if (document.querySelector('script[data-adsense]')) return;
    var s = document.createElement('script');
    s.setAttribute('data-adsense', '1');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function verbergBanner() {
    var el = document.getElementById('cookie-banner');
    if (el) {
      el.classList.add('cookie-banner--verbergen');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
    }
  }

  function slaOp(keuze) {
    localStorage.setItem(SLEUTEL, keuze);
    verbergBanner();
    if (keuze === 'ja') laadAdSense();
  }

  function toonBanner() {
    var privacyPad = document.querySelector('link[rel="canonical"]');
    var privacyUrl = '/privacy.html';
    if (privacyPad) {
      var base = privacyPad.href.replace(/[^/]+$/, '');
      privacyUrl = base + 'privacy.html';
    }

    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookievoorkeur');
    banner.innerHTML =
      '<div class="cookie-tekst">' +
        '<strong>Cookies &amp; privacy</strong>' +
        '<p>Wij en onze advertentiepartner Google AdSense gebruiken cookies voor gepersonaliseerde advertenties. Lees onze <a href="' + privacyUrl + '">privacyverklaring</a>.</p>' +
      '</div>' +
      '<div class="cookie-knoppen">' +
        '<button id="cookie-weiger"   class="btn btn-outline" type="button">Weigeren</button>' +
        '<button id="cookie-accepteer" class="btn btn-groen"   type="button">Accepteren</button>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('cookie-accepteer').addEventListener('click', function () { slaOp('ja'); });
    document.getElementById('cookie-weiger').addEventListener('click',    function () { slaOp('nee'); });
  }

  var opgeslagen = localStorage.getItem(SLEUTEL);
  if (!opgeslagen) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', toonBanner);
    } else {
      toonBanner();
    }
  } else if (opgeslagen === 'ja') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', laadAdSense);
    } else {
      laadAdSense();
    }
  }
})();
