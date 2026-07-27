/* Runs before paint so the theme never flashes. Classic script on purpose:
   a module would be deferred and the flash would come back. */
(function () {
  'use strict';
  var root = document.documentElement;

  var theme = null;
  try { theme = localStorage.getItem('pyg.theme'); } catch (e) { /* private mode */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.dataset.theme = theme;

  var lang = null;
  try {
    var fromUrl = new URLSearchParams(location.search).get('lang');
    lang = fromUrl || localStorage.getItem('pyg.lang');
  } catch (e) { /* ignore */ }
  if (['es', 'it', 'en', 'de'].indexOf(lang) === -1) {
    var nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
    lang = ['es', 'it', 'en', 'de'].indexOf(nav) === -1 ? 'es' : nav;
  }
  root.lang = lang;
})();
