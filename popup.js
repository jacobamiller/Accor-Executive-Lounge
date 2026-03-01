// popup.js — Rate history viewer with Supabase queries and CSV export
let userId = null;
let activeTab = 'prices';
let allData = [];
let offset = 0;
const PAGE_SIZE = 50;

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
  await loadData();
}

function debounce(fn, ms) {
  let timer;
  return () => { clearTimeout(timer); timer = setTimeout(fn, ms); };
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  reload();
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

// ==================== HELPERS ====================
function showStatus(msg, isError) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (isError ? ' error' : '');
}

init();
