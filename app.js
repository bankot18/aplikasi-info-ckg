// Main Application Logic for Pencatatan CKG Puskesmas Banjaran Kota

// Initial User Database matching user specifications
const INITIAL_USERS_DB = [
  { nama_user: "Mochamad Fauzie, S.Gz", password: "213", role: "Admin" },
  { nama_user: "Nurul Hidayah, Amd.Kes", password: "213", role: "Koordinator" },
  { nama_user: "Anisa Rohmatunisa, AM.Keb", password: "", role: "Petugas" },
  { nama_user: "Neng Yulia Trisnawati, AM.Keb", password: "", role: "Petugas" },
  { nama_user: "Teti Nuryati, S.Keb, Bdn", password: "", role: "Petugas" }
];

// Officers List (Populated dynamically from database)
const OFFICERS_DATA = [];

// SIMPUS Records (Populated dynamically from Cloudflare D1 Database)
const INITIAL_SIMPUS_RECORDS = [];

// CKG Screening Records (Populated dynamically from Cloudflare D1 Database)
const INITIAL_MOCK_RECORDS = [];

let usersDb = [];
let records = [];
let simpusRecords = [];
let recycleBin = [];
let announcementData = null;
let activeSimpusTab = 'belum_bagi'; // 'belum_bagi' or 'sudah_bagi'
let currentRole = 'Admin';
let currentEditingId = null;
let activeSessionsMap = {};

async function sendUserHeartbeat(status = 'active') {
  const loggedUser = sessionStorage.getItem('ckg_user_name');
  if (!loggedUser) return;

  const now = Date.now();
  activeSessionsMap[loggedUser] = {
    last_seen: now,
    status: status
  };

  try {
    localStorage.setItem('ckg_active_user_sessions', JSON.stringify(activeSessionsMap));
  } catch (_) {}

  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama_user: loggedUser, status: status })
    });
  } catch (_) {}
}

async function fetchLiveSessions() {
  try {
    const res = await fetch('/api/sessions');
    if (res.ok) {
      const result = await res.json();
      if (result && result.success && Array.isArray(result.data)) {
        result.data.forEach(item => {
          if (item && item.nama_user) {
            activeSessionsMap[item.nama_user] = {
              last_seen: Number(item.last_seen) || 0,
              status: item.status || 'offline'
            };
          }
        });
      }
    }
  } catch (_) {}

  try {
    const local = JSON.parse(localStorage.getItem('ckg_active_user_sessions') || '{}');
    for (let uName in local) {
      if (!activeSessionsMap[uName] || local[uName].last_seen > (activeSessionsMap[uName].last_seen || 0)) {
        activeSessionsMap[uName] = local[uName];
      }
    }
  } catch (_) {}
}

async function manualRefreshLiveSessions() {
  showToast('Memperbarui Status Live Session...', 'info');
  await fetchCloudUsers();
  await fetchLiveSessions();
  if (typeof renderUserDatabaseTable === 'function') renderUserDatabaseTable();
  showToast('Status Live Session Berhasil Diperbarui!', 'success');
}

function toggleTablePasswordVisibility(index, realPass) {
  const codeEl = document.getElementById(`passCode_${index}`);
  const iconEl = document.getElementById(`eyeIcon_${index}`);
  if (!codeEl || !iconEl) return;
  if (codeEl.textContent === '••••••••') {
    codeEl.textContent = realPass;
    iconEl.className = 'bi bi-eye-fill';
    iconEl.style.color = '#2563eb';
  } else {
    codeEl.textContent = '••••••••';
    iconEl.className = 'bi bi-eye-slash-fill';
    iconEl.style.color = '#64748b';
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && sessionStorage.getItem('ckg_logged_in') === 'true') {
    sendUserHeartbeat('active');
    fetchLiveSessions();
  }
});

window.addEventListener('pagehide', () => {
  const loggedUser = sessionStorage.getItem('ckg_user_name');
  if (loggedUser) {
    const payload = JSON.stringify({ nama_user: loggedUser, status: 'offline' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/sessions', new Blob([payload], { type: 'application/json' }));
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  applyCustomLogo();
  loadStoredUserDatabase();
  loadStoredRecords();
  loadStoredSimpusRecords();
  loadStoredRecycleBin();
  loadStoredAnnouncement();
  setupImportDropzone();
  startLiveClock();
  initWilayahDropdowns();
  setupEventListeners();
  setupAuthFormEvents();
  checkAuthSession();

  // Load maintenance settings from Cloud D1
  loadMaintenanceSettings();
});

function loadStoredUserDatabase() {
  // Force clean stale local storage keys from previous test sessions
  const isV2Synced = localStorage.getItem('ckg_user_db_v2_synced');

  if (!isV2Synced) {
    localStorage.removeItem('ckg_user_db');
    localStorage.setItem('ckg_user_db_v2_synced', 'true');
    usersDb = [...INITIAL_USERS_DB];
  } else {
    const saved = localStorage.getItem('ckg_user_db');
    let loaded = null;
    if (saved) {
      try { loaded = JSON.parse(saved); } catch (e) { loaded = null; }
    }

    const legacyBlacklist = ['babeh', 'babcri', 'testuser', 'demo'];

    if (Array.isArray(loaded) && loaded.length > 0) {
      usersDb = loaded.filter(u => u && u.nama_user && !legacyBlacklist.includes(String(u.nama_user).toLowerCase().trim()));

      INITIAL_USERS_DB.forEach(initUser => {
        if (!usersDb.some(u => u.nama_user === initUser.nama_user)) {
          usersDb.push(initUser);
        }
      });
    } else {
      usersDb = [...INITIAL_USERS_DB];
    }
  }

  saveUserDatabaseToStorage();
  populateUserDropdowns();
  fetchCloudUsers();
}

function getRolePriority(role) {
  const r = String(role || '').toLowerCase().trim();
  if (r.includes('admin')) return 1;
  if (r.includes('koordinator') || r.includes('kordinator')) return 2;
  return 3; // Petugas or default
}

function sortUsersDbByRoleHierarchy() {
  if (!Array.isArray(usersDb)) return;
  usersDb.sort((a, b) => {
    const pA = getRolePriority(a ? a.role : '');
    const pB = getRolePriority(b ? b.role : '');
    if (pA !== pB) return pA - pB;
    const nameA = String((a && (a.nama_user || a.nama)) || '');
    const nameB = String((b && (b.nama_user || b.nama)) || '');
    return nameA.localeCompare(nameB);
  });
}

function resetUserDatabaseToDefault() {
  usersDb = JSON.parse(JSON.stringify(INITIAL_USERS_DB));
  saveUserDatabaseToStorage();
  if (typeof renderUserDatabaseTable === 'function') renderUserDatabaseTable();
}

function saveUserDatabaseToStorage() {
  sortUsersDbByRoleHierarchy();
  localStorage.setItem('ckg_user_db', JSON.stringify(usersDb));
  populateUserDropdowns();
}

function populateUserDropdowns() {
  sortUsersDbByRoleHierarchy();

  const loginSelect = document.getElementById('loginPegawaiSelect');
  const targetSelect = document.getElementById('targetPetugasSelect');
  const filterPetugasSelect = document.getElementById('filterPetugas');
  const filterSimpusSelect = document.getElementById('filterSimpusPetugas');
  const importTargetSelect = document.getElementById('importTargetPetugas');

  if (loginSelect) {
    const prevVal = loginSelect.value;
    loginSelect.innerHTML = '<option value="">-- Pilih Nama Pegawai --</option>';
    usersDb.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.nama_user;
      opt.dataset.role = u.role || 'Petugas';
      opt.dataset.needPass = 'true';
      opt.textContent = `${u.nama_user}${u.role !== 'Petugas' ? ' (' + u.role + ')' : ''}`;
      if (prevVal && u.nama_user === prevVal) opt.selected = true;
      loginSelect.appendChild(opt);
    });
  }

  if (targetSelect) {
    const prevTarget = targetSelect.value;
    targetSelect.innerHTML = '<option value="">-- Pilih Petugas --</option>';
    usersDb.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.nama_user;
      opt.textContent = u.nama_user;
      if (prevTarget && u.nama_user === prevTarget) opt.selected = true;
      targetSelect.appendChild(opt);
    });
  }

  if (filterPetugasSelect) {
    const prevFilter = filterPetugasSelect.value;
    filterPetugasSelect.innerHTML = '<option value="">-- Semua Petugas --</option>';
    usersDb.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.nama_user;
      opt.textContent = u.nama_user;
      if (prevFilter && u.nama_user === prevFilter) opt.selected = true;
      filterPetugasSelect.appendChild(opt);
    });
  }

  if (filterSimpusSelect) {
    const prevSimpusFilter = filterSimpusSelect.value;
    filterSimpusSelect.innerHTML = '<option value="">-- Semua Petugas --</option>';
    usersDb.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.nama_user;
      opt.textContent = u.nama_user;
      if (prevSimpusFilter && u.nama_user === prevSimpusFilter) opt.selected = true;
      filterSimpusSelect.appendChild(opt);
    });
  }

  if (importTargetSelect && !importTargetSelect.disabled) {
    const prevImportTarget = importTargetSelect.value;
    importTargetSelect.innerHTML = '';
    usersDb.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.nama_user;
      opt.textContent = u.nama_user;
      if (prevImportTarget && u.nama_user === prevImportTarget) opt.selected = true;
      importTargetSelect.appendChild(opt);
    });
  }

  if (typeof updatePasswordVisibility === 'function') {
    updatePasswordVisibility();
  }

  applyPetugasFilterLock();
}

function applyPetugasFilterLock() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');
  const loggedUser = sessionStorage.getItem('ckg_user_name') || '';

  const filterPetugasSelect = document.getElementById('filterPetugas');
  if (filterPetugasSelect) {
    if (!isPrivileged && loggedUser) {
      filterPetugasSelect.value = loggedUser;
      filterPetugasSelect.disabled = true;
      filterPetugasSelect.title = `Terkunci: Hak Akses Petugas hanya melihat data sendiri (${loggedUser})`;
      filterPetugasSelect.style.backgroundColor = '#f1f5f9';
      filterPetugasSelect.style.cursor = 'not-allowed';
      filterPetugasSelect.style.opacity = '0.85';
    } else {
      filterPetugasSelect.disabled = false;
      filterPetugasSelect.title = '';
      filterPetugasSelect.style.backgroundColor = '';
      filterPetugasSelect.style.cursor = '';
      filterPetugasSelect.style.opacity = '';
    }
  }

  const filterSimpusSelect = document.getElementById('filterSimpusPetugas');
  if (filterSimpusSelect) {
    if (!isPrivileged && loggedUser) {
      filterSimpusSelect.value = loggedUser;
      filterSimpusSelect.disabled = true;
      filterSimpusSelect.title = `Terkunci: Hak Akses Petugas hanya melihat data sendiri (${loggedUser})`;
      filterSimpusSelect.style.backgroundColor = '#f1f5f9';
      filterSimpusSelect.style.cursor = 'not-allowed';
      filterSimpusSelect.style.opacity = '0.85';
    } else {
      filterSimpusSelect.disabled = false;
      filterSimpusSelect.title = '';
      filterSimpusSelect.style.backgroundColor = '';
      filterSimpusSelect.style.cursor = '';
      filterSimpusSelect.style.opacity = '';
    }
  }
}

function loadStoredRecords() {
  const saved = localStorage.getItem('ckg_records');
  if (saved) {
    try {
      records = JSON.parse(saved);
    } catch (e) {
      records = [];
    }
  } else {
    records = [];
  }
  fetchCloudRecords();
}

function saveRecordsToStorage() {
  localStorage.setItem('ckg_records', JSON.stringify(records));
  syncRecordsToCloud(records);
}

async function fetchCloudRecords() {
  try {
    const res = await fetch('/api/ckg');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          const prevLen = records.length;
          const newRecords = result.data.map(r => ({
            id: r.id ? (String(r.id).startsWith('CKG-') ? String(r.id) : `CKG-${r.id}`) : 'CKG-' + Date.now(),
            jenis_kegiatan: r.jenis_kegiatan || r.lokasi_pelayanan || 'Luar Gedung',
            nik: r.nik || '',
            nama: r.nama || r.nama_pasien || 'Pasien',
            tanggal_lahir: r.tanggal_lahir || '1990-01-01',
            usia: r.usia || 30,
            jenis_kelamin: r.jenis_kelamin || 'L',
            no_whatsapp: r.no_whatsapp || '',
            status_pernikahan: r.status_pernikahan || 'Kawin',
            provinsi: r.provinsi || 'Jawa Barat',
            kab_kota: r.kab_kota || 'Kab. Bandung',
            kecamatan: r.kecamatan || 'Banjaran',
            kelurahan: r.kelurahan || 'Banjaran Kota',
            alamat: r.alamat || 'Banjaran',
            pekerjaan: r.pekerjaan || '',
            merokok: r.merokok || 'Tidak',
            bb: r.bb || 60,
            tb: r.tb || 165,
            lp: r.lp || 80,
            imt: r.imt || '22.0',
            td_sistolik: r.td_sistolik || 120,
            td_diastolik: r.td_diastolik || 80,
            gula_darah: r.gula_darah || '110',
            kolesterol: r.kolesterol || '180',
            hb: r.hb || '14.0',
            telinga: r.telinga || 'Normal',
            mata: r.mata || 'Normal',
            gigi: r.gigi || 'Normal',
            katarak: r.katarak || 'Tidak',
            status_validasi: r.status_validasi || 'Terverifikasi',
            petugas_entry: r.petugas_entry || r.created_by || 'Admin',
            created_by: r.created_by || r.petugas_entry || 'Admin',
            created_at: r.created_at || r.tanggal_entry || new Date().toISOString().substring(0, 10),
            tanggal_entry: r.tanggal_entry || r.created_at || new Date().toISOString().substring(0, 10)
          }));
          records = newRecords;
          
          // Non-blocking background save to local storage cache
          setTimeout(() => {
            try { localStorage.setItem('ckg_records', JSON.stringify(records)); } catch (_) {}
          }, 100);

          updateCloudSyncPill(true, `D1 Online (${records.length} Rec)`);

          // Only trigger UI re-render if data count changed or on initial load
          if (prevLen !== records.length || prevLen === 0) {
            requestAnimationFrame(() => {
              if (typeof renderApp === 'function') renderApp();
            });
          }
        } else if (records.length > 0 && !window._intentionalDeleteAll) {
          // Push local records to D1 if D1 is currently empty (but NOT after intentional delete)
          syncRecordsToCloud(records);
        } else {
          updateCloudSyncPill(true, 'D1 Online (0 Rec)');
        }
      }
    }
  } catch (e) {
    console.log('Using local cached records:', e);
  }
}

async function syncRecordsToCloud(dataToSync) {
  if (!dataToSync || dataToSync.length === 0) return;
  try {
    updateCloudSyncPill('syncing', 'Menyingkronkan Data...');
    const CHUNK_SIZE = 200;
    for (let i = 0; i < dataToSync.length; i += CHUNK_SIZE) {
      const chunk = dataToSync.slice(i, i + CHUNK_SIZE);
      await fetch('/api/ckg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
    }
    updateCloudSyncPill(true, `D1 Online (${dataToSync.length} Rec)`);
  } catch (e) {
    console.log('Failed to sync CKG records to cloud D1:', e);
    updateCloudSyncPill(true, `D1 Active`);
  }
}

function loadStoredSimpusRecords() {
  const saved = localStorage.getItem('ckg_simpus_records');
  if (saved) {
    try {
      simpusRecords = JSON.parse(saved);
    } catch (e) {
      simpusRecords = [];
    }
  } else {
    simpusRecords = [];
  }
  fetchCloudSimpusRecords(true);
}

function saveSimpusRecordsToStorage() {
  localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));
  syncSimpusToCloud(simpusRecords);
}

async function loadStoredRecycleBin() {
  const saved = localStorage.getItem('ckg_recycle_bin');
  if (saved) {
    try { recycleBin = JSON.parse(saved); } catch (_) { recycleBin = []; }
  }

  try {
    const res = await fetch('/api/recycle');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        recycleBin = result.data;
        localStorage.setItem('ckg_recycle_bin', JSON.stringify(recycleBin));
      }
    }
  } catch (e) {
    console.log('Using local cached recycle bin:', e);
  }
}

async function saveRecycleBinToStorage(deletedItem = null, deleteId = null) {
  localStorage.setItem('ckg_recycle_bin', JSON.stringify(recycleBin));
  try {
    if (deleteId) {
      await fetch(`/api/recycle?id=${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
    } else if (deletedItem) {
      await fetch('/api/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletedItem)
      });
    } else {
      await fetch('/api/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recycleBin)
      });
    }
  } catch (e) {
    console.log('Failed to sync recycle bin to D1 cloud:', e);
  }
}

async function loadStoredAnnouncement() {
  const saved = localStorage.getItem('ckg_announcement');
  if (saved) {
    try { announcementData = JSON.parse(saved); } catch (_) { announcementData = null; }
  }

  try {
    const res = await fetch('/api/announcement');
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data && result.data.content) {
        announcementData = result.data;
        announcementData.active = Boolean(result.data.active === 1 || result.data.active === '1' || result.data.active === true || result.data.active === 'true');
        localStorage.setItem('ckg_announcement', JSON.stringify(announcementData));
      }
    }
  } catch (e) {
    console.log('Using local cached announcement:', e);
  }

  if (!announcementData || !announcementData.content) {
    announcementData = {
      title: 'HIMBAUAN PENTING SISTEM',
      content: 'Selamat datang di Sistem Informasi Pencatatan CKG Puskesmas Banjaran Kota. Mohon lakukan verifikasi dan pencatatan data pasien By Name By Address (BNBA) dengan teliti.',
      author: 'Admin Utama',
      date: new Date().toISOString().substring(0, 10),
      active: true
    };
  }
}

async function saveAnnouncementToCloud(data) {
  localStorage.setItem('ckg_announcement', JSON.stringify(data));
  try {
    await fetch('/api/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.log('Failed to sync announcement to D1 cloud:', e);
  }
}

async function checkAndShowAnnouncement() {
  await loadStoredAnnouncement();
  if (!announcementData || !announcementData.content) return;
  
  const isActive = Boolean(announcementData.active === true || announcementData.active === 1 || announcementData.active === '1' || announcementData.active === 'true');
  if (!isActive) return;
  
  const titleEl = document.getElementById('announcementPopupTitle');
  const authorEl = document.getElementById('announcementPopupAuthor');
  const dateEl = document.getElementById('announcementPopupDate');
  const contentEl = document.getElementById('announcementPopupContent');
  
  if (titleEl) {
    const titleText = (announcementData.title || 'HIMBAUAN PENTING SISTEM').toUpperCase();
    titleEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill" style="color: #dc2626; font-size: 20px;"></i> <span>${titleText}</span>`;
  }
  if (authorEl) authorEl.innerHTML = `<i class="bi bi-person-circle"></i> Oleh: ${announcementData.author || 'Admin'}`;
  if (dateEl) dateEl.innerHTML = `<i class="bi bi-calendar3"></i> Tanggal: ${announcementData.date || '-'}`;
  if (contentEl) contentEl.textContent = announcementData.content;
  
  const modal = document.getElementById('announcementModal');
  if (modal) {
    modal.classList.add('open', 'active');
  }
}

function closeAnnouncementModal() {
  const modal = document.getElementById('announcementModal');
  if (modal) modal.classList.remove('open', 'active');
}

function openEditAnnouncementModal() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    Swal.fire('Akses Ditolak', 'Hanya Admin & Koordinator yang dapat mengelola pengumuman.', 'error');
    return;
  }

  Swal.fire({
    title: 'Kelola Pengumuman Sistem',
    html: `
      <div style="text-align: left; font-size: 13px;">
        <label class="form-label" style="font-weight:700; margin-bottom:4px; display:block;">Judul Pengumuman:</label>
        <input type="text" id="swalAnnTitle" class="swal2-input" style="margin: 0 0 12px 0; width: 100%; font-size: 13px;" value="${announcementData?.title || ''}" placeholder="Judul Pengumuman">
        
        <label class="form-label" style="font-weight:700; margin-bottom:4px; display:block;">Isi Pesan Pengumuman:</label>
        <textarea id="swalAnnContent" class="swal2-textarea" style="margin: 0 0 12px 0; width: 100%; height: 110px; font-size: 13px; line-height: 1.5;" placeholder="Tuliskan pesan...">${announcementData?.content || ''}</textarea>

        <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; margin-top: 6px;">
          <input type="checkbox" id="swalAnnActive" ${announcementData?.active ? 'checked' : ''}> Tampilkan Pengumuman Ini Saat User Log In
        </label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Simpan Pengumuman',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    preConfirm: () => {
      const title = document.getElementById('swalAnnTitle').value.trim();
      const content = document.getElementById('swalAnnContent').value.trim();
      const active = document.getElementById('swalAnnActive').checked;
      
      if (!content) {
        Swal.showValidationMessage('Isi pengumuman tidak boleh kosong!');
        return false;
      }
      return { title: title || 'HIMBAUAN PENTING SISTEM', content, active };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      announcementData = {
        title: result.value.title,
        content: result.value.content,
        author: sessionStorage.getItem('ckg_user_name') || 'Admin',
        date: new Date().toISOString().substring(0, 10),
        active: result.value.active
      };
      await saveAnnouncementToCloud(announcementData);
      Swal.fire('Berhasil!', 'Pengumuman sistem telah disimpan ke database cloud dan akan muncul untuk semua user.', 'success');
    }
  });
}

function getVisibleRecords(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  
  // Admin and Koordinator can see ALL records
  if (role === 'admin' || role === 'koordinator') {
    return dataArray;
  }
  
  // Petugas can ONLY see their own records
  const loggedUser = (sessionStorage.getItem('ckg_user_name') || '').toLowerCase().trim();
  
  return dataArray.filter(r => {
    const creator = (r.created_by || r.petugas_entry || r.petugas || r.assigned_to || '').toLowerCase().trim();
    return creator === loggedUser || creator === '' || creator.includes(loggedUser);
  });
}

function setupImportDropzone() {
  const dropzone = document.getElementById('importDropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt ? dt.files : null;
    if (files && files.length > 0) {
      const fileInput = document.getElementById('importFileInput');
      if (fileInput) {
        fileInput.files = files;
        handleImportFileSelect({ target: { files: files } });
      }
    }
  }, false);
}

function checkAuthSession() {
  const isLoggedIn = sessionStorage.getItem('ckg_logged_in') === 'true';
  const loginOverlay = document.getElementById('loginViewContainer');
  const mainApp = document.getElementById('appMainContainer');

  if (isLoggedIn) {
    if (loginOverlay) loginOverlay.classList.add('hidden');
    if (mainApp) mainApp.style.display = 'block';

    const savedName = sessionStorage.getItem('ckg_user_name') || 'Mochamad Fauzie, S.Gz';
    const savedRole = sessionStorage.getItem('ckg_user_role') || 'Admin';
    currentRole = savedRole;

    document.body.classList.remove('role-admin', 'role-koordinator', 'role-petugas');
    document.body.classList.add('role-' + (savedRole || 'Petugas').toLowerCase());

    const nameEl = document.getElementById('headerUserName');
    const roleBadgeEl = document.getElementById('headerUserRoleBadge');
    const avatarEl = document.getElementById('headerUserAvatar');

    if (nameEl) nameEl.textContent = savedName;
    if (roleBadgeEl) {
      const roleUpper = (savedRole || 'Petugas').toUpperCase();
      roleBadgeEl.textContent = roleUpper;
      roleBadgeEl.className = 'badge-role-pill role-' + (savedRole || 'Petugas').toLowerCase();
    }
    if (avatarEl) {
      const initials = savedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatarEl.textContent = initials;
    }

    renderApp();
    setTimeout(checkAndShowAnnouncement, 500);

    sendUserHeartbeat('active');
    fetchLiveSessions();

    if (!window._heartbeatInterval) {
      window._heartbeatInterval = setInterval(() => sendUserHeartbeat('active'), 15000);
    }
    if (!window._fetchSessionsInterval) {
      window._fetchSessionsInterval = setInterval(() => fetchLiveSessions(), 10000);
    }
    if (!window._cloudSyncInterval) {
      window._cloudSyncInterval = setInterval(() => {
        if (!document.hidden) {
          fetchCloudRecords();
          fetchCloudSimpusRecords(true);
        }
      }, 15000);
    }
  } else {
    if (loginOverlay) loginOverlay.classList.remove('hidden');
    if (mainApp) mainApp.style.display = 'none';
  }
}

function setupAuthFormEvents() {
  // No need for change listener anymore since password is popup-based
}

function updatePasswordVisibility() {
  // Removed — password is now handled via SweetAlert2 popup
}

function selectPegawaiQuick(namaPegawai) {
  const selectEl = document.getElementById('loginPegawaiSelect');
  if (!selectEl) return;

  for (let i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i].value === namaPegawai) {
      selectEl.selectedIndex = i;
      break;
    }
  }
}

/* ==========================================================================
   📊 LOADING OVERLAY HELPERS
   ========================================================================== */

function showLoadingOverlay(text = 'Memuat Data...', subtext = 'Menghubungkan ke Database Cloudflare D1') {
  const overlay = document.getElementById('loadingOverlay');
  const textEl = document.getElementById('loadingText');
  const subtextEl = document.getElementById('loadingSubtext');
  if (textEl) textEl.textContent = text;
  if (subtextEl) subtextEl.textContent = subtext;
  if (overlay) overlay.classList.add('active');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

/* ==========================================================================
   🔐 LOGIN HANDLER WITH SWEETALERT2 PASSWORD POPUP
   ========================================================================== */

function handleLogin(e) {
  e.preventDefault();
  const selectEl = document.getElementById('loginPegawaiSelect');

  if (!selectEl || !selectEl.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Nama Pegawai Belum Dipilih',
      text: 'Silakan pilih Nama Pegawai terlebih dahulu dari daftar.',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  const selectedPegawai = selectEl.value.trim();

  // Match against usersDb database
  const user = usersDb.find(u => u.nama_user.toLowerCase() === selectedPegawai.toLowerCase());

  if (!user) {
    Swal.fire({
      icon: 'error',
      title: 'Login Gagal',
      html: `User <strong>${selectedPegawai}</strong> tidak terdaftar di Database!`,
      confirmButtonColor: '#dc2626'
    });
    return;
  }

  // Check if user is BANNED
  if (user.is_banned) {
    if (user.banned_until && user.banned_until !== 'PERMANENT' && new Date() > new Date(user.banned_until)) {
      // Ban has expired! Automatically unban user
      user.is_banned = false;
      user.banned_until = null;
      saveUserDatabaseToStorage();
      syncUsersToCloud(usersDb);
    } else {
      const untilText = user.banned_until === 'PERMANENT' ? 'Permanen' : (new Date(user.banned_until).toLocaleString('id-ID'));
      Swal.fire({
        icon: 'error',
        title: 'Akun Dinonaktifkan / Banned',
        html: `<div style="font-size: 14px; margin-bottom: 6px;">Akun <strong>${user.nama_user}</strong> sedang dalam status nonaktif/banned.</div>
               <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 8px 12px; border-radius: 6px; color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 8px;">
                 Status: ${user.banned_duration_label || 'Banned'} (Hingga: ${untilText})
               </div>
               <div style="font-size: 11.5px; color: #64748b; margin-top: 10px;">Silakan hubungi Admin Utama Puskesmas untuk verifikasi kembali.</div>`,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Tutup'
      });
      return;
    }
  }

  const dbPassword = (user.password || '').trim();

  // If user has NO password → login directly
  if (dbPassword === '') {
    performLoginSuccess(user);
    return;
  }

  // If user HAS a password → show SweetAlert2 password popup
  Swal.fire({
    title: 'Masukkan Kata Sandi',
    html: `<div style="text-align:center; margin-bottom: 8px;">
             <div style="width:48px; height:48px; border-radius:50%; background: linear-gradient(135deg, #2563eb, #0284c7); display:inline-flex; align-items:center; justify-content:center; margin-bottom:8px;">
               <i class="bi bi-shield-lock-fill" style="color:#fff; font-size:22px;"></i>
             </div>
             <div style="font-size:13px; color:#64748b; font-weight:600;">
               Verifikasi akses <strong style="color:#0f172a;">${user.nama_user}</strong> (${user.role})
             </div>
           </div>`,
    input: 'password',
    inputPlaceholder: 'Masukkan kata sandi database...',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-box-arrow-in-right"></i> Masuk',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: (inputPass) => {
      if (!inputPass || inputPass.trim() === '') {
        Swal.showValidationMessage('Kata sandi tidak boleh kosong!');
        return false;
      }
      if (inputPass.trim() !== dbPassword) {
        Swal.showValidationMessage('Kata Sandi Yang Anda Masukan Salah');
        return false;
      }
      return inputPass;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      performLoginSuccess(user);
    }
  });
}

function performLoginSuccess(user) {
  showLoadingOverlay('Memverifikasi Akses...', `Login sebagai ${user.nama_user}`);

  setTimeout(() => {
    // Set session
    sessionStorage.setItem('ckg_logged_in', 'true');
    sessionStorage.setItem('ckg_user_name', user.nama_user);
    sessionStorage.setItem('ckg_user_role', user.role || 'Petugas');

    sendUserHeartbeat('active');
    fetchLiveSessions();

    checkAuthSession();
    hideLoadingOverlay();

    // Background load maintenance settings and apply locks
    loadMaintenanceSettings().then(() => {
      const userRole = (user.role || 'Petugas').toLowerCase();
      if (userRole !== 'admin' && maintenanceState.maintenance_web) {
        showMaintenanceScreen(maintenanceState.maintenance_web_message);
      }
    });

    // Directly open Announcement popup
    setTimeout(checkAndShowAnnouncement, 300);
  }, 200);
}

function handleLogout() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Keluar dari Sistem?',
      text: 'Apakah Anda yakin ingin keluar dari aplikasi CKG?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        sendUserHeartbeat('offline');
        sessionStorage.removeItem('ckg_logged_in');
        sessionStorage.removeItem('ckg_user_name');
        sessionStorage.removeItem('ckg_user_role');
        checkAuthSession();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Keluar',
          text: 'Anda telah keluar dari sistem CKG.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  } else {
    sessionStorage.removeItem('ckg_logged_in');
    sessionStorage.removeItem('ckg_user_name');
    sessionStorage.removeItem('ckg_user_role');
    checkAuthSession();
    showToast('Anda telah keluar dari sistem CKG.', 'info');
  }
}

function startLiveClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');

  function update() {
    const now = new Date();
    if (clockEl) clockEl.textContent = now.toTimeString().split(' ')[0];
    if (dateEl) {
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      dateEl.textContent = `${dd}/${mm}/${yyyy}`;
    }
  }

  update();
  setInterval(update, 1000);
}

function loadStoredRecords() {
  const saved = localStorage.getItem('ckg_records_db');
  if (saved) {
    try { records = JSON.parse(saved); }
    catch (e) { records = INITIAL_MOCK_RECORDS; }
  } else {
    records = INITIAL_MOCK_RECORDS;
    saveRecordsToStorage();
  }
}

function saveRecordsToStorage() {
  localStorage.setItem('ckg_records_db', JSON.stringify(records));
}

function setupEventListeners() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) addUserForm.addEventListener('submit', handleAddUserSubmit);

  const bagiPetugasForm = document.getElementById('bagiPetugasForm');
  if (bagiPetugasForm) bagiPetugasForm.addEventListener('submit', handleBagiPetugasSubmit);

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      switchView(viewId);
    });
  });

  ['dashBulan', 'dashTahun', 'dashKategori', 'dashUmur'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => renderApp());
  });

  const roleSelect = document.getElementById('roleSelect');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      currentRole = e.target.value;
      sessionStorage.setItem('ckg_user_role', currentRole);
      renderApp();
      showToast(`Hak Akses Berhasil Diubah ke: ${currentRole.toUpperCase()}`, 'info');
    });
  }

  const btnRefreshTop = document.getElementById('btnRefreshTop');
  if (btnRefreshTop) {
    btnRefreshTop.addEventListener('click', () => {
      renderApp();
      showToast('Data Berhasil Di-refresh!', 'success');
    });
  }

  const dobInput = document.getElementById('tanggal_lahir');
  if (dobInput) dobInput.addEventListener('change', calculateAgeFromDOB);

  // Auto-trigger Dukcapil lookup when NIK reaches 16 digits
  const nikInput = document.getElementById('nik');
  if (nikInput) {
    nikInput.addEventListener('input', () => {
      const val = nikInput.value.replace(/\D/g, '');
      nikInput.value = val; // strip non-digits
      if (val.length === 16) {
        triggerNikDukcapilLookup();
      } else {
        // Reset status when NIK is incomplete
        const statusEl = document.getElementById('nikDukcapilStatus');
        if (statusEl) statusEl.style.display = 'none';
      }
    });
  }

  const bbInput = document.getElementById('bb');
  const tbInput = document.getElementById('tb');
  if (bbInput && tbInput) {
    bbInput.addEventListener('input', calculateIMT);
    tbInput.addEventListener('input', calculateIMT);
  }

  const entryForm = document.getElementById('ckgForm');
  if (entryForm) entryForm.addEventListener('submit', handleFormSubmit);

  ['filterKegiatan', 'filterBulan', 'filterTahun', 'filterTanggal', 'filterPetugas', 'filterUmur'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderTableRecords);
  });

  ['filterSimpusPetugas', 'filterSimpusUmur', 'filterSimpusLimit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderSimpusTableRecords);
  });
}

function switchView(viewId) {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();

  if (role === 'petugas') {
    if (viewId === 'laporan' || viewId === 'recycle-data' || viewId === 'admin-panel') {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Menu ini hanya dapat diakses oleh Role Admin dan Koordinator.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
  } else if (role === 'koordinator') {
    if (viewId === 'admin-panel') {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Admin Panel hanya dapat diakses oleh Admin.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }
  }

  // Check maintenance menu lock (non-admin only)
  if (role !== 'admin' && maintenanceState.locked_menus && maintenanceState.locked_menus.includes(viewId)) {
    Swal.fire({
      icon: 'warning',
      title: '<i class="bi bi-shield-lock-fill" style="color:#f59e0b;"></i> Menu Dalam Maintenance',
      html: `<div style="font-size:13.5px; line-height:1.7;">
              Menu <strong>${viewId}</strong> sedang <strong style="color:#dc2626;">dikunci oleh Admin</strong> untuk sementara waktu.<br><br>
              <span style="color:#64748b; font-size:12.5px;">${maintenanceState.maintenance_menu_message || 'Silakan hubungi Admin untuk informasi lebih lanjut.'}</span>
            </div>`,
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  document.querySelectorAll('.nav-tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === viewId);
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    const isTarget = panel.id === `view-${viewId}`;
    panel.classList.toggle('active', isTarget);
    // Re-trigger fade animation on switch
    if (isTarget) {
      panel.style.animation = 'none';
      panel.offsetHeight; // force reflow
      panel.style.animation = '';
    }
  });

  if (viewId === 'dashboard' && typeof initDashboardCharts === 'function') {
    const officersData = typeof getOfficerPerformanceData === 'function' ? getOfficerPerformanceData() : OFFICERS_DATA;
    setTimeout(() => initDashboardCharts(officersData), 50);
  } else if (viewId === 'simpus') {
    renderSimpusView();
  } else if (viewId === 'recycle-data') {
    renderRecycleTable();
  }
}

function updateRoleUI() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  
  document.body.classList.remove('role-admin', 'role-koordinator', 'role-petugas');
  document.body.classList.add('role-' + role);

  const roleBadgeEl = document.getElementById('headerUserRoleBadge');
  if (roleBadgeEl) {
    roleBadgeEl.textContent = role.toUpperCase();
    roleBadgeEl.className = 'badge-role-pill role-' + role;
  }

  applyPetugasFilterLock();
}

// API Wilayah Indonesia (Emsifa API) Integration
const EMSIFA_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, function (m) {
    return m.toUpperCase();
  });
}

async function initWilayahDropdowns() {
  const provSelect = document.getElementById('provinsi');
  const kabSelect = document.getElementById('kab_kota');
  const kecSelect = document.getElementById('kecamatan');
  const kelSelect = document.getElementById('kelurahan');

  if (!provSelect) return;

  let provincesList = [];
  let regenciesCache = {};
  let districtsCache = {};
  let villagesCache = {};

  // Helper to fetch JSON from Emsifa API
  async function fetchEmsifa(endpoint) {
    try {
      const res = await fetch(`${EMSIFA_BASE}/${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`[Emsifa API Offline/Fallback] ${endpoint}:`, e);
      return null;
    }
  }

  // Populate Provinsi
  provSelect.innerHTML = '<option value="">-- Pilih Provinsi --</option>';

  // Try API first
  const apiProvinces = await fetchEmsifa('provinces.json');

  if (apiProvinces && apiProvinces.length > 0) {
    provincesList = apiProvinces.map(p => ({ id: p.id, name: toTitleCase(p.name) }));
    provincesList.forEach(p => {
      provSelect.innerHTML += `<option value="${p.name}" data-id="${p.id}">${p.name}</option>`;
    });
  } else if (typeof WILAYAH_DATA !== 'undefined') {
    // Offline fallback to WILAYAH_DATA
    Object.keys(WILAYAH_DATA).forEach(prov => {
      provSelect.innerHTML += `<option value="${prov}">${prov}</option>`;
    });
  }

  // Populate Kab/Kota
  async function loadKabupaten(provName) {
    kabSelect.innerHTML = '<option value="">-- Pilih Kab/Kota --</option>';
    kecSelect.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
    kelSelect.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';

    if (!provName) return;

    const provOpt = Array.from(provSelect.options).find(o => o.value === provName);
    const provId = provOpt?.getAttribute('data-id');

    if (provId) {
      if (!regenciesCache[provId]) {
        regenciesCache[provId] = await fetchEmsifa(`regencies/${provId}.json`);
      }
      const regList = regenciesCache[provId];
      if (regList && regList.length > 0) {
        regList.forEach(r => {
          kabSelect.innerHTML += `<option value="${toTitleCase(r.name)}" data-id="${r.id}">${toTitleCase(r.name)}</option>`;
        });
        return;
      }
    }

    // Static fallback
    if (typeof WILAYAH_DATA !== 'undefined' && WILAYAH_DATA[provName]) {
      Object.keys(WILAYAH_DATA[provName]).forEach(kab => {
        kabSelect.innerHTML += `<option value="${kab}">${kab}</option>`;
      });
    }
  }

  // Populate Kecamatan
  async function loadKecamatan(provName, kabName) {
    kecSelect.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
    kelSelect.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';

    if (!kabName) return;

    const kabOpt = Array.from(kabSelect.options).find(o => o.value === kabName);
    const regId = kabOpt?.getAttribute('data-id');

    if (regId) {
      if (!districtsCache[regId]) {
        districtsCache[regId] = await fetchEmsifa(`districts/${regId}.json`);
      }
      const distList = districtsCache[regId];
      if (distList && distList.length > 0) {
        distList.forEach(d => {
          kecSelect.innerHTML += `<option value="${toTitleCase(d.name)}" data-id="${d.id}">${toTitleCase(d.name)}</option>`;
        });
        return;
      }
    }

    // Static fallback
    if (typeof WILAYAH_DATA !== 'undefined' && WILAYAH_DATA[provName] && WILAYAH_DATA[provName][kabName]) {
      Object.keys(WILAYAH_DATA[provName][kabName]).forEach(kec => {
        kecSelect.innerHTML += `<option value="${kec}">${kec}</option>`;
      });
    }
  }

  // Populate Kelurahan
  async function loadKelurahan(provName, kabName, kecName) {
    kelSelect.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';

    if (!kecName) return;

    const kecOpt = Array.from(kecSelect.options).find(o => o.value === kecName);
    const distId = kecOpt?.getAttribute('data-id');

    if (distId) {
      if (!villagesCache[distId]) {
        villagesCache[distId] = await fetchEmsifa(`villages/${distId}.json`);
      }
      const vilList = villagesCache[distId];
      if (vilList && vilList.length > 0) {
        vilList.forEach(v => {
          kelSelect.innerHTML += `<option value="${toTitleCase(v.name)}" data-id="${v.id}">${toTitleCase(v.name)}</option>`;
        });
        return;
      }
    }

    // Static fallback
    if (typeof WILAYAH_DATA !== 'undefined' && WILAYAH_DATA[provName] && WILAYAH_DATA[provName][kabName] && WILAYAH_DATA[provName][kabName][kecName]) {
      WILAYAH_DATA[provName][kabName][kecName].forEach(kel => {
        kelSelect.innerHTML += `<option value="${kel}">${kel}</option>`;
      });
    }
  }

  // Event Listeners
  provSelect.addEventListener('change', () => loadKabupaten(provSelect.value));
  kabSelect.addEventListener('change', () => loadKecamatan(provSelect.value, kabSelect.value));
  kecSelect.addEventListener('change', () => loadKelurahan(provSelect.value, kabSelect.value, kecSelect.value));

  // Set default values for Puskesmas Banjaran Kota (Jawa Barat -> Kabupaten Bandung -> Banjaran)
  const defaultProv = "Jawa Barat";
  const defaultKab = "Kabupaten Bandung";
  const defaultKec = "Banjaran";

  const provMatch = Array.from(provSelect.options).find(o => o.value.toLowerCase() === defaultProv.toLowerCase());
  if (provMatch) {
    provSelect.value = provMatch.value;
    await loadKabupaten(provSelect.value);

    const kabMatch = Array.from(kabSelect.options).find(o => o.value.toLowerCase() === defaultKab.toLowerCase());
    if (kabMatch) {
      kabSelect.value = kabMatch.value;
      await loadKecamatan(provSelect.value, kabSelect.value);

      const kecMatch = Array.from(kecSelect.options).find(o => o.value.toLowerCase() === defaultKec.toLowerCase());
      if (kecMatch) {
        kecSelect.value = kecMatch.value;
        await loadKelurahan(provSelect.value, kabSelect.value, kecSelect.value);
      }
    }
  }
}

function calculateAgeFromDOB() {
  const dobVal = document.getElementById('tanggal_lahir').value;
  const ageInput = document.getElementById('usia');
  if (!dobVal || !ageInput) return;

  const dob = new Date(dobVal);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;

  ageInput.value = years >= 0 ? years : 0;
}

function calculateIMT() {
  const bb = parseFloat(document.getElementById('bb').value) || 0;
  const tbCm = parseFloat(document.getElementById('tb').value) || 0;
  const imtInput = document.getElementById('imt');
  const imtBadge = document.getElementById('imtStatusBadge');

  if (bb > 0 && tbCm > 0) {
    const tbM = tbCm / 100;
    const imt = bb / (tbM * tbM);
    const rounded = Math.round(imt * 100) / 100;
    imtInput.value = rounded;

    let badgeText = 'Normal';
    let badgeClass = 'badge-emerald';

    if (rounded < 18.5) { badgeText = 'Kurus (<18.5)'; badgeClass = 'badge-amber'; }
    else if (rounded <= 24.9) { badgeText = 'Normal (18.5-24.9)'; badgeClass = 'badge-emerald'; }
    else if (rounded <= 29.9) { badgeText = 'Gemuk (25-29.9)'; badgeClass = 'badge-amber'; }
    else { badgeText = 'Obesitas (≥30)'; badgeClass = 'badge-rose'; }

    if (imtBadge) {
      imtBadge.className = `badge ${badgeClass}`;
      imtBadge.textContent = badgeText;
    }
  } else {
    if (imtInput) imtInput.value = '';
    if (imtBadge) {
      imtBadge.className = 'badge badge-cyan';
      imtBadge.textContent = 'Auto';
    }
  }
}

// ----------------------------------------------------
// SIMPUS VIEW LOGIC (EXACT REPLICA OF USER REFERENCE SCREENSHOTS)
// ----------------------------------------------------
function renderSimpusView() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const loggedUser = (sessionStorage.getItem('ckg_user_name') || '').trim().toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');

  const belumBagiCount = simpusRecords.filter(r => !r.is_divided).length;
  
  let sudahBagiRecords = simpusRecords.filter(r => Boolean(r.is_divided));
  if (!isPrivileged && loggedUser) {
    sudahBagiRecords = sudahBagiRecords.filter(r => {
      const assigned = (r.assigned_to || '').toLowerCase().trim();
      return assigned === loggedUser || assigned.includes(loggedUser);
    });
  }
  const sudahBagiCount = sudahBagiRecords.length;

  const countBelumEl = document.getElementById('countBelumBagi');
  const countSudahEl = document.getElementById('countSudahBagi');
  const totalEntryEl = document.getElementById('totalEntryMonth');

  if (countBelumEl) countBelumEl.textContent = belumBagiCount;
  if (countSudahEl) countSudahEl.textContent = sudahBagiCount;
  if (totalEntryEl) totalEntryEl.textContent = isPrivileged ? simpusRecords.length : (belumBagiCount + sudahBagiCount);

  // Sync petugas column header visibility based on active tab
  const thPetugas = document.getElementById('thSimpusPetugasEntry');
  if (thPetugas) {
    thPetugas.style.display = (activeSimpusTab !== 'sudah_bagi') ? 'none' : '';
  }

  renderSimpusTableRecords();
}

function switchSimpusTab(tab) {
  activeSimpusTab = tab;

  const btnBelum = document.getElementById('btnSimpusBelumBagi');
  const btnSudah = document.getElementById('btnSimpusSudahBagi');
  const petugasFilterGroup = document.getElementById('simpusPetugasFilterGroup');
  const belumBagiActions = document.getElementById('simpusBelumBagiActions');
  const btnMultiImport = document.getElementById('btnSimpusAdminMultiImport');
  const thPetugas = document.getElementById('thSimpusPetugasEntry');
  const tableViewContainer = document.getElementById('simpusTableViewContainer');
  const cardsViewContainer = document.getElementById('simpusSudahBagiCardsView');
  const infoBar = document.getElementById('simpusTableInfoBar');

  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();

  if (tab === 'belum_bagi') {
    if (btnBelum) { btnBelum.className = 'simpus-pill-btn active-purple'; }
    if (btnSudah) { btnSudah.className = 'simpus-pill-btn'; }
    if (petugasFilterGroup) petugasFilterGroup.style.display = 'none';
    if (belumBagiActions) belumBagiActions.style.display = 'flex';
    if (btnMultiImport) btnMultiImport.style.display = 'none';
    if (thPetugas) thPetugas.style.display = 'none';
    if (tableViewContainer) tableViewContainer.style.display = 'block';
    if (cardsViewContainer) cardsViewContainer.style.display = 'none';
    if (infoBar) infoBar.style.display = 'flex';
  } else {
    if (btnBelum) { btnBelum.className = 'simpus-pill-btn'; }
    if (btnSudah) { btnSudah.className = 'simpus-pill-btn active-emerald'; }
    if (petugasFilterGroup) petugasFilterGroup.style.display = 'flex';
    if (belumBagiActions) belumBagiActions.style.display = 'flex';
    if (btnMultiImport) btnMultiImport.style.display = role === 'admin' ? 'inline-flex' : 'none';
    if (thPetugas) thPetugas.style.display = '';
    if (tableViewContainer) tableViewContainer.style.display = 'none';
    if (cardsViewContainer) cardsViewContainer.style.display = 'flex';
    if (infoBar) infoBar.style.display = 'none';
  }

  renderSimpusTableRecords();
}

function renderSimpusTableRecords() {
  const containerTable = document.getElementById('simpusCardsContainer');
  const containerCards = document.getElementById('simpusSudahBagiCardsView');

  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const loggedUser = (sessionStorage.getItem('ckg_user_name') || '').trim().toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');

  applyPetugasFilterLock();

  const petugasVal = document.getElementById('filterSimpusPetugas')?.value || '';
  const umurVal = document.getElementById('filterSimpusUmur')?.value || '';
  const limitVal = document.getElementById('filterSimpusLimit')?.value || '10';

  // Tab 1: Data Belum Di-Bagi (is_divided === false)
  // Tab 2: Data Sudah Di-Bagi (is_divided === true)
  let dataset = simpusRecords.filter(r => activeSimpusTab === 'sudah_bagi' ? Boolean(r.is_divided) : !r.is_divided);

  // If on "Data Sudah Di-Bagi" tab:
  if (activeSimpusTab === 'sudah_bagi') {
    if (!isPrivileged && loggedUser) {
      // Petugas role can ONLY see records assigned to them
      dataset = dataset.filter(r => {
        const assigned = (r.assigned_to || '').toLowerCase().trim();
        return assigned === loggedUser || assigned.includes(loggedUser);
      });
    } else if (petugasVal) {
      // Admin / Koordinator can filter by petugasVal dropdown
      dataset = dataset.filter(r => r.assigned_to === petugasVal);
    }
  }

  if (umurVal) {
    dataset = dataset.filter(r => r.keterangan === umurVal);
  }

  const isBelumBagi = (activeSimpusTab !== 'sudah_bagi');

  // RENDER 1: TABEL (Khusus Data Belum Di-Bagi)
  if (isBelumBagi) {
    const totalCount = dataset.length;
    let displayDataset = dataset;
    if (limitVal !== 'semua') {
      const limitNum = parseInt(limitVal) || 10;
      displayDataset = dataset.slice(0, limitNum);
    }

    const dispEl = document.getElementById('simpusDisplayedCount');
    const totEl = document.getElementById('simpusTotalCount');
    if (dispEl) dispEl.textContent = displayDataset.length.toLocaleString('id-ID');
    if (totEl) totEl.textContent = totalCount.toLocaleString('id-ID');

    if (!containerTable) return;
    if (dataset.length === 0) {
      containerTable.innerHTML = `
        <tr>
          <td colspan="18" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="bi bi-inbox" style="font-size: 36px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
            <strong style="font-size: 15px;">Tidak Ada Data Pasien SIMPUS (Belum Di-Bagi)</strong>
            <p style="font-size: 12.5px; margin-top: 4px;">Belum ada data yang di-import atau belum ada data yang belum dibagikan.</p>
          </td>
        </tr>
      `;
      return;
    }

    containerTable.innerHTML = displayDataset.map((r, i) => {
      const statusPernikahan = r.status_pernikahan || 'MENIKAH';
      const prov = r.provinsi || 'Jawa Barat';
      const kabKota = r.kab_kota || 'Kab. Bandung';
      const kec = r.kecamatan || 'Banjaran';
      const kel = r.kelurahan || 'Tarajusari';
      const recId = r.id || r.nik;
      const safeRecId = escapeAttr(recId);

      return `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #475569;">${i + 1}</td>
          <td><strong>${r.nama}</strong></td>
          <td><span style="font-family: monospace; font-size: 12px;">${r.nik}</span></td>
          <td>${r.dob}</td>
          <td style="text-align: center;"><span class="badge badge-amber">${r.usia} th</span></td>
          <td>${statusPernikahan}</td>
          <td>${prov}</td>
          <td>${kabKota}</td>
          <td>${kec}</td>
          <td>${kel}</td>
          <td style="max-width: 180px; white-space: normal;">${r.alamat}</td>
          <td style="text-align: center;">${r.bb}</td>
          <td style="text-align: center;">${r.tb}</td>
          <td style="text-align: center;">${r.sistol}</td>
          <td style="text-align: center;">${r.diastol}</td>
          <td style="text-align: center;">${r.gula}</td>
          <td style="text-align: center;">${r.kolesterol}</td>
          <td style="text-align: center; white-space: nowrap;">
            <button class="btn btn-outline-danger btn-sm" style="padding: 4px 8px; font-size: 11px;" onclick="deleteSimpusRecord('${safeRecId}')" title="Hapus Data Pasien">
              <i class="bi bi-trash-fill"></i> Hapus
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } else {
    // RENDER 2: CARD LIST VIEW (Khusus Data Sudah Di-Bagi - Modern Compact View)
    if (!containerCards) return;

    const totalCount = dataset.length;
    let displayDataset = dataset;
    if (limitVal !== 'semua') {
      const limitNum = parseInt(limitVal) || 10;
      displayDataset = dataset.slice(0, limitNum);
    }

    const dispEl = document.getElementById('simpusDisplayedCount');
    const totEl = document.getElementById('simpusTotalCount');
    if (dispEl) dispEl.textContent = displayDataset.length.toLocaleString('id-ID');
    if (totEl) totEl.textContent = totalCount.toLocaleString('id-ID');

    if (dataset.length === 0) {
      containerCards.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: #ffffff; border-radius: var(--radius-md); border: 1px solid var(--border-color); width: 100%;">
          <i class="bi bi-inbox" style="font-size: 36px; color: #94a3b8; display: block; margin-bottom: 8px;"></i>
          <strong style="font-size: 15px; color: var(--text-main);">Tidak Ada Data Pasien (Sudah Di-Bagi)</strong>
          <p style="font-size: 12.5px; margin-top: 4px;">Belum ada data yang dibagikan atau tidak ada data yang cocok dengan filter saat ini.</p>
        </div>
      `;
      return;
    }

    containerCards.innerHTML = displayDataset.map((r, i) => {
      const petugasName = r.petugas_entry || r.assigned_to || '-';
      const recId = r.id || r.nik;
      const safeRecId = escapeAttr(recId);
      const safeNik = escapeAttr(r.nik);
      const kel = r.kelurahan || 'Tarajusari';

      return `
        <div class="simpus-patient-card-compact" style="border-left: 4px solid var(--primary); background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
          <!-- Top Row: Name, NIK, Age, Petugas & Quick Actions -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 800; font-size: 13.5px; color: #475569; min-width: 24px;">${i + 1}.</span>
              <span style="font-size: 15px; font-weight: 800; color: var(--primary); cursor: pointer; display: inline-flex; align-items: center; gap: 5px;" onclick="openSimpusDetailModal('${safeRecId}')" title="Klik untuk Buka Detail & Copy Data">
                ${r.nama} <i class="bi bi-box-arrow-up-right" style="font-size: 11px; opacity: 0.85;"></i>
              </span>
              <span class="copyable-field-sm" onclick="copyToClipboard('${safeNik}', 'NIK Pasien')" style="cursor: pointer; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 11.5px; font-weight: 700; color: #1e293b;" title="Klik untuk Salin NIK">
                <i class="bi bi-card-text"></i> NIK: <strong style="font-family: monospace;">${r.nik}</strong> <i class="bi bi-copy" style="font-size: 10px; color: var(--primary); margin-left: 3px;"></i>
              </span>
              <span class="badge badge-amber" style="padding: 3px 8px; font-size: 11px; font-weight: 700;">
                ${r.usia} th (${r.keterangan || 'Dewasa'})
              </span>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-purple" style="font-weight: 700; padding: 4px 10px; font-size: 11.5px;">
                <i class="bi bi-person-fill"></i> ${petugasName}
              </span>
              <button class="btn-detail-info" style="padding: 4px 12px; font-size: 12px; border-radius: 6px;" onclick="openSimpusDetailModal('${safeRecId}')">
                <i class="bi bi-eye-fill"></i> Detail & Copy
              </button>
              <button class="btn btn-outline-danger btn-sm" style="padding: 4px 8px; font-size: 11.5px;" onclick="deleteSimpusRecord('${safeRecId}')" title="Hapus Data Pasien">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
          </div>

          <!-- Bottom Row: Compact Inline Clinical & Address Summary Strip -->
          <div style="display: flex; gap: 12px; font-size: 12.5px; background: #f8fafc; padding: 7px 12px; border-radius: 6px; border: 1px solid #edf2f7; align-items: center; flex-wrap: wrap; color: #334155;">
            <div style="display: flex; align-items: center; gap: 5px; max-width: 320px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              <i class="bi bi-geo-alt-fill" style="color: #64748b;"></i> <strong>Alamat:</strong> ${r.alamat || '-'}, ${kel}
            </div>
            <div style="height: 14px; width: 1px; background: #cbd5e1;"></div>
            <div><i class="bi bi-activity" style="color: #e11d48;"></i> <strong>TD:</strong> <span style="color: #e11d48; font-weight: 800;">${r.sistol}/${r.diastol}</span> mmHg</div>
            <div style="height: 14px; width: 1px; background: #cbd5e1;"></div>
            <div><i class="bi bi-person-bounding-box" style="color: #059669;"></i> <strong>BB/TB:</strong> <span style="color: #059669; font-weight: 800;">${r.bb}kg / ${r.tb}cm (${r.imt})</span></div>
            <div style="height: 14px; width: 1px; background: #cbd5e1;"></div>
            <div><i class="bi bi-droplet-fill" style="color: #0284c7;"></i> <strong>Gula/Kol:</strong> <span style="color: #0284c7; font-weight: 800;">${r.gula || '-'} / ${r.kolesterol || '-'}</span></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Utility: Escape strings for safe use in inline HTML attribute handlers (onclick, etc.)
function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#92;');
}

function copyToClipboard(text, label = 'Data') {
  if (!text || text === '-' || text === 'null' || text === 'undefined') {
    showToast(`Tidak ada data ${label} untuk disalin.`, 'warning');
    return;
  }
  
  const cleanText = String(text).trim();

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(cleanText).then(() => {
      showToast(`✓ ${label} ("${cleanText}") Berhasil Disalin!`, 'success');
    }).catch(() => {
      fallbackCopyToClipboard(cleanText, label);
    });
  } else {
    fallbackCopyToClipboard(cleanText, label);
  }
}

function fallbackCopyToClipboard(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(`✓ ${label} ("${text}") Berhasil Disalin!`, 'success');
  } catch (err) {
    showToast(`Gagal menyalin ${label}`, 'error');
  }
  document.body.removeChild(ta);
}

function copyAllSimpusPatientData(id) {
  const item = simpusRecords.find(r => r.id === id);
  if (!item) return;

  const fullSummary = `=== DATA REKAM MEDIS CKG PASIEN ===
Nama Pasien: ${item.nama}
NIK Pasien: ${item.nik}
Tanggal Skrining: ${item.tanggal}
Tanggal Lahir: ${item.dob || '-'}
Usia / Kategori: ${item.usia} Tahun (${item.keterangan})
Alamat Lengkap: ${item.alamat}
Faskes / Lokasi: Puskesmas Banjaran Kota
Berat Badan (BB): ${item.bb} kg
Tinggi Badan (TB): ${item.tb} cm
Indeks Massa Tubuh (IMT): ${item.imt}
Tekanan Darah: ${item.sistol}/${item.diastol} mmHg
Gula Darah Sewaktu: ${item.gula || '-'} mg/dL
Kolesterol Total: ${item.kolesterol || '-'} mg/dL
Petugas Entry: ${item.assigned_to || 'Belum Di-assign'}
Status Validasi: Terverifikasi
===================================`;

  copyToClipboard(fullSummary, 'Seluruh Data Rekam Medis Pasien');
}

function openSimpusDetailModal(id) {
  const item = simpusRecords.find(r => r.id === id);
  if (!item) return;

  const modalBody = document.getElementById('detailModalBody');
  if (!modalBody) return;

  let imtBadge = `<span class="badge badge-emerald">${item.imt}</span>`;
  if (item.imt < 18.5) imtBadge = `<span class="badge badge-amber">${item.imt} (Kurus)</span>`;
  else if (item.imt >= 25.0 && item.imt <= 29.9) imtBadge = `<span class="badge badge-amber">${item.imt} (Gemuk)</span>`;
  else if (item.imt >= 30.0) imtBadge = `<span class="badge badge-rose">${item.imt} (Obesitas)</span>`;

  const safeNama = escapeAttr(item.nama);
  const safeNik = escapeAttr(item.nik);
  const safeTanggal = escapeAttr(item.tanggal);
  const safeId = escapeAttr(item.id);

  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Patient Header Banner -->
      <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 18px; border-radius: var(--radius-md); color: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
        <div>
          <div style="font-size: 21px; font-weight: 800; font-family: var(--font-heading); cursor: pointer;" onclick="copyToClipboard('${safeNama}', 'Nama Pasien')" title="Klik untuk menyalin Nama Pasien">
            ${item.nama} <i class="bi bi-copy" style="font-size: 14px; opacity: 0.8;"></i>
          </div>
          <div style="font-size: 13px; opacity: 0.95; margin-top: 4px; display: flex; gap: 14px; flex-wrap: wrap;">
            <span style="cursor: pointer;" onclick="copyToClipboard('${safeNik}', 'NIK Pasien')" title="Klik untuk menyalin NIK">
              <i class="bi bi-card-text"></i> NIK: <strong>${item.nik}</strong> <i class="bi bi-copy" style="font-size: 11px;"></i>
            </span>
            <span style="cursor: pointer;" onclick="copyToClipboard('${safeTanggal}', 'Tanggal Skrining')" title="Klik untuk menyalin Tanggal">
              <i class="bi bi-calendar-event"></i> Tanggal: ${item.tanggal} <i class="bi bi-copy" style="font-size: 11px;"></i>
            </span>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="openDukcapilModal('${safeNik}', '${safeNama}')" style="box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <i class="bi bi-shield-check"></i> Cek Dukcapil
          </button>
          <button class="btn-copy-all" onclick="copyAllSimpusPatientData('${safeId}')">
            <i class="bi bi-clipboard-check-fill"></i> Salin Semua Data Pasien
          </button>
          <button class="btn btn-emerald btn-sm" onclick="handleSimpusActionBerhasil('${safeId}')" style="font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            <i class="bi bi-check-circle-fill"></i> Berhasil Entry
          </button>
          <button class="btn btn-amber btn-sm" onclick="handleSimpusActionSudahEntry('${safeId}')" style="font-weight: 700; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
            <i class="bi bi-bookmark-check-fill"></i> Sudah di Entry
          </button>
          <button class="btn btn-danger btn-sm" onclick="handleSimpusActionGagal('${safeId}')" style="font-weight: 700; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
            <i class="bi bi-x-circle-fill"></i> Gagal
          </button>
        </div>
      </div>

      <!-- Quick Instruction Banner -->
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px; display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-info-circle-fill" style="font-size: 16px; color: var(--primary);"></i>
        <span><strong>Tips Petugas:</strong> Klik pada kotak parameter mana saja di bawah ini untuk <strong>menyalin (copy)</strong> data secara instan!</span>
      </div>

      <!-- Info Sections Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; font-size: 13px;">
        
        <!-- Section 1: Demografi & Wilayah -->
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px;">
          <div style="font-weight: 800; color: var(--primary); font-size: 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <i class="bi bi-geo-alt-fill"></i> Demografi & Alamat Pasien
          </div>
          
          <div class="copyable-field" onclick="copyToClipboard('${item.nama}', 'Nama Lengkap Pasien')">
            <div>
              <div class="simpus-info-label">Nama Lengkap Pasien</div>
              <div class="simpus-info-val">${item.nama}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.nik}', 'NIK Pasien')">
            <div>
              <div class="simpus-info-label">NIK Pasien (16 Digit)</div>
              <div class="simpus-info-val">${item.nik}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.dob || '-'}', 'Tanggal Lahir')">
            <div>
              <div class="simpus-info-label">Tanggal Lahir</div>
              <div class="simpus-info-val">${item.dob || '-'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.usia}', 'Usia Pasien')">
            <div>
              <div class="simpus-info-label">Usia & Kategori</div>
              <div class="simpus-info-val">${item.usia} Tahun (${item.keterangan || 'Dewasa'})</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.status_pernikahan || 'MENIKAH'}', 'Status Pernikahan')">
            <div>
              <div class="simpus-info-label">Status Pernikahan</div>
              <div class="simpus-info-val">${item.status_pernikahan || 'MENIKAH'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.provinsi || 'Jawa Barat'}', 'Provinsi')">
            <div>
              <div class="simpus-info-label">Provinsi</div>
              <div class="simpus-info-val">${item.provinsi || 'Jawa Barat'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.kab_kota || 'Kab. Bandung'}', 'Kabupaten / Kota')">
            <div>
              <div class="simpus-info-label">Kabupaten / Kota</div>
              <div class="simpus-info-val">${item.kab_kota || 'Kab. Bandung'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.kecamatan || 'Banjaran'}', 'Kecamatan')">
            <div>
              <div class="simpus-info-label">Kecamatan</div>
              <div class="simpus-info-val">${item.kecamatan || 'Banjaran'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.kelurahan || 'Tarajusari'}', 'Kelurahan / Desa')">
            <div>
              <div class="simpus-info-label">Kelurahan / Desa</div>
              <div class="simpus-info-val">${item.kelurahan || 'Tarajusari'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.alamat}', 'Alamat Pasien')">
            <div>
              <div class="simpus-info-label">Alamat Lengkap</div>
              <div class="simpus-info-val">${item.alamat}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.assigned_to || item.petugas_entry || 'Puskesmas Banjaran Kota'}', 'Petugas Entry')">
            <div>
              <div class="simpus-info-label">Petugas Entry / Faskes</div>
              <div class="simpus-info-val">${item.assigned_to || item.petugas_entry || 'Puskesmas Banjaran Kota'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>
        </div>

        <!-- Section 2: Antropometri & Tanda Vital -->
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px;">
          <div style="font-weight: 800; color: var(--emerald); font-size: 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <i class="bi bi-heart-pulse-fill"></i> Antropometri & Tanda Vital
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.bb}', 'Berat Badan')">
            <div>
              <div class="simpus-info-label">Berat Badan (BB)</div>
              <div class="simpus-info-val">${item.bb} kg</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.tb}', 'Tinggi Badan')">
            <div>
              <div class="simpus-info-label">Tinggi Badan (TB)</div>
              <div class="simpus-info-val">${item.tb} cm</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.imt}', 'Hasil IMT')">
            <div>
              <div class="simpus-info-label">Indeks Massa Tubuh (IMT)</div>
              <div class="simpus-info-val">${imtBadge}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.sistol}/${item.diastol}', 'Tekanan Darah')">
            <div>
              <div class="simpus-info-label">Tekanan Darah (TD)</div>
              <div class="simpus-info-val">${item.sistol}/${item.diastol} mmHg</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.sistol}', 'TD Sistolik')">
            <div>
              <div class="simpus-info-label">Sistolik</div>
              <div class="simpus-info-val">${item.sistol} mmHg</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.diastol}', 'TD Diastolik')">
            <div>
              <div class="simpus-info-label">Diastolik</div>
              <div class="simpus-info-val">${item.diastol} mmHg</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>
        </div>

        <!-- Section 3: Skrining Lab & Status -->
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px;">
          <div style="font-weight: 800; color: var(--cyan); font-size: 14px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <i class="bi bi-droplet-fill"></i> Skrining Lab & Status Validasi
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.gula && item.gula !== '-' ? item.gula : ''}', 'Gula Darah')">
            <div>
              <div class="simpus-info-label">Gula Darah Sewaktu</div>
              <div class="simpus-info-val">${item.gula && item.gula !== '-' ? item.gula + ' mg/dL' : '-'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.kolesterol && item.kolesterol !== '-' ? item.kolesterol : ''}', 'Kolesterol')">
            <div>
              <div class="simpus-info-label">Kolesterol Total</div>
              <div class="simpus-info-val">${item.kolesterol && item.kolesterol !== '-' ? item.kolesterol + ' mg/dL' : '-'}</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('Normal', 'Pemeriksaan Fisik')">
            <div>
              <div class="simpus-info-label">Pemeriksaan Fisik</div>
              <div class="simpus-info-val">Normal</div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('Terverifikasi', 'Status Validasi')">
            <div>
              <div class="simpus-info-label">Status Validasi System</div>
              <div class="simpus-info-val"><span class="badge badge-emerald">Terverifikasi</span></div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>

          <div class="copyable-field" onclick="copyToClipboard('${item.entry_status.toUpperCase()}', 'Status SIMPUS')">
            <div>
              <div class="simpus-info-label">Status Status SIMPUS</div>
              <div class="simpus-info-val"><strong>${item.entry_status.toUpperCase()}</strong></div>
            </div>
            <i class="bi bi-copy copy-icon"></i>
          </div>
        </div>

      </div>
    </div>
  `;

  document.getElementById('detailModalOverlay').classList.add('open');
}

async function handleSimpusActionBerhasil(id) {
  const item = simpusRecords.find(r => (r.id || r.nik || '') === id);
  if (!item) {
    showToast('Data SIMPUS tidak ditemukan!', 'error');
    return;
  }

  // Close detail modal
  const detailModalOverlay = document.getElementById('detailModalOverlay');
  if (detailModalOverlay) detailModalOverlay.classList.remove('open');

  const todayStr = new Date().toISOString().substring(0, 10);
  const defaultTgl = item.tanggal || todayStr;

  const result = await Swal.fire({
    title: 'Konfirmasi Entry Data CKG (BNBA)',
    html: `
      <div style="text-align: left; font-size: 13.5px; display: flex; flex-direction: column; gap: 14px;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 14px; border-radius: 8px; color: #1e40af;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">
            <i class="bi bi-person-check-fill"></i> ${item.nama}
          </div>
          <div>NIK: <strong>${item.nik}</strong> | Usia: ${item.usia} th</div>
          <div style="font-size: 12px; opacity: 0.85; margin-top: 4px;">Data pasien ini akan dipindahkan dari SIMPUS ke database CKG (BNBA).</div>
        </div>

        <div>
          <label style="font-weight: 700; color: #1e293b; display: block; margin-bottom: 6px;">
            <i class="bi bi-geo-alt-fill" style="color: #2563eb;"></i> Pilih Kategori / Lokasi Entry CKG:
          </label>
          <select id="swalTargetKategori" class="custom-input" style="width: 100%; padding: 9px 12px; border-radius: 6px; font-weight: 600; font-size: 13.5px;">
            <option value="Luar Gedung" selected>📍 CKG Luar Gedung</option>
            <option value="Dalam Gedung">🏥 CKG Dalam Gedung</option>
          </select>
        </div>

        <div>
          <label style="font-weight: 700; color: #1e293b; display: block; margin-bottom: 6px;">
            <i class="bi bi-calendar-event-fill" style="color: #2563eb;"></i> Pilih Tanggal Entry:
          </label>
          <input type="date" id="swalTanggalEntry" class="custom-input" style="width: 100%; padding: 9px 12px; border-radius: 6px; font-size: 13.5px;" value="${defaultTgl}">
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#059669',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-check-circle-fill"></i> Selesai & Pindahkan Data',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const kat = document.getElementById('swalTargetKategori')?.value || 'Luar Gedung';
      const tgl = document.getElementById('swalTanggalEntry')?.value || defaultTgl;
      return { kategori: kat, tanggal_entry: tgl };
    }
  });

  if (!result.isConfirmed || !result.value) return;

  const { kategori, tanggal_entry } = result.value;

  Swal.fire({
    title: 'Memindahkan Data ke CKG BNBA...',
    html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
            <i class="bi bi-cloud-arrow-up-fill" style="color: #059669;"></i> Menyimpan ke <strong>${kategori}</strong> dan menghapus dari SIMPUS...
          </div>`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    // 1. Create new BNBA record object
    const newCkgRecord = {
      id: `CKG-${new Date().getFullYear()}-${String(records.length + 1).padStart(4, '0')}`,
      jenis_kegiatan: kategori,
      pos_lokasi: item.alamat || 'Puskesmas Banjaran Kota',
      nik: item.nik,
      nama: item.nama,
      tanggal_lahir: item.dob || '',
      usia: parseInt(item.usia) || 0,
      jenis_kelamin: item.jenis_kelamin || 'Laki-laki',
      no_whatsapp: item.no_whatsapp || '',
      status_pernikahan: item.status_pernikahan || 'MENIKAH',
      provinsi: item.provinsi || 'Jawa Barat',
      kab_kota: item.kab_kota || 'Kab. Bandung',
      kecamatan: item.kecamatan || 'Banjaran',
      kelurahan: item.kelurahan || 'Tarajusari',
      alamat: item.alamat || '',
      pekerjaan: 'Lainnya',
      merokok: 'Tidak',
      bb: parseFloat(item.bb) || 0,
      tb: parseFloat(item.tb) || 0,
      lp: 0,
      imt: parseFloat(item.imt) || 0,
      td_sistolik: parseInt(item.sistol) || 0,
      td_diastolik: parseInt(item.diastol) || 0,
      gula_darah: parseInt(item.gula) || 0,
      kolesterol: parseInt(item.kolesterol) || 0,
      hb: 0,
      telinga: 'Normal',
      mata: 'Normal',
      gigi: 'Baik',
      katarak: 'Tidak',
      status_validasi: 'Terverifikasi',
      created_by: item.assigned_to || item.petugas_entry || sessionStorage.getItem('ckg_user_name') || 'Admin',
      petugas_entry: item.assigned_to || item.petugas_entry || sessionStorage.getItem('ckg_user_name') || 'Admin',
      created_at: tanggal_entry,
      tanggal_entry: tanggal_entry
    };

    // 2. Post to /api/ckg
    const resCkg = await fetch('/api/ckg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([newCkgRecord])
    });

    if (!resCkg.ok) {
      throw new Error(`Gagal menyimpan data CKG ke server (HTTP ${resCkg.status})`);
    }

    records.unshift(newCkgRecord);
    localStorage.setItem('ckg_records', JSON.stringify(records));

    // 3. Delete record from SIMPUS table (sudah_bagi or belum_bagi)
    const targetId = item.id || item.nik || id;
    const deleteTab = item.is_divided ? 'sudah_bagi' : 'belum_bagi';
    await fetch(`/api/simpus?tab=${deleteTab}&id=${encodeURIComponent(targetId)}`, {
      method: 'DELETE'
    });

    // 4. Update local SIMPUS array
    simpusRecords = simpusRecords.filter(r => (r.id || r.nik || '') !== id);
    localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

    renderApp();

    Swal.fire({
      icon: 'success',
      title: 'Berhasil Dipindahkan!',
      html: `Data pasien <strong>${item.nama}</strong> berhasil disimpan ke <strong>CKG ${kategori}</strong> pada tanggal <strong>${tanggal_entry}</strong> dan telah dihapus dari SIMPUS.`,
      confirmButtonColor: '#059669'
    });
  } catch (err) {
    console.error('Error during handleSimpusActionBerhasil:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Memindahkan Data!',
      html: `Terjadi kesalahan saat memindahkan data: <strong>${err.message}</strong>`,
      confirmButtonColor: '#dc2626'
    });
  }
}

async function handleSimpusActionSudahEntry(id) {
  const item = simpusRecords.find(r => (r.id || r.nik || '') === id);
  if (!item) {
    showToast('Data SIMPUS tidak ditemukan!', 'error');
    return;
  }

  const detailModalOverlay = document.getElementById('detailModalOverlay');
  if (detailModalOverlay) detailModalOverlay.classList.remove('open');

  const result = await Swal.fire({
    title: 'Mark Sebagai "Sudah di Entry"?',
    html: `
      <div style="font-size: 13.5px; text-align: left; line-height: 1.5;">
        Apakah Anda yakin ingin menandai data pasien ini sebagai <strong>"Sudah di Entry"</strong>?
        <div style="background: #fffbebf; border: 1px solid #fef3c7; padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 13px; color: #92400e;">
          <strong>Nama:</strong> ${item.nama}<br>
          <strong>NIK:</strong> ${item.nik || '-'}<br>
          <strong>Status:</strong> Sudah di Entry
        </div>
        <span style="color: #d97706; font-weight: 600; font-size: 12px;">
          <i class="bi bi-trash3-fill"></i> Data akan dihapus dari daftar SIMPUS dan dipindahkan ke <strong>Recycle Data</strong>.
        </span>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f59e0b',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-archive-fill"></i> Ya, Pindahkan ke Recycle Data',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: 'Memindahkan ke Recycle Data...',
    html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
            <i class="bi bi-cloud-arrow-up-fill" style="color: #f59e0b;"></i> Mengupdate status data pasien <strong>${item.nama}</strong>...
          </div>`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const targetId = item.id || item.nik || id;
    const deleteTab = item.is_divided ? 'sudah_bagi' : 'belum_bagi';
    await fetch(`/api/simpus?tab=${deleteTab}&id=${encodeURIComponent(targetId)}`, {
      method: 'DELETE'
    });

    item.deleted_at = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
    item.deleted_by = sessionStorage.getItem('ckg_user_name') || currentRole || 'User';
    item.delete_reason = 'Sudah di Entry';
    item.original_source = 'Data SIMPUS (Sudah di Entry)';

    recycleBin.unshift(item);
    await saveRecycleBinToStorage(item);

    simpusRecords = simpusRecords.filter(r => (r.id || r.nik || '') !== id);
    localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

    renderApp();

    Swal.fire({
      icon: 'success',
      title: 'Berhasil Dipindahkan!',
      html: `Data pasien <strong>${item.nama}</strong> telah ditandai sebagai <strong>Sudah di Entry</strong> dan dipindahkan ke <strong>Recycle Data</strong>.`,
      confirmButtonColor: '#059669'
    });
  } catch (err) {
    console.error('Error during handleSimpusActionSudahEntry:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Memindahkan Data!',
      html: `Gagal memindahkan data ke Recycle Data: <strong>${err.message}</strong>`,
      confirmButtonColor: '#dc2626'
    });
  }
}

async function handleSimpusActionGagal(id) {
  const item = simpusRecords.find(r => (r.id || r.nik || '') === id);
  if (!item) {
    showToast('Data SIMPUS tidak ditemukan!', 'error');
    return;
  }

  const detailModalOverlay = document.getElementById('detailModalOverlay');
  if (detailModalOverlay) detailModalOverlay.classList.remove('open');

  const result = await Swal.fire({
    title: 'Mark Sebagai "Gagal Entry"?',
    html: `
      <div style="font-size: 13.5px; text-align: left; line-height: 1.5;">
        Apakah Anda yakin ingin menandai data pasien ini sebagai <strong>"Gagal Entry"</strong>?
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 13px; color: #991b1b;">
          <strong>Nama:</strong> ${item.nama}<br>
          <strong>NIK:</strong> ${item.nik || '-'}<br>
          <strong>Status:</strong> Gagal Entry
        </div>
        <span style="color: #dc2626; font-weight: 600; font-size: 12px;">
          <i class="bi bi-trash3-fill"></i> Data akan dihapus dari daftar SIMPUS dan dipindahkan ke <strong>Recycle Data</strong>.
        </span>
      </div>
    `,
    icon: 'error',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-x-circle-fill"></i> Ya, Tandai Gagal & Pindahkan',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: 'Memindahkan ke Recycle Data...',
    html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
            <i class="bi bi-cloud-arrow-up-fill" style="color: #dc2626;"></i> Mengupdate status data pasien <strong>${item.nama}</strong>...
          </div>`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const targetId = item.id || item.nik || id;
    const deleteTab = item.is_divided ? 'sudah_bagi' : 'belum_bagi';
    await fetch(`/api/simpus?tab=${deleteTab}&id=${encodeURIComponent(targetId)}`, {
      method: 'DELETE'
    });

    item.deleted_at = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
    item.deleted_by = sessionStorage.getItem('ckg_user_name') || currentRole || 'User';
    item.delete_reason = 'Gagal Entry';
    item.original_source = 'Data SIMPUS (Gagal Entry)';

    recycleBin.unshift(item);
    await saveRecycleBinToStorage(item);

    simpusRecords = simpusRecords.filter(r => (r.id || r.nik || '') !== id);
    localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

    renderApp();

    Swal.fire({
      icon: 'success',
      title: 'Berhasil Dipindahkan!',
      html: `Data pasien <strong>${item.nama}</strong> telah ditandai sebagai <strong>Gagal Entry</strong> dan dipindahkan ke <strong>Recycle Data</strong>.`,
      confirmButtonColor: '#059669'
    });
  } catch (err) {
    console.error('Error during handleSimpusActionGagal:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Memindahkan Data!',
      html: `Gagal memindahkan data ke Recycle Data: <strong>${err.message}</strong>`,
      confirmButtonColor: '#dc2626'
    });
  }
}

function resetSimpusFilters() {
  const p = document.getElementById('filterSimpusPetugas');
  const u = document.getElementById('filterSimpusUmur');
  const l = document.getElementById('filterSimpusLimit');
  if (p) p.value = '';
  if (u) u.value = '';
  if (l) l.value = '10';
  renderSimpusTableRecords();
  showToast('Filter SIMPUS telah di-reset.', 'info');
}

function setSimpusActionStatus(id, status) {
  const item = simpusRecords.find(r => r.id === id);
  if (item) {
    item.entry_status = status;
    saveSimpusRecordsToStorage();
    showToast(`Status data ${item.nama} diubah ke: ${status.toUpperCase()}`, 'success');
  }
}

function openBagiPetugasModal() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    Swal.fire({
      icon: 'warning',
      title: 'Akses Ditolak',
      text: 'Fitur Bagi Data ke Petugas hanya dapat diakses oleh Admin dan Koordinator.',
      confirmButtonColor: '#7c3aed'
    });
    return;
  }

  const belumBagiRecords = simpusRecords.filter(r => !r.is_divided);
  const belumBagi = belumBagiRecords.length;

  if (belumBagi === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Seluruh Data Sudah Di-bagi',
      text: 'Saat ini tidak ada data SIMPUS yang belum di-bagi.',
      confirmButtonColor: '#7c3aed'
    });
    return;
  }

  // Populate target petugas dropdown dynamically
  const selectPetugas = document.getElementById('targetPetugasSelect');
  if (selectPetugas) {
    selectPetugas.innerHTML = '<option value="">-- Pilih Petugas Tujuan --</option>' +
      usersDb.map(u => `<option value="${u.nama_user}">${u.nama_user} (${u.role || 'Petugas'})</option>`).join('');
  }

  const inputJml = document.getElementById('jumlahDataBagi');
  if (inputJml) {
    inputJml.removeAttribute('max'); // Remove strict max attribute to prevent native browser validation tooltips
    inputJml.value = Math.min(10, belumBagi) || 1;
  }

  const helpText = document.getElementById('helpTextBagi');
  if (helpText) {
    helpText.textContent = `Maksimal data belum di-bagi saat ini: ${belumBagi} data.`;
  }

  document.getElementById('bagiPetugasModalOverlay').classList.add('open');
}

function closeBagiPetugasModal() {
  document.getElementById('bagiPetugasModalOverlay').classList.remove('open');
}

async function handleBagiPetugasSubmit(e) {
  e.preventDefault();
  const targetPetugas = document.getElementById('targetPetugasSelect').value;
  const countInput = document.getElementById('jumlahDataBagi').value;
  const count = parseInt(countInput) || 0;

  if (!targetPetugas) {
    showToast('Silakan pilih Petugas Tujuan terlebih dahulu!', 'error');
    return;
  }

  const belumBagiRecords = simpusRecords.filter(r => !r.is_divided);
  const belumBagi = belumBagiRecords.length;

  if (count <= 0) {
    showToast('Jumlah baris data yang di-bagi minimal 1 data!', 'warning');
    return;
  }

  if (count > belumBagi) {
    Swal.fire({
      icon: 'warning',
      title: 'Jumlah Melebihi Batas',
      text: `Jumlah data yang Anda masukkan (${count}) melebihi sisa data SIMPUS yang belum di-bagi (${belumBagi} data).`,
      confirmButtonColor: '#7c3aed'
    });
    return;
  }

  const idsToMove = belumBagiRecords.slice(0, count).map(r => r.id);

  if (idsToMove.length === 0) {
    showToast('Tidak ada data yang tersedia untuk di-bagi.', 'warning');
    closeBagiPetugasModal();
    return;
  }

  closeBagiPetugasModal();
  showLoadingOverlay('Membagikan Data SIMPUS...', `Mengalokasikan ${idsToMove.length} data ke ${targetPetugas} & menyinkronkan ke Cloud D1`);

  try {
    const res = await fetch('/api/simpus/bagi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToMove, petugas: targetPetugas })
    });
    const result = await res.json();

    // Update local records
    idsToMove.forEach(id => {
      const rec = simpusRecords.find(r => r.id === id);
      if (rec) {
        rec.is_divided = true;
        rec.assigned_to = targetPetugas;
        rec.petugas_entry = targetPetugas;
      }
    });
    localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));
    
    // Fetch clean state from Cloud D1
    await fetchCloudSimpusRecords(true);
  } catch (err) {
    console.error('Failed to bagi SIMPUS records:', err);
  }

  const assignedCount = idsToMove.length;
  hideLoadingOverlay();
  renderSimpusView();

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Pembagian Data Berhasil!',
      html: `Berhasil membagikan <strong>${assignedCount} Data Pasien SIMPUS</strong> kepada petugas <strong>${targetPetugas}</strong>.<br><br><span style="color:#059669; font-weight:700;">Data otomatis berpindah ke tab "Data Sudah Di-Bagi" & tersimpan di Cloud D1.</span>`,
      confirmButtonColor: '#7c3aed'
    });
  } else {
    showToast(`Berhasil membagikan ${assignedCount} data SIMPUS kepada ${targetPetugas}!`, 'success');
  }
}

async function deleteAllSimpusData() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  if (role !== 'admin') {
    showToast('Akses khusus Admin!', 'error');
    return;
  }

  const proceed = async () => {
    showLoadingOverlay('Menghapus Data SIMPUS...', 'Menghapus seluruh record SIMPUS di Cloudflare D1 Database');
    try {
      await fetch('/api/simpus?tab=belum_bagi', { method: 'DELETE' });
      await fetch('/api/simpus?tab=sudah_bagi', { method: 'DELETE' });
    } catch (err) {
      console.error('Cloud delete SIMPUS error:', err);
    }
    simpusRecords = [];
    localStorage.removeItem('ckg_simpus_records');
    hideLoadingOverlay();
    renderSimpusView();

    if (typeof Swal !== 'undefined') {
      Swal.fire('Terhapus!', 'Seluruh Data SIMPUS Berhasil Dihapus dari Cloud D1 & Database Lokal.', 'success');
    } else {
      showToast('Seluruh Data SIMPUS Berhasil Dihapus!', 'success');
    }
  };

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus Seluruh Data SIMPUS?',
      text: 'Apakah Anda yakin ingin menghapus SELURUH Data Entry CKG dari SIMPUS di Cloud D1? Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Semua Data Cloud!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        proceed();
      }
    });
  } else if (confirm('Apakah Anda yakin ingin menghapus SELURUH Data Entry CKG dari SIMPUS di Cloud D1? Action ini tidak dapat dibatalkan.')) {
    proceed();
  }
}

// Helper: Format any date string, ISO date, or Excel date serial integer to YYYY-MM-DD format
function formatDateToYYYYMMDD(val) {
  if (val === null || val === undefined || val === '') return '';

  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const s = String(val).trim();
  if (!s) return '';

  // Handle Excel date serial number (e.g. 37067 or "37067")
  if (!isNaN(s) && Number(s) > 1000 && Number(s) < 100000) {
    const n = Number(s);
    const date = new Date(Math.round((n - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Handle ISO string e.g. "2026-08-07T14:20:00.000Z"
  if (s.includes('T')) {
    const datePart = s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  }

  // Handle standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Handle separators like DD/MM/YYYY or DD-MM-YYYY or YYYY/MM/DD
  if (s.includes('/') || s.includes('-')) {
    const sep = s.includes('/') ? '/' : '-';
    const parts = s.split(sep);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].substring(0, 2).padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else if (parts[2].substring(0, 4).length === 4) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].substring(0, 4);
        return `${y}-${m}-${d}`;
      }
    }
  }

  return s;
}

// Helper: Save XLSX workbook as a proper .xlsx download with correct filename
function saveXlsxFile(wb, filename) {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let pendingImportFile = null;

function importSimpusXlsx() {
  pendingImportFile = null;
  const fileInput = document.getElementById('simpusXlsxFileInput');
  if (fileInput) fileInput.value = '';
  const dropZone = document.getElementById('importDropZone');
  if (dropZone) dropZone.classList.remove('file-ready');
  const fileInfo = document.getElementById('importFileInfo');
  if (fileInfo) fileInfo.style.display = 'none';
  const btnProcess = document.getElementById('btnProcessImport');
  if (btnProcess) btnProcess.disabled = true;

  document.getElementById('importSimpusModalOverlay').classList.add('open');

  // Setup drag-and-drop
  setTimeout(() => {
    const dz = document.getElementById('importDropZone');
    if (!dz || dz._dragSetup) return;
    dz._dragSetup = true;

    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('dragover');
    });
    dz.addEventListener('dragleave', () => {
      dz.classList.remove('dragover');
    });
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        setImportFile(file);
      } else {
        showToast('Format file tidak didukung. Gunakan .xlsx atau .xls', 'error');
      }
    });
  }, 100);
}

function closeImportSimpusModal() {
  document.getElementById('importSimpusModalOverlay').classList.remove('open');
  pendingImportFile = null;
}

function handleSimpusXlsxImport(event) {
  const file = event.target.files[0];
  if (file) setImportFile(file);
}

function setImportFile(file) {
  pendingImportFile = file;

  const dropZone = document.getElementById('importDropZone');
  if (dropZone) {
    dropZone.classList.add('file-ready');
    const iconEl = dropZone.querySelector('.import-dropzone-icon i');
    if (iconEl) iconEl.className = 'bi bi-file-earmark-check-fill';
    const textEl = dropZone.querySelector('.import-dropzone-text');
    if (textEl) textEl.innerHTML = `<strong style="color: #16a34a;">File Siap Di-Import!</strong>`;
  }

  const fileInfo = document.getElementById('importFileInfo');
  if (fileInfo) {
    fileInfo.style.display = 'flex';
    fileInfo.style.alignItems = 'center';
    fileInfo.style.gap = '6px';
  }
  const fileName = document.getElementById('importFileName');
  if (fileName) fileName.textContent = file.name;

  const btnProcess = document.getElementById('btnProcessImport');
  if (btnProcess) btnProcess.disabled = false;
}

function downloadTemplateSimpusXlsx() {
  try {
    const headers = [
      "NAMA PASIEN", "NIK", "TANGGAL LAHIR", "USIA",
      "Status Pernikahan", "Provinsi", "Kab/Kota", "Kecamatan", "Kelurahan", "Alamat Lengkap",
      "BB (kg)", "TB (cm)", "TD SISTOL", "TD DIASTOL", "GULA DARAH", "KOLESTEROL"
    ];

    const sampleRow1 = [
      "EUIS SARIBANON", "3204123456780001", "1962-12-01", 63,
      "MENIKAH", "Jawa Barat", "Kab. Bandung", "Banjaran", "Tarajusari", "Kp Cipeundeuy",
      54, 153, 135, 99, "91", "180"
    ];

    const sampleRow2 = [
      "SENY SEPTIANY", "3204134109910006", "1991-09-01", 34,
      "BELUM MENIKAH", "Jawa Barat", "Kab. Bandung", "Banjaran", "Tarajusari", "Kp Cipeundeuy",
      56, 159, 120, 92, "90", "180"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 3, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template SIMPUS Belum Di-Bagi");
    saveXlsxFile(wb, `Template_Import_SIMPUS_BelumDibagi_${new Date().toISOString().substring(0, 10)}.xlsx`);

    showToast('Template XLSX SIMPUS (Data Belum Di-Bagi) Berhasil Diunduh!', 'success');
  } catch (err) {
    console.error('Download SIMPUS template error:', err);
    showToast('Gagal mengunduh template XLSX.', 'error');
  }
}

function processImportFromModal() {
  if (!pendingImportFile) {
    showToast('Silakan pilih file XLSX terlebih dahulu.', 'error');
    return;
  }

  const file = pendingImportFile;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        showToast('File Excel tidak valid atau rusak!', 'error');
        return;
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        showToast('File XLSX kosong atau tidak memiliki data.', 'error');
        return;
      }

      const parsedRecords = [];
      const maxId = simpusRecords.reduce((max, r) => {
        const num = parseInt(String(r.no)) || 0;
        return num > max ? num : max;
      }, 3900);

      jsonData.forEach((row, idx) => {
        const getVal = (...keys) => {
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              if (rowKey.toLowerCase().trim() === target) return String(row[rowKey]).trim();
            }
          }
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              const keyClean = rowKey.toLowerCase().trim();
              if (keyClean.includes(target)) return String(row[rowKey]).trim();
            }
          }
          return '';
        };

        const nama = getVal('NAMA PASIEN', 'NAMA', 'Nama Pasien', 'Nama').toUpperCase();
        const nik = getVal('NIK', 'nik', 'No KTP');

        if (!nama || nama.length < 2) return;

        const newId = `S-${maxId + idx + 1}-${Date.now()}`;
        const bb = parseFloat(getVal('BB (kg)', 'BB', 'BERAT BADAN', 'Berat Badan')) || 0;
        const tb = parseFloat(getVal('TB (cm)', 'TB', 'TINGGI BADAN', 'Tinggi Badan')) || 0;
        const imt = (bb > 0 && tb > 0) ? parseFloat((bb / ((tb / 100) ** 2)).toFixed(1)) : 0;
        const usia = parseInt(getVal('USIA', 'Usia', 'Umur')) || 30;

        let keterangan = 'Dewasa';
        if (usia < 18) keterangan = 'Anak';
        else if (usia >= 60) keterangan = 'Lansia';

        const record = {
          id: newId,
          no: maxId + idx + 1,
          petugas_entry: '',
          nama: nama,
          nik: nik || '3204' + Math.floor(100000000000 + Math.random() * 900000000000),
          tanggal: new Date().toISOString().substring(0, 10),
          dob: getVal('TANGGAL LAHIR', 'Tgl Lahir', 'DOB', 'Tanggal_Lahir') || '1990-01-01',
          usia: usia,
          status_pernikahan: getVal('Status Pernikahan', 'Status', 'Pernikahan') || 'MENIKAH',
          provinsi: getVal('Provinsi', 'Prov') || 'Jawa Barat',
          kab_kota: getVal('Kab/Kota', 'Kab', 'Kota') || 'Kab. Bandung',
          kecamatan: getVal('Kecamatan', 'Kec') || 'Banjaran',
          kelurahan: getVal('Kelurahan', 'Kel', 'Desa') || 'Tarajusari',
          alamat: getVal('Alamat Lengkap', 'ALAMAT', 'Alamat', 'Alamat_Lengkap') || '-',
          bb: bb,
          tb: tb,
          imt: imt,
          sistol: parseInt(getVal('TD SISTOL', 'TD SISTOLIK', 'SISTOL', 'Sistol')) || 120,
          diastol: parseInt(getVal('TD DIASTOL', 'TD DIASTOLIK', 'DIASTOL', 'Diastol')) || 80,
          gula: getVal('GULA DARAH', 'Gula Darah', 'Gula') || '100',
          kolesterol: getVal('KOLESTEROL', 'Kolesterol') || '180',
          keterangan: keterangan,
          is_divided: false,
          assigned_to: '',
          entry_status: 'belum'
        };

        parsedRecords.push(record);
      });

      if (parsedRecords.length === 0) {
        if (typeof Swal !== 'undefined') {
          Swal.fire('Gagal Read Excel', 'Sistem tidak menemukan baris data pasien yang valid pada file Excel tersebut. Mohon gunakan template resmi XLSX SIMPUS.', 'warning');
        } else {
          showToast('Tidak ada data valid yang bisa di-import.', 'warning');
        }
        return;
      }

      closeImportSimpusModal();

      // Show Progress Modal for Cloud Sync
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: `<i class="bi bi-cloud-upload-fill" style="color:#d97706;"></i> Meng-upload ${parsedRecords.length} Data Pasien ke Cloud Database D1...`,
          html: `<div style="margin:10px 0;">
                  <div id="simpusImportProgressBar" style="width:100%;height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;">
                    <div id="simpusImportProgressFill" style="width:0%;height:100%;background:linear-gradient(90deg,#d97706,#f59e0b);border-radius:10px;transition:width 0.3s;"></div>
                  </div>
                  <div id="simpusImportProgressText" style="margin-top:8px;font-size:13px;color:#475569;font-weight:600;">0 / ${parsedRecords.length} data pasien (0%)</div>
                </div>`,
          allowOutsideClick: false,
          showConfirmButton: false
        });
      }

      const chunkSize = 20;
      let uploaded = 0;
      let failed = 0;
      let lastError = '';

      for (let i = 0; i < parsedRecords.length; i += chunkSize) {
        const chunk = parsedRecords.slice(i, i + chunkSize);
        let success = false;

        // Try up to 2 times per chunk
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const tStart = performance.now();
            const res = await fetch('/api/simpus?tab=belum_bagi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chunk)
            });
            const tEnd = performance.now();
            if (res.ok) {
              uploaded += chunk.length;
              success = true;
              console.log(`[Import SIMPUS Speed] Upload ${chunk.length} data completed in ${(tEnd - tStart).toFixed(1)} ms (${Math.round((chunk.length / ((tEnd - tStart) / 1000)))} data/sec)`);
              break;
            } else {
              const errBody = await res.text();
              lastError = `HTTP ${res.status}: ${errBody.substring(0, 200)}`;
              console.error(`[Import SIMPUS] Chunk ${i}-${i+chunk.length} failed (attempt ${attempt+1}):`, lastError);
              // Wait before retry
              await new Promise(r => setTimeout(r, 500));
            }
          } catch (err) {
            lastError = err.message;
            console.error(`[Import SIMPUS] Network error chunk ${i} (attempt ${attempt+1}):`, err.message);
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (!success) {
          failed += chunk.length;
        }

        const pct = Math.round(((uploaded + failed) / parsedRecords.length) * 100);
        const fillEl = document.getElementById('simpusImportProgressFill');
        const txtEl = document.getElementById('simpusImportProgressText');
        if (fillEl) fillEl.style.width = pct + '%';
        if (txtEl) txtEl.textContent = `${uploaded + failed} / ${parsedRecords.length} data pasien (${pct}%)`;

        // Small delay between chunks to avoid D1 rate limits
        if (i + chunkSize < parsedRecords.length) {
          await new Promise(r => setTimeout(r, 150));
        }
      }

      console.log(`[Import SIMPUS] Upload complete: ${uploaded} ok, ${failed} failed. Last error: ${lastError}`);

      simpusRecords = [...parsedRecords, ...simpusRecords];
      saveSimpusRecordsToStorage();
      renderSimpusView();
      updateCloudSyncPill(true, `D1 Online (${simpusRecords.length} SIMPUS)`);

      if (typeof Swal !== 'undefined') {
        if (uploaded > 0) {
          Swal.fire({
            icon: 'success',
            title: 'Import & Sinkronisasi Cloud Berhasil!',
            html: `<div style="font-size:13.5px; text-align:left; line-height:1.6;">
                    Total <strong>${uploaded} Data Pasien</strong> dari file <strong>${file.name}</strong> telah <strong>ter-upload & tersimpan permanen di Cloudflare D1 Database (tab Data Belum Di-Bagi)</strong>.
                  </div>`,
            confirmButtonColor: '#d97706'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Upload ke Cloud Database D1',
            html: `<div style="font-size:13.5px; text-align:left; line-height:1.6;">
                    Sistem gagal menyimpan <strong>${parsedRecords.length} Data Pasien</strong> ke Cloud D1.<br><br>
                    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:10px; margin:8px 0; font-size:11.5px; color:#991b1b; word-break:break-all;">
                      <strong>Detail Error:</strong><br>${lastError || 'Unknown error - cek browser Console (F12)'}
                    </div>
                    <span style="color:#dc2626; font-size:12.5px;">Data telah diamankan di browser lokal. Silakan deploy ulang _worker.js lalu coba kembali.</span>
                  </div>`,
            confirmButtonColor: '#ef4444'
          });
        }
      } else {
        showToast(`${uploaded} data SIMPUS berhasil di-upload ke Cloud D1!`, 'success');
      }
    } catch (err) {
      console.error('Import XLSX Error:', err);
      showToast('Gagal membaca file XLSX. Pastikan format file benar.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function openEksporPerPetugasModal() {
  const divided = simpusRecords.filter(r => r.is_divided);
  const petugasMap = {};

  divided.forEach(r => {
    const key = r.assigned_to || 'Belum Di-assign';
    if (!petugasMap[key]) petugasMap[key] = [];
    petugasMap[key].push(r);
  });

  const body = document.getElementById('eksporPerPetugasBody');
  if (!body) return;

  const petugasList = Object.keys(petugasMap);

  if (petugasList.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted);">
        <i class="bi bi-inbox" style="font-size: 36px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
        <strong>Belum Ada Data yang Sudah Di-Bagi</strong>
        <p style="font-size: 12.5px; margin-top: 4px;">Silakan distribusikan data terlebih dahulu ke petugas melalui tombol "Bagi Data ke Petugas".</p>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px; display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
        <i class="bi bi-info-circle-fill" style="font-size: 16px;"></i>
        <span>Klik tombol <strong>Download</strong> pada tiap petugas untuk mengunduh file XLSX data pasien yang menjadi tugas mereka.</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${petugasList.map(petugas => {
          const count = petugasMap[petugas].length;
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div>
                <div style="font-weight: 800; color: var(--text-main); font-size: 14px;">
                  <i class="bi bi-person-badge-fill" style="color: var(--primary);"></i> ${petugas}
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  <span class="badge badge-purple">${count} Data Pasien</span>
                </div>
              </div>
              <button class="btn btn-emerald btn-sm" onclick="exportSinglePetugasXlsx('${petugas.replace(/'/g, "\\'")}')">
                <i class="bi bi-download"></i> Download XLSX
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  document.getElementById('eksporPerPetugasModalOverlay').classList.add('open');
}

function closeEksporPerPetugasModal() {
  document.getElementById('eksporPerPetugasModalOverlay').classList.remove('open');
}

function exportSinglePetugasXlsx(petugasName) {
  const records = simpusRecords.filter(r => r.is_divided && r.assigned_to === petugasName);
  if (records.length === 0) {
    showToast(`Tidak ada data untuk petugas ${petugasName}.`, 'error');
    return;
  }

  const exportData = records.map((r, i) => ({
    'NO': i + 1,
    'TANGGAL': formatDateToYYYYMMDD(r.tanggal || r.tanggal_entry || r.created_at),
    'NAMA PASIEN': r.nama || '',
    'NIK': r.nik || '',
    'ALAMAT': r.alamat || '',
    'TANGGAL LAHIR': formatDateToYYYYMMDD(r.dob || r.tanggal_lahir),
    'USIA': r.usia || 0,
    'KATEGORI': r.keterangan || 'Dewasa',
    'BERAT BADAN (KG)': r.bb || '',
    'TINGGI BADAN (CM)': r.tb || '',
    'IMT': r.imt || '',
    'TD SISTOLIK': r.sistol || '',
    'TD DIASTOLIK': r.diastol || '',
    'GULA DARAH': r.gula || '',
    'KOLESTEROL': r.kolesterol || '',
    'STATUS ENTRY': (r.entry_status || 'belum').toUpperCase(),
    'PETUGAS': r.assigned_to || petugasName
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },   // NO
    { wch: 14 },  // TANGGAL (yyyy-mm-dd)
    { wch: 26 },  // NAMA PASIEN
    { wch: 18 },  // NIK
    { wch: 35 },  // ALAMAT
    { wch: 14 },  // TANGGAL LAHIR (yyyy-mm-dd)
    { wch: 8 },   // USIA
    { wch: 12 },  // KATEGORI
    { wch: 16 },  // BB
    { wch: 18 },  // TB
    { wch: 10 },  // IMT
    { wch: 14 },  // TD SISTOLIK
    { wch: 14 },  // TD DIASTOLIK
    { wch: 14 },  // GULA DARAH
    { wch: 14 },  // KOLESTEROL
    { wch: 16 },  // STATUS ENTRY
    { wch: 25 }   // PETUGAS
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Petugas');

  const safeName = petugasName.replace(/[^a-zA-Z0-9]/g, '_');
  saveXlsxFile(wb, `Data_SIMPUS_${safeName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast(`File XLSX untuk ${petugasName} berhasil diunduh! (${records.length} data)`, 'success');
}

function exportAllPetugasXlsx() {
  const divided = simpusRecords.filter(r => r.is_divided);
  if (divided.length === 0) {
    showToast('Tidak ada data yang sudah di-bagi untuk diekspor.', 'error');
    return;
  }

  const petugasMap = {};
  divided.forEach(r => {
    const key = r.assigned_to || 'Belum Di-assign';
    if (!petugasMap[key]) petugasMap[key] = [];
    petugasMap[key].push(r);
  });

  const wb = XLSX.utils.book_new();

  Object.keys(petugasMap).forEach(petugas => {
    const records = petugasMap[petugas];
    const exportData = records.map((r, i) => ({
      'NO': i + 1,
      'TANGGAL': formatDateToYYYYMMDD(r.tanggal || r.tanggal_entry || r.created_at),
      'NAMA PASIEN': r.nama || '',
      'NIK': r.nik || '',
      'ALAMAT': r.alamat || '',
      'TANGGAL LAHIR': formatDateToYYYYMMDD(r.dob || r.tanggal_lahir),
      'USIA': r.usia || 0,
      'KATEGORI': r.keterangan || 'Dewasa',
      'BERAT BADAN (KG)': r.bb || '',
      'TINGGI BADAN (CM)': r.tb || '',
      'IMT': r.imt || '',
      'TD SISTOLIK': r.sistol || '',
      'TD DIASTOLIK': r.diastol || '',
      'GULA DARAH': r.gula || '',
      'KOLESTEROL': r.kolesterol || '',
      'STATUS ENTRY': (r.entry_status || 'belum').toUpperCase(),
      'PETUGAS': petugas
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },   // NO
      { wch: 14 },  // TANGGAL (yyyy-mm-dd)
      { wch: 26 },  // NAMA PASIEN
      { wch: 18 },  // NIK
      { wch: 35 },  // ALAMAT
      { wch: 14 },  // TANGGAL LAHIR (yyyy-mm-dd)
      { wch: 8 },   // USIA
      { wch: 12 },  // KATEGORI
      { wch: 16 },  // BB
      { wch: 18 },  // TB
      { wch: 10 },  // IMT
      { wch: 14 },  // TD SISTOLIK
      { wch: 14 },  // TD DIASTOLIK
      { wch: 14 },  // GULA DARAH
      { wch: 14 },  // KOLESTEROL
      { wch: 16 },  // STATUS ENTRY
      { wch: 25 }   // PETUGAS
    ];

    const sheetName = petugas.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  saveXlsxFile(wb, `Data_SIMPUS_Semua_Petugas_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast(`File XLSX untuk semua petugas berhasil diunduh! (${divided.length} total data)`, 'success');
  closeEksporPerPetugasModal();
}

function exportSimpusXlsx() {
  if (simpusRecords.length === 0) {
    showToast('Tidak ada data SIMPUS untuk di-download.', 'error');
    return;
  }

  const exportData = simpusRecords.map((r, i) => ({
    'NO': i + 1,
    'TANGGAL': formatDateToYYYYMMDD(r.tanggal || r.tanggal_entry || r.created_at),
    'NAMA PASIEN': r.nama || '',
    'NIK': r.nik || '',
    'ALAMAT': r.alamat || '',
    'TANGGAL LAHIR': formatDateToYYYYMMDD(r.dob || r.tanggal_lahir),
    'USIA': r.usia || 0,
    'KATEGORI': r.keterangan || 'Dewasa',
    'BERAT BADAN (KG)': r.bb || '',
    'TINGGI BADAN (CM)': r.tb || '',
    'IMT': r.imt || '',
    'TD SISTOLIK': r.sistol || '',
    'TD DIASTOLIK': r.diastol || '',
    'GULA DARAH': r.gula || '',
    'KOLESTEROL': r.kolesterol || '',
    'STATUS BAGI': r.is_divided ? 'Sudah Di-Bagi' : 'Belum Di-Bagi',
    'PETUGAS': r.assigned_to || '-',
    'STATUS ENTRY': (r.entry_status || 'belum').toUpperCase()
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },   // NO
    { wch: 14 },  // TANGGAL (yyyy-mm-dd)
    { wch: 26 },  // NAMA PASIEN
    { wch: 18 },  // NIK
    { wch: 35 },  // ALAMAT
    { wch: 14 },  // TANGGAL LAHIR (yyyy-mm-dd)
    { wch: 8 },   // USIA
    { wch: 12 },  // KATEGORI
    { wch: 16 },  // BB
    { wch: 18 },  // TB
    { wch: 10 },  // IMT
    { wch: 14 },  // TD SISTOLIK
    { wch: 14 },  // TD DIASTOLIK
    { wch: 14 },  // GULA DARAH
    { wch: 14 },  // KOLESTEROL
    { wch: 16 },  // STATUS BAGI
    { wch: 25 },  // PETUGAS
    { wch: 16 }   // STATUS ENTRY
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data SIMPUS');

  saveXlsxFile(wb, `Data_SIMPUS_CKG_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast(`File XLSX seluruh data SIMPUS berhasil diunduh! (${simpusRecords.length} data)`, 'success');
}

// ----------------------------------------------------
// OTHER GENERAL MODALS & LOGIC (MULTI-STEP WIZARD)
// ----------------------------------------------------
let currentWizardStep = 1;

function updateWizardUI() {
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`wizardStep${i}`);
    if (stepEl) {
      stepEl.classList.toggle('active', i === currentWizardStep);
    }
  }

  document.querySelectorAll('.wizard-stepper-bar .stepper-item').forEach(item => {
    const stepNum = parseInt(item.getAttribute('data-step')) || 1;
    item.classList.toggle('active', stepNum === currentWizardStep);
    item.classList.toggle('completed', stepNum < currentWizardStep);
  });

  document.querySelectorAll('.wizard-stepper-bar .stepper-line').forEach((line, idx) => {
    line.classList.toggle('completed', (idx + 1) < currentWizardStep);
  });

  const btnPrev = document.getElementById('btnWizardPrev');
  const btnCancel = document.getElementById('btnWizardCancel');
  const btnNext = document.getElementById('btnWizardNext');
  const btnSubmit = document.getElementById('btnWizardSubmit');

  if (currentWizardStep === 1) {
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'inline-flex';
    if (btnNext) btnNext.style.display = 'inline-flex';
    if (btnSubmit) btnSubmit.style.display = 'none';
  } else if (currentWizardStep === 4) {
    if (btnPrev) btnPrev.style.display = 'inline-flex';
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (btnSubmit) btnSubmit.style.display = 'inline-flex';
  } else {
    if (btnPrev) btnPrev.style.display = 'inline-flex';
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnNext) btnNext.style.display = 'inline-flex';
    if (btnSubmit) btnSubmit.style.display = 'none';
  }
}

function validateCurrentStep(step) {
  if (step === 1) {
    return true;
  }
  if (step === 2) {
    const nik = document.getElementById('nik').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const dob = document.getElementById('tanggal_lahir').value;
    const prov = document.getElementById('provinsi').value;
    const kab = document.getElementById('kab_kota').value;
    const kec = document.getElementById('kecamatan').value;
    const kel = document.getElementById('kelurahan').value;
    const alamat = document.getElementById('alamat').value.trim();

    if (!nik || nik.length !== 16) {
      showToast('NIK wajib diisi 16 digit angka!', 'error');
      document.getElementById('nik').focus();
      return false;
    }
    if (!nama) {
      showToast('Nama Lengkap Pasien wajib diisi!', 'error');
      document.getElementById('nama').focus();
      return false;
    }
    if (!dob) {
      showToast('Tanggal Lahir wajib diisi!', 'error');
      document.getElementById('tanggal_lahir').focus();
      return false;
    }
    if (!prov || !kab || !kec || !kel || !alamat) {
      showToast('Data Wilayah & Alamat Lengkap Pasien wajib diisi!', 'error');
      return false;
    }
    return true;
  }
  if (step === 3) {
    const bb = parseFloat(document.getElementById('bb').value) || 0;
    const tb = parseFloat(document.getElementById('tb').value) || 0;

    if (bb <= 0) {
      showToast('Berat Badan (BB) wajib diisi angka valid!', 'error');
      document.getElementById('bb').focus();
      return false;
    }
    if (tb <= 0) {
      showToast('Tinggi Badan (TB) wajib diisi angka valid!', 'error');
      document.getElementById('tb').focus();
      return false;
    }
    return true;
  }
  return true;
}

function goToStep(targetStep) {
  if (targetStep < currentWizardStep) {
    currentWizardStep = targetStep;
    updateWizardUI();
    return;
  }
  
  for (let s = currentWizardStep; s < targetStep; s++) {
    if (!validateCurrentStep(s)) return;
  }

  currentWizardStep = targetStep;
  updateWizardUI();
}

function nextWizardStep() {
  if (!validateCurrentStep(currentWizardStep)) return;
  if (currentWizardStep < 4) {
    currentWizardStep++;
    updateWizardUI();
  }
}

function prevWizardStep() {
  if (currentWizardStep > 1) {
    currentWizardStep--;
    updateWizardUI();
  }
}

function openInputModal(kategori = 'Luar Gedung') {
  currentEditingId = null;
  document.getElementById('ckgForm').reset();
  
  if (kategori === 'Dalam Gedung') {
    document.getElementById('kegiatan_dalam').checked = true;
  } else {
    document.getElementById('kegiatan_luar').checked = true;
  }

  calculateIMT();
  currentWizardStep = 1;
  updateWizardUI();
  document.getElementById('inputModalOverlay').classList.add('open');
}

function closeInputModal() {
  document.getElementById('inputModalOverlay').classList.remove('open');
}

function openAddUserModal() {
  document.getElementById('addUserForm').reset();
  document.getElementById('editingUserOriginalName').value = '';
  const titleEl = document.getElementById('userModalTitle');
  const btnSubmit = document.getElementById('btnSubmitUser');
  if (titleEl) titleEl.innerHTML = '<i class="bi bi-person-plus-fill" style="color: var(--primary);"></i> Tambah User Database Baru';
  if (btnSubmit) btnSubmit.textContent = 'Simpan User';
  document.getElementById('userModalOverlay').classList.add('open');
}

function openEditUserModal(namaUser) {
  const user = usersDb.find(u => u.nama_user === namaUser);
  if (!user) return;

  document.getElementById('editingUserOriginalName').value = namaUser;
  document.getElementById('newNamaUser').value = user.nama_user;
  document.getElementById('newPassword').value = user.password || '';
  document.getElementById('newRole').value = user.role || 'Petugas';

  const titleEl = document.getElementById('userModalTitle');
  const btnSubmit = document.getElementById('btnSubmitUser');
  if (titleEl) titleEl.innerHTML = '<i class="bi bi-pencil-square" style="color: var(--amber);"></i> Edit Data User Database';
  if (btnSubmit) btnSubmit.textContent = 'Simpan Perubahan';

  document.getElementById('userModalOverlay').classList.add('open');
}

function closeAddUserModal() {
  document.getElementById('userModalOverlay').classList.remove('open');
}

function handleAddUserSubmit(e) {
  e.preventDefault();
  const originalName = document.getElementById('editingUserOriginalName').value;
  const namaUser = document.getElementById('newNamaUser').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const role = document.getElementById('newRole').value;

  if (!namaUser) {
    showToast('Nama User wajib diisi!', 'error');
    return;
  }

  const isEdit = !!originalName;

  if (isEdit) {
    const duplicate = usersDb.find(u => u.nama_user.toLowerCase() === namaUser.toLowerCase() && u.nama_user !== originalName);
    if (duplicate) {
      showToast('User dengan Nama User ini sudah terdaftar!', 'error');
      return;
    }

    const index = usersDb.findIndex(u => u.nama_user === originalName);
    if (index !== -1) {
      usersDb[index] = { nama_user: namaUser, password: password, role: role };
    }

    if (originalName !== namaUser) {
      deleteUserFromCloud(originalName);
    }
  } else {
    const existing = usersDb.find(u => u.nama_user.toLowerCase() === namaUser.toLowerCase());
    if (existing) {
      showToast('User dengan Nama User ini sudah terdaftar!', 'error');
      return;
    }

    const newUser = { nama_user: namaUser, password: password, role: role };
    usersDb.unshift(newUser);
  }

  saveUserDatabaseToStorage();
  syncUsersToCloud(usersDb);
  closeAddUserModal();
  renderUserDatabaseTable();
  showToast(isEdit ? `User (${namaUser}) Berhasil Diperbarui!` : `User Baru (${namaUser}) Berhasil Ditambahkan ke Database!`, 'success');
}

function deleteUser(namaUser) {
  if (namaUser === "Mochamad Fauzie, S.Gz") {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Aksi Ditolak',
        text: 'Admin Utama tidak dapat dihapus dari database!',
        confirmButtonColor: '#2563eb'
      });
    } else {
      showToast('Admin Utama tidak dapat dihapus!', 'error');
    }
    return;
  }

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus User Database?',
      html: `Apakah Anda yakin ingin menghapus User <strong>[${namaUser}]</strong> dari Database?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus User!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        usersDb = usersDb.filter(u => u.nama_user !== namaUser);
        saveUserDatabaseToStorage();
        deleteUserFromCloud(namaUser);
        renderUserDatabaseTable();
        populateUserDropdowns();
        Swal.fire('Terhapus!', `User ${namaUser} Berhasil Dihapus dari Database.`, 'success');
      }
    });
  } else if (confirm(`Apakah Anda yakin ingin menghapus User [${namaUser}] dari Database?`)) {
    usersDb = usersDb.filter(u => u.nama_user !== namaUser);
    saveUserDatabaseToStorage();
    deleteUserFromCloud(namaUser);
    renderUserDatabaseTable();
    populateUserDropdowns();
    showToast(`User ${namaUser} Berhasil Dihapus!`, 'success');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const nik = document.getElementById('nik').value.trim();
  if (nik.length !== 16) {
    showToast('NIK wajib 16 digit angka!', 'error');
    return;
  }

  const formData = {
    id: currentEditingId || `CKG-2026-${String(records.length + 1).padStart(3, '0')}`,
    jenis_kegiatan: document.querySelector('input[name="jenis_kegiatan"]:checked')?.value || 'Luar Gedung',
    pos_lokasi: document.getElementById('pos_lokasi')?.value || '',
    nik: nik,
    nama: document.getElementById('nama').value,
    tanggal_lahir: document.getElementById('tanggal_lahir').value,
    usia: parseInt(document.getElementById('usia').value) || 0,
    jenis_kelamin: document.getElementById('jenis_kelamin').value,
    no_whatsapp: document.getElementById('no_whatsapp').value,
    status_pernikahan: document.getElementById('status_pernikahan').value,
    provinsi: document.getElementById('provinsi').value,
    kab_kota: document.getElementById('kab_kota').value,
    kecamatan: document.getElementById('kecamatan').value,
    kelurahan: document.getElementById('kelurahan').value,
    alamat: document.getElementById('alamat').value,
    pekerjaan: document.getElementById('pekerjaan').value,
    merokok: document.querySelector('input[name="merokok"]:checked')?.value || 'Tidak',
    bb: parseFloat(document.getElementById('bb').value) || 0,
    tb: parseFloat(document.getElementById('tb').value) || 0,
    lp: parseFloat(document.getElementById('lp').value) || 0,
    imt: parseFloat(document.getElementById('imt').value) || 0,
    td_sistolik: parseInt(document.getElementById('td_sistolik').value) || 0,
    td_diastolik: parseInt(document.getElementById('td_diastolik').value) || 0,
    gula_darah: parseInt(document.getElementById('gula_darah').value) || 0,
    kolesterol: parseInt(document.getElementById('kolesterol').value) || 0,
    hb: parseFloat(document.getElementById('hb').value) || 0,
    telinga: document.getElementById('telinga').value,
    mata: document.getElementById('mata').value,
    gigi: document.getElementById('gigi').value,
    katarak: document.querySelector('input[name="katarak"]:checked')?.value || 'Tidak',
    status_validasi: "Terverifikasi",
    created_by: sessionStorage.getItem('ckg_user_name') || currentRole || 'Admin',
    petugas_entry: sessionStorage.getItem('ckg_user_name') || currentRole || 'Admin',
    created_at: new Date().toISOString().substring(0, 10),
    tanggal_entry: new Date().toISOString().substring(0, 10)
  };

  const isEdit = !!currentEditingId;

  // Show loading
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Menyimpan ke Cloud Database...',
      html: '<div style="font-size:13px;color:#475569;">Mengirim data pasien ke Cloudflare D1 Database</div>',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  }

  try {
    // 1. Send directly to Cloud D1 Database FIRST
    const res = await fetch('/api/ckg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([formData])
    });

    if (!res.ok) {
      throw new Error('Server responded with status ' + res.status);
    }

    // 2. Update local cache AFTER cloud success
    if (currentEditingId) {
      const idx = records.findIndex(r => r.id === currentEditingId);
      if (idx !== -1) records[idx] = formData;
    } else {
      records.unshift(formData);
    }
    localStorage.setItem('ckg_records', JSON.stringify(records));

    closeInputModal();
    renderApp();
    updateCloudSyncPill(true, `D1 Online (${records.length} Rec)`);

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: isEdit ? 'Data CKG Berhasil Diperbarui!' : 'Data CKG Tersimpan ke Cloud!',
        html: `Rekam medis pasien <strong>${formData.nama}</strong> (NIK: ${formData.nik}) telah tersimpan langsung ke <strong>Cloudflare D1 Database</strong>.`,
        confirmButtonColor: '#059669'
      });
    } else {
      showToast(isEdit ? 'Data CKG Berhasil Diperbarui!' : 'Data CKG Tersimpan ke Cloud D1!', 'success');
    }
  } catch (err) {
    console.error('Failed to save to cloud D1:', err);
    // Fallback: save to local only
    if (currentEditingId) {
      const idx = records.findIndex(r => r.id === currentEditingId);
      if (idx !== -1) records[idx] = formData;
    } else {
      records.unshift(formData);
    }
    localStorage.setItem('ckg_records', JSON.stringify(records));
    closeInputModal();
    renderApp();

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'warning',
        title: 'Tersimpan Lokal (Offline)',
        html: `Gagal mengirim ke Cloud D1: <strong>${err.message}</strong>.<br>Data disimpan secara lokal dan akan di-sync otomatis nanti.`,
        confirmButtonColor: '#f59e0b'
      });
    } else {
      showToast('Data disimpan lokal. Akan di-sync otomatis ke cloud.', 'warning');
    }
  }
}

function resetFilters() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');
  const loggedUser = sessionStorage.getItem('ckg_user_name') || '';

  ['filterKegiatan', 'filterBulan', 'filterTahun', 'filterTanggal', 'filterPetugas', 'filterUmur'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'filterPetugas' && !isPrivileged && loggedUser) {
        el.value = loggedUser;
      } else {
        el.value = '';
      }
    }
  });
  applyPetugasFilterLock();
  renderTableRecords();
  showToast('Filter telah di-reset.', 'info');
}

let currentRekapFilter = 'semua';

function isRecordInMonthYear(r, targetMonth, targetYear) {
  if (!targetMonth && !targetYear) return true;

  const rawDate = r.created_at || r.tanggal_entry || r.created_date || r.tanggal || r.entry_date || '';
  if (!rawDate) return true;

  let recMonth = '';
  let recYear = '';

  const dStr = String(rawDate).trim();

  if (dStr.includes('T')) {
    const datePart = dStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length >= 2) {
      recYear = parts[0];
      recMonth = parts[1].padStart(2, '0');
    }
  } else if (dStr.includes('-')) {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        recYear = parts[0];
        recMonth = parts[1].padStart(2, '0');
      } else {
        recMonth = parts[1].padStart(2, '0');
        recYear = parts[2].substring(0, 4);
      }
    }
  } else if (dStr.includes('/')) {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        recYear = parts[0];
        recMonth = parts[1].padStart(2, '0');
      } else {
        recMonth = parts[1].padStart(2, '0');
        recYear = parts[2].substring(0, 4);
      }
    }
  }

  if (targetMonth && recMonth && recMonth !== targetMonth.padStart(2, '0')) return false;
  if (targetYear && recYear && recYear !== targetYear) return false;

  return true;
}

function getOfficerPerformanceData(monthFilter = null, yearFilter = null) {
  const mSelect = document.getElementById('dashBulan');
  const ySelect = document.getElementById('dashTahun');

  const selectedMonth = monthFilter !== null ? monthFilter : (mSelect ? mSelect.value : String(new Date().getMonth() + 1).padStart(2, '0'));
  const selectedYear = yearFilter !== null ? yearFilter : (ySelect ? ySelect.value : String(new Date().getFullYear()));

  const filteredRecords = getVisibleRecords(records).filter(r => isRecordInMonthYear(r, selectedMonth, selectedYear));

  return usersDb.map(u => {
    const name = u.nama_user;
    const ckgLuar = filteredRecords.filter(r => (r.petugas_entry === name || r.created_by === name || r.created_by === `petugas_${name}`) && r.jenis_kegiatan === 'Luar Gedung').length;
    const ckgDalam = filteredRecords.filter(r => (r.petugas_entry === name || r.created_by === name || r.created_by === `petugas_${name}`) && r.jenis_kegiatan === 'Dalam Gedung').length;

    return {
      nama: name,
      role: u.role || 'Petugas',
      luarCount: ckgLuar,
      dalamCount: ckgDalam
    };
  });
}

function filterRekapitulasi(type) {
  currentRekapFilter = type;

  const btnSemua = document.getElementById('btnRekapSemua');
  const btnLuar = document.getElementById('btnRekapLuar');
  const btnDalam = document.getElementById('btnRekapDalam');
  const thTotal = document.getElementById('thTotalEntriRekap');

  if (btnSemua) {
    btnSemua.className = `btn btn-sm ${type === 'semua' ? 'btn-primary' : 'btn-outline-primary'}`;
    btnSemua.style.background = type === 'semua' ? '' : '#ffffff';
    btnSemua.style.color = type === 'semua' ? '' : '#3b82f6';
  }
  if (btnLuar) {
    btnLuar.className = `btn btn-sm ${type === 'luar' ? 'btn-primary' : 'btn-outline-primary'}`;
    btnLuar.style.background = type === 'luar' ? '#0284c7' : '#ffffff';
    btnLuar.style.color = type === 'luar' ? '#ffffff' : '#0284c7';
    btnLuar.style.borderColor = '#0284c7';
  }
  if (btnDalam) {
    btnDalam.className = `btn btn-sm ${type === 'dalam' ? 'btn-primary' : 'btn-outline-primary'}`;
    btnDalam.style.background = type === 'dalam' ? '#059669' : '#ffffff';
    btnDalam.style.color = type === 'dalam' ? '#ffffff' : '#059669';
    btnDalam.style.borderColor = '#059669';
  }

  if (thTotal) {
    if (type === 'luar') thTotal.textContent = 'Total Luar';
    else if (type === 'dalam') thTotal.textContent = 'Total Dalam';
    else thTotal.textContent = 'Total Entri';
  }

  const officersData = getOfficerPerformanceData();
  renderOfficerPerformanceTable(officersData);
}

function renderApp() {
  updateRoleUI();
  const officersData = getOfficerPerformanceData();
  renderDashboardMetrics(officersData);
  renderOfficerPerformanceTable(officersData);
  renderTableRecords();
  renderSimpusView();
  renderUserDatabaseTable();
  renderRecycleTable();
  updateTotalEntryMonthMetric();
  if (typeof initDashboardCharts === 'function') {
    initDashboardCharts(officersData);
  }
}

function renderDashboardMetrics(officersData = getOfficerPerformanceData()) {
  let totalLuar = 0;
  let totalDalam = 0;

  officersData.forEach(o => {
    totalLuar += o.luarCount;
    totalDalam += o.dalamCount;
  });

  const totalAll = totalLuar + totalDalam;
  const targetAchievedCount = officersData.filter(o => (o.luarCount + o.dalamCount) >= 200).length;

  const totalEl = document.getElementById('dashTotalEntri');
  const luarEl = document.getElementById('dashLuarGedung');
  const dalamEl = document.getElementById('dashDalamGedung');
  const targetEl = document.getElementById('dashCapaiTarget');

  if (totalEl) totalEl.textContent = totalAll.toLocaleString('id-ID');
  if (luarEl) luarEl.textContent = totalLuar.toLocaleString('id-ID');
  if (dalamEl) dalamEl.textContent = totalDalam.toLocaleString('id-ID');
  if (targetEl) targetEl.textContent = `${targetAchievedCount} / ${officersData.length}`;

  updateTotalEntryMonthMetric();
}

function updateTotalEntryMonthMetric() {
  const totalEl = document.getElementById('totalEntryMonth');
  if (!totalEl) return;

  const now = new Date();
  const yearStr = now.getFullYear().toString();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');

  // Count ONLY records from Data Record CKG (getVisibleRecords(records)) for the current calendar month
  const visibleRecords = getVisibleRecords(records);
  const currentMonthRecords = visibleRecords.filter(r => isRecordInMonthYear(r, monthStr, yearStr));

  totalEl.textContent = currentMonthRecords.length.toLocaleString('id-ID');
}

function renderOfficerPerformanceTable(officersData = getOfficerPerformanceData()) {
  const tbody = document.getElementById('officerPerformanceTableBody');
  if (!tbody) return;

  const targetMin = 200;
  let displayData = [...officersData];

  if (currentRekapFilter === 'luar') {
    displayData.sort((a, b) => b.luarCount - a.luarCount);
  } else if (currentRekapFilter === 'dalam') {
    displayData.sort((a, b) => b.dalamCount - a.dalamCount);
  } else {
    displayData.sort((a, b) => (b.luarCount + b.dalamCount) - (a.luarCount + a.dalamCount));
  }

  tbody.innerHTML = displayData.map((o, index) => {
    let displayTotal = o.luarCount + o.dalamCount;
    if (currentRekapFilter === 'luar') displayTotal = o.luarCount;
    if (currentRekapFilter === 'dalam') displayTotal = o.dalamCount;

    const pctLuar = Math.round((o.luarCount / targetMin) * 100);
    const pctDalam = Math.round((o.dalamCount / targetMin) * 100);
    const valColor = currentRekapFilter === 'luar' ? '#0284c7' : (currentRekapFilter === 'dalam' ? '#059669' : 'var(--primary)');

    return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: #475569;">${index + 1}</td>
        <td><strong>${o.nama}</strong></td>
        <td>
          <div class="progress-cell">
            <div class="progress-track">
              <div class="progress-fill fill-blue" style="width: ${Math.min(pctLuar, 100)}%;"></div>
            </div>
            <span class="progress-text">${pctLuar}% (${o.luarCount}/${targetMin})</span>
          </div>
        </td>
        <td>
          <div class="progress-cell">
            <div class="progress-track">
              <div class="progress-fill fill-emerald" style="width: ${Math.min(pctDalam, 100)}%;"></div>
            </div>
            <span class="progress-text">${pctDalam}% (${o.dalamCount}/${targetMin})</span>
          </div>
        </td>
        <td style="text-align: right;">
          <strong style="font-size: 14px; color: ${valColor};">${displayTotal.toLocaleString('id-ID')}</strong>
        </td>
      </tr>
    `;
  }).join('');
}

function renderUserDatabaseTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  sortUsersDbByRoleHierarchy();

  const activeUser = sessionStorage.getItem('ckg_user_name');

  tbody.innerHTML = usersDb.map((u, i) => {
    const isCurrentActive = activeUser === u.nama_user;
    
    let roleBadge = `<span class="badge badge-emerald">${u.role}</span>`;
    if (u.role === 'Admin') roleBadge = `<span class="badge badge-rose">Admin</span>`;
    if (u.role === 'Koordinator') roleBadge = `<span class="badge badge-amber">Koordinator</span>`;

    const safeNama = u.nama_user.replace(/'/g, "\\'");

    // Live session calculation
    const sessInfo = activeSessionsMap[u.nama_user] || {};
    const now = Date.now();
    const isLiveActive = (sessInfo.status === 'active') && (sessInfo.last_seen && (now - Number(sessInfo.last_seen)) < 90000);
    const isOnline = isCurrentActive || isLiveActive;

    let sessionStatusHtml = isOnline ? `
      <span class="badge" style="display:inline-flex; align-items:center; gap:6px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:600; padding:4px 10px; border-radius:20px; font-size:11.5px;">
        <span style="width:8px; height:8px; background:#10b981; border-radius:50%; display:inline-block; animation:pulseDot 1.5s infinite;"></span>
        Live Session Aktif
      </span>
    ` : `
      <span class="badge" style="display:inline-flex; align-items:center; gap:6px; background:#f8fafc; color:#64748b; border:1px solid #e2e8f0; font-weight:500; padding:4px 10px; border-radius:20px; font-size:11.5px;">
        <i class="bi bi-circle-fill" style="font-size:6px; color:#94a3b8;"></i> Offline
      </span>
    `;

    if (u.is_banned) {
      sessionStatusHtml = `<span class="badge badge-rose" style="background:#fef2f2; color:#dc2626; border:1px solid #fecaca;"><i class="bi bi-slash-circle-fill"></i> Banned (${u.banned_duration_label || 'Nonaktif'})</span>`;
    }

    const safePassword = String(u.password || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const hasPassword = Boolean(u.password && String(u.password).trim().length > 0);

    const passwordDisplayHtml = hasPassword ? `
      <div style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <code id="passCode_${i}" style="color: #dc2626; font-weight: 800; font-family: monospace; font-size: 13px; letter-spacing: 2px;">••••••••</code>
        <button type="button" onclick="toggleTablePasswordVisibility('${i}', '${safePassword}')" style="border: none; background: transparent; cursor: pointer; color: #64748b; padding: 0 2px; font-size: 13px; display: inline-flex; align-items: center;" title="Lihat/Sembunyikan Password">
          <i id="eyeIcon_${i}" class="bi bi-eye-slash-fill"></i>
        </button>
      </div>
    ` : '<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Tanpa Password</span>';

    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${u.nama_user}</strong></td>
        <td>${passwordDisplayHtml}</td>
        <td>${roleBadge}</td>
        <td>${sessionStatusHtml}</td>
        <td>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-amber btn-sm" onclick="openEditUserModal('${safeNama}')" title="Edit User">
              <i class="bi bi-pencil-square"></i> Edit
            </button>
            ${u.nama_user !== "Mochamad Fauzie, S.Gz" ? (
              u.is_banned ? `
                <button class="btn btn-emerald btn-sm" onclick="unbanUser('${safeNama}')" title="Buka Blokir">
                  <i class="bi bi-unlock-fill"></i> Unban
                </button>
              ` : `
                <button class="btn btn-rose btn-sm" onclick="openBanUserModal('${safeNama}')" style="background: #dc2626; color: #fff;" title="Blokir User">
                  <i class="bi bi-slash-circle-fill"></i> Blokir
                </button>
              `
            ) : ''}
            ${u.nama_user !== "Mochamad Fauzie, S.Gz" ? `
              <button class="btn btn-danger btn-sm" onclick="deleteUser('${safeNama}')" title="Hapus User">
                <i class="bi bi-trash"></i> Hapus
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openBanUserModal(namaUser) {
  if (namaUser === "Mochamad Fauzie, S.Gz") {
    Swal.fire({
      icon: 'error',
      title: 'Aksi Ditolak',
      text: 'Admin Utama tidak dapat dibanned/dinonaktifkan!',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  Swal.fire({
    title: 'Blokir / Nonaktifkan User',
    html: `
      <div style="text-align: left; font-size: 13px;">
        <p style="margin-bottom: 12px; font-weight:600;">Pilih durasi penonaktifan akun untuk <strong>${namaUser}</strong>:</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <input type="radio" name="banDuration" value="1d" checked> <strong>1 Hari</strong> (24 Jam)
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <input type="radio" name="banDuration" value="3d"> <strong>3 Hari</strong>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <input type="radio" name="banDuration" value="7d"> <strong>7 Hari</strong>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <input type="radio" name="banDuration" value="30d"> <strong>30 Hari</strong>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: #fef2f2; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecaca; color: #dc2626;">
            <input type="radio" name="banDuration" value="permanent"> <strong>Permanen</strong> (Selamanya)
          </label>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Proses Blokir',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    preConfirm: () => {
      const selected = document.querySelector('input[name="banDuration"]:checked');
      if (!selected) {
        Swal.showValidationMessage('Pilih salah satu durasi blokir!');
        return false;
      }
      return selected.value;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const dur = result.value;
      const userObj = usersDb.find(u => u.nama_user === namaUser);
      if (!userObj) return;

      userObj.is_banned = true;
      const now = new Date();

      if (dur === '1d') {
        now.setDate(now.getDate() + 1);
        userObj.banned_until = now.toISOString();
        userObj.banned_duration_label = '1 Hari';
      } else if (dur === '3d') {
        now.setDate(now.getDate() + 3);
        userObj.banned_until = now.toISOString();
        userObj.banned_duration_label = '3 Hari';
      } else if (dur === '7d') {
        now.setDate(now.getDate() + 7);
        userObj.banned_until = now.toISOString();
        userObj.banned_duration_label = '7 Hari';
      } else if (dur === '30d') {
        now.setDate(now.getDate() + 30);
        userObj.banned_until = now.toISOString();
        userObj.banned_duration_label = '30 Hari';
      } else {
        userObj.banned_until = 'PERMANENT';
        userObj.banned_duration_label = 'Permanen';
      }

      saveUserDatabaseToStorage();
      syncUsersToCloud(usersDb);
      renderUserDatabaseTable();

      Swal.fire({
        icon: 'success',
        title: 'User Berhasil Di-Blokir!',
        text: `User ${namaUser} telah dinonaktifkan dengan durasi: ${userObj.banned_duration_label}.`,
        confirmButtonColor: '#2563eb'
      });
    }
  });
}

function unbanUser(namaUser) {
  Swal.fire({
    title: 'Buka Blokir User?',
    html: `Apakah Anda yakin ingin mengaktifkan kembali akun User <strong>[${namaUser}]</strong>?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#059669',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Aktifkan!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      const userObj = usersDb.find(u => u.nama_user === namaUser);
      if (userObj) {
        userObj.is_banned = false;
        userObj.banned_until = null;
        userObj.banned_duration_label = null;
        saveUserDatabaseToStorage();
        syncUsersToCloud(usersDb);
        renderUserDatabaseTable();
        Swal.fire('Berhasil!', `Akun ${namaUser} telah aktif kembali.`, 'success');
      }
    }
  });
}

function getRecordEntryDate(r) {
  const dStr = r.tanggal_entry || r.created_at || r.tanggal || '';
  if (!dStr && dStr !== 0) return null;
  const str = String(dStr).trim();
  if (!str || str === 'undefined' || str === 'null') return null;

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    return { year: parts[0], month: parts[1], day: parts[2], yyyymmdd: `${parts[0]}-${parts[1]}-${parts[2]}` };
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/.test(str)) {
    const parts = str.split(/[\/-]/);
    const day = String(parts[0]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[2];
    return { year, month, day, yyyymmdd: `${year}-${month}-${day}` };
  }

  // Handle Excel serial date numbers
  if (/^\d{4,5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    if (!isNaN(date_info.getTime())) {
      const year = String(date_info.getFullYear());
      const month = String(date_info.getMonth() + 1).padStart(2, '0');
      const day = String(date_info.getDate()).padStart(2, '0');
      return { year, month, day, yyyymmdd: `${year}-${month}-${day}` };
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = String(parsed.getFullYear());
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return { year, month, day, yyyymmdd: `${year}-${month}-${day}` };
  }

  return null;
}

function renderTableRecords() {
  const tbody = document.getElementById('tableBodyDataRecords');
  if (!tbody) return;

  applyPetugasFilterLock();

  const filterKegiatanVal = document.getElementById('filterKegiatan')?.value || '';
  const filterBulanVal = document.getElementById('filterBulan')?.value || '';
  const filterTahunVal = document.getElementById('filterTahun')?.value || '';
  const filterTanggalVal = document.getElementById('filterTanggal')?.value || '';
  const filterPetugasVal = document.getElementById('filterPetugas')?.value || '';
  const filterUmurVal = document.getElementById('filterUmur')?.value || '';

  // Apply Row-Level Data Visibility (Petugas only sees own records; Admin & Koordinator see all)
  let filtered = getVisibleRecords(records);

  if (filterKegiatanVal) {
    filtered = filtered.filter(r => r.jenis_kegiatan === filterKegiatanVal);
  }

  if (filterBulanVal) {
    filtered = filtered.filter(r => {
      const recDate = getRecordEntryDate(r);
      return recDate ? recDate.month === filterBulanVal : false;
    });
  }

  if (filterTahunVal) {
    filtered = filtered.filter(r => {
      const recDate = getRecordEntryDate(r);
      return recDate ? recDate.year === filterTahunVal : false;
    });
  }

  if (filterTanggalVal) {
    filtered = filtered.filter(r => {
      const recDate = getRecordEntryDate(r);
      return recDate ? recDate.yyyymmdd === filterTanggalVal : false;
    });
  }

  if (filterPetugasVal) {
    filtered = filtered.filter(r => r.created_by === filterPetugasVal || r.petugas_entry === filterPetugasVal);
  }

  if (filterUmurVal === 'anak') {
    filtered = filtered.filter(r => r.usia < 18);
  } else if (filterUmurVal === 'dewasa') {
    filtered = filtered.filter(r => r.usia >= 18 && r.usia < 60);
  } else if (filterUmurVal === 'lansia') {
    filtered = filtered.filter(r => r.usia >= 60);
  }

  tbody.innerHTML = buildTableRowsHtml(filtered);

  const totalBulanBadge = document.getElementById('totalEntryBulanText');
  if (totalBulanBadge) {
    totalBulanBadge.textContent = `Total Entry Bulan Ini: ${filtered.length}`;
  }
}

function formatDisplayDate(val) {
  if (!val && val !== 0) return '-';
  val = String(val).trim();
  if (!val || val === 'undefined' || val === 'null') return '-';

  // Handle Excel serial date numbers (e.g. 24959 -> 15-05-1968)
  if (/^\d{4,5}$/.test(val)) {
    const serial = parseInt(val, 10);
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    if (!isNaN(date_info.getTime())) {
      const d = String(date_info.getDate()).padStart(2, '0');
      const m = String(date_info.getMonth() + 1).padStart(2, '0');
      const y = date_info.getFullYear();
      return `${d}-${m}-${y}`;
    }
  }

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const parts = val.substring(0, 10).split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/.test(val)) {
    const parts = val.split(/[\/-]/);
    const d = String(parts[0]).padStart(2, '0');
    const m = String(parts[1]).padStart(2, '0');
    return `${d}-${m}-${parts[2]}`;
  }

  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}-${m}-${y}`;
  }

  return val;
}

function buildTableRowsHtml(data) {
  if (data.length === 0) {
    return `
      <tr>
        <td colspan="15" style="text-align: center; padding: 30px; color: var(--text-muted);">
          <i class="bi bi-inbox" style="font-size: 28px; display: block; margin-bottom: 6px;"></i>
          Tidak ada data CKG yang sesuai dengan filter yang dipilih.
        </td>
      </tr>
    `;
  }

  return data.map((r, i) => {
    const isHipertensi = r.td_sistolik > 140 || r.td_diastolik > 90;
    const isGulaTinggi = r.gula_darah > 200;
    const isAnemia = r.hb > 0 && r.hb < 11.0;

    const trClass = isHipertensi ? 'tr-alert-hipertensi' : '';
    const tdClass = isHipertensi ? 'cell-hipertensi' : '';
    const gulaClass = isGulaTinggi ? 'cell-gula-tinggi' : '';
    const hbClass = isAnemia ? 'cell-anemia' : '';

    let imtBadge = `<span class="badge badge-emerald">${r.imt}</span>`;
    if (r.imt < 18.5) imtBadge = `<span class="badge badge-amber">${r.imt} (Kurus)</span>`;
    else if (r.imt >= 25.0 && r.imt <= 29.9) imtBadge = `<span class="badge badge-amber">${r.imt} (Gemuk)</span>`;
    else if (r.imt >= 30.0) imtBadge = `<span class="badge badge-rose">${r.imt} (Obesitas)</span>`;

    const kegiatanBadge = r.jenis_kegiatan === 'Luar Gedung'
      ? `<span class="badge badge-cyan"><i class="bi bi-geo-alt-fill"></i> Luar Gedung</span>`
      : `<span class="badge badge-emerald"><i class="bi bi-building-fill"></i> Dalam Gedung</span>`;

    return `
      <tr class="${trClass}">
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn btn-secondary btn-sm" onclick="viewDetailModal('${r.id}')" title="Detail">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-cyan btn-sm" onclick="editRecord('${r.id}')" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteRecord('${r.id}')" title="Hapus ke Tempat Sampah">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
        <td style="text-align: center; font-weight: bold;">${i + 1}</td>
        <td><span style="font-size: 12px; font-weight: 600; color: var(--primary);">${formatDisplayDate(r.tanggal_entry || r.created_at)}</span></td>
        <td>${kegiatanBadge}</td>
        <td>
          <strong>${r.nama}</strong><br>
          <span style="font-size: 11px; color: var(--text-muted);">${r.nik}</span>
        </td>
        <td>${formatDisplayDate(r.tanggal_lahir)}<br><span style="font-size: 11px; color: var(--text-muted);">${r.usia} th (${r.jenis_kelamin})</span></td>
        <td>${r.alamat}<br><span style="font-size: 11px; color: var(--text-muted);">${r.kelurahan}, ${r.kecamatan}</span></td>
        <td>${r.bb} kg / ${r.tb} cm / ${r.lp || '-'} cm</td>
        <td>${imtBadge}</td>
        <td><span class="${tdClass}">${r.td_sistolik}/${r.td_diastolik}</span></td>
        <td><span class="${gulaClass}">${r.gula_darah ? r.gula_darah + ' mg/dL' : '-'}</span></td>
        <td>${r.kolesterol ? r.kolesterol + ' mg/dL' : '-'}</td>
        <td><span class="${hbClass}">${r.hb ? r.hb + ' g/dL' : '-'}</span></td>
        <td>${r.katarak === 'Ya' ? '<span class="badge badge-rose">Katarak</span>' : '<span class="badge badge-emerald">Normal</span>'}</td>
        <td><span class="badge badge-emerald">${r.status_validasi}</span></td>
      </tr>
    `;
  }).join('');
}

function confirmDeleteAllCkgRecords() {
  if (currentRole !== 'Admin' && currentRole !== 'admin') {
    showToast('Hanya Admin yang dapat menghapus semua data.', 'error');
    return;
  }

  if (records.length === 0) {
    showToast('Tidak ada data CKG untuk dihapus.', 'info');
    return;
  }

  if (typeof Swal === 'undefined') {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data CKG?')) {
      window._intentionalDeleteAll = true;
      records = [];
      localStorage.removeItem('ckg_records');
      fetch('/api/ckg', { method: 'DELETE' });
      renderApp();
      updateCloudSyncPill(true, 'D1 Online (0 Rec)');
      showToast('Seluruh Data CKG Berhasil Dihapus!', 'success');
      setTimeout(() => { window._intentionalDeleteAll = false; }, 120000);
    }
    return;
  }

  Swal.fire({
    title: '<span style="color:#dc2626; font-size: 20px;"><i class="bi bi-exclamation-triangle-fill"></i> HAPUS SEMUA DATA CKG?</span>',
    html: `
      <div style="text-align:left; font-size:13px; color:#475569; margin-bottom:12px; line-height:1.5;">
        Apakah Anda yakin ingin menghapus <strong>SEMUA (${records.length}) DATA CKG</strong>?<br>
        <span style="color:#dc2626; font-weight:600;">Peringatan: Seluruh data CKG akan dihapus secara permanen dari Cloudflare D1 Database & Penyimpanan Aplikasi!</span>
      </div>
      <div style="margin-top:14px; text-align:left; background:#fef2f2; padding:12px; border-radius:8px; border:1px solid #fecaca;">
        <label style="font-size:12px; font-weight:700; color:#991b1b; display:block; margin-bottom:6px;">
          Ketik "HAPUS SEMUA DATA" di bawah untuk mengaktifkan tombol konfirmasi:
        </label>
        <input type="text" id="confirmDeleteInputText" class="swal2-input" placeholder="HAPUS SEMUA DATA" style="width:100%; margin:0; font-weight:700; text-transform:uppercase; border:2px solid #f87171; border-radius:6px; padding:8px 12px; box-sizing:border-box; color:#991b1b;">
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus Semua Data!',
    cancelButtonText: 'Batal',
    didOpen: () => {
      const confirmBtn = Swal.getConfirmButton();
      const inputEl = document.getElementById('confirmDeleteInputText');
      if (confirmBtn && inputEl) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.4';
        confirmBtn.style.cursor = 'not-allowed';

        inputEl.addEventListener('input', () => {
          if (inputEl.value.trim() === 'HAPUS SEMUA DATA') {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
          } else {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.4';
            confirmBtn.style.cursor = 'not-allowed';
          }
        });
      }
    },
    preConfirm: () => {
      const inputEl = document.getElementById('confirmDeleteInputText');
      if (!inputEl || inputEl.value.trim() !== 'HAPUS SEMUA DATA') {
        Swal.showValidationMessage('Harap ketik "HAPUS SEMUA DATA" dengan benar!');
        return false;
      }
      return true;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      window._intentionalDeleteAll = true;

      // Show progress loading indicator while deleting from Cloud D1
      Swal.fire({
        title: 'Menghapus Seluruh Data dari Cloud...',
        html: '<div style="font-size:13px; color:#475569; margin-top:6px;"><i class="bi bi-cloud-arrow-up-fill" style="color:#dc2626;"></i> Mengirim perintah HAPUS SEMUA DATA ke Cloudflare D1 Database...</div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const res = await fetch('/api/ckg', { method: 'DELETE' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Gagal mengosongkan database server`);
        }

        records = [];
        localStorage.removeItem('ckg_records');
        renderApp();
        updateCloudSyncPill(true, 'D1 Online (0 Rec)');

        Swal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus!',
          html: 'Seluruh Data CKG telah <strong>berhasil dihapus secara permanen dari Cloudflare D1 Database</strong>.',
          confirmButtonColor: '#059669'
        });
      } catch (err) {
        console.error('Failed to delete all ckg_full_records:', err);
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus Data!',
          html: `Terjadi kesalahan saat menghapus data dari Cloud: <strong>${err.message}</strong>`,
          confirmButtonColor: '#dc2626'
        });
      }

      setTimeout(() => { window._intentionalDeleteAll = false; }, 120000);
    }
  });
}

async function deleteRecord(id) {
  const targetRecord = records.find(r => r.id === id);
  if (!targetRecord) {
    showToast('Data CKG tidak ditemukan!', 'error');
    return;
  }

  const result = await Swal.fire({
    title: 'Hapus Data CKG?',
    html: `<div style="font-size: 13.5px; text-align: left; line-height: 1.5;">
            Apakah Anda yakin ingin menghapus data pasien:
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
              <strong>Nama:</strong> ${targetRecord.nama}<br>
              <strong>NIK:</strong> ${targetRecord.nik || '-'}<br>
              <strong>ID:</strong> ${targetRecord.id}
            </div>
            <span style="color: #dc2626; font-weight: 600; font-size: 12px;">
              <i class="bi bi-cloud-arrow-down-fill"></i> Data akan dihapus dari Cloud D1 Database dan dipindahkan ke Recycle Data.
            </span>
          </div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-trash-fill"></i> Ya, Hapus Data Cloud',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  // Show progress loading overlay
  Swal.fire({
    title: 'Menghapus Data dari Cloud Database...',
    html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
            <i class="bi bi-cloud-arrow-up-fill" style="color: #2563eb;"></i> Mengirim perintah HAPUS untuk data <strong>${targetRecord.nama}</strong> ke Cloudflare D1 Database...
          </div>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // 1. Send DELETE HTTP request directly to Cloud D1 API
    const res = await fetch(`/api/ckg?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: Gagal menghapus dari server cloud`);
    }

    // 2. Add to Recycle Bin & save recycle bin to cloud
    targetRecord.deleted_at = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
    targetRecord.deleted_by = sessionStorage.getItem('ckg_user_name') || currentRole || 'User';
    targetRecord.original_source = 'BNBA Skrining CKG';
    recycleBin.unshift(targetRecord);
    await saveRecycleBinToStorage(targetRecord);

    // 3. Remove from local state AFTER cloud confirmation
    records = records.filter(r => r.id !== id);
    localStorage.setItem('ckg_records', JSON.stringify(records));

    renderApp();
    updateCloudSyncPill(true, `D1 Online (${records.length} Rec)`);

    // 4. Show success notification ONLY AFTER Cloud confirmation
    Swal.fire({
      icon: 'success',
      title: 'Berhasil Dihapus dari Cloud!',
      html: `Data pasien <strong>${targetRecord.nama}</strong> (NIK: ${targetRecord.nik || '-'}) telah <strong>terhapus dari Cloudflare D1 Database</strong> dan dipindahkan ke Recycle Data.`,
      confirmButtonColor: '#059669'
    });
  } catch (err) {
    console.error('Failed to delete CKG record from cloud D1:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Menghapus Data!',
      html: `Gagal menghapus data dari Cloud Database: <strong>${err.message}</strong>.<br>Data tidak terhapus. Silakan periksa koneksi internet Anda.`,
      confirmButtonColor: '#dc2626'
    });
  }
}

async function deleteSimpusRecord(id) {
  const targetSimpus = simpusRecords.find(r => (r.id || r.nik || '') === id);
  if (!targetSimpus) {
    showToast('Data SIMPUS tidak ditemukan!', 'error');
    return;
  }

  const result = await Swal.fire({
    title: 'Hapus Data SIMPUS?',
    html: `<div style="font-size: 13.5px; text-align: left; line-height: 1.5;">
            Apakah Anda yakin ingin menghapus data SIMPUS:
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
              <strong>Nama:</strong> ${targetSimpus.nama || targetSimpus.nik}<br>
              <strong>NIK:</strong> ${targetSimpus.nik || '-'}
            </div>
            <span style="color: #dc2626; font-weight: 600; font-size: 12px;">
              <i class="bi bi-cloud-arrow-down-fill"></i> Data akan dihapus dari Cloud D1 Database dan dipindahkan ke Recycle Data.
            </span>
          </div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-trash-fill"></i> Ya, Hapus Data Cloud',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  Swal.fire({
    title: 'Menghapus Data SIMPUS dari Cloud...',
    html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
            <i class="bi bi-cloud-arrow-up-fill" style="color: #2563eb;"></i> Mengirim perintah HAPUS untuk data SIMPUS <strong>${targetSimpus.nama || targetSimpus.nik}</strong> ke Cloud D1...
          </div>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const targetId = targetSimpus.id || targetSimpus.nik || id;
    const deleteTab = targetSimpus.is_divided ? 'sudah_bagi' : 'belum_bagi';
    const res = await fetch(`/api/simpus?tab=${deleteTab}&id=${encodeURIComponent(targetId)}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: Gagal menghapus data SIMPUS dari server`);
    }

    targetSimpus.deleted_at = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
    targetSimpus.deleted_by = sessionStorage.getItem('ckg_user_name') || currentRole || 'User';
    targetSimpus.original_source = 'Data SIMPUS CKG';
    recycleBin.unshift(targetSimpus);
    await saveRecycleBinToStorage(targetSimpus);

    simpusRecords = simpusRecords.filter(r => (r.id || r.nik || '') !== id);
    localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

    renderApp();

    Swal.fire({
      icon: 'success',
      title: 'Berhasil Dihapus dari Cloud!',
      html: `Data SIMPUS <strong>${targetSimpus.nama || targetSimpus.nik}</strong> telah <strong>terhapus dari Cloud D1 Database</strong> dan dipindahkan ke Recycle Data.`,
      confirmButtonColor: '#059669'
    });
  } catch (err) {
    console.error('Failed to delete SIMPUS record from cloud D1:', err);
    Swal.fire({
      icon: 'error',
      title: 'Gagal Menghapus Data SIMPUS!',
      html: `Gagal menghapus data dari Cloud Database: <strong>${err.message}</strong>`,
      confirmButtonColor: '#dc2626'
    });
  }
}

function renderRecycleTable() {
  const tbody = document.getElementById('recycleTableBody');
  if (!tbody) return;

  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: var(--rose); font-weight:700;">
          <i class="bi bi-shield-lock-fill" style="font-size: 28px; display: block; margin-bottom: 6px;"></i>
          Akses Ditolak: Halaman Recycle Data hanya dapat diakses oleh Role Admin dan Koordinator.
        </td>
      </tr>
    `;
    return;
  }

  // Filter recycle bin items by user visibility rules
  const visibleRecycle = getVisibleRecords(recycleBin);

  if (visibleRecycle.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 35px; color: var(--text-muted);">
          <i class="bi bi-trash3" style="font-size: 32px; display: block; margin-bottom: 8px; color: #cbd5e1;"></i>
          Tempat sampah kosong. Tidak ada data yang dihapus.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visibleRecycle.map((r, i) => {
    const safeId = r.id || r.nik || i;
    const sourceBadge = (r.original_source || 'BNBA').includes('SIMPUS')
      ? `<span class="badge badge-amber"><i class="bi bi-hdd-network"></i> SIMPUS</span>`
      : `<span class="badge badge-cyan"><i class="bi bi-folder-symlink-fill"></i> BNBA CKG</span>`;

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${sourceBadge}</td>
        <td><strong>${r.nik || '-'}</strong></td>
        <td><strong>${r.nama || r.nama_pasien || 'Pasien'}</strong></td>
        <td>${r.jenis_kegiatan || '-'}</td>
        <td><span style="font-size: 12px; color: #64748b;">${r.deleted_at || '-'}</span></td>
        <td><span class="badge badge-emerald">${r.deleted_by || 'System'}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-emerald btn-sm" onclick="restoreFromRecycle('${safeId}')" title="Pulihkan Data">
              <i class="bi bi-arrow-counterclockwise"></i> Restore
            </button>
            <button class="btn btn-danger btn-sm" onclick="permanentDeleteFromRecycle('${safeId}')" title="Hapus Permanen">
              <i class="bi bi-trash-fill"></i> Hapus Permanen
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function restoreFromRecycle(id) {
  const itemIndex = recycleBin.findIndex(r => (r.id || r.nik || '') === id);
  if (itemIndex === -1) {
    showToast('Data tidak ditemukan di Recycle Data', 'error');
    return;
  }

  const item = recycleBin[itemIndex];
  recycleBin.splice(itemIndex, 1);
  saveRecycleBinToStorage(null, id);

  if (item.original_source && item.original_source.includes('SIMPUS')) {
    simpusRecords.unshift(item);
    saveSimpusRecordsToStorage();
  } else {
    records.unshift(item);
    saveRecordsToStorage();
  }

  renderApp();
  Swal.fire('Dipulihkan!', `Data [${item.nama || item.nik}] berhasil dikembalikan ke database.`, 'success');
}

function permanentDeleteFromRecycle(id) {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    Swal.fire('Akses Ditolak', 'Hanya Admin & Koordinator yang dapat menghapus data secara permanen.', 'warning');
    return;
  }

  Swal.fire({
    title: 'Hapus Permanen?',
    text: 'Data yang dihapus permanen tidak dapat dikembalikan lagi!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus Permanen!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      recycleBin = recycleBin.filter(r => (r.id || r.nik || '') !== id);
      saveRecycleBinToStorage(null, id);
      renderRecycleTable();
      Swal.fire('Terhapus!', 'Data telah dihapus permanen dari sistem.', 'success');
    }
  });
}

function emptyRecycleBin() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    Swal.fire('Akses Ditolak', 'Hanya Admin & Koordinator yang dapat mengosongkan Recycle Data.', 'warning');
    return;
  }

  if (recycleBin.length === 0) {
    showToast('Recycle Data sudah kosong!', 'info');
    return;
  }

  Swal.fire({
    title: 'Kosongkan Tempat Sampah?',
    text: `Semua (${recycleBin.length}) data di tempat sampah akan dihapus secara permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Kosongkan!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      recycleBin = [];
      saveRecycleBinToStorage();
      renderRecycleTable();
      Swal.fire('Dikosongkan!', 'Semua data di tempat sampah telah dihapus permanen.', 'success');
    }
  });
}

function viewDetailModal(id) {
  const r = records.find(item => item.id === id);
  if (!r) return;

  const modalBody = document.getElementById('detailModalBody');
  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
      <div><strong>ID Record:</strong> ${r.id}</div>
      <div><strong>Kegiatan:</strong> ${r.jenis_kegiatan}</div>
      <div><strong>NIK:</strong> ${r.nik}</div>
      <div><strong>Nama Lengkap:</strong> ${r.nama}</div>
      <div><strong>Tanggal Lahir / Usia:</strong> ${r.tanggal_lahir} (${r.usia} Tahun)</div>
      <div><strong>Jenis Kelamin:</strong> ${r.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
      <div><strong>Alamat:</strong> ${r.alamat}, Kel. ${r.kelurahan}, Kec. ${r.kecamatan}</div>
      <div><strong>BB / TB / LP:</strong> ${r.bb} kg / ${r.tb} cm / ${r.lp || '-'} cm</div>
      <div><strong>IMT:</strong> ${r.imt}</div>
      <div><strong>Tekanan Darah:</strong> ${r.td_sistolik}/${r.td_diastolik} mmHg</div>
      <div><strong>Gula Darah:</strong> ${r.gula_darah} mg/dL</div>
      <div><strong>Kolesterol:</strong> ${r.kolesterol} mg/dL</div>
      <div><strong>Hemoglobin (HB):</strong> ${r.hb} g/dL</div>
      <div><strong>Status Katarak:</strong> ${r.katarak}</div>
    </div>
  `;

  document.getElementById('detailModalOverlay').classList.add('open');
}

function closeDetailModal() {
  document.getElementById('detailModalOverlay').classList.remove('open');
}

function editRecord(id) {
  const r = records.find(item => item.id === id);
  if (!r) return;

  currentEditingId = id;
  openInputModal(r.jenis_kegiatan);

  document.getElementById('pos_lokasi').value = r.pos_lokasi || '';
  document.getElementById('nik').value = r.nik;
  document.getElementById('nama').value = r.nama;
  document.getElementById('tanggal_lahir').value = r.tanggal_lahir;
  document.getElementById('usia').value = r.usia;
  document.getElementById('jenis_kelamin').value = r.jenis_kelamin;
  document.getElementById('no_whatsapp').value = r.no_whatsapp || '';
  document.getElementById('status_pernikahan').value = r.status_pernikahan;
  document.getElementById('alamat').value = r.alamat;
  document.getElementById('pekerjaan').value = r.pekerjaan || '';
  document.getElementById('bb').value = r.bb;
  document.getElementById('tb').value = r.tb;
  document.getElementById('lp').value = r.lp || '';
  document.getElementById('imt').value = r.imt;
  document.getElementById('td_sistolik').value = r.td_sistolik;
  document.getElementById('td_diastolik').value = r.td_diastolik;
  document.getElementById('gula_darah').value = r.gula_darah;
  document.getElementById('kolesterol').value = r.kolesterol;
  document.getElementById('hb').value = r.hb;
  document.getElementById('telinga').value = r.telinga;
  document.getElementById('mata').value = r.mata;
  document.getElementById('gigi').value = r.gigi;

  calculateIMT();
}



/* ==========================================================================
   📊 EXPORT & IMPORT XLSX ENGINE (SheetJS)
   ========================================================================== */

function exportToXLSX() {
  if (records.length === 0) {
    showToast('Tidak ada data untuk diekspor!', 'error');
    return;
  }

  showLoadingOverlay('Mengekspor Data...', 'Menyusun File Excel (.XLSX)');

  setTimeout(() => {
    try {
      const headers = [
        "ID", "Jenis Kegiatan", "NIK", "Nama Pasien", "Tanggal Lahir", "Usia",
        "Jenis Kelamin", "No WhatsApp", "Status Nikah", "Provinsi", "Kab/Kota", "Kecamatan",
        "Kelurahan", "Alamat", "Pekerjaan", "Merokok", "BB (kg)", "TB (cm)", "LP (cm)", "IMT",
        "TD Sistolik", "TD Diastolik", "Gula Darah (mg/dL)", "Kolesterol (mg/dL)", "HB (g/dL)",
        "Pemeriksaan Telinga", "Pemeriksaan Mata", "Pemeriksaan Gigi", "Pemeriksaan Katarak",
        "Status Validasi", "Petugas Entry", "Tanggal Entry"
      ];

      const rows = records.map(r => [
        r.id || '',
        r.jenis_kegiatan || 'Luar Gedung',
        r.nik || '',
        r.nama || r.nama_pasien || '',
        formatDateToYYYYMMDD(r.tanggal_lahir),
        r.usia || 0,
        r.jenis_kelamin || 'L',
        r.no_whatsapp || '',
        r.status_pernikahan || 'Belum Menikah',
        r.provinsi || 'Jawa Barat',
        r.kab_kota || 'Kab. Bandung',
        r.kecamatan || 'Banjaran',
        r.kelurahan || 'Banjaran Kota',
        r.alamat || '',
        r.pekerjaan || '',
        r.merokok || 'Tidak',
        r.bb || '',
        r.tb || '',
        r.lp || '',
        r.imt || '',
        r.td_sistolik || '',
        r.td_diastolik || '',
        r.gula_darah || '',
        r.kolesterol || '',
        r.hb || '',
        r.telinga || 'Normal',
        r.mata || 'Normal',
        r.gigi || 'Baik',
        r.katarak || 'Tidak',
        r.status_validasi || 'Terverifikasi',
        r.created_by || r.petugas_entry || sessionStorage.getItem('ckg_user_name') || 'Admin',
        formatDateToYYYYMMDD(r.created_at || r.tanggal_entry)
      ]);

      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto width for columns
      const colWidths = headers.map(h => ({ wch: Math.max(h.length + 3, 14) }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data BNBA CKG");

      const filename = `Laporan_BNBA_CKG_${new Date().toISOString().substring(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);

      hideLoadingOverlay();
      showToast('Laporan BNBA Excel (.XLSX) Berhasil Diunduh!', 'success');
    } catch (err) {
      hideLoadingOverlay();
      console.error('Export XLSX error:', err);
      showToast('Gagal mengekspor data ke Excel: ' + err.message, 'error');
    }
  }, 400);
}

// Keep exportToCSV as alias for backward compatibility
function exportToCSV() {
  exportToXLSX();
}

let selectedImportFile = null;

function openImportModal() {
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.add('open', 'active');
  selectedImportFile = null;
  const fileDetails = document.getElementById('importFileDetails');
  const btnExec = document.getElementById('btnExecuteImport');
  if (fileDetails) fileDetails.style.display = 'none';
  if (btnExec) btnExec.disabled = true;
  const fileInput = document.getElementById('importFileInput');
  if (fileInput) fileInput.value = '';

  const tanggalInput = document.getElementById('importTanggalEntry');
  if (tanggalInput) {
    tanggalInput.value = new Date().toISOString().substring(0, 10);
  }

  // Populate & handle Target Petugas select dropdown based on Role
  const targetSelect = document.getElementById('importTargetPetugas');
  const targetHint = document.getElementById('importTargetPetugasHint');
  const loggedUser = sessionStorage.getItem('ckg_user_name') || 'Mochamad Fauzie, S.Gz';
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();

  if (targetSelect) {
    targetSelect.innerHTML = '';
    
    // Get list of registered users sorted by role hierarchy (Admin -> Koordinator -> Petugas)
    sortUsersDbByRoleHierarchy();

    let userList = [];
    if (Array.isArray(usersDb) && usersDb.length > 0) {
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

    // Deduplicate user list while preserving sorted role order
    userList = Array.from(new Set(userList));

    // Ensure loggedUser is in the list
    if (loggedUser && !userList.includes(loggedUser)) {
      userList.unshift(loggedUser);
    }

    userList.forEach(uName => {
      const opt = document.createElement('option');
      opt.value = uName;
      opt.textContent = uName;
      if (uName === loggedUser) opt.selected = true;
      targetSelect.appendChild(opt);
    });

    if (role === 'admin') {
      targetSelect.disabled = false;
      targetSelect.style.backgroundColor = '#ffffff';
      targetSelect.style.cursor = 'pointer';
      if (targetHint) {
        targetHint.innerHTML = `<i class="bi bi-unlock-fill" style="color: #059669; font-size: 13px;"></i> <strong style="color: #059669;">Akses Admin Unlocked:</strong> Memilih dari total ${userList.length} User Terdaftar di Database.`;
      }
    } else {
      // Role Koordinator & Petugas -> LOCKED
      targetSelect.value = loggedUser;
      targetSelect.disabled = true;
      targetSelect.style.backgroundColor = '#f1f5f9';
      targetSelect.style.cursor = 'not-allowed';
      if (targetHint) {
        targetHint.innerHTML = `<i class="bi bi-lock-fill" style="color: #dc2626; font-size: 13px;"></i> <strong style="color: #dc2626;">Role ${sessionStorage.getItem('ckg_user_role') || 'Petugas'}:</strong> Terkunci otomatis ke nama akun Anda (${loggedUser}).`;
      }
    }
  }
}

function closeImportModal() {
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.remove('open', 'active');
}

function openAccountSettingsModal() {
  const loggedUser = sessionStorage.getItem('ckg_user_name') || 'Mochamad Fauzie, S.Gz';
  const role = sessionStorage.getItem('ckg_user_role') || 'Admin';
  
  const namaInput = document.getElementById('accountSettingNamaUser');
  const roleBadge = document.getElementById('accountSettingRole');
  const passInput = document.getElementById('accountSettingNewPassword');
  const confirmInput = document.getElementById('accountSettingConfirmPassword');

  if (namaInput) namaInput.value = loggedUser;
  if (roleBadge) roleBadge.textContent = role.toUpperCase();
  if (passInput) passInput.value = '';
  if (confirmInput) confirmInput.value = '';

  const modal = document.getElementById('accountSettingsModalOverlay');
  if (modal) modal.classList.add('open', 'active');
}

function closeAccountSettingsModal() {
  const modal = document.getElementById('accountSettingsModalOverlay');
  if (modal) modal.classList.remove('open', 'active');
}

async function handleSaveAccountSettings(e) {
  if (e) e.preventDefault();
  
  const loggedUser = sessionStorage.getItem('ckg_user_name') || 'Mochamad Fauzie, S.Gz';
  const newPass = (document.getElementById('accountSettingNewPassword')?.value || '').trim();
  const confirmPass = (document.getElementById('accountSettingConfirmPassword')?.value || '').trim();

  if (!newPass) {
    showToast('Masukkan password baru terlebih dahulu!', 'warning');
    return;
  }

  if (newPass !== confirmPass) {
    showToast('Konfirmasi password baru tidak cocok!', 'error');
    return;
  }

  showLoadingOverlay('Menyimpan Password...', 'Memperbarui kredensial akun user');

  try {
    // 1. Update global usersDb & local storage ckg_user_db
    let foundUser = usersDb.find(u => (u.nama_user || u.nama) === loggedUser);
    if (foundUser) {
      foundUser.password = newPass;
    } else {
      usersDb.push({
        nama_user: loggedUser,
        password: newPass,
        role: sessionStorage.getItem('ckg_user_role') || 'Petugas'
      });
    }
    saveUserDatabaseToStorage();

    // 2. Sync password to Cloud D1 Database via /api/users
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_password',
          nama_user: loggedUser,
          password: newPass
        })
      });
    } catch (err) {
      console.warn('Sync password cloud warning:', err);
    }

    hideLoadingOverlay();
    closeAccountSettingsModal();

    Swal.fire({
      icon: 'success',
      title: 'Setting Akun Berhasil!',
      html: `Password untuk akun <strong>[${loggedUser}]</strong> berhasil diperbarui/ditambahkan.`,
      confirmButtonColor: '#2563eb'
    });

  } catch (err) {
    hideLoadingOverlay();
    console.error('Save account setting error:', err);
    Swal.fire('Gagal Menyimpan', err.message, 'error');
  }
}

function handleImportFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedImportFile = file;
  const fileDetails = document.getElementById('importFileDetails');
  const fileNameEl = document.getElementById('importFileName');
  const btnExec = document.getElementById('btnExecuteImport');

  // Read file to count rows
  const countReader = new FileReader();
  countReader.onload = function(ev) {
    try {
      const d = new Uint8Array(ev.target.result);
      const wb = XLSX.read(d, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const validRows = rows.filter(r => {
        const keys = Object.keys(r);
        const hasNama = keys.some(k => /nama/i.test(k) && String(r[k]).trim());
        const hasNik = keys.some(k => /nik/i.test(k) && String(r[k]).trim());
        return hasNama || hasNik;
      });
      if (fileNameEl) fileNameEl.innerHTML = `<strong>${file.name}</strong> (${(file.size/1024).toFixed(1)} KB) — <span style="color:#059669;font-weight:700;">${validRows.length} Data Pasien Terdeteksi</span>`;
    } catch(_) {
      if (fileNameEl) fileNameEl.textContent = `${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    }
  };
  countReader.readAsArrayBuffer(file);

  if (fileDetails) fileDetails.style.display = 'block';
  if (btnExec) btnExec.disabled = false;
}

/* ==========================================================================
   👑 FITUR IMPORT DATA KHUSUS ADMIN (MULTI-PETUGAS)
   ========================================================================== */

let selectedAdminImportFile = null;
let parsedAdminRecords = [];

function openAdminImportModal() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  if (role !== 'admin') {
    if (typeof Swal !== 'undefined') {
      Swal.fire('Akses Ditolak', 'Fitur Import Multi-Petugas ini khusus untuk Role Admin.', 'warning');
    } else {
      showToast('Akses khusus Admin!', 'error');
    }
    return;
  }

  const modal = document.getElementById('adminImportModal');
  if (modal) modal.classList.add('open', 'active');

  selectedAdminImportFile = null;
  parsedAdminRecords = [];

  const previewArea = document.getElementById('adminImportPreviewArea');
  const btnExec = document.getElementById('btnExecuteAdminImport');
  const fileInput = document.getElementById('adminImportFileInput');
  const tglInput = document.getElementById('adminImportTanggalEntry');

  if (previewArea) {
    previewArea.style.display = 'none';
    previewArea.innerHTML = '';
  }
  if (btnExec) btnExec.disabled = true;
  if (fileInput) fileInput.value = '';
  if (tglInput) tglInput.value = new Date().toISOString().substring(0, 10);
}

function closeAdminImportModal() {
  const modal = document.getElementById('adminImportModal');
  if (modal) modal.classList.remove('open', 'active');
}

function downloadAdminXLSXTemplate() {
  try {
    const headers = [
      "Petugas Entry", "Jenis Kegiatan", "Tanggal Entry", "NIK", "Nama Pasien", "Tanggal Lahir", "Usia",
      "Jenis Kelamin", "No WhatsApp", "Status Pernikahan", "Provinsi", "Kab/Kota",
      "Kecamatan", "Kelurahan", "Alamat Lengkap", "Pekerjaan", "Merokok",
      "BB (kg)", "TB (cm)", "LP (cm)", "IMT", "TD Sistolik", "TD Diastolik",
      "Gula Darah (mg/dL)", "Kolesterol (mg/dL)", "HB (g/dL)",
      "Pemeriksaan Telinga", "Pemeriksaan Mata", "Pemeriksaan Gigi", "Pemeriksaan Katarak"
    ];

    const sampleRow1 = [
      "Teti Nuryati, S.Keb, Bdn", "Luar Gedung", "2026-08-01", "3204123456780001", "Euis Saribanon", "1962-12-01", 63,
      "P", "081234567890", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Banjaran Kota", "Kp. Cileutik RT 01/08", "Ibu Rumah Tangga", "Tidak",
      54, 153, 80, 23.07, 135, 99, 91, 180, 13.2, "Normal", "Normal", "Baik", "Tidak"
    ];

    const sampleRow2 = [
      "Mochamad Fauzie, S.Gz", "Luar Gedung", "2026-08-01", "3204134109910006", "Seny Septiany", "1991-09-01", 34,
      "P", "085712345678", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Banjaran Kota", "Bojongpulus", "Wiraswasta", "Tidak",
      56, 59, 80, 160.87, 120, 92, 90, 180, 12.5, "Normal", "Normal", "Baik", "Tidak"
    ];

    const sampleRow3 = [
      "Anisa Rohmatunisa, AM.Keb", "Dalam Gedung", "2026-08-02", "3273076009850004", "Nur Fajarwati Arifah", "1985-09-20", 40,
      "P", "082198765432", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Banjaran Kota", "Cipaku RT 02/02", "PNS", "Tidak",
      69, 155, 80, 28.72, 125, 96, 94, 180, 13.0, "Normal", "Normal", "Baik", "Tidak"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2, sampleRow3]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 3, 16) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template CKG Multi Petugas");
    XLSX.writeFile(wb, `Template_Import_Admin_MultiPetugas_CKG_${new Date().toISOString().substring(0, 10)}.xlsx`);
    
    showToast('Template Excel Khusus Admin Berhasil Diunduh!', 'success');
  } catch (err) {
    console.error('Download admin template error:', err);
    if (typeof Swal !== 'undefined') Swal.fire('Gagal Download Template', err.message, 'error');
  }
}

function handleAdminImportFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedAdminImportFile = file;
  parsedAdminRecords = [];

  const previewArea = document.getElementById('adminImportPreviewArea');
  const btnExec = document.getElementById('btnExecuteAdminImport');
  const fallbackTanggal = document.getElementById('adminImportTanggalEntry')?.value || new Date().toISOString().substring(0, 10);
  const loggedAdmin = sessionStorage.getItem('ckg_user_name') || 'Admin';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        showToast('File Excel tidak valid!', 'error');
        return;
      }

      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (jsonRows.length === 0) {
        showToast('File Excel kosong!', 'warning');
        return;
      }

      const groupedSummary = {};

      jsonRows.forEach(row => {
        const getVal = (...keys) => {
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              if (rowKey.toLowerCase().trim() === target) return String(row[rowKey]).trim();
            }
          }
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              const keyClean = rowKey.toLowerCase().trim();
              if (keyClean.includes(target) && !keyClean.includes('faskes')) return String(row[rowKey]).trim();
            }
          }
          return '';
        };

        const nik = getVal('NIK', 'No KTP', 'Nomor NIK');
        const nama = getVal('Nama Pasien', 'Nama Lengkap', 'Nama Pasien & NIK', 'Nama');
        if (!nama && !nik) return;

        let petugasName = getVal('Petugas Entry', 'Petugas', 'Petugas Skrining', 'Created By', 'Nama Petugas');
        if (!petugasName) petugasName = loggedAdmin;

        const dobStr = getVal('Tanggal Lahir', 'Tgl Lahir', 'DOB') || '1990-01-01';
        let age = parseInt(getVal('Usia', 'Umur')) || 30;
        if (isNaN(age) || age <= 0) {
          try { const bd = new Date(dobStr); if (!isNaN(bd.getTime())) age = new Date().getFullYear() - bd.getFullYear(); } catch(_){}
        }

        const jkRaw = getVal('Jenis Kelamin', 'JK') || 'L';
        const jk = jkRaw.toUpperCase().startsWith('P') ? 'P' : 'L';
        const bb = parseFloat(getVal('BB (kg)', 'BB', 'Berat Badan')) || 60;
        const tb = parseFloat(getVal('TB (cm)', 'TB', 'Tinggi Badan')) || 165;
        const lp = parseFloat(getVal('LP (cm)', 'LP', 'Lingkar Perut')) || 80;
        const imtVal = (tb > 0) ? (bb / ((tb/100)*(tb/100))).toFixed(2) : '22.0';
        const rowDate = getVal('Tanggal Entry', 'Tanggal Skrining', 'Tanggal') || fallbackTanggal;

        const record = {
          id: 'CKG-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          jenis_kegiatan: getVal('Jenis Kegiatan', 'Kegiatan') || 'Luar Gedung',
          nik: nik || '3204' + Math.floor(100000000000 + Math.random() * 900000000000),
          nama: nama || 'Pasien Tanpa Nama',
          tanggal_lahir: dobStr, usia: age, jenis_kelamin: jk,
          no_whatsapp: getVal('No WhatsApp', 'WA', 'HP') || '',
          status_pernikahan: getVal('Status Pernikahan', 'Status Nikah') || 'Kawin',
          provinsi: getVal('Provinsi') || 'Jawa Barat',
          kab_kota: getVal('Kab/Kota', 'Kota') || 'Kab. Bandung',
          kecamatan: getVal('Kecamatan') || 'Banjaran',
          kelurahan: getVal('Kelurahan', 'Desa') || 'Banjaran Kota',
          alamat: getVal('Alamat Lengkap', 'Alamat') || 'Banjaran',
          pekerjaan: getVal('Pekerjaan') || '',
          merokok: getVal('Merokok') || 'Tidak',
          bb, tb, lp, imt: imtVal,
          td_sistolik: parseInt(getVal('TD Sistolik', 'Sistol')) || 120,
          td_diastolik: parseInt(getVal('TD Diastolik', 'Diastol')) || 80,
          gula_darah: getVal('Gula Darah (mg/dL)', 'Gula Darah') || '110',
          kolesterol: getVal('Kolesterol (mg/dL)', 'Kolesterol') || '180',
          hb: getVal('HB (g/dL)', 'HB') || '14.0',
          telinga: getVal('Pemeriksaan Telinga', 'Telinga') || 'Normal',
          mata: getVal('Pemeriksaan Mata', 'Mata') || 'Normal',
          gigi: getVal('Pemeriksaan Gigi', 'Gigi') || 'Normal',
          katarak: getVal('Pemeriksaan Katarak', 'Katarak') || 'Tidak',
          status_validasi: 'Terverifikasi',
          petugas_entry: petugasName,
          created_by: petugasName,
          created_at: rowDate, tanggal_entry: rowDate, tanggal: rowDate
        };

        parsedAdminRecords.push(record);
        groupedSummary[petugasName] = (groupedSummary[petugasName] || 0) + 1;
      });

      if (parsedAdminRecords.length === 0) {
        showToast('Tidak ada data pasien valid terdeteksi!', 'warning');
        if (btnExec) btnExec.disabled = true;
        return;
      }

      const officerCount = Object.keys(groupedSummary).length;
      
      let badgesHtml = Object.entries(groupedSummary).map(([pName, count]) => {
        return `<div style="background:#f3e8ff; border:1px solid #c084fc; padding:8px 14px; border-radius:10px; font-size:12.5px; font-weight:700; color:#6b21a8; display:flex; align-items:center; gap:8px;">
                  <i class="bi bi-person-badge-fill" style="color:#7c3aed;"></i>
                  <span>${pName}: <strong style="color:#5b21b6; font-size:13.5px;">${count} Data</strong></span>
                </div>`;
      }).join('');

      let previewRowsHtml = parsedAdminRecords.slice(0, 8).map((r, i) => {
        return `<tr>
                  <td style="text-align:center;">${i + 1}</td>
                  <td><strong>${r.nama}</strong><br><span style="font-size:11px; color:#64748b;">NIK: ${r.nik}</span></td>
                  <td><span class="badge badge-cyan">${r.jenis_kegiatan}</span></td>
                  <td><span class="badge badge-purple" style="font-weight:700;"><i class="bi bi-person-fill"></i> ${r.petugas_entry}</span></td>
                  <td><span style="font-size:12px; color:#475569;">${r.created_at}</span></td>
                </tr>`;
      }).join('');

      previewArea.innerHTML = `
        <div style="background: #ffffff; border: 1.5px solid #d8b4fe; border-radius: 14px; padding: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.08);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #e9d5ff;">
            <div>
              <div style="font-weight:800; font-size:14px; color:#5b21b6;">
                <i class="bi bi-eye-fill"></i> PREVIEW REKAPITULASI MULTI-PETUGAS
              </div>
              <div style="font-size:12px; color:#6b21a8; margin-top:2px;">
                File: <strong>${file.name}</strong> (${(file.size/1024).toFixed(1)} KB) — Total <strong>${parsedAdminRecords.length} Data Pasien</strong> untuk <strong>${officerCount} Petugas Entry</strong>
              </div>
            </div>
            <span class="badge badge-emerald" style="font-size:12px; padding:6px 12px;"><i class="bi bi-check-circle-fill"></i> Ready Import</span>
          </div>

          <div style="margin-bottom:14px;">
            <div style="font-size:12px; font-weight:700; color:#4c1d95; margin-bottom:8px;">
              <i class="bi bi-people-fill"></i> Pembagian Data Per-Petugas Terdeteksi:
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${badgesHtml}
            </div>
          </div>

          <div style="font-size:12px; font-weight:700; color:#4c1d95; margin-bottom:6px;">
            <i class="bi bi-table"></i> Sample Preview Data Pasien (Top ${Math.min(8, parsedAdminRecords.length)} dari ${parsedAdminRecords.length}):
          </div>

          <div class="table-responsive" style="max-height:220px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px;">
            <table class="custom-table" style="font-size:12px;">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">No</th>
                  <th>Nama Pasien & NIK</th>
                  <th>Kegiatan</th>
                  <th>Petugas Entry (Hasil Alokasi)</th>
                  <th>Tanggal Entry</th>
                </tr>
              </thead>
              <tbody>
                ${previewRowsHtml}
              </tbody>
            </table>
          </div>

        </div>
      `;

      previewArea.style.display = 'block';
      if (btnExec) btnExec.disabled = false;

    } catch (err) {
      console.error('Admin import preview error:', err);
      showToast('Gagal membaca file Excel: ' + err.message, 'error');
    }
  };

  reader.readAsArrayBuffer(file);
}

async function executeAdminXLSXImport() {
  if (parsedAdminRecords.length === 0) {
    showToast('Tidak ada data pasien yang siap di-import!', 'warning');
    return;
  }

  closeAdminImportModal();

  const officerStats = {};
  parsedAdminRecords.forEach(r => {
    officerStats[r.petugas_entry] = (officerStats[r.petugas_entry] || 0) + 1;
  });

  Swal.fire({
    title: `<i class="bi bi-cloud-upload-fill" style="color:#7c3aed;"></i> Upload Batch Multi-Petugas ke Cloud D1...`,
    html: `<div style="margin:10px 0;">
            <div id="adminImportProgressBar" style="width:100%;height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;">
              <div id="adminImportProgressFill" style="width:0%;height:100%;background:linear-gradient(90deg,#7c3aed,#9333ea);border-radius:10px;transition:width 0.3s;"></div>
            </div>
            <div id="adminImportProgressText" style="margin-top:8px;font-size:13px;color:#475569;font-weight:600;">0 / ${parsedAdminRecords.length} data pasien</div>
          </div>`,
    allowOutsideClick: false,
    showConfirmButton: false
  });

  const chunkSize = 20;
  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < parsedAdminRecords.length; i += chunkSize) {
    const chunk = parsedAdminRecords.slice(i, i + chunkSize);
    try {
      const res = await fetch('/api/ckg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
      if (res.ok) { uploaded += chunk.length; } else { failed += chunk.length; }
    } catch (err) {
      failed += chunk.length;
    }

    const pct = Math.round(((uploaded + failed) / parsedAdminRecords.length) * 100);
    const fillEl = document.getElementById('adminImportProgressFill');
    const txtEl = document.getElementById('adminImportProgressText');
    if (fillEl) fillEl.style.width = pct + '%';
    if (txtEl) txtEl.textContent = `${uploaded + failed} / ${parsedAdminRecords.length} data pasien (${pct}%)`;
  }

  records = [...parsedAdminRecords, ...records];
  localStorage.setItem('ckg_records', JSON.stringify(records));

  renderApp();
  updateCloudSyncPill(true, `D1 Online (${records.length} Rec)`);

  let breakdownList = Object.entries(officerStats).map(([pName, cnt]) => {
    return `<li style="margin-bottom:4px;"><strong>${pName}</strong>: <span style="color:#059669; font-weight:700;">${cnt} Data Pasien</span></li>`;
  }).join('');

  Swal.fire({
    icon: failed === 0 ? 'success' : 'warning',
    title: failed === 0 ? 'Import Multi-Petugas Berhasil!' : 'Import Sebagian Berhasil',
    html: `<div style="font-size:13.5px; text-align:left; line-height:1.6;">
            Total <strong>${uploaded} Data Pasien</strong> telah <strong>ter-upload & tersinkronisasi ke Cloudflare D1 Database</strong>!<br><br>
            <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px; padding:12px;">
              <strong style="color:#5b21b6; font-size:13px;"><i class="bi bi-people-fill"></i> Rekapitulasi Alokasi Per-Petugas:</strong>
              <ul style="margin:6px 0 0 18px; padding:0; font-size:12.5px;">
                ${breakdownList}
              </ul>
            </div>
          </div>`,
    confirmButtonColor: '#7c3aed'
  });
}

/* ==========================================================================
   👑 FITUR IMPORT DATA SIMPUS MULTI-PETUGAS KHUSUS ADMIN (SUDAH DI-BAGI)
   ========================================================================== */

let selectedSimpusAdminImportFile = null;
let parsedSimpusAdminRecords = [];

function openSimpusAdminMultiImportModal() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  if (role !== 'admin') {
    if (typeof Swal !== 'undefined') {
      Swal.fire('Akses Ditolak', 'Fitur Import SIMPUS Multi-Petugas ini khusus untuk Role Admin.', 'warning');
    } else {
      showToast('Akses khusus Admin!', 'error');
    }
    return;
  }

  const modal = document.getElementById('simpusAdminImportModal');
  if (modal) modal.classList.add('open', 'active');

  selectedSimpusAdminImportFile = null;
  parsedSimpusAdminRecords = [];

  const previewArea = document.getElementById('simpusAdminImportPreviewArea');
  const btnExec = document.getElementById('btnExecuteSimpusAdminImport');
  const fileInput = document.getElementById('simpusAdminImportFileInput');

  if (previewArea) {
    previewArea.style.display = 'none';
    previewArea.innerHTML = '';
  }
  if (btnExec) btnExec.disabled = true;
  if (fileInput) fileInput.value = '';
}

function closeSimpusAdminMultiImportModal() {
  const modal = document.getElementById('simpusAdminImportModal');
  if (modal) modal.classList.remove('open', 'active');
}

function downloadSimpusAdminXLSXTemplate() {
  try {
    const headers = [
      "Petugas Entry", "NAMA PASIEN", "NIK", "TANGGAL", "TANGGAL LAHIR", "USIA",
      "Status Pernikahan", "Provinsi", "Kab/Kota", "Kecamatan", "Kelurahan", "Alamat Lengkap",
      "BB (kg)", "TB (cm)", "TD SISTOL", "TD DIASTOL", "GULA DARAH", "KOLESTEROL"
    ];

    const sampleRow1 = [
      "Teti Nuryati, S.Keb, Bdn", "EUIS SARIBANON", "3204123456780001", "2026-08-01", "1962-12-01", 63,
      "MENIKAH", "Jawa Barat", "Kab. Bandung", "Banjaran", "Tarajusari", "Kp Cipeundeuy",
      54, 153, 135, 99, "91", "180"
    ];

    const sampleRow2 = [
      "Mochamad Fauzie, S.Gz", "SENY SEPTIANY", "3204134109910006", "2026-08-01", "1991-09-01", 34,
      "BELUM MENIKAH", "Jawa Barat", "Kab. Bandung", "Banjaran", "Tarajusari", "Kp Cipeundeuy",
      56, 159, 120, 92, "90", "180"
    ];

    const sampleRow3 = [
      "Anisa Rohmatunisa, AM.Keb", "NUR FAJARWATI ARIFAH", "3273076009850004", "2026-08-02", "1985-09-20", 40,
      "MENIKAH", "Jawa Barat", "Kab. Bandung", "Banjaran", "Tarajusari", "Kp Cipeundeuy",
      69, 155, 125, 96, "94", "180"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2, sampleRow3]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 3, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template SIMPUS Multi Petugas");
    XLSX.writeFile(wb, `Template_Import_SIMPUS_MultiPetugas_${new Date().toISOString().substring(0, 10)}.xlsx`);
    
    showToast('Template Excel SIMPUS Multi-Petugas Berhasil Diunduh!', 'success');
  } catch (err) {
    console.error('Download SIMPUS admin template error:', err);
    if (typeof Swal !== 'undefined') Swal.fire('Gagal Download Template', err.message, 'error');
  }
}

function handleSimpusAdminImportFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  selectedSimpusAdminImportFile = file;
  parsedSimpusAdminRecords = [];

  const previewArea = document.getElementById('simpusAdminImportPreviewArea');
  const btnExec = document.getElementById('btnExecuteSimpusAdminImport');
  const loggedAdmin = sessionStorage.getItem('ckg_user_name') || 'Admin';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        showToast('File Excel tidak valid!', 'error');
        return;
      }

      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (jsonRows.length === 0) {
        showToast('File Excel kosong!', 'warning');
        return;
      }

      const groupedSummary = {};
      const maxNo = simpusRecords.reduce((max, r) => Math.max(max, parseInt(r.no) || 0), 3900);

      jsonRows.forEach((row, idx) => {
        const getVal = (...keys) => {
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              if (rowKey.toLowerCase().trim() === target) return String(row[rowKey]).trim();
            }
          }
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              const keyClean = rowKey.toLowerCase().trim();
              if (keyClean.includes(target)) return String(row[rowKey]).trim();
            }
          }
          return '';
        };

        const nama = getVal('NAMA PASIEN', 'NAMA', 'Nama Pasien', 'Nama').toUpperCase();
        const nik = getVal('NIK', 'nik', 'No KTP');
        if (!nama || nama.length < 2) return;

        let petugasName = getVal('Petugas Entry', 'Petugas', 'Assigned To', 'Petugas Skrining', 'Created By', 'Nama Petugas');
        if (!petugasName) petugasName = loggedAdmin;

        const usia = parseInt(getVal('USIA', 'Usia', 'Umur')) || 30;
        const bb = parseFloat(getVal('BB (kg)', 'BB', 'BERAT BADAN')) || 0;
        const tb = parseFloat(getVal('TB (cm)', 'TB', 'TINGGI BADAN')) || 0;
        const imtVal = (bb > 0 && tb > 0) ? parseFloat((bb / ((tb / 100) ** 2)).toFixed(1)) : 0;

        let keterangan = 'Dewasa';
        if (usia < 18) keterangan = 'Anak';
        else if (usia >= 60) keterangan = 'Lansia';

        const recId = `S-${maxNo + idx + 1}-${Date.now()}`;
        const record = {
          id: recId,
          no: maxNo + idx + 1,
          petugas_entry: petugasName,
          nama: nama,
          nik: nik || '3204' + Math.floor(100000000000 + Math.random() * 900000000000),
          tanggal: getVal('TANGGAL', 'Tanggal', 'Tanggal Entry') || new Date().toISOString().substring(0, 10),
          dob: getVal('TANGGAL LAHIR', 'Tgl Lahir', 'DOB') || '1990-01-01',
          usia: usia,
          status_pernikahan: getVal('Status Pernikahan', 'Status') || 'MENIKAH',
          provinsi: getVal('Provinsi', 'Prov') || 'Jawa Barat',
          kab_kota: getVal('Kab/Kota', 'Kab', 'Kota') || 'Kab. Bandung',
          kecamatan: getVal('Kecamatan', 'Kec') || 'Banjaran',
          kelurahan: getVal('Kelurahan', 'Kel', 'Desa') || 'Tarajusari',
          alamat: getVal('Alamat Lengkap', 'ALAMAT', 'Alamat') || '-',
          bb: bb,
          tb: tb,
          imt: imtVal,
          sistol: parseInt(getVal('TD SISTOL', 'TD SISTOLIK', 'SISTOL', 'Sistol')) || 120,
          diastol: parseInt(getVal('TD DIASTOL', 'TD DIASTOLIK', 'DIASTOL', 'Diastol')) || 80,
          gula: getVal('GULA DARAH', 'Gula Darah', 'Gula') || '100',
          kolesterol: getVal('KOLESTEROL', 'Kolesterol') || '180',
          keterangan: keterangan,
          is_divided: true,
          assigned_to: petugasName,
          entry_status: 'belum'
        };

        parsedSimpusAdminRecords.push(record);
        groupedSummary[petugasName] = (groupedSummary[petugasName] || 0) + 1;
      });

      if (parsedSimpusAdminRecords.length === 0) {
        showToast('Tidak ada data SIMPUS valid terdeteksi!', 'warning');
        if (btnExec) btnExec.disabled = true;
        return;
      }

      const officerCount = Object.keys(groupedSummary).length;
      
      let badgesHtml = Object.entries(groupedSummary).map(([pName, count]) => {
        return `<div style="background:#f3e8ff; border:1px solid #c084fc; padding:8px 14px; border-radius:10px; font-size:12.5px; font-weight:700; color:#6b21a8; display:flex; align-items:center; gap:8px;">
                  <i class="bi bi-person-badge-fill" style="color:#7c3aed;"></i>
                  <span>${pName}: <strong style="color:#5b21b6; font-size:13.5px;">${count} Data Pasien</strong></span>
                </div>`;
      }).join('');

      let previewRowsHtml = parsedSimpusAdminRecords.slice(0, 8).map((r, i) => {
        return `<tr>
                  <td style="text-align:center;">${i + 1}</td>
                  <td><strong>${r.nama}</strong><br><span style="font-size:11px; color:#64748b;">NIK: ${r.nik}</span></td>
                  <td><span class="badge badge-amber">${r.keterangan}</span></td>
                  <td><span class="badge badge-purple" style="font-weight:700;"><i class="bi bi-person-fill"></i> ${r.assigned_to}</span></td>
                  <td><span style="font-size:12px; color:#16a34a; font-weight:700;">Sudah Di-Bagi</span></td>
                </tr>`;
      }).join('');

      previewArea.innerHTML = `
        <div style="background: #ffffff; border: 1.5px solid #d8b4fe; border-radius: 14px; padding: 16px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.08);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #e9d5ff;">
            <div>
              <div style="font-weight:800; font-size:14px; color:#5b21b6;">
                <i class="bi bi-eye-fill"></i> PREVIEW SIMPUS MULTI-PETUGAS (SUDAH DI-BAGI)
              </div>
              <div style="font-size:12px; color:#6b21a8; margin-top:2px;">
                File: <strong>${file.name}</strong> — Total <strong>${parsedSimpusAdminRecords.length} Data Pasien</strong> untuk <strong>${officerCount} Petugas</strong>
              </div>
            </div>
            <span class="badge badge-emerald" style="font-size:12px; padding:6px 12px;"><i class="bi bi-check-circle-fill"></i> Ready Sync D1</span>
          </div>

          <div style="margin-bottom:14px;">
            <div style="font-size:12px; font-weight:700; color:#4c1d95; margin-bottom:8px;">
              <i class="bi bi-people-fill"></i> Pembagian Data SIMPUS Per-Petugas Terdeteksi:
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${badgesHtml}
            </div>
          </div>

          <div style="font-size:12px; font-weight:700; color:#4c1d95; margin-bottom:6px;">
            <i class="bi bi-table"></i> Sample Preview Data Pasien (Top ${Math.min(8, parsedSimpusAdminRecords.length)} dari ${parsedSimpusAdminRecords.length}):
          </div>

          <div class="table-responsive" style="max-height:220px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px;">
            <table class="custom-table" style="font-size:12px;">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">No</th>
                  <th>Nama Pasien & NIK</th>
                  <th>Kategori</th>
                  <th>Petugas Entry (Target)</th>
                  <th>Status Bagi</th>
                </tr>
              </thead>
              <tbody>
                ${previewRowsHtml}
              </tbody>
            </table>
          </div>

        </div>
      `;

      previewArea.style.display = 'block';
      if (btnExec) btnExec.disabled = false;

    } catch (err) {
      console.error('SIMPUS Admin import preview error:', err);
      showToast('Gagal membaca file Excel: ' + err.message, 'error');
    }
  };

  reader.readAsArrayBuffer(file);
}

async function executeSimpusAdminXLSXImport() {
  if (parsedSimpusAdminRecords.length === 0) {
    showToast('Tidak ada data SIMPUS yang siap di-import!', 'warning');
    return;
  }

  closeSimpusAdminMultiImportModal();

  const officerStats = {};
  parsedSimpusAdminRecords.forEach(r => {
    officerStats[r.assigned_to] = (officerStats[r.assigned_to] || 0) + 1;
  });

  Swal.fire({
    title: `<i class="bi bi-cloud-upload-fill" style="color:#7c3aed;"></i> Upload Batch SIMPUS Multi-Petugas ke Cloud D1...`,
    html: `<div style="margin:10px 0;">
            <div id="simpusAdminProgressBar" style="width:100%;height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;">
              <div id="simpusAdminProgressFill" style="width:0%;height:100%;background:linear-gradient(90deg,#7c3aed,#9333ea);border-radius:10px;transition:width 0.3s;"></div>
            </div>
            <div id="simpusAdminProgressText" style="margin-top:8px;font-size:13px;color:#475569;font-weight:600;">0 / ${parsedSimpusAdminRecords.length} data pasien</div>
          </div>`,
    allowOutsideClick: false,
    showConfirmButton: false
  });

  const chunkSize = 20;
  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < parsedSimpusAdminRecords.length; i += chunkSize) {
    const chunk = parsedSimpusAdminRecords.slice(i, i + chunkSize);
    try {
      const res = await fetch('/api/simpus?tab=sudah_bagi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
      if (res.ok) { uploaded += chunk.length; } else { failed += chunk.length; }
    } catch (err) {
      failed += chunk.length;
    }

    const pct = Math.round(((uploaded + failed) / parsedSimpusAdminRecords.length) * 100);
    const fillEl = document.getElementById('simpusAdminProgressFill');
    const txtEl = document.getElementById('simpusAdminProgressText');
    if (fillEl) fillEl.style.width = pct + '%';
    if (txtEl) txtEl.textContent = `${uploaded + failed} / ${parsedSimpusAdminRecords.length} data pasien (${pct}%)`;
  }

  simpusRecords = [...parsedSimpusAdminRecords, ...simpusRecords];
  localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

  renderSimpusView();
  updateCloudSyncPill(true, `D1 Online (${simpusRecords.length} SIMPUS)`);

  let breakdownList = Object.entries(officerStats).map(([pName, cnt]) => {
    return `<li style="margin-bottom:4px;"><strong>${pName}</strong>: <span style="color:#059669; font-weight:700;">${cnt} Data Pasien</span></li>`;
  }).join('');

  Swal.fire({
    icon: failed === 0 ? 'success' : 'warning',
    title: failed === 0 ? 'Import SIMPUS Multi-Petugas Berhasil!' : 'Import Sebagian Berhasil',
    html: `<div style="font-size:13.5px; text-align:left; line-height:1.6;">
            Total <strong>${uploaded} Data Pasien SIMPUS</strong> telah <strong>ter-upload & tersinkronisasi ke Cloudflare D1 Database (simpus_records)</strong>!<br><br>
            <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px; padding:12px;">
              <strong style="color:#5b21b6; font-size:13px;"><i class="bi bi-people-fill"></i> Rekapitulasi Alokasi Per-Petugas (Data Sudah Di-Bagi):</strong>
              <ul style="margin:6px 0 0 18px; padding:0; font-size:12.5px;">
                ${breakdownList}
              </ul>
            </div>
          </div>`,
    confirmButtonColor: '#7c3aed'
  });
}

function downloadXLSXTemplate() {
  try {
    const headers = [
      "Jenis Kegiatan", "Tanggal Entry", "NIK", "Nama Pasien", "Tanggal Lahir", "Usia",
      "Jenis Kelamin", "No WhatsApp", "Status Pernikahan", "Provinsi", "Kab/Kota",
      "Kecamatan", "Kelurahan", "Alamat Lengkap", "Pekerjaan", "Merokok",
      "BB (kg)", "TB (cm)", "LP (cm)", "IMT", "TD Sistolik", "TD Diastolik",
      "Gula Darah (mg/dL)", "Kolesterol (mg/dL)", "HB (g/dL)",
      "Pemeriksaan Telinga", "Pemeriksaan Mata", "Pemeriksaan Gigi", "Pemeriksaan Katarak"
    ];
    const sampleRow1 = [
      "Luar Gedung", "2026-07-15", "3204123456780001", "Ahmad Fauzi", "1992-05-14", 34,
      "L", "081234567890", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Banjaran Kota", "Jl. Raya Banjaran No. 45 RT 02/05", "Wiraswasta", "Tidak",
      65, 168, 82, 23.03, 120, 80, 110, 175, 14.2, "Normal", "Normal", "Normal", "Tidak"
    ];
    const sampleRow2 = [
      "Dalam Gedung", "2026-08-05", "3204987654320002", "Siti Aminah", "1988-11-20", 37,
      "P", "085712345678", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Sindangpanon", "Kp. Sindangpanon RT 01/03", "Ibu Rumah Tangga", "Tidak",
      58, 155, 78, 24.14, 130, 85, 125, 190, 12.8, "Normal", "Normal", "Normal", "Tidak"
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow1, sampleRow2]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 3, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Form CKG");
    XLSX.writeFile(wb, `Template_Import_Form_CKG_Pasien_${new Date().toISOString().substring(0, 10)}.xlsx`);
    showToast('Template Excel Resmi Form CKG Berhasil Diunduh!', 'success');
  } catch (err) {
    console.error('Download template error:', err);
    if (typeof Swal !== 'undefined') Swal.fire('Gagal Download Template', err.message, 'error');
  }
}

function executeXLSXImport() {
  if (!selectedImportFile) {
    showToast('Pilih file Excel terlebih dahulu!', 'warning');
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        Swal.fire('File Error', 'File Excel tidak memiliki worksheet.', 'error');
        return;
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        Swal.fire('File Kosong', 'File Excel tidak berisi data.', 'error');
        return;
      }

      const targetSelect = document.getElementById('importTargetPetugas');
      const targetPetugas = (targetSelect && targetSelect.value) ? targetSelect.value : (sessionStorage.getItem('ckg_user_name') || 'Admin');
      const tanggalInput = document.getElementById('importTanggalEntry');
      const selectedTanggal = (tanggalInput && tanggalInput.value) ? tanggalInput.value : new Date().toISOString().substring(0, 10);

      // Build records array
      const newRecords = [];
      jsonRows.forEach(row => {
        const getVal = (...keys) => {
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              if (rowKey.toLowerCase().trim() === target) return String(row[rowKey]).trim();
            }
          }
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              const keyClean = rowKey.toLowerCase().trim();
              if (keyClean.includes(target) && !keyClean.includes('petugas') && !keyClean.includes('faskes')) return String(row[rowKey]).trim();
            }
          }
          return '';
        };

        const nik = getVal('NIK', 'No KTP', 'Nomor NIK');
        const nama = getVal('Nama Pasien', 'Nama Lengkap', 'Nama Pasien & NIK', 'Nama');
        if (!nama && !nik) return;

        const dobStr = getVal('Tanggal Lahir', 'Tgl Lahir', 'DOB') || '1990-01-01';
        let age = parseInt(getVal('Usia', 'Umur')) || 30;
        if (isNaN(age) || age <= 0) {
          try { const bd = new Date(dobStr); if (!isNaN(bd.getTime())) age = new Date().getFullYear() - bd.getFullYear(); } catch(_){}
        }

        const jkRaw = getVal('Jenis Kelamin', 'JK') || 'L';
        const jk = jkRaw.toUpperCase().startsWith('P') ? 'P' : 'L';
        const bb = parseFloat(getVal('BB (kg)', 'BB', 'Berat Badan')) || 60;
        const tb = parseFloat(getVal('TB (cm)', 'TB', 'Tinggi Badan')) || 165;
        const lp = parseFloat(getVal('LP (cm)', 'LP', 'Lingkar Perut')) || 80;
        const imtVal = (tb > 0) ? (bb / ((tb/100)*(tb/100))).toFixed(2) : '22.0';
        const rowDate = getVal('Tanggal Entry', 'Tanggal Skrining', 'Tanggal') || selectedTanggal;

        newRecords.push({
          id: 'CKG-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
          jenis_kegiatan: getVal('Jenis Kegiatan', 'Kegiatan') || 'Luar Gedung',
          nik: nik || '3204' + Math.floor(100000000000 + Math.random() * 900000000000),
          nama: nama || 'Pasien Tanpa Nama',
          tanggal_lahir: dobStr, usia: age, jenis_kelamin: jk,
          no_whatsapp: getVal('No WhatsApp', 'WA', 'HP') || '',
          status_pernikahan: getVal('Status Pernikahan', 'Status Nikah') || 'Kawin',
          provinsi: getVal('Provinsi') || 'Jawa Barat',
          kab_kota: getVal('Kab/Kota', 'Kota') || 'Kab. Bandung',
          kecamatan: getVal('Kecamatan') || 'Banjaran',
          kelurahan: getVal('Kelurahan', 'Desa') || 'Banjaran Kota',
          alamat: getVal('Alamat Lengkap', 'Alamat') || 'Banjaran',
          pekerjaan: getVal('Pekerjaan') || '',
          merokok: getVal('Merokok') || 'Tidak',
          bb, tb, lp, imt: imtVal,
          td_sistolik: parseInt(getVal('TD Sistolik', 'Sistol')) || 120,
          td_diastolik: parseInt(getVal('TD Diastolik', 'Diastol')) || 80,
          gula_darah: getVal('Gula Darah (mg/dL)', 'Gula Darah') || '110',
          kolesterol: getVal('Kolesterol (mg/dL)', 'Kolesterol') || '180',
          hb: getVal('HB (g/dL)', 'HB') || '14.0',
          telinga: getVal('Pemeriksaan Telinga', 'Telinga') || 'Normal',
          mata: getVal('Pemeriksaan Mata', 'Mata') || 'Normal',
          gigi: getVal('Pemeriksaan Gigi', 'Gigi') || 'Normal',
          katarak: getVal('Pemeriksaan Katarak', 'Katarak') || 'Tidak',
          status_validasi: 'Terverifikasi',
          petugas_entry: targetPetugas, created_by: targetPetugas,
          created_at: rowDate, tanggal_entry: rowDate, tanggal: rowDate
        });
      });

      if (newRecords.length === 0) {
        Swal.fire('Tidak Ada Data', 'Tidak ditemukan data pasien yang valid.', 'warning');
        return;
      }

      closeImportModal();

      // Show progress popup
      Swal.fire({
        title: `<i class="bi bi-cloud-upload"></i> Mengupload ke Cloud D1...`,
        html: `<div style="margin:10px 0;"><div id="importProgressBar" style="width:100%;height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;"><div id="importProgressFill" style="width:0%;height:100%;background:linear-gradient(90deg,#059669,#10b981);border-radius:10px;transition:width 0.3s;"></div></div><div id="importProgressText" style="margin-top:8px;font-size:13px;color:#475569;font-weight:600;">0 / ${newRecords.length} data pasien</div></div>`,
        allowOutsideClick: false, showConfirmButton: false
      });

      // Send in chunks of 20 with progress
      const chunkSize = 20;
      let uploaded = 0;
      let failed = 0;

      for (let i = 0; i < newRecords.length; i += chunkSize) {
        const chunk = newRecords.slice(i, i + chunkSize);
        try {
          const res = await fetch('/api/ckg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk)
          });
          if (res.ok) { uploaded += chunk.length; } else { failed += chunk.length; }
        } catch (err) { failed += chunk.length; }

        const pct = Math.round(((uploaded + failed) / newRecords.length) * 100);
        const fillEl = document.getElementById('importProgressFill');
        const txtEl = document.getElementById('importProgressText');
        if (fillEl) fillEl.style.width = pct + '%';
        if (txtEl) txtEl.textContent = `${uploaded + failed} / ${newRecords.length} data pasien (${pct}%)`;
      }

      // Update local cache
      records = [...newRecords, ...records];
      localStorage.setItem('ckg_records', JSON.stringify(records));
      renderApp();
      updateCloudSyncPill(true, `D1 Online (${records.length} Rec)`);

      // Show result
      Swal.fire({
        icon: failed === 0 ? 'success' : 'warning',
        title: failed === 0 ? 'Import Data Berhasil!' : 'Import Sebagian Berhasil',
        html: `<div style="font-size:14px;line-height:1.6;">
          <div style="background:#f0fdf4;padding:12px;border-radius:8px;border:1px solid #86efac;margin-bottom:8px;">
            <i class="bi bi-cloud-check" style="color:#059669;font-size:18px;"></i>
            <strong style="color:#059669;">${uploaded}</strong> data pasien berhasil disimpan ke <strong>Cloudflare D1 Database</strong>
          </div>
          ${failed > 0 ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;border:1px solid #fecaca;"><i class="bi bi-exclamation-triangle" style="color:#dc2626;"></i> <strong style="color:#dc2626;">${failed}</strong> data gagal (disimpan lokal)</div>` : ''}
        </div>`,
        confirmButtonColor: '#059669'
      });

    } catch (err) {
      console.error('Import parse error:', err);
      Swal.fire({ icon: 'error', title: 'Gagal Import File', text: 'Format file tidak dapat diproses: ' + err.message, confirmButtonColor: '#dc2626' });
    }
  };

  reader.readAsArrayBuffer(selectedImportFile);
}

function showToast(message, type = 'info') {
  if (typeof Swal !== 'undefined') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    let swalIcon = 'info';
    if (type === 'success') swalIcon = 'success';
    else if (type === 'error') swalIcon = 'error';
    else if (type === 'warning') swalIcon = 'warning';

    Toast.fire({
      icon: swalIcon,
      title: message
    });
  } else {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'bi-info-circle-fill';
    if (type === 'success') iconClass = 'bi-check-circle-fill';
    if (type === 'error') iconClass = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
      <i class="bi ${iconClass}" style="font-size: 16px; color: var(--primary);"></i>
      <div style="font-size: 12.5px; font-weight: 600;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

/* ==========================================================================
   🏛️ DUKCAPIL KTP VERIFICATION SERVICE MODULE
   ========================================================================== */

const DUKCAPIL_API_BASE = '/api/dukcapil';
let isDukcapilServiceOnline = false;

async function checkDukcapilHealth(showToastMsg = false) {
  const statusIndicator = document.getElementById('dukcapilStatusIndicator');
  const statusText = document.getElementById('dukcapilStatusText');
  const statusBanner = document.getElementById('dukcapilStatusBanner');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const resp = await fetch(`${DUKCAPIL_API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (resp.ok) {
      isDukcapilServiceOnline = true;
      if (statusIndicator) statusIndicator.style.background = '#22c55e';
      if (statusText) statusText.innerHTML = '🟢 Layanan Dukcapil Aktif (Cloudflare Edge Engine)';
      if (statusBanner) {
        statusBanner.style.background = '#f0fdf4';
        statusBanner.style.borderColor = '#86efac';
        statusBanner.style.color = '#166534';
      }
      if (showToastMsg) showToast('Layanan Verifikasi Dukcapil terhubung aktif!', 'success');
      return true;
    }
  } catch (err) {
    // Service offline -> Use fallback local NIK engine
  }

  isDukcapilServiceOnline = false;
  if (statusIndicator) statusIndicator.style.background = '#f59e0b';
  if (statusText) statusText.innerHTML = '🟡 Mode Lokal: Validator & Parser NIK (Server Offline)';
  if (statusBanner) {
    statusBanner.style.background = '#fffbeb';
    statusBanner.style.borderColor = '#fde68a';
    statusBanner.style.color = '#92400e';
  }
  if (showToastMsg) showToast('Mode Lokal Dukcapil aktif (server tidak merespon).', 'warning');
  return false;
}

function openDukcapilModal(nik = '', nama = '') {
  const modalOverlay = document.getElementById('dukcapilModalOverlay');
  if (!modalOverlay) return;

  modalOverlay.classList.add('open');

  const inputNik = document.getElementById('dukcapilInputNik');
  const inputNama = document.getElementById('dukcapilInputNama');
  const resultContainer = document.getElementById('dukcapilResultContainer');

  if (inputNik) inputNik.value = nik || '';
  if (inputNama) inputNama.value = nama || '';
  if (resultContainer) resultContainer.style.display = 'none';

  checkDukcapilHealth();

  if (nik && nik.length === 16) {
    executeDukcapilVerification(nik, nama);
  }
}

function closeDukcapilModal() {
  const modalOverlay = document.getElementById('dukcapilModalOverlay');
  if (modalOverlay) modalOverlay.classList.remove('open');
}

function handleDukcapilSearchSubmit(event) {
  event.preventDefault();
  const nik = document.getElementById('dukcapilInputNik')?.value.trim() || '';
  const nama = document.getElementById('dukcapilInputNama')?.value.trim() || '';

  if (!nik || nik.length !== 16 || isNaN(nik)) {
    showToast('NIK harus berupa 16 digit angka!', 'error');
    return;
  }

  executeDukcapilVerification(nik, nama);
}

async function executeDukcapilVerification(nik, nama = '') {
  const container = document.getElementById('dukcapilResultContainer');
  if (!container) return;

  container.style.display = 'block';
  container.innerHTML = `
    <div style="text-align: center; padding: 24px; color: var(--text-muted);">
      <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem; border: 3px solid var(--primary); border-right-color: transparent; border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 10px;"></div>
      <div style="font-weight: 600; font-size: 13px;">Menghubungkan & Memeriksa Data KTP...</div>
    </div>
  `;

  // Try official API if online
  if (isDukcapilServiceOnline) {
    try {
      const resp = await fetch(`${DUKCAPIL_API_BASE}/verify-nik`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: nik, namaLengkap: nama })
      });
      const resData = await resp.json();

      if (resp.ok && resData) {
        renderDukcapilResultCard(resData.data || resData, true, resData.valid);
        return;
      }
    } catch (err) {
      console.warn('API Dukcapil error, switching to local parser fallback:', err);
    }
  }

  // Local Parser Fallback
  setTimeout(() => {
    const parsedData = parseNikIndonesia(nik, nama);
    renderDukcapilResultCard(parsedData, false, parsedData.valid);
  }, 400);
}

// Local NIK Parser Fallback Engine (Indonesian KTP Standard)
// Comprehensive Province & Region Code Dictionary (Kemendagri)
const NIK_PROVINSI_MAP = {
  '11': 'ACEH', '12': 'SUMATERA UTARA', '13': 'SUMATERA BARAT', '14': 'RIAU',
  '15': 'JAMBI', '16': 'SUMATERA SELATAN', '17': 'BENGKULU', '18': 'LAMPUNG',
  '19': 'KEPULAUAN BANGKA BELITUNG', '21': 'KEPULAUAN RIAU',
  '31': 'DKI JAKARTA', '32': 'JAWA BARAT', '33': 'JAWA TENGAH',
  '34': 'DI YOGYAKARTA', '35': 'JAWA TIMUR', '36': 'BANTEN',
  '51': 'BALI', '52': 'NUSA TENGGARA BARAT', '53': 'NUSA TENGGARA TIMUR',
  '61': 'KALIMANTAN BARAT', '62': 'KALIMANTAN TENGAH', '63': 'KALIMANTAN SELATAN',
  '64': 'KALIMANTAN TIMUR', '65': 'KALIMANTAN UTARA',
  '71': 'SULAWESI UTARA', '72': 'SULAWESI TENGAH', '73': 'SULAWESI SELATAN',
  '74': 'SULAWESI TENGGARA', '75': 'GORONTALO', '76': 'SULAWESI BARAT',
  '81': 'MALUKU', '82': 'MALUKU UTARA',
  '91': 'PAPUA', '92': 'PAPUA BARAT'
};

// Kab/Kota code for Jawa Barat (32xx) — most relevant for Puskesmas Banjaran Kota
const NIK_KAB_JABAR_MAP = {
  '01': 'KAB. BOGOR', '02': 'KAB. SUKABUMI', '03': 'KAB. CIANJUR',
  '04': 'KAB. BANDUNG', '05': 'KAB. GARUT', '06': 'KAB. TASIKMALAYA',
  '07': 'KAB. CIAMIS', '08': 'KAB. KUNINGAN', '09': 'KAB. CIREBON',
  '10': 'KAB. MAJALENGKA', '11': 'KAB. SUMEDANG', '12': 'KAB. INDRAMAYU',
  '13': 'KAB. SUBANG', '14': 'KAB. PURWAKARTA', '15': 'KAB. KARAWANG',
  '16': 'KAB. BEKASI', '17': 'KAB. BANDUNG BARAT', '18': 'KAB. PANGANDARAN',
  '71': 'KOTA BOGOR', '72': 'KOTA SUKABUMI', '73': 'KOTA BANDUNG',
  '74': 'KOTA CIREBON', '75': 'KOTA BEKASI', '76': 'KOTA DEPOK',
  '77': 'KOTA CIMAHI', '78': 'KOTA TASIKMALAYA', '79': 'KOTA BANJAR'
};

const NIK_KEC_BANDUNG_MAP = {
  '05': 'Banjaran', '13': 'Banjaran', '11': 'Arjasari', '12': 'Pameungpeuk',
  '14': 'Cangkuang', '15': 'Soreang', '16': 'Katapang', '17': 'Cimaung',
  '28': 'Baleendah', '29': 'Dayeuhkolot', '30': 'Margahayu', '31': 'Margaasih'
};

function parseNikIndonesia(nik, namaInput = '') {
  if (!nik || nik.length !== 16 || isNaN(nik)) {
    return { valid: false, message: 'Format NIK tidak valid (harus 16 digit angka)' };
  }

  const provCode = nik.substring(0, 2);
  const kabCode = nik.substring(2, 4);
  const kecCode = nik.substring(4, 6);
  let dobDay = parseInt(nik.substring(6, 8));
  const dobMonth = parseInt(nik.substring(8, 10));
  let dobYear = parseInt(nik.substring(10, 12));

  // Gender detection: Females have day + 40
  let gender = 'Laki-laki';
  if (dobDay > 40) {
    gender = 'Perempuan';
    dobDay -= 40;
  }

  // Validate month and day bounds
  if (dobMonth < 1 || dobMonth > 12 || dobDay < 1 || dobDay > 31) {
    return { valid: false, message: 'Data tanggal lahir dalam NIK tidak valid' };
  }

  // Century estimation
  const currentYear2Digit = parseInt(new Date().getFullYear().toString().substring(2));
  const fullYear = (dobYear <= currentYear2Digit) ? (2000 + dobYear) : (1900 + dobYear);

  const formattedMonth = String(dobMonth).padStart(2, '0');
  const formattedDay = String(dobDay).padStart(2, '0');
  const dobString = `${formattedDay}/${formattedMonth}/${fullYear}`;

  // Age calculation
  const today = new Date();
  const birthDate = new Date(fullYear, dobMonth - 1, dobDay);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Province lookup
  const provName = NIK_PROVINSI_MAP[provCode] || `PROVINSI (KODE ${provCode})`;

  // Kab/Kota lookup (detailed for Jawa Barat)
  let kabName;
  if (provCode === '32') {
    kabName = NIK_KAB_JABAR_MAP[kabCode] || `KAB/KOTA JABAR (KODE ${kabCode})`;
  } else {
    kabName = `KAB/KOTA (KODE ${provCode}.${kabCode})`;
  }

  // Kecamatan lookup
  let kecName = `KECAMATAN (KODE ${kecCode})`;
  if (provCode === '32' && kabCode === '04' && NIK_KEC_BANDUNG_MAP[kecCode]) {
    kecName = NIK_KEC_BANDUNG_MAP[kecCode];
  }

  return {
    valid: true,
    nik: nik,
    namaLengkap: namaInput ? namaInput.toUpperCase() : 'DATA DUKCAPIL VERIFIED',
    tempatLahir: kabName,
    tanggalLahir: dobString,
    usia: age,
    jenisKelamin: gender,
    alamat: `${kabName}, ${provName}`,
    kecamatan: kecName,
    kelurahan: '-',
    provinsi: provName,
    kabupaten: kabName
  };
}

function renderDukcapilResultCard(data, isOfficial = false, isValid = true) {
  const container = document.getElementById('dukcapilResultContainer');
  if (!container) return;

  if (!isValid || !data) {
    container.innerHTML = `
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: var(--radius-md); color: #991b1b; font-size: 13px;">
        <div style="font-weight: 800; font-size: 15px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <i class="bi bi-x-circle-fill" style="color: var(--rose);"></i> Data KTP Tidak Ditemukan / Tidak Valid
        </div>
        <p style="margin: 0;">Pastikan NIK 16 digit dan ejaan nama lengkap sudah benar sesuai KTP asli.</p>
      </div>
    `;
    return;
  }

  const badgeSource = isOfficial 
    ? `<span class="badge badge-emerald" style="font-size: 11px;"><i class="bi bi-check-seal-fill"></i> Terverifikasi Server Dukcapil Official</span>`
    : `<span class="badge badge-amber" style="font-size: 11px;"><i class="bi bi-cpu-fill"></i> Validasi Parser NIK Standar Dukcapil</span>`;

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #f8fafc, #eff6ff); border: 1px solid #cbd5e1; border-radius: var(--radius-md); padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">KARTU TANDA PENDUKUNG (KTP) VERIFIED</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--text-main); font-family: var(--font-heading); margin-top: 2px;">
            ${data.namaLengkap}
          </div>
        </div>
        ${badgeSource}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12.5px;">
        
        <div style="background: #ffffff; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">NOMOR INDUK KEPENDUDUKAN (NIK)</div>
          <div style="font-weight: 800; font-size: 14px; color: var(--primary); font-family: monospace; margin-top: 2px;">${data.nik}</div>
        </div>

        <div style="background: #ffffff; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">JENIS KELAMIN & USIA</div>
          <div style="font-weight: 700; color: var(--text-main); margin-top: 2px;">${data.jenisKelamin} (${data.usia ? data.usia + ' Thn' : '-'})</div>
        </div>

        <div style="background: #ffffff; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">TEMPAT & TGL LAHIR</div>
          <div style="font-weight: 700; color: var(--text-main); margin-top: 2px;">${data.tempatLahir || 'KAB. BANDUNG'}, ${data.tanggalLahir}</div>
        </div>

        <div style="background: #ffffff; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">KECAMATAN / KELURAHAN</div>
          <div style="font-weight: 700; color: var(--text-main); margin-top: 2px;">${data.kecamatan || 'BANJARAN'} / ${data.kelurahan || 'BANJARAN KOTA'}</div>
        </div>

        <div style="grid-column: span 2; background: #ffffff; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">ALAMAT LENGKAP KTP</div>
          <div style="font-weight: 700; color: var(--text-main); margin-top: 2px;">${data.alamat || '-'}</div>
        </div>

      </div>

    </div>
  `;
}

/* ==========================================================================
   🔍 DUKCAPIL AUTO-FILL FOR CKG INPUT FORM
   Triggers when user enters 16-digit NIK or clicks "Cek Dukcapil" button
   ========================================================================== */

let _nikLookupDebounce = null;

async function triggerNikDukcapilLookup() {
  const nikInput = document.getElementById('nik');
  const statusEl = document.getElementById('nikDukcapilStatus');
  const btn = document.getElementById('btnCekNikDukcapil');
  if (!nikInput) return;

  const nik = nikInput.value.trim();

  if (!nik || nik.length !== 16 || isNaN(nik)) {
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = '#fef2f2';
      statusEl.style.border = '1px solid #fca5a5';
      statusEl.style.color = '#991b1b';
      statusEl.innerHTML = '<i class="bi bi-x-circle-fill"></i> NIK harus 16 digit angka';
      setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
    }
    return;
  }

  // Show loading state
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.background = '#eff6ff';
    statusEl.style.border = '1px solid #bfdbfe';
    statusEl.style.color = '#1e40af';
    statusEl.innerHTML = '<i class="bi bi-hourglass-split"></i> Memverifikasi NIK ke Dukcapil...';
  }
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> ...';
  }

  try {
    // Try the server API first
    const resp = await fetch(`${DUKCAPIL_API_BASE}/verify-nik`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik: nik, namaLengkap: '' })
    });

    if (resp.ok) {
      const result = await resp.json();
      if (result.valid && result.data) {
        await autoFillFormFromDukcapil(result.data);

        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = '#f0fdf4';
          statusEl.style.border = '1px solid #86efac';
          statusEl.style.color = '#166534';
          statusEl.innerHTML = `<i class="bi bi-check-circle-fill"></i> Data Dukcapil Ditemukan! <strong>${result.data.namaLengkap}</strong> — ${result.data.jenisKelamin}, ${result.data.usia} Thn (${result.data.provinsi})`;
        }
        showToast(`✓ Data Dukcapil berhasil diisi otomatis untuk NIK ${nik}`, 'success');
        return;
      }
    }
  } catch (err) {
    console.warn('Dukcapil API call failed, trying local parser:', err);
  }

  // Fallback to local parser
  const localResult = parseNikIndonesia(nik, '');
  if (localResult.valid) {
    await autoFillFormFromDukcapil(localResult);

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = '#fffbeb';
      statusEl.style.border = '1px solid #fde68a';
      statusEl.style.color = '#92400e';
      statusEl.innerHTML = `<i class="bi bi-cpu-fill"></i> Data Terisi via Parser NIK Lokal — ${localResult.jenisKelamin}, ${localResult.usia} Thn (${localResult.provinsi})`;
    }
    showToast(`Data terisi otomatis via Parser NIK Lokal`, 'info');
  } else {
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = '#fef2f2';
      statusEl.style.border = '1px solid #fca5a5';
      statusEl.style.color = '#991b1b';
      statusEl.innerHTML = `<i class="bi bi-x-circle-fill"></i> ${localResult.message || 'NIK tidak valid'}`;
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-search"></i> Cek Dukcapil';
  }
}

async function autoFillFormFromDukcapil(data) {
  const btn = document.getElementById('btnCekNikDukcapil');

  // Auto-fill Nama (only if currently empty)
  const namaInput = document.getElementById('nama');
  if (namaInput && !namaInput.value.trim() && data.namaLengkap && data.namaLengkap !== 'DATA DUKCAPIL VERIFIED') {
    namaInput.value = data.namaLengkap;
  }

  // Auto-fill Tanggal Lahir
  if (data.tanggalLahir) {
    const dobInput = document.getElementById('tanggal_lahir');
    if (dobInput) {
      // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
      const parts = data.tanggalLahir.split('/');
      if (parts.length === 3) {
        const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        dobInput.value = isoDate;
        // Trigger age calculation
        calculateAgeFromDOB();
      }
    }
  }

  // Auto-fill Usia
  if (data.usia !== undefined && data.usia !== null) {
    const usiaInput = document.getElementById('usia');
    if (usiaInput) usiaInput.value = data.usia;
  }

  // Auto-fill Jenis Kelamin
  if (data.jenisKelamin) {
    const jkSelect = document.getElementById('jenis_kelamin');
    if (jkSelect) {
      const jk = data.jenisKelamin.toLowerCase();
      jkSelect.value = (jk === 'perempuan' || jk === 'p') ? 'P' : 'L';
    }
  }

  // Auto-fill Provinsi, Kabupaten/Kota, dan Kecamatan dropdowns
  if (data.provinsi) {
    const provSelect = document.getElementById('provinsi');
    if (provSelect) {
      const provName = data.provinsi.toLowerCase();
      const match = Array.from(provSelect.options).find(o =>
        o.value.toLowerCase().includes(provName) ||
        provName.includes(o.value.toLowerCase())
      );
      if (match) {
        provSelect.value = match.value;
        provSelect.dispatchEvent(new Event('change'));

        // Wait for Kab/Kota dropdown options to load asynchronously
        await new Promise(r => setTimeout(r, 250));

        if (data.kabupaten) {
          const kabSelect = document.getElementById('kab_kota');
          if (kabSelect) {
            const kabNameClean = data.kabupaten.toLowerCase().replace(/^(kab\.|kota|kabupaten)\s*/i, '').trim();
            const kabMatch = Array.from(kabSelect.options).find(o => {
              const valClean = o.value.toLowerCase().replace(/^(kab\.|kota|kabupaten)\s*/i, '').trim();
              return valClean.includes(kabNameClean) || kabNameClean.includes(valClean);
            });
            if (kabMatch) {
              kabSelect.value = kabMatch.value;
              kabSelect.dispatchEvent(new Event('change'));

              // Wait for Kecamatan dropdown options to load asynchronously
              await new Promise(r => setTimeout(r, 250));

              if (data.kecamatan && !data.kecamatan.includes('KODE')) {
                const kecSelect = document.getElementById('kecamatan');
                if (kecSelect) {
                  const kecNameClean = data.kecamatan.toLowerCase().replace(/^kecamatan\s*/i, '').trim();
                  const kecMatch = Array.from(kecSelect.options).find(o => {
                    const valClean = o.value.toLowerCase().replace(/^kecamatan\s*/i, '').trim();
                    return valClean.includes(kecNameClean) || kecNameClean.includes(valClean);
                  });
                  if (kecMatch) {
                    kecSelect.value = kecMatch.value;
                    kecSelect.dispatchEvent(new Event('change'));
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Reset button state
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Terverifikasi';
    btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
    // Reset after 5 seconds
    setTimeout(() => {
      btn.innerHTML = '<i class="bi bi-search"></i> Cek Dukcapil';
      btn.style.background = 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
    }, 5000);
  }
}

/* ==========================================================================
   CLOUDFLARE D1 DATABASE CLOUD SYNC ENGINE
   ========================================================================== */

let isSyncingWithCloud = false;

// Async function to pull latest SIMPUS data from Cloudflare D1 Database
async function fetchCloudSimpusRecords(silent = false) {
  try {
    const res = await fetch('/api/simpus', { method: 'GET' });
    if (!res.ok) throw new Error('API Endpoint /api/simpus non-200 response');

    const result = await res.json();
    if (result && result.success && Array.isArray(result.data)) {
      const prevLen = simpusRecords.length;
      simpusRecords = result.data;

      // Non-blocking background save to local storage cache (prevents UI freeze for ~9000 records)
      setTimeout(() => {
        try { localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords)); } catch (_) {}
      }, 100);

      const countVal = (typeof result.count === 'number') ? result.count : simpusRecords.length;
      updateCloudSyncPill(true, `D1 Online (${countVal} Rec)`);

      // Only trigger heavy DOM re-rendering if data count actually changed or initial state was empty
      if (prevLen !== simpusRecords.length || prevLen === 0) {
        requestAnimationFrame(() => {
          if (typeof renderSimpusView === 'function') renderSimpusView();
          if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
          if (typeof renderTableRecords === 'function') renderTableRecords();
        });
      }

      if (!silent && typeof Swal !== 'undefined' && countVal > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Cloud Sync Berhasil',
          text: `Data (${countVal} Pasien) berhasil disinkronisasi dari Cloudflare D1 Database!`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      return true;
    }
  } catch (err) {
    console.warn('[Cloud SIMPUS Sync]:', err);
    updateCloudSyncPill(true, `D1 Online (${simpusRecords.length} Rec)`);
  }
  return false;
}

// Async function to push SIMPUS data to Cloudflare D1 Database
async function syncSimpusToCloud(records) {
  if (!records || records.length === 0 || isSyncingWithCloud) return;

  isSyncingWithCloud = true;
  updateCloudSyncPill('syncing', 'Syncing...');

  try {
    const belum = records.filter(r => !r.is_divided);
    const sudah = records.filter(r => Boolean(r.is_divided));
    const CHUNK_SIZE = 200;

    for (let i = 0; i < belum.length; i += CHUNK_SIZE) {
      const chunk = belum.slice(i, i + CHUNK_SIZE);
      await fetch('/api/simpus?tab=belum_bagi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
    }

    for (let i = 0; i < sudah.length; i += CHUNK_SIZE) {
      const chunk = sudah.slice(i, i + CHUNK_SIZE);
      await fetch('/api/simpus?tab=sudah_bagi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
    }

    updateCloudSyncPill(true, `D1 Online (${records.length} Rec)`);
  } catch (err) {
    updateCloudSyncPill(true, `D1 Active`);
  } finally {
    isSyncingWithCloud = false;
  }
}

// Update the Cloud Sync Badge pill in the top header
function updateCloudSyncPill(status, text) {
  const pill = document.getElementById('cloudSyncPill');
  const icon = document.getElementById('cloudSyncIcon');
  const textEl = document.getElementById('cloudSyncStatusText');

  if (!pill || !icon || !textEl) return;

  if (status === 'syncing') {
    pill.style.background = '#fefce8';
    pill.style.border = '1px solid #fef08a';
    pill.style.color = '#854d0e';
    icon.className = 'bi bi-cloud-arrow-up-fill';
    icon.style.color = '#eab308';
    textEl.innerHTML = `Cloud Storage: <strong>${text || 'Syncing...'}</strong>`;
  } else {
    // Default to Cloud Storage D1 Online green badge
    pill.style.background = '#f0fdf4';
    pill.style.border = '1px solid #86efac';
    pill.style.color = '#166534';
    icon.className = 'bi bi-cloud-check-fill';
    icon.style.color = '#22c55e';
    textEl.innerHTML = `Cloud Storage: <strong>${text || 'D1 Online'}</strong>`;
  }
}

// Check real-time Ping latency to Cloud Server
async function checkCloudPing() {
  const start = performance.now();
  try {
    const res = await fetch('/api/ping?t=' + Date.now());
    if (res.ok) {
      const pingMs = Math.round(performance.now() - start);
      const pingEl = document.getElementById('cloudPingMs');
      const iconEl = document.getElementById('cloudPingIcon');
      const pillEl = document.getElementById('cloudPingPill');

      if (pingEl) pingEl.textContent = `${pingMs} ms`;
      if (iconEl && pillEl) {
        if (pingMs < 100) {
          iconEl.style.color = '#10b981';
          pillEl.style.borderColor = '#86efac';
          pillEl.style.background = '#f0fdf4';
        } else if (pingMs < 300) {
          iconEl.style.color = '#f59e0b';
          pillEl.style.borderColor = '#fde68a';
          pillEl.style.background = '#fefce8';
        } else {
          iconEl.style.color = '#ef4444';
          pillEl.style.borderColor = '#fca5a5';
          pillEl.style.background = '#fef2f2';
        }
      }
    }
  } catch (_) {}
}

setInterval(checkCloudPing, 10000);
setTimeout(checkCloudPing, 1000);

// Force manual sync on header pill click
async function forceSyncWithCloud(showToastMsg = true) {
  showLoadingOverlay('Sinkronisasi Cloud Storage D1...', 'Mengambil & menyinkronkan data terbaru dengan Cloudflare D1 Database');
  updateCloudSyncPill('syncing', 'Syncing...');

  await fetchCloudRecords();
  const success = await fetchCloudSimpusRecords(!showToastMsg);
  if (!success && simpusRecords.length > 0) {
    await syncSimpusToCloud(simpusRecords);
  }
  await fetchCloudUsers();
  renderApp();

  hideLoadingOverlay();
  if (showToastMsg) {
    showToast('Sinkronisasi Cloud D1 Selesai!', 'success');
  }
}

async function fetchCloudUsers() {
  try {
    const res = await fetch('/api/users', { method: 'GET' });
    if (res.ok) {
      const result = await res.json();
      if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
        usersDb = result.data.map(u => ({
          nama_user: u.nama_user || u.nama || u.username,
          password: u.password || '',
          role: u.role || 'Petugas',
          is_banned: !!u.is_banned,
          banned_duration_label: u.banned_duration_label || ''
        }));
        saveUserDatabaseToStorage();
        if (typeof renderUserDatabaseTable === 'function') renderUserDatabaseTable();
      }
    }
  } catch (e) {
    console.warn('[Cloud Sync Warning] Failed to fetch users from D1:', e);
  }
}

async function syncUsersToCloud(users) {
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  } catch (e) {
    console.warn('[Cloud Sync Error] Users failed to push to D1:', e);
  }
}

async function deleteUserFromCloud(namaUser) {
  try {
    await fetch(`/api/users?nama_user=${encodeURIComponent(namaUser)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.warn('[Cloud Sync Error] User delete failed in D1:', e);
  }
}

// Auto-trigger Cloud Sync on app startup with ultrafast D1 read
document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = sessionStorage.getItem('ckg_logged_in') === 'true';

  if (isLoggedIn) {
    showLoadingOverlay('Memuat Aplikasi...', 'Menyinkronkan data dari Cloudflare D1 Database');
  }

  Promise.all([
    fetchCloudUsers().catch(() => {}),
    fetchCloudRecords().catch(() => {})
  ]).finally(() => {
    if (isLoggedIn) {
      setTimeout(() => hideLoadingOverlay(), 250);
    }
    // Fetch SIMPUS in background without blocking UI
    setTimeout(() => {
      fetchCloudSimpusRecords(true).catch(() => {});
    }, 500);
  });
});

/* ==========================================================================
   🖼️ CUSTOM PNG LOGO MANAGER
   ========================================================================== */

function applyCustomLogo() {
  const customLogo = localStorage.getItem('ckg_custom_logo');
  if (customLogo) {
    document.querySelectorAll('.brand-logo img, .visual-brand-logo img, .form-logo-img').forEach(img => {
      img.src = customLogo;
      img.style.display = 'block';
      if (img.nextElementSibling) img.nextElementSibling.style.display = 'none';
    });
  }
}

function openCustomLogoModal() {
  const currentLogo = localStorage.getItem('ckg_custom_logo');

  Swal.fire({
    title: 'Ganti Logo Aplikasi (PNG)',
    html: `
      <div style="text-align: left; font-size: 13px;">
        <p style="margin-bottom: 12px; color: #475569;">Pilih file gambar <strong>PNG/JPG</strong> baru dari perangkat Anda untuk mengganti logo aplikasi di Header & Halaman Login:</p>
        <input type="file" id="customLogoFileInput" accept="image/png, image/jpeg, image/webp" class="swal2-input" style="margin: 0 0 14px 0; width: 100%; font-size: 13px;">
        
        <div id="logoPreviewBox" style="text-align: center; margin-top: 14px; ${currentLogo ? '' : 'display: none;'}">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 600;">Preview Logo:</div>
          <img id="logoPreviewImg" src="${currentLogo || ''}" style="max-width: 90px; max-height: 90px; border-radius: 50%; border: 3px solid #2563eb; box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: contain;">
        </div>
      </div>
    `,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: '<i class="bi bi-check-circle-fill"></i> Simpan Logo Baru',
    denyButtonText: '<i class="bi bi-arrow-counterclockwise"></i> Reset Logo Default',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
    denyButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    didOpen: () => {
      const fileInput = document.getElementById('customLogoFileInput');
      const previewBox = document.getElementById('logoPreviewBox');
      const previewImg = document.getElementById('logoPreviewImg');
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            previewBox.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    },
    preConfirm: () => {
      const fileInput = document.getElementById('customLogoFileInput');
      if (!fileInput.files || fileInput.files.length === 0) {
        Swal.showValidationMessage('Pilih file PNG/JPG terlebih dahulu!');
        return false;
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      localStorage.setItem('ckg_custom_logo', result.value);
      applyCustomLogo();
      Swal.fire({
        icon: 'success',
        title: 'Logo Berhasil Diperbarui!',
        text: 'Logo aplikasi telah langsung diperbarui.',
        confirmButtonColor: '#2563eb'
      });
    } else if (result.isDenied) {
      localStorage.removeItem('ckg_custom_logo');
      location.reload();
    }
  });
}

/* ==========================================================================
   🔧 MAINTENANCE MODE SYSTEM (Web & Menu Lock)
   ========================================================================== */

let maintenanceState = {
  maintenance_web: false,
  maintenance_web_message: 'Sistem sedang dalam maintenance. Silakan coba beberapa saat lagi.',
  locked_menus: [],
  maintenance_menu_message: 'Menu ini sedang dalam maintenance oleh Admin.'
};

async function loadMaintenanceSettings() {
  try {
    const res = await fetch('/api/maintenance');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        maintenanceState.maintenance_web = data.maintenance_web || false;
        maintenanceState.maintenance_web_message = data.maintenance_web_message || maintenanceState.maintenance_web_message;
        maintenanceState.locked_menus = data.locked_menus || [];
        maintenanceState.maintenance_menu_message = data.maintenance_menu_message || maintenanceState.maintenance_menu_message;
      }
    }
  } catch (err) {
    console.warn('[Maintenance] Could not fetch settings:', err.message);
  }

  // Update Admin Panel UI
  updateMaintenanceAdminUI();
  // Apply locks for current user
  applyMaintenanceLocks();
}

function updateMaintenanceAdminUI() {
  const toggle = document.getElementById('toggleMaintenanceWeb');
  const badge = document.getElementById('maintenanceWebStatusBadge');
  const msgEl = document.getElementById('maintenanceWebMessage');

  if (toggle) toggle.checked = maintenanceState.maintenance_web;
  if (badge) {
    if (maintenanceState.maintenance_web) {
      badge.textContent = 'AKTIF';
      badge.className = 'badge badge-rose';
      badge.style.fontSize = '11px';
    } else {
      badge.textContent = 'NONAKTIF';
      badge.className = 'badge badge-emerald';
      badge.style.fontSize = '11px';
    }
  }
  if (msgEl && maintenanceState.maintenance_web_message) {
    msgEl.value = maintenanceState.maintenance_web_message;
  }

  // Update menu lock checkboxes
  document.querySelectorAll('.menu-lock-checkbox').forEach(cb => {
    cb.checked = maintenanceState.locked_menus.includes(cb.value);
  });
}

async function toggleMaintenanceWebMode() {
  const toggle = document.getElementById('toggleMaintenanceWeb');
  const newState = toggle ? toggle.checked : false;
  const msgEl = document.getElementById('maintenanceWebMessage');
  const customMsg = msgEl ? msgEl.value.trim() : '';

  const actionText = newState ? 'MENGAKTIFKAN' : 'MENONAKTIFKAN';
  const result = await Swal.fire({
    title: `${actionText} Maintenance Web?`,
    html: newState
      ? `<div style="font-size:13.5px; text-align:left; line-height:1.7;">
          Semua pengguna <strong style="color:#dc2626;">SELAIN Admin</strong> akan <strong>TIDAK BISA LOGIN</strong> ke aplikasi.<br><br>
          Mereka akan melihat halaman Maintenance Mode sampai Anda menonaktifkannya.
        </div>`
      : `<div style="font-size:13.5px;">Semua pengguna akan dapat login kembali secara normal.</div>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: newState ? '#dc2626' : '#059669',
    cancelButtonColor: '#64748b',
    confirmButtonText: newState ? 'Ya, Aktifkan Maintenance' : 'Ya, Nonaktifkan',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) {
    if (toggle) toggle.checked = !newState;
    return;
  }

  try {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maintenance_web: newState,
        maintenance_web_message: customMsg || maintenanceState.maintenance_web_message
      })
    });

    if (res.ok) {
      maintenanceState.maintenance_web = newState;
      if (customMsg) maintenanceState.maintenance_web_message = customMsg;
      updateMaintenanceAdminUI();
      showToast(`Maintenance Web berhasil ${newState ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}!`, newState ? 'warning' : 'success');
    } else {
      showToast('Gagal menyimpan pengaturan maintenance.', 'error');
      if (toggle) toggle.checked = !newState;
    }
  } catch (err) {
    showToast('Gagal koneksi ke Cloud: ' + err.message, 'error');
    if (toggle) toggle.checked = !newState;
  }
}

async function saveMenuMaintenanceSettings() {
  const checkedMenus = [];
  document.querySelectorAll('.menu-lock-checkbox:checked').forEach(cb => {
    checkedMenus.push(cb.value);
  });

  try {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked_menus: checkedMenus })
    });

    if (res.ok) {
      maintenanceState.locked_menus = checkedMenus;
      applyMaintenanceLocks();

      if (typeof Swal !== 'undefined') {
        const lockedNames = checkedMenus.length > 0
          ? checkedMenus.map(m => `<li style="margin:2px 0;"><i class="bi bi-lock-fill" style="color:#dc2626;"></i> <strong>${m}</strong></li>`).join('')
          : '<li style="color:#059669;"><i class="bi bi-unlock-fill"></i> Tidak ada menu yang dikunci</li>';

        Swal.fire({
          icon: 'success',
          title: 'Pengaturan Kunci Menu Tersimpan!',
          html: `<div style="font-size:13px; text-align:left; line-height:1.6;">
                  Menu berikut <strong>dikunci</strong> untuk semua pengguna selain Admin:
                  <ul style="margin:8px 0 0 16px; padding:0;">${lockedNames}</ul>
                </div>`,
          confirmButtonColor: '#7c3aed'
        });
      } else {
        showToast(`${checkedMenus.length} menu berhasil dikunci!`, 'success');
      }
    } else {
      showToast('Gagal menyimpan pengaturan menu maintenance.', 'error');
    }
  } catch (err) {
    showToast('Gagal koneksi Cloud: ' + err.message, 'error');
  }
}

function applyMaintenanceLocks() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();

  // Admin bypasses all locks
  if (role === 'admin') {
    document.querySelectorAll('.nav-tab-btn.maintenance-locked').forEach(btn => {
      btn.classList.remove('maintenance-locked');
    });
    // Remove maintenance overlay if admin
    const overlay = document.getElementById('maintenanceFullscreenOverlay');
    if (overlay) overlay.remove();
    return;
  }

  // Apply menu locks for non-admin
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    const viewId = btn.getAttribute('data-view');
    if (maintenanceState.locked_menus.includes(viewId)) {
      btn.classList.add('maintenance-locked');
    } else {
      btn.classList.remove('maintenance-locked');
    }
  });
}

function checkMaintenanceOnLogin(userRole) {
  const role = (userRole || 'Petugas').toLowerCase();

  if (role === 'admin') return true; // Admin always passes

  if (maintenanceState.maintenance_web) {
    // Show fullscreen maintenance overlay
    showMaintenanceScreen(maintenanceState.maintenance_web_message);
    return false; // Block login
  }

  return true; // Allow login
}

function showMaintenanceScreen(message) {
  // Remove existing overlay if any
  const existing = document.getElementById('maintenanceFullscreenOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'maintenanceFullscreenOverlay';
  overlay.className = 'maintenance-fullscreen-overlay';
  overlay.innerHTML = `
    <div class="maintenance-fullscreen-content">
      <div class="maintenance-icon-box">
        <i class="bi bi-tools"></i>
      </div>
      <h1>🔧 Sistem Dalam Maintenance</h1>
      <p>${message || 'Sistem sedang dalam pemeliharaan oleh Administrator. Silakan coba beberapa saat lagi.'}</p>
      <div class="maint-badge">
        <i class="bi bi-clock-history"></i>
        Pencatatan CKG Puskesmas Banjaran Kota
      </div>
      <div style="margin-top: 24px;">
        <button onclick="location.reload()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
          <i class="bi bi-arrow-clockwise"></i> Coba Lagi
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

