// Bridge client (runtime B) — the template-agnostic glue that talks to the host.
//
// This is the ONLY bridge code that goes inside a notification template. It is
// pure, token-free JS (no {{...}}), so a template author can either paste it into
// a <script>, or let the host inject it via the {{client}} token (see inject.js).
//
// It makes NO assumption about the template's markup — there is no `.card` or any
// other hardcoded selector. The only conventions a template opts into:
//   - (optional) put `data-notify-root` on the element whose size the window
//     should match. If absent, the first child of <body> is measured (then <body>).
//   - put `data-action="<id>"` (and optional `data-href="<url>"`) on clickable
//     elements; clicking emits template:onAction { action, href? }.
//
// Everything else (ready handshake, size reporting incl. dynamic re-measure via
// ResizeObserver, error reporting) is automatic.

export const TEMPLATE_CLIENT = `
(function () {
  function root() {
    return document.querySelector('[data-notify-root]') || document.body.firstElementChild || document.body;
  }
  function call(method, payload) {
    try { if (window.jsBridgeCall) return window.jsBridgeCall(method, payload); } catch (e) {}
  }
  var lastW = -1, lastH = -1;
  function reportSize() {
    var el = root();
    if (!el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    var w = Math.ceil(r.width), h = Math.ceil(r.height);
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    call('template:onSize', { width: w, height: h });
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) return;
    var payload = { action: el.getAttribute('data-action') };
    var href = el.getAttribute('data-href');
    if (href) payload.href = href;
    call('template:onAction', payload);
  });
  window.addEventListener('load', function () {
    try {
      call('template:onReady', { lang: (document.documentElement && document.documentElement.lang) || 'en' });
      reportSize();
      window.addEventListener('resize', reportSize);
      if (window.ResizeObserver) {
        try { new ResizeObserver(reportSize).observe(root()); } catch (e) {}
      }
    } catch (e) {
      call('template:onError', { stage: 'render', message: String((e && e.message) || e) });
    }
  });
})();
`;
