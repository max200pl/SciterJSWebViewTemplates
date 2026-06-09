// Minimal notification template — the starting point a template author (in the
// external service) copies and builds inside. Maximally simple, minimal coupling.
//
// The whole bridge contract for a template is just:
//   1. one root element with `data-notify-root` (the window sizes to it);
//   2. `{{client}}` once inside a <script> (the host injects the bridge glue);
//   3. host-bound text via {{t.key}} (localized) or {{d.field}} (raw data);
//   4. `data-action="<id>"` (+ optional `data-href`) on clickable elements.
//
// Everything else is the author's own HTML/CSS. The template + its data arrive
// from the external service and the host injects them (see inject.js / README).

export const skeletonTemplate = `
<html lang="{{lang}}">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
      [data-notify-root] { display: inline-block; } /* size the window to content */
    </style>
  </head>
  <body>
    <div data-notify-root>
      <!-- Build the notification here. Examples:
           <h3>{{t.title}}</h3>
           <p>{{t.subtitle}}</p>
           <b>{{d.count}}</b>
           <button data-action="cta_click">{{t.cta}}</button>
           <button data-action="close_webview">{{t.close}}</button> -->
    </div>

    <!-- Bridge client (host-injected; do not edit). -->
    <script>{{client}}</script>
  </body>
</html>
`;
