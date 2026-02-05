# Project Context: Sciter ↔ WebView HTML Template Bridge (Minimal Prod Baseline)

## Goal

We have a Sciter app that hosts a single Sciter HTML page. This page embeds a `<webview>` element using `behavior: webview library(sciter-webview)` and loads a UI template into WebView via `webview.loadHtml(templateHtml)` (templateHtml is a string export from `Templates.js`).

We already have a working prototype. Now we want a clean, minimal, production-oriented baseline that preserves:

- a stable JS bridge between Sciter and WebView template
- init/update messages (payload + i18n + language)
- “template ready” handshake (template → Sciter)
- “size report” (template → Sciter) to move/resize Sciter window to the bottom-right

We want the simplest possible code while keeping the architecture clear and extensible.

## Architecture Overview

**Host (Sciter HTML) responsibilities**

- Initialize WebView element
- Load template HTML string into WebView (`loadHtml(templateHtml)`)
- Provide JS bridge entrypoint for template → host calls:
  - `elemWebView.jsBridgeCall = (params) => { ... }`
- Provide helper to send messages host → template:
  - `elemWebView.webview.evaluateJavaScript("window.__fromSciter(...)")`
- Handle template events:
  - `template:onReady` (template handshake)
  - `template:onSize` (template reports `.card` width/height)
  - `template:onAction` (CTA / close / other actions)
- On `template:onSize`: compute workarea, clamp, `Window.this.move(x,y,w,h)` and show window.
- Optional debug UI buttons may exist for development but should be removable for prod baseline.

**Template (WebView HTML string) responsibilities**

- Render UI from single `state` object:
  - `state.lang`
  - `state.payload`
  - `state.i18n`
- Provide `window.__fromSciter(msg)` entrypoint for host → template messages:
  - `init` (lang + i18n + payload)
  - `setLang`
  - `setI18n`
  - `update` (payload patch)
- Provide `window.jsBridgeCall(method, payload)` usage to call host
  - on load: `template:onReady`
  - after render/layout changes: `template:onSize` with measured card size
  - on button actions: `template:onAction`

## Message Protocol (Contract)

### Template → Host (via jsBridgeCall)

- method: `template:onReady`
  payload: `{ lang, ts }`
  host response: `{ ok: true }`

- method: `template:onSize`
  payload: `{ width, height }` measured from `.card` element
  host response: `{ ok: true }`
  host action: move/resize window bottom-right in workarea; clamp to screen

- method: `template:onAction`
  payload examples:
  - `{ action: "close_webview" }`
  - `{ action: "cta_click", ... }`
  host response: `{ ok: true }`
  host may call `Window.this.close()` on close action.

### Host → Template (via evaluateJavaScript calling window.__fromSciter)

Message object shapes:

- `{ type: "init", lang, i18n, payload }`
- `{ type: "setLang", lang }`
- `{ type: "setI18n", i18n }` (partial i18n dictionary merge)
- `{ type: "update", payload }` (partial payload merge)

## Production Baseline Requirements

- Keep bridge stable and explicit (no hidden globals besides `window.__fromSciter`).
- Always validate inputs defensively (payload types, missing keys).
- Ensure size reporting is debounced (avoid resize spam).
- Avoid changing DOM size due to logs; logs should not affect `.card` dimensions.
- Make it easy to remove dev-only controls (panel buttons, debug logs).
- Keep files small and readable.

## File Layout (Expected)

- `index.htm` (Sciter host HTML)
- `Templates.js` (exports `templateHtml` string)
- Optionally: `bridge.js` / `protocol.js` only if it reduces complexity (avoid over-engineering)

## Non-Goals

- No external frameworks
- No complex state management
- No network calls
- No styling refactors beyond what's needed for stability

## Acceptance Criteria

- WebView loads template from string without external files.
- Template triggers `template:onReady`, host responds ok, host sends `init`.
- Template renders using provided i18n/payload, supports language switching.
- Template reports `.card` size; host positions window bottom-right and clamps.
- Close action closes Sciter window.
- Minimal code: remove optional demo controls without breaking bridge.

## Notes about current prototype

We currently use:

- Host helper: sendToTemplate(msg) uses evaluateJavaScript("window.__fromSciter(...)")
- Template has state, mergeI18n(), render(), debounced measure, safeCall() for jsBridgeCall.
Preserve this behavior while simplifying the code where possible.

---

# Notification Templates Implementation Guide

## Overview

This project contains standalone HTML notification templates designed for SciterJS WebView. Each template is a self-contained HTML file with inline CSS and JavaScript, following a consistent bridge pattern for communication with the Sciter host.

## Design Implementation Process

### 1. Figma Integration (MCP)

Templates are created from Figma designs using the Figma Desktop MCP (Model Context Protocol) server:

**Available Tools:**
- `get_design_context` - Returns React+Tailwind code with exact measurements
- `get_screenshot` - Returns PNG screenshot for visual reference
- Asset URLs served on `http://localhost:3845/assets/`

**What We Get from Figma:**
```javascript
// Exact measurements from Tailwind classes
- Container: w-[470px], border-2, border-[rgba(0,0,0,0.58)]
- Header: h-[52px], p-[15px], gap-[17px]
- Text: text-[18px], leading-[20px], text-[#7fc023]
- Icons: w-[39.337px], h-[40px]
```

**Limitations:**
- Cannot download SVG content from localhost URLs directly
- Must convert React+Tailwind to plain HTML/CSS
- Need to create inline SVG from visual reference or provided code

### 2. Auto Layout Advantage

✅ **When Figma design uses Auto Layout:**
- Clean flexbox/gap structure
- Exact padding/margins
- Consistent spacing values
- Better pixel-perfect accuracy

### 3. Template Structure

Each notification template follows this pattern:

```html
<html>
  <head>
    <style>
      /* Reset */
      * { box-sizing: border-box; }

      /* Container with exact Figma dimensions */
      .dialog {
        width: 470px;
        border: 2px solid rgba(0,0,0,0.58);
        /* ... */
      }

      /* Use Flexbox matching Auto Layout */
      .content {
        display: flex;
        flex-direction: column;
        gap: 17px; /* Exact from Figma */
        padding: 20px 0;
      }
    </style>
  </head>
  <body>
    <!-- Inline SVG for all graphics -->
    <div class="dialog">
      <!-- Content -->
    </div>

    <script>
      // Bridge communication
      async function safeCall(method, payload) { /* ... */ }

      // Initialize
      window.addEventListener('load', () => {
        safeCall('template:onReady', { type: 'template_name' });
        // Report size
        safeCall('template:onSize', { width, height });
      });

      // Event handlers
    </script>
  </body>
</html>
```

## SVG Handling

### Option 1: Inline SVG (Recommended)

**Advantages:**
- ✅ Self-contained, no external dependencies
- ✅ Works everywhere immediately
- ✅ Can be styled with CSS
- ✅ No network requests

**Create from:**
- Visual reference (screenshot)
- Exported SVG code from Figma (Copy as SVG)
- User-provided SVG code

**Example:**
```html
<div class="logo">
  <svg viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="19" fill="#7fc023"/>
    <path d="M12 20L17.5 25.5L28 13" stroke="white" stroke-width="3"/>
  </svg>
</div>
```

### Option 2: Localhost URLs

**Advantages:**
- Exact graphics from Figma

**Disadvantages:**
- ❌ Only works when Figma MCP server is running
- ❌ Not portable

**Usage:**
```html
<img src="http://localhost:3845/assets/abc123.svg" alt="Logo">
```

## Pixel-Perfect Guidelines

### Exact Measurements from Figma

```css
/* Container */
width: 470px;
border: 2px solid rgba(0,0,0,0.58);

/* Header */
height: 52px;
padding: 15px;

/* Logo positioning */
width: 39.337px;
margin-left: 49.34px;

/* Typography */
font-size: 14px;
line-height: 20px;
color: #7fc023;
font-weight: 700;

/* Spacing */
gap: 17px;
padding: 20px 0;
```

### Color Values

Extract exact colors from Figma:
- `rgba(0,0,0,0.58)` - borders
- `#7fc023` - brand green
- `#ce0707` - error red
- `rgba(0,0,0,0.5)` - text gray

### Font Settings

```css
font-family: 'Segoe UI', 'Roboto', system-ui, sans-serif;
font-weight: 400 | 500 | 600 | 700;
font-size: 14px | 16px | 18px | 22px;
line-height: normal | 20px | 24px;
font-variation-settings: 'wdth' 100; /* Variable fonts */
```

## Template Examples

### Created Templates

1. **index.html** - Original demo with i18n
2. **index2.html** - PC Cleaner System Monitor notification
3. **index3.html** - Chat Now dialog (inline SVG)
4. **index4.html** - Subscription expired with illustration
5. **index5.html** - Subscription dialog (pixel-perfect auto layout)
6. **index6.html** - Bug Report form (with user SVG)

### Common Patterns

**Dialog Structure:**
```
┌─────────────────────────────┐
│ Header (logo + close)       │ 52px
├─────────────────────────────┤
│ Content (flex column)       │
│  - Icon/Image               │ gap: 17px
│  - Title                    │
│  - Description              │
│  - Input/Button             │
├─────────────────────────────┤
│ Footer (checkbox/links)     │ 15px padding
└─────────────────────────────┘
```

**Action Types:**
- `close_webview` - Close dialog
- `cta_click` - Primary action
- `remind_later` - Defer action
- `renew_now` - Subscription renewal
- `send_report` - Submit form

## Best Practices

### CSS

1. **Use exact values from Figma:**
   ```css
   width: 470px;        /* NOT: 500px or ~470px */
   padding: 15px;       /* NOT: 1rem */
   gap: 17px;           /* NOT: 20px */
   ```

2. **Flexbox over absolute positioning:**
   ```css
   /* ✅ Good */
   display: flex;
   gap: 17px;

   /* ❌ Avoid */
   position: absolute;
   top: 123px;
   ```

3. **Border-box for consistency:**
   ```css
   * { box-sizing: border-box; }
   ```

### JavaScript Bridge

1. **Always report size:**
   ```javascript
   const width = dialog.offsetWidth;
   const height = dialog.offsetHeight;
   safeCall('template:onSize', { width, height });
   ```

2. **Include template type:**
   ```javascript
   safeCall('template:onReady', {
     type: 'subscription',
     ts: Date.now()
   });
   ```

3. **Send relevant data:**
   ```javascript
   safeCall('template:onAction', {
     action: 'send_report',
     description: textareaValue,
     email: emailValue,
     doNotShowAgain: checkboxChecked
   });
   ```

### SVG

1. **Keep viewBox for scaling:**
   ```html
   <svg viewBox="0 0 24 24" width="24" height="24">
   ```

2. **Use currentColor for theming:**
   ```html
   <path stroke="currentColor" />
   ```

3. **Optimize paths (but keep readable):**
   ```html
   <!-- Simple shapes preferred -->
   <circle cx="20" cy="20" r="19" fill="#7fc023"/>
   ```

## Common Issues & Solutions

### Issue: Dialog size incorrect

**Solution:** Wait for DOM render before measuring
```javascript
setTimeout(() => {
  const width = dialog.offsetWidth;
  safeCall('template:onSize', { width, height });
}, 100);
```

### Issue: Fonts not matching Figma

**Solution:** Check font-weight and line-height
```css
font-family: 'Segoe UI', sans-serif;
font-weight: 600;  /* NOT: bold */
line-height: 24px; /* NOT: normal */
```

### Issue: Colors look different

**Solution:** Use exact rgba/hex values
```css
/* ✅ From Figma */
color: rgba(0, 0, 0, 0.5);

/* ❌ Approximation */
color: #808080;
```

## Future Templates Checklist

- [ ] Get Figma design (with auto layout)
- [ ] Extract exact measurements
- [ ] Get/create inline SVG for icons
- [ ] Use exact colors (rgba/hex)
- [ ] Match font weights/sizes
- [ ] Test size reporting
- [ ] Verify bridge communication
- [ ] Check all interactive elements
- [ ] Ensure accessibility (aria-label)
- [ ] Test without Figma server running
