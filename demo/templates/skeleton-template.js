// Minimal notification template — the starting point a template author (in the
// external service) copies and builds inside. Maximally simple, minimal coupling.
//
// The whole bridge contract for a template is just:
//   1. `{{styles}}` in <head> (host injects the required base CSS — the window sizes
//      to content automatically; NO wrapper element needed);
//   2. `{{client}}` once before </body> (host injects the bridge glue);
//   3. host-bound text via {{t.key}} (localized) / {{d.field}} (raw data); {{lang}} on <html>;
//   4. `data-action="<id>"` (+ optional `data-href`) on clickable elements.
//
// Write your content straight into <body>. (Advanced: add `data-notify-root` to an
// element to size the window to it instead of the whole body.) Template + data arrive
// from the external service and the host injects them (see inject.mjs / README).

export const skeletonTemplate = `
<html lang="{{lang}}">
  <head>
    <meta charset="utf-8" />
    {{styles}}
    <!-- add your own content styles here -->
  </head>
  <body>
    <!-- Build the notification here. Examples:
         <h3>{{t.title}}</h3>
         <p>{{t.subtitle}}</p>
         <b>{{d.count}}</b>
         <button data-action="cta_click">{{t.cta}}</button>
         <button data-action="close_webview">{{t.close}}</button> -->

    <!-- Bridge client (host-injected; do not edit). -->
    <script>{{client}}</script>
  </body>
</html>
`;
