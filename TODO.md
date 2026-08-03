# Open follow-ups

Carried over from the August 2026 update (2026-08-03). Ordered roughly by value.

## 1. Pull Accor destination pages during the monthly extraction

**Why it matters most:** two properties are invisible to the extension entirely —
not merely missing perk data, but absent from every dataset it reads.

- Mövenpick Resort Waverly Phu Quoc (`B4V5`)
- The Morning Glow - Handwritten Collection, Nha Trang (`C561`)

Both appear on neither the official lounge list nor the complimentary-breakfast
list. Each was found only by enumerating Accor's destination page for the city,
which listed one more property than our data knew about — Phu Quoc 8 vs 7, Nha
Trang 5 vs 4. Two hits in three cities is a pattern, not coincidence: Accor's
benefit lists do not enumerate Accor's estate.

Suggested fix: add a destination-page pass to `MONTHLY_UPDATE_GUIDE.md` and the
extraction, so the dataset knows about every property even when it has no
lounge or breakfast benefit.

## 2. Finish Bangkok research

`data/benefits/bangkok.json` has 41 records but only 14 researched in depth.
10 are `status: "unverified"` — placeholders marking the gap, not findings.

## 3. Thai-language pass on two thin records

Both are on the official lounge list, so a lounge is confirmed, but nothing else
was found — no hours, no cocktail window, no alcohol confirmation.

- Mercure Bangkok Sukhumvit 11 (`A247`) — targeted searching only ever surfaced
  the Makkasan property
- Novotel Bangkok Future Park Rangsit (`B346`) — the only coverage found is
  Thai-language (Wongnai)

## 4. Verify Mövenpick Waverly's hotel code

`B4V5` was derived from the property's contact address (`HB4V5@movenpick.com`),
not from the catalog API. `accor_hotel_code` is the join key to the extension,
so confirm it against a booking URL before relying on it.

## 5. Decide how the UI should treat all-inclusive resorts

Rixos Phu Quoc (`C428`) has `alcohol: true` and `complimentary: true` — both
literally correct, since drinks are free-flow. But that is the Ultra All
Inclusive *rate*, not a lounge and not a status benefit, and no evidence was
found that Platinum adds anything. Right now this is flagged in `notes` only,
which means the fields alone would rank it beside a genuine club lounge.

Accor's all-inclusive collection is growing, so this wants a category in the
schema rather than a per-record caveat.

## Smaller

- `price_snapshots` is the only unbounded table (~0.4MB/month). Harmless now; a
  retention policy would keep it flat if usage grows.
- Oceania breakfast hotels have never been captured — `q=oceania` returns 404
  from the catalog API, so Australian and NZ properties are absent from every
  breakfast dataset to date. Pre-existing, not a regression.
- GitHub disables scheduled workflows after 60 days of repo inactivity, which
  would silently stop the Supabase keep-alive.
