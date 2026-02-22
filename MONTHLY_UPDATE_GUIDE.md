# Monthly Executive Lounge Update Guide

## Overview

This guide documents how to update the Accor Executive Lounge hotel list on the 1st of each month. The goal is to track which hotels have been added or removed from Accor's official lounge list.

## Source

- **URL:** https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml
- **Tab:** "HOTELS WITH A LOUNGE" (first tab on the page)

## How the Accor Page Works

The page loads **all hotels globally in a single HTML page**. The three dropdown menus (Region > Country > City) only filter visibility â no additional data is fetched. This means a single JavaScript extraction can capture every hotel at once.

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

If any Vietnam hotels were added or removed, update the `EXECUTIVE_LOUNGE_HOTEL_IDS` Set in `content.js`. Note: the Accor lounge page does not include hotel IDs â you will need to find the `data-hotel-id` from the Accor booking/search results page for any new Vietnam hotels.

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
- **Static HTML:** All hotel data is embedded in the page HTML â no API calls or authentication required. The dropdowns only filter visibility via CSS classes.
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


## Enhanced Bookmarklet — "Show All Accor (Enhanced)"

This bookmarklet enhances the Accor Executive Lounge page with three phases of data enrichment. Run it on https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml

### What It Does

**Phase 1 — Static Table Enhancement (instant)**
- Shows all 309 lounge hotels at once (overrides city filter)
- Adds Region, Country, City columns from dropdown `data-country` / `data-continent` attributes
- Parses each lounge policy into structured "Min Age" (color-coded: green=0+, red=16+, gray=unknown) and "Policy Notes" columns (time limits, adult required, fees, etc.)

**Phase 2 — API Enrichment (~60 seconds)**
- Captures the page's API key by briefly switching to the breakfast tab
- Enriches each lounge hotel via the Accor catalog API (`api.accor.com/catalog/v1/hotels`)
- Adds columns: Stars, Review Score, Max Child Age (from API booking data), Family Friendly flag, Key Amenities (pool, spa, restaurant, etc.)
- Searches by city name and fuzzy-matches hotel names (normalizes accented characters like Mövenpick/Movenpick)

**Phase 3 — Full Breakfast Hotel List**
- Loads ALL complimentary breakfast hotels from all 7 continents via the API (paginated, 100 per request)
- Renders a complete table below the lounge table with: Region, Brand, Hotel Name, Hotel ID, Stars, Review Score, Review Count
- Typically pulls ~7,400+ hotels

### API Details Discovered

The breakfast tab uses `api.accor.com/catalog/v1/hotels` with an `apiKey` header (Layer7 gateway key, 36 chars starting with `l7xx`). The key is embedded in the page's JavaScript bundles and sent via XHR. The bookmarklet captures it by intercepting `XMLHttpRequest.setRequestHeader`.

Key API parameters:
- `q` — search query (city name, region name, or hotel name)
- `sort=name` — sort results alphabetically
- `range=0-99` — pagination (0-indexed, inclusive)
- `fields` — comma-separated field paths (e.g., `results.hotel.name,results.hotel.rating`)
- `label=COMPLIMENTARY_BREAKFAST` — filter by label

Available hotel fields include: `id`, `name`, `brand`, `rating.star.score`, `rating.trustyou.score`, `rating.trustyou.nbReviews`, `roomOccupancy.maxChild`, `roomOccupancy.maxChildAge`, `roomOccupancy.maxAdult`, `roomOccupancy.maxPax`, `label` (array), `amenity.free` (array), `coordinates`, `contact`, `description`, `openingDate`, `lastRenovationDate`, `loyaltyProgram`, `environment.ecoCertifications`, and more.

### Bookmarklet Code

Create a new bookmark and paste this as the URL:

```javascript
javascript:void(function(){'use strict';function norm(n){return n.toLowerCase().replace(/[\u00f6\u00f4]/g,'o').replace(/[\u00e9\u00e8]/g,'e').replace(/[\u00e0\u00e1]/g,'a').replace(/[\u00fc\u00fb]/g,'u').replace(/[\u00ef\u00ee]/g,'i').replace(/\u00e7/g,'c').replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim()}function parsePolicy(p){if(!p||!p.trim())return{age:'\u2014',notes:'\u2014'};var t=p.toLowerCase(),age='Any',n=[];if(t.indexOf('no minimum age')>-1||t.indexOf('no age restriction')>-1||t.indexOf('children are welcome')>-1){age='0+'}else{var m=p.match(/(\d+)\s*years?\s*old\s*and\s*(?:above|older)/i)||p.match(/(?:above|over)\s*(\d+)\s*years/i)||p.match(/guests?\s*above\s*(\d+)/i)||p.match(/aged?\s*(\d+)\s*and\s*(?:above|older)/i)||p.match(/(\d+)\s*years?\s*and\s*(?:above|older)/i);if(m)age=m[1]+'+';var u=p.match(/(?:under|below)\s*(\d+)/i);if(u){if(t.indexOf('not permitted')>-1||t.indexOf('not allowed')>-1)age=u[1]+'+';else if(t.indexOf('accompanied')>-1)n.push('<'+u[1]+' need adult')}var ut=p.match(/until\s*(\d+)\s*years/i);if(ut)age='0\u2013'+ut[1]}if(t.indexOf('happy hour')>-1||t.indexOf('cocktail')>-1||t.indexOf('evening')>-1)n.push('Time limits');if(t.indexOf('accompanied')>-1&&!n.some(function(x){return x.indexOf('need adult')>-1}))n.push('Adult req.');if(t.indexOf('charge')>-1||t.indexOf('payment')>-1||t.indexOf('fee')>-1)n.push('Fees');if(t.indexOf('contact')>-1){age='?';n=['Contact hotel']}return{age:age,notes:n.length?n.join('; '):'\u2014'}}if(document.getElementById('bm-bar'))document.getElementById('bm-bar').remove();var bar=document.createElement('div');bar.id='bm-bar';bar.style.cssText='position:fixed;top:0;left:0;width:100%;z-index:99999;background:#1a1a4e;color:#fff;padding:8px 16px;font:13px/1.4 sans-serif;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)';bar.innerHTML='<span id="bm-s">Starting\u2026</span><span id="bm-p" style="margin-left:auto;font-weight:bold"></span>';document.body.appendChild(bar);function S(msg,pct){document.getElementById('bm-s').textContent=msg;document.getElementById('bm-p').textContent=pct!=null?Math.round(pct)+'%':''}if(document.getElementById('bm-css'))document.getElementById('bm-css').remove();var sty=document.createElement('style');sty.id='bm-css';sty.textContent='.js-table-1-tbody tr.bm-v{display:table-row!important}.panel__table{font-size:12px;width:100%!important}.bm-c{white-space:nowrap;padding:4px 6px!important;font-size:11px}.bm-r{color:#c00;font-weight:700}.bm-g{color:#080;font-weight:700}.bm-y{color:#999}.bm-h{font-weight:700!important;font-size:11px!important;white-space:nowrap;background:#1a1a4e!important;color:#fff!important;padding:6px 8px!important}#bm-bf{margin:20px auto;padding:0 20px;font:13px/1.5 sans-serif}#bm-bf table{width:100%;border-collapse:collapse}#bm-bf th{background:#1a1a4e;color:#fff;padding:6px 8px;text-align:left;font-size:11px;position:sticky;top:0;white-space:nowrap}#bm-bf td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}#bm-bf tr:nth-child(even){background:#f5f5fa}';document.head.appendChild(sty);S('\u2460 Enhancing lounge table\u2026');var cs=document.getElementById('selectCity'),co=document.getElementById('selectCountry');var c2c={},c2r={};Array.from(cs.options).forEach(function(o){c2c[o.value]=o.getAttribute('data-country')});Array.from(co.options).forEach(function(o){c2r[o.value]=o.getAttribute('data-continent')});var thead=document.querySelector('.panel__table thead tr');thead.querySelectorAll('.bm-h').forEach(function(e){e.remove()});['Policy Notes','Min Age','City','Country','Region'].forEach(function(t){var td=document.createElement('td');td.className='bm-h';td.textContent=t;thead.insertBefore(td,thead.children[0])});var rows=document.querySelectorAll('.js-table-1-tbody tr');var cityMap={};rows.forEach(function(r){r.classList.add('bm-v');r.querySelectorAll('.bm-c').forEach(function(e){e.remove()});var city=r.className.replace(/bm-v/g,'').trim().split(/\s+/)[0];var country=c2c[city]||'?',region=c2r[country]||'?';var pol=r.querySelector('.panel-1__col-2');var pp=parsePolicy(pol?pol.textContent.trim():'');var hname=r.querySelector('.panel-1__col-1').textContent.trim();if(!cityMap[city])cityMap[city]=[];cityMap[city].push({row:r,name:hname,norm:norm(hname)});[{v:pp.notes},{v:pp.age,a:1},{v:city},{v:country},{v:region}].forEach(function(c){var td=document.createElement('td');td.className='bm-c';td.textContent=c.v;if(c.a){var n=parseInt(c.v);if(!isNaN(n)&&n>=16)td.classList.add('bm-r');else if(c.v==='0+'||c.v.indexOf('0\u2013')===0)td.classList.add('bm-g');else if(c.v==='?'||c.v==='\u2014')td.classList.add('bm-y')}r.insertBefore(td,r.children[0])})});S('\u2460 Done: '+rows.length+' lounge hotels. Capturing API key\u2026');var apiKey=null;var _oO=XMLHttpRequest.prototype.open,_oS=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.open=function(m,u){this._u=u;return _oO.apply(this,arguments)};XMLHttpRequest.prototype.setRequestHeader=function(k,v){if(this._u&&this._u.indexOf('api.accor.com')>-1&&k==='apiKey')apiKey=v;return _oS.apply(this,arguments)};var bfTabItem=document.querySelector('.js-menu-item-2');if(bfTabItem)bfTabItem.click();setTimeout(function(){var nextBtn=document.querySelector('.controls-next');if(nextBtn)nextBtn.click();var tries=0;var check=setInterval(function(){tries++;if(apiKey||tries>40){clearInterval(check);var loungeItem=document.querySelector('.js-menu-item-1');if(loungeItem)loungeItem.click();setTimeout(function(){startPhase2()},500)}},250)},1500);function startPhase2(){if(!apiKey){S('API key not found. Phase 1 complete ('+rows.length+' hotels). API enrichment skipped.');return}S('\u2461 API enrichment starting\u2026',10);['Stars','Review','Max Child Age','Family','Key Amenities'].forEach(function(t){var td=document.createElement('td');td.className='bm-h';td.textContent=t;thead.appendChild(td)});var cities=Object.keys(cityMap),ci=0,matched=0,unmatched=0;function nextCity(){if(ci>=cities.length){rows.forEach(function(r){while(r.children.length<thead.children.length){var td=document.createElement('td');td.className='bm-c';td.textContent='\u2014';r.appendChild(td)}});S('\u2461 Done: '+matched+' enriched, '+unmatched+' unmatched. Loading breakfast\u2026',60);startPhase3();return}var city=cities[ci],ch=cityMap[city];S('\u2461 Enriching '+city+' ('+ci+'/'+cities.length+')\u2026',10+(ci/cities.length*50));var q=city.replace(/-/g,' ');try{var xhr=new XMLHttpRequest();xhr.open('GET','https://api.accor.com/catalog/v1/hotels?q='+encodeURIComponent(q)+'&sort=name&range=0-100&fields=results.hotel.name,results.hotel.id,results.hotel.roomOccupancy,results.hotel.rating,results.hotel.label,results.hotel.amenity.free',false);xhr.setRequestHeader('Accept','application/json');xhr.setRequestHeader('Accept-Language','en');xhr.setRequestHeader('apiKey',apiKey);xhr.send();if(xhr.status===200||xhr.status===206){var data=JSON.parse(xhr.responseText),apiH=data.results||[],aMap={};apiH.forEach(function(r){aMap[norm(r.hotel.name)]=r.hotel});ch.forEach(function(h){var a=aMap[h.norm];if(!a){var ks=Object.keys(aMap);for(var i=0;i<ks.length;i++){if(ks[i].indexOf(h.norm)>-1||h.norm.indexOf(ks[i])>-1){a=aMap[ks[i]];break}}}if(a){matched++;var st=a.rating&&a.rating.star?a.rating.star.score+'\u2605':'\u2014';var rv=a.rating&&a.rating.trustyou?a.rating.trustyou.score+'/5 ('+a.rating.trustyou.nbReviews+')':'\u2014';var mc=a.roomOccupancy&&a.roomOccupancy.maxChildAge!=null?String(a.roomOccupancy.maxChildAge):'\u2014';var fm=a.label&&a.label.indexOf('FAMILY_FRIENDLY')>-1?'\u2713':'';var am=a.amenity&&a.amenity.free?a.amenity.free.filter(function(x){return['pool','spa','restaurant','fitness','child_facilities','bar'].indexOf(x)>-1}).join(', '):'\u2014';[st,rv,mc,fm,am].forEach(function(v){var td=document.createElement('td');td.className='bm-c';td.textContent=v;h.row.appendChild(td)})}else{unmatched++}})}}catch(e){}ci++;setTimeout(nextCity,30)}nextCity()}function startPhase3(){var regions=['africa','asia','europe','middle-east','north-america','oceania','south-america'];var all=[],ri=0;function nextRegion(){if(ri>=regions.length){renderBf();return}var reg=regions[ri];S('\u2462 Loading breakfast: '+reg+'\u2026',60+(ri/regions.length*35));var pg=0;function nextPage(){var s=pg*100,e=s+99;try{var xhr=new XMLHttpRequest();xhr.open('GET','https://api.accor.com/catalog/v1/hotels?q='+encodeURIComponent(reg)+'&sort=name&range='+s+'-'+e+'&fields=results.hotel.name,results.hotel.id,results.hotel.brand,results.hotel.rating,results.hotel.coordinates&label=COMPLIMENTARY_BREAKFAST',false);xhr.setRequestHeader('Accept','application/json');xhr.setRequestHeader('Accept-Language','en');xhr.setRequestHeader('apiKey',apiKey);xhr.send();if(xhr.status===200||xhr.status===206){var d=JSON.parse(xhr.responseText),res=d.results||[];res.forEach(function(r){var h=r.hotel;all.push({name:h.name,id:h.id,brand:h.brand||'\u2014',stars:h.rating&&h.rating.star?h.rating.star.score:'\u2014',review:h.rating&&h.rating.trustyou?h.rating.trustyou.score:'\u2014',nRev:h.rating&&h.rating.trustyou?h.rating.trustyou.nbReviews:0,region:reg})});if(res.length<100||xhr.status===200){ri++;nextRegion()}else{pg++;nextPage()}}else{ri++;nextRegion()}}catch(e2){ri++;nextRegion()}}nextPage()}function renderBf(){S('All done! '+rows.length+' lounge hotels + '+all.length+' breakfast hotels.',100);if(document.getElementById('bm-bf'))document.getElementById('bm-bf').remove();var div=document.createElement('div');div.id='bm-bf';div.innerHTML='<h2 style="color:#1a1a4e;margin:30px 0 10px">\u2615 Hotels Offering Complimentary Breakfast ('+all.length+' hotels)</h2><p style="color:#666;margin:0 0 10px;font-size:12px">Loaded from all 7 regions via Accor API. Diamond members: weekends. Platinum+ in Asia-Pacific: all week.</p>';var tbl=document.createElement('table');tbl.innerHTML='<thead><tr><th>#</th><th>Region</th><th>Brand</th><th>Hotel Name</th><th>Hotel ID</th><th>Stars</th><th>Review</th><th># Reviews</th></tr></thead>';var tb=document.createElement('tbody');all.sort(function(a,b){return a.region.localeCompare(b.region)||a.name.localeCompare(b.name)});all.forEach(function(h,i){var tr=document.createElement('tr');tr.innerHTML='<td>'+(i+1)+'</td><td>'+h.region+'</td><td>'+h.brand+'</td><td>'+h.name+'</td><td>'+h.id+'</td><td>'+(h.stars!=='\u2014'?h.stars+'\u2605':'\u2014')+'</td><td>'+(h.review!=='\u2014'?h.review+'/5':'\u2014')+'</td><td>'+h.nRev+'</td>';tb.appendChild(tr)});tbl.appendChild(tb);div.appendChild(tbl);var p1=document.querySelector('.panel--1');p1.parentNode.insertBefore(div,p1.nextSibling);setTimeout(function(){var b=document.getElementById('bm-bar');if(b){b.style.cursor='pointer';b.title='Click to dismiss';b.onclick=function(){b.remove()}}},2000)}nextRegion()}}())
```

### Usage Notes

- The bookmarklet takes about 60 seconds to complete all 3 phases
- A progress bar at the top shows status throughout and becomes click-to-dismiss when done
- Phase 2 makes synchronous API calls (~178 requests, one per city) — the browser may appear briefly unresponsive
- The API key is captured at runtime from the page's own requests — no hardcoded keys
- If the Accor page structure changes, the CSS selectors (`.js-menu-item-1`, `.js-menu-item-2`, `.controls-next`) may need updating
