# Monthly Executive Lounge Update Guide

## Overview

This guide documents how to update the Accor Executive Lounge hotel list on the 1st of each month. The goal is to track which hotels have been added or removed from Accor's official lounge list.

## Source

- **URL:** https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml
- **Tab:** "HOTELS WITH A LOUNGE" (first tab on the page)

## How the Accor Page Works

The page loads **all hotels globally in a single HTML page**. The three dropdown menus (Region > Country > City) only filter visibility — no additional data is fetched. This means a single JavaScript extraction can capture every hotel at once.

Each hotel row uses a CSS class matching its city slug (e.g., `bangkok`, `ho-chi-minh-city`). The city `<select>` has `data-country` attributes, and the country `<select>` has `data-continent` attributes, forming a full hierarchy.

## Monthly Update Process

### Step 1: Navigate to the Accor Page

Open https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml

### Step 2: Extract Hotel Data

Open your browser console (F12 > Console) and paste this script:

```js
(() => {
  const citySelect = document.getElementById('selectCity');
  const countrySelect = document.getElementById('selectCountry');
  const cityToCountry = {};
  const countryToContinent = {};
  Array.from(citySelect.options).forEach(o =>
    cityToCountry[o.value] = o.getAttribute('data-country')
  );
  Array.from(countrySelect.options).forEach(o =>
    countryToContinent[o.value] = o.getAttribute('data-continent')
  );

  const rows = document.querySelectorAll('.js-table-1-tbody tr');
  const hotels = [];
  rows.forEach(row => {
    const city = row.className.trim().split(' ')[0];
    const cols = row.querySelectorAll('td');
    if (cols.length >= 2) {
      const country = cityToCountry[city] || 'unknown';
      const continent = countryToContinent[country] || 'unknown';
      if (continent === 'asia') {
        hotels.push([country, city, cols[0].textContent.trim()]);
      }
    }
  });
  hotels.sort((a, b) =>
    a[0].localeCompare(b[0]) ||
    a[1].localeCompare(b[1]) ||
    a[2].localeCompare(b[2])
  );

  const json = JSON.stringify({
    metadata: {
      extracted: new Date().toISOString().slice(0, 10),
      source: location.href,
      region: "asia",
      total: hotels.length,
      format: "[country, city, hotel_name]"
    },
    hotels: hotels
  }, null, 2);

  const ta = document.createElement('textarea');
  ta.value = json;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  console.log('Copied ' + hotels.length + ' Asia hotels to clipboard');
  console.log('Save as: data/YYYY-MM.json');
})();
```

### Step 3: Save the New Data File

1. Create a new file in this repo: `data/YYYY-MM.json` (e.g., `data/2026-03.json`)
2. Paste the clipboard contents
3. Commit with message: `Add [Month] [Year] Asia executive lounge data ([N] hotels)`

### Step 4: Compare with Previous Month

Use Claude with this prompt:

---

I need to compare this month's Accor Executive Lounge hotel list against last month's.

**Previous month:** [paste or link to last month's data/YYYY-MM.json]

**This month:** [paste or link to this month's data/YYYY-MM.json]

Please show me:
1. Hotels ADDED this month (new entries)
2. Hotels REMOVED this month (missing entries)
3. Total count comparison (last month vs this month)
4. Summary of changes by country

---

### Step 5: Update the Chrome Extension (if needed)

If any Vietnam hotels were added or removed, update the `EXECUTIVE_LOUNGE_HOTEL_IDS` Set in `content.js`. Note: the Accor lounge page does not include hotel IDs — you will need to find the `data-hotel-id` from the Accor booking/search results page for any new Vietnam hotels.

## Data Format

Each data/YYYY-MM.json file uses this structure:

```json
{
  "metadata": {
    "extracted": "2026-02-22",
    "source": "https://all.accor.com/...",
    "region": "asia",
    "total": 203,
    "format": "[country, city, hotel_name]"
  },
  "hotels": [
    ["country-slug", "city-slug", "Hotel Display Name"]
  ]
}
```

## File Structure

```
Accor-Executive-Lounge/
  content.js                  # Chrome extension (Vietnam hotels)
  manifest.json               # Extension manifest
  MONTHLY_UPDATE_GUIDE.md     # This guide
  data/
    2026-02.json              # February 2026 baseline
    2026-03.json              # March 2026 (next)
```

## Limitations and Notes

- **Asia only:** This process currently tracks only the Asia region (continent === 'asia'). Other regions (Africa, Europe, Middle East, North America, Oceania, South America) are not captured. To expand, remove or modify the continent filter in the extraction script.
- **No hotel IDs:** The Accor lounge page does not include Accor hotel IDs (the data-hotel-id used on booking pages). To map new hotels to IDs for the Chrome extension, search for the hotel on all.accor.com and inspect the search result card's data-hotel-id attribute.
- **Lounge policies not tracked:** The compact format omits the lounge policy text (child age restrictions, hours, etc.) to keep file sizes small. The full policy is available on the source page if needed. Add cols[1].textContent.trim() to the extraction script to include policies.
- **Page structure may change:** If Accor redesigns the page, the CSS selectors (.js-table-1-tbody, #selectCity, #selectCountry, #selectContinent) may need updating. Check the page source if the script stops working.
- **Static HTML:** All hotel data is embedded in the page HTML — no API calls or authentication required. The dropdowns only filter visibility via CSS classes.
- **Manual process for now:** This is a manual monthly workflow. Future improvement: automate with a GitHub Action using Puppeteer on a cron schedule.

## Baseline (February 2026)

203 hotels across 16 Asian countries:

| Country | Hotels |
|---------|--------|
| China | 80 |
| Indonesia | 22 |
| Thailand | 21 |
| India | 17 |
| Vietnam | 13 |
| South Korea | 10 |
| Singapore | 9 |
| Malaysia | 8 |
| Japan | 7 |
| Philippines | 3 |
| Pakistan | 3 |
| Hong Kong | 3 |
| Cambodia | 3 |
| Myanmar | 2 |
| Azerbaijan | 1 |
| Macao | 1 |
