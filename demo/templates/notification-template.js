// Demo notification template — a worked example built on the skeleton contract
// (see skeleton-template.js). Shows the minimal coupling in practice:
//   - one `data-notify-root` element (window sizes to it),
//   - host-bound text via {{t.*}} / {{d.*}},
//   - `data-action` on buttons,
//   - the bridge glue injected once via {{client}} (NO hardcoded selectors here).
//
// Tokens consumed by injectTemplate: {{lang}} {{t.title}} {{t.subtitle}} {{t.counter}}
// {{t.cta}} {{t.close}} {{d.count}} {{client}}.

export const notificationTemplate = `
<html lang="{{lang}}">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { font-family: system-ui; background: transparent; color: black; margin: 0; padding: 0; overflow: hidden; }
      [data-notify-root] { display: inline-block; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; width: 450px; background: white; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; }
      .row { display: flex; gap: 10px; flex-wrap: wrap; }
      button { padding: 10px 12px; border-radius: 10px; cursor: pointer; }
      .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: #efefef; font-size: 12px; }
      .dot { width: 10px; height: 10px; border-radius: 999px; background: #10b04a; }
      .title { margin: 0; color: black; }
      .subtitle { margin: 0; font-size: 14px; color: #333; }
    </style>
  </head>
  <body>
    <div data-notify-root>
      <div class="card">
        <h3 class="title">{{t.title}}</h3>
        <div class="badge"><span class="dot"></span><span>{{t.counter}}</span> <b>{{d.count}}</b></div>
        <p class="subtitle">{{t.subtitle}}</p>
        <div class="row">
          <button data-action="cta_click">{{t.cta}}</button>
          <button data-action="close_webview">{{t.close}}</button>
        </div>
      </div>
    </div>

    <script>{{client}}</script>
  </body>
</html>
`;
