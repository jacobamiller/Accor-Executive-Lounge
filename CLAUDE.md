# Accor Executive Lounge — Chrome Extension

Highlights Accor hotels that have an Executive Lounge or complimentary breakfast.
Hotel data is refreshed monthly from all.accor.com.

## If the user just says "update"

When the request is bare — **"update"**, **"do the update"**, **"monthly update"**,
**"time for the update"** — it means the monthly hotel data refresh. Don't guess the
scope. Ask once:

> Do you want the full monthly update?
>
> > Do the monthly update per MONTHLY_UPDATE_GUIDE.md — full scope including the
> > Supabase refresh and a commit. Make the judgment calls yourself; only stop if
> > you're genuinely blocked.
>
> Or something narrower — data files and the diff only?

On "yes", follow `MONTHLY_UPDATE_GUIDE.md` end to end and don't check in again —
report at the finish. The two readings differ a lot in blast radius: full scope
writes to the production Supabase database, narrow scope only touches local files.

Read `MONTHLY_UPDATE_GUIDE.md` before starting. Its **Before You Start** section
lists the two setup steps (Supabase sign-in, accept-edits mode) that otherwise
strand a run partway through.

## Open follow-ups

See `TODO.md`. Read it when picking work back up — the top item is that two
properties are invisible to the extension because they appear on neither of
Accor's benefit lists, which the monthly extraction does not currently catch.

## Things that have bitten us

- **The Accor lounge page renders empty for several seconds.** `.js-table-1-tbody`
  has 0 rows and all three dropdowns have 0 options until the data populates. Wait
  and re-check before concluding the page changed shape — extracting too early
  yields a valid-looking file with zero hotels.

- **Supabase deletes fail silently.** The publishable key in `config.js` has SELECT
  and INSERT under RLS but not DELETE. A forbidden DELETE still returns HTTP 200
  having removed nothing, so importing without truncating first *appends* a second
  copy of every row. `scripts/import-hotels.js` now re-counts and aborts before
  inserting, but the tables must be truncated from the SQL editor first.

- **The extension prefers Supabase over the hardcoded Sets.** `background.js` loads
  `lounge_hotels` / `breakfast_hotels` at runtime; the Sets in `content.js` are only
  a fallback. An update that stops at `content.js` never reaches users.

- **Fuzzy name matching can assign one hotel ID to two different hotels.** Accor's
  page and API disagree on spelling ("Conventions Center" vs "Convention Centre",
  accented vs unaccented Mövenpick). After extracting, check for duplicate IDs and
  confirm each pair is genuinely the same hotel rather than a mis-match.

- **Oceania breakfast hotels have never been captured.** `q=oceania` returns 404
  from the catalog API, so Australian and NZ properties are absent from every
  breakfast dataset to date. Not a regression — verify against a prior month before
  treating it as one.

## Layout

- `content.js` — the extension; hardcoded ID Sets near the top are fallbacks
- `background.js` — syncs hotel IDs from Supabase into chrome.storage
- `scripts/import-hotels.js` — loads `data/*/YYYY-MM.json` into Supabase
- `data/lounge/`, `data/breakfast/` — monthly archives, reference only
- `wiki/` — architecture docs
