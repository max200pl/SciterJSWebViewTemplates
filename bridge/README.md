# Notification bridge (Sciter ↔ WebView)

Reusable, unit-tested bridge for rendering HTML notifications. **JS-only**: it runs
on the Sciter host (runtime A) and drives the embedded WebView (runtime B). Data
originates in host JS; no C++ changes (the `NotificationSpec` data is plain JSON,
so a future C++ integration plugs into `makeSciterDeps` + `on.onAction` without
touching the contract — see [the contract doc](../../.claude/docs/notification-bridge-contract.md)).

## Modules

| File | Role | Sciter-coupled? | Tested |
| --- | --- | --- | --- |
| `contract.js` | types (JSDoc) + frozen protocol enums | no | `test/contract.test.mjs` |
| `inject.js` | `injectTemplate` — data/i18n/actions → HTML, auto-escaped | no | `test/inject.test.mjs` |
| `render.js` | `renderNotification` — inject → load → wait-ready | no (adapter) | `test/render.test.mjs` |
| `notification.js` | `createNotification` — show/hide lifecycle, actions, i18n, errors | no (adapters) | `test/notification,actions,localization,errors.test.mjs` |
| `sciter-host.js` | `makeSciterDeps` / `showNotification` — the real Sciter adapters | **yes** | `test/sciter-host.test.mjs` (mocked) |
| `template-client.js` | `TEMPLATE_CLIENT` — template-agnostic runtime-B glue (no selectors) | runtime B | `test/template-client.test.mjs` |
| `skeleton-template.js` | `skeletonTemplate` — minimal build base for authors | runtime B | `test/notification-template.test.mjs` |
| `notification-template.js` | worked demo built on the skeleton | runtime B | `test/notification-template.test.mjs` |

## Authoring a template (external service)

Templates and their data arrive from another service; the host binds them with
`injectTemplate(spec)` and the bridge client handles everything at runtime. A template
is **plain author HTML/CSS** plus a tiny, fixed contract — there is **no coupling to a
specific class/markup**:

1. One root element with `data-notify-root` — the window sizes to it (falls back to the
   first child of `<body>` if absent).
2. `<script>{{client}}</script>` once — the host injects [`template-client.js`](./template-client.js)
   (the bridge glue). Authors never write or maintain bridge code.
3. Host-bound text: `{{t.key}}` (localized, from `spec.i18n`) and `{{d.field}}` (raw, from
   `spec.data`). `{{lang}}` for `<html lang>`. All auto-escaped.
4. `data-action="<id>"` (+ optional `data-href="<url>"`) on clickable elements → emits
   `on.onAction({ id, data })`. Any number of distinct ids — all handled uniformly, no
   magic names. An action closes the window only if `spec.actions` marks it `closes: true`.

Start from [`skeleton-template.js`](./skeleton-template.js); [`notification-template.js`](./notification-template.js)
is a worked example. The client reports ready/size (incl. dynamic re-measure via
ResizeObserver)/actions/errors automatically — no `document.querySelector` in author code.

## Loading in Sciter (the bundle)

`index.html` imports `bridge/bundle.js` — a generated, **import-free** concatenation of
the modules above, loaded by absolute path. Sciter can't resolve relative module imports
when the document path contains a space (`web-view-test 2`), so a single leaf file with no
inner imports is the reliable way in. Source stays multi-file (for Node tests);
**rebuild after any change**:

```
node bridge/build-bundle.mjs
```

`test/bundle.test.mjs` fails if `bundle.js` is stale. (Node tests import the individual
modules directly, not the bundle.)

## Public API

```js
import { showNotification } from "./bridge/sciter-host.js";

const handle = showNotification(
  { elemWebView: document.$("webview"), win: Window },
  {
    template,                 // from ./bridge/notification-template.js (or your own token HTML)
    data: { programName: "WinZip", count: 12 },
    i18n: { en: {...}, uk: {...}, ru: {...} },
    lang: "en",
    actions: [{ id: "cta_click" }, { id: "close_webview", closes: true }],
    hideAfterMs: 8000,        // optional auto-hide
    on: {
      onReady: ({ lang, width, height }) => {},
      onAction: ({ id, data }) => {},      // forward to C++ here if needed
      onClose: (reason) => {},             // user | action | auto-hide | host
      onLocalizationChanged: ({ lang }) => {},
      onError: ({ stage, message, cause }) => {},
    },
  },
);

handle.setLang("uk");          // re-render in another language
handle.update({ count: 27 });  // merge data + re-render
handle.setI18n({ en: {...} }); // merge dictionaries + re-render
handle.close();                // close (onClose reason "host")
```

For tests / non-Sciter hosts, call the core directly with your own adapters:
`createNotification({ bridge, windowCtl, scheduler }, spec)` (see `notification.js` typedefs).

## Extending

- **New action**: add a `data-action="my_action"` element to the template and include
  `{ id: "my_action" }` in `spec.actions` (add `closes: true` to auto-close). It arrives
  in `on.onAction`. No controller change needed.
- **New template token**: `{{t.KEY}}` / `{{d.FIELD}}` already cover localized + data values;
  add the key to `i18n` / `data`. New token *kinds* go in `inject.js`.
- **New protocol method/message**: add it to `contract.js` (`TO_HOST` / `TO_TEMPLATE`),
  wire a `bridge.on(...)` in `notification.js`, and emit it from the template.

## Tests

`npm test` (from `Templates/`) — Node's built-in runner, zero dependencies. Manual QA:
[../../.claude/docs/notification-qa-checklist.md](../../.claude/docs/notification-qa-checklist.md).
