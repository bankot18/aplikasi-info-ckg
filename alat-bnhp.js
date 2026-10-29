// ==========================================================================
// MODUL INVENTARIS & LOGISTIK ALAT & BNHP CKG
// Puskesmas Banjaran Kota - Aplikasi CKG
// ==========================================================================

const ALAT_BNHP_STORAGE_KEY = 'CKG_ALAT_BNHP_STORAGE';

// Default Master Data Bawaan Sistem CKG
const DEFAULT_ALAT_BNHP_ITEMS = [
  { id: 'itm-01', kode: 'ALK-01', nama: 'Tensimeter Digital Manset Dewasa', kategori: 'Alat', satuan: 'Unit', stok: 8, stok_min: 2, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Merk Omron HEM-7120. Untuk skrining hipertensi.' },
  { id: 'itm-02', kode: 'ALK-02', nama: 'POCT Multi-Monitoring Glukometer Kit', kategori: 'Alat', satuan: 'Unit', stok: 6, stok_min: 2, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Alat cek gula, kolesterol, asam urat.' },
  { id: 'itm-03', kode: 'ALK-03', nama: 'Timbangan Badan Digital 180kg', kategori: 'Alat', satuan: 'Unit', stok: 5, stok_min: 2, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Sensitivitas 0.1 kg.' },
  { id: 'itm-04', kode: 'ALK-04', nama: 'Microtoise / Stadiometer 2M', kategori: 'Alat', satuan: 'Unit', stok: 6, stok_min: 2, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Pengukur tinggi badan presisi.' },
  { id: 'itm-05', kode: 'ALK-05', nama: 'Pita Lingkar Perut Dewasa', kategori: 'Alat', satuan: 'Pcs', stok: 12, stok_min: 4, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Skrining obesitas sentral 150cm.' },
  { id: 'itm-06', kode: 'ALK-06', nama: 'Hemoglobin Meter (Hb POCT)', kategori: 'Alat', satuan: 'Unit', stok: 4, stok_min: 1, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Skrining anemia rematri & ibu hamil.' },
  { id: 'itm-07', kode: 'ALK-07', nama: 'Snellen Chart / Tumbling E', kategori: 'Alat', satuan: 'Lembar', stok: 6, stok_min: 2, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Pemeriksaan visus tajam penglihatan anak sekolah.' },
  { id: 'itm-08', kode: 'ALK-08', nama: 'Penlight Medis LED', kategori: 'Alat', satuan: 'Unit', stok: 5, stok_min: 2, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Pemeriksaan rongga mulut, gigi & telinga.' },
  { id: 'itm-09', kode: 'ALK-09', nama: 'Garpu Tala 512 Hz', kategori: 'Alat', satuan: 'Unit', stok: 3, stok_min: 1, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Tes pendengaran (Rinne & Weber).' },
  { id: 'itm-10', kode: 'BNH-01', nama: 'Strip Tes Gula Darah (Blood Glucose)', kategori: 'BNHP', satuan: 'Strip', stok: 450, stok_min: 100, batch_no: 'GL-26A', expired_date: '2027-08-31', kondisi: 'Baik', catatan: 'Strip POCT Glucose CKG.' },
  { id: 'itm-11', kode: 'BNH-02', nama: 'Strip Tes Kolesterol Total', kategori: 'BNHP', satuan: 'Strip', stok: 280, stok_min: 50, batch_no: 'CH-26B', expired_date: '2027-06-30', kondisi: 'Baik', catatan: 'Strip POCT Cholesterol CKG.' },
  { id: 'itm-12', kode: 'BNH-03', nama: 'Strip Tes Asam Urat', kategori: 'BNHP', satuan: 'Strip', stok: 200, stok_min: 50, batch_no: 'UA-26C', expired_date: '2027-07-31', kondisi: 'Baik', catatan: 'Strip POCT Uric Acid CKG.' },
  { id: 'itm-13', kode: 'BNH-04', nama: 'Strip Tes Hemoglobin (Hb)', kategori: 'BNHP', satuan: 'Strip', stok: 180, stok_min: 40, batch_no: 'HB-26D', expired_date: '2027-05-31', kondisi: 'Baik', catatan: 'Pemeriksaan Hb remaja putri CKG Sekolah.' },
  { id: 'itm-14', kode: 'BNH-05', nama: 'Blood Lancet Steril 28G', kategori: 'BNHP', satuan: 'Pcs', stok: 800, stok_min: 200, batch_no: 'LC-2601', expired_date: '2028-12-31', kondisi: 'Baik', catatan: 'Jarum tusuk steril sekali pakai.' },
  { id: 'itm-15', kode: 'BNH-06', nama: 'Alkohol Swab 70% Steril', kategori: 'BNHP', satuan: 'Pcs', stok: 750, stok_min: 200, batch_no: 'AS-2602', expired_date: '2028-10-31', kondisi: 'Baik', catatan: 'Kapas alkohol desinfeksi pra-injeksi.' },
  { id: 'itm-16', kode: 'BNH-07', nama: 'Safety Box Limbah Medis B3 5L', kategori: 'BNHP', satuan: 'Pcs', stok: 15, stok_min: 3, batch_no: '-', expired_date: '-', kondisi: 'Baik', catatan: 'Wadah limbah jarum & lanset bekas.' },
  { id: 'itm-17', kode: 'BNH-08', nama: 'Sarung Tangan Medis (Handscoon Latex)', kategori: 'BNHP', satuan: 'Pasang', stok: 300, stok_min: 50, batch_no: 'HS-2603', expired_date: '2028-09-30', kondisi: 'Baik', catatan: 'Ukuran M/L non-powdered.' },
  { id: 'itm-18', kode: 'BNH-09', nama: 'Masker Medis 3-Ply Bedah', kategori: 'BNHP', satuan: 'Pcs', stok: 250, stok_min: 50, batch_no: 'MS-2604', expired_date: '2028-12-31', kondisi: 'Baik', catatan: 'Masker pelindung pernapasan petugas.' },
  { id: 'itm-19', kode: 'BNH-10', nama: 'Baterai Alkaline AA / AAA', kategori: 'BNHP', satuan: 'Pcs', stok: 24, stok_min: 8, batch_no: 'BT-2605', expired_date: '2029-01-01', kondisi: 'Baik', catatan: 'Daya tensimeter & timbangan digital.' }
];

// In-Memory Global State
let stateAlatBnhp = {
  items: [],
  pemakaian: [],
  peminjaman: [],
  currentTab: 'stok',
  quickFilter: 'all',
  activePeminjamanFilter: ''
};

// ==========================================================================
// 1. INITIALIZATION & DATA SYNC
// ==========================================================================

function loadAlatBnhpFromLocal() {
  try {
    const raw = localStorage.getItem(ALAT_BNHP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      stateAlatBnhp.items = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : [...DEFAULT_ALAT_BNHP_ITEMS];
      stateAlatBnhp.pemakaian = Array.isArray(parsed.pemakaian) ? parsed.pemakaian : [];
      stateAlatBnhp.peminjaman = Array.isArray(parsed.peminjaman) ? parsed.peminjaman : [];
      return true;
    }
  } catch (err) {
    console.warn('Gagal membaca cache lokal Alat & BNHP:', err);
  }
  stateAlatBnhp.items = [...DEFAULT_ALAT_BNHP_ITEMS];
  stateAlatBnhp.pemakaian = [];
  stateAlatBnhp.peminjaman = [];
  saveAlatBnhpToLocal();
  return false;
}

function saveAlatBnhpToLocal() {
  try {
    localStorage.setItem(ALAT_BNHP_STORAGE_KEY, JSON.stringify({
      items: stateAlatBnhp.items,
      pemakaian: stateAlatBnhp.pemakaian,
      peminjaman: stateAlatBnhp.peminjaman,
      updated_at: new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Gagal menyimpan cache lokal Alat & BNHP:', err);
  }
}

async function fetchAlatBnhpFromCloud(showNotification = false) {
  loadAlatBnhpFromLocal();
  renderAlatBnhpView();

  try {
    const res = await fetch('/api/alat-bnhp', {
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data.items) && json.data.items.length > 0) {
          stateAlatBnhp.items = json.data.items;
        } else {
          // Sync default seed to cloud if remote is empty
          syncAlatBnhpToCloud('seed', stateAlatBnhp.items);
        }

        if (Array.isArray(json.data.pemakaian)) {
          stateAlatBnhp.pemakaian = json.data.pemakaian;
        }
        if (Array.isArray(json.data.peminjaman)) {
          stateAlatBnhp.peminjaman = json.data.peminjaman;
        }

        saveAlatBnhpToLocal();
        renderAlatBnhpView();

        if (showNotification) {
          if (typeof showToast === 'function') {
            showToast('Data Alat & BNHP berhasil disinkronkan dengan Cloud.', 'info');
          }
        }
      }
    }
  } catch (err) {
    console.info('Menggunakan penyimpanan offline lokal Alat & BNHP:', err.message);
    if (showNotification && typeof showToast === 'function') {
      showToast('Data dimuat dari penyimpanan lokal perangkat.', 'secondary');
    }
  }
}

async function syncAlatBnhpToCloud(action, payload) {
  saveAlatBnhpToLocal();
  try {
    await fetch('/api/alat-bnhp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: action,
        payload: payload,
        items: stateAlatBnhp.items,
        pemakaian: stateAlatBnhp.pemakaian,
        peminjaman: stateAlatBnhp.peminjaman
      })
    });
  } catch (err) {
    console.warn('Sync /api/alat-bnhp offline fallback:', err);
  }
}

function initAlatBnhpView() {
  fetchAlatBnhpFromCloud(false);
}

// ==========================================================================
// 2. RENDERING LOGIC & TAB SWITCHING
// ==========================================================================

function switchAlatBnhpTab(tabName, filterStatus = null) {
  stateAlatBnhp.currentTab = tabName;
  stateAlatBnhp.activePeminjamanFilter = filterStatus || '';

  const tabs = [
    { name: 'stok', btn: 'btnTabAlatBnhpStok', view: 'subviewAlatBnhpStok' },
    { name: 'pemakaian', btn: 'btnTabAlatBnhpPemakaian', view: 'subviewAlatBnhpPemakaian' },
    { name: 'peminjaman', btn: 'btnTabAlatBnhpPeminjaman', view: 'subviewAlatBnhpPeminjaman' },
    { name: 'rekap', btn: 'btnTabAlatBnhpRekap', view: 'subviewAlatBnhpRekap' }
  ];

  tabs.forEach(t => {
    const btnEl = document.getElementById(t.btn);
    const viewEl = document.getElementById(t.view);

    const isActive = t.name === tabName;
    if (btnEl) btnEl.classList.toggle('active-purple', isActive);
    if (viewEl) viewEl.style.display = isActive ? 'block' : 'none';
  });

  if (tabName === 'stok') renderAlatBnhpTable();
  else if (tabName === 'pemakaian') renderAlatBnhpPemakaianTable();
  else if (tabName === 'peminjaman') {
    if (filterStatus) {
      const sel = document.getElementById('filterAlatBnhpPeminjamanStatus');
      if (sel) sel.value = filterStatus;
    }
    renderAlatBnhpPeminjamanTable();
  } else if (tabName === 'rekap') renderAlatBnhpRekapTable();
}

function setAlatBnhpQuickFilter(type) {
  stateAlatBnhp.quickFilter = type;

  ['cardFilterAlatBnhpAll', 'cardFilterAlatBnhpMenipis', 'cardFilterAlatBnhpExpired'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active-filter');
  });

  const activeId = type === 'all' ? 'cardFilterAlatBnhpAll' : (type === 'menipis' ? 'cardFilterAlatBnhpMenipis' : 'cardFilterAlatBnhpExpired');
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add('active-filter');

  const statusSelect = document.getElementById('filterAlatBnhpStatus');
  if (statusSelect) {
    if (type === 'menipis') statusSelect.value = 'menipis';
    else if (type === 'expired') statusSelect.value = 'expired';
    else statusSelect.value = '';
  }

  switchAlatBnhpTab('stok');
}

function isExpiredWithinDays(dateStr, days = 60) {
  if (!dateStr || dateStr === '-') return false;
  const exp = new Date(dateStr);
  if (isNaN(exp.getTime())) return false;
  const now = new Date();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

function renderAlatBnhpView() {
  updateAlatBnhpMetrics();
  switchAlatBnhpTab(stateAlatBnhp.currentTab);
}

function updateAlatBnhpMetrics() {
  const items = stateAlatBnhp.items || [];
  const pemakaian = stateAlatBnhp.pemakaian || [];
  const peminjaman = stateAlatBnhp.peminjaman || [];

  const totalItem = items.length;
  const menipisCount = items.filter(it => Number(it.stok || 0) <= Number(it.stok_min || 0)).length;
  const expiredCount = items.filter(it => it.kategori === 'BNHP' && isExpiredWithinDays(it.expired_date, 60)).length;
  const dipinjamCount = peminjaman.filter(p => p.status === 'Dipinjam').length;

  const elTotal = document.getElementById('metricAlatBnhpTotal');
  const elMenipis = document.getElementById('metricAlatBnhpMenipis');
  const elExpired = document.getElementById('metricAlatBnhpExpired');
  const elDipinjam = document.getElementById('metricAlatBnhpDipinjam');

  if (elTotal) elTotal.innerText = totalItem.toLocaleString('id-ID');
  if (elMenipis) elMenipis.innerText = menipisCount.toLocaleString('id-ID');
  if (elExpired) elExpired.innerText = expiredCount.toLocaleString('id-ID');
  if (elDipinjam) elDipinjam.innerText = dipinjamCount.toLocaleString('id-ID');

  const bStok = document.getElementById('badgeCountAlatBnhpStok');
  const bPemakaian = document.getElementById('badgeCountAlatBnhpPemakaian');
  const bPeminjaman = document.getElementById('badgeCountAlatBnhpPeminjaman');

  if (bStok) bStok.innerText = totalItem;
  if (bPemakaian) bPemakaian.innerText = pemakaian.length;
  if (bPeminjaman) bPeminjaman.innerText = dipinjamCount;
}

// ==========================================================================
// 3. TAB 1: STOK & INVENTARIS
// ==========================================================================

function renderAlatBnhpTable() {
  const tbody = document.getElementById('tbodyAlatBnhpStok');
  if (!tbody) return;

  const searchQuery = (document.getElementById('searchAlatBnhp')?.value || '').toLowerCase().trim();
  const filterKategori = document.getElementById('filterAlatBnhpKategori')?.value || '';
  const filterStatus = document.getElementById('filterAlatBnhpStatus')?.value || '';

  let filtered = (stateAlatBnhp.items || []).filter(item => {
    const matchSearch = !searchQuery ||
      (item.kode || '').toLowerCase().includes(searchQuery) ||
      (item.nama || '').toLowerCase().includes(searchQuery) ||
      (item.catatan || '').toLowerCase().includes(searchQuery);

    const matchKat = !filterKategori || item.kategori === filterKategori;

    let matchStat = true;
    const stok = Number(item.stok || 0);
    const stokMin = Number(item.stok_min || 0);

    if (filterStatus === 'aman') {
      matchStat = stok > stokMin;
    } else if (filterStatus === 'menipis') {
      matchStat = stok <= stokMin && stok > 0;
    } else if (filterStatus === 'habis') {
      matchStat = stok === 0;
    } else if (filterStatus === 'expired') {
      matchStat = item.kategori === 'BNHP' && isExpiredWithinDays(item.expired_date, 60);
    }

    return matchSearch && matchKat && matchStat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="bi bi-inbox" style="font-size: 32px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
          Tidak ada item alat / BNHP yang cocok dengan filter pencarian.
        </td>
      </tr>
    `;
    const summaryEl = document.getElementById('textAlatBnhpSummary');
    if (summaryEl) summaryEl.innerText = `Menampilkan 0 dari ${stateAlatBnhp.items.length} total item`;
    return;
  }

  let html = '';
  filtered.forEach((it, idx) => {
    const stok = Number(it.stok || 0);
    const stokMin = Number(it.stok_min || 0);

    // Badge Stok
    let badgeStokClass = 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;';
    let statusLabel = 'Aman';
    if (stok === 0) {
      badgeStokClass = 'background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;';
      statusLabel = 'Habis';
    } else if (stok <= stokMin) {
      badgeStokClass = 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;';
      statusLabel = 'Menipis';
    }

    // Badge Kategori
    const isAlat = it.kategori === 'Alat';
    const katBadge = isAlat
      ? `<span class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 700; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;"><i class="bi bi-tools"></i> Alkes</span>`
      : `<span class="badge" style="background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; font-weight: 700; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;"><i class="bi bi-box-seam"></i> BNHP</span>`;

    // Kondisi / Expired display
    let kondisiHtml = '';
    if (isAlat) {
      const condColor = it.kondisi === 'Baik' ? '#059669' : (it.kondisi === 'Perlu Kalibrasi' ? '#d97706' : '#dc2626');
      kondisiHtml = `<div style="font-weight: 600; color: ${condColor}; font-size: 12px;"><i class="bi bi-shield-check"></i> ${it.kondisi || 'Baik'}</div>`;
    } else {
      const isExpSoon = isExpiredWithinDays(it.expired_date, 60);
      const expColor = isExpSoon ? '#dc2626; font-weight: 800;' : '#475569;';
      const expWarning = isExpSoon ? '<span style="color: #dc2626; font-size: 10.5px; display: block; font-weight: 700;">⚠ Expired Segera</span>' : '';
      kondisiHtml = `
        <div style="font-size: 12px; color: ${expColor}">
          <i class="bi bi-calendar2-week"></i> ${it.expired_date && it.expired_date !== '-' ? it.expired_date : 'Non-Expired'}
        </div>
        ${it.batch_no && it.batch_no !== '-' ? `<div style="font-size: 11px; color: #64748b;">Batch: ${it.batch_no}</div>` : ''}
        ${expWarning}
      `;
    }

    html += `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td><strong style="color: #1e293b; font-family: monospace; font-size: 12.5px;">${it.kode || '-'}</strong></td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${it.nama}</div>
          ${it.catatan ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">${it.catatan}</div>` : ''}
        </td>
        <td style="text-align: center;">${katBadge}</td>
        <td style="text-align: center; font-weight: 600; color: #475569;">${it.satuan || 'Pcs'}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 13.5px; ${badgeStokClass}">
            ${stok.toLocaleString('id-ID')}
          </span>
          <span style="font-size: 10.5px; color: #64748b; display: block; margin-top: 2px;">${statusLabel}</span>
        </td>
        <td style="text-align: center; font-weight: 600; color: #64748b;">${stokMin.toLocaleString('id-ID')}</td>
        <td>${kondisiHtml}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
            <button class="btn btn-emerald btn-sm" onclick="openQuickRestockModal('${it.id}')" title="Tambah Stok Cepat (+)" style="padding: 4px 8px; font-size: 11.5px;">
              <i class="bi bi-plus-lg"></i>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openTambahItemModal('${it.id}')" title="Edit Item" style="padding: 4px 8px; font-size: 11.5px;">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-danger btn-sm admin-koordinator-only" onclick="hapusItemLogistik('${it.id}')" title="Hapus Item" style="padding: 4px 8px; font-size: 11.5px;">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  const summaryEl = document.getElementById('textAlatBnhpSummary');
  if (summaryEl) summaryEl.innerText = `Menampilkan ${filtered.length} dari ${stateAlatBnhp.items.length} total item`;
}

function resetAlatBnhpFilters() {
  const searchInput = document.getElementById('searchAlatBnhp');
  const katSelect = document.getElementById('filterAlatBnhpKategori');
  const statSelect = document.getElementById('filterAlatBnhpStatus');

  if (searchInput) searchInput.value = '';
  if (katSelect) katSelect.value = '';
  if (statSelect) statSelect.value = '';

  stateAlatBnhp.quickFilter = 'all';
  ['cardFilterAlatBnhpAll', 'cardFilterAlatBnhpMenipis', 'cardFilterAlatBnhpExpired'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active-filter');
  });
  document.getElementById('cardFilterAlatBnhpAll')?.classList.add('active-filter');

  renderAlatBnhpTable();
}

// ==========================================================================
// 4. TAB 2: PEMAKAIAN LAPANGAN
// ==========================================================================

function renderAlatBnhpPemakaianTable() {
  const tbody = document.getElementById('tbodyAlatBnhpPemakaian');
  if (!tbody) return;

  const searchQuery = (document.getElementById('searchAlatBnhpPemakaian')?.value || '').toLowerCase().trim();
  const filterBulan = document.getElementById('filterAlatBnhpPemakaianBulan')?.value || '';

  let list = (stateAlatBnhp.pemakaian || []).filter(p => {
    const matchSearch = !searchQuery ||
      (p.kegiatan || '').toLowerCase().includes(searchQuery) ||
      (p.lokasi_kegiatan || '').toLowerCase().includes(searchQuery) ||
      (p.petugas || '').toLowerCase().includes(searchQuery) ||
      (p.catatan || '').toLowerCase().includes(searchQuery);

    let matchBulan = true;
    if (filterBulan && p.tanggal) {
      const parts = p.tanggal.split('-');
      if (parts.length >= 2) {
        matchBulan = parts[1] === filterBulan;
      }
    }
    return matchSearch && matchBulan;
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="bi bi-clipboard2-x" style="font-size: 32px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
          Belum ada rekaman pemakaian BNHP di lapangan. Klik tombol <strong>Catat Pemakaian Baru</strong> untuk menambah.
        </td>
      </tr>
    `;
    return;
  }

  // Urutkan tanggal terbaru
  list.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));

  let html = '';
  list.forEach((p, idx) => {
    let itemsDetailHtml = '';
    if (Array.isArray(p.items_detail)) {
      itemsDetailHtml = p.items_detail.map(d => {
        const hasBawa = d.bawa !== undefined && d.bawa > 0;
        return `
          <div style="background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1; font-size: 11.5px; padding: 4px 8px; border-radius: 6px; margin: 3px 0; line-height: 1.4;">
            <strong>${d.nama}</strong>: 
            ${hasBawa ? `<span style="color: #64748b; font-size: 11px;">Bawa: <strong>${d.bawa}</strong> | Sisa: <strong style="color: #d97706;">${d.sisa || 0}</strong> ➔ </span>` : ''}
            <span style="color: #059669; font-weight: 800;">Pakai: ${d.qty} ${d.satuan || 'Pcs'}</span>
          </div>
        `;
      }).join('');
    } else {
      itemsDetailHtml = `<span style="color: #64748b; font-size: 12px;">${p.items_json || '-'}</span>`;
    }

    html += `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td><strong style="color: #0369a1; font-size: 12.5px;">${p.tanggal || '-'}</strong></td>
        <td>
          <span class="badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 700; margin-bottom: 3px; display: inline-block;">
            ${p.kegiatan || 'CKG'}
          </span>
          <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${p.lokasi_kegiatan}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: #334155; font-size: 13px;"><i class="bi bi-person-fill" style="color: #059669;"></i> ${p.petugas}</div>
        </td>
        <td>${itemsDetailHtml}</td>
        <td style="text-align: center;">
          <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 12.5px;">
            ${Number(p.jumlah_sasaran || 0).toLocaleString('id-ID')}
          </span>
        </td>
        <td style="font-size: 12px; color: #64748b;">${p.catatan || '-'}</td>
        <td style="text-align: center;">
          <button class="btn btn-danger btn-sm" onclick="hapusPemakaianLogistik('${p.id}')" title="Hapus Rekaman Pemakaian" style="padding: 4px 8px; font-size: 11.5px;">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ==========================================================================
// 5. TAB 3: PEMINJAMAN ALAT MEDIS
// ==========================================================================

function renderAlatBnhpPeminjamanTable() {
  const tbody = document.getElementById('tbodyAlatBnhpPeminjaman');
  if (!tbody) return;

  const searchQuery = (document.getElementById('searchAlatBnhpPeminjaman')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('filterAlatBnhpPeminjamanStatus')?.value || stateAlatBnhp.activePeminjamanFilter || '';

  let list = (stateAlatBnhp.peminjaman || []).filter(p => {
    const matchSearch = !searchQuery ||
      (p.peminjam || '').toLowerCase().includes(searchQuery) ||
      (p.kegiatan || '').toLowerCase().includes(searchQuery) ||
      (p.lokasi || '').toLowerCase().includes(searchQuery) ||
      (p.daftar_alat_text || '').toLowerCase().includes(searchQuery) ||
      (p.catatan || '').toLowerCase().includes(searchQuery);

    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">
          <i class="bi bi-box-arrow-right" style="font-size: 32px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
          Belum ada riwayat peminjaman alat medis. Klik tombol <strong>Form Peminjaman Alat</strong> untuk mencatat.
        </td>
      </tr>
    `;
    return;
  }

  // Urutkan tanggal terbaru
  list.sort((a, b) => new Date(b.tanggal_pinjam || 0) - new Date(a.tanggal_pinjam || 0));

  let html = '';
  list.forEach((p, idx) => {
    const isDipinjam = p.status === 'Dipinjam';
    const statusBadge = isDipinjam
      ? `<span class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 800; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;"><i class="bi bi-clock-history"></i> Dipinjam</span>`
      : `<span class="badge" style="background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-weight: 800; font-size: 11.5px; padding: 4px 8px; border-radius: 6px;"><i class="bi bi-check2-circle"></i> Dikembalikan</span>`;

    let alatListHtml = '';
    if (Array.isArray(p.daftar_alat)) {
      alatListHtml = p.daftar_alat.map(a => `
        <span class="badge" style="background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; margin: 2px; display: inline-block;">
          <i class="bi bi-tools"></i> ${a}
        </span>
      `).join('');
    } else {
      alatListHtml = `<span style="color: #334155; font-size: 12.5px;">${p.daftar_alat_text || '-'}</span>`;
    }

    const aksiKembalikan = isDipinjam
      ? `<button class="btn btn-teal btn-sm" onclick="openPengembalianModal('${p.id}')" title="Konfirmasi Pengembalian Alat" style="background: #0d9488; color: #fff; padding: 4px 8px; font-size: 11.5px;">
           <i class="bi bi-box-arrow-in-down-left"></i> Kembali
         </button>`
      : '';

    html += `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td><strong style="color: #1e293b; font-size: 12.5px;">${p.tanggal_pinjam || '-'}</strong></td>
        <td><span style="color: #64748b; font-size: 12.5px;">${p.tanggal_kembali || p.rencana_kembali || '-'}</span></td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;"><i class="bi bi-person-fill" style="color: #7c3aed;"></i> ${p.peminjam}</div>
        </td>
        <td>
          <span class="badge" style="background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 700; margin-bottom: 3px; display: inline-block;">
            ${p.kegiatan || 'Kegiatan CKG'}
          </span>
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${p.lokasi || p.catatan || '-'}</div>
        </td>
        <td>${alatListHtml}</td>
        <td style="text-align: center;">${statusBadge}</td>
        <td style="font-size: 12px; color: #475569;">${p.kondisi_kembali || '-'}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
            ${aksiKembalikan}
            <button class="btn btn-danger btn-sm" onclick="hapusPeminjamanLogistik('${p.id}')" title="Hapus Transaksi" style="padding: 4px 8px; font-size: 11.5px;">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ==========================================================================
// 6. TAB 4: REKAPITULASI MUTASI & LAPORAN
// ==========================================================================

function renderAlatBnhpRekapTable() {
  const tbody = document.getElementById('tbodyAlatBnhpRekap');
  if (!tbody) return;

  const items = stateAlatBnhp.items || [];
  const pemakaian = stateAlatBnhp.pemakaian || [];

  // Hitung total keluar/terpakai per item id / nama
  const pemakaianMap = {};
  pemakaian.forEach(p => {
    if (Array.isArray(p.items_detail)) {
      p.items_detail.forEach(d => {
        if (!pemakaianMap[d.id]) pemakaianMap[d.id] = 0;
        pemakaianMap[d.id] += Number(d.qty || 0);
      });
    }
  });

  let html = '';
  items.forEach((it, idx) => {
    const terpakai = pemakaianMap[it.id] || 0;
    const sisa = Number(it.stok || 0);
    const stokAwal = sisa + terpakai; // Estimasi stok awal
    const masuk = Number(it.total_masuk || 0);

    const isAlat = it.kategori === 'Alat';
    const katBadge = isAlat
      ? `<span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Alkes</span>`
      : `<span class="badge" style="background: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 11px;">BNHP</span>`;

    let statusBadge = `<span style="color: #059669; font-weight: 700;">Tersedia</span>`;
    if (sisa === 0) statusBadge = `<span style="color: #dc2626; font-weight: 700;">Kosong</span>`;
    else if (sisa <= Number(it.stok_min || 0)) statusBadge = `<span style="color: #d97706; font-weight: 700;">Menipis</span>`;

    html += `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td><code style="font-size: 12px; color: #1e293b;">${it.kode || '-'}</code></td>
        <td style="font-weight: 700; color: #0f172a;">${it.nama}</td>
        <td style="text-align: center;">${katBadge}</td>
        <td style="text-align: center; color: #475569;">${it.satuan || 'Pcs'}</td>
        <td style="text-align: center; font-weight: 600;">${stokAwal.toLocaleString('id-ID')}</td>
        <td style="text-align: center; color: #059669; font-weight: 700;">+${masuk.toLocaleString('id-ID')}</td>
        <td style="text-align: center; color: #dc2626; font-weight: 700;">-${terpakai.toLocaleString('id-ID')}</td>
        <td style="text-align: center; font-size: 14px; font-weight: 800; color: #0284c7;">${sisa.toLocaleString('id-ID')}</td>
        <td style="text-align: center; font-size: 12px;">${statusBadge}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ==========================================================================
// 7. MODAL ACTIONS: TAMBAH / EDIT ITEM
// ==========================================================================

function openTambahItemModal(itemId = null) {
  const modal = document.getElementById('modalItemLogistik');
  const title = document.getElementById('titleModalItemLogistik');
  const idInput = document.getElementById('editItemLogistikId');

  if (itemId) {
    const item = (stateAlatBnhp.items || []).find(it => it.id === itemId);
    if (!item) return;

    if (title) title.innerText = 'Edit Item Alat / BNHP';
    if (idInput) idInput.value = item.id;

    document.getElementById('inputItemKategori').value = item.kategori || 'BNHP';
    document.getElementById('inputItemKode').value = item.kode || '';
    document.getElementById('inputItemNama').value = item.nama || '';
    document.getElementById('inputItemSatuan').value = item.satuan || 'Pcs';
    document.getElementById('inputItemStok').value = item.stok || 0;
    document.getElementById('inputItemStokMin').value = item.stok_min || 10;
    document.getElementById('inputItemBatch').value = item.batch_no || '';
    document.getElementById('inputItemExpired').value = item.expired_date && item.expired_date !== '-' ? item.expired_date : '';
    document.getElementById('inputItemKondisi').value = item.kondisi || 'Baik';
    document.getElementById('inputItemCatatan').value = item.catatan || '';
  } else {
    if (title) title.innerText = 'Tambah Item Alat / BNHP';
    if (idInput) idInput.value = '';

    document.getElementById('inputItemKategori').value = 'BNHP';
    document.getElementById('inputItemKode').value = 'BNH-' + String((stateAlatBnhp.items.length + 1)).padStart(2, '0');
    document.getElementById('inputItemNama').value = '';
    document.getElementById('inputItemSatuan').value = 'Pcs';
    document.getElementById('inputItemStok').value = '0';
    document.getElementById('inputItemStokMin').value = '10';
    document.getElementById('inputItemBatch').value = '';
    document.getElementById('inputItemExpired').value = '';
    document.getElementById('inputItemKondisi').value = 'Baik';
    document.getElementById('inputItemCatatan').value = '';
  }

  toggleItemKategoriFields();
  if (modal) modal.classList.add('active');
}

function closeTambahItemModal() {
  const modal = document.getElementById('modalItemLogistik');
  if (modal) modal.classList.remove('active');
}

function toggleItemKategoriFields() {
  const kat = document.getElementById('inputItemKategori')?.value || 'BNHP';
  const groupBnhp = document.getElementById('groupFieldBnhp');
  const groupAlat = document.getElementById('groupFieldAlat');

  if (kat === 'Alat') {
    if (groupBnhp) groupBnhp.style.display = 'none';
    if (groupAlat) groupAlat.style.display = 'block';
  } else {
    if (groupBnhp) groupBnhp.style.display = 'grid';
    if (groupAlat) groupAlat.style.display = 'none';
  }
}

function saveItemLogistik() {
  const editId = document.getElementById('editItemLogistikId')?.value;
  const kategori = document.getElementById('inputItemKategori')?.value || 'BNHP';
  const kode = document.getElementById('inputItemKode')?.value.trim() || '';
  const nama = document.getElementById('inputItemNama')?.value.trim() || '';
  const satuan = document.getElementById('inputItemSatuan')?.value.trim() || 'Pcs';
  const stok = Number(document.getElementById('inputItemStok')?.value || 0);
  const stokMin = Number(document.getElementById('inputItemStokMin')?.value || 10);
  const batch = document.getElementById('inputItemBatch')?.value.trim() || '-';
  const expired = document.getElementById('inputItemExpired')?.value.trim() || '-';
  const kondisi = document.getElementById('inputItemKondisi')?.value || 'Baik';
  const catatan = document.getElementById('inputItemCatatan')?.value.trim() || '';

  if (!nama) {
    if (typeof Swal !== 'undefined') {
      Swal.fire('Form Belum Lengkap', 'Nama Alat / BNHP wajib diisi.', 'warning');
    } else {
      alert('Nama Alat / BNHP wajib diisi.');
    }
    return;
  }

  if (editId) {
    // Edit existing item
    const idx = stateAlatBnhp.items.findIndex(it => it.id === editId);
    if (idx !== -1) {
      stateAlatBnhp.items[idx] = {
        ...stateAlatBnhp.items[idx],
        kategori, kode, nama, satuan, stok, stok_min: stokMin,
        batch_no: batch, expired_date: expired, kondisi, catatan,
        updated_at: new Date().toISOString()
      };
    }
  } else {
    // New item
    const newItem = {
      id: 'itm-' + Date.now(),
      kode, nama, kategori, satuan, stok, stok_min: stokMin,
      batch_no: batch, expired_date: expired, kondisi, catatan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    stateAlatBnhp.items.push(newItem);
  }

  closeTambahItemModal();
  saveAlatBnhpToLocal();
  syncAlatBnhpToCloud('save_item', { items: stateAlatBnhp.items });
  renderAlatBnhpView();

  if (typeof showToast === 'function') {
    showToast(`Item "${nama}" berhasil disimpan!`, 'success');
  }
}

function hapusItemLogistik(id) {
  const item = (stateAlatBnhp.items || []).find(it => it.id === id);
  if (!item) return;

  const confirmAction = () => {
    stateAlatBnhp.items = stateAlatBnhp.items.filter(it => it.id !== id);
    saveAlatBnhpToLocal();
    syncAlatBnhpToCloud('delete_item', { id: id });
    renderAlatBnhpView();
    if (typeof showToast === 'function') {
      showToast(`Item "${item.nama}" berhasil dihapus.`, 'info');
    }
  };

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus Item Logistik?',
      text: `Apakah Anda yakin ingin menghapus "${item.nama}" dari katalog inventaris?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then(res => {
      if (res.isConfirmed) confirmAction();
    });
  } else if (confirm(`Hapus item "${item.nama}"?`)) {
    confirmAction();
  }
}

// ==========================================================================
// 8. QUICK RESTOCK MODAL
// ==========================================================================

function openQuickRestockModal(itemId) {
  const item = (stateAlatBnhp.items || []).find(it => it.id === itemId);
  if (!item) return;

  document.getElementById('restockItemId').value = item.id;
  document.getElementById('restockItemNama').innerText = item.nama;
  document.getElementById('restockItemStokNow').innerText = Number(item.stok || 0).toLocaleString('id-ID');
  document.getElementById('restockItemSatuan').innerText = item.satuan || 'Pcs';
  document.getElementById('inputRestockQty').value = '';
  document.getElementById('inputRestockTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputRestockCatatan').value = '';

  const modal = document.getElementById('modalQuickRestock');
  if (modal) modal.classList.add('active');
}

function closeQuickRestockModal() {
  const modal = document.getElementById('modalQuickRestock');
  if (modal) modal.classList.remove('active');
}

function saveQuickRestock() {
  const id = document.getElementById('restockItemId')?.value;
  const qty = Number(document.getElementById('inputRestockQty')?.value || 0);
  const sumber = document.getElementById('inputRestockSumber')?.value || 'Gudang Farmasi Puskesmas';
  const tanggal = document.getElementById('inputRestockTanggal')?.value || new Date().toISOString().split('T')[0];
  const catatan = document.getElementById('inputRestockCatatan')?.value.trim() || '';

  if (qty <= 0) {
    if (typeof Swal !== 'undefined') Swal.fire('Jumlah Tidak Valid', 'Masukkan jumlah penambahan stok minimal 1.', 'warning');
    return;
  }

  const idx = stateAlatBnhp.items.findIndex(it => it.id === id);
  if (idx !== -1) {
    stateAlatBnhp.items[idx].stok = Number(stateAlatBnhp.items[idx].stok || 0) + qty;
    stateAlatBnhp.items[idx].total_masuk = Number(stateAlatBnhp.items[idx].total_masuk || 0) + qty;
    stateAlatBnhp.items[idx].updated_at = new Date().toISOString();

    closeQuickRestockModal();
    saveAlatBnhpToLocal();
    syncAlatBnhpToCloud('restock', { id, qty, sumber, tanggal, catatan });
    renderAlatBnhpView();

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: 'Stok Berhasil Ditambahkan!',
        text: `Sebanyak ${qty} ${stateAlatBnhp.items[idx].satuan || 'Pcs'} berhasil ditambahkan ke ${stateAlatBnhp.items[idx].nama}.`,
        confirmButtonColor: '#059669',
        timer: 2000
      });
    }
  }
}

// ==========================================================================
// 8. HELPER DROPDOWN PETUGAS & SEKOLAH
// ==========================================================================

function populatePetugasDropdown(selectEl, hintEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '';

  const loggedUser = sessionStorage.getItem('ckg_user_name') || 'Mochamad Fauzie, S.Gz';
  const role = (sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas')).toLowerCase();
  const isAdmin = (role === 'admin');

  // Ambil daftar petugas dari usersDb / ckg_user_db
  let userList = [];
  if (typeof usersDb !== 'undefined' && Array.isArray(usersDb) && usersDb.length > 0) {
    userList = usersDb.map(u => (u.nama_user || u.nama || '').trim()).filter(Boolean);
  }
  if (userList.length === 0) {
    try {
      const stored = JSON.parse(localStorage.getItem('ckg_user_db') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        userList = stored.map(u => (u.nama_user || u.nama || '').trim()).filter(Boolean);
      }
    } catch (_) {}
  }

  // Fallback defaults jika belum ada database user
  if (userList.length === 0) {
    userList = [
      'Mochamad Fauzie, S.Gz',
      'Admin',
      'Tim UKS Puskesmas',
      'Tim Medis CKG',
      'Bidan Desa Banjaran'
    ];
  }

  userList = Array.from(new Set(userList));
  if (loggedUser && !userList.includes(loggedUser)) {
    userList.unshift(loggedUser);
  }

  userList.forEach(uName => {
    const opt = document.createElement('option');
    opt.value = uName;
    opt.textContent = uName;
    if (uName.toLowerCase() === loggedUser.toLowerCase()) {
      opt.selected = true;
    }
    selectEl.appendChild(opt);
  });

  if (isAdmin) {
    selectEl.disabled = false;
    selectEl.style.backgroundColor = '#ffffff';
    selectEl.style.cursor = 'pointer';
    selectEl.style.color = '#0f172a';
    if (hintEl) {
      hintEl.innerHTML = `<i class="bi bi-unlock-fill" style="color: #059669; font-size: 12px;"></i> <strong style="color: #059669;">Akses Admin:</strong> Anda dapat memilih dari total ${userList.length} petugas di database.`;
    }
  } else {
    // Non-Admin: Terkunci ke nama petugas yang sedang login
    selectEl.value = loggedUser;
    selectEl.disabled = true;
    selectEl.style.backgroundColor = '#f1f5f9';
    selectEl.style.cursor = 'not-allowed';
    selectEl.style.color = '#334155';
    if (hintEl) {
      hintEl.innerHTML = `<i class="bi bi-lock-fill" style="color: #dc2626; font-size: 12px;"></i> <strong style="color: #dc2626;">Terkunci:</strong> Petugas sesuai akun login Anda (${loggedUser}).`;
    }
  }
}

function getMasterSekolahOptions() {
  let schools = [];
  if (typeof MASTER_SARANA_SEKOLAH !== 'undefined' && Array.isArray(MASTER_SARANA_SEKOLAH) && MASTER_SARANA_SEKOLAH.length > 0) {
    schools = MASTER_SARANA_SEKOLAH.map(s => typeof s === 'string' ? { nama: s, level: 'Sekolah' } : s);
  } else {
    try {
      const stored = JSON.parse(localStorage.getItem('ckg_master_sekolah') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        schools = stored.map(s => typeof s === 'string' ? { nama: s, level: 'Sekolah' } : s);
      }
    } catch (_) {}
  }

  // Tambah sekolah dari data sekolahRecords jika ada yang belum terdaftar di master
  if (typeof sekolahRecords !== 'undefined' && Array.isArray(sekolahRecords)) {
    const existingNames = new Set(schools.map(s => (s.nama || '').trim().toUpperCase()));
    sekolahRecords.forEach(r => {
      const sNama = (r.sekolah || '').trim();
      if (sNama && !existingNames.has(sNama.toUpperCase())) {
        existingNames.add(sNama.toUpperCase());
        schools.push({ nama: sNama, level: 'Sekolah' });
      }
    });
  }

  return schools;
}

function populateSchoolsSelect(selectEl, defaultSchool = '') {
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">-- Pilih Sekolah Terdaftar --</option>';

  const schools = getMasterSekolahOptions();
  
  // Kelompokkan per level jika ada
  const sd = schools.filter(s => (s.level || '').toUpperCase() === 'SD');
  const smp = schools.filter(s => (s.level || '').toUpperCase() === 'SMP');
  const sma = schools.filter(s => (s.level || '').toUpperCase() === 'SMA');
  const lainnya = schools.filter(s => !['SD', 'SMP', 'SMA'].includes((s.level || '').toUpperCase()));

  const appendGroup = (groupLabel, list) => {
    if (list.length === 0) return;
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupLabel;
    list.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.nama;
      opt.textContent = s.nama;
      if (defaultSchool && s.nama.toUpperCase() === defaultSchool.toUpperCase()) {
        opt.selected = true;
      }
      optgroup.appendChild(opt);
    });
    selectEl.appendChild(optgroup);
  };

  appendGroup('Tingkat SD / MI', sd);
  appendGroup('Tingkat SMP / MTs', smp);
  appendGroup('Tingkat SMA / SMK / MA', sma);
  if (lainnya.length > 0) appendGroup('Sekolah Lainnya', lainnya);
}

function getStudentCountForSchool(schoolName) {
  if (!schoolName) return 0;
  const target = schoolName.trim().toUpperCase();
  if (typeof sekolahRecords !== 'undefined' && Array.isArray(sekolahRecords)) {
    return sekolahRecords.filter(r => (r.sekolah || '').trim().toUpperCase() === target).length;
  }
  return 0;
}

function handlePemakaianKegiatanChange() {
  const kegiatan = document.getElementById('selectPemakaianKegiatan')?.value || 'CKG Sekolah';
  const wrapperSekolah = document.getElementById('wrapperPemakaianSekolah');
  const wrapperManual = document.getElementById('wrapperPemakaianManual');
  const hintSasaran = document.getElementById('hintPemakaianSasaran');

  if (kegiatan === 'CKG Sekolah') {
    if (wrapperSekolah) wrapperSekolah.style.display = 'block';
    if (wrapperManual) wrapperManual.style.display = 'none';
    handlePemakaianSekolahSelect();
  } else {
    if (wrapperSekolah) wrapperSekolah.style.display = 'none';
    if (wrapperManual) wrapperManual.style.display = 'block';
    if (hintSasaran) {
      hintSasaran.innerHTML = `<i class="bi bi-pencil" style="color: #64748b;"></i> Masukkan target sasaran secara manual.`;
    }
  }
}

function handlePemakaianSekolahSelect() {
  const selectSekolah = document.getElementById('selectPemakaianSekolah');
  const inputSasaran = document.getElementById('inputPemakaianSasaran');
  const hintSasaran = document.getElementById('hintPemakaianSasaran');
  if (!selectSekolah || !inputSasaran) return;

  const school = selectSekolah.value.trim();
  if (!school) {
    if (hintSasaran) hintSasaran.innerHTML = `<i class="bi bi-info-circle"></i> Pilih sekolah di atas untuk mengisi sasaran secara otomatis.`;
    return;
  }

  const count = getStudentCountForSchool(school);
  if (count > 0) {
    inputSasaran.value = count;
    if (hintSasaran) {
      hintSasaran.innerHTML = `<i class="bi bi-check-circle-fill" style="color: #059669;"></i> Otomatis terisi <strong>${count}</strong> data siswa terdaftar di database (bisa diedit).`;
    }
  } else {
    inputSasaran.value = '';
    if (hintSasaran) {
      hintSasaran.innerHTML = `<i class="bi bi-info-circle" style="color: #d97706;"></i> Belum ada data siswa untuk sekolah ini di database. Silakan isi sasaran secara manual.`;
    }
  }
}

function handlePinjamKegiatanChange() {
  const kegiatan = document.getElementById('selectPinjamKegiatan')?.value || 'CKG Sekolah';
  const wrapperSekolah = document.getElementById('wrapperPinjamSekolah');
  const wrapperManual = document.getElementById('wrapperPinjamManual');

  if (kegiatan === 'CKG Sekolah') {
    if (wrapperSekolah) wrapperSekolah.style.display = 'block';
    if (wrapperManual) wrapperManual.style.display = 'none';
  } else {
    if (wrapperSekolah) wrapperSekolah.style.display = 'none';
    if (wrapperManual) wrapperManual.style.display = 'block';
  }
}

// ==========================================================================
// 9. CATAT PEMAKAIAN LAPANGAN MODAL
// ==========================================================================

function openCatatPemakaianModal() {
  document.getElementById('inputPemakaianTanggal').value = new Date().toISOString().split('T')[0];

  // Inisialisasi dropdown petugas sesuai hak akses & sesi login
  populatePetugasDropdown(
    document.getElementById('selectPemakaianPetugas'),
    document.getElementById('hintPemakaianPetugas')
  );

  // Inisialisasi dropdown sekolah
  populateSchoolsSelect(document.getElementById('selectPemakaianSekolah'));

  // Reset kegiatan ke CKG Sekolah
  const selectKegiatan = document.getElementById('selectPemakaianKegiatan');
  if (selectKegiatan) selectKegiatan.value = 'CKG Sekolah';

  const inputLokasiManual = document.getElementById('inputPemakaianLokasiManual');
  if (inputLokasiManual) inputLokasiManual.value = '';

  document.getElementById('inputPemakaianSasaran').value = '';
  document.getElementById('inputPemakaianCatatan').value = '';

  handlePemakaianKegiatanChange();

  const container = document.getElementById('containerPemakaianItemRows');
  if (container) {
    container.innerHTML = '';
    // Tambah 2 baris awal default: contoh Bawa 200, Sisa 30 -> Terpakai 170
    addPemakaianItemRow('itm-10', 200, 30); // Strip Gula
    addPemakaianItemRow('itm-14', 200, 30); // Blood Lancet
  }

  const modal = document.getElementById('modalCatatPemakaian');
  if (modal) modal.classList.add('active');
}

function closeCatatPemakaianModal() {
  const modal = document.getElementById('modalCatatPemakaian');
  if (modal) modal.classList.remove('active');
}

function addPemakaianItemRow(selectedId = '', defaultBawa = 200, defaultSisa = 0) {
  const container = document.getElementById('containerPemakaianItemRows');
  if (!container) return;

  const bnhpItems = (stateAlatBnhp.items || []).filter(it => it.kategori === 'BNHP');
  let optionsHtml = bnhpItems.map(it => `
    <option value="${it.id}" ${it.id === selectedId ? 'selected' : ''}>
      ${it.nama} (Sisa Stok: ${it.stok} ${it.satuan})
    </option>
  `).join('');

  const defaultPakai = Math.max(0, Number(defaultBawa || 0) - Number(defaultSisa || 0));

  const row = document.createElement('div');
  row.className = 'pemakaian-item-row';
  row.style.cssText = 'display: grid; grid-template-columns: minmax(170px, 2.5fr) minmax(65px, 0.9fr) minmax(65px, 0.9fr) minmax(75px, 1fr) 36px; gap: 8px; align-items: center;';
  row.innerHTML = `
    <select class="filter-control select-pemakaian-item" style="width: 100%; font-size: 13px;">
      ${optionsHtml}
    </select>
    <input type="number" class="filter-control input-pemakaian-bawa" min="0" value="${defaultBawa}" placeholder="Bawa" title="Jumlah barang yang dibawa ke lapangan" oninput="calcPemakaianRow(this)" style="font-weight: 700; text-align: center; color: #1e293b;">
    <input type="number" class="filter-control input-pemakaian-sisa" min="0" value="${defaultSisa}" placeholder="Sisa" title="Jumlah sisa yang dikembalikan ke puskesmas" oninput="calcPemakaianRow(this)" style="font-weight: 700; text-align: center; color: #d97706;">
    <input type="number" class="filter-control input-pemakaian-qty" min="0" value="${defaultPakai}" placeholder="Pakai" title="Jumlah riil terpakai (hanya ini yang memotong stok)" style="font-weight: 800; text-align: center; color: #059669; background: #ecfdf5; border-color: #6ee7b7;">
    <button type="button" class="btn btn-danger btn-sm" onclick="removePemakaianItemRow(this)" style="padding: 6px; line-height: 1; border-radius: 6px;" title="Hapus Baris">
      <i class="bi bi-x-lg"></i>
    </button>
  `;

  container.appendChild(row);
}

function calcPemakaianRow(inputEl) {
  const row = inputEl.closest('.pemakaian-item-row');
  if (!row) return;

  const bawa = Number(row.querySelector('.input-pemakaian-bawa')?.value || 0);
  const sisa = Number(row.querySelector('.input-pemakaian-sisa')?.value || 0);
  const qtyInput = row.querySelector('.input-pemakaian-qty');

  const terpakai = Math.max(0, bawa - sisa);
  if (qtyInput) qtyInput.value = terpakai;
}

function removePemakaianItemRow(btn) {
  const row = btn.closest('.pemakaian-item-row');
  if (row) row.remove();
}

function saveCatatPemakaian() {
  const tanggal = document.getElementById('inputPemakaianTanggal')?.value;
  const petugas = document.getElementById('selectPemakaianPetugas')?.value || sessionStorage.getItem('ckg_user_name') || 'Petugas';
  const kegiatan = document.getElementById('selectPemakaianKegiatan')?.value || 'CKG Sekolah';

  let lokasi = '';
  if (kegiatan === 'CKG Sekolah') {
    lokasi = (document.getElementById('selectPemakaianSekolah')?.value || '').trim();
    if (!lokasi) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Sekolah Belum Dipilih', 'Silakan pilih sekolah terdaftar untuk kegiatan CKG Sekolah.', 'warning');
      }
      return;
    }
  } else {
    lokasi = (document.getElementById('inputPemakaianLokasiManual')?.value || '').trim();
    if (!lokasi) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Lokasi Belum Diisi', 'Silakan isi lokasi atau nama tempat pelaksanaan kegiatan.', 'warning');
      }
      return;
    }
  }

  const sasaran = Number(document.getElementById('inputPemakaianSasaran')?.value || 0);
  const catatan = document.getElementById('inputPemakaianCatatan')?.value.trim();

  if (!tanggal || !petugas || !lokasi) {
    if (typeof Swal !== 'undefined') {
      Swal.fire('Form Belum Lengkap', 'Tanggal, Petugas, dan Lokasi Kegiatan wajib diisi.', 'warning');
    }
    return;
  }

  // Parse rows (Bawa, Sisa, Riil Terpakai)
  const rows = document.querySelectorAll('.pemakaian-item-row');
  const details = [];

  rows.forEach(r => {
    const select = r.querySelector('.select-pemakaian-item');
    const inputBawa = r.querySelector('.input-pemakaian-bawa');
    const inputSisa = r.querySelector('.input-pemakaian-sisa');
    const inputQty = r.querySelector('.input-pemakaian-qty');

    const itemId = select?.value;
    const bawa = Number(inputBawa?.value || 0);
    const sisa = Number(inputSisa?.value || 0);
    const qty = Number(inputQty?.value || 0);

    if (itemId && qty > 0) {
      const it = stateAlatBnhp.items.find(x => x.id === itemId);
      if (it) {
        details.push({
          id: it.id,
          nama: it.nama,
          satuan: it.satuan,
          bawa: bawa,
          sisa: sisa,
          qty: qty // Hanya qty yang memotong stok
        });
      }
    }
  });

  if (details.length === 0) {
    if (typeof Swal !== 'undefined') Swal.fire('Item Kosong', 'Pilih minimal 1 bahan BNHP dengan jumlah terpakai lebih dari 0.', 'warning');
    return;
  }

  // Kurangi stok masing-masing item HANYA sejumlah qty riil terpakai
  details.forEach(d => {
    const idx = stateAlatBnhp.items.findIndex(x => x.id === d.id);
    if (idx !== -1) {
      const sisaStok = Number(stateAlatBnhp.items[idx].stok || 0) - d.qty;
      stateAlatBnhp.items[idx].stok = Math.max(0, sisaStok);
    }
  });

  const newRecord = {
    id: 'pmk-' + Date.now(),
    tanggal,
    kegiatan,
    lokasi_kegiatan: lokasi,
    petugas,
    jumlah_sasaran: sasaran,
    items_detail: details,
    items_json: details.map(d => `${d.nama}: Bawa ${d.bawa || d.qty}, Sisa ${d.sisa || 0} ➔ Pakai ${d.qty} ${d.satuan}`).join('; '),
    catatan,
    created_at: new Date().toISOString()
  };

  stateAlatBnhp.pemakaian.unshift(newRecord);
  closeCatatPemakaianModal();
  saveAlatBnhpToLocal();
  syncAlatBnhpToCloud('catat_pemakaian', newRecord);
  renderAlatBnhpView();

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Pemakaian Berhasil Dicatat!',
      text: `Data logistik telah diperbarui dan stok bahan habis pakai otomatis dikurangi.`,
      confirmButtonColor: '#059669',
      timer: 2200
    });
  }
}

function hapusPemakaianLogistik(id) {
  const confirmAction = () => {
    stateAlatBnhp.pemakaian = stateAlatBnhp.pemakaian.filter(p => p.id !== id);
    saveAlatBnhpToLocal();
    syncAlatBnhpToCloud('delete_pemakaian', { id });
    renderAlatBnhpView();
    if (typeof showToast === 'function') showToast('Rekaman pemakaian berhasil dihapus.', 'info');
  };

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus Rekaman Pemakaian?',
      text: 'Catatan ini akan dihapus dari histori pemakaian.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Hapus'
    }).then(r => { if (r.isConfirmed) confirmAction(); });
  } else if (confirm('Hapus rekaman pemakaian ini?')) {
    confirmAction();
  }
}

// ==========================================================================
// 10. PEMINJAMAN & PENGEMBALIAN ALAT MEDIS
// ==========================================================================

function openPeminjamanModal() {
  document.getElementById('inputPinjamTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputPinjamRencanaKembali').value = new Date().toISOString().split('T')[0];

  // Inisialisasi dropdown petugas peminjam sesuai hak akses login
  populatePetugasDropdown(
    document.getElementById('selectPinjamPetugas'),
    document.getElementById('hintPinjamPetugas')
  );

  // Inisialisasi dropdown sekolah
  populateSchoolsSelect(document.getElementById('selectPinjamSekolah'));

  // Reset kegiatan ke CKG Sekolah
  const selectKegiatan = document.getElementById('selectPinjamKegiatan');
  if (selectKegiatan) selectKegiatan.value = 'CKG Sekolah';

  const inputManual = document.getElementById('inputPinjamLokasiManual');
  if (inputManual) inputManual.value = '';

  const inputCatatan = document.getElementById('inputPinjamCatatan');
  if (inputCatatan) inputCatatan.value = '';

  handlePinjamKegiatanChange();

  const container = document.getElementById('containerChecklistAlatMedis');
  if (container) {
    const alkesItems = (stateAlatBnhp.items || []).filter(it => it.kategori === 'Alat');
    container.innerHTML = alkesItems.map(it => `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; background: #fff; padding: 6px 10px; border-radius: 6px; border: 1px solid #e9d5ff; cursor: pointer;">
        <input type="checkbox" class="cb-pinjam-alat" value="${it.nama}" data-id="${it.id}">
        <span><strong>${it.nama}</strong> (${it.kondisi || 'Baik'})</span>
      </label>
    `).join('');
  }

  const modal = document.getElementById('modalPeminjamanAlat');
  if (modal) modal.classList.add('active');
}

function closePeminjamanModal() {
  const modal = document.getElementById('modalPeminjamanAlat');
  if (modal) modal.classList.remove('active');
}

function savePeminjaman() {
  const petugas = document.getElementById('selectPinjamPetugas')?.value || sessionStorage.getItem('ckg_user_name') || 'Petugas';
  const tglPinjam = document.getElementById('inputPinjamTanggal')?.value;
  const rencanaKembali = document.getElementById('inputPinjamRencanaKembali')?.value;
  const kegiatan = document.getElementById('selectPinjamKegiatan')?.value || 'CKG Sekolah';

  let lokasi = '';
  if (kegiatan === 'CKG Sekolah') {
    lokasi = (document.getElementById('selectPinjamSekolah')?.value || '').trim();
    if (!lokasi) {
      if (typeof Swal !== 'undefined') Swal.fire('Sekolah Belum Dipilih', 'Silakan pilih sekolah untuk kegiatan peminjaman alat.', 'warning');
      return;
    }
  } else {
    lokasi = (document.getElementById('inputPinjamLokasiManual')?.value || '').trim();
    if (!lokasi) {
      if (typeof Swal !== 'undefined') Swal.fire('Lokasi Belum Diisi', 'Silakan isi lokasi tempat peminjaman alat.', 'warning');
      return;
    }
  }

  const catatanExtra = document.getElementById('inputPinjamCatatan')?.value.trim();

  if (!petugas || !tglPinjam) {
    if (typeof Swal !== 'undefined') Swal.fire('Form Belum Lengkap', 'Petugas peminjam dan tanggal pinjam wajib diisi.', 'warning');
    return;
  }

  const checked = Array.from(document.querySelectorAll('.cb-pinjam-alat:checked')).map(cb => cb.value);
  if (checked.length === 0) {
    if (typeof Swal !== 'undefined') Swal.fire('Alat Belum Dipilih', 'Pilih minimal 1 alat medis yang dipinjam.', 'warning');
    return;
  }

  const newLoan = {
    id: 'pjm-' + Date.now(),
    tanggal_pinjam: tglPinjam,
    rencana_kembali: rencanaKembali,
    tanggal_kembali: '-',
    peminjam: petugas,
    kegiatan: kegiatan,
    lokasi: lokasi,
    kontak: '-',
    daftar_alat: checked,
    daftar_alat_text: checked.join(', '),
    status: 'Dipinjam',
    kondisi_kembali: '-',
    catatan: catatanExtra ? `${kegiatan} - ${lokasi} (${catatanExtra})` : `${kegiatan} - ${lokasi}`,
    created_at: new Date().toISOString()
  };

  stateAlatBnhp.peminjaman.unshift(newLoan);
  closePeminjamanModal();
  saveAlatBnhpToLocal();
  syncAlatBnhpToCloud('pinjam_alat', newLoan);
  renderAlatBnhpView();

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Peminjaman Dicatat!',
      text: `${checked.length} alat medis berhasil dicatat sedang dipinjam oleh ${petugas} untuk ${kegiatan} (${lokasi}).`,
      confirmButtonColor: '#7c3aed',
      timer: 2300
    });
  }
}

function openPengembalianModal(loanId) {
  const loan = (stateAlatBnhp.peminjaman || []).find(p => p.id === loanId);
  if (!loan) return;

  document.getElementById('returnPeminjamanId').value = loan.id;
  document.getElementById('returnNamaPeminjam').innerText = loan.peminjam;
  document.getElementById('returnDaftarAlat').innerText = Array.isArray(loan.daftar_alat) ? loan.daftar_alat.join(', ') : (loan.daftar_alat_text || '-');
  document.getElementById('inputReturnTanggal').value = new Date().toISOString().split('T')[0];
  document.getElementById('inputReturnKondisi').value = 'Lengkap & Berfungsi Baik';
  document.getElementById('inputReturnCatatan').value = '';

  const modal = document.getElementById('modalPengembalianAlat');
  if (modal) modal.classList.add('active');
}

function closePengembalianModal() {
  const modal = document.getElementById('modalPengembalianAlat');
  if (modal) modal.classList.remove('active');
}

function prosesPengembalianAlat() {
  const loanId = document.getElementById('returnPeminjamanId')?.value;
  const tglKembali = document.getElementById('inputReturnTanggal')?.value || new Date().toISOString().split('T')[0];
  const kondisi = document.getElementById('inputReturnKondisi')?.value || 'Lengkap & Berfungsi Baik';
  const catatan = document.getElementById('inputReturnCatatan')?.value.trim();

  const idx = stateAlatBnhp.peminjaman.findIndex(p => p.id === loanId);
  if (idx !== -1) {
    stateAlatBnhp.peminjaman[idx].status = 'Dikembalikan';
    stateAlatBnhp.peminjaman[idx].tanggal_kembali = tglKembali;
    stateAlatBnhp.peminjaman[idx].kondisi_kembali = kondisi;
    if (catatan) stateAlatBnhp.peminjaman[idx].catatan_kembali = catatan;

    closePengembalianModal();
    saveAlatBnhpToLocal();
    syncAlatBnhpToCloud('kembali_alat', stateAlatBnhp.peminjaman[idx]);
    renderAlatBnhpView();

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: 'Alat Telah Dikembalikan!',
        text: 'Status peminjaman telah diubah menjadi Selesai Dikembalikan.',
        confirmButtonColor: '#0d9488',
        timer: 2000
      });
    }
  }
}

function hapusPeminjamanLogistik(id) {
  const confirmAction = () => {
    stateAlatBnhp.peminjaman = stateAlatBnhp.peminjaman.filter(p => p.id !== id);
    saveAlatBnhpToLocal();
    syncAlatBnhpToCloud('delete_peminjaman', { id });
    renderAlatBnhpView();
    if (typeof showToast === 'function') showToast('Riwayat peminjaman berhasil dihapus.', 'info');
  };

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus Riwayat Peminjaman?',
      text: 'Catatan ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Hapus'
    }).then(r => { if (r.isConfirmed) confirmAction(); });
  } else if (confirm('Hapus riwayat peminjaman ini?')) {
    confirmAction();
  }
}

// ==========================================================================
// 11. EXPORT LAPORAN KE EXCEL (.XLSX)
// ==========================================================================

function exportAlatBnhpToXLSX() {
  if (typeof XLSX === 'undefined') {
    if (typeof Swal !== 'undefined') {
      Swal.fire('Fitur Belum Siap', 'Library SheetJS (XLSX) belum dimuat.', 'error');
    }
    return;
  }

  try {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Stok & Inventaris
    const itemsData = (stateAlatBnhp.items || []).map((it, idx) => ({
      'No': idx + 1,
      'Kode Barang': it.kode || '-',
      'Nama Alat / BNHP': it.nama || '-',
      'Kategori': it.kategori || '-',
      'Satuan': it.satuan || 'Pcs',
      'Stok Tersedia': Number(it.stok || 0),
      'Batas Minimum Stok': Number(it.stok_min || 0),
      'No. Batch': it.batch_no || '-',
      'Expired Date': it.expired_date || '-',
      'Kondisi': it.kondisi || 'Baik',
      'Keterangan': it.catatan || '-'
    }));
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Katalog_Inventaris');

    // 2. Sheet Pemakaian Lapangan
    const pemakaianData = (stateAlatBnhp.pemakaian || []).map((p, idx) => ({
      'No': idx + 1,
      'Tanggal Kegiatan': p.tanggal || '-',
      'Jenis Kegiatan': p.kegiatan || 'CKG Sekolah',
      'Lokasi Pelaksanaan': p.lokasi_kegiatan || '-',
      'Rincian BNHP Terpakai': Array.isArray(p.items_detail) 
        ? p.items_detail.map(d => `${d.nama} (Bawa: ${d.bawa !== undefined ? d.bawa : d.qty}, Sisa: ${d.sisa || 0} ➔ Pakai: ${d.qty} ${d.satuan || 'Pcs'})`).join('; ')
        : (p.items_json || '-'),
      'Catatan': p.catatan || '-'
    }));
    const wsPemakaian = XLSX.utils.json_to_sheet(pemakaianData);
    XLSX.utils.book_append_sheet(wb, wsPemakaian, 'Log_Pemakaian_Lapangan');

    // 3. Sheet Peminjaman Alat
    const peminjamanData = (stateAlatBnhp.peminjaman || []).map((p, idx) => ({
      'No': idx + 1,
      'Tanggal Pinjam': p.tanggal_pinjam || '-',
      'Rencana Kembali': p.rencana_kembali || '-',
      'Tanggal Pengembalian': p.tanggal_kembali || '-',
      'Petugas Peminjam': p.peminjam || '-',
      'Jenis Kegiatan': p.kegiatan || 'CKG Sekolah',
      'Lokasi Pelaksanaan': p.lokasi || p.catatan || '-',
      'Daftar Alat Dibawa': Array.isArray(p.daftar_alat) ? p.daftar_alat.join(', ') : (p.daftar_alat_text || '-'),
      'Status': p.status || 'Dipinjam',
      'Kondisi Saat Kembali': p.kondisi_kembali || '-',
      'Catatan': p.catatan || '-'
    }));
    const wsPeminjaman = XLSX.utils.json_to_sheet(peminjamanData);
    XLSX.utils.book_append_sheet(wb, wsPeminjaman, 'Riwayat_Peminjaman_Alat');

    const fileName = `Laporan_Logistik_Alat_BNHP_CKG_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    if (typeof showToast === 'function') {
      showToast('File Excel laporan logistik berhasil diunduh.', 'success');
    }
  } catch (err) {
    console.error('Export Excel error:', err);
    if (typeof Swal !== 'undefined') Swal.fire('Gagal Ekspor', err.message, 'error');
  }
}
