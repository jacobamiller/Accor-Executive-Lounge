# Accor Executive Lounge Highlighter — Wiki

A Chrome extension (Manifest V3) that enhances the Accor hotel booking website with Executive Lounge highlighting, breakfast badges, tax-inclusive pricing, loyalty tier detection, and a comprehensive rate comparison panel.

## Wiki Pages

| Page | Description |
|------|-------------|
| **[Architecture Overview](Architecture-Overview)** | System context diagram, two-script architecture, manifest configuration, inter-script communication, feature map, initialization flow |
| **[Content Script Deep Dive](Content-Script-Deep-Dive)** | Function-by-function analysis of content.js — card highlighting, price parsing, rate panels, upgrade eligibility, MutationObserver, SPA routing |
| **[Page Bridge Deep Dive](Page-Bridge-Deep-Dive)** | MAIN world bridge — loyalty tier detection across 6 sources, Apollo cache extraction, Vue/Nuxt introspection, retry logic, diagnostics |
| **[Data Pipeline & Monthly Update Workflow](Data-Pipeline-&-Monthly-Update-Workflow)** | Monthly extraction process, bookmarklet architecture, API key capture, data file formats, name matching algorithm |
| **[API Integration & Hotel ID Resolution](API-Integration-&-Hotel-ID-Resolution)** | Accor Catalog API reference, hotel ID resolution pipeline, normalization, known mismatch patterns, Apollo cache structure |

## Quick Reference

```
Extension v2.3 | Manifest V3 | Zero build tools
309 lounge hotels | 3,759 breakfast hotels | 6 loyalty tiers
2 scripts | 4 custom events | 1 MutationObserver
```

### Key Files

| File | Lines | World | Role |
|------|-------|-------|------|
| `manifest.json` | 23 | — | Extension configuration |
| `content.js` | 2,315 | ISOLATED | All DOM manipulation and UI |
| `page-bridge.js` | 571 | MAIN | Vue/Apollo/Nuxt data access |

### Features at a Glance

| Feature | Search Page | Detail Page |
|---------|:-----------:|:-----------:|
| Executive Lounge badge | Red border + badge | Header badge |
| Free Breakfast badge | Green badge | Header badge |
| Tax-inclusive prices | Per-card totals | Per-room totals |
| Lounge Only filter | Toggle button | — |
| Show All Rates | — | Rate grid panel |
| Loyalty tier badge | In toggle bar | In header badges |
| Benefits box | General tier info | Hotel-specific |
| Upgrade eligibility | — | Purple indicators |
