# Monthly Executive Lounge Update Guide

## Overview

This guide documents how to update the Accor Executive Lounge and Complimentary Breakfast hotel lists on the 1st of each month. The goal is to track which hotels have been added or removed from Accor's official lists across **all regions globally**.

Two separate processes are maintained:
- **Process A:** Executive Lounge Hotels (~309 hotels across all continents)
- **Process B:** Complimentary Breakfast Hotels (~7,400+ hotels across all continents)

## Source

- **URL:** https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml
- **Tab 1:** "HOTELS WITH A LOUNGE" (lounge hotel list embedded in HTML)
- **Tab 2:** "HOTELS OFFERING COMPLIMENTARY BREAKFAST" (loaded via API)

## How the Accor Page Works

The page loads **all hotels globally** in a single HTML page. The three dropdown menus (Region > Country > City) only filter visibility — no additional data is fetched. This means a single JavaScript extraction can capture every hotel at once.

Each hotel row uses a CSS class matching its city slug (e.g., `bangkok`, `ho-chi-minh-city`). The city `<select>` has `data-country` attributes, and the country `<select>` has `data-continent` attributes, forming a full hierarchy.

The lounge hotel list is embedded in the page HTML — no API needed for that. The API is only used to:
1. Resolve hotel IDs (which the lounge page does not include)
2. Enrich with additional data (stars, reviews, amenities, etc.)
3. Load the full breakfast hotel list (via `label=COMPLIMENTARY_BREAKFAST`)

## File Structure

```
Accor-Executive-Lounge/
  content.js                    # Chrome extension (global lounge hotels)
  manifest.json                 # Extension manifest
  MONTHLY_UPDATE_GUIDE.md       # This guide
  data/
    lounge/
      2026-02.json              # February 2026 baseline (all regions)
      2026-03.json              # March 2026
    breakfast/
      2026-03.json              # March 2026 baseline
```

---

## Process A: Executive Lounge Hotels (Monthly)

### Step 1: Navigate to the Accor Page

Open https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml

### Step 2: Extract All Lounge Hotel Data

Run the **"Extract All Lounge Hotels"** bookmarklet (see Bookmarklet Code section below).

The bookmarklet:
- Scrapes **all** lounge hotels from the HTML table across all regions (region, country, city, hotel name, lounge policy)
- Parses each lounge policy into structured "Min Age" and "Policy Notes" fields
- Captures the Accor API key by briefly switching to the breakfast tab
- Enriches each hotel via the `api.accor.com/catalog/v1/hotels` API (stars, reviews, max child age, family friendly flag, key amenities)
- Resolves hotel IDs via fuzzy-matching hotel names
- Copies the full enriched JSON to your clipboard
- Shows a progress bar — takes ~3-4 minutes for all regions (~200+ cities)

**Note:** Hotels where the API cannot match the name will have `null` for enriched fields. Typically ~83% of hotels are matched automatically.

For unmatched hotels, search manually on all.accor.com and inspect the search result card's `data-hotel-id` attribute.

### Step 3: Save the New Data File

1. Create a new file in this repo: `data/lounge/YYYY-MM.json` (e.g., `data/lounge/2026-03.json`)
2. Paste the clipboard contents
3. Commit with message: `Add [Month] [Year] executive lounge data ([N] hotels, all regions)`

### Step 4: Compare with Previous Month

Use Claude with this prompt:

> I need to compare this month's Accor Executive Lounge hotel list against last month's.
>
> Previous month: [paste or link to last month's data/lounge/YYYY-MM.json]
> This month: [paste or link to this month's data/lounge/YYYY-MM.json]
>
> Please show me:
> - Hotels ADDED this month (new entries)
> - Hotels REMOVED this month (missing entries)
> - Total count comparison (last month vs this month)
> - Summary of changes by region and country

### Step 5: Update the Chrome Extension

If any hotels were added or removed, update the `EXECUTIVE_LOUNGE_HOTEL_IDS` Set in `content.js`.

The hotel IDs are included in the extracted data (5th element of each array) — use those directly.

---

## Process B: Complimentary Breakfast Hotels (Monthly)

### Step 1: Navigate to the Accor Page

Open https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml

(Same page as Process A — the API key is captured from the breakfast tab)

### Step 2: Extract All Breakfast Hotel Data

Run the **"Extract All Breakfast Hotels"** bookmarklet (see Bookmarklet Code section below).

The bookmarklet:
- Captures the Accor API key by switching to the breakfast tab
- Loads ALL complimentary breakfast hotels from all 7 continents via the API (paginated, 100 per request)
- Captures: region, brand, hotel name, hotel ID, stars, review score, review count
- Copies the full JSON to your clipboard
- Shows a progress bar — takes ~2-3 minutes for all regions

### Step 3: Save the New Data File

1. Create a new file in this repo: `data/breakfast/YYYY-MM.json` (e.g., `data/breakfast/2026-03.json`)
2. Paste the clipboard contents
3. Commit with message: `Add [Month] [Year] breakfast hotel data ([N] hotels, all regions)`

### Step 4: Compare with Previous Month

Use Claude with this prompt:

> I need to compare this month's Accor Complimentary Breakfast hotel list against last month's.
>
> Previous month: [paste or link to last month's data/breakfast/YYYY-MM.json]
> This month: [paste or link to this month's data/breakfast/YYYY-MM.json]
>
> Please show me:
> - Hotels ADDED this month (new entries)
> - Hotels REMOVED this month (missing entries)
> - Total count comparison (last month vs this month)
> - Summary of changes by region

---

## Data Formats

### Lounge Hotels Data Format

Each `data/lounge/YYYY-MM.json` file uses this structure:

```json
{
  "metadata": {
    "extracted": "2026-03-01",
    "source": "https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml",
    "region": "all",
    "total": 309,
    "matched": 256,
    "unmatched": 53,
    "format": "[region, country, city, hotel_name, hotel_id, lounge_policy, min_age, policy_notes, stars, review_score, review_count, max_child_age, family_friendly, key_amenities]"
  },
  "hotels": [
    ["asia", "thailand", "bangkok", "Sofitel Bangkok Sukhumvit", "1234", "Guests aged 16...", "16+", "Time limits", "5", "4.3/5", "1205", "17", "", "pool, spa, restaurant"]
  ]
}
```

**Fields (14 per hotel):**
1. `region` — continent slug (africa, asia, europe, middle-east, north-america, oceania, south-america)
2. `country` — country slug
3. `city` — city slug
4. `hotel_name` — display name from Accor page
5. `hotel_id` — Accor hotel ID resolved via API (null if unmatched)
6. `lounge_policy` — raw lounge policy text from Accor page
7. `min_age` — parsed minimum age (e.g., "0+", "16+", "Any", "?")
8. `policy_notes` — parsed policy notes (e.g., "Time limits", "Adult req.", "Fees")
9. `stars` — star rating from API (e.g., "5")
10. `review_score` — TrustYou review score (e.g., "4.3/5")
11. `review_count` — number of reviews (e.g., "1205")
12. `max_child_age` — max child age from API booking data
13. `family_friendly` — "yes" if FAMILY_FRIENDLY label, empty otherwise
14. `key_amenities` — filtered amenities (pool, spa, restaurant, fitness, child_facilities, bar)

### Breakfast Hotels Data Format

Each `data/breakfast/YYYY-MM.json` file uses this structure:

```json
{
  "metadata": {
    "extracted": "2026-03-01",
    "source": "api.accor.com/catalog/v1/hotels?label=COMPLIMENTARY_BREAKFAST",
    "region": "all",
    "total": 7432,
    "format": "[region, brand, hotel_name, hotel_id, stars, review_score, review_count]"
  },
  "hotels": [
    ["asia", "Novotel", "Novotel Bangkok Sukhumvit 20", "5678", "4", "4.1/5", "892"]
  ]
}
```

**Fields (7 per hotel):**
1. `region` — continent slug
2. `brand` — hotel brand (Novotel, Sofitel, Pullman, etc.)
3. `hotel_name` — display name
4. `hotel_id` — Accor hotel ID
5. `stars` — star rating
6. `review_score` — TrustYou review score
7. `review_count` — number of reviews

---

## API Details Discovered

The breakfast tab uses `api.accor.com/catalog/v1/hotels` with an `apiKey` header (Layer7 gateway key, 36 chars starting with `l7xx`). The key is embedded in the page's JavaScript bundles and sent via XHR. The bookmarklets capture it by intercepting `XMLHttpRequest.setRequestHeader`.

**Key API parameters:**
- `q` — search query (city name, region name, or hotel name)
- `sort=name` — sort results alphabetically
- `range=0-99` — pagination (0-indexed, inclusive)
- `fields` — comma-separated field paths (e.g., `results.hotel.name,results.hotel.rating`)
- `label=COMPLIMENTARY_BREAKFAST` — filter by label

**Available hotel fields include:** `id`, `name`, `brand`, `rating.star.score`, `rating.trustyou.score`, `rating.trustyou.nbReviews`, `roomOccupancy.maxChild`, `roomOccupancy.maxChildAge`, `roomOccupancy.maxAdult`, `roomOccupancy.maxPax`, `label` (array), `amenity.free` (array), `coordinates`, `contact`, `description`, `openingDate`, `lastRenovationDate`, `loyaltyProgram`, `environment.ecoCertifications`, and more.

**Important:** There is NO label or field in the API for "Executive Lounge." The lounge hotel list is only available from the HTML page. The API is used solely to enrich lounge hotels with additional data and resolve their hotel IDs.

---## Bookmarklet Code

### Bookmarklet 1: "Extract All Lounge Hotels" (Monthly Extraction)

This bookmarklet extracts **all** lounge hotels globally with enriched data resolved via the Accor API. Creates a JSON file with 14 fields per hotel.

Create a new bookmark and paste this as the URL:

```
javascript:void(function(){'use strict';function norm(n){return n.toLowerCase().replace(/[\u00f6\u00f4]/g,'o').replace(/[\u00e9\u00e8]/g,'e').replace(/[\u00e0\u00e1]/g,'a').replace(/[\u00fc\u00fb]/g,'u').replace(/[\u00ef\u00ee]/g,'i').replace(/\u00e7/g,'c').replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim()}function parsePolicy(p){if(!p||!p.trim())return{age:'\u2014',notes:'\u2014'};var t=p.toLowerCase(),age='Any',n=[];if(t.indexOf('no minimum age')>-1||t.indexOf('no age restriction')>-1||t.indexOf('children are welcome')>-1){age='0+'}else{var m=p.match(/(\d+)\s*years?\s*old\s*and\s*(?:above|older)/i)||p.match(/(?:above|over)\s*(\d+)\s*years/i)||p.match(/guests?\s*above\s*(\d+)/i)||p.match(/aged?\s*(\d+)\s*and\s*(?:above|older)/i)||p.match(/(\d+)\s*years?\s*and\s*(?:above|older)/i);if(m)age=m[1]+'+';var u=p.match(/(?:under|below)\s*(\d+)/i);if(u){if(t.indexOf('not permitted')>-1||t.indexOf('not allowed')>-1)age=u[1]+'+';else if(t.indexOf('accompanied')>-1)n.push('<'+u[1]+' need adult')}var ut=p.match(/until\s*(\d+)\s*years/i);if(ut)age='0\u2013'+ut[1]}if(t.indexOf('happy hour')>-1||t.indexOf('cocktail')>-1||t.indexOf('evening')>-1)n.push('Time limits');if(t.indexOf('accompanied')>-1&&!n.some(function(x){return x.indexOf('need adult')>-1}))n.push('Adult req.');if(t.indexOf('charge')>-1||t.indexOf('payment')>-1||t.indexOf('fee')>-1)n.push('Fees');if(t.indexOf('contact')>-1){age='?';n=['Contact hotel']}return{age:age,notes:n.length?n.join('; '):'\u2014'}}if(document.getElementById('bm-bar'))document.getElementById('bm-bar').remove();var bar=document.createElement('div');bar.id='bm-bar';bar.style.cssText='position:fixed;top:0;left:0;width:100%;z-index:99999;background:#1a1a4e;color:#fff;padding:8px 16px;font:13px/1.4 sans-serif;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)';bar.innerHTML='<span id="bm-s">Starting\u2026</span><span id="bm-p" style="margin-left:auto;font-weight:bold"></span>';document.body.appendChild(bar);function S(msg,pct){document.getElementById('bm-s').textContent=msg;document.getElementById('bm-p').textContent=pct!=null?Math.round(pct)+'%':''}S('Extracting all lounge hotel data from table\u2026');var cs=document.getElementById('selectCity'),co=document.getElementById('selectCountry');var c2c={},c2r={};Array.from(cs.options).forEach(function(o){c2c[o.value]=o.getAttribute('data-country')});Array.from(co.options).forEach(function(o){c2r[o.value]=o.getAttribute('data-continent')});var rows=document.querySelectorAll('.js-table-1-tbody tr');var hotels=[],cityMap={};rows.forEach(function(r){var city=r.className.trim().split(/\s+/)[0];var cols=r.querySelectorAll('td');if(cols.length>=2){var country=c2c[city]||'unknown';var continent=c2r[country]||'unknown';var name=cols[0].textContent.trim();var policy=cols[1]?cols[1].textContent.trim():'';var pp=parsePolicy(policy);hotels.push({region:continent,country:country,city:city,name:name,id:null,policy:policy,minAge:pp.age,policyNotes:pp.notes,stars:null,review:null,reviewCount:null,maxChildAge:null,family:null,amenities:null,norm:norm(name)});if(!cityMap[city])cityMap[city]=[];cityMap[city].push(hotels[hotels.length-1])}});hotels.sort(function(a,b){return a.region.localeCompare(b.region)||a.country.localeCompare(b.country)||a.city.localeCompare(b.city)||a.name.localeCompare(b.name)});S('Found '+hotels.length+' lounge hotels (all regions). Capturing API key\u2026',5);var apiKey=null;var _oO=XMLHttpRequest.prototype.open,_oS=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.open=function(m,u){this._u=u;return _oO.apply(this,arguments)};XMLHttpRequest.prototype.setRequestHeader=function(k,v){if(this._u&&this._u.indexOf('api.accor.com')>-1&&k==='apiKey')apiKey=v;return _oS.apply(this,arguments)};var bfTab=document.querySelector('.js-menu-item-2');if(bfTab)bfTab.click();setTimeout(function(){var nb=document.querySelector('.controls-next');if(nb)nb.click();var tries=0;var chk=setInterval(function(){tries++;if(apiKey||tries>40){clearInterval(chk);XMLHttpRequest.prototype.open=_oO;XMLHttpRequest.prototype.setRequestHeader=_oS;var lt=document.querySelector('.js-menu-item-1');if(lt)lt.click();setTimeout(function(){if(!apiKey){S('API key not found. Outputting without enrichment.');outputJSON()}else{S('API key captured! Enriching hotel data via API\u2026',10);enrichAll()}},500)}},250)},2000);function enrichAll(){var cities=Object.keys(cityMap),ci=0,matched=0;function next(){if(ci>=cities.length){S('Done! '+matched+'/'+hotels.length+' enriched. Copying to clipboard\u2026',98);outputJSON();return}var city=cities[ci],ch=cityMap[city];S('Enriching: '+city+' ('+ci+'/'+cities.length+')',10+(ci/cities.length*85));var q=city.replace(/-/g,' ');try{var xhr=new XMLHttpRequest();xhr.open('GET','https://api.accor.com/catalog/v1/hotels?q='+encodeURIComponent(q)+'&sort=name&range=0-100&fields=results.hotel.name,results.hotel.id,results.hotel.roomOccupancy,results.hotel.rating,results.hotel.label,results.hotel.amenity.free',false);xhr.setRequestHeader('Accept','application/json');xhr.setRequestHeader('Accept-Language','en');xhr.setRequestHeader('apiKey',apiKey);xhr.send();if(xhr.status===200||xhr.status===206){var d=JSON.parse(xhr.responseText),res=d.results||[],aMap={};res.forEach(function(r){aMap[norm(r.hotel.name)]=r.hotel});ch.forEach(function(h){var a=aMap[h.norm];if(!a){var ks=Object.keys(aMap);for(var i=0;i<ks.length;i++){if(ks[i].indexOf(h.norm)>-1||h.norm.indexOf(ks[i])>-1){a=aMap[ks[i]];break}}}if(a){matched++;h.id=a.id;h.stars=a.rating&&a.rating.star?String(a.rating.star.score):null;h.review=a.rating&&a.rating.trustyou?a.rating.trustyou.score+'/5':null;h.reviewCount=a.rating&&a.rating.trustyou?String(a.rating.trustyou.nbReviews):null;h.maxChildAge=a.roomOccupancy&&a.roomOccupancy.maxChildAge!=null?String(a.roomOccupancy.maxChildAge):null;h.family=a.label&&a.label.indexOf('FAMILY_FRIENDLY')>-1?'yes':'';h.amenities=a.amenity&&a.amenity.free?a.amenity.free.filter(function(x){return['pool','spa','restaurant','fitness','child_facilities','bar'].indexOf(x)>-1}).join(', '):null}})}}catch(e){}ci++;setTimeout(next,30)}next()}function outputJSON(){var out=hotels.map(function(h){return[h.region,h.country,h.city,h.name,h.id,h.policy,h.minAge,h.policyNotes,h.stars,h.review,h.reviewCount,h.maxChildAge,h.family,h.amenities]});var matched=hotels.filter(function(h){return h.id!==null}).length;var json=JSON.stringify({metadata:{extracted:new Date().toISOString().slice(0,10),source:location.href,region:'all',total:hotels.length,matched:matched,unmatched:hotels.length-matched,format:'[region, country, city, hotel_name, hotel_id, lounge_policy, min_age, policy_notes, stars, review_score, review_count, max_child_age, family_friendly, key_amenities]'},hotels:out},null,2);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(json).then(function(){S('Copied '+hotels.length+' lounge hotels to clipboard! Save as data/lounge/YYYY-MM.json',100)}).catch(function(){fallbackCopy(json)})}else{fallbackCopy(json)}var b=document.getElementById('bm-bar');if(b){b.style.cursor='pointer';b.title='Click to dismiss';b.onclick=function(){b.remove()}}}function fallbackCopy(text){var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);S('Copied '+hotels.length+' lounge hotels to clipboard! Save as data/lounge/YYYY-MM.json',100)}}())
```

### Bookmarklet 2: "Extract All Breakfast Hotels" (Monthly Extraction)

This bookmarklet extracts **all** complimentary breakfast hotels from all 7 regions via the Accor API.

Create a new bookmark and paste this as the URL:

```
javascript:void(function(){'use strict';if(document.getElementById('bm-bar'))document.getElementById('bm-bar').remove();var bar=document.createElement('div');bar.id='bm-bar';bar.style.cssText='position:fixed;top:0;left:0;width:100%;z-index:99999;background:#1a1a4e;color:#fff;padding:8px 16px;font:13px/1.4 sans-serif;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)';bar.innerHTML='<span id="bm-s">Starting\u2026</span><span id="bm-p" style="margin-left:auto;font-weight:bold"></span>';document.body.appendChild(bar);function S(msg,pct){document.getElementById('bm-s').textContent=msg;document.getElementById('bm-p').textContent=pct!=null?Math.round(pct)+'%':''}S('Capturing API key\u2026');var apiKey=null;var _oO=XMLHttpRequest.prototype.open,_oS=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.open=function(m,u){this._u=u;return _oO.apply(this,arguments)};XMLHttpRequest.prototype.setRequestHeader=function(k,v){if(this._u&&this._u.indexOf('api.accor.com')>-1&&k==='apiKey')apiKey=v;return _oS.apply(this,arguments)};var bfTab=document.querySelector('.js-menu-item-2');if(bfTab)bfTab.click();setTimeout(function(){var nb=document.querySelector('.controls-next');if(nb)nb.click();var tries=0;var chk=setInterval(function(){tries++;if(apiKey||tries>40){clearInterval(chk);XMLHttpRequest.prototype.open=_oO;XMLHttpRequest.prototype.setRequestHeader=_oS;var lt=document.querySelector('.js-menu-item-1');if(lt)lt.click();setTimeout(function(){if(!apiKey){S('API key not found. Cannot load breakfast hotels.');return}S('API key captured! Loading all breakfast hotels\u2026',5);loadAll()},500)}},250)},2000);function loadAll(){var regions=['africa','asia','europe','middle-east','north-america','oceania','south-america'];var all=[],ri=0;function nextRegion(){if(ri>=regions.length){outputJSON(all);return}var reg=regions[ri];S('Loading breakfast: '+reg+'\u2026 ('+all.length+' so far)',5+(ri/regions.length*90));var pg=0;function nextPage(){var s=pg*100,e=s+99;try{var xhr=new XMLHttpRequest();xhr.open('GET','https://api.accor.com/catalog/v1/hotels?q='+encodeURIComponent(reg)+'&sort=name&range='+s+'-'+e+'&fields=results.hotel.name,results.hotel.id,results.hotel.brand,results.hotel.rating&label=COMPLIMENTARY_BREAKFAST',false);xhr.setRequestHeader('Accept','application/json');xhr.setRequestHeader('Accept-Language','en');xhr.setRequestHeader('apiKey',apiKey);xhr.send();if(xhr.status===200||xhr.status===206){var d=JSON.parse(xhr.responseText),res=d.results||[];res.forEach(function(r){var h=r.hotel;all.push([reg,h.brand||null,h.name,h.id,h.rating&&h.rating.star?String(h.rating.star.score):null,h.rating&&h.rating.trustyou?h.rating.trustyou.score+'/5':null,h.rating&&h.rating.trustyou?String(h.rating.trustyou.nbReviews):null])});if(res.length<100||xhr.status===200){ri++;nextRegion()}else{pg++;nextPage()}}else{ri++;nextRegion()}}catch(e2){ri++;nextRegion()}}nextPage()}nextRegion()}function outputJSON(all){var json=JSON.stringify({metadata:{extracted:new Date().toISOString().slice(0,10),source:'api.accor.com/catalog/v1/hotels?label=COMPLIMENTARY_BREAKFAST',region:'all',total:all.length,format:'[region, brand, hotel_name, hotel_id, stars, review_score, review_count]'},hotels:all},null,2);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(json).then(function(){S('Copied '+all.length+' breakfast hotels to clipboard! Save as data/breakfast/YYYY-MM.json',100)}).catch(function(){fallbackCopy(json,all.length)})}else{fallbackCopy(json,all.length)}var b=document.getElementById('bm-bar');if(b){b.style.cursor='pointer';b.title='Click to dismiss';b.onclick=function(){b.remove()}}}function fallbackCopy(text,count){var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);S('Copied '+count+' breakfast hotels to clipboard! Save as data/breakfast/YYYY-MM.json',100)}}())
```

### Bookmarklet 3: "Show All Accor (Enhanced)" (Display / Exploration)

This bookmarklet enhances the Accor Executive Lounge page with three phases of data enrichment **for visual exploration**. It does NOT export data — use Bookmarklets 1 and 2 for monthly extraction.

Run it on https://all.accor.com/loyalty-program/user/hotels-lounge/index.en.shtml

**What It Does:**

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

Create a new bookmark and paste this as the URL:

```
javascript:void(function(){'use strict';function norm(n){return n.toLowerCase().replace(/[\u00f6\u00f4]/g,'o').replace(/[\u00e9\u00e8]/g,'e').replace(/[\u00e0\u00e1]/g,'a').replace(/[\u00fc\u00fb]/g,'u').replace(/[\u00ef\u00ee]/g,'i').replace(/\u00e7/g,'c').replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim()}function parsePolicy(p){if(!p||!p.trim())return{age:'\u2014',notes:'\u2014'};var t=p.toLowerCase(),age='Any',n=[];if(t.indexOf('no minimum age')>-1||t.indexOf('no age restriction')>-1||t.indexOf('children are welcome')>-1){age='0+'}else{var m=p.match(/(\d+)\s*years?\s*old\s*and\s*(?:above|older)/i)||p.match(/(?:above|over)\s*(\d+)\s*years/i)||p.match(/guests?\s*above\s*(\d+)/i)||p.match(/aged?\s*(\d+)\s*and\s*(?:above|older)/i)||p.match(/(\d+)\s*years?\s*and\s*(?:above|older)/i);if(m)age=m[1]+'+';var u=p.match(/(?:under|below)\s*(\d+)/i);if(u){if(t.indexOf('not permitted')>-1||t.indexOf('not allowed')>-1)age=u[1]+'+';else if(t.indexOf('accompanied')>-1)n.push('<'+u[1]+' need adult')}var ut=p.match(/until\s*(\d+)\s*years/i);if(ut)age='0\u2013'+ut[1]}if(t.indexOf('happy hour')>-1||t.indexOf('cocktail')>-1||t.indexOf('evening')>-1)n.push('Time limits');if(t.indexOf('accompanied')>-1&&!n.some(function(x){return x.indexOf('need adult')>-1}))n.push('Adult req.');if(t.indexOf('charge')>-1||t.indexOf('payment')>-1||t.indexOf('fee')>-1)n.push('Fees');if(t.indexOf('contact')>-1){age='?';n=['Contact hotel']}return{age:age,notes:n.length?n.join('; '):'\u2014'}}if(document.getElementById('bm-bar'))document.getElementById('bm-bar').remove();var bar=document.createElement('div');bar.id='bm-bar';bar.style.cssText='position:fixed;top:0;left:0;width:100%;z-index:99999;background:#1a1a4e;color:#fff;padding:8px 16px;font:13px/1.4 sans-serif;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)';bar.innerHTML='<span id="bm-s">Starting\u2026</span><span id="bm-p" style="margin-left:auto;font-weight:bold"></span>';document.body.appendChild(bar);function S(msg,pct){document.getElementById('bm-s').textContent=msg;document.getElementById('bm-p').textContent=pct!=null?Math.round(pct)+'%':''}if(document.getElementById('bm-css'))document.getElementById('bm-css').remove();var sty=document.createElement('style');sty.id='bm-css';sty.textContent='.js-table-1-tbody tr.bm-v{display:table-row!important}.panel__table{font-size:12px;width:100%!important}.bm-c{white-space:nowrap;padding:4px 6px!important;font-size:11px}.bm-r{color:#c00;font-weight:700}.bm-g{color:#080;font-weight:700}.bm-y{color:#999}.bm-h{font-weight:700!important;font-size:11px!important;white-space:nowrap;background:#1a1a4e!important;color:#fff!important;padding:6px 8px!important}#bm-bf{margin:20px auto;padding:0 20px;font:13px/1.5 sans-serif}#bm-bf table{width:100%;border-collapse:collapse}#bm-bf th{background:#1a1a4e;color:#fff;padding:6px 8px;text-align:left;font-size:11px;position:sticky;top:0;white-space:nowrap}#bm-bf td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}#bm-bf tr:nth-child(even){background:#f5f5fa}';document.head.appendChild(sty);S('\u2460 Enhancing lounge table\u2026');var cs=document.getElementById('selectCity'),co=document.getElementById('selectCountry');var c2c={},c2r={};Array.from(cs.options).forEach(function(o){c2c[o.value]=o.getAttribute('data-country')});Array.from(co.options).forEach(function(o){c2r[o.value]=o.getAttribute('data-continent')});var thead=document.querySelector('.panel__table thead tr');thead.querySelectorAll('.bm-h').forEach(function(e){e.remove()});['Policy Notes','Min Age','City','Country','Region'].forEach(function(t){var td=document.createElement('td');td.className='bm-h';td.textContent=t;thead.insertBefore(td,thead.children[0])});var rows=document.querySelectorAll('.js-table-1-tbody tr');var cityMap={};rows.forEach(function(r){r.classList.add('bm-v');r.querySelectorAll('.bm-c').forEach(function(e){e.remove()});var city=r.className.replace(/bm-v/g,'').trim().split(/\s+/)[0];var country=c2c[city]||'?',region=c2r[country]||'?';var pol=r.querySelector('.panel-1__col-2');var pp=parsePolicy(pol?pol.textContent.trim():'');var hname=r.querySelector('.panel-1__col-1').textContent.trim();if(!cityMap[city])cityMap[city]=[];cityMap[city].push({row:r,name:hname,norm:norm(hname)});[{v:pp.notes},{v:pp.age,a:1},{v:city},{v:country},{v:region}].forEach(function(c){var td=document.createElement('td');td.className='bm-c';td.textContent=c.v;if(c.a){var n=parseInt(c.v);if(!isNaN(n)&&n>=16)td.classList.add('bm-r');else if(c.v==='0+'||c.v.indexOf('0\u2013')===0)td.classList.add('bm-g');else if(c.v==='?'||c.v==='\u2014')td.classList.add('bm-y')}r.insertBefore(td,r.children[0])})});S('\u2460 Done: '+rows.length+' lounge hotels. Capturing API key\u2026');var apiKey=null;var _oO=XMLHttpRequest.prototype.open,_oS=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.open=function(m,u){this._u=u;return _oO.apply(this,arguments)};XMLHttpRequest.prototype.setRequestHeader=function(k,v){if(this._u&&this._u.indexOf('api.accor.com')>-1&&k==='apiKey')apiKey=v;return _oS.apply(this,arguments)};var bfTabItem=document.querySelector('.js-menu-item-2');if(bfTabItem)bfTabItem.click();setTimeout(function(){var nextBtn=document.querySelector('.controls-next');if(nextBtn)nextBtn.click();var tries=0;var check=setInterval(function(){tries++;if(apiKey||tries>40){clearInterval(check);var loungeItem=document.querySelector('.js-menu-item-1');if(loungeItem)loungeItem.click();setTimeout(function(){startPhase2()},500)}},250)},1500);function startPhase2(){if(!apiKey){S('API key not found. Phase 1 complete ('+rows.length+' hotels). API enrichment skipped.');return}S('\u2461 API enrichment starting\u2026',10);['Stars','Review','Max Child Age','Family','Key Amenities'].forEach(function(t){var td=document.createElement('td');td.className='bm-h';td.textContent=t;thead.appendChild(td)});var cities=Object.keys(cityMap),ci=0,matched=0,unmatched=0;function nextCity(){if(ci>=cities.length){rows.forEach(function(r){while(r.children.length<thead.children.length){var td=document.createElement('td');td.className='bm-c';td.textContent='\u2014';r.appendChild(td)}});S('\u2461 Done: '+matched+' enriched, '+unmatched+' unmatched. Loading breakfast\u2026',60);startPhase3();return}var city=cities[ci],ch=cityMap[city];S('\u2461 Enriching '+city+' ('+ci+'/'+cities.length+')\u2026',10+(ci/cities.length*50));var q=city.replace(/-/g,' ');try{var xhr=new XMLHttpRequest();xhr.open('GET','https://api.accor.com/catalog/v1/hotels?q='+encodeURIComponent(q)+'&sort=name&range=0-100&fields=results.hotel.name,results.hotel.id,results.hotel.roomOccupancy,results.hotel.rating,results.hotel.label,results.hotel.amenity.free',false);xhr.setRequestHeader('Accept','application/json');xhr.setRequestHeader('Accept-Language','en');xhr.setRequestHeader('apiKey',apiKey);xhr.send();if(xhr.status===200||xhr.status===206){var data=JSON.parse(xhr.responseText),apiH=data.results||[],aMap={};apiH.forEach(function(r){aMap[norm(r.hotel.name)]=r.hotel});ch.forEach(function(h){var a=aMap[h.norm];if(!a){var ks=Object.keys(aMap);for(var i=0;i<ks.length;i++){if(ks[i].indexOf(h.norm)>-1||h.norm.indexOf(ks[i])>-1){a=aMap[ks[i]];break}}}if(a){matched++;var st=a.rating&&a.rating.star?a.rating.star.score+'\u2605':'\u2014';var rv=a.rating&&a.rating.trustyou?a.rating.trustyou.score+'/5 ('+a.rating.trustyou.nbReviews+')':'\u2014';var mc=a.roomOccupancy&&a.roomOccupancy.maxChildAge!=null?String(a.roomOccupancy.maxChildAge):'\u2014';var fm=a.label&&a.label.indexOf('FAMILY_FRIENDLY')>-1?'\u2713':'';var am=a.amenity&&a.amenity.free?a.amenity.free.filter(function(x){return['pool','spa','restaurant','fitness','child_facilities','bar'].indexOf(x)>-1}).join(', '):'\u2014';[st,rv,mc,fm,am].forEach(function(v){var td=document.createElement('td');td.className='bm-c';td.textContent=v;h.row.appendChild(td)})}else{unmatched++}})}}catch(e){}ci++;setTimeout(nextCity,30)}nextCity()}function startPhase3(){var regions=['africa','asia','europe','middle-east','north-america','oceania','south-america'];var all=[],ri=0;function nextRegion(){if(ri>=regions.length){renderBf();return}var reg=regions[ri];S('\u2462 Loading breakfast: '+reg+'\u2026',60+(ri/regions.length*35));var pg=0;function nextPage(){var s=pg*100,e=s+99;try{var xhr=new XMLHttpRequest();xhr.open('GET','https://api.accor.com/catalog/v1/hotels?q='+encodeURIComponent(reg)+'&sort=name&range='+s+'-'+e+'&fields=results.hotel.name,results.hotel.id,results.hotel.brand,results.hotel.rating,results.hotel.coordinates&label=COMPLIMENTARY_BREAKFAST',false);xhr.setRequestHeader('Accept','application/json');xhr.setRequestHeader('Accept-Language','en');xhr.setRequestHeader('apiKey',apiKey);xhr.send();if(xhr.status===200||xhr.status===206){var d=JSON.parse(xhr.responseText),res=d.results||[];res.forEach(function(r){var h=r.hotel;all.push({name:h.name,id:h.id,brand:h.brand||'\u2014',stars:h.rating&&h.rating.star?h.rating.star.score:'\u2014',review:h.rating&&h.rating.trustyou?h.rating.trustyou.score:'\u2014',nRev:h.rating&&h.rating.trustyou?h.rating.trustyou.nbReviews:0,region:reg})});if(res.length<100||xhr.status===200){ri++;nextRegion()}else{pg++;nextPage()}}else{ri++;nextRegion()}}catch(e2){ri++;nextRegion()}}nextPage()}function renderBf(){S('All done! '+rows.length+' lounge hotels + '+all.length+' breakfast hotels.',100);if(document.getElementById('bm-bf'))document.getElementById('bm-bf').remove();var div=document.createElement('div');div.id='bm-bf';div.innerHTML='<h2 style="color:#1a1a4e;margin:30px 0 10px">\u2615 Hotels Offering Complimentary Breakfast ('+all.length+' hotels)</h2><p style="color:#666;margin:0 0 10px;font-size:12px">Loaded from all 7 regions via Accor API. Diamond members: weekends. Platinum+ in Asia-Pacific: all week.</p>';var tbl=document.createElement('table');tbl.innerHTML='<thead><tr><th>#</th><th>Region</th><th>Brand</th><th>Hotel Name</th><th>Hotel ID</th><th>Stars</th><th>Review</th><th># Reviews</th></tr></thead>';var tb=document.createElement('tbody');all.sort(function(a,b){return a.region.localeCompare(b.region)||a.name.localeCompare(b.name)});all.forEach(function(h,i){var tr=document.createElement('tr');tr.innerHTML='<td>'+(i+1)+'</td><td>'+h.region+'</td><td>'+h.brand+'</td><td>'+h.name+'</td><td>'+h.id+'</td><td>'+(h.stars!=='\u2014'?h.stars+'\u2605':'\u2014')+'</td><td>'+(h.review!=='\u2014'?h.review+'/5':'\u2014')+'</td><td>'+h.nRev+'</td>';tb.appendChild(tr)});tbl.appendChild(tb);div.appendChild(tbl);var p1=document.querySelector('.panel--1');p1.parentNode.insertBefore(div,p1.nextSibling);setTimeout(function(){var b=document.getElementById('bm-bar');if(b){b.style.cursor='pointer';b.title='Click to dismiss';b.onclick=function(){b.remove()}}},2000)}nextRegion()}}())
```

---

## Baseline (February 2026)

### Lounge Hotels
309 hotels globally across all regions. Asia breakdown (203 hotels across 16 countries):

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

*Note: The February 2026 baseline only includes Asia hotels in a compact 3-field format. Starting March 2026, the data includes all regions with the full 14-field enriched format.*

### Breakfast Hotels
~7,400+ hotels globally (first baseline to be captured March 2026).

---

## Limitations and Notes

- **Hotel IDs resolved via API:** The extraction bookmarklets use the Accor catalog API to fuzzy-match hotel names and resolve IDs. Approximately 83% of hotels are matched automatically. Hotels with `null` IDs need to be looked up manually — search for the hotel on all.accor.com and inspect the search result card's `data-hotel-id` attribute.

- **No API label for Executive Lounge:** There is no `label` or field in the API that identifies executive lounge hotels. The lounge hotel list is ONLY available from the HTML page. The API is used solely to enrich and resolve hotel IDs.

- **Lounge policies not in API:** Lounge policy text (child age restrictions, hours, etc.) comes from the HTML page, not the API. The extraction bookmarklet captures and parses these automatically.

- **Page structure may change:** If Accor redesigns the page, the CSS selectors (`.js-table-1-tbody`, `#selectCity`, `#selectCountry`, `#selectContinent`) may need updating. Check the page source if the script stops working.

- **Static HTML + API hybrid:** The lounge hotel list is embedded in the page HTML — no API needed for that. The API is only used to resolve hotel IDs and enrich data.

- **Manual process for now:** This is a manual monthly workflow. Future improvement: automate with a GitHub Action using Puppeteer on a cron schedule.

---

## Usage Notes

- The "Extract All Lounge Hotels" bookmarklet takes ~3-4 minutes to complete (API calls for all cities globally)
- The "Extract All Breakfast Hotels" bookmarklet takes ~2-3 minutes to complete (paginated API calls across 7 regions)
- The "Show All Accor (Enhanced)" bookmarklet takes about 60 seconds to complete all 3 phases
- A progress bar at the top shows status throughout and becomes click-to-dismiss when done
- Phase 2 makes synchronous API calls (~one per city) — the browser may appear briefly unresponsive
- The API key is captured at runtime from the page's own requests — no hardcoded keys
- If the Accor page structure changes, the CSS selectors (`.js-menu-item-1`, `.js-menu-item-2`, `.controls-next`) may need updating
