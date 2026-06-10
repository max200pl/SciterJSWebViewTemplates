// Sciter host adapters — Step 9 (integration glue).
//
// The ONLY Sciter/C++-coupled module (this is the C++ boundary): it builds the
// three adapters the lifecycle controller (core/notification.js) needs out of a
// real `<webview>` element and the Sciter `Window` global. Everything in core/ is
// runtime-agnostic.
//
// The B->A wiring matters: Sciter's shim packs all jsBridgeCall arguments into a
// single array, so the host handler receives ONE array param where
// params[0]=method and params[1]=payload (see ../../../.claude/docs/jsbridge.md §5).
// makeSciterDeps installs that handler and fans methods out to registered
// listeners — and because it is plain adapter construction, it is unit-testable
// in Node with mock objects (see test/sciter-host.test.mjs).

import { createNotification } from "../core/notification.mjs";

/**
 * Build {bridge, windowCtl, scheduler} for a Sciter host page.
 * @param {*} elemWebView - the `<webview>` element (has `.webview.loadHtml`, assignable `.jsBridgeCall`)
 * @param {*} win - the Sciter `Window` global (has `.this.move/close`, `.this.screenBox`, `.WINDOW_SHOWN`)
 * @returns {{bridge: object, windowCtl: object, scheduler: object}}
 */
export function makeSciterDeps(elemWebView, win) {
  const handlers = new Map();

  // B -> A: single array arg, params[0]=method, params[1]=payload.
  elemWebView.jsBridgeCall = (params) => {
    const method = params && params[0];
    const payload = params && params[1];
    for (const cb of handlers.get(method) || []) {
      try {
        cb(payload);
      } catch (_e) {
        /* a listener must not break the synchronous bridge return */
      }
    }
    return JSON.stringify({ ok: true });
  };

  const bridge = {
    on(method, cb) {
      const list = handlers.get(method) || [];
      list.push(cb);
      handlers.set(method, list);
      return () => handlers.set(method, (handlers.get(method) || []).filter((h) => h !== cb));
    },
    loadHtml(html) {
      elemWebView.webview.loadHtml(html);
    },
  };

  const windowCtl = {
    show() {
      win.this.state = win.WINDOW_SHOWN;
    },
    close() {
      win.this.close();
    },
    move(x, y, w, h) {
      win.this.move(x, y, w, h);
    },
    workarea() {
      const d = win.this.screenBox("workarea", "dimension", true);
      return [d[0], d[1]];
    },
  };

  const scheduler = {
    setTimer(fn, ms) {
      return setTimeout(fn, ms);
    },
    clearTimer(id) {
      clearTimeout(id);
    },
  };

  return { bridge, windowCtl, scheduler };
}

/**
 * Convenience entry for a Sciter host page: wire adapters and show a notification.
 * @param {{elemWebView:*, win:*}} env
 * @param {import("./contract.mjs").NotificationSpec} spec
 * @returns {import("./contract.mjs").NotificationHandle}
 */
export function showNotification(env, spec) {
  return createNotification(makeSciterDeps(env.elemWebView, env.win), spec);
}
