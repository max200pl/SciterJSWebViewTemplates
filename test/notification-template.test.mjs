// Tests for the demo + skeleton templates (Step 4, revised). Templates carry NO
// inline bridge glue — they pull it in via the {{client}} token and only opt into
// the data-* conventions. injectTemplate binds the external template + data.
//
// Run: npm test   (from Templates/)

import { test } from "node:test";
import assert from "node:assert/strict";

import { notificationTemplate } from "../bridge/notification-template.js";
import { skeletonTemplate } from "../bridge/skeleton-template.js";
import { injectTemplate } from "../bridge/inject.js";

const SPEC = {
  template: notificationTemplate,
  data: { programName: "WinZip", count: 12 },
  i18n: {
    en: {
      title: "Removed: {programName}",
      subtitle: "Leftover files: {count}",
      counter: "Live counter",
      cta: "CTA",
      close: "Close",
    },
  },
  lang: "en",
};

test("demo template is markup-only: no inline glue, no hardcoded selector", () => {
  // the bridge code is NOT in the source template — it arrives via {{client}}
  assert.ok(notificationTemplate.includes("{{client}}"), "pulls the client via token");
  assert.ok(!notificationTemplate.includes("querySelector('.card')"), "no inline .card glue");
  assert.ok(!notificationTemplate.includes("window.jsBridgeCall"), "no inline bridge calls");
  assert.ok(notificationTemplate.includes("data-notify-root"), "marks a sizing root");
  assert.ok(notificationTemplate.includes('data-action="cta_click"'), "actions via data-action");
});

test("demo template injects to clean HTML with client + bound data", () => {
  const html = injectTemplate(SPEC);
  assert.ok(!/\{\{|\}\}/.test(html), "no leftover tokens");
  assert.ok(html.includes("Removed: WinZip"), "title bound");
  assert.ok(html.includes("Leftover files: 12"), "subtitle bound");
  assert.ok(html.includes('lang="en"'), "lang applied");
  // {{client}} resolved -> the agnostic glue is now present
  assert.ok(html.includes("template:onReady") && html.includes("[data-notify-root]"), "client injected");
});

test("skeleton is the minimal build base: root + client + token placeholders", () => {
  assert.ok(skeletonTemplate.includes("data-notify-root"), "has sizing root");
  assert.ok(skeletonTemplate.includes("{{client}}"), "pulls the client");
  assert.ok(skeletonTemplate.includes("{{lang}}"), "lang token");
  const html = injectTemplate({ template: skeletonTemplate, lang: "en" });
  assert.ok(!/\{\{|\}\}/.test(html), "injects clean with just lang+client");
  assert.ok(html.includes("template:onAction"), "client present after injection");
});

test("neither template embeds an i18n dictionary (data arrives from the host)", () => {
  for (const t of [notificationTemplate, skeletonTemplate]) {
    assert.ok(!t.includes("mergeI18n"), "no runtime i18n");
    assert.ok(!t.includes("Програму видалено"), "no embedded dictionary");
  }
});
