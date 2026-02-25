# Accor Executive Lounge Highlighter

A Chrome extension (Manifest V3) that highlights hotels with Executive Lounges on Accor's booking platform with a red border and badge.

## What It Does

When you search for hotels on [all.accor.com/booking](https://all.accor.com/booking/), this extension automatically highlights hotels that have an Executive Lounge with a **red border** around the hotel card and an **"Executive Lounge ✓"** badge in the top-right corner.

## Coverage

~309 hotels across all continents: Asia (203), Middle East (30), North America (21), Oceania (10), Europe (8), South America (5), Africa (4).

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" and select this folder
5. Navigate to any hotel search on `all.accor.com/booking/*`

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Chrome extension manifest (v3) |
| `content.js` | Content script — highlights matching hotel cards |
| `MONTHLY_UPDATE_GUIDE.md` | Operational guide for monthly data updates |
| `data/lounge/` | Monthly snapshots of lounge hotel data (JSON) |

## Documentation

📖 For detailed architecture docs, data flow diagrams, and technical deep-dives, see the **[Wiki](https://github.com/jacobamiller/Accor-Executive-Lounge/wiki)**.

| Wiki Page | What It Covers |
|-----------|---------------|
| [Architecture Overview](https://github.com/jacobamiller/Accor-Executive-Lounge/wiki/Architecture-Overview) | System context, component diagrams, manifest & content script breakdown |
| [Content Script Deep Dive](https://github.com/jacobamiller/Accor-Executive-Lounge/wiki/Content-Script-Deep-Dive) | Function-by-function analysis, performance, error handling |
| [Data Pipeline & Monthly Update Workflow](https://github.com/jacobamiller/Accor-Executive-Lounge/wiki/Data-Pipeline-&-Monthly-Update-Workflow) | Extraction process, data formats, update steps |
| [API Integration & Hotel ID Resolution](https://github.com/jacobamiller/Accor-Executive-Lounge/wiki/API-Integration-&-Hotel-ID-Resolution) | Accor Catalog API, fuzzy matching, known mismatch patterns |

## How It Works

```
User searches hotels on all.accor.com/booking/*
        ↓
Chrome injects content.js at document_idle
        ↓
Script has a Set of ~309 hotel IDs with Executive Lounges
        ↓
Scans all div.result-list-item[data-hotel-id] elements
        ↓
Matching cards get red border + "Executive Lounge ✓" badge
        ↓
MutationObserver watches for dynamically loaded cards
        ↓
URL poller detects SPA route changes → reinitializes
```

## Monthly Updates

Hotel data is updated on the 1st of each month using extraction bookmarklets. See [MONTHLY_UPDATE_GUIDE.md](MONTHLY_UPDATE_GUIDE.md) for the full process.

## License

MIT
