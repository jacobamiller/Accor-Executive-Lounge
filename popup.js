// popup.js — Rate history viewer with Supabase queries and CSV export
let userId = null;
let activeTab = 'prices';
let allData = [];
let offset = 0;
const PAGE_SIZE = 50;

// Calendar state
let calendarSnapshots = [];
let calHotels = [];
let calSelectedHotel = null;
let calRangeStart = null; // Date: start of 3-month window
let calHotelsLoaded = false;

const PRICE_COLS = [
  { key: 'captured_at', label: 'Date', fmt: v => v ? new Date(v).toLocaleDateString() : '' },
  { key: 'hotel_id', label: 'ID' },
  { key: 'hotel_name', label: 'Hotel' },
  { key: 'city', label: 'City' },
  { key: 'currency', label: 'Cur' },
  { key: 'base_price', label: 'Base', fmt: n => n != null ? Number(n).toFixed(0) : '' },
  { key: 'public_price', label: 'Public', fmt: n => n != null ? Number(n).toFixed(0) : '' },
  { key: 'tax_amount', label: 'Tax', fmt: n => n != null ? Number(n).toFixed(0) : '' },
  { key: 'total_price', label: 'Total', fmt: n => n != null ? Number(n).toFixed(0) : '' },
  { key: 'per_night', label: '/Night', fmt: n => n != null ? Number(n).toFixed(0) : '' },
  { key: 'nights', label: 'Nts' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'has_lounge', label: 'Lounge', fmt: v => v ? 'Yes' : '' },
  { key: 'has_breakfast', label: 'Bfast', fmt: v => v ? 'Yes' : '' },
  { key: 'promo_text', label: 'Promo' },
];

const RATE_COLS = [
  { key: 'captured_at', label: 'Date', fmt: v => v ? new Date(v).toLocaleDateString() : '' },
  { key: 'hotel_id', label: 'ID' },
  { key: 'currency', label: 'Cur' },
  { key: 'nights', label: 'Nts' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'checkout', label: 'Check-out' },
  { key: 'num_rates', label: 'Rates' },
  { key: '_expand', label: 'Details' },
];

// ==================== INIT ====================
async function init() {
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = 'v' + manifest.version;
  const result = await chrome.storage.local.get('accorUserId');
  userId = result.accorUserId;
  if (!userId) {
    showStatus('No data yet. Browse some hotels on all.accor.com first.');
    return;
  }
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });
  document.getElementById('btnExport').addEventListener('click', exportCSV);
  document.getElementById('btnLoadMore').addEventListener('click', loadMore);
  document.getElementById('filterHotel').addEventListener('input', debounce(reload, 400));
  document.getElementById('filterFrom').addEventListener('change', reload);
  document.getElementById('filterTo').addEventListener('change', reload);
  // Calendar controls
  document.getElementById('calHotel').addEventListener('change', function() {
    calSelectedHotel = this.value;
    filterAndRender();
  });
  document.getElementById('calPrev').addEventListener('click', () => {
    calRangeStart.setMonth(calRangeStart.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calRangeStart.setMonth(calRangeStart.getMonth() + 1);
    renderCalendar();
  });
  await loadData();
}

function debounce(fn, ms) {
  let timer;
  return () => { clearTimeout(timer); timer = setTimeout(fn, ms); };
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  if (tab === 'calendar') {
    document.querySelector('.table-wrap').style.display = 'none';
    document.querySelector('.filters').style.display = 'none';
    document.getElementById('calendarWrap').style.display = 'block';
    loadCalendar();
  } else {
    document.querySelector('.table-wrap').style.display = '';
    document.querySelector('.filters').style.display = '';
    document.getElementById('calendarWrap').style.display = 'none';
    reload();
  }
}

function reload() { offset = 0; allData = []; loadData(); }

// ==================== SUPABASE QUERY ====================
function getFilters() {
  const hotel = document.getElementById('filterHotel').value.trim();
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  return { hotel, from, to };
}

async function querySupabase(table, append) {
  const f = getFilters();
  let url = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`;
  url += '&order=captured_at.desc';
  url += `&limit=${PAGE_SIZE}&offset=${offset}`;
  if (f.hotel) {
    url += `&or=(hotel_id.ilike.*${encodeURIComponent(f.hotel)}*,hotel_name.ilike.*${encodeURIComponent(f.hotel)}*)`;
  }
  if (f.from) url += `&checkin=gte.${f.from}`;
  if (f.to) url += `&checkin=lte.${f.to}`;

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'count=exact'
    }
  });
  if (!res.ok) throw new Error('Query failed: ' + res.status);
  const range = res.headers.get('content-range') || '';
  const total = range.includes('/') ? range.split('/')[1] : '?';
  const rows = await res.json();
  return { rows, total: parseInt(total) || 0 };
}

// ==================== LOAD & RENDER ====================
async function loadData() {
  showStatus('Loading...');
  try {
    const table = activeTab === 'prices' ? 'price_snapshots' : 'rate_snapshots';
    const { rows, total } = await querySupabase(table, offset > 0);
    if (offset === 0) allData = rows; else allData = allData.concat(rows);
    if (allData.length === 0) {
      showStatus('No data found. Try different filters or browse more hotels.');
      return;
    }
    renderTable();
    showStatus(`Showing ${allData.length} of ${total}`);
    document.getElementById('btnLoadMore').style.display = allData.length < total ? 'block' : 'none';
  } catch (e) {
    showStatus('Error: ' + e.message, true);
  }
}

function loadMore() { offset += PAGE_SIZE; loadData(); }

function renderTable() {
  const cols = activeTab === 'prices' ? PRICE_COLS : RATE_COLS;
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tableBody');
  thead.innerHTML = '<tr>' + cols.map(c => `<th>${c.label}</th>`).join('') + '</tr>';
  tbody.innerHTML = '';
  for (const row of allData) {
    const tr = document.createElement('tr');
    for (const col of cols) {
      const td = document.createElement('td');
      if (col.key === '_expand') {
        if (row.rates && row.rates.length > 0) {
          const btn = document.createElement('span');
          btn.className = 'expand-btn';
          btn.textContent = 'Show ' + row.rates.length + ' rates';
          btn.addEventListener('click', () => toggleRateDetail(tr, row));
          td.appendChild(btn);
        }
      } else if (col.key === 'has_lounge' && row[col.key]) {
        td.className = 'lounge-yes';
        td.textContent = 'Yes';
      } else if (col.key === 'has_breakfast' && row[col.key]) {
        td.className = 'breakfast-yes';
        td.textContent = 'Yes';
      } else {
        const val = row[col.key];
        td.textContent = col.fmt ? col.fmt(val) : (val != null ? val : '');
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  document.getElementById('dataTable').style.display = 'table';
}

function toggleRateDetail(tr, row) {
  const existing = tr.nextElementSibling;
  if (existing && existing.classList.contains('rate-detail-row')) {
    existing.remove();
    return;
  }
  const detailRow = document.createElement('tr');
  detailRow.className = 'rate-detail-row';
  const td = document.createElement('td');
  td.colSpan = RATE_COLS.length;
  td.className = 'rates-detail';
  let html = '<table style="width:100%;font-size:10px;margin:4px 0"><tr><th>Room</th><th>Rate</th><th>Type</th><th>Member</th><th>Public</th><th>Tax</th><th>Total</th><th>Meal</th><th>Cancel</th></tr>';
  for (const r of row.rates) {
    html += `<tr><td>${r.room||''}</td><td>${r.rate||''}</td><td>${r.type||''}</td><td>${r.member!=null?r.member:''}</td><td>${r.public!=null?r.public:''}</td><td>${r.tax!=null?r.tax:''}</td><td>${r.total!=null?r.total:''}</td><td>${r.meal||''}</td><td>${r.cancel||''}</td></tr>`;
  }
  html += '</table>';
  td.innerHTML = html;
  detailRow.appendChild(td);
  tr.after(detailRow);
}

// ==================== CSV EXPORT ====================
async function exportCSV() {
  showStatus('Exporting...');
  try {
    const table = activeTab === 'prices' ? 'price_snapshots' : 'rate_snapshots';
    const f = getFilters();
    let url = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}&order=captured_at.desc&limit=5000`;
    if (f.hotel) url += `&or=(hotel_id.ilike.*${encodeURIComponent(f.hotel)}*,hotel_name.ilike.*${encodeURIComponent(f.hotel)}*)`;
    if (f.from) url += `&checkin=gte.${f.from}`;
    if (f.to) url += `&checkin=lte.${f.to}`;

    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) throw new Error('Export failed: ' + res.status);
    const rows = await res.json();
    if (rows.length === 0) { showStatus('No data to export.'); return; }

    let csv;
    if (activeTab === 'prices') {
      const keys = ['captured_at','hotel_id','hotel_name','city','currency','base_price','public_price','tax_amount','total_price','per_night','nights','checkin','checkout','has_lounge','has_breakfast','promo_text'];
      csv = csvFromRows(rows, keys);
    } else {
      // Flatten rates JSONB into individual rows
      const flatRows = [];
      for (const row of rows) {
        if (row.rates && row.rates.length > 0) {
          for (const r of row.rates) {
            flatRows.push({
              captured_at: row.captured_at, hotel_id: row.hotel_id, currency: row.currency,
              nights: row.nights, checkin: row.checkin, checkout: row.checkout,
              room: r.room, rate: r.rate, type: r.type, member: r.member,
              public: r.public, tax: r.tax, total: r.total, meal: r.meal, cancel: r.cancel
            });
          }
        }
      }
      const keys = ['captured_at','hotel_id','currency','nights','checkin','checkout','room','rate','type','member','public','tax','total','meal','cancel'];
      csv = csvFromRows(flatRows, keys);
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url2 = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url2;
    a.download = `accor_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url2);
    showStatus(`Exported ${rows.length} records.`);
  } catch (e) {
    showStatus('Export error: ' + e.message, true);
  }
}

function csvFromRows(rows, keys) {
  const escape = v => {
    if (v == null) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return keys.join(',') + '\n' + rows.map(r => keys.map(k => escape(r[k])).join(',')).join('\n');
}

// ==================== CALENDAR ====================
function initCalRange() {
  if (!calRangeStart) {
    calRangeStart = new Date();
    calRangeStart.setMonth(calRangeStart.getMonth() - 1);
    calRangeStart.setDate(1);
  }
}

let allCalSnapshots = []; // full cache of all calendar snapshots

async function loadCalendar() {
  initCalRange();
  if (calHotelsLoaded) { filterAndRender(); return; }
  const calSt = document.getElementById('calStatus');
  if (calSt) calSt.textContent = 'Loading calendar data...';
  try {
    // Single query — fetch all snapshots at once (typical volume is <200 rows)
    let url = `${SUPABASE_URL}/rest/v1/calendar_snapshots?user_id=eq.${userId}&order=captured_at.desc&limit=500`;
    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) throw new Error('calendar_snapshots query: ' + res.status + ' ' + (await res.text().catch(() => '')));
    allCalSnapshots = await res.json();
    if (allCalSnapshots.length === 0) {
      if (calSt) calSt.textContent = 'No calendar data yet. Browse hotel search pages on all.accor.com to capture prices.';
      return;
    }
    // Build hotel dropdown from data
    const hotelMap = new Map();
    for (const r of allCalSnapshots) {
      if (r.hotel_id && !hotelMap.has(r.hotel_id)) {
        hotelMap.set(r.hotel_id, r.hotel_name || r.hotel_id);
      }
    }
    calHotels = Array.from(hotelMap, ([id, name]) => ({ id, name }));
    const select = document.getElementById('calHotel');
    select.innerHTML = calHotels.map(h => `<option value="${h.id}">${h.name} (${h.id})</option>`).join('');
    calSelectedHotel = calHotels[0].id;
    calHotelsLoaded = true;
    filterAndRender();
  } catch (e) {
    const calStErr = document.getElementById('calStatus');
    if (calStErr) { calStErr.textContent = 'Calendar error: ' + e.message; calStErr.style.color = '#e63946'; }
  }
}

function filterAndRender() {
  calendarSnapshots = allCalSnapshots.filter(s => s.hotel_id === calSelectedHotel);
  let totalEntries = 0;
  let lastUpdate = null;
  for (const s of calendarSnapshots) {
    if (Array.isArray(s.calendar_data)) totalEntries += s.calendar_data.length;
    if (s.captured_at && (!lastUpdate || s.captured_at > lastUpdate)) lastUpdate = s.captured_at;
  }
  const ts = lastUpdate ? new Date(lastUpdate).toLocaleString() : '—';
  const calSt = document.getElementById('calStatus');
  if (calSt) calSt.textContent = calendarSnapshots.length + ' snapshots, ' + totalEntries + ' entries · Last update: ' + ts;
  renderCalendar();
}

async function loadCalendarData() {
  calSelectedHotel = document.getElementById('calHotel').value;
  filterAndRender();
}

function calRangeEnd() {
  const end = new Date(calRangeStart);
  end.setMonth(end.getMonth() + 4);
  end.setDate(0);
  return end;
}

function priceColor(normalized) {
  // 0 = cheapest (green hue 120), 1 = most expensive (red hue 0)
  const hue = Math.round(120 - normalized * 120);
  return `hsl(${hue},70%,45%)`;
}

function extractPerNight(entry) {
  let total = null;
  if (entry.offer && entry.offer.pricing) {
    const p = entry.offer.pricing;
    if (p.main && p.main.formattedAmount) {
      total = parseFloat(p.main.formattedAmount.replace(/[^0-9.]/g, ''));
    } else if (p.totalAmount != null) {
      total = parseFloat(p.totalAmount);
    }
  }
  if (total == null || total <= 0) return null;
  let nights = 1;
  if (entry.offer && entry.offer.lengthOfStay && entry.offer.lengthOfStay.value) {
    nights = parseInt(entry.offer.lengthOfStay.value) || 1;
  }
  return Math.round((total / nights) * 100) / 100;
}

function renderCalendar() {
  const container = document.getElementById('calHeatmap');
  container.innerHTML = '';
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const s = calRangeStart;
  const endDate = calRangeEnd();
  document.getElementById('calMonthLabel').textContent =
    MN[s.getMonth()] + ' \u2013 ' + MN[endDate.getMonth()] + ' ' + endDate.getFullYear();

  if (calendarSnapshots.length === 0) return;

  // Merge calendar_data — keyed by (date, nights), latest snapshot wins
  const sorted = calendarSnapshots.slice().sort((a, b) =>
    new Date(a.captured_at) - new Date(b.captured_at));
  // dateNightsMap: "YYYY-MM-DD|N" -> { perNight, entry }
  const dateNightsMap = new Map();
  const nightsSet = new Set();
  for (const snap of sorted) {
    if (!Array.isArray(snap.calendar_data)) continue;
    for (const entry of snap.calendar_data) {
      if (!entry || !entry.date) continue;
      let nights = 1;
      if (entry.offer && entry.offer.lengthOfStay && entry.offer.lengthOfStay.value) {
        nights = parseInt(entry.offer.lengthOfStay.value) || 1;
      }
      const perNight = extractPerNight(entry);
      if (perNight != null) {
        const key = entry.date + '|' + nights;
        const isBestPrice = !!(entry.bestRate && entry.bestRate.label);
        dateNightsMap.set(key, { perNight, nights, date: entry.date, isBestPrice });
        nightsSet.add(nights);
      }
    }
  }

  // Build date columns across 3 months
  const DOW = ['U','M','T','W','R','F','S'];
  const dateCols = [];
  for (let mi = 0; mi < 4; mi++) {
    const mDate = new Date(s.getFullYear(), s.getMonth() + mi, 1);
    const year = mDate.getFullYear();
    const month = mDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(year, month, d).getDay(); // 0=Sun
      dateCols.push({ day: d, monthIdx: mi, monthLabel: MN[month], dateStr, dow });
    }
  }

  const nightsList = Array.from(nightsSet).sort((a, b) => a - b);
  if (nightsList.length === 0) {
    container.textContent = 'No pricing data in this range.';
    return;
  }

  // Find global min/max per-night price for color scale
  let minP = Infinity, maxP = 0;
  for (const v of dateNightsMap.values()) {
    if (v.perNight < minP) minP = v.perNight;
    if (v.perNight > maxP) maxP = v.perNight;
  }
  const range = maxP - minP || 1;

  // === Build DOM ===
  // Day-of-week header row
  const dowRow = document.createElement('div');
  dowRow.className = 'cal-hm-row';
  const dowLabel = document.createElement('span');
  dowLabel.className = 'cal-hm-label';
  dowRow.appendChild(dowLabel);
  const dowCells = document.createElement('div');
  dowCells.className = 'cal-hm-cells';
  let lastMiDow = -1;
  for (const col of dateCols) {
    if (col.monthIdx !== lastMiDow && lastMiDow !== -1) {
      const sep = document.createElement('span');
      sep.className = 'cal-hm-sep';
      dowCells.appendChild(sep);
    }
    lastMiDow = col.monthIdx;
    const hdr = document.createElement('span');
    hdr.className = 'cal-hm-hdr' + (col.dow === 0 || col.dow === 6 ? ' weekend' : '');
    hdr.textContent = DOW[col.dow];
    dowCells.appendChild(hdr);
  }
  dowRow.appendChild(dowCells);
  container.appendChild(dowRow);

  // Date number header row
  const hdrRow = document.createElement('div');
  hdrRow.className = 'cal-hm-row';
  const hdrLabel = document.createElement('span');
  hdrLabel.className = 'cal-hm-label';
  hdrRow.appendChild(hdrLabel);
  const hdrCells = document.createElement('div');
  hdrCells.className = 'cal-hm-cells';
  let lastMi = -1;
  for (const col of dateCols) {
    if (col.monthIdx !== lastMi && lastMi !== -1) {
      const sep = document.createElement('span');
      sep.className = 'cal-hm-sep';
      hdrCells.appendChild(sep);
    }
    lastMi = col.monthIdx;
    const hdr = document.createElement('span');
    hdr.className = 'cal-hm-hdr' + (col.day === 1 ? ' month-start' : '');
    hdr.textContent = col.day === 1 ? col.monthLabel : col.day;
    hdrCells.appendChild(hdr);
  }
  hdrRow.appendChild(hdrCells);
  container.appendChild(hdrRow);

  // Data rows: one per nights value
  for (const n of nightsList) {
    const row = document.createElement('div');
    row.className = 'cal-hm-row';
    const label = document.createElement('span');
    label.className = 'cal-hm-label';
    label.textContent = n + 'N';
    row.appendChild(label);
    const cells = document.createElement('div');
    cells.className = 'cal-hm-cells';
    let lastMi2 = -1;
    for (const col of dateCols) {
      if (col.monthIdx !== lastMi2 && lastMi2 !== -1) {
        const sep = document.createElement('span');
        sep.className = 'cal-hm-sep';
        cells.appendChild(sep);
      }
      lastMi2 = col.monthIdx;
      const cell = document.createElement('span');
      cell.className = 'cal-hm-cell';
      const v = dateNightsMap.get(col.dateStr + '|' + n);
      if (v) {
        const norm = (v.perNight - minP) / range;
        cell.style.background = priceColor(norm);
        if (v.isBestPrice) {
          cell.classList.add('cheapest');
        }
        const tip = document.createElement('span');
        tip.className = 'cal-hm-tip';
        tip.textContent = Math.round(v.perNight) + '/nt \u00d7' + n + (v.isBestPrice ? ' \u2605' : '');
        cell.appendChild(tip);
      } else {
        cell.classList.add('no-data');
      }
      cells.appendChild(cell);
    }
    row.appendChild(cells);
    container.appendChild(row);
  }
}

// ==================== HELPERS ====================
function showStatus(msg, isError) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (isError ? ' error' : '');
}

init();
