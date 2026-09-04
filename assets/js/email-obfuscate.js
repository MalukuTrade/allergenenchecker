// Stelt e-mailadressen in de browser samen i.p.v. ze als platte tekst
// in de HTML-bron te zetten, om scraping-bots te ontmoedigen.
(function () {
  var USER = 'aW5mbw==';
  var DOMAIN = 'YWxsZXJnZW5lbmNoZWNrZXIubmw=';

  function email() {
    return atob(USER) + '@' + atob(DOMAIN);
  }

  function init() {
    document.querySelectorAll('a[data-email-link]').forEach(function (link) {
      var addr = email();
      var subject = link.getAttribute('data-subject');
      link.setAttribute('href', 'mailto:' + addr + (subject ? '?subject=' + subject : ''));
      if (link.hasAttribute('data-email-text')) {
        link.textContent = addr;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
