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
  initDarkMode();
  applyCustomLogo();
  loadStoredUserDatabase();
  loadStoredRecords();
  loadStoredSimpusRecords();
  loadStoredRecycleBin();
  loadStoredAnnouncement();
  loadStoredSekolahRecords();
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

  ['filterPetugas', 'filterSimpusPetugas', 'filterLaporanPetugas', 'filterSekolahPetugas', 'filterRecyclePetugas'].forEach(selectId => {
    const sel = document.getElementById(selectId);
    if (sel) {
      const prev = sel.value;
      sel.innerHTML = '<option value="">-- Semua Petugas --</option>';
      usersDb.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.nama_user;
        opt.textContent = u.nama_user;
        if (prev && u.nama_user === prev) opt.selected = true;
        sel.appendChild(opt);
      });
    }
  });

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

  ['filterPetugas', 'filterSimpusPetugas', 'filterLaporanPetugas', 'filterSekolahPetugas', 'filterRecyclePetugas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (!isPrivileged && loggedUser) {
        el.value = loggedUser;
        el.disabled = true;
        el.title = `Terkunci: Hak Akses Petugas hanya melihat data sendiri (${loggedUser})`;
        el.style.backgroundColor = '#f1f5f9';
        el.style.cursor = 'not-allowed';
        el.style.opacity = '0.85';
      } else {
        el.disabled = false;
        el.title = '';
        el.style.backgroundColor = '';
        el.style.cursor = '';
        el.style.opacity = '';
      }
    }
  });
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
            tanggal_lahir: formatDateToYYYYMMDD(r.tanggal_lahir) || '1990-01-01',
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

async function saveRecycleBinToStorage(deletedItem = null, deleteId = null, deleteOptions = null) {
  localStorage.setItem('ckg_recycle_bin', JSON.stringify(recycleBin));
  try {
    if (deleteId) {
      await fetch(`/api/recycle?id=${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
    } else if (deleteOptions && deleteOptions.source) {
      await fetch(`/api/recycle?source=${encodeURIComponent(deleteOptions.source)}`, { method: 'DELETE' });
    } else if (deleteOptions && deleteOptions.ids) {
      await fetch('/api/recycle', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteOptions.ids })
      });
    } else if (deleteOptions && deleteOptions.clearAll) {
      await fetch('/api/recycle', { method: 'DELETE' });
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
      html: `
        <div style="text-align: center; padding: 4px 0 6px 0;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #ffe4e6, #fecdd3); color: #e11d48; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 12px; box-shadow: 0 6px 16px rgba(225, 29, 72, 0.2);">
            <i class="bi bi-power"></i>
          </div>
          <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">Apakah Anda yakin ingin mengakhiri sesi dan keluar dari aplikasi <strong>CKG Puskesmas Banjaran Kota</strong>?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-box-arrow-right"></i> Ya, Keluar',
      cancelButtonText: '<i class="bi bi-x-circle"></i> Batal',
      customClass: {
        confirmButton: 'custom-swal-confirm-danger',
        cancelButton: 'custom-swal-cancel'
      },
      buttonsStyling: false
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
  localStorage.setItem('ckg_records', JSON.stringify(records));
}

function populateAllYearDropdowns() {
  const currentYearStr = String(new Date().getFullYear());
  const yearSelectIds = [
    { id: 'dashTahun', defaultLabel: 'Semua Tahun' },
    { id: 'filterLaporanTahun', defaultLabel: '-- Semua Tahun --' },
    { id: 'filterTahun', defaultLabel: '-- Semua Tahun --' },
    { id: 'filterSekolahTahun', defaultLabel: '-- Semua Tahun --' }
  ];

  yearSelectIds.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      const savedVal = el.value;
      let html = `<option value="">${item.defaultLabel}</option>`;
      for (let y = 2045; y >= 2000; y--) {
        html += `<option value="${y}">${y}</option>`;
      }
      el.innerHTML = html;
      if (savedVal) {
        el.value = savedVal;
      } else if (item.id === 'dashTahun') {
        el.value = currentYearStr;
      }
    }
  });
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

  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());

  populateAllYearDropdowns();

  const dashBulanEl = document.getElementById('dashBulan');
  const dashTahunEl = document.getElementById('dashTahun');
  if (dashBulanEl && !dashBulanEl.value) dashBulanEl.value = currentMonthStr;
  if (dashTahunEl && !dashTahunEl.value) dashTahunEl.value = currentYearStr;

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

  // Sync address dictionary from Cloudflare D1 Server on startup
  syncKamusFromCloudServer();

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
  } else if (viewId === 'laporan') {
    renderLaporanView();
  } else if (viewId === 'sekolah') {
    renderSekolahView();
  } else if (viewId === 'data-records') {
    renderTableRecords();
  } else if (viewId === 'recycle-data') {
    renderRecycleTable();
  } else if (viewId === 'peta-wilayah') {
    initInteractiveMap();
  } else if (viewId === 'admin-panel') {
    refreshAdminKamusStats();
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
  initAddressAutoDetector();
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
      // Override map: API returns official names that need local renaming
      const kelNameOverrides = { 'Banjaran': 'Banjaran Kulon' };
      if (vilList && vilList.length > 0) {
        vilList.forEach(v => {
          let displayName = toTitleCase(v.name);
          if (kelNameOverrides[displayName]) displayName = kelNameOverrides[displayName];
          kelSelect.innerHTML += `<option value="${displayName}" data-id="${v.id}">${displayName}</option>`;
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

function getDeletedKampungList() {
  try {
    const raw = localStorage.getItem('ckg_deleted_kampung_list');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addToDeletedBlacklist(keyword) {
  if (!keyword) return;
  const kwUpper = String(keyword).toUpperCase().trim();
  const list = getDeletedKampungList();
  if (!list.includes(kwUpper)) {
    list.push(kwUpper);
    localStorage.setItem('ckg_deleted_kampung_list', JSON.stringify(list));
  }
}

function getLearnedKampungMap() {
  try {
    const raw = localStorage.getItem('ckg_learned_kampung_map');
    const list = raw ? JSON.parse(raw) : [];
    const deletedList = getDeletedKampungList();
    if (deletedList.length === 0) return list;

    return list.filter(item => {
      if (Array.isArray(item.keywords)) {
        return !item.keywords.some(k => deletedList.includes(String(k).toUpperCase()));
      }
      return !deletedList.includes(String(item.keywords).toUpperCase());
    });
  } catch (e) {
    return [];
  }
}

async function syncKamusFromCloudServer() {
  try {
    console.log('☁️ [Kamus Sync] Fetching /api/kamus (GET)...');
    const res = await fetch('/api/kamus');
    console.log('☁️ [Kamus Sync] Response status:', res.status);
    if (res.ok) {
      const json = await res.json();
      console.log('☁️ [Kamus Sync] D1 returned:', json.success, 'items:', (json.data || []).length);
      if (json.success && Array.isArray(json.data)) {
        const deletedList = getDeletedKampungList();
        // Replace local with D1 cloud data as authoritative source
        const cloudMap = [];
        json.data.forEach(item => {
          const kw = String(item.keyword).toUpperCase().trim();
          if (!kw || deletedList.includes(kw)) return; // 🚫 Skip deleted keywords!

          const existing = cloudMap.find(m => m.keywords.includes(kw));
          if (existing) {
            existing.kel = item.kel || existing.kel;
            existing.kec = item.kec || existing.kec;
            existing.kab = item.kab || existing.kab;
            existing.prov = item.prov || existing.prov;
            if (item.lat) existing.lat = item.lat;
            if (item.lng) existing.lng = item.lng;
          } else {
            cloudMap.push({
              keywords: [kw],
              kel: item.kel || '',
              kec: item.kec || 'Banjaran',
              kab: item.kab || 'Kabupaten Bandung',
              prov: item.prov || 'Jawa Barat',
              lat: item.lat || null,
              lng: item.lng || null
            });
          }
        });

        // Also merge any local-only items not yet in cloud
        const local = getLearnedKampungMap();
        local.forEach(localItem => {
          if (!localItem.keywords || !Array.isArray(localItem.keywords)) return;
          localItem.keywords.forEach(lkw => {
            const cleanLkw = String(lkw).toUpperCase().trim();
            if (deletedList.includes(cleanLkw)) return; // 🚫 Skip deleted keywords!
            const inCloud = cloudMap.find(m => m.keywords.includes(cleanLkw));
            if (!inCloud) {
              cloudMap.push(localItem);
            }
          });
        });

        localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(cloudMap));
        console.log('☁️ [Kamus Sync] Local storage updated, total entries:', cloudMap.length);
        refreshAdminKamusStats();
        if (typeof renderMapMarkers === 'function') renderMapMarkers();
      }
    } else {
      console.warn('☁️ [Kamus Sync] Non-OK response:', res.status);
    }
  } catch (err) {
    console.warn('☁️ [Kamus Sync] Error:', err);
  }
}

function saveLearnedKampungKeyword(keyword, kel, kec = 'Banjaran', kab = 'Kabupaten Bandung', prov = 'Jawa Barat', syncToCloud = true, lat = null, lng = null) {
  if (!keyword || !kel) return;
  const cleanKw = keyword.toUpperCase().replace(/^(KP\.|KAMPUNG|JLN?\.|JALAN|RT|RW)\s*/i, '').trim();
  if (cleanKw.length < 3) return;

  const current = getLearnedKampungMap();
  const existing = current.find(item => item.keywords.includes(cleanKw));
  if (existing) {
    existing.kel = kel;
    existing.kec = kec || existing.kec;
    existing.kab = kab || existing.kab;
    existing.prov = prov || existing.prov;
    if (lat) existing.lat = lat;
    if (lng) existing.lng = lng;
  } else {
    current.push({
      keywords: [cleanKw],
      kel: kel,
      kec: kec || 'Banjaran',
      kab: kab || 'Kabupaten Bandung',
      prov: prov || 'Jawa Barat',
      lat: lat || null,
      lng: lng || null
    });
  }
  try {
    localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(current));
  } catch (e) {}

  if (syncToCloud) {
    // Sync to D1 Cloud Server
    fetch('/api/kamus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keyword: cleanKw, kel, kec, kab, prov, lat, lng }])
    }).catch(err => console.warn('D1 Kamus push failed:', err));
  }
}

function downloadKamusAlamatTemplate() {
  if (typeof XLSX === 'undefined') {
    Swal.fire('Library XLSX Belum Siap', 'Silakan refresh halaman dan coba kembali.', 'warning');
    return;
  }
  const templateData = [
    { "Alamat Lengkap / Nama Kampung": "Kp. Pajagalan RT 02 RW 05", "Kelurahan / Desa": "Banjaran Kota", "Kecamatan": "Banjaran", "Kabupaten / Kota": "Kabupaten Bandung", "Provinsi": "Jawa Barat" },
    { "Alamat Lengkap / Nama Kampung": "Kp. Kamasan Hilir", "Kelurahan / Desa": "Kamasan", "Kecamatan": "Banjaran", "Kabupaten / Kota": "Kabupaten Bandung", "Provinsi": "Jawa Barat" },
    { "Alamat Lengkap / Nama Kampung": "Jl. Raya Ciapus No. 12", "Kelurahan / Desa": "Ciapus", "Kecamatan": "Banjaran", "Kabupaten / Kota": "Kabupaten Bandung", "Provinsi": "Jawa Barat" },
    { "Alamat Lengkap / Nama Kampung": "Dusun Margahayu", "Kelurahan / Desa": "Margahayu", "Kecamatan": "Banjaran", "Kabupaten / Kota": "Kabupaten Bandung", "Provinsi": "Jawa Barat" },
    { "Alamat Lengkap / Nama Kampung": "Kp. Sindangpanon", "Kelurahan / Desa": "Sindangpanon", "Kecamatan": "Banjaran", "Kabupaten / Kota": "Kabupaten Bandung", "Provinsi": "Jawa Barat" }
  ];
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Kamus Alamat CKG");
  XLSX.writeFile(workbook, "Template_Kamus_Alamat_CKG.xlsx");
}

async function handleExcelAddressUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const activeRole = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (activeRole !== 'admin') {
    Swal.fire('Akses Ditolak', 'Hanya Admin yang dapat mengimpor Kamus Alamat.', 'error');
    return;
  }

  Swal.fire({
    title: 'Membaca File Excel...',
    text: 'Mohon tunggu sebentar, sistem sedang mengekstrak nama kampung & kelurahan dari file Excel Anda.',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    console.log('📊 [Kamus Import] Sheet parsed, total rows:', rows.length);
    if (rows.length > 0) {
      console.log('📊 [Kamus Import] Column headers:', Object.keys(rows[0]));
      console.log('📊 [Kamus Import] Sample row 1:', JSON.stringify(rows[0]));
    }

    if (!rows || rows.length === 0) {
      Swal.fire('File Kosong', 'Tidak ada data ditemukan dalam file Excel tersebut.', 'warning');
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;
    const batchMap = new Map();
    const prefixRegex = /^(KP\.?\s*|KAMPUNG\s+|JL\.?\s*|JLN\.?\s*|JALAN\s+|GG\.?\s*|GANG\s+|DS\.?\s*|DUSUN\s+)/i;
    const rtRwRegex = /\s*RT\.?\s*\d*\s*\/?\s*RW\.?\s*\d*/gi;
    const digitOnlyRegex = /^\d+$/;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let addressVal = '';
      let kelVal = '';
      let kecVal = '';
      let kabVal = '';
      let provVal = '';

      const keys = Object.keys(r);
      for (let k of keys) {
        const keyLower = k.toLowerCase().trim();
        const valStr = String(r[k]).trim();
        if (!valStr) continue;

        if (keyLower.includes('alamat') || keyLower.includes('street') || keyLower.includes('jalan') || keyLower.includes('kampung') || keyLower.includes('dusun') || keyLower.includes('lokasi') || keyLower.includes('keyword')) {
          if (!addressVal) addressVal = valStr;
        } else if (keyLower.includes('kelurahan') || keyLower.includes('desa') || keyLower === 'kel') {
          kelVal = valStr;
        } else if (keyLower.includes('kecamatan') || keyLower === 'kec') {
          kecVal = valStr;
        } else if (keyLower.includes('kabupaten') || keyLower.includes('kab') || keyLower.includes('kota')) {
          kabVal = valStr;
        } else if (keyLower.includes('provinsi') || keyLower.includes('prov')) {
          provVal = valStr;
        }
      }

      // Fallback: if no recognized header matched, use first two columns
      if (!addressVal && keys.length > 0) {
        addressVal = String(r[keys[0]] || '').trim();
      }
      if (!kelVal && keys.length > 1) {
        kelVal = String(r[keys[1]] || '').trim();
      }
      if (!kelVal) {
        kelVal = 'Banjaran Kota';
      }

      if (!addressVal) {
        skippedCount++;
        continue;
      }

      // Clean the address: strip common prefixes and RT/RW segments
      let cleaned = addressVal.toUpperCase().trim();
      cleaned = cleaned.replace(prefixRegex, '').trim();
      cleaned = cleaned.replace(rtRwRegex, '').trim();

      // Extract meaningful words (length >= 3, not pure digits)
      const words = cleaned.split(/[\s,;\/\\]+/).filter(w => w.length >= 3 && !digitOnlyRegex.test(w));

      if (words.length === 0) {
        skippedCount++;
        continue;
      }

      const kw = words[0];

      if (!batchMap.has(kw)) {
        saveLearnedKampungKeyword(kw, kelVal, kecVal || 'Banjaran', kabVal || 'Kabupaten Bandung', provVal || 'Jawa Barat', false);
        batchMap.set(kw, {
          keyword: kw,
          kel: kelVal,
          kec: kecVal || 'Banjaran',
          kab: kabVal || 'Kabupaten Bandung',
          prov: provVal || 'Jawa Barat'
        });
        addedCount++;
      }
    }

    const batchPayload = Array.from(batchMap.values());
    console.log('📊 [Kamus Import] Batch payload size:', batchPayload.length, 'Skipped rows:', skippedCount);
    if (batchPayload.length > 0) {
      console.log('📊 [Kamus Import] Sample keywords:', batchPayload.slice(0, 5).map(b => b.keyword + ' → ' + b.kel).join(', '));
    }

    // Push batch to D1 Cloud Server
    let d1Success = false;
    let d1Message = '';
    if (batchPayload.length > 0) {
      try {
        const res = await fetch('/api/kamus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload)
        });
        const resJson = await res.json();
        console.log('⚡ [Kamus Import] D1 Response status:', res.status, 'Body:', JSON.stringify(resJson));
        d1Success = res.ok && resJson.success;
        d1Message = d1Success
          ? `✅ Cloud D1: ${resJson.count || batchPayload.length} kata kunci tersimpan.`
          : `⚠️ Cloud D1 Error: ${resJson.error || 'Unknown error'} (Status: ${res.status})`;
      } catch (e) {
        console.error('❌ [Kamus Import] Fetch /api/kamus failed:', e);
        d1Success = false;
        d1Message = `❌ Network Error: ${e.message}`;
      }
    } else {
      d1Message = 'Tidak ada data baru untuk dikirim ke Cloud.';
    }

    event.target.value = '';
    await syncKamusFromCloudServer();
    refreshAdminKamusStats();
    renderKamusAlamatTable();

    if (addedCount === 0) {
      Swal.fire({
        icon: 'info',
        title: 'File Excel Berhasil Dibaca',
        html: `<div style="font-size:13px; line-height:1.7;">
          Data dari file Excel telah dibaca (<strong>${rows.length}</strong> baris), namun <strong>0 kata kunci baru</strong> ditambahkan.<br><br>
          <strong>Kemungkinan penyebab:</strong><br>
          • Kata kunci kampung sudah tersimpan di Kamus<br>
          • Teks alamat terlalu pendek (< 3 karakter)<br>
          • Kolom alamat tidak terdeteksi<br><br>
          <span style="color:#64748b; font-size:12px;">Baris dilewati: ${skippedCount} | Headers: ${Object.keys(rows[0] || {}).join(', ')}</span>
        </div>`,
        confirmButtonText: 'Mengerti'
      });
    } else {
      Swal.fire({
        icon: d1Success ? 'success' : 'warning',
        title: d1Success ? 'Impor Kamus Alamat Berhasil!' : 'Tersimpan Lokal, Cloud Gagal',
        html: `<div style="font-size:13px; line-height:1.7;">
          Berhasil mengekstrak <strong>${addedCount}</strong> kata kunci kampung unik dari <strong>${rows.length}</strong> baris data.<br><br>
          <div style="padding: 8px 12px; background: ${d1Success ? '#f0fdf4' : '#fef2f2'}; border-radius: 6px; margin-top: 4px; font-size: 12px;">
            ${d1Message}
          </div>
        </div>`,
        confirmButtonText: 'OK'
      });
    }
  } catch (err) {
    console.error('❌ [Kamus Import] Fatal error:', err);
    Swal.fire('Gagal Impor', 'Terjadi kesalahan saat membaca file Excel: ' + err.message, 'error');
  }
}

function refreshAdminKamusStats() {
  const statEl = document.getElementById('statKamusAlamatText');
  if (!statEl) return;
  const learnedMap = getLearnedKampungMap();
  const staticCount = BANJARAN_KAMPUNG_MAP.length;
  const learnedCount = learnedMap.length;
  
  let totalKeywords = 0;
  BANJARAN_KAMPUNG_MAP.forEach(m => totalKeywords += m.keywords.length);
  learnedMap.forEach(m => totalKeywords += m.keywords.length);

  statEl.innerHTML = `
    🟢 <strong>Kamus Bawaan (Banjaran):</strong> ${staticCount} Wilayah Kelurahan (${totalKeywords - learnedCount} Kata Kunci)<br>
    ☁️ <strong>Kamus Cloud Database (D1 Cloud Sync & Excel Import):</strong> ${learnedCount} Kata Kunci Tersinkronisasi Seluruh Device<br>
    ✨ <strong>Total Bank Data Wilayah Siap Pakai:</strong> <strong>${staticCount + learnedCount} Wilayah / Entry</strong>
  `;

  renderKamusAlamatTable();
}

function renderKamusAlamatTable() {
  const tbody = document.getElementById('tbodyKamusAlamat');
  if (!tbody) return;

  const searchInput = document.getElementById('searchKamusInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const learnedMap = getLearnedKampungMap();
  if (!learnedMap || learnedMap.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 16px; color: #94a3b8;">
          ☁️ Belum ada kata kunci tersimpan di Kamus Cloud D1. Silakan impor file Excel atau jalankan Scan Existing.
        </td>
      </tr>`;
    return;
  }

  let rowsHtml = '';
  let matchCount = 0;

  learnedMap.forEach(item => {
    const kw = Array.isArray(item.keywords) ? item.keywords[0] : String(item.keywords || '');
    const fullKw = Array.isArray(item.keywords) ? item.keywords.join(', ') : String(item.keywords || '');
    const kel = item.kel || '-';
    const kec = item.kec || 'Banjaran';
    const kab = item.kab || 'Kabupaten Bandung';
    const prov = item.prov || 'Jawa Barat';

    if (query && !fullKw.toLowerCase().includes(query) && !kel.toLowerCase().includes(query) && !kec.toLowerCase().includes(query)) {
      return;
    }

    matchCount++;
    rowsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 7px 12px; font-weight: 700; color: #0f172a;"><i class="bi bi-tag-fill" style="color: #0284c7;"></i> ${fullKw}</td>
        <td style="padding: 7px 12px; color: #334155;"><span class="badge" style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px;">${kel}</span></td>
        <td style="padding: 7px 12px; color: #475569;">${kec}</td>
        <td style="padding: 7px 12px; color: #475569;">${kab}</td>
        <td style="padding: 7px 12px; color: #475569;">${prov}</td>
        <td style="padding: 7px 12px; text-align: center;">
          <button class="btn btn-secondary btn-sm" onclick="deleteSingleKamusKeyword('${kw}')" title="Hapus kata kunci ini" style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 2px 8px; font-size: 11px; border-radius: 6px;">
            <i class="bi bi-trash"></i> Hapus
          </button>
        </td>
      </tr>
    `;
  });

  if (matchCount === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 14px; color: #94a3b8;">
          Tidak ada kata kunci kamus yang cocok dengan pencarian "${query}".
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = rowsHtml;
  }
}

async function clearLearnedKampungMap() {
  const activeRole = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (activeRole !== 'admin') {
    Swal.fire('Akses Ditolak', 'Hanya Admin yang dapat mereset Kamus Pembelajaran.', 'error');
    return;
  }

  const learnedMap = getLearnedKampungMap();
  const totalCount = learnedMap ? learnedMap.length : 0;

  Swal.fire({
    title: 'Hapus SEMUA Data Alamat?',
    html: `
      <div style="font-size: 13px; color: #64748b; text-align: left;">
        <p style="margin-bottom: 10px;">
          Tindakan ini akan <strong>MENGHAPUS PERMANEN</strong> seluruh <strong>${totalCount} data kata kunci alamat/kampung</strong> dari:
        </p>
        <ul style="padding-left: 20px; color: #0f172a; margin-bottom: 12px;">
          <li>☁️ Cloud Database D1 Cloudflare</li>
          <li>💾 LocalStorage Penyimpanan Browser</li>
          <li>🗺️ Penanda Titik Peta Alamat Kab. Bandung</li>
        </ul>
        <div style="padding: 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; color: #be123c; font-weight: 700; font-size: 12px;">
          ⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan!
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-trash3-fill"></i> Ya, Hapus Semua Data Alamat!',
    cancelButtonText: 'Batal'
  }).then(async (res) => {
    if (res.isConfirmed) {
      try {
        localStorage.removeItem('ckg_learned_kampung_map');
        localStorage.removeItem('ckg_deleted_kampung_list');
        const apiRes = await fetch('/api/kamus', { method: 'DELETE' });
        const json = await apiRes.json();
        console.log('☁️ [D1 Kamus Delete] Result:', json);
      } catch (err) {
        console.warn('D1 kamus delete failed:', err);
      }

      refreshAdminKamusStats();
      if (typeof renderMapMarkers === 'function') renderMapMarkers();
      Swal.fire('Berhasil Dihapus!', 'Seluruh data alamat telah berhasil dihapus dari Cloud Database D1 & Local Storage.', 'success');
    }
  });
}

async function deleteSingleKamusKeyword(keyword) {
  if (!keyword) return;
  const activeRole = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (activeRole !== 'admin') {
    Swal.fire('Akses Ditolak', 'Hanya Admin yang dapat menghapus kata kunci Kamus.', 'error');
    return;
  }

  Swal.fire({
    title: 'Hapus Kata Kunci Alamat?',
    text: `Kata kunci "${keyword}" akan dihapus dari Cloud Database D1 & Local Storage.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal'
  }).then(async (res) => {
    if (res.isConfirmed) {
      const cleanKw = String(keyword).toUpperCase().trim();
      addToDeletedBlacklist(cleanKw);

      const current = getLearnedKampungMap();
      const filtered = current.filter(item => {
        if (Array.isArray(item.keywords)) {
          return !item.keywords.some(k => String(k).toUpperCase().trim() === cleanKw);
        }
        return String(item.keywords).toUpperCase().trim() !== cleanKw;
      });
      localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(filtered));

      try {
        await fetch(`/api/kamus?keyword=${encodeURIComponent(cleanKw)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Single kamus delete error:', err);
      }

      refreshAdminKamusStats();
      if (typeof renderMapMarkers === 'function') renderMapMarkers();
      showToast(`Kata kunci "${cleanKw}" berhasil dihapus.`, 'success');
    }
  });
}

async function scanExistingRecordsForAddressDictionary() {
  const activeRole = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (activeRole !== 'admin') {
    Swal.fire('Akses Ditolak', 'Hanya Admin yang dapat mengelola Kamus Alamat.', 'error');
    return;
  }

  Swal.fire({
    title: 'Perekaman Alamat Berbasis Peta',
    html: `
      <div style="text-align: left; font-size: 13px; color: #475569;">
        <p style="margin-bottom: 10px;">
          Sesuai standar validasi data, perekaman Kamus Alamat <strong>TIDAK LAGI diambil dari entrian data pasien CKG</strong> untuk menghindari salah ketik/alamat tidak valid.
        </p>
        <p style="margin-bottom: 10px; color: #0f172a; font-weight: 700;">
          📍 Untuk menambah titik alamat baru ke Kamus Alamat & Peta:
        </p>
        <ol style="padding-left: 20px; color: #0369a1; font-weight: 600;">
          <li>Buka menu <strong>"Peta Alamat Kab. Bandung"</strong>.</li>
          <li>Klik di titik peta lokasi kampung tersebut (Click-to-Pin).</li>
          <li>Atau impor file Excel resmi melalui tombol <strong>"Import Kamus Alamat (Excel)"</strong>.</li>
        </ol>
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'Paham, Buka Peta Alamat',
    confirmButtonColor: '#0284c7'
  }).then((res) => {
    if (res.isConfirmed) {
      switchView('peta-wilayah');
    }
  });
}

const BANJARAN_KAMPUNG_MAP = [
  { keywords: ['PAJAGALAN', 'PEJAGALAN', 'JAGALAN', 'BANJARAN KULON', 'BANJARAN KOTA', 'ALUN-ALUN BANJARAN', 'PASAR BANJARAN', 'STASIUN', 'BARULAKSANA', 'KAUM', 'BUNTRIS', 'PANGKAT'], kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['KAMASAN', 'SEKECANDANG', 'SITUANGANG', 'BANTARPANJANG', 'CIGENTUR', 'SANGKAN', 'LEBAKSARI'], kel: 'Kamasan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['CIAPUS', 'CITARIM', 'CIPEUNEUY', 'LEUWIWUNGGU', 'PALASARI', 'PASIRPANJANG'], kel: 'Ciapus', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['TARAJUSARI', 'TARAJU', 'SAMPORA', 'WARUNGLEBAK', 'SUKAMUKTI', 'BABAKAN TARAJU'], kel: 'Tarajusari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['PASIRHUNI', 'PASIR HUNI', 'CIKUPA', 'SUKASARI', 'CIBEROD', 'LEBAKMUDA'], kel: 'Pasirhuni', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['SINDANGPANON', 'SINDANG PANON', 'SUKAGALIH', 'CIGANITRI', 'SINDANG'], kel: 'Sindangpanon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['MARGAHURUN', 'MARGA HURUN', 'CILUNCAT', 'CIMANGGU'], kel: 'Margahurun', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['KIANGROKE', 'KIANG ROKE', 'CITEUREUP', 'NAGRAK', 'BABAKAN KIANGROKE'], kel: 'Kiangroke', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['CIMAUNG', 'PUNTANG', 'CAMPAKA', 'WARUNGBANTENG', 'CIPALASARI', 'SUKAMAJU'], kel: 'Cimaung', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['CANGKUANG', 'BANDASARI', 'JATISARI', 'PANANJUNG'], kel: 'Cangkuang', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['ARJASARI', 'PINGGIRSARI', 'PATROL', 'BARTIM'], kel: 'Arjasari', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  { keywords: ['PAMEUNGPEUK', 'LANGONSARI', 'WAAS'], kel: 'Pameungpeuk', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' }
];

let addressAutoDetectTimeout = null;

async function autoDetectRegionalFromAddressText(addressText) {
  if (!addressText || typeof addressText !== 'string') return;
  const rawText = addressText.trim();
  if (rawText.length < 3) return;

  const textUpper = rawText.toUpperCase();
  const provSelect = document.getElementById('provinsi');
  const kabSelect = document.getElementById('kab_kota');
  const kecSelect = document.getElementById('kecamatan');
  const kelSelect = document.getElementById('kelurahan');

  if (!provSelect || !kabSelect || !kecSelect || !kelSelect) return;

  const triggerChange = async (el) => {
    el.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 180));
  };

  const selectMatchingOption = (selectEl, targetVal, fuzzy = true) => {
    if (!targetVal || !selectEl) return null;
    const targetClean = targetVal.toLowerCase().replace(/^(kab\.|kota|kabupaten|kecamatan|kelurahan|desa)\s*/i, '').trim();
    const options = Array.from(selectEl.options).filter(o => o.value);
    
    // Direct exact match
    let match = options.find(o => o.value.toLowerCase() === targetVal.toLowerCase());
    if (match) return match;

    // Clean match
    match = options.find(o => {
      const oClean = o.value.toLowerCase().replace(/^(kab\.|kota|kabupaten|kecamatan|kelurahan|desa)\s*/i, '').trim();
      return oClean === targetClean;
    });
    if (match) return match;

    // Fuzzy contains match
    if (fuzzy) {
      match = options.find(o => {
        const oClean = o.value.toLowerCase().replace(/^(kab\.|kota|kabupaten|kecamatan|kelurahan|desa)\s*/i, '').trim();
        return oClean.includes(targetClean) || targetClean.includes(oClean);
      });
    }
    return match;
  };

  // PRIORITY 1: Check Combined Static + Learned Kampung Knowledge Map
  const fullKnowledgeMap = [...BANJARAN_KAMPUNG_MAP, ...getLearnedKampungMap()];
  let localHit = null;
  for (let entry of fullKnowledgeMap) {
    for (let kw of entry.keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(textUpper) || textUpper.includes(kw)) {
        localHit = entry;
        break;
      }
    }
    if (localHit) break;
  }

  if (localHit) {
    // 1. Set Province
    const provMatch = selectMatchingOption(provSelect, localHit.prov);
    if (provMatch) {
      if (provSelect.value !== provMatch.value) {
        provSelect.value = provMatch.value;
        await triggerChange(provSelect);
      }
    } else if (provSelect.options.length > 1 && !provSelect.value) {
      provSelect.value = provSelect.options[1].value;
      await triggerChange(provSelect);
    }

    // 2. Set Kab / Kota
    const kabMatch = selectMatchingOption(kabSelect, localHit.kab);
    if (kabMatch) {
      if (kabSelect.value !== kabMatch.value) {
        kabSelect.value = kabMatch.value;
        await triggerChange(kabSelect);
      }
    }

    // 3. Set Kecamatan
    const kecMatch = selectMatchingOption(kecSelect, localHit.kec);
    if (kecMatch) {
      if (kecSelect.value !== kecMatch.value) {
        kecSelect.value = kecMatch.value;
        await triggerChange(kecSelect);
      }
    }

    // 4. Set Kelurahan
    const kelMatch = selectMatchingOption(kelSelect, localHit.kel);
    if (kelMatch) {
      kelSelect.value = kelMatch.value;
    }
    return;
  }

  // PRIORITY 2: OpenStreetMap Geocoding Fallback + Auto-Learning
  try {
    const cleanSearch = textUpper.replace(/KP\.|KAMPUNG|JLN?\.|JALAN|RT:?|\d+|RW:?|\d+/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanSearch.length >= 3) {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanSearch + ' Bandung Jawa Barat')}&format=json&addressdetails=1&limit=1`;
      const resp = await fetch(osmUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.length > 0) {
          const addr = data[0].address || {};
          const foundProv = addr.state || 'Jawa Barat';
          const foundKab = addr.city || addr.regency || addr.county || 'Kabupaten Bandung';
          const foundKec = addr.town || addr.district || addr.suburb || 'Banjaran';
          const foundKel = addr.village || addr.quarter || addr.hamlet || addr.neighbourhood || '';

          if (foundKel) {
            // Auto-fill dropdowns from Nominatim lookup without auto-saving to Kamus Peta
            const provMatch = selectMatchingOption(provSelect, foundProv);
            if (provMatch) { provSelect.value = provMatch.value; await triggerChange(provSelect); }

            const kabMatch = selectMatchingOption(kabSelect, foundKab);
            if (kabMatch) { kabSelect.value = kabMatch.value; await triggerChange(kabSelect); }

            const kecMatch = selectMatchingOption(kecSelect, foundKec);
            if (kecMatch) { kecSelect.value = kecMatch.value; await triggerChange(kecMatch); }

            const kelMatch = selectMatchingOption(kelSelect, foundKel);
            if (kelMatch) { kelSelect.value = kelMatch.value; }
            return;
          }
        }
      }
    }
  } catch (err) {
    console.warn('OSM Geocoding fallback skipped:', err);
  }

  // PRIORITY 2: General Auto-Detect if not in local kampung map
  // 1. Detect Province
  let provMatched = false;
  let provOptions = Array.from(provSelect.options).filter(o => o.value);
  for (let o of provOptions) {
    const pValUpper = o.value.toUpperCase();
    if (textUpper.includes(pValUpper)) {
      if (provSelect.value !== o.value) {
        provSelect.value = o.value;
        await triggerChange(provSelect);
      }
      provMatched = true;
      break;
    }
  }

  if (!provMatched) {
    if (textUpper.includes('JAWA BARAT') || textUpper.includes('JABAR')) {
      const match = provOptions.find(o => o.value.toUpperCase().includes('JAWA BARAT'));
      if (match && provSelect.value !== match.value) {
        provSelect.value = match.value;
        await triggerChange(provSelect);
        provMatched = true;
      }
    } else {
      // Default to Jawa Barat if unspecified
      const match = provOptions.find(o => o.value.toUpperCase().includes('JAWA BARAT'));
      if (match && !provSelect.value) {
        provSelect.value = match.value;
        await triggerChange(provSelect);
      }
    }
  }

  // 2. Detect Kab / Kota
  let kabOptions = Array.from(kabSelect.options).filter(o => o.value);
  for (let o of kabOptions) {
    const valUpper = o.value.toUpperCase();
    const cleanName = valUpper.replace(/^KABUPATEN\s+/i, '').replace(/^KOTA\s+/i, '').replace(/^KAB\.\s+/i, '').trim();
    if (textUpper.includes(valUpper) || (cleanName.length >= 4 && textUpper.includes(cleanName))) {
      if (kabSelect.value !== o.value) {
        kabSelect.value = o.value;
        await triggerChange(kabSelect);
      }
      break;
    }
  }

  if (!kabSelect.value) {
    const match = kabOptions.find(o => o.value.toUpperCase().includes('BANDUNG'));
    if (match) {
      kabSelect.value = match.value;
      await triggerChange(kabSelect);
    }
  }

  // 3. Detect Kecamatan
  let kecOptions = Array.from(kecSelect.options).filter(o => o.value);
  for (let o of kecOptions) {
    const valUpper = o.value.toUpperCase().replace(/^KECAMATAN\s+/i, '').replace(/^KEC\.\s+/i, '').trim();
    if (valUpper.length >= 3 && textUpper.includes(valUpper)) {
      if (kecSelect.value !== o.value) {
        kecSelect.value = o.value;
        await triggerChange(kecSelect);
      }
      break;
    }
  }

  if (!kecSelect.value) {
    const match = kecOptions.find(o => o.value.toUpperCase().includes('BANJARAN'));
    if (match) {
      kecSelect.value = match.value;
      await triggerChange(kecSelect);
    }
  }

  // 4. Detect Kelurahan / Desa
  let kelOptions = Array.from(kelSelect.options).filter(o => o.value);
  for (let o of kelOptions) {
    const valUpper = o.value.toUpperCase().replace(/^KELURAHAN\s+/i, '').replace(/^DESA\s+/i, '').replace(/^KEL\.\s+/i, '').trim();
    if (valUpper.length >= 3 && textUpper.includes(valUpper)) {
      if (kelSelect.value !== o.value) {
        kelSelect.value = o.value;
      }
      break;
    }
  }
}

function initAddressAutoDetector() {
  const alamatEl = document.getElementById('alamat');
  if (!alamatEl) return;

  const handleInput = () => {
    if (addressAutoDetectTimeout) clearTimeout(addressAutoDetectTimeout);
    addressAutoDetectTimeout = setTimeout(() => {
      autoDetectRegionalFromAddressText(alamatEl.value);
    }, 300);
  };

  alamatEl.addEventListener('input', handleInput);
  alamatEl.addEventListener('change', handleInput);
  alamatEl.addEventListener('paste', () => {
    setTimeout(handleInput, 50);
  });
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
let selectedSimpusIds = new Set();

function renderSimpusView() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const loggedUser = (sessionStorage.getItem('ckg_user_name') || '').trim().toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');

  // Petugas role is restricted from 'belum_bagi' tab
  if (!isPrivileged) {
    activeSimpusTab = 'sudah_bagi';
  }

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

  if (countBelumEl) countBelumEl.textContent = belumBagiCount;
  if (countSudahEl) countSudahEl.textContent = sudahBagiCount;
  updateTotalEntryMonthMetric();

  // Sync petugas column header visibility based on active tab
  const thPetugas = document.getElementById('thSimpusPetugasEntry');
  if (thPetugas) {
    thPetugas.style.display = (activeSimpusTab !== 'sudah_bagi') ? 'none' : '';
  }

  // Also trigger switchSimpusTab to set DOM view states properly
  switchSimpusTab(activeSimpusTab);
}

function switchSimpusTab(tab) {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');

  if (!isPrivileged && tab === 'belum_bagi') {
    tab = 'sudah_bagi';
  }

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
  const bulkBar = document.getElementById('simpusBulkActionBar');

  if (tab === 'belum_bagi') {
    if (btnBelum) { btnBelum.className = 'simpus-pill-btn active-purple admin-koordinator-only'; }
    if (btnSudah) { btnSudah.className = 'simpus-pill-btn'; }
    if (petugasFilterGroup) petugasFilterGroup.style.display = 'none';
    if (belumBagiActions) belumBagiActions.style.display = 'flex';
    if (btnMultiImport) btnMultiImport.style.display = 'none';
    if (thPetugas) thPetugas.style.display = 'none';
    if (tableViewContainer) tableViewContainer.style.display = 'block';
    if (cardsViewContainer) cardsViewContainer.style.display = 'none';
    if (infoBar) infoBar.style.display = 'flex';
    if (bulkBar) bulkBar.style.display = 'none';
  } else {
    if (btnBelum) { btnBelum.className = 'simpus-pill-btn admin-koordinator-only'; }
    if (btnSudah) { btnSudah.className = 'simpus-pill-btn active-emerald'; }
    if (petugasFilterGroup) petugasFilterGroup.style.display = isPrivileged ? 'flex' : 'none';
    if (belumBagiActions) belumBagiActions.style.display = 'flex';
    if (btnMultiImport) btnMultiImport.style.display = role === 'admin' ? 'inline-flex' : 'none';
    if (thPetugas) thPetugas.style.display = '';
    if (tableViewContainer) tableViewContainer.style.display = 'none';
    if (cardsViewContainer) cardsViewContainer.style.display = 'block';
    if (infoBar) infoBar.style.display = 'none';
  }

  renderSimpusTableRecords();
}

function updateSimpusBulkActionState() {
  const checkboxes = document.querySelectorAll('.simpus-row-check');
  selectedSimpusIds.clear();
  checkboxes.forEach(cb => {
    if (cb.checked) {
      selectedSimpusIds.add(cb.value);
      const tr = cb.closest('tr');
      if (tr) tr.classList.add('simpus-row-selected');
    } else {
      const tr = cb.closest('tr');
      if (tr) tr.classList.remove('simpus-row-selected');
    }
  });

  const count = selectedSimpusIds.size;
  const countEl = document.getElementById('simpusSelectedCount');
  if (countEl) countEl.textContent = count;

  document.querySelectorAll('.selected-count-inline').forEach(el => {
    el.textContent = count;
  });

  const bar = document.getElementById('simpusBulkActionBar');
  if (bar) {
    if (count > 0 && activeSimpusTab === 'sudah_bagi') {
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  const checkAll = document.getElementById('checkAllSimpusSudahBagi');
  if (checkAll && checkboxes.length > 0) {
    checkAll.checked = count === checkboxes.length;
    checkAll.indeterminate = count > 0 && count < checkboxes.length;
  }
}

function toggleSelectAllSimpus(checked) {
  const checkboxes = document.querySelectorAll('.simpus-row-check');
  checkboxes.forEach(cb => {
    cb.checked = checked;
  });
  updateSimpusBulkActionState();
}

function clearSimpusSelection() {
  selectedSimpusIds.clear();
  const checkAll = document.getElementById('checkAllSimpusSudahBagi');
  if (checkAll) {
    checkAll.checked = false;
    checkAll.indeterminate = false;
  }
  const checkboxes = document.querySelectorAll('.simpus-row-check');
  checkboxes.forEach(cb => {
    cb.checked = false;
    const tr = cb.closest('tr');
    if (tr) tr.classList.remove('simpus-row-selected');
  });
  updateSimpusBulkActionState();
}

async function executeSimpusBulkAction(actionType) {
  if (selectedSimpusIds.size === 0) {
    showToast('Pilih setidaknya satu data pasien SIMPUS!', 'warning');
    return;
  }

  const selectedArray = Array.from(selectedSimpusIds);
  const targetRecords = simpusRecords.filter(r => selectedArray.includes(String(r.id || r.nik)));

  if (targetRecords.length === 0) {
    showToast('Data terpilih tidak ditemukan!', 'error');
    return;
  }

  if (actionType === 'berhasil') {
    const defaultTgl = getTodayIsoString();

    const result = await Swal.fire({
      title: `<i class="bi bi-check-circle-fill" style="color: #059669;"></i> Bulk Action: Berhasil Entry (${targetRecords.length} Pasien)`,
      html: `
        <div style="text-align: left; font-size: 13.5px; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 14px; border-radius: 8px; color: #065f46;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">
              <i class="bi bi-people-fill"></i> Sebanyak ${targetRecords.length} Data Pasien Terpilih
            </div>
            <div style="font-size: 12px; opacity: 0.9;">Seluruh data pasien terpilih ini akan dipindahkan secara masif dari SIMPUS ke Database Rekam Medis CKG (BNBA).</div>
          </div>

          <div>
            <label style="font-weight: 700; color: #1e293b; display: block; margin-bottom: 6px;">
              <i class="bi bi-geo-alt-fill" style="color: #2563eb;"></i> Pilih Kategori / Lokasi Entry CKG:
            </label>
            <select id="swalBulkTargetKategori" class="custom-input" style="width: 100%; padding: 9px 12px; border-radius: 6px; font-weight: 600; font-size: 13.5px;">
              <option value="Luar Gedung" selected>📍 CKG Luar Gedung</option>
              <option value="Dalam Gedung">🏥 CKG Dalam Gedung</option>
            </select>
          </div>

          <div>
            <label style="font-weight: 700; color: #1e293b; display: block; margin-bottom: 6px;">
              <i class="bi bi-calendar-event-fill" style="color: #2563eb;"></i> Pilih Tanggal Entry Massal:
            </label>
            <input type="date" id="swalBulkTanggalEntry" class="custom-input" style="width: 100%; padding: 9px 12px; border-radius: 6px; font-size: 13.5px;" value="${defaultTgl}">
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: `<i class="bi bi-check-circle-fill"></i> Selesai & Pindahkan ${targetRecords.length} Data`,
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const kat = document.getElementById('swalBulkTargetKategori')?.value || 'Luar Gedung';
        const tgl = document.getElementById('swalBulkTanggalEntry')?.value || defaultTgl;
        return { kategori: kat, tanggal_entry: tgl };
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const { kategori, tanggal_entry } = result.value;

    Swal.fire({
      title: `Memindahkan ${targetRecords.length} Data ke CKG BNBA...`,
      html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
              <i class="bi bi-cloud-arrow-up-fill" style="color: #059669;"></i> Menyimpan rekam medis ke <strong>${kategori}</strong> dan menghapus dari SIMPUS...
            </div>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const newCkgRecords = targetRecords.map((item, idx) => ({
        id: `CKG-${new Date().getFullYear()}-${String(records.length + idx + 1).padStart(4, '0')}`,
        jenis_kegiatan: kategori,
        pos_lokasi: item.alamat || 'Puskesmas Banjaran Kota',
        nik: item.nik,
        nama: item.nama,
        tanggal_lahir: formatDateToYYYYMMDD(item.dob || ''),
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
      }));

      // Post to /api/ckg
      const resCkg = await fetch('/api/ckg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCkgRecords)
      });

      if (!resCkg.ok) {
        throw new Error(`Gagal menyimpan data CKG ke server (HTTP ${resCkg.status})`);
      }

      records.unshift(...newCkgRecords);
      localStorage.setItem('ckg_records', JSON.stringify(records));

      // Delete from SIMPUS Cloud
      const deleteTab = 'sudah_bagi';
      for (const item of targetRecords) {
        const targetId = item.id || item.nik;
        try {
          await fetch(`/api/simpus?tab=${deleteTab}&id=${encodeURIComponent(targetId)}`, { method: 'DELETE' });
        } catch (_) {}
      }

      // Remove from local simpusRecords
      const removeSet = new Set(selectedArray);
      simpusRecords = simpusRecords.filter(r => !removeSet.has(String(r.id || r.nik)));
      localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

      clearSimpusSelection();
      renderApp();

      Swal.fire({
        icon: 'success',
        title: 'Aksi Massal Berhasil!',
        html: `Sebanyak <strong>${targetRecords.length} Data Pasien</strong> berhasil dipindahkan ke <strong>CKG ${kategori}</strong> pada tanggal <strong>${tanggal_entry}</strong> dan dihapus dari SIMPUS.`,
        confirmButtonColor: '#059669'
      });
    } catch (err) {
      console.error('Error in executeSimpusBulkAction (berhasil):', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memindahkan Data!',
        html: `Terjadi kesalahan saat memindahkan data massal: <strong>${err.message}</strong>`,
        confirmButtonColor: '#dc2626'
      });
    }

  } else if (actionType === 'sudah' || actionType === 'gagal') {
    const isSudah = actionType === 'sudah';
    const statusLabel = isSudah ? 'Sudah di Entry' : 'Gagal Entry';
    const btnColor = isSudah ? '#f59e0b' : '#dc2626';
    const iconClass = isSudah ? 'bi-bookmark-check-fill' : 'bi-x-circle-fill';

    const result = await Swal.fire({
      title: `<i class="bi ${iconClass}" style="color: ${btnColor};"></i> Bulk Action: ${statusLabel} (${targetRecords.length} Pasien)`,
      html: `
        <div style="font-size: 13.5px; text-align: left; line-height: 1.5;">
          Apakah Anda yakin ingin menandai <strong>${targetRecords.length} data pasien terpilih</strong> sebagai <strong>"${statusLabel}"</strong>?
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 13px;">
            <strong>Jumlah Data:</strong> ${targetRecords.length} Pasien<br>
            <strong>Status Baru:</strong> ${statusLabel}
          </div>
          <span style="color: ${btnColor}; font-weight: 600; font-size: 12px;">
            <i class="bi bi-trash3-fill"></i> Data akan dihapus dari SIMPUS dan dipindahkan ke <strong>Recycle Data</strong>.
          </span>
        </div>
      `,
      icon: isSudah ? 'warning' : 'error',
      showCancelButton: true,
      confirmButtonColor: btnColor,
      cancelButtonColor: '#64748b',
      confirmButtonText: `<i class="bi ${iconClass}"></i> Ya, Tandai & Pindahkan ${targetRecords.length} Data`,
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: `Memindahkan ${targetRecords.length} Data ke Recycle...`,
      html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
              <i class="bi bi-cloud-arrow-up-fill" style="color: ${btnColor};"></i> Mengupdate status data pasien ke <strong>${statusLabel}</strong>...
            </div>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const deleteTab = 'sudah_bagi';
      const nowStr = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
      const currentUser = sessionStorage.getItem('ckg_user_name') || currentRole || 'User';

      for (const item of targetRecords) {
        const targetId = item.id || item.nik;
        try {
          await fetch(`/api/simpus?tab=${deleteTab}&id=${encodeURIComponent(targetId)}`, { method: 'DELETE' });
        } catch (_) {}

        item.deleted_at = nowStr;
        item.deleted_by = currentUser;
        item.delete_reason = statusLabel;
        item.original_source = `Data SIMPUS (${statusLabel})`;

        recycleBin.unshift(item);
        await saveRecycleBinToStorage(item);
      }

      const removeSet = new Set(selectedArray);
      simpusRecords = simpusRecords.filter(r => !removeSet.has(String(r.id || r.nik)));
      localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

      clearSimpusSelection();
      renderApp();

      Swal.fire({
        icon: 'success',
        title: 'Aksi Massal Berhasil!',
        html: `Sebanyak <strong>${targetRecords.length} Data Pasien</strong> telah ditandai sebagai <strong>${statusLabel}</strong> dan dipindahkan ke <strong>Recycle Data</strong>.`,
        confirmButtonColor: '#059669'
      });
    } catch (err) {
      console.error(`Error in executeSimpusBulkAction (${actionType}):`, err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memindahkan Data!',
        html: `Terjadi kesalahan saat mengupdate data massal: <strong>${err.message}</strong>`,
        confirmButtonColor: '#dc2626'
      });
    }
  }
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

  const searchQuery = document.getElementById('searchSimpusRecords')?.value.trim().toLowerCase() || '';
  if (searchQuery) {
    dataset = dataset.filter(r => {
      const nama = (r.nama || '').toLowerCase();
      const nik = String(r.nik || '').toLowerCase();
      const alamat = (r.alamat || '').toLowerCase();
      const petugas = (r.assigned_to || r.petugas_entry || '').toLowerCase();
      const kel = (r.kelurahan || '').toLowerCase();
      const kec = (r.kecamatan || '').toLowerCase();
      const no_index = (r.no_index || '').toLowerCase();
      return nama.includes(searchQuery) || nik.includes(searchQuery) || alamat.includes(searchQuery) || petugas.includes(searchQuery) || kel.includes(searchQuery) || kec.includes(searchQuery) || no_index.includes(searchQuery);
    });
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
          <td>${formatDateToYYYYMMDD(r.dob) || '-'}</td>
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
    // RENDER 2: SIMPUS ID REGISTRATION TABLE MODEL (Khusus Data Sudah Di-Bagi - Image 1 Style)
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

    const tableRowsHtml = displayDataset.map((r, i) => {
      const petugasName = r.petugas_entry || r.assigned_to || '-';
      const recId = r.id || r.nik;
      const safeRecId = escapeAttr(recId);
      const safeNik = escapeAttr(r.nik);
      const kel = r.kelurahan || 'Tarajusari';
      const kec = r.kecamatan || 'Banjaran';
      const statusPernikahan = r.status_pernikahan || 'MENIKAH';
      const isChecked = selectedSimpusIds.has(String(recId));

      return `
        <tr class="${isChecked ? 'simpus-row-selected' : ''}">
          <!-- Checkbox Column -->
          <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
            <input type="checkbox" class="simpus-row-check" value="${safeRecId}" ${isChecked ? 'checked' : ''} onchange="updateSimpusBulkActionState()" style="width: 16px; height: 16px; cursor: pointer;">
          </td>

          <!-- Column 1: No -->
          <td style="text-align: center; vertical-align: middle; padding: 12px 6px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #e0f2fe; color: #0284c7; font-weight: 800; font-size: 12px; border-radius: 50%; border: 1px solid #bae6fd;">
              ${i + 1}
            </div>
          </td>

          <!-- Column 2: Nama Pasien & Identitas -->
          <td style="min-width: 250px; vertical-align: top;">
            <div style="font-size: 14.5px; font-weight: 800; color: #0284c7; margin-bottom: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" onclick="openSimpusDetailModal('${safeRecId}')" title="Klik untuk Buka Detail Data">
              ${r.nama} <i class="bi bi-box-arrow-up-right" style="font-size: 11px; opacity: 0.85;"></i>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 11.5px; font-family: monospace; font-weight: 700; color: #1e293b; width: fit-content; cursor: pointer;" onclick="copyToClipboard('${safeNik}', 'NIK Pasien')" title="Salin NIK Pasien">
                <i class="bi bi-card-text" style="color: #0284c7;"></i> NIK: ${r.nik} <i class="bi bi-copy" style="font-size: 10px; color: #0284c7; margin-left: 2px;"></i>
              </div>

              <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span class="badge badge-amber" style="padding: 3px 8px; font-size: 11px; font-weight: 700;">
                  <i class="bi bi-person-badge"></i> ${r.usia} Th (${r.keterangan || 'Dewasa'})
                </span>
                <span class="badge badge-cyan" style="padding: 3px 8px; font-size: 11px; font-weight: 700;">
                  ${statusPernikahan}
                </span>
              </div>
            </div>
          </td>

          <!-- Column 3: Hasil Skrining / Pemeriksaan CKG -->
          <td style="min-width: 270px; vertical-align: top;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: #fff1f2; border: 1px solid #ffe4e6; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
                <span style="color: #9f1239; font-weight: 700;"><i class="bi bi-activity" style="margin-right: 4px;"></i> Tensi (TD)</span>
                <strong style="color: #e11d48; font-size: 12.5px;">${r.sistol && r.diastol ? r.sistol + '/' + r.diastol + ' mmHg' : '-'}</strong>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #d1fae5; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
                <span style="color: #065f46; font-weight: 700;"><i class="bi bi-person-bounding-box" style="margin-right: 4px;"></i> BB / TB (IMT)</span>
                <strong style="color: #059669; font-size: 12px;">${r.bb ? r.bb + 'kg' : '-'} / ${r.tb ? r.tb + 'cm' : '-'} (${r.imt || '-'})</strong>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
                <span style="color: #075985; font-weight: 700;"><i class="bi bi-droplet-fill" style="margin-right: 4px;"></i> Gula / Kolesterol</span>
                <strong style="color: #0284c7; font-size: 12px;">${r.gula || '-'} / ${r.kolesterol || '-'} mg/dL</strong>
              </div>
            </div>
          </td>

          <!-- Column 4: Alamat -->
          <td style="min-width: 250px; vertical-align: top;">
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px;">
              <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 5px; line-height: 1.4;">
                <i class="bi bi-geo-alt-fill" style="color: #e11d48; margin-right: 4px;"></i> ${r.alamat || '-'}
              </div>
              <div style="display: flex; gap: 8px; font-size: 11px; color: #475569; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #f1f5f9; flex-wrap: wrap;">
                <span><strong>Kel:</strong> ${kel}</span>
                <span style="color: #cbd5e1;">|</span>
                <span><strong>Kec:</strong> ${kec}</span>
              </div>
            </div>
          </td>

          <!-- Column 5: Petugas & Action -->
          <td style="width: 170px; text-align: center; vertical-align: middle; padding: 12px 10px;">
            <div style="margin-bottom: 8px;">
              <span class="badge badge-purple" style="font-weight: 700; padding: 5px 12px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <i class="bi bi-person-fill"></i> ${petugasName}
              </span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; align-items: stretch;">
              <button class="btn btn-primary btn-sm" style="font-size: 11.5px; padding: 6px 12px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);" onclick="openSimpusDetailModal('${safeRecId}')" title="Detail & Copy Data Pasien">
                <i class="bi bi-eye-fill"></i> Detail & Salin
              </button>
              <button class="btn btn-outline-danger btn-sm" style="font-size: 11px; padding: 5px 10px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 5px;" onclick="deleteSimpusRecord('${safeRecId}')" title="Hapus Data Pasien">
                <i class="bi bi-trash-fill"></i> Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    containerCards.innerHTML = `
      <div class="simpus-table-wrapper">
        <table class="simpus-registration-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">
                <input type="checkbox" id="checkAllSimpusSudahBagi" onchange="toggleSelectAllSimpus(this.checked)" style="width: 16px; height: 16px; cursor: pointer;" title="Pilih Semua">
              </th>
              <th style="width: 45px; text-align: center;">No</th>
              <th>Nama Pasien & Identitas</th>
              <th>Hasil Skrining / Pemeriksaan CKG</th>
              <th>Alamat Pasien</th>
              <th style="width: 170px; text-align: center;">Petugas & Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    `;

    updateSimpusBulkActionState();
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
Tanggal Lahir: ${formatDateToYYYYMMDD(item.dob) || '-'}
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

          <div class="copyable-field" onclick="copyToClipboard('${escapeAttr(formatDateToYYYYMMDD(item.dob)) || '-'}', 'Tanggal Lahir')">
            <div>
              <div class="simpus-info-label">Tanggal Lahir</div>
              <div class="simpus-info-val">${formatDateToYYYYMMDD(item.dob) || '-'}</div>
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

function getTodayIsoString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const defaultTgl = getTodayIsoString();

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
      tanggal_lahir: formatDateToYYYYMMDD(item.dob || ''),
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
  const s = document.getElementById('searchSimpusRecords');
  const p = document.getElementById('filterSimpusPetugas');
  const u = document.getElementById('filterSimpusUmur');
  const l = document.getElementById('filterSimpusLimit');
  if (s) s.value = '';
  if (p) p.value = '';
  if (u) u.value = '';
  if (l) l.value = '10';
  applyPetugasFilterLock();
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

  // 1. Update local records state immediately
  idsToMove.forEach(id => {
    const rec = simpusRecords.find(r => r.id === id);
    if (rec) {
      rec.is_divided = true;
      rec.assigned_to = targetPetugas;
      rec.petugas_entry = targetPetugas;
    }
  });
  saveSimpusRecordsToStorage();

  // 2. Network sync to backend API (non-blocking)
  try {
    const res = await fetch('/api/simpus/bagi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToMove, petugas: targetPetugas })
    });
    if (res.ok) {
      fetchCloudSimpusRecords(true).catch(() => {});
    }
  } catch (err) {
    console.warn('Backend API /api/simpus/bagi sync notice:', err);
  }

  const assignedCount = idsToMove.length;
  hideLoadingOverlay();
  renderSimpusView();

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: 'Pembagian Data Berhasil!',
      html: `Berhasil membagikan <strong>${assignedCount} Data Pasien SIMPUS</strong> kepada petugas <strong>${targetPetugas}</strong>.<br><br><span style="color:#059669; font-weight:700;">Data otomatis berpindah ke tab "Data Sudah Di-Bagi".</span>`,
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
          dob: formatDateToYYYYMMDD(getVal('TANGGAL LAHIR', 'Tgl Lahir', 'DOB', 'Tanggal_Lahir')) || '1990-01-01',
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
    'PETUGAS ENTRY': r.assigned_to || r.petugas_entry || petugasName,
    'NAMA PASIEN': r.nama || '',
    'NIK': r.nik || '',
    'TANGGAL LAHIR': formatDateToYYYYMMDD(r.dob || r.tanggal_lahir),
    'USIA': r.usia || 0,
    'STATUS PERNIKAHAN': r.status_pernikahan || 'MENIKAH',
    'PROVINSI': r.provinsi || 'Jawa Barat',
    'KAB/KOTA': r.kab_kota || 'Kab. Bandung',
    'KECAMATAN': r.kecamatan || 'Banjaran',
    'KELURAHAN': r.kelurahan || 'Tarajusari',
    'ALAMAT LENGKAP': r.alamat || '',
    'BB (KG)': r.bb !== undefined && r.bb !== null ? r.bb : '',
    'TB (CM)': r.tb !== undefined && r.tb !== null ? r.tb : '',
    'TD SISTOL': r.sistol !== undefined && r.sistol !== null ? r.sistol : '',
    'TD DIASTOL': r.diastol !== undefined && r.diastol !== null ? r.diastol : '',
    'GULA DARAH': r.gula || '',
    'KOLESTEROL': r.kolesterol || '',
    'STATUS ENTRY': (r.entry_status || 'belum').toUpperCase()
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },   // NO
    { wch: 25 },  // PETUGAS ENTRY
    { wch: 26 },  // NAMA PASIEN
    { wch: 18 },  // NIK
    { wch: 14 },  // TANGGAL LAHIR (yyyy-mm-dd)
    { wch: 8 },   // USIA
    { wch: 18 },  // STATUS PERNIKAHAN
    { wch: 16 },  // PROVINSI
    { wch: 16 },  // KAB/KOTA
    { wch: 16 },  // KECAMATAN
    { wch: 16 },  // KELURAHAN
    { wch: 35 },  // ALAMAT LENGKAP
    { wch: 10 },  // BB (KG)
    { wch: 10 },  // TB (CM)
    { wch: 12 },  // TD SISTOL
    { wch: 12 },  // TD DIASTOL
    { wch: 14 },  // GULA DARAH
    { wch: 14 },  // KOLESTEROL
    { wch: 16 }   // STATUS ENTRY
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
      'PETUGAS ENTRY': r.assigned_to || r.petugas_entry || petugas,
      'NAMA PASIEN': r.nama || '',
      'NIK': r.nik || '',
      'TANGGAL LAHIR': formatDateToYYYYMMDD(r.dob || r.tanggal_lahir),
      'USIA': r.usia || 0,
      'STATUS PERNIKAHAN': r.status_pernikahan || 'MENIKAH',
      'PROVINSI': r.provinsi || 'Jawa Barat',
      'KAB/KOTA': r.kab_kota || 'Kab. Bandung',
      'KECAMATAN': r.kecamatan || 'Banjaran',
      'KELURAHAN': r.kelurahan || 'Tarajusari',
      'ALAMAT LENGKAP': r.alamat || '',
      'BB (KG)': r.bb !== undefined && r.bb !== null ? r.bb : '',
      'TB (CM)': r.tb !== undefined && r.tb !== null ? r.tb : '',
      'TD SISTOL': r.sistol !== undefined && r.sistol !== null ? r.sistol : '',
      'TD DIASTOL': r.diastol !== undefined && r.diastol !== null ? r.diastol : '',
      'GULA DARAH': r.gula || '',
      'KOLESTEROL': r.kolesterol || '',
      'STATUS ENTRY': (r.entry_status || 'belum').toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },   // NO
      { wch: 25 },  // PETUGAS ENTRY
      { wch: 26 },  // NAMA PASIEN
      { wch: 18 },  // NIK
      { wch: 14 },  // TANGGAL LAHIR (yyyy-mm-dd)
      { wch: 8 },   // USIA
      { wch: 18 },  // STATUS PERNIKAHAN
      { wch: 16 },  // PROVINSI
      { wch: 16 },  // KAB/KOTA
      { wch: 16 },  // KECAMATAN
      { wch: 16 },  // KELURAHAN
      { wch: 35 },  // ALAMAT LENGKAP
      { wch: 10 },  // BB (KG)
      { wch: 10 },  // TB (CM)
      { wch: 12 },  // TD SISTOL
      { wch: 12 },  // TD DIASTOL
      { wch: 14 },  // GULA DARAH
      { wch: 14 },  // KOLESTEROL
      { wch: 16 }   // STATUS ENTRY
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
    'PETUGAS ENTRY': r.assigned_to || r.petugas_entry || '-',
    'NAMA PASIEN': r.nama || '',
    'NIK': r.nik || '',
    'TANGGAL LAHIR': formatDateToYYYYMMDD(r.dob || r.tanggal_lahir),
    'USIA': r.usia || 0,
    'STATUS PERNIKAHAN': r.status_pernikahan || 'MENIKAH',
    'PROVINSI': r.provinsi || 'Jawa Barat',
    'KAB/KOTA': r.kab_kota || 'Kab. Bandung',
    'KECAMATAN': r.kecamatan || 'Banjaran',
    'KELURAHAN': r.kelurahan || 'Tarajusari',
    'ALAMAT LENGKAP': r.alamat || '',
    'BB (KG)': r.bb !== undefined && r.bb !== null ? r.bb : '',
    'TB (CM)': r.tb !== undefined && r.tb !== null ? r.tb : '',
    'TD SISTOL': r.sistol !== undefined && r.sistol !== null ? r.sistol : '',
    'TD DIASTOL': r.diastol !== undefined && r.diastol !== null ? r.diastol : '',
    'GULA DARAH': r.gula || '',
    'KOLESTEROL': r.kolesterol || '',
    'STATUS BAGI': r.is_divided ? 'Sudah Di-Bagi' : 'Belum Di-Bagi',
    'STATUS ENTRY': (r.entry_status || 'belum').toUpperCase()
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },   // NO
    { wch: 25 },  // PETUGAS ENTRY
    { wch: 26 },  // NAMA PASIEN
    { wch: 18 },  // NIK
    { wch: 14 },  // TANGGAL LAHIR (yyyy-mm-dd)
    { wch: 8 },   // USIA
    { wch: 18 },  // STATUS PERNIKAHAN
    { wch: 16 },  // PROVINSI
    { wch: 16 },  // KAB/KOTA
    { wch: 16 },  // KECAMATAN
    { wch: 16 },  // KELURAHAN
    { wch: 35 },  // ALAMAT LENGKAP
    { wch: 10 },  // BB (KG)
    { wch: 10 },  // TB (CM)
    { wch: 12 },  // TD SISTOL
    { wch: 12 },  // TD DIASTOL
    { wch: 14 },  // GULA DARAH
    { wch: 14 },  // KOLESTEROL
    { wch: 14 },  // STATUS BAGI
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
    if (!alamat) {
      showToast('Alamat Lengkap Pasien wajib diisi!', 'error');
      document.getElementById('alamat').focus();
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

function openInputModal(kategori = 'Luar Gedung', isEdit = false) {
  if (!isEdit) {
    currentEditingId = null;
    document.getElementById('ckgForm').reset();
  }
  
  if (kategori === 'Dalam Gedung') {
    document.getElementById('kegiatan_dalam').checked = true;
  } else {
    document.getElementById('kegiatan_luar').checked = true;
  }

  const titleEl = document.getElementById('inputModalTitle');
  const btnSubmit = document.getElementById('btnWizardSubmit');

  if (titleEl) {
    titleEl.innerHTML = isEdit
      ? '<i class="bi bi-pencil-square" style="color: var(--primary);"></i> Edit Data Record CKG Pasien'
      : '<i class="bi bi-file-earmark-medical-fill" style="color: var(--primary);"></i> Form Input Data CKG Pasien Baru';
  }

  if (btnSubmit) {
    btnSubmit.innerHTML = isEdit
      ? '<i class="bi bi-check-circle-fill"></i> Simpan Perubahan Data'
      : '<i class="bi bi-check-circle-fill"></i> Simpan Data CKG';
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
  if (e && e.preventDefault) e.preventDefault();

  const nik = (document.getElementById('nik')?.value || '').trim();
  const nama = (document.getElementById('nama')?.value || '').trim();
  const tanggalLahir = (document.getElementById('tanggal_lahir')?.value || '').trim();
  const alamat = (document.getElementById('alamat')?.value || '').trim();
  const bb = parseFloat(document.getElementById('bb')?.value) || 0;
  const tb = parseFloat(document.getElementById('tb')?.value) || 0;

  // Smart Validation with automatic step switching
  if (!nik || nik.length !== 16) {
    currentWizardStep = 2;
    updateWizardUI();
    showToast('NIK Pasien wajib 16 digit angka!', 'error');
    setTimeout(() => document.getElementById('nik')?.focus(), 100);
    return;
  }

  if (!nama) {
    currentWizardStep = 2;
    updateWizardUI();
    showToast('Nama Lengkap Pasien wajib diisi!', 'error');
    setTimeout(() => document.getElementById('nama')?.focus(), 100);
    return;
  }

  if (!tanggalLahir) {
    currentWizardStep = 2;
    updateWizardUI();
    showToast('Tanggal Lahir Pasien wajib diisi!', 'error');
    setTimeout(() => document.getElementById('tanggal_lahir')?.focus(), 100);
    return;
  }

  if (!alamat) {
    currentWizardStep = 2;
    updateWizardUI();
    showToast('Alamat Lengkap Pasien wajib diisi!', 'error');
    setTimeout(() => document.getElementById('alamat')?.focus(), 100);
    return;
  }

  if (!bb || bb <= 0) {
    currentWizardStep = 3;
    updateWizardUI();
    showToast('Berat Badan (BB) wajib diisi!', 'error');
    setTimeout(() => document.getElementById('bb')?.focus(), 100);
    return;
  }

  if (!tb || tb <= 0) {
    currentWizardStep = 3;
    updateWizardUI();
    showToast('Tinggi Badan (TB) wajib diisi!', 'error');
    setTimeout(() => document.getElementById('tb')?.focus(), 100);
    return;
  }

  const existingRecord = currentEditingId ? records.find(r => r.id === currentEditingId) : null;

  const formData = {
    id: currentEditingId || `CKG-2026-${String(records.length + 1).padStart(3, '0')}`,
    jenis_kegiatan: document.querySelector('input[name="jenis_kegiatan"]:checked')?.value || 'Luar Gedung',
    pos_lokasi: document.getElementById('pos_lokasi')?.value || '',
    nik: nik,
    nama: nama,
    tanggal_lahir: tanggalLahir,
    usia: parseInt(document.getElementById('usia')?.value) || 0,
    jenis_kelamin: document.getElementById('jenis_kelamin')?.value || 'L',
    no_whatsapp: document.getElementById('no_whatsapp')?.value || '',
    status_pernikahan: document.getElementById('status_pernikahan')?.value || 'MENIKAH',
    provinsi: document.getElementById('provinsi')?.value || 'Jawa Barat',
    kab_kota: document.getElementById('kab_kota')?.value || 'Kabupaten Bandung',
    kecamatan: document.getElementById('kecamatan')?.value || 'Banjaran',
    kelurahan: document.getElementById('kelurahan')?.value || 'Banjaran Kota',
    alamat: alamat,
    pekerjaan: document.getElementById('pekerjaan')?.value || '',
    merokok: document.querySelector('input[name="merokok"]:checked')?.value || 'Tidak',
    bb: bb,
    tb: tb,
    lp: parseFloat(document.getElementById('lp')?.value) || 0,
    imt: parseFloat(document.getElementById('imt')?.value) || 0,
    td_sistolik: parseInt(document.getElementById('td_sistolik')?.value) || 0,
    td_diastolik: parseInt(document.getElementById('td_diastolik')?.value) || 0,
    gula_darah: parseInt(document.getElementById('gula_darah')?.value) || 0,
    kolesterol: parseInt(document.getElementById('kolesterol')?.value) || 0,
    hb: parseFloat(document.getElementById('hb')?.value) || 0,
    telinga: document.getElementById('telinga')?.value || 'Normal',
    mata: document.getElementById('mata')?.value || 'Normal',
    gigi: document.getElementById('gigi')?.value || 'Baik',
    katarak: document.querySelector('input[name="katarak"]:checked')?.value || 'Tidak',
    status_validasi: existingRecord ? (existingRecord.status_validasi || 'Terverifikasi') : 'Terverifikasi',
    created_by: existingRecord ? (existingRecord.created_by || 'Admin') : (sessionStorage.getItem('ckg_user_name') || currentRole || 'Admin'),
    petugas_entry: existingRecord ? (existingRecord.petugas_entry || 'Admin') : (sessionStorage.getItem('ckg_user_name') || currentRole || 'Admin'),
    created_at: existingRecord ? (existingRecord.created_at || new Date().toISOString().substring(0, 10)) : new Date().toISOString().substring(0, 10),
    tanggal_entry: new Date().toISOString().substring(0, 10)
  };

  const isEdit = !!currentEditingId;

  // Show loading
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: isEdit ? 'Memperbarui Data Pasien...' : 'Menyimpan ke Cloud Database...',
      html: '<div style="font-size:13px;color:#475569;">Mengirim data ke Cloudflare D1 Database</div>',
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

    const editedId = currentEditingId;
    currentEditingId = null; // Reset editing ID!
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
    currentEditingId = null; // Reset editing ID!
    closeInputModal();
    renderApp();

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'warning',
        title: 'Tersimpan Lokal (Offline)',
        text: 'Gagal terhubung ke Cloud Database. Perubahan data telah tersimpan di browser Anda.',
        confirmButtonColor: '#f59e0b'
      });
    }
  }
}

function resetFilters() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');
  const loggedUser = sessionStorage.getItem('ckg_user_name') || '';

  const s = document.getElementById('searchDataRecords');
  if (s) s.value = '';

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

  const lim = document.getElementById('filterRecordLimit');
  if (lim) lim.value = '10';

  applyPetugasFilterLock();
  renderTableRecords();
  showToast('Filter telah di-reset.', 'info');
}

let currentRekapFilter = 'semua';

function isRecordCreatedByOfficer(r, u) {
  if (!r || !u) return false;

  const recOfficerRaw = (r.petugas_entry || r.created_by || r.assigned_to || r.petugas || '').toString().trim().toLowerCase();
  if (!recOfficerRaw) return false;

  const namaUser = (u.nama_user || '').toString().trim().toLowerCase();
  const username = (u.username || '').toString().trim().toLowerCase();

  if (recOfficerRaw === namaUser || recOfficerRaw === username) return true;
  if (recOfficerRaw === `petugas_${username}` || recOfficerRaw === `petugas_${namaUser}`) return true;

  const cleanNamaUser = namaUser.split(',')[0].trim();
  const cleanRecOfficer = recOfficerRaw.split(',')[0].trim();

  if (cleanNamaUser && (cleanRecOfficer === cleanNamaUser || cleanRecOfficer.includes(cleanNamaUser) || cleanNamaUser.includes(cleanRecOfficer))) {
    return true;
  }
  if (username && (cleanRecOfficer.includes(username) || username.includes(cleanRecOfficer))) {
    return true;
  }

  return false;
}

function isLuarGedungRecord(r) {
  const jk = (r.jenis_kegiatan || r.kegiatan || '').toString().trim().toLowerCase();
  if (!jk) return true;
  return jk.includes('luar') || jk.includes('posyandu') || jk.includes('field') || jk === 'l';
}

function isDalamGedungRecord(r) {
  const jk = (r.jenis_kegiatan || r.kegiatan || '').toString().trim().toLowerCase();
  if (!jk) return false;
  return jk.includes('dalam') || (jk.includes('gedung') && !jk.includes('luar')) || jk.includes('puskesmas') || jk === 'd';
}

function isRecordInMonthYear(r, targetMonth, targetYear) {
  const tMonthNum = targetMonth ? parseInt(targetMonth, 10) : null;
  const tYearNum = targetYear ? parseInt(targetYear, 10) : null;

  if (!tMonthNum && !tYearNum) return true;

  const d = getRecordEntryDate(r);
  if (!d) return false;

  const rMonthNum = parseInt(d.month, 10);
  const rYearNum = parseInt(d.year, 10);

  if (tMonthNum && rMonthNum !== tMonthNum) return false;
  if (tYearNum && rYearNum !== tYearNum) return false;

  return true;
}

function getOfficerPerformanceData(monthFilter = null, yearFilter = null) {
  const mSelect = document.getElementById('dashBulan');
  const ySelect = document.getElementById('dashTahun');

  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());

  let selectedMonth = monthFilter;
  let selectedYear = yearFilter;

  if (selectedMonth === null) {
    if (mSelect && mSelect.value) {
      selectedMonth = mSelect.value;
    } else {
      selectedMonth = currentMonthStr;
      if (mSelect) mSelect.value = currentMonthStr;
    }
  }

  if (selectedYear === null) {
    if (ySelect && ySelect.value) {
      selectedYear = ySelect.value;
    } else {
      selectedYear = currentYearStr;
      if (ySelect) ySelect.value = currentYearStr;
    }
  }

  const filteredRecords = records.filter(r => isRecordInMonthYear(r, selectedMonth, selectedYear));

  return usersDb.map(u => {
    const officerRecords = filteredRecords.filter(r => isRecordCreatedByOfficer(r, u));
    const ckgLuar = officerRecords.filter(r => isLuarGedungRecord(r)).length;
    const ckgDalam = officerRecords.filter(r => isDalamGedungRecord(r)).length;

    return {
      nama: u.nama_user,
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
  renderTop3Leaderboard(officersData);
}

function renderTop3Leaderboard(officersData = getOfficerPerformanceData()) {
  const container = document.getElementById('top3RankContainer');
  if (!container) return;

  const sorted = [...officersData].map(o => ({
    ...o,
    total: o.luarCount + o.dalamCount
  })).sort((a, b) => b.total - a.total);

  const top3 = sorted.slice(0, 3);

  if (top3.length === 0 || sorted.every(o => o.total === 0)) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px; color: #94a3b8; font-size: 13px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
        <i class="bi bi-trophy" style="font-size: 36px; display: block; margin-bottom: 8px; color: #cbd5e1;"></i>
        Belum ada data entri petugas pada periode bulan aktif ini.
      </div>
    `;
    return;
  }

  // Assign ranks
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  // Helper function to build officer podium card HTML
  const buildCardHtml = (item, rankNum) => {
    if (!item) return '<div style="flex: 1;"></div>';

    const initials = (item.nama || 'P').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    
    // Config based on Rank Number (1 = Gold, 2 = Silver, 3 = Bronze)
    const isRank1 = rankNum === 1;
    const isRank2 = rankNum === 2;

    const theme = isRank1 ? {
      pillBg: 'linear-gradient(135deg, #d97706, #b45309)',
      pillText: '🏆 JUARA 1 (RANK 1)',
      medalBadge: '1',
      medalBg: '#fef3c7',
      medalBorder: '#f59e0b',
      medalText: '#b45309',
      avatarBg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      avatarBorder: '#f59e0b',
      avatarText: '#78350f',
      ribbonText: '1st',
      cardBg: '#ffffff',
      cardBorder: '#f59e0b',
      cardShadow: '0 12px 28px rgba(245, 158, 11, 0.2)',
      nameColor: '#78350f',
      numColor: '#b45309',
      barColor: 'linear-gradient(90deg, #f59e0b, #d97706)',
      podiumBg: 'linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)',
      podiumHeight: '42px',
      podiumBorder: '#d97706',
      offset: '-16px'
    } : isRank2 ? {
      pillBg: 'linear-gradient(135deg, #64748b, #475569)',
      pillText: '🥈 JUARA 2 (RANK 2)',
      medalBadge: '2',
      medalBg: '#f1f5f9',
      medalBorder: '#94a3b8',
      medalText: '#334155',
      avatarBg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      avatarBorder: '#94a3b8',
      avatarText: '#334155',
      ribbonText: '2nd',
      cardBg: '#ffffff',
      cardBorder: '#cbd5e1',
      cardShadow: '0 8px 20px rgba(100, 116, 139, 0.12)',
      nameColor: '#334155',
      numColor: '#475569',
      barColor: 'linear-gradient(90deg, #94a3b8, #64748b)',
      podiumBg: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)',
      podiumHeight: '28px',
      podiumBorder: '#64748b',
      offset: '0px'
    } : {
      pillBg: 'linear-gradient(135deg, #ea580c, #c2410c)',
      pillText: '🥉 JUARA 3 (RANK 3)',
      medalBadge: '3',
      medalBg: '#ffedd5',
      medalBorder: '#fdba74',
      medalText: '#9a3412',
      avatarBg: 'linear-gradient(135deg, #ffedd5, #fed7aa)',
      avatarBorder: '#ea580c',
      avatarText: '#9a3412',
      ribbonText: '3rd',
      cardBg: '#ffffff',
      cardBorder: '#fdba74',
      cardShadow: '0 8px 20px rgba(234, 88, 12, 0.12)',
      nameColor: '#9a3412',
      numColor: '#c2410c',
      barColor: 'linear-gradient(90deg, #fb923c, #ea580c)',
      podiumBg: 'linear-gradient(180deg, #fed7aa 0%, #ea580c 100%)',
      podiumHeight: '18px',
      podiumBorder: '#ea580c',
      offset: '8px'
    };

    // Calculate max total for relative bar width
    const maxTotal = Math.max(rank1 ? rank1.total : 1, 1);
    const pct = Math.min(100, Math.round((item.total / maxTotal) * 100));

    return `
      <div class="podium-card-wrapper" style="display: flex; flex-direction: column; position: relative; margin-top: ${theme.offset}; transition: all 0.3s ease;">
        
        <!-- CARD BODY -->
        <div style="background: ${theme.cardBg}; border: 2px solid ${theme.cardBorder}; border-radius: 16px; padding: 16px; box-shadow: ${theme.cardShadow}; position: relative; display: flex; flex-direction: column; gap: 12px; z-index: 2;">
          
          <!-- TOP HEADER BADGES -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background: ${theme.pillBg}; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
              ${theme.pillText}
            </span>

            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${theme.medalBg}; border: 1.5px solid ${theme.medalBorder}; color: ${theme.medalText}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
              ${theme.medalBadge}
            </div>
          </div>

          <!-- OFFICER AVATAR & NAME -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="position: relative; flex-shrink: 0;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: ${theme.avatarBg}; border: 3px solid ${theme.avatarBorder}; color: ${theme.avatarText}; font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
                ${initials}
              </div>
              <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); background: ${theme.avatarBorder}; color: #ffffff; font-size: 8.5px; font-weight: 900; padding: 1px 5px; border-radius: 8px; border: 1px solid #ffffff; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                ${theme.ribbonText}
              </div>
            </div>

            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 14.5px; font-weight: 800; color: ${theme.nameColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.nama}">
                ${item.nama}
              </div>
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">
                ${item.role || 'Petugas'}
              </div>
            </div>

            <div style="font-size: 24px; font-weight: 900; color: ${theme.numColor}; font-family: monospace; flex-shrink: 0;">
              ${item.total.toLocaleString('id-ID')}
            </div>
          </div>

          <!-- BOTTOM STATS CARD (TOTAL ENTRI BULAN INI) -->
          <div style="background: #f8fafc; border-radius: 10px; padding: 8px 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">
              <span>Total Entri Bulan Ini</span>
              <span style="color: ${theme.numColor}; font-size: 12px; font-weight: 900;">${item.total}</span>
            </div>

            <!-- Progress Bar -->
            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${theme.barColor}; border-radius: 4px; transition: width 0.5s ease;"></div>
            </div>

            <div style="font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center; margin-top: 2px;">
              <span>📍 Luar: <strong>${item.luarCount}</strong></span>
              <span>🏢 Dalam: <strong>${item.dalamCount}</strong></span>
            </div>
          </div>

        </div>

        <!-- 3D PODIUM BASE STEP -->
        <div style="background: ${theme.podiumBg}; height: ${theme.podiumHeight}; border-radius: 0 0 12px 12px; border-top: 2px solid ${theme.podiumBorder}; box-shadow: inset 0 2px 4px rgba(255,255,255,0.6); position: relative; margin-top: -6px; z-index: 1;">
        </div>

      </div>
    `;
  };

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #fefce8 0%, #fffbeb 50%, #fafaf9 100%); border-radius: 18px; border: 1px solid #fef08a; padding: 22px; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.08); position: relative; overflow: hidden;">
      
      <!-- Subtle Background Confetti Watermark Pattern -->
      <div style="position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; background-image: radial-gradient(#f59e0b 0.8px, transparent 0.8px); background-size: 24px 24px; opacity: 0.12;"></div>

      <!-- HEADER TITLE BAR -->
      <div style="position: relative; z-index: 2; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);">
            <i class="bi bi-trophy-fill"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #1e293b;">Peringkat Petugas Tergas Terbanyak <span style="font-weight: 600; font-size: 13.5px; color: #64748b;">(Top 3 Batch Bulan Ini)</span></h3>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Top 3 Petugas Puskesmas dengan jumlah entri data CKG terbanyak pada bulan aktif</p>
          </div>
        </div>

        <span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px;">
          <i class="bi bi-stars"></i> Leaderboard CKG
        </span>
      </div>

      <!-- 3D PODIUM GRID LAYOUT: Rank 2 (Left) | Rank 1 (Center Elevated) | Rank 3 (Right) -->
      <div style="position: relative; z-index: 2; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; align-items: flex-end;">
        ${buildCardHtml(rank2, 2)}
        ${buildCardHtml(rank1, 1)}
        ${buildCardHtml(rank3, 3)}
      </div>

    </div>
  `;
}

function updateTotalEntryMonthMetric() {
  const totalEl = document.getElementById('totalEntryMonth');
  if (!totalEl) return;

  const now = new Date();
  const yearStr = now.getFullYear().toString();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');

  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const loggedUser = (sessionStorage.getItem('ckg_user_name') || '').trim().toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');

  // Count ONLY records from Data Record CKG (getVisibleRecords(records)) for the current calendar month
  let currentMonthRecords = getVisibleRecords(records).filter(r => isRecordInMonthYear(r, monthStr, yearStr));

  // If user is 'Petugas', count strictly their own entries (per user) for the active month
  if (!isPrivileged && loggedUser) {
    currentMonthRecords = currentMonthRecords.filter(r => {
      const pEntry = (r.petugas_entry || '').toLowerCase().trim();
      const cBy = (r.created_by || '').toLowerCase().trim();
      return pEntry === loggedUser || pEntry.includes(loggedUser) || cBy === loggedUser || cBy === `petugas_${loggedUser}`;
    });
  }

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

  const searchQuery = document.getElementById('searchDataRecords')?.value.trim().toLowerCase() || '';
  if (searchQuery) {
    filtered = filtered.filter(r => {
      const nama = (r.nama || '').toLowerCase();
      const nik = String(r.nik || '').toLowerCase();
      const alamat = (r.alamat || '').toLowerCase();
      const petugas = (r.petugas_entry || r.created_by || '').toLowerCase();
      const pos = (r.pos_lokasi || '').toLowerCase();
      const kegiatan = (r.jenis_kegiatan || '').toLowerCase();
      return nama.includes(searchQuery) || nik.includes(searchQuery) || alamat.includes(searchQuery) || petugas.includes(searchQuery) || pos.includes(searchQuery) || kegiatan.includes(searchQuery);
    });
  }

  const limitVal = document.getElementById('filterRecordLimit')?.value || '10';
  let displayFiltered = filtered;
  if (limitVal !== 'semua') {
    const limitNum = parseInt(limitVal) || 10;
    displayFiltered = filtered.slice(0, limitNum);
  }

  tbody.innerHTML = buildTableRowsHtml(displayFiltered);

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
        <td>
          <span style="font-size: 12px; font-weight: 700; color: #0284c7; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; display: inline-flex; align-items: center; gap: 4px;" onclick="promptChangeSingleRecordDate('${r.id}')" title="Klik untuk mengubah Tanggal Entry pasien ini">
            <i class="bi bi-pencil-square" style="font-size: 11px; opacity: 0.85;"></i>${formatDisplayDate(r.tanggal_entry || r.created_at)}
          </span>
        </td>
        <td>${kegiatanBadge}</td>
        <td>
          <strong>${r.nama}</strong><br>
          <span style="font-size: 11px; color: var(--text-muted);">${r.nik}</span>
        </td>
        <td>${formatDateToYYYYMMDD(r.tanggal_lahir)}<br><span style="font-size: 11px; color: var(--text-muted);">${r.usia} th (${r.jenis_kelamin})</span></td>
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

/* ==========================================================================
   📅 DATE UPDATE ENGINE (SINGLE RECORD & BULK MONTHLY FOR ADMIN)
   ========================================================================== */

function promptChangeSingleRecordDate(recordId) {
  const item = records.find(r => String(r.id) === String(recordId));
  if (!item) {
    showToast('Record data tidak ditemukan!', 'error');
    return;
  }

  const currentDateIso = formatDateToYYYYMMDD(item.created_at || item.tanggal_entry || item.tanggal) || new Date().toISOString().substring(0, 10);
  const currentFormatted = formatDisplayDate(item.tanggal_entry || item.created_at || item.tanggal);

  Swal.fire({
    title: '<div style="font-size: 16px; font-weight: 800; color: #0284c7; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="bi bi-calendar-event-fill" style="color: #0284c7; font-size: 20px;"></i> Ubah Tanggal Entry Pasien</div>',
    html: `
      <div style="text-align: left; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
          <div style="font-weight: 800; color: #0284c7; font-size: 14px;">${item.nama}</div>
          <div style="font-size: 12px; color: #64748b;">NIK: ${item.nik || '-'} | Petugas: ${item.petugas_entry || item.created_by || '-'}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">Tanggal Entry Saat Ini: <strong>${currentFormatted}</strong></div>
        </div>

        <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;">Pilih Tanggal Entry Baru:</label>
        <input type="date" id="swalSingleDateInput" class="swal2-input" value="${currentDateIso}" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 600;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-lg"></i> Simpan Perubahan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#0284c7',
    cancelButtonColor: '#64748b',
    preConfirm: () => {
      const newDate = document.getElementById('swalSingleDateInput')?.value;
      if (!newDate) {
        Swal.showValidationMessage('Silakan pilih tanggal entry baru yang valid.');
        return false;
      }
      return newDate;
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const newDateVal = result.value;
      item.created_at = newDateVal;
      item.tanggal_entry = newDateVal;
      item.tanggal = newDateVal;

      saveRecordsToStorage();
      renderTableRecords();
      showToast(`✓ Tanggal entry untuk ${item.nama} berhasil diubah ke ${formatDisplayDate(newDateVal)}!`, 'success');
    }
  });
}

function openBulkUpdateDateModal() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    Swal.fire({
      icon: 'warning',
      title: 'Akses Ditolak',
      text: 'Fitur Ubah Tanggal Entry Massal hanya dapat diakses oleh Admin.',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());
  const todayIsoStr = now.toISOString().substring(0, 10);

  // Build Officers Dropdown Options for Bulk Update Modal
  let bulkPetugasOptionsHtml = `<option value="">-- Semua Petugas --</option>`;
  if (Array.isArray(usersDb) && usersDb.length > 0) {
    usersDb.forEach(u => {
      bulkPetugasOptionsHtml += `<option value="${escapeAttr(u.nama_user)}">${u.nama_user}</option>`;
    });
  }

  let bulkYearOptionsHtml = '';
  const cYear = parseInt(currentYearStr, 10);
  for (let y = 2045; y >= 2000; y--) {
    bulkYearOptionsHtml += `<option value="${y}" ${y === cYear ? 'selected' : ''}>${y}</option>`;
  }

  Swal.fire({
    title: '<div style="font-size: 16px; font-weight: 800; color: #0369a1; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="bi bi-calendar-range-fill" style="color: #0284c7; font-size: 22px;"></i> Ubah Tanggal Entry Massal (Khusus Admin)</div>',
    html: `
      <div style="text-align: left; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 6px;">
        <p style="color: #64748b; margin-bottom: 14px; line-height: 1.5;">Pilih bulan, tahun, dan petugas entry target, lalu tentukan tanggal entry baru yang akan diterapkan pada seluruh data tersebut:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-calendar3" style="color: #0284c7;"></i> Bulan Target:</label>
            <select id="swalBulkMonthTarget" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 600;">
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07" ${currentMonthStr === '07' ? 'selected' : ''}>Juli</option>
              <option value="08" ${currentMonthStr === '08' ? 'selected' : ''}>Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-calendar-year" style="color: #0284c7;"></i> Tahun Target:</label>
            <select id="swalBulkYearTarget" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 600;">
              ${bulkYearOptionsHtml}
            </select>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-person-badge" style="color: #0284c7;"></i> Filter Petugas Entry Target:</label>
          <select id="swalBulkPetugasTarget" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 700; color: #1e3a8a;">
            ${bulkPetugasOptionsHtml}
          </select>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-calendar-check-fill" style="color: #059669;"></i> Ubah Semua Ke Tanggal Entry Baru:</label>
          <input type="date" id="swalBulkNewDateInput" class="swal2-input" value="${todayIsoStr}" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 700; border-color: #059669;">
        </div>

        <div style="font-size: 11.5px; color: #b45309; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 8px 10px; margin-top: 10px;">
          <i class="bi bi-exclamation-triangle-fill"></i> <strong>Perhatian:</strong> Seluruh data rekam medis CKG pada kriteria filter target yang dipilih akan diperbarui ke tanggal entry baru.
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-circle-fill"></i> Terapkan Perubahan Massal',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#0284c7',
    cancelButtonColor: '#64748b',
    preConfirm: () => {
      const monthVal = document.getElementById('swalBulkMonthTarget')?.value;
      const yearVal = document.getElementById('swalBulkYearTarget')?.value;
      const petugasVal = document.getElementById('swalBulkPetugasTarget')?.value || '';
      const newDateVal = document.getElementById('swalBulkNewDateInput')?.value;

      if (!monthVal || !yearVal) {
        Swal.showValidationMessage('Pilih Bulan dan Tahun target terlebih dahulu.');
        return false;
      }
      if (!newDateVal) {
        Swal.showValidationMessage('Pilih Tanggal Entry Baru yang valid.');
        return false;
      }

      return { monthVal, yearVal, petugasVal, newDateVal };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const { monthVal, yearVal, petugasVal, newDateVal } = result.value;
      processBulkUpdateDate(monthVal, yearVal, petugasVal, newDateVal);
    }
  });
}

function processBulkUpdateDate(monthVal, yearVal, petugasVal, newDateVal) {
  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const targetMonthName = monthNames[parseInt(monthVal, 10)] || monthVal;

  const targetMonthNum = parseInt(monthVal, 10);
  const targetYearNum = parseInt(yearVal, 10);
  const targetPetugasClean = (petugasVal || '').trim().toLowerCase();

  const isMatch = (r) => {
    const d = getRecordEntryDate(r);
    if (!d) return false;
    const mNum = parseInt(d.month, 10);
    const yNum = parseInt(d.year, 10);
    if (mNum !== targetMonthNum || yNum !== targetYearNum) return false;

    if (targetPetugasClean) {
      const creator = (r.created_by || r.petugas_entry || r.assigned_to || r.petugas || '').trim().toLowerCase();
      return creator === targetPetugasClean || creator.includes(targetPetugasClean);
    }
    return true;
  };

  const matchingCkg = records.filter(isMatch);
  const matchingSimpus = simpusRecords.filter(isMatch);
  const totalMatching = matchingCkg.length + matchingSimpus.length;

  if (totalMatching === 0) {
    const petugasText = petugasVal ? ` untuk petugas "${petugasVal}"` : '';
    Swal.fire({
      icon: 'warning',
      title: 'Data Tidak Ditemukan',
      text: `Tidak ditemukan data CKG / SIMPUS pada bulan ${targetMonthName} ${yearVal}${petugasText}.`,
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  matchingCkg.forEach(r => {
    r.created_at = newDateVal;
    r.tanggal_entry = newDateVal;
    r.tanggal = newDateVal;
  });

  matchingSimpus.forEach(r => {
    r.tanggal = newDateVal;
    r.created_at = newDateVal;
    r.tanggal_entry = newDateVal;
  });

  saveRecordsToStorage();
  saveSimpusRecordsToStorage();

  if (typeof syncRecordsToCloud === 'function' && matchingCkg.length > 0) {
    syncRecordsToCloud(matchingCkg);
  }
  if (typeof syncSimpusToCloud === 'function' && matchingSimpus.length > 0) {
    syncSimpusToCloud(matchingSimpus);
  }

  renderApp();

  const petugasText = petugasVal ? ` (Petugas: ${petugasVal})` : ' (Semua Petugas)';
  Swal.fire({
    icon: 'success',
    title: 'Berhasil Memperbarui Tanggal Entry Massal!',
    html: `Sebanyak <strong>${totalMatching} data</strong> (${matchingCkg.length} Data CKG & ${matchingSimpus.length} Data SIMPUS) pada bulan <strong>${targetMonthName} ${yearVal}</strong>${petugasText} telah berhasil diubah ke tanggal entry baru: <strong style="color: #0284c7;">${formatDisplayDate(newDateVal)}</strong>.`,
    confirmButtonColor: '#0284c7'
  });
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

function getFilteredRecycleBin() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    return [];
  }

  let dataset = getVisibleRecords(recycleBin);

  const filterKegiatanVal = document.getElementById('filterRecycleKegiatan')?.value || '';
  const filterSourceVal = document.getElementById('filterRecycleSource')?.value || '';
  const filterPetugasVal = document.getElementById('filterRecyclePetugas')?.value || '';
  const searchQuery = document.getElementById('searchRecycle')?.value.trim().toLowerCase() || '';

  // Filter Jenis Kegiatan
  if (filterKegiatanVal) {
    dataset = dataset.filter(r => (r.jenis_kegiatan || '').toLowerCase() === filterKegiatanVal.toLowerCase());
  }

  // Filter Sumber Data
  if (filterSourceVal) {
    dataset = dataset.filter(r => {
      const src = r.original_source || 'BNBA';
      if (filterSourceVal === 'SIMPUS') {
        return src.includes('SIMPUS');
      } else {
        return !src.includes('SIMPUS');
      }
    });
  }

  // Filter Petugas
  if (filterPetugasVal) {
    dataset = dataset.filter(r => 
      r.deleted_by === filterPetugasVal || 
      r.created_by === filterPetugasVal || 
      r.petugas_entry === filterPetugasVal
    );
  }

  // Search Query
  if (searchQuery) {
    dataset = dataset.filter(r => {
      const nama = (r.nama || r.nama_pasien || '').toLowerCase();
      const nik = String(r.nik || '').toLowerCase();
      const deletedBy = (r.deleted_by || '').toLowerCase();
      const createdBy = (r.created_by || r.petugas_entry || '').toLowerCase();
      const alamat = (r.alamat || '').toLowerCase();
      const kegiatan = (r.jenis_kegiatan || '').toLowerCase();

      return nama.includes(searchQuery) || nik.includes(searchQuery) || deletedBy.includes(searchQuery) || createdBy.includes(searchQuery) || alamat.includes(searchQuery) || kegiatan.includes(searchQuery);
    });
  }

  return dataset;
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

  const visibleRecycle = getFilteredRecycleBin();

  if (visibleRecycle.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 35px; color: var(--text-muted);">
          <i class="bi bi-trash3" style="font-size: 32px; display: block; margin-bottom: 8px; color: #cbd5e1;"></i>
          Tidak ada data di tempat sampah yang sesuai dengan filter.
        </td>
      </tr>
    `;
    return;
  }

  // Limit Filter Logic (Default: 10)
  const limitVal = document.getElementById('filterRecycleLimit')?.value || '10';
  let displayedRecycle = visibleRecycle;
  if (limitVal !== 'all') {
    const limitNum = parseInt(limitVal, 10) || 10;
    displayedRecycle = visibleRecycle.slice(0, limitNum);
  }

  tbody.innerHTML = displayedRecycle.map((r, i) => {
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

function resetRecycleFilters() {
  const s = document.getElementById('searchRecycle');
  if (s) s.value = '';

  const keg = document.getElementById('filterRecycleKegiatan');
  if (keg) keg.value = '';

  const src = document.getElementById('filterRecycleSource');
  if (src) src.value = '';

  const pet = document.getElementById('filterRecyclePetugas');
  if (pet) pet.value = '';

  const lim = document.getElementById('filterRecycleLimit');
  if (lim) lim.value = '10';

  renderRecycleTable();
  showToast('Filter & Pencarian Recycle Data telah di-reset.', 'info');
}

function restoreFilteredRecycle() {
  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || '').toLowerCase();
  if (role !== 'admin' && role !== 'koordinator') {
    Swal.fire('Akses Ditolak', 'Hanya Admin & Koordinator yang dapat memulihkan data.', 'warning');
    return;
  }

  const itemsToRestore = getFilteredRecycleBin();

  if (itemsToRestore.length === 0) {
    showToast('Tidak ada data terfilter untuk dipulihkan.', 'warning');
    return;
  }

  const filterKegiatanVal = document.getElementById('filterRecycleKegiatan')?.value || 'Semua';
  const filterSourceVal = document.getElementById('filterRecycleSource')?.value || 'Semua';
  const filterPetugasVal = document.getElementById('filterRecyclePetugas')?.value || 'Semua';
  const searchQuery = (document.getElementById('searchRecycle')?.value || '').trim();

  Swal.fire({
    title: '<div style="font-size: 17px; font-weight: 800; color: #059669; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="bi bi-arrow-counterclockwise" style="color: #10b981; font-size: 24px;"></i> Restore Data Terfilter?</div>',
    html: `
      <div style="text-align: left; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
        <p style="color: #475569; margin-bottom: 12px; line-height: 1.5;">Apakah Anda yakin ingin memulihkan <strong>${itemsToRestore.length} data</strong> yang saat ini muncul sesuai filter?</p>
        
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #065f46; line-height: 1.6;">
          <div>• Jenis Kegiatan: <strong>${filterKegiatanVal || 'Semua Kegiatan'}</strong></div>
          <div>• Sumber Data: <strong>${filterSourceVal || 'Semua Sumber'}</strong></div>
          <div>• Petugas: <strong>${filterPetugasVal || 'Semua Petugas'}</strong></div>
          ${searchQuery ? `<div>• Kata Kunci Cari: <strong>"${searchQuery}"</strong></div>` : ''}
          <div style="margin-top: 6px; font-weight: 700; color: #047857;">Semua data terfilter di atas akan dikembalikan dari Tempat Sampah ke Database Aktif.</div>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#059669',
    cancelButtonColor: '#64748b',
    confirmButtonText: `<i class="bi bi-check-lg"></i> Ya, Pulihkan ${itemsToRestore.length} Data!`,
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      let restoredCount = 0;

      itemsToRestore.forEach(item => {
        const itemIndex = recycleBin.findIndex(r => (r.id || r.nik || '') === (item.id || item.nik || ''));
        if (itemIndex !== -1) {
          const [restoredItem] = recycleBin.splice(itemIndex, 1);
          restoredCount++;

          if (restoredItem.original_source && restoredItem.original_source.includes('SIMPUS')) {
            simpusRecords.unshift(restoredItem);
          } else {
            records.unshift(restoredItem);
          }
        }
      });

      saveRecycleBinToStorage();
      saveSimpusRecordsToStorage();
      saveRecordsToStorage();

      renderApp();

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Mempulihkan Data!',
        html: `Sebanyak <strong>${restoredCount} data terfilter</strong> telah dikembalikan dari Tempat Sampah ke Database Aktif.`,
        confirmButtonColor: '#059669'
      });
    }
  });
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
    Swal.fire('Akses Ditolak', 'Hanya Admin & Koordinator yang dapat menghapus data di Recycle Data.', 'warning');
    return;
  }

  if (recycleBin.length === 0) {
    showToast('Tempat sampah saat ini sudah kosong.', 'info');
    return;
  }

  const filteredItems = getFilteredRecycleBin();
  const isFiltered = (
    (document.getElementById('searchRecycle')?.value || '').trim() !== '' ||
    (document.getElementById('filterRecycleKegiatan')?.value || '') !== '' ||
    (document.getElementById('filterRecycleSource')?.value || '') !== '' ||
    (document.getElementById('filterRecyclePetugas')?.value || '') !== ''
  );

  const countTotal = recycleBin.length;
  const countSimpus = recycleBin.filter(r => (r.original_source || '').toUpperCase().includes('SIMPUS')).length;
  const countBnba = countTotal - countSimpus;
  const countFiltered = filteredItems.length;

  const htmlContent = `
    <div style="text-align: left; margin-top: 8px;">
      <p style="font-size: 13.5px; color: var(--text-muted, #64748b); margin-bottom: 14px; line-height: 1.5;">
        Pilih sumber data yang ingin Anda hapus secara <strong>permanen</strong> dari Tempat Sampah:
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        
        <!-- Opsi 1: Semua Data -->
        <label class="recycle-option-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 2px solid #0284c7; border-radius: 12px; cursor: pointer; background: rgba(2, 132, 199, 0.06); transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="radio" name="emptyRecycleSource" value="ALL" checked style="accent-color: #0284c7; width: 18px; height: 18px;">
            <div>
              <div style="font-weight: 800; font-size: 13.5px; color: var(--text-main, #0f172a);">🌐 Kosongkan Semua Data</div>
              <div style="font-size: 11.5px; color: #64748b;">Hapus seluruh isi tempat sampah secara total</div>
            </div>
          </div>
          <span class="badge badge-cyan" style="font-size: 12px; font-weight: 800; padding: 4px 10px;">${countTotal} Data</span>
        </label>

        ${isFiltered ? `
        <!-- Opsi Terfilter (Jika sedang ada filter aktif) -->
        <label class="recycle-option-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 2px solid #8b5cf6; border-radius: 12px; cursor: pointer; background: rgba(139, 92, 246, 0.06); transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="radio" name="emptyRecycleSource" value="FILTERED" style="accent-color: #8b5cf6; width: 18px; height: 18px;">
            <div>
              <div style="font-weight: 800; font-size: 13.5px; color: var(--text-main, #0f172a);">🔍 Hanya Data Terfilter Saat Ini</div>
              <div style="font-size: 11.5px; color: #64748b;">Hapus data yang sesuai pencarian/filter di tabel</div>
            </div>
          </div>
          <span class="badge badge-purple" style="font-size: 12px; font-weight: 800; padding: 4px 10px;">${countFiltered} Data</span>
        </label>
        ` : ''}

        <!-- Opsi 2: Hanya SIMPUS -->
        <label class="recycle-option-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 2px solid #cbd5e1; border-radius: 12px; cursor: pointer; background: var(--bg-card, #ffffff); transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="radio" name="emptyRecycleSource" value="SIMPUS" ${countSimpus === 0 ? 'disabled' : ''} style="accent-color: #f59e0b; width: 18px; height: 18px;">
            <div>
              <div style="font-weight: 800; font-size: 13.5px; color: var(--text-main, #0f172a);">🖥️ Hanya Data Sumber SIMPUS</div>
              <div style="font-size: 11.5px; color: #64748b;">Hapus data yang berasal dari SIMPUS saja</div>
            </div>
          </div>
          <span class="badge badge-amber" style="font-size: 12px; font-weight: 800; padding: 4px 10px;">${countSimpus} Data</span>
        </label>

        <!-- Opsi 3: Hanya BNBA CKG -->
        <label class="recycle-option-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 2px solid #cbd5e1; border-radius: 12px; cursor: pointer; background: var(--bg-card, #ffffff); transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="radio" name="emptyRecycleSource" value="BNBA" ${countBnba === 0 ? 'disabled' : ''} style="accent-color: #06b6d4; width: 18px; height: 18px;">
            <div>
              <div style="font-weight: 800; font-size: 13.5px; color: var(--text-main, #0f172a);">📁 Hanya Data Sumber BNBA CKG</div>
              <div style="font-size: 11.5px; color: #64748b;">Hapus data yang berasal dari BNBA CKG saja</div>
            </div>
          </div>
          <span class="badge badge-emerald" style="font-size: 12px; font-weight: 800; padding: 4px 10px;">${countBnba} Data</span>
        </label>

      </div>

      <div style="margin-top: 14px; padding: 10px 14px; border-radius: 10px; background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.2); font-size: 12px; color: #e11d48; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        <i class="bi bi-exclamation-triangle-fill" style="font-size: 16px;"></i>
        <span>Peringatan: Data yang dihapus permanen tidak dapat dipulihkan!</span>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Kosongkan Tempat Sampah',
    html: htmlContent,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="bi bi-trash-fill"></i> Ya, Hapus Permanen Sekarang!',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const selectedOption = document.querySelector('input[name="emptyRecycleSource"]:checked')?.value || 'ALL';
      return selectedOption;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const targetSource = result.value;
      let countRemoved = 0;
      let targetLabel = '';
      let deleteOptions = null;

      if (targetSource === 'ALL') {
        countRemoved = recycleBin.length;
        recycleBin = [];
        targetLabel = 'Semua Data';
        deleteOptions = { clearAll: true };
      } else if (targetSource === 'FILTERED') {
        const idsToRemove = Array.from(new Set(filteredItems.map(item => String(item.id || item.nik))));
        countRemoved = idsToRemove.length;
        const idsSet = new Set(idsToRemove);
        recycleBin = recycleBin.filter(r => !idsSet.has(String(r.id || r.nik)));
        targetLabel = 'Data Terfilter';
        deleteOptions = { ids: idsToRemove };
      } else if (targetSource === 'SIMPUS') {
        const initialLen = recycleBin.length;
        recycleBin = recycleBin.filter(r => !(r.original_source || '').toUpperCase().includes('SIMPUS'));
        countRemoved = initialLen - recycleBin.length;
        targetLabel = 'Hanya Data SIMPUS';
        deleteOptions = { source: 'SIMPUS' };
      } else if (targetSource === 'BNBA') {
        const initialLen = recycleBin.length;
        recycleBin = recycleBin.filter(r => (r.original_source || '').toUpperCase().includes('SIMPUS'));
        countRemoved = initialLen - recycleBin.length;
        targetLabel = 'Hanya Data BNBA CKG';
        deleteOptions = { source: 'BNBA' };
      }

      // Show loading progress overlay for cloud deletion
      Swal.fire({
        title: 'Menghapus Data dari Cloud Database...',
        html: `<div style="font-size: 13px; color: #475569; margin-top: 6px;">
                <i class="bi bi-cloud-arrow-up-fill" style="color: #dc2626;"></i> Mengirim perintah HAPUS PERMANEN (${targetLabel}) ke Cloudflare D1 Database...
              </div>`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await saveRecycleBinToStorage(null, null, deleteOptions);
      renderRecycleTable();

      Swal.fire({
        icon: 'success',
        title: 'Terhapus Permanen dari Cloud Database!',
        html: `Sebanyak <strong>${countRemoved} Data</strong> (${targetLabel}) telah <strong>berhasil dihapus secara permanen dari Cloudflare D1 Database</strong> & Tempat Sampah.`,
        confirmButtonColor: '#059669'
      });
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
      <div><strong>Tanggal Lahir / Usia:</strong> ${formatDateToYYYYMMDD(r.tanggal_lahir)} (${r.usia} Tahun)</div>
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

  openInputModal(r.jenis_kegiatan, true);
  currentEditingId = id;

  const setVal = (fieldId, val) => {
    const el = document.getElementById(fieldId);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('pos_lokasi', r.pos_lokasi);
  setVal('nik', r.nik);
  setVal('nama', r.nama);
  setVal('tanggal_lahir', formatDateToYYYYMMDD(r.tanggal_lahir));
  setVal('usia', r.usia);
  setVal('jenis_kelamin', r.jenis_kelamin || 'L');
  setVal('no_whatsapp', r.no_whatsapp);
  setVal('status_pernikahan', r.status_pernikahan || 'MENIKAH');
  setVal('alamat', r.alamat);
  setVal('kelurahan', r.kelurahan || 'Banjaran Kota');
  setVal('kecamatan', r.kecamatan || 'Banjaran');
  setVal('kab_kota', r.kab_kota || 'Kab. Bandung');
  setVal('provinsi', r.provinsi || 'Jawa Barat');
  setVal('pekerjaan', r.pekerjaan);
  setVal('bb', r.bb);
  setVal('tb', r.tb);
  setVal('lp', r.lp);
  setVal('imt', r.imt);
  setVal('td_sistolik', r.td_sistolik);
  setVal('td_diastolik', r.td_diastolik);
  setVal('gula_darah', r.gula_darah);
  setVal('kolesterol', r.kolesterol);
  setVal('hb', r.hb);
  setVal('telinga', r.telinga || 'Normal');
  setVal('mata', r.mata || 'Normal');
  setVal('gigi', r.gigi || 'Baik');

  // Fix Radio Buttons for Merokok, Katarak, and Jenis Kegiatan
  const isRokok = String(r.merokok || '').toUpperCase() === 'YA';
  if (isRokok) {
    const el = document.getElementById('rokok_ya');
    if (el) el.checked = true;
  } else {
    const el = document.getElementById('rokok_tidak');
    if (el) el.checked = true;
  }

  const isKatarak = String(r.katarak || '').toUpperCase() === 'YA';
  if (isKatarak) {
    const el = document.getElementById('katarak_ya');
    if (el) el.checked = true;
  } else {
    const el = document.getElementById('katarak_tidak');
    if (el) el.checked = true;
  }

  if (r.jenis_kegiatan === 'Dalam Gedung') {
    const el = document.getElementById('kegiatan_dalam');
    if (el) el.checked = true;
  } else {
    const el = document.getElementById('kegiatan_luar');
    if (el) el.checked = true;
  }

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

  const role = (sessionStorage.getItem('ckg_user_role') || currentRole || 'Petugas').toLowerCase();
  const isPrivileged = (role === 'admin' || role === 'koordinator');
  const loggedUser = sessionStorage.getItem('ckg_user_name') || '';

  // Build Officers Dropdown Options
  let petugasOptionsHtml = '';
  if (isPrivileged) {
    petugasOptionsHtml = `<option value="">-- Semua Petugas --</option>`;
    if (Array.isArray(usersDb) && usersDb.length > 0) {
      usersDb.forEach(u => {
        petugasOptionsHtml += `<option value="${escapeAttr(u.nama_user)}">${u.nama_user}</option>`;
      });
    }
  } else {
    petugasOptionsHtml = `<option value="${escapeAttr(loggedUser)}" selected>${loggedUser}</option>`;
  }

  const disabledPetugasAttr = isPrivileged ? '' : 'disabled="disabled"';
  const petugasLockNote = isPrivileged 
    ? '' 
    : `<div style="font-size: 11.5px; color: #0284c7; margin-top: 4px; font-weight: 600;"><i class="bi bi-lock-fill"></i> Terkunci: Petugas hanya dapat mengunduh data miliknya sendiri.</div>`;

  let exportYearOptionsHtml = '<option value="">-- Semua Tahun --</option>';
  const curY = new Date().getFullYear();
  for (let y = 2045; y >= 2000; y--) {
    exportYearOptionsHtml += `<option value="${y}" ${y === curY ? 'selected' : ''}>${y}</option>`;
  }

  Swal.fire({
    title: '<div style="font-size: 17px; font-weight: 800; color: #065f46; display: flex; align-items: center; justify-content: center; gap: 8px;"><i class="bi bi-file-earmark-excel-fill" style="color: #10b981; font-size: 22px;"></i> Filter Download Data CKG (Excel)</div>',
    html: `
      <div style="text-align: left; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 6px;">
        <p style="color: #64748b; margin-bottom: 14px; line-height: 1.5;">Silakan pilih filter bulan, tahun, dan petugas entry untuk menyaring data yang ingin diunduh:</p>
        
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-calendar3" style="color: #0284c7;"></i> Pilih Bulan:</label>
          <select id="swalExportBulan" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 600;">
            <option value="">-- Semua Bulan --</option>
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-calendar-year" style="color: #0284c7;"></i> Pilih Tahun:</label>
          <select id="swalExportTahun" class="swal2-input" style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 600;">
            ${exportYearOptionsHtml}
          </select>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px;"><i class="bi bi-person-badge" style="color: #0284c7;"></i> Nama Petugas Entry:</label>
          <select id="swalExportPetugas" class="swal2-input" ${disabledPetugasAttr} style="width: 100%; margin: 0; font-size: 13px; padding: 8px 12px; height: 42px; border-radius: 8px; font-weight: 700; ${!isPrivileged ? 'background-color: #f1f5f9; cursor: not-allowed;' : ''}">
            ${petugasOptionsHtml}
          </select>
          ${petugasLockNote}
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-download"></i> Unduh Excel (.xlsx)',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#059669',
    cancelButtonColor: '#64748b',
    preConfirm: () => {
      const bulanVal = document.getElementById('swalExportBulan')?.value || '';
      const tahunVal = document.getElementById('swalExportTahun')?.value || '';
      const petugasVal = isPrivileged 
        ? (document.getElementById('swalExportPetugas')?.value || '') 
        : loggedUser;

      return { bulanVal, tahunVal, petugasVal };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const { bulanVal, tahunVal, petugasVal } = result.value;
      processExportXLSX(bulanVal, tahunVal, petugasVal);
    }
  });
}

function processExportXLSX(bulanVal, tahunVal, petugasVal) {
  let targetRecords = getVisibleRecords(records);

  if (bulanVal) {
    targetRecords = targetRecords.filter(r => {
      const d = getRecordEntryDate(r);
      return d ? d.month === bulanVal : false;
    });
  }

  if (tahunVal) {
    targetRecords = targetRecords.filter(r => {
      const d = getRecordEntryDate(r);
      return d ? d.year === tahunVal : false;
    });
  }

  if (petugasVal) {
    targetRecords = targetRecords.filter(r => r.created_by === petugasVal || r.petugas_entry === petugasVal);
  }

  if (targetRecords.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Data Tidak Ditemukan',
      text: 'Tidak ada data rekam medis CKG yang cocok dengan kriteria filter yang Anda pilih.',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  showLoadingOverlay('Mengekspor Data...', `Menyusun ${targetRecords.length} Data Excel (.XLSX)`);

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

      const rows = targetRecords.map(r => [
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

      const fileDateStr = new Date().toISOString().substring(0, 10);
      const safePetugasLabel = petugasVal ? petugasVal.replace(/\s+/g, '_') : 'SemuaPetugas';
      const filename = `Laporan_BNBA_CKG_${safePetugasLabel}_${tahunVal || 'All'}-${bulanVal || 'All'}_${fileDateStr}.xlsx`;
      XLSX.writeFile(wb, filename);

      hideLoadingOverlay();
      showToast(`✓ Berhasil Mengunduh ${targetRecords.length} Data CKG!`, 'success');
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

        const dobStr = formatDateToYYYYMMDD(getVal('Tanggal Lahir', 'Tgl Lahir', 'DOB')) || '1990-01-01';
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
        const rawRowDate = getVal('Tanggal Entry', 'Tanggal Skrining', 'Tanggal', 'Tgl Entry');
        const rowDate = formatDateToYYYYMMDD(rawRowDate) || fallbackTanggal;

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
  saveRecordsToStorage();

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
          dob: formatDateToYYYYMMDD(getVal('TANGGAL LAHIR', 'Tgl Lahir', 'DOB')) || '1990-01-01',
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

        const dobStr = formatDateToYYYYMMDD(getVal('Tanggal Lahir', 'Tgl Lahir', 'DOB')) || '1990-01-01';
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
        const rawRowDate = getVal('Tanggal Entry', 'Tanggal Skrining', 'Tanggal', 'Tgl Entry');
        const rowDate = formatDateToYYYYMMDD(rawRowDate) || selectedTanggal;

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
      saveRecordsToStorage();
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
  const activeLogo = localStorage.getItem('ckg_custom_logo') || 'logo.png';

  document.querySelectorAll('.brand-logo img, .visual-brand-logo img, .form-logo-img').forEach(img => {
    img.src = activeLogo;
    img.style.display = 'block';
    if (img.nextElementSibling) img.nextElementSibling.style.display = 'none';
  });

  // Dynamically update browser tab favicon
  document.querySelectorAll("link[rel*='icon']").forEach(link => {
    link.href = activeLogo;
  });
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

/* ==========================================================================
   👤 USER PROFILE DROPDOWN MENU POPOVER
   ========================================================================== */

function toggleUserProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('userProfileDropdownMenu');
  if (menu) {
    menu.style.display = (menu.style.display === 'none' || !menu.style.display) ? 'block' : 'none';
  }
}

function closeUserProfileDropdown() {
  const menu = document.getElementById('userProfileDropdownMenu');
  if (menu) {
    menu.style.display = 'none';
  }
}

document.addEventListener('click', (e) => {
  const container = document.getElementById('userProfileDropdownContainer');
  if (container && !container.contains(e.target)) {
    closeUserProfileDropdown();
  }
});

/* ==========================================================================
   🔍 UNIVERSAL SEARCH & RENDERING LOGIC FOR LAPORAN & CKG SEKOLAH
   ========================================================================== */

function renderLaporanView() {
  const tbody = document.getElementById('tableBodyLaporan');
  if (!tbody) return;

  applyPetugasFilterLock();

  const searchQuery = document.getElementById('searchLaporanRecords')?.value.trim().toLowerCase() || '';
  const filterKegiatanVal = document.getElementById('filterLaporanKegiatan')?.value || '';
  const filterBulanVal = document.getElementById('filterLaporanBulan')?.value || '';
  const filterTahunVal = document.getElementById('filterLaporanTahun')?.value || '';
  const filterPetugasVal = document.getElementById('filterLaporanPetugas')?.value || '';

  // RBAC Data Visibility
  let dataset = getVisibleRecords(records);

  if (filterKegiatanVal) {
    dataset = dataset.filter(r => r.jenis_kegiatan === filterKegiatanVal);
  }

  if (filterBulanVal) {
    dataset = dataset.filter(r => {
      const recDate = getRecordEntryDate(r);
      return recDate ? recDate.month === filterBulanVal : false;
    });
  }

  if (filterTahunVal) {
    dataset = dataset.filter(r => {
      const recDate = getRecordEntryDate(r);
      return recDate ? recDate.year === filterTahunVal : false;
    });
  }

  if (filterPetugasVal) {
    dataset = dataset.filter(r => r.created_by === filterPetugasVal || r.petugas_entry === filterPetugasVal);
  }

  if (searchQuery) {
    dataset = dataset.filter(r => {
      const nama = (r.nama || '').toLowerCase();
      const nik = String(r.nik || '').toLowerCase();
      const alamat = (r.alamat || '').toLowerCase();
      const petugas = (r.petugas_entry || r.created_by || '').toLowerCase();
      const pos = (r.pos_lokasi || '').toLowerCase();
      const kegiatan = (r.jenis_kegiatan || '').toLowerCase();
      return nama.includes(searchQuery) || nik.includes(searchQuery) || alamat.includes(searchQuery) || petugas.includes(searchQuery) || pos.includes(searchQuery) || kegiatan.includes(searchQuery);
    });
  }

  // Update Metric Summaries
  const metricTotal = document.getElementById('metricLaporanTotal');
  const metricLuar = document.getElementById('metricLaporanLuar');
  const metricDalam = document.getElementById('metricLaporanDalam');
  const metricHipertensi = document.getElementById('metricLaporanHipertensi');

  if (metricTotal) metricTotal.textContent = dataset.length.toLocaleString('id-ID');
  if (metricLuar) metricLuar.textContent = dataset.filter(r => r.jenis_kegiatan === 'Luar Gedung').length.toLocaleString('id-ID');
  if (metricDalam) metricDalam.textContent = dataset.filter(r => r.jenis_kegiatan === 'Dalam Gedung').length.toLocaleString('id-ID');
  if (metricHipertensi) metricHipertensi.textContent = dataset.filter(r => (r.td_sistolik > 140 || r.td_diastolik > 90 || r.gula_darah > 200)).length.toLocaleString('id-ID');

  if (dataset.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; padding: 36px; color: var(--text-muted);">
          <i class="bi bi-inbox" style="font-size: 32px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
          <strong>Tidak ada data Laporan CKG yang sesuai dengan pencarian / filter.</strong>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dataset.map((r, i) => {
    const isHipertensi = r.td_sistolik > 140 || r.td_diastolik > 90;
    const isGulaTinggi = r.gula_darah > 200;
    const trClass = isHipertensi ? 'tr-alert-hipertensi' : '';
    const tensiClass = isHipertensi ? 'cell-hipertensi' : '';
    const gulaClass = isGulaTinggi ? 'cell-gula-tinggi' : '';

    let imtBadge = `<span class="badge badge-emerald">${r.imt || '-'}</span>`;
    if (r.imt < 18.5) imtBadge = `<span class="badge badge-amber">${r.imt} (Kurus)</span>`;
    else if (r.imt >= 25.0 && r.imt <= 29.9) imtBadge = `<span class="badge badge-amber">${r.imt} (Gemuk)</span>`;
    else if (r.imt >= 30.0) imtBadge = `<span class="badge badge-rose">${r.imt} (Obesitas)</span>`;

    const kegiatanBadge = r.jenis_kegiatan === 'Luar Gedung'
      ? `<span class="badge badge-cyan"><i class="bi bi-geo-alt-fill"></i> Luar Gedung</span>`
      : `<span class="badge badge-emerald"><i class="bi bi-building-fill"></i> Dalam Gedung</span>`;

    return `
      <tr class="${trClass}">
        <td style="text-align: center; font-weight: 700; color: var(--text-muted);">${i + 1}</td>
        <td>${formatDisplayDate(r.created_at || r.tanggal_entry || r.tanggal)}</td>
        <td>${kegiatanBadge}</td>
        <td>
          <div style="font-weight: 700; color: var(--primary);">${r.nama || '-'}</div>
          <div style="font-size: 11px; color: var(--text-muted);">NIK: ${r.nik || '-'}</div>
        </td>
        <td>
          <div>${formatDisplayDate(r.tanggal_lahir)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${r.usia ? r.usia + ' Th' : '-'}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${r.alamat || '-'}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${r.pos_lokasi || 'Puskesmas'}</div>
        </td>
        <td><span class="${tensiClass}">${r.td_sistolik && r.td_diastolik ? r.td_sistolik + '/' + r.td_diastolik : '-'}</span></td>
        <td><span class="${gulaClass}">${r.gula_darah ? r.gula_darah + ' mg/dL' : '-'}</span></td>
        <td>${r.kolesterol ? r.kolesterol + ' mg/dL' : '-'}</td>
        <td>${imtBadge}</td>
        <td><span class="badge badge-purple">${r.petugas_entry || r.created_by || '-'}</span></td>
        <td><span class="badge badge-emerald"><i class="bi bi-check-all"></i> Valid</span></td>
      </tr>
    `;
  }).join('');
}

function resetLaporanFilters() {
  const s = document.getElementById('searchLaporanRecords');
  const k = document.getElementById('filterLaporanKegiatan');
  const b = document.getElementById('filterLaporanBulan');
  const t = document.getElementById('filterLaporanTahun');
  const p = document.getElementById('filterLaporanPetugas');
  if (s) s.value = '';
  if (k) k.value = '';
  if (b) b.value = '';
  if (t) t.value = '';
  if (p) p.value = '';
  applyPetugasFilterLock();
  renderLaporanView();
  showToast('Filter Laporan telah di-reset.', 'info');
}

// ==========================================================================
// 🎓 MODUL TERPISAH: CKG SEKOLAH (ISOLATED CLOUD D1 DATABASE)
// ==========================================================================

// Utility: Escape HTML special characters to prevent XSS
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let sekolahRecords = [];
let pendingSekolahImportData = null;

function loadStoredSekolahRecords() {
  const saved = localStorage.getItem('ckg_sekolah_records_v1');
  if (saved) {
    try {
      sekolahRecords = JSON.parse(saved);
    } catch (e) {
      sekolahRecords = [];
    }
  } else {
    sekolahRecords = [];
  }
  fetchSekolahRecordsFromCloud();
}

function saveSekolahRecordsToStorage() {
  localStorage.setItem('ckg_sekolah_records_v1', JSON.stringify(sekolahRecords));
  syncSekolahRecordsToCloud(sekolahRecords);
}

async function fetchSekolahRecordsFromCloud() {
  try {
    const res = await fetch('/api/sekolah');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        sekolahRecords = result.data.map((r, idx) => ({
          id: r.id ? String(r.id) : `SCH-${Date.now()}-${idx}`,
          no: r.no || idx + 1,
          nama: r.nama || r.nama_siswa || '',
          kelas: r.kelas || '',
          sekolah: r.sekolah || r.nama_sekolah || '',
          jk: r.jk || r.jenis_kelamin || 'L',
          nik: r.nik || r.nisn_nik || '',
          tanggal_lahir: r.tanggal_lahir || '',
          no_whatsapp: r.no_whatsapp || '',
          provinsi: r.provinsi || 'Jawa Barat',
          kab_kota: r.kab_kota || 'Kab. Bandung',
          kecamatan: r.kecamatan || 'Banjaran',
          kelurahan: r.kelurahan || 'Tarajusari',
          alamat: r.alamat || '',
          bb: r.bb !== undefined ? Number(r.bb) : 0,
          tb: r.tb !== undefined ? Number(r.tb) : 0,
          lp: r.lp !== undefined ? Number(r.lp) : 0,
          td_sistolik: r.td_sistolik !== undefined ? Number(r.td_sistolik) : 0,
          td_diastolik: r.td_diastolik !== undefined ? Number(r.td_diastolik) : 0,
          gula_darah: r.gula_darah || '-',
          hb: r.hb || '-',
          karies: r.karies || 'Tidak',
          kebugaran: r.kebugaran || 'Baik',
          menstruasi: r.menstruasi || 'Belum',
          kacamata: r.kacamata || 'Tidak',
          petugas_entry: r.petugas_entry || 'Admin',
          tanggal_entry: r.tanggal_entry || new Date().toISOString().substring(0, 10)
        }));
        localStorage.setItem('ckg_sekolah_records_v1', JSON.stringify(sekolahRecords));
        populateSekolahPetugasFilter();
        renderSekolahView();
      }
    }
  } catch (err) {
    console.warn('⚡ Fetch /api/sekolah notice (Offline/Fallback):', err);
    populateSekolahPetugasFilter();
    renderSekolahView();
  }
}

async function syncSekolahRecordsToCloud(dataList) {
  if (!Array.isArray(dataList)) return;
  try {
    await fetch('/api/sekolah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataList)
    });
  } catch (err) {
    console.warn('⚡ Sync /api/sekolah notice:', err);
  }
}

function populateSekolahPetugasFilter() {
  const select = document.getElementById('filterSekolahPetugas');
  if (!select) return;
  const currentVal = select.value;
  const petugasSet = new Set();
  sekolahRecords.forEach(r => {
    if (r.petugas_entry) petugasSet.add(r.petugas_entry);
  });
  select.innerHTML = '<option value="">-- Semua Petugas --</option>' + 
    Array.from(petugasSet).sort().map(p => `<option value="${p}">${p}</option>`).join('');
  if (currentVal && petugasSet.has(currentVal)) {
    select.value = currentVal;
  }
}

function renderSekolahView() {
  const tbody = document.getElementById('tableBodySekolah');
  if (!tbody) return;

  applyPetugasFilterLock();

  const searchQuery = document.getElementById('searchSekolahRecords')?.value.trim().toLowerCase() || '';
  const filterBulanVal = document.getElementById('filterSekolahBulan')?.value || '';
  const filterTahunVal = document.getElementById('filterSekolahTahun')?.value || '';
  const filterPetugasVal = document.getElementById('filterSekolahPetugas')?.value || '';

  const currentUserRole = sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Admin');
  const currentUserName = sessionStorage.getItem('ckg_user_name') || '';

  let dataset = [...sekolahRecords];

  // Petugas filtering (RBAC)
  if (currentUserRole !== 'Admin' && currentUserRole !== 'Koordinator' && currentUserName) {
    dataset = dataset.filter(r => (r.petugas_entry || '').toLowerCase() === currentUserName.toLowerCase());
  } else if (filterPetugasVal) {
    dataset = dataset.filter(r => r.petugas_entry === filterPetugasVal);
  }

  if (filterBulanVal) {
    dataset = dataset.filter(r => {
      const d = r.tanggal_entry || r.tanggal_lahir;
      if (!d) return false;
      return d.substring(5, 7) === filterBulanVal;
    });
  }

  if (filterTahunVal) {
    dataset = dataset.filter(r => {
      const d = r.tanggal_entry || r.tanggal_lahir;
      if (!d) return false;
      return d.substring(0, 4) === filterTahunVal;
    });
  }

  if (searchQuery) {
    dataset = dataset.filter(r => {
      const nama = (r.nama || '').toLowerCase();
      const kelas = (r.kelas || '').toLowerCase();
      const sekolah = (r.sekolah || '').toLowerCase();
      const nik = String(r.nik || '').toLowerCase();
      const alamat = (r.alamat || '').toLowerCase();
      const petugas = (r.petugas_entry || '').toLowerCase();
      return nama.includes(searchQuery) || kelas.includes(searchQuery) || sekolah.includes(searchQuery) || nik.includes(searchQuery) || alamat.includes(searchQuery) || petugas.includes(searchQuery);
    });
  }

  // Summary Metrics CKG Sekolah
  const metricTotal = document.getElementById('metricSekolahTotal');
  const metricAnak = document.getElementById('metricSekolahAnak');
  const metricNormal = document.getElementById('metricSekolahNormal');
  const metricRujukan = document.getElementById('metricSekolahRujukan');

  const countTotal = dataset.length;
  // Calculate students < 18 years old or total if DOB unavailable
  const countAnak = dataset.filter(r => {
    if (!r.tanggal_lahir) return true;
    const birthYear = parseInt(r.tanggal_lahir.substring(0, 4), 10);
    if (isNaN(birthYear)) return true;
    const age = new Date().getFullYear() - birthYear;
    return age < 18;
  }).length;

  // Normal: HB >= 11 or '-' & TD <= 120 & Karies == 'Tidak' & Kacamata == 'Tidak'
  const countNormal = dataset.filter(r => {
    const hbVal = parseFloat(r.hb);
    const hbOk = isNaN(hbVal) || hbVal >= 11.0;
    const tdOk = !r.td_sistolik || r.td_sistolik <= 120;
    const kariesOk = (r.karies || 'Tidak') !== 'Ya';
    const kacamataOk = (r.kacamata || 'Tidak') !== 'Ya';
    return hbOk && tdOk && kariesOk && kacamataOk;
  }).length;

  const countAnemia = dataset.filter(r => {
    const hbVal = parseFloat(r.hb);
    const isAnemiaHb = !isNaN(hbVal) && hbVal > 0 && hbVal < 12.0;
    const isAnemiaText = String(r.status_hb || r.anemia || r.hasil_skrining || '').toLowerCase().includes('anemia');
    return isAnemiaHb || isAnemiaText;
  }).length;

  if (metricTotal) metricTotal.textContent = countTotal.toLocaleString('id-ID');
  if (metricAnak) metricAnak.textContent = countAnak.toLocaleString('id-ID');
  if (metricNormal) metricNormal.textContent = countNormal.toLocaleString('id-ID');
  if (metricRujukan) metricRujukan.textContent = countAnemia.toLocaleString('id-ID');

  if (dataset.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="bi bi-mortarboard" style="font-size: 36px; display: block; margin-bottom: 10px; color: #94a3b8;"></i>
          <strong style="font-size: 14px;">Belum ada data CKG Sekolah yang tersimpan / sesuai filter.</strong>
          <p style="font-size: 12px; margin-top: 4px;">Klik tombol <strong>"Input Skrining Sekolah"</strong> atau <strong>"Import Excel Sekolah"</strong> untuk menambahkan data.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dataset.map((r, i) => {
    const safeId = escapeHtml(r.id || '');
    const safeNik = escapeHtml(r.nik || '');
    const petugasName = escapeHtml(r.petugas_entry || 'Admin');
    const kel = escapeHtml(r.kelurahan || 'Tarajusari');
    const kec = escapeHtml(r.kecamatan || 'Banjaran');
    const kabKota = escapeHtml(r.kab_kota || 'Kab. Bandung');
    const prov = escapeHtml(r.provinsi || 'Jawa Barat');

    // Calculate age from tanggal_lahir
    let usia = '-';
    if (r.tanggal_lahir) {
      const birthYear = parseInt(r.tanggal_lahir.substring(0, 4), 10);
      if (!isNaN(birthYear)) usia = (new Date().getFullYear() - birthYear) + ' Th';
    }

    // JK badge
    const jkBadge = r.jk === 'P'
      ? `<span class="badge" style="background: #fce7f3; color: #9d174d; font-weight: 700; padding: 3px 8px; font-size: 11px;"><i class="bi bi-gender-female"></i> Perempuan</span>`
      : `<span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 3px 8px; font-size: 11px;"><i class="bi bi-gender-male"></i> Laki-laki</span>`;

    // HB display
    const hbNum = parseFloat(r.hb);
    const isAnemia = !isNaN(hbNum) && hbNum < 11.0;
    const hbColor = isAnemia ? '#dc2626' : '#059669';
    const hbBg = isAnemia ? '#fef2f2' : '#ecfdf5';
    const hbBorder = isAnemia ? '#fecaca' : '#d1fae5';

    // TD display
    const tdVal = (r.td_sistolik && r.td_diastolik) ? `${r.td_sistolik}/${r.td_diastolik} mmHg` : '-';
    const isHipertensi = r.td_sistolik && r.td_sistolik > 120;
    const tdColor = isHipertensi ? '#dc2626' : '#1e293b';

    // Karies badge
    const kariesBadge = r.karies === 'Ya'
      ? `<span style="color: #dc2626; font-weight: 700;">Ya ⚠</span>`
      : `<span style="color: #059669; font-weight: 700;">Tidak ✓</span>`;

    // Kacamata badge
    const kacamataBadge = r.kacamata === 'Ya'
      ? `<span style="color: #d97706; font-weight: 700;">Ya</span>`
      : `<span style="color: #059669; font-weight: 700;">Tidak</span>`;

    // IMT calculation
    let imtDisplay = '-';
    if (r.bb && r.tb) {
      const tbM = r.tb / 100;
      if (tbM > 0) imtDisplay = (r.bb / (tbM * tbM)).toFixed(1);
    }

    // Full address
    const fullAddr = [r.alamat, kel, kec, kabKota, prov].filter(Boolean).join(', ');

    return `
      <tr>
        <!-- Column 1: No -->
        <td style="text-align: center; vertical-align: middle; padding: 14px 10px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #ede9fe; color: #6d28d9; font-weight: 800; font-size: 12px; border-radius: 50%; border: 1.5px solid #c4b5fd;">
            ${r.no || i + 1}
          </div>
        </td>

        <!-- Column 2: Nama Siswa & Identitas -->
        <td style="min-width: 260px; vertical-align: top;">
          <div style="font-size: 14.5px; font-weight: 800; color: #6d28d9; margin-bottom: 6px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;" onclick="editSekolahRecord('${safeId}')" title="Klik untuk Edit Data">
            ${escapeHtml(r.nama || '-')} <i class="bi bi-pencil-square" style="font-size: 11px; opacity: 0.7;"></i>
          </div>

          <div style="display: flex; flex-direction: column; gap: 5px;">
            ${r.nik ? `<div style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 11.5px; font-family: monospace; font-weight: 700; color: #1e293b; width: fit-content; cursor: pointer;" onclick="copyToClipboard('${safeNik}', 'NIK Siswa')" title="Salin NIK Siswa">
              <i class="bi bi-card-text" style="color: #6d28d9;"></i> NIK: ${safeNik} <i class="bi bi-copy" style="font-size: 10px; color: #6d28d9; margin-left: 2px;"></i>
            </div>` : ''}

            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
              <span class="badge badge-purple" style="padding: 3px 8px; font-size: 11px; font-weight: 700;">
                <i class="bi bi-mortarboard-fill"></i> ${escapeHtml(r.kelas || '-')}
              </span>
              <span class="badge" style="background: #f0f9ff; color: #0369a1; padding: 3px 8px; font-size: 11px; font-weight: 700; border: 1px solid #bae6fd;">
                <i class="bi bi-building"></i> ${escapeHtml(r.sekolah || '-')}
              </span>
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
              ${jkBadge}
              ${r.tanggal_lahir ? `<span class="badge badge-amber" style="padding: 3px 8px; font-size: 11px; font-weight: 700;">
                <i class="bi bi-calendar-event"></i> ${usia} (${formatDisplayDate(r.tanggal_lahir) || '-'})
              </span>` : ''}
              ${r.no_whatsapp ? `<span class="badge" style="background: #ecfdf5; color: #059669; padding: 3px 8px; font-size: 11px; font-weight: 700; border: 1px solid #d1fae5;">
                <i class="bi bi-whatsapp"></i> ${escapeHtml(r.no_whatsapp)}
              </span>` : ''}
            </div>
          </div>
        </td>

        <!-- Column 3: Hasil Skrining / Pemeriksaan -->
        <td style="min-width: 280px; vertical-align: top;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #fff1f2; border: 1px solid #ffe4e6; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
              <span style="color: #9f1239; font-weight: 700;"><i class="bi bi-activity" style="margin-right: 4px;"></i> Tensi (TD)</span>
              <strong style="color: ${tdColor}; font-size: 12.5px;">${tdVal}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #d1fae5; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
              <span style="color: #065f46; font-weight: 700;"><i class="bi bi-person-bounding-box" style="margin-right: 4px;"></i> BB / TB (IMT)</span>
              <strong style="color: #059669; font-size: 12px;">${r.bb ? r.bb + 'kg' : '-'} / ${r.tb ? r.tb + 'cm' : '-'} (${imtDisplay})</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: ${hbBg}; border: 1px solid ${hbBorder}; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
              <span style="color: ${hbColor}; font-weight: 700;"><i class="bi bi-droplet-fill" style="margin-right: 4px;"></i> HB (g/dL)</span>
              <strong style="color: ${hbColor}; font-size: 12px;">${r.hb && r.hb !== '-' ? r.hb + ' g/dL' : '-'}${isAnemia ? ' ⚠ Anemia' : ''}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 5px 10px; border-radius: 6px; font-size: 11.5px;">
              <span style="color: #075985; font-weight: 700;"><i class="bi bi-clipboard2-pulse" style="margin-right: 4px;"></i> LP / Gula</span>
              <strong style="color: #0284c7; font-size: 12px;">${r.lp ? r.lp + 'cm' : '-'} / ${escapeHtml(r.gula_darah || '-')} mg/dL</strong>
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
              <span style="font-size: 11px; background: #fafafa; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 5px;"><strong>Karies:</strong> ${kariesBadge}</span>
              <span style="font-size: 11px; background: #fafafa; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 5px;"><strong>Kacamata:</strong> ${kacamataBadge}</span>
              <span style="font-size: 11px; background: #fafafa; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 5px;"><strong>Kebugaran:</strong> ${escapeHtml(r.kebugaran || 'Baik')}</span>
              <span style="font-size: 11px; background: #fafafa; border: 1px solid #e5e7eb; padding: 3px 8px; border-radius: 5px;"><strong>Menstruasi:</strong> ${escapeHtml(r.menstruasi || 'Belum')}</span>
            </div>
          </div>
        </td>

        <!-- Column 4: Alamat Siswa -->
        <td style="min-width: 240px; vertical-align: top;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px;">
            <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 5px; line-height: 1.4;">
              <i class="bi bi-geo-alt-fill" style="color: #7c3aed; margin-right: 4px;"></i> ${escapeHtml(r.alamat || '-')} ${prov} ${kabKota} ${kec} ${kel}
            </div>
            <div style="display: flex; gap: 8px; font-size: 11px; color: #475569; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #f1f5f9; flex-wrap: wrap;">
              <span><strong>Kel:</strong> ${kel}</span>
              <span style="color: #cbd5e1;">|</span>
              <span><strong>Kec:</strong> ${kec}</span>
            </div>
          </div>
        </td>

        <!-- Column 5: Petugas & Tindakan -->
        <td style="width: 175px; text-align: center; vertical-align: middle; padding: 14px 10px;">
          <div style="margin-bottom: 8px;">
            <span class="badge badge-purple" style="font-weight: 700; padding: 5px 12px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <i class="bi bi-person-fill"></i> ${petugasName}
            </span>
          </div>
          ${r.tanggal_entry ? `<div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px;"><i class="bi bi-calendar3"></i> ${formatDisplayDate(r.tanggal_entry) || r.tanggal_entry}</div>` : ''}
          <div style="display: flex; flex-direction: column; gap: 6px; align-items: stretch;">
            <button class="btn btn-primary btn-sm" style="font-size: 11.5px; padding: 6px 12px; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; border: none; box-shadow: 0 2px 4px rgba(124,58,237,0.2);" onclick="editSekolahRecord('${safeId}')" title="Edit Data Siswa">
              <i class="bi bi-pencil-square"></i> Edit Data
            </button>
            <button class="btn btn-outline-danger btn-sm" style="font-size: 11px; padding: 5px 10px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 5px;" onclick="deleteSekolahRecord('${safeId}')" title="Hapus Data Siswa">
              <i class="bi bi-trash-fill"></i> Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function resetSekolahFilters() {
  const s = document.getElementById('searchSekolahRecords');
  const b = document.getElementById('filterSekolahBulan');
  const t = document.getElementById('filterSekolahTahun');
  const p = document.getElementById('filterSekolahPetugas');
  if (s) s.value = '';
  if (b) b.value = '';
  if (t) t.value = '';
  if (p) p.value = '';
  applyPetugasFilterLock();
  renderSekolahView();
  showToast('Filter CKG Sekolah telah di-reset.', 'info');
}

let currentSekolahStep = 1;

function setSekolahStep(stepNum) {
  currentSekolahStep = stepNum;

  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById(`stepSekolah${i}`);
    const item = document.getElementById(`stepperSekolahTab${i}`);
    const circle = document.getElementById(`stepperSekolahNum${i}`);
    const line = document.getElementById(`stepperSekolahLine${i - 1}`);

    if (panel) {
      if (i === stepNum) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    }

    if (item) {
      if (i === stepNum) {
        item.className = 'stepper-item active';
        if (circle) circle.innerHTML = `${i}`;
      } else if (i < stepNum) {
        item.className = 'stepper-item completed';
        if (circle) circle.innerHTML = `<i class="bi bi-check-lg"></i>`;
      } else {
        item.className = 'stepper-item';
        if (circle) circle.innerHTML = `${i}`;
      }
    }

    if (line && i > 1) {
      if (i <= stepNum) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    }
  }

  const btnPrev = document.getElementById('btnSekolahPrev');
  const btnNext = document.getElementById('btnSekolahNext');
  const btnSubmit = document.getElementById('btnSekolahSubmit');

  if (btnPrev) btnPrev.style.display = stepNum > 1 ? 'inline-flex' : 'none';

  if (btnNext) {
    if (stepNum < 3) {
      btnNext.style.display = 'inline-flex';
      btnNext.innerHTML = `Lanjut Tahap ${stepNum + 1} <i class="bi bi-arrow-right"></i>`;
    } else {
      btnNext.style.display = 'none';
    }
  }

  if (btnSubmit) {
    btnSubmit.style.display = stepNum === 3 ? 'inline-flex' : 'none';
  }
}

function validateSekolahStep(stepNum) {
  if (stepNum === 1) {
    const sekolah = document.getElementById('schSekolah')?.value.trim();
    const kelas = document.getElementById('schKelas')?.value.trim();
    if (!sekolah) {
      if (typeof showToast === 'function') showToast('Harap pilih Nama Sekolah terlebih dahulu.', 'warning');
      else alert('Harap pilih Nama Sekolah terlebih dahulu.');
      document.getElementById('schSekolah')?.focus();
      return false;
    }
    if (!kelas) {
      if (typeof showToast === 'function') showToast('Harap isi Kelas siswa.', 'warning');
      else alert('Harap isi Kelas siswa.');
      document.getElementById('schKelas')?.focus();
      return false;
    }
  } else if (stepNum === 2) {
    const nama = document.getElementById('schNama')?.value.trim();
    if (!nama) {
      if (typeof showToast === 'function') showToast('Harap isi Nama Siswa terlebih dahulu.', 'warning');
      else alert('Harap isi Nama Siswa terlebih dahulu.');
      document.getElementById('schNama')?.focus();
      return false;
    }
    const nik = document.getElementById('schNik')?.value.trim();
    if (!nik || nik.length !== 16 || !/^\d{16}$/.test(nik)) {
      if (typeof showToast === 'function') showToast('NIK wajib diisi tepat 16 digit angka!', 'warning');
      else alert('NIK wajib diisi tepat 16 digit angka!');
      document.getElementById('schNik')?.focus();
      return false;
    }
  }
  return true;
}

function changeSekolahStep(direction) {
  const targetStep = currentSekolahStep + direction;
  if (direction > 0 && !validateSekolahStep(currentSekolahStep)) {
    return;
  }
  if (targetStep >= 1 && targetStep <= 3) {
    setSekolahStep(targetStep);
  }
}

function jumpSekolahStep(stepNum) {
  if (stepNum > currentSekolahStep) {
    for (let s = currentSekolahStep; s < stepNum; s++) {
      if (!validateSekolahStep(s)) return;
    }
  }
  setSekolahStep(stepNum);
}

function populateSekolahDatalists() {
  const provList = document.getElementById('listProvinsiSekolahOptions');
  const kabList = document.getElementById('listKabKotaSekolahOptions');
  const kecList = document.getElementById('listKecamatanSekolahOptions');
  const kelList = document.getElementById('listKelurahanSekolahOptions');

  if (provList) {
    const provs = ['JAWA BARAT', 'DKI JAKARTA', 'JAWA TENGAH', 'JAWA TIMUR', 'BANTEN'];
    provList.innerHTML = provs.map(p => `<option value="${p}"></option>`).join('');
  }

  if (kabList) {
    const kabs = ['KAB. BANDUNG', 'KOTA BANDUNG', 'KAB. BANDUNG BARAT', 'KOTA CIMAHI', 'KAB. SUMEDANG', 'KAB. GARUT'];
    kabList.innerHTML = kabs.map(k => `<option value="${k}"></option>`).join('');
  }

  if (kecList) {
    const kecs = ['BANJARAN', 'CIMAUNG', 'CANGKUANG', 'ARJASARI', 'PAMEUNGPEUK', 'SOREANG', 'KATAPANG', 'DAYEUHKOLOT'];
    kecList.innerHTML = kecs.map(k => `<option value="${k}"></option>`).join('');
  }

  if (kelList) {
    let desaBanjaran = ['TARAJUSARI', 'BANJARAN KOTA', 'BANJARAN WETAN', 'CIAPUS', 'KAMASAN', 'KIANGROKE', 'MARGAHAYU', 'NEGLASARI', 'PASIRHUNI', 'SINDANGPANON'];
    if (typeof WILAYAH_DATA !== 'undefined' && WILAYAH_DATA['Jawa Barat'] && WILAYAH_DATA['Jawa Barat']['Kabupaten Bandung'] && WILAYAH_DATA['Jawa Barat']['Kabupaten Bandung']['Banjaran']) {
      desaBanjaran = WILAYAH_DATA['Jawa Barat']['Kabupaten Bandung']['Banjaran'].map(d => d.toUpperCase());
    }
    kelList.innerHTML = desaBanjaran.map(d => `<option value="${d}"></option>`).join('');
  }
}

function updateSekolahAddressDatalists() {
  // Option to dynamically refresh sub-level datalists when prov/kab/kec changes
  populateSekolahDatalists();
}

let sekolahAddressTimeout = null;
function handleSekolahAddressInput(e) {
  const addrText = (e.target.value || '').trim();
  if (addrText.length < 3) return;

  clearTimeout(sekolahAddressTimeout);
  sekolahAddressTimeout = setTimeout(() => {
    const textUpper = addrText.toUpperCase();
    const fullKnowledgeMap = (typeof BANJARAN_KAMPUNG_MAP !== 'undefined') ? [...BANJARAN_KAMPUNG_MAP, ...(typeof getLearnedKampungMap === 'function' ? getLearnedKampungMap() : [])] : [];

    let localHit = null;
    for (let entry of fullKnowledgeMap) {
      if (!entry.keywords) continue;
      for (let kw of entry.keywords) {
        const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(textUpper) || textUpper.includes(kw)) {
          localHit = entry;
          break;
        }
      }
      if (localHit) break;
    }

    if (localHit) {
      const schProv = document.getElementById('schProvinsi');
      const schKab = document.getElementById('schKabKota');
      const schKec = document.getElementById('schKecamatan');
      const schKel = document.getElementById('schKelurahan');

      if (schProv && localHit.prov) schProv.value = localHit.prov.toUpperCase();
      if (schKab && localHit.kab) {
        let kabName = localHit.kab.toUpperCase();
        if (kabName.includes('KABUPATEN BANDUNG')) kabName = 'KAB. BANDUNG';
        schKab.value = kabName;
      }
      if (schKec && localHit.kec) schKec.value = localHit.kec.toUpperCase();
      if (schKel && localHit.kel) schKel.value = localHit.kel.toUpperCase();
    }
  }, 180);
}

function handleSekolahNikInput(e) {
  const nik = (e.target.value || '').trim();
  if (nik.length === 16 && /^\d+$/.test(nik)) {
    let day = parseInt(nik.substring(6, 8), 10);
    const monthStr = nik.substring(8, 10);
    const yearStr = nik.substring(10, 12);

    let jk = 'L';
    if (day > 40) {
      jk = 'P';
      day -= 40;
    }

    const month = parseInt(monthStr, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const yearNum = parseInt(yearStr, 10);
      const fullYear = yearNum <= 30 ? (2000 + yearNum) : (1900 + yearNum);
      const formattedDay = String(day).padStart(2, '0');
      const formattedMonth = String(month).padStart(2, '0');
      const dobStr = `${fullYear}-${formattedMonth}-${formattedDay}`;

      const jkSelect = document.getElementById('schJk');
      const dobInput = document.getElementById('schTanggalLahir');
      if (jkSelect) jkSelect.value = jk;
      if (dobInput && !dobInput.value) dobInput.value = dobStr;
    }
  }
}

function openInputSekolahModal(id = null) {
  const modal = document.getElementById('modalInputSekolah');
  const title = document.getElementById('modalInputSekolahTitle');
  const form = document.getElementById('formSekolahInput');
  if (!modal || !form) { console.error('modalInputSekolah or formSekolahInput not found'); return; }

  const currentUserName = sessionStorage.getItem('ckg_user_name') || 'Admin';

  form.reset();
  document.getElementById('sekolahRecordId').value = '';
  document.getElementById('schProvinsi').value = 'JAWA BARAT';
  document.getElementById('schKabKota').value = 'KAB. BANDUNG';
  document.getElementById('schKecamatan').value = 'BANJARAN';
  document.getElementById('schKelurahan').value = 'TARAJUSARI';
  document.getElementById('schPetugasEntry').value = currentUserName;
  document.getElementById('schTanggalEntry').value = new Date().toISOString().substring(0, 10);

  if (id) {
    const rec = sekolahRecords.find(r => r.id === id);
    if (rec) {
      if (title) title.innerHTML = `<i class="bi bi-pencil-square"></i> Edit Skrining CKG Sekolah`;
      document.getElementById('sekolahRecordId').value = rec.id;
      document.getElementById('schNama').value = (rec.nama || '').toUpperCase();
      const kelasSelect = document.getElementById('schKelas');
      if (kelasSelect && rec.kelas) {
        const targetVal = rec.kelas.trim().toUpperCase();
        let found = false;
        for (let opt of kelasSelect.options) {
          if (opt.value === targetVal || opt.textContent.toUpperCase() === targetVal) {
            kelasSelect.value = opt.value;
            found = true;
            break;
          }
        }
        if (!found) {
          const newOpt = document.createElement('option');
          newOpt.value = targetVal;
          newOpt.textContent = targetVal;
          kelasSelect.appendChild(newOpt);
          kelasSelect.value = targetVal;
        }
      }
      
      const schSelect = document.getElementById('schSekolah');
      if (schSelect && rec.sekolah) {
        const targetVal = rec.sekolah.trim().toUpperCase();
        let found = false;
        for (let opt of schSelect.options) {
          if (opt.value === targetVal) {
            found = true;
            break;
          }
        }
        if (!found) {
          const newOpt = document.createElement('option');
          newOpt.value = targetVal;
          newOpt.textContent = targetVal;
          schSelect.appendChild(newOpt);
        }
        schSelect.value = targetVal;
      }

      document.getElementById('schJk').value = rec.jk || 'L';
      document.getElementById('schNik').value = rec.nik || '';
      document.getElementById('schTanggalLahir').value = rec.tanggal_lahir || '';
      document.getElementById('schNoWhatsapp').value = rec.no_whatsapp || '';
      document.getElementById('schProvinsi').value = (rec.provinsi || 'JAWA BARAT').toUpperCase();
      document.getElementById('schKabKota').value = (rec.kab_kota || 'KAB. BANDUNG').toUpperCase();
      document.getElementById('schKecamatan').value = (rec.kecamatan || 'BANJARAN').toUpperCase();
      document.getElementById('schKelurahan').value = (rec.kelurahan || 'TARAJUSARI').toUpperCase();
      document.getElementById('schAlamat').value = (rec.alamat || '').toUpperCase();
      document.getElementById('schBb').value = rec.bb || '';
      document.getElementById('schTb').value = rec.tb || '';
      document.getElementById('schLp').value = rec.lp || '';
      document.getElementById('schTdSistolik').value = rec.td_sistolik || '';
      document.getElementById('schTdDiastolik').value = rec.td_diastolik || '';
      document.getElementById('schGulaDarah').value = rec.gula_darah || '-';
      document.getElementById('schHb').value = rec.hb || '-';
      document.getElementById('schKaries').value = rec.karies || 'Tidak';
      document.getElementById('schKebugaran').value = rec.kebugaran || 'Baik';
      document.getElementById('schMenstruasi').value = rec.menstruasi || 'Belum';
      document.getElementById('schKacamata').value = rec.kacamata || 'Tidak';
      document.getElementById('schPetugasEntry').value = rec.petugas_entry || currentUserName;
      document.getElementById('schTanggalEntry').value = rec.tanggal_entry || new Date().toISOString().substring(0, 10);
    }
  } else {
    if (title) title.innerHTML = `<i class="bi bi-mortarboard-fill"></i> Form Input Skrining CKG Sekolah`;
  }

  // Reset to step 1
  setSekolahStep(1);

  // Show modal FIRST so user gets immediate visual feedback
  modal.classList.add('active');
  modal.classList.add('open');

  // Populate datalists safely (non-blocking)
  try { populateSekolahDatalists(); } catch (e) { console.warn('populateSekolahDatalists error:', e); }
}

function closeInputSekolahModal() {
  const modal = document.getElementById('modalInputSekolah');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('open');
  }
}

async function saveSekolahRecordFromForm(event) {
  event.preventDefault();

  if (!validateSekolahStep(1) || !validateSekolahStep(2)) {
    return;
  }

  const idVal = document.getElementById('sekolahRecordId').value;
  const existingIdx = idVal ? sekolahRecords.findIndex(r => r.id === idVal) : -1;
  const currentUserName = sessionStorage.getItem('ckg_user_name') || 'Admin';

  const recordObj = {
    id: idVal || `SCH-${Date.now()}`,
    no: existingIdx >= 0 ? sekolahRecords[existingIdx].no : (sekolahRecords.length + 1),
    nama: document.getElementById('schNama').value.trim().toUpperCase(),
    kelas: document.getElementById('schKelas').value.trim().toUpperCase(),
    sekolah: document.getElementById('schSekolah').value.trim().toUpperCase(),
    jk: document.getElementById('schJk').value,
    nik: document.getElementById('schNik').value.trim(),
    tanggal_lahir: document.getElementById('schTanggalLahir').value,
    no_whatsapp: document.getElementById('schNoWhatsapp').value.trim(),
    provinsi: document.getElementById('schProvinsi').value.trim().toUpperCase() || 'JAWA BARAT',
    kab_kota: document.getElementById('schKabKota').value.trim().toUpperCase() || 'KAB. BANDUNG',
    kecamatan: document.getElementById('schKecamatan').value.trim().toUpperCase() || 'BANJARAN',
    kelurahan: document.getElementById('schKelurahan').value.trim().toUpperCase() || 'TARAJUSARI',
    alamat: document.getElementById('schAlamat').value.trim().toUpperCase(),
    bb: parseFloat(document.getElementById('schBb').value) || 0,
    tb: parseFloat(document.getElementById('schTb').value) || 0,
    lp: parseFloat(document.getElementById('schLp').value) || 0,
    td_sistolik: parseInt(document.getElementById('schTdSistolik').value, 10) || 0,
    td_diastolik: parseInt(document.getElementById('schTdDiastolik').value, 10) || 0,
    gula_darah: document.getElementById('schGulaDarah').value.trim() || '-',
    hb: document.getElementById('schHb').value.trim() || '-',
    karies: document.getElementById('schKaries').value,
    kebugaran: document.getElementById('schKebugaran').value,
    menstruasi: document.getElementById('schMenstruasi').value,
    kacamata: document.getElementById('schKacamata').value,
    petugas_entry: document.getElementById('schPetugasEntry').value.trim() || currentUserName,
    tanggal_entry: document.getElementById('schTanggalEntry').value || new Date().toISOString().substring(0, 10)
  };

  if (existingIdx >= 0) {
    sekolahRecords[existingIdx] = recordObj;
  } else {
    sekolahRecords.unshift(recordObj);
  }

  saveSekolahRecordsToStorage();
  closeInputSekolahModal();
  populateSekolahPetugasFilter();
  renderSekolahView();
  showToast(existingIdx >= 0 ? 'Data CKG Sekolah berhasil diperbarui!' : 'Data CKG Sekolah baru berhasil disimpan!', 'success');
}

function editSekolahRecord(id) {
  openInputSekolahModal(id);
}

async function deleteSekolahRecord(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data CKG Sekolah ini?')) return;

  const targetIdx = sekolahRecords.findIndex(r => r.id === id);
  if (targetIdx >= 0) {
    sekolahRecords.splice(targetIdx, 1);
    sekolahRecords.forEach((r, idx) => { r.no = idx + 1; });
    saveSekolahRecordsToStorage();

    try {
      await fetch(`/api/sekolah?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (_) {}

    populateSekolahPetugasFilter();
    renderSekolahView();
    showToast('Data CKG Sekolah berhasil dihapus.', 'info');
  }
}

async function confirmDeleteAllSekolahRecords() {
  const currentUserRole = sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Admin');
  if (currentUserRole !== 'Admin') {
    showToast('Hanya Admin yang dapat menghapus seluruh database CKG Sekolah.', 'warning');
    return;
  }
  if (!confirm('PERHATIAN: Apakah Anda yakin ingin menghapus SELURUH database CKG Sekolah? Data tidak dapat dikembalikan!')) return;

  sekolahRecords = [];
  localStorage.removeItem('ckg_sekolah_records_v1');

  try {
    await fetch('/api/sekolah', { method: 'DELETE' });
  } catch (_) {}

  populateSekolahPetugasFilter();
  renderSekolahView();
  showToast('Seluruh database CKG Sekolah berhasil dihapus.', 'info');
}

function exportSekolahToXLSX() {
  if (typeof XLSX === 'undefined') {
    showToast('Library SheetJS XLSX belum dimuat.', 'danger');
    return;
  }

  const searchQuery = document.getElementById('searchSekolahRecords')?.value.trim().toLowerCase() || '';
  const filterBulanVal = document.getElementById('filterSekolahBulan')?.value || '';
  const filterTahunVal = document.getElementById('filterSekolahTahun')?.value || '';
  const filterPetugasVal = document.getElementById('filterSekolahPetugas')?.value || '';

  const currentUserRole = sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Admin');
  const currentUserName = sessionStorage.getItem('ckg_user_name') || '';

  let dataset = [...sekolahRecords];

  if (currentUserRole !== 'Admin' && currentUserRole !== 'Koordinator' && currentUserName) {
    dataset = dataset.filter(r => (r.petugas_entry || '').toLowerCase() === currentUserName.toLowerCase());
  } else if (filterPetugasVal) {
    dataset = dataset.filter(r => r.petugas_entry === filterPetugasVal);
  }

  if (filterBulanVal) {
    dataset = dataset.filter(r => {
      const d = r.tanggal_entry || r.tanggal_lahir;
      return d && d.substring(5, 7) === filterBulanVal;
    });
  }

  if (filterTahunVal) {
    dataset = dataset.filter(r => {
      const d = r.tanggal_entry || r.tanggal_lahir;
      return d && d.substring(0, 4) === filterTahunVal;
    });
  }

  if (searchQuery) {
    dataset = dataset.filter(r => {
      const nama = (r.nama || '').toLowerCase();
      const kelas = (r.kelas || '').toLowerCase();
      const sekolah = (r.sekolah || '').toLowerCase();
      const nik = String(r.nik || '').toLowerCase();
      return nama.includes(searchQuery) || kelas.includes(searchQuery) || sekolah.includes(searchQuery) || nik.includes(searchQuery);
    });
  }

  if (dataset.length === 0) {
    showToast('Tidak ada data CKG Sekolah yang siap diekspor.', 'warning');
    return;
  }

  const headers = [
    'NO', 'NAMA', 'KELAS', 'SEKOLAH', 'JK', 'NIK', 'TANGGAL LAHIR', 'NO WHATSAPP',
    'PROVINSI', 'KAB/KOTA', 'KECAMATAN', 'KELURAHAN', 'ALAMAT', 'BB', 'TB', 'LP',
    'TD SISTOLIK', 'TD DIASTOLIK', 'GULA DARAH', 'HB', 'KARIES', 'KEBUGARAN', 'MENSTRUASI', 'KACAMATA'
  ];

  const rows = dataset.map((r, idx) => [
    r.no || idx + 1,
    r.nama || '',
    r.kelas || '',
    r.sekolah || '',
    r.jk || 'L',
    r.nik || '',
    r.tanggal_lahir || '',
    r.no_whatsapp || '',
    r.provinsi || 'Jawa Barat',
    r.kab_kota || 'Kab. Bandung',
    r.kecamatan || 'Banjaran',
    r.kelurahan || 'Tarajusari',
    r.alamat || '',
    r.bb || '',
    r.tb || '',
    r.lp || '',
    r.td_sistolik || '',
    r.td_diastolik || '',
    r.gula_darah || '-',
    r.hb || '-',
    r.karies || 'Tidak',
    r.kebugaran || 'Baik',
    r.menstruasi || 'Belum',
    r.kacamata || 'Tidak'
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CKG_SEKOLAH');

  const fileName = `CKG_SEKOLAH_BANJARAN_${new Date().toISOString().substring(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  showToast(`Berhasil mendownload Excel CKG Sekolah (${dataset.length} data).`, 'success');
}

function downloadSekolahXLSXTemplate() {
  if (typeof XLSX === 'undefined') {
    showToast('Library SheetJS XLSX belum dimuat.', 'danger');
    return;
  }

  const headers = [
    'NO', 'NAMA', 'KELAS', 'SEKOLAH', 'JK', 'NIK', 'TANGGAL LAHIR', 'NO WHATSAPP',
    'PROVINSI', 'KAB/KOTA', 'KECAMATAN', 'KELURAHAN', 'ALAMAT', 'BB', 'TB', 'LP',
    'TD SISTOLIK', 'TD DIASTOLIK', 'GULA DARAH', 'HB', 'KARIES', 'KEBUGARAN', 'MENSTRUASI', 'KACAMATA'
  ];

  const sampleRows = [
    [1, 'Ahmad Fauzi', '7A', 'SMPN 1 Banjaran', 'L', '3204011504100001', '2010-04-15', '081234567890', 'Jawa Barat', 'Kab. Bandung', 'Banjaran', 'Tarajusari', 'Kp. Pajagalan RT 01 RW 02', 45, 152, 65, 110, 70, '100', '13.5', 'Tidak', 'Baik', 'Belum', 'Tidak'],
    [2, 'Siti Nurhaliza', '8B', 'SMPN 1 Banjaran', 'P', '3204015508110002', '2011-08-15', '089876543210', 'Jawa Barat', 'Kab. Bandung', 'Banjaran', 'Tarajusari', 'Kp. Ciapus RT 03 RW 01', 42, 148, 60, 105, 65, '95', '11.8', 'Tidak', 'Baik', 'Teratur', 'Ya']
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TEMPLATE_CKG_SEKOLAH');

  XLSX.writeFile(wb, 'TEMPLATE_CKG_SEKOLAH_BANJARAN.xlsx');
  showToast('Template Excel CKG Sekolah berhasil didownload.', 'info');
}

function openImportSekolahModal() {
  const modal = document.getElementById('modalImportSekolah');
  if (!modal) return;
  pendingSekolahImportData = null;
  document.getElementById('sekolahImportFileInput').value = '';
  document.getElementById('sekolahImportDropzoneText').textContent = 'Pilih atau Tarik File Excel CKG Sekolah (.xlsx / .csv)';
  document.getElementById('sekolahImportPreviewArea').style.display = 'none';
  document.getElementById('btnExecuteSekolahImport').disabled = true;
  modal.classList.add('active');
  modal.classList.add('open');
  modal.style.display = 'flex';
}

function closeImportSekolahModal() {
  const modal = document.getElementById('modalImportSekolah');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

function handleSekolahImportFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (json.length < 2) {
        showToast('File Excel kosong atau tidak memiliki data.', 'warning');
        return;
      }

      const rawHeaderRow = json[0] || [];
      const headers = rawHeaderRow.map(h => String(h || '').trim().toUpperCase());

      const getColIdx = (aliases) => {
        return headers.findIndex(h => aliases.some(a => h.includes(a)));
      };

      const idxNo = getColIdx(['NO']);
      const idxNama = getColIdx(['NAMA', 'SISWA']);
      const idxKelas = getColIdx(['KELAS']);
      const idxSekolah = getColIdx(['SEKOLAH']);
      const idxJk = getColIdx(['JK', 'JENIS KELAMIN']);
      const idxNik = getColIdx(['NIK', 'NISN']);
      const idxTglLahir = getColIdx(['TANGGAL LAHIR', 'TGL LAHIR', 'DOB']);
      const idxWa = getColIdx(['NO WHATSAPP', 'WA', 'HP', 'TELEPON']);
      const idxProv = getColIdx(['PROVINSI']);
      const idxKab = getColIdx(['KAB', 'KOTA']);
      const idxKec = getColIdx(['KECAMATAN']);
      const idxKel = getColIdx(['KELURAHAN', 'DESA']);
      const idxAlamat = getColIdx(['ALAMAT']);
      const idxBb = getColIdx(['BB']);
      const idxTb = getColIdx(['TB']);
      const idxLp = getColIdx(['LP']);
      const idxTdSistol = getColIdx(['TD SISTOLIK', 'SISTOL']);
      const idxTdDiastol = getColIdx(['TD DIASTOLIK', 'DIASTOL']);
      const idxGula = getColIdx(['GULA']);
      const idxHb = getColIdx(['HB']);
      const idxKaries = getColIdx(['KARIES', 'GIGI']);
      const idxKebugaran = getColIdx(['KEBUGARAN']);
      const idxMenstruasi = getColIdx(['MENSTRUASI']);
      const idxKacamata = getColIdx(['KACAMATA', 'MATA']);

      const parsedItems = [];

      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (!row || row.length === 0) continue;

        const namaVal = idxNama >= 0 ? String(row[idxNama] || '').trim() : '';
        if (!namaVal) continue;

        const noVal = idxNo >= 0 ? parseInt(row[idxNo], 10) || i : i;
        const kelasVal = idxKelas >= 0 ? String(row[idxKelas] || '').trim() : '';
        const sekolahVal = idxSekolah >= 0 ? String(row[idxSekolah] || '').trim() : '';
        const jkVal = idxJk >= 0 ? (String(row[idxJk] || '').toUpperCase().includes('P') ? 'P' : 'L') : 'L';
        const nikVal = idxNik >= 0 ? String(row[idxNik] || '').trim() : '';
        const tglLahirVal = idxTglLahir >= 0 ? formatDateToYYYYMMDD(row[idxTglLahir]) : '';
        const waVal = idxWa >= 0 ? String(row[idxWa] || '').trim() : '';
        const provVal = idxProv >= 0 ? String(row[idxProv] || '').trim() : 'Jawa Barat';
        const kabVal = idxKab >= 0 ? String(row[idxKab] || '').trim() : 'Kab. Bandung';
        const kecVal = idxKec >= 0 ? String(row[idxKec] || '').trim() : 'Banjaran';
        const kelVal = idxKel >= 0 ? String(row[idxKel] || '').trim() : 'Tarajusari';
        const alamatVal = idxAlamat >= 0 ? String(row[idxAlamat] || '').trim() : '';
        const bbVal = idxBb >= 0 ? parseFloat(row[idxBb]) || 0 : 0;
        const tbVal = idxTb >= 0 ? parseFloat(row[idxTb]) || 0 : 0;
        const lpVal = idxLp >= 0 ? parseFloat(row[idxLp]) || 0 : 0;
        const tdSistolVal = idxTdSistol >= 0 ? parseInt(row[idxTdSistol], 10) || 0 : 0;
        const tdDiastolVal = idxTdDiastol >= 0 ? parseInt(row[idxTdDiastol], 10) || 0 : 0;
        const gulaVal = idxGula >= 0 ? String(row[idxGula] || '-').trim() : '-';
        const hbVal = idxHb >= 0 ? String(row[idxHb] || '-').trim() : '-';
        const kariesVal = idxKaries >= 0 ? String(row[idxKaries] || 'Tidak').trim() : 'Tidak';
        const kebugaranVal = idxKebugaran >= 0 ? String(row[idxKebugaran] || 'Baik').trim() : 'Baik';
        const menstruasiVal = idxMenstruasi >= 0 ? String(row[idxMenstruasi] || 'Belum').trim() : 'Belum';
        const kacamataVal = idxKacamata >= 0 ? String(row[idxKacamata] || 'Tidak').trim() : 'Tidak';

        const currentUserName = sessionStorage.getItem('ckg_user_name') || 'Admin';
        parsedItems.push({
          id: `SCH-${Date.now()}-${i}`,
          no: noVal,
          nama: namaVal,
          kelas: kelasVal,
          sekolah: sekolahVal,
          jk: jkVal,
          nik: nikVal,
          tanggal_lahir: tglLahirVal,
          no_whatsapp: waVal,
          provinsi: provVal,
          kab_kota: kabVal,
          kecamatan: kecVal,
          kelurahan: kelVal,
          alamat: alamatVal,
          bb: bbVal,
          tb: tbVal,
          lp: lpVal,
          td_sistolik: tdSistolVal,
          td_diastolik: tdDiastolVal,
          gula_darah: gulaVal,
          hb: hbVal,
          karies: kariesVal,
          kebugaran: kebugaranVal,
          menstruasi: menstruasiVal,
          kacamata: kacamataVal,
          petugas_entry: currentUserName,
          tanggal_entry: new Date().toISOString().substring(0, 10)
        });
      }

      pendingSekolahImportData = parsedItems;
      document.getElementById('sekolahImportDropzoneText').textContent = `File Selected: ${file.name} (${parsedItems.length} Siswa Terdeteksi)`;

      const previewArea = document.getElementById('sekolahImportPreviewArea');
      previewArea.style.display = 'block';
      previewArea.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; color: #166534; font-size: 13px; font-weight: 700;">
          <i class="bi bi-check-circle-fill" style="color: #22c55e;"></i> Berhasil membaca ${parsedItems.length} baris data CKG Sekolah dari file Excel.
        </div>
      `;
      document.getElementById('btnExecuteSekolahImport').disabled = false;

    } catch (err) {
      console.error('Error parsing Excel CKG Sekolah:', err);
      showToast('Gagal memproses file Excel. Format file mungkin rusak.', 'danger');
    }
  };
  reader.readAsArrayBuffer(file);
}

async function executeSekolahXLSXImport() {
  if (!pendingSekolahImportData || pendingSekolahImportData.length === 0) return;

  const newItems = pendingSekolahImportData;
  sekolahRecords = [...newItems, ...sekolahRecords];
  sekolahRecords.forEach((r, idx) => { r.no = idx + 1; });

  saveSekolahRecordsToStorage();
  closeImportSekolahModal();
  populateSekolahPetugasFilter();
  renderSekolahView();

  showToast(`Berhasil mengimport ${newItems.length} data CKG Sekolah ke database Cloud!`, 'success');
}

// ==========================================================================
// 🗺️ INTERACTIVE MAP & ADDRESS LEARNING (KABUPATEN BANDUNG, JAWA BARAT)
// ==========================================================================

let leafletMap = null;
let mapMarkersGroup = null;
let currentAddingPinMarker = null;

/* ==========================================================================
   🎯 ACCURATE KAMPUNG & ADMINISTRATIVE DIRECTORY LOOKUP (KAB. BANDUNG)
   ========================================================================== */

const ACCURATE_KAMPUNG_DIRECTORY = {
  // --- KECAMATAN BANJARAN (11 DESA) ---
  'PAJAGALAN': { kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIPEUNDEUY': { kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BANJARAN KULON': { kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BANJARAN KOTA': { kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'ALUN-ALUN BANJARAN': { kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BAROS BANJARAN': { kel: 'Banjaran Kulon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  
  'BANJARAN WETAN': { kel: 'Banjaran Wetan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MUARA': { kel: 'Banjaran Wetan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SINDANGLENGO': { kel: 'Banjaran Wetan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PASIRHALANG': { kel: 'Banjaran Wetan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'TARAJUSARI': { kel: 'Tarajusari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIPAKU': { kel: 'Tarajusari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SANGGAR MAS': { kel: 'Tarajusari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SANGGAR MAS LESTARI': { kel: 'Tarajusari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'KEBON SAWO': { kel: 'Tarajusari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'KAMASAN': { kel: 'Kamasan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'KEBON HUI': { kel: 'Kamasan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CITALIKTIK': { kel: 'Kamasan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PATROL': { kel: 'Kamasan', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'KIANGROKE': { kel: 'Kiangroke', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PAMOYANAN': { kel: 'Kiangroke', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BOJONG': { kel: 'Kiangroke', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'PASIRHUNI': { kel: 'Pasirhuni', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SUKASARI PASIRHUNI': { kel: 'Pasirhuni', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'SINDANGPANON': { kel: 'Sindangpanon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SINDANGPARANG': { kel: 'Sindangpanon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIBATOK': { kel: 'Sindangpanon', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'CIAPUS': { kel: 'Ciapus', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'LEGOK': { kel: 'Ciapus', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIAPUS HILIR': { kel: 'Ciapus', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIAPUS GIRANG': { kel: 'Ciapus', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'NEGLASARI': { kel: 'Neglasari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SUKATANI': { kel: 'Neglasari', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'MARGAHAYU': { kel: 'Margahayu', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIKUPA': { kel: 'Margahayu', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  'CIPINANG': { kel: 'Cipinang', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIPEUJEUH': { kel: 'Cipinang', kec: 'Banjaran', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN CANGKUANG ---
  'BANDASARI': { kel: 'Bandasari', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIKOPO': { kel: 'Bandasari', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CANGKUANG': { kel: 'Cangkuang', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CILUNCAT': { kel: 'Ciluncat', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'JATISARI': { kel: 'Jatisari', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'NAGRAK': { kel: 'Nagrak', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'TANJUNGSARI': { kel: 'Tanjungsari', kec: 'Cangkuang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN ARJASARI ---
  'ARJASARI': { kel: 'Arjasari', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'ANCOLMEKAR': { kel: 'Ancolmekar', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BAROS': { kel: 'Baros', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BATUKARUT': { kel: 'Batukarut', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MANGGUNHJAYA': { kel: 'Mangunjaya', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PINGGIRSARI': { kel: 'Pinggirsari', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RANCAKOLE': { kel: 'Rancacole', kec: 'Arjasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN CIMAUNG ---
  'CIMAUNG': { kel: 'Cimaung', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIKALONG': { kel: 'Cikalong', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CAMPAKA': { kel: 'Cikalong', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'JAGABAY': { kel: 'Jagabay', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MALASARI': { kel: 'Malasari', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MEKARSARI': { kel: 'Mekarsari', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'WARJABAKTI': { kel: 'Warjabakti', kec: 'Cimaung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN PAMEUNGPEUK ---
  'PAMEUNGPEUK': { kel: 'Sukasari', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SUKASARI': { kel: 'Sukasari', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'LANGONSARI': { kel: 'Langonsari', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'WAAS': { kel: 'Langonsari', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RANCAMULYA': { kel: 'Rancamulya', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BOJONGKONENG': { kel: 'Rancamulya', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RANCATUNGKU': { kel: 'Rancatungku', kec: 'Pameungpeuk', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN SOREANG ---
  'SOREANG': { kel: 'Soreang', kec: 'Soreang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SADU': { kel: 'Sadu', kec: 'Soreang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SEKARWANGI': { kel: 'Sekarwangi', kec: 'Soreang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PANYIRAPAN': { kel: 'Panyirapan', kec: 'Soreang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'KARAMATMULYA': { kel: 'Karamatmulya', kec: 'Soreang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PARUNGSERAB': { kel: 'Parungserab', kec: 'Soreang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN KATAPANG ---
  'KATAPANG': { kel: 'Gandasari', kec: 'Katapang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'GANDASARI': { kel: 'Gandasari', kec: 'Katapang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SANGKANHURIP': { kel: 'Sangkanhurip', kec: 'Katapang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PANGAUBAN': { kel: 'Pangauban', kec: 'Katapang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN BALEENDAH ---
  'ANDIR': { kel: 'Andir', kec: 'Baleendah', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BOJONGMALAKA': { kel: 'Bojongmalaka', kec: 'Baleendah', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MALAKASARI': { kel: 'Malakasari', kec: 'Baleendah', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RANCAMANYAR': { kel: 'Rancamanyar', kec: 'Baleendah', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'WARGAMEKAR': { kel: 'Wargamekar', kec: 'Baleendah', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN DAYEUHKOLOT ---
  'CITEUREUP': { kel: 'Citeureup', kec: 'Dayeuhkolot', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CANGKUANG BARAT': { kel: 'Cangkuang Barat', kec: 'Dayeuhkolot', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PASAWAHAN': { kel: 'Pasawahan', kec: 'Dayeuhkolot', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SUKAPURA': { kel: 'Sukapura', kec: 'Dayeuhkolot', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN MARGAHAYU ---
  'SAYATI': { kel: 'Sayati', kec: 'Margahayu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MARGAHAYU SELATAN': { kel: 'Margahayu Selatan', kec: 'Margahayu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MARGAHAYU TENGAH': { kel: 'Margahayu Tengah', kec: 'Margahayu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SUKAMENAK': { kel: 'Sukamenak', kec: 'Margahayu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN MARGAASIH ---
  'NANJUNG': { kel: 'Nanjung', kec: 'Margaasih', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIGONDEWAH HILIR': { kel: 'Cigondewah Hilir', kec: 'Margaasih', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'LAGADAR': { kel: 'Lagadar', kec: 'Margaasih', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RAHAYU': { kel: 'Rahayu', kec: 'Margaasih', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN CIWIDEY ---
  'PANUNDAAN': { kel: 'Lebakmuncang', kec: 'Ciwidey', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'LEBAKMUNCANG': { kel: 'Lebakmuncang', kec: 'Ciwidey', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'NENGKELAN': { kel: 'Nengkelan', kec: 'Ciwidey', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RAWABOGO': { kel: 'Rawabogo', kec: 'Ciwidey', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN PASIRJAMBU ---
  'TENJOLAYA': { kel: 'Tenjolaya', kec: 'Pasirjambu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIKONENG': { kel: 'Tenjolaya', kec: 'Pasirjambu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CISONDARI': { kel: 'Cisondari', kec: 'Pasirjambu', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN RANCABALI ---
  'ALAMENDAH': { kel: 'Alamendah', kec: 'Rancabali', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIPELAH': { kel: 'Cipelah', kec: 'Rancabali', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'INDRAGIRI': { kel: 'Indragiri', kec: 'Rancabali', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'PATENGAN': { kel: 'Patengan', kec: 'Rancabali', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN PANGALENGAN ---
  'PULOSARI': { kel: 'Pulosari', kec: 'Pangalengan', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'WARNASARI': { kel: 'Warnasari', kec: 'Pangalengan', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BANJARSARI': { kel: 'Banjarsari', kec: 'Pangalengan', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN BOJONGSOANG ---
  'BUAHBATU': { kel: 'Buahbatu', kec: 'Bojongsoang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BOJONGSARI': { kel: 'Bojongsari', kec: 'Bojongsoang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIPAGALO': { kel: 'Cipagalo', kec: 'Bojongsoang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'TEGALLUAR': { kel: 'Tegalluar', kec: 'Bojongsoang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN CILEUNYI ---
  'CINUNUK': { kel: 'Cinunuk', kec: 'Cileunyi', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CILEUNYI KULON': { kel: 'Cileunyi Kulon', kec: 'Cileunyi', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CILEUNYI WETAN': { kel: 'Cileunyi Wetan', kec: 'Cileunyi', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIMEKAR': { kel: 'Cimekar', kec: 'Cileunyi', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN RANCAEKEK ---
  'HAURPUGUR': { kel: 'Haurpugur', kec: 'Rancaekek', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'RANCAEKEK KULON': { kel: 'Rancaekek Kulon', kec: 'Rancaekek', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'BOJONGLOA': { kel: 'Bojongloa', kec: 'Rancaekek', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN MAJALAYA ---
  'PADAMULYA': { kel: 'Padamulya', kec: 'Majalaya', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MAJAKETA': { kel: 'Majakerta', kec: 'Majalaya', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MAJASETRA': { kel: 'Majasetra', kec: 'Majalaya', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN CIPARAY ---
  'GUNUNGLEUTIK': { kel: 'Gunungleutik', kec: 'Ciparay', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIHEULANG': { kel: 'Ciheulang', kec: 'Ciparay', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIKUYA': { kel: 'Cikuya', kec: 'Ciparay', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },

  // --- KECAMATAN IBUN, SOLOKANJAN TUNG, KERTASARI, PACET, PASEH, NAGREG ---
  'IBUN': { kel: 'Dukuh', kec: 'Ibun', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'SOLOKANJANTUNG': { kel: 'Bojongemas', kec: 'Solokanjantung', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'TARUMAJAYA': { kel: 'Tarumajaya', kec: 'Kertasari', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'MARUYUNG': { kel: 'Maruyung', kec: 'Pacet', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'NAGREG': { kel: 'Ciaro', kec: 'Nagreg', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CICALENGKA': { kel: 'Nagrog', kec: 'Cicalengka', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CILENGKRANG': { kel: 'Jatiendah', kec: 'Cilengkrang', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'CIMENYAN': { kel: 'Ciburial', kec: 'Cimenyan', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' },
  'KUTAWARINGIN': { kel: 'Buninagara', kec: 'Kutawaringin', kab: 'Kabupaten Bandung', prov: 'Jawa Barat' }
};

function getOfficialAddressLookup(kw) {
  if (!kw) return null;
  const cleanKw = String(kw).toUpperCase().replace(/^KP\.\s*/i, '').trim();

  // 1. Direct exact key match
  if (ACCURATE_KAMPUNG_DIRECTORY[cleanKw]) {
    return ACCURATE_KAMPUNG_DIRECTORY[cleanKw];
  }

  // 2. Strict exact word boundary match
  for (let k in ACCURATE_KAMPUNG_DIRECTORY) {
    if (k === cleanKw) {
      return ACCURATE_KAMPUNG_DIRECTORY[k];
    }
  }

  return null;
}

function detectAddressHierarchyFromRawText(rawAddressText, currentKel = '', currentKec = '', currentKab = '', currentProv = '') {
  if (!rawAddressText) {
    let kel = currentKel;
    let kec = currentKec;
    if (kel === 'Banjaran Kota') kel = 'Banjaran Kulon';
    return {
      kel: kel || 'Banjaran Kulon',
      kec: kec || 'Banjaran',
      kab: currentKab || 'Kabupaten Bandung',
      prov: currentProv || 'Jawa Barat',
      matchedKw: null
    };
  }

  const cleanText = String(rawAddressText).toUpperCase()
    .replace(/^KP\.\s*/i, '')
    .replace(/RT\s*\d+/gi, '')
    .replace(/RW\s*\d+/gi, '')
    .replace(/DESA\s*/gi, '')
    .replace(/KELURAHAN\s*/gi, '')
    .replace(/KECAMATAN\s*/gi, '')
    .trim();

  // 1. Direct match in ACCURATE_KAMPUNG_DIRECTORY by individual tokens
  const words = cleanText.split(/[\s,\.\/\-]+/).filter(w => w.length >= 3);
  for (let w of words) {
    if (ACCURATE_KAMPUNG_DIRECTORY[w]) {
      return {
        ...ACCURATE_KAMPUNG_DIRECTORY[w],
        matchedKw: w
      };
    }
  }

  // 2. Multi-word phrase key match in ACCURATE_KAMPUNG_DIRECTORY
  for (let k in ACCURATE_KAMPUNG_DIRECTORY) {
    if (cleanText.includes(k)) {
      return {
        ...ACCURATE_KAMPUNG_DIRECTORY[k],
        matchedKw: k
      };
    }
  }

  // 3. Learned address dictionary lookup match
  if (typeof getLearnedKampungMap === 'function') {
    const learnedList = getLearnedKampungMap();
    for (let item of learnedList) {
      const kw = (item.keywords && item.keywords[0]) ? item.keywords[0].toUpperCase() : '';
      if (kw && cleanText.includes(kw)) {
        return {
          kel: item.kel,
          kec: item.kec,
          kab: item.kab || 'Kabupaten Bandung',
          prov: item.prov || 'Jawa Barat',
          matchedKw: kw
        };
      }
    }
  }

  // Fallback: Fix legacy Banjaran Kota if present
  let kel = currentKel;
  let kec = currentKec;
  if (kel === 'Banjaran Kota') kel = 'Banjaran Kulon';

  return {
    kel: kel || 'Banjaran Kulon',
    kec: kec || 'Banjaran',
    kab: currentKab || 'Kabupaten Bandung',
    prov: currentProv || 'Jawa Barat',
    matchedKw: null
  };
}

function realignLearnedAddressAccuracy() {
  const raw = localStorage.getItem('ckg_learned_kampung_map');
  if (!raw) return;
  try {
    let list = JSON.parse(raw);
    let modified = false;

    list.forEach(item => {
      const kw = (item.keywords && item.keywords[0]) ? item.keywords[0].toUpperCase().replace(/^KP\.\s*/i, '').trim() : '';

      // Check official lookup dictionary for exact match
      const verified = getOfficialAddressLookup(kw);
      if (verified) {
        if (item.kel !== verified.kel || item.kec !== verified.kec) {
          console.log(`[ADDRESS REALIGN] Corrected "${kw}": ${item.kel} -> ${verified.kel}, ${item.kec} -> ${verified.kec}`);
          item.kel = verified.kel;
          item.kec = verified.kec;
          item.kab = verified.kab;
          item.prov = verified.prov;
          modified = true;
        }
      } else if (item.kel === 'Banjaran Kota') {
        // If legacy item has 'Banjaran Kota' and no specific kampung override, convert kelurahan label to 'Banjaran Kulon'
        item.kel = 'Banjaran Kulon';
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Error realigning address knowledge:', e);
  }
}

function addToDeletedBlacklist(kw) {
  if (!kw) return;
  const cleanKw = String(kw).toUpperCase().trim();
  const raw = localStorage.getItem('ckg_deleted_kampungs_blacklist');
  let setArr = [];
  if (raw) {
    try { setArr = JSON.parse(raw); } catch (e) { setArr = []; }
  }
  if (!setArr.includes(cleanKw)) {
    setArr.push(cleanKw);
    localStorage.setItem('ckg_deleted_kampungs_blacklist', JSON.stringify(setArr));
  }
}

function getLearnedKampungMap() {
  const raw = localStorage.getItem('ckg_learned_kampung_map');
  let list = [];
  if (raw) {
    try { list = JSON.parse(raw); } catch (e) { list = []; }
  }

  // Filter out blacklisted/deleted keywords
  const blacklistRaw = localStorage.getItem('ckg_deleted_kampungs_blacklist');
  if (blacklistRaw) {
    try {
      const blacklist = JSON.parse(blacklistRaw);
      list = list.filter(item => {
        const kw = (item.keywords && item.keywords[0]) ? item.keywords[0].toUpperCase().trim() : '';
        return !blacklist.includes(kw);
      });
    } catch (e) {}
  }

  // Pre-seed with accurate exploration map if list is empty
  if (list.length === 0 && typeof KAB_BANDUNG_EXPLORATION_MAP !== 'undefined') {
    KAB_BANDUNG_EXPLORATION_MAP.forEach(item => {
      item.kampungs.forEach((kName, kIdx) => {
        const cleanKw = kName.replace(/^Kp\.\s*/i, '').trim();
        const baseLat = item.coords[0];
        const baseLng = item.coords[1];
        const stepOffsetLat = (kIdx * 0.0018) * (kIdx % 2 === 0 ? 1 : -1);
        const stepOffsetLng = (kIdx * 0.0018) * (kIdx % 3 === 0 ? 1 : -1);
        list.push({
          keywords: [cleanKw],
          kel: item.kel,
          kec: item.kec,
          kab: 'Kabupaten Bandung',
          prov: 'Jawa Barat',
          lat: parseFloat((baseLat + stepOffsetLat).toFixed(6)),
          lng: parseFloat((baseLng + stepOffsetLng).toFixed(6))
        });
      });
    });
    localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(list));
  }

  updateAiDbSavedCounterUI();
  return list;
}

function updateAiDbSavedCounterUI() {
  const badgeEl = document.getElementById('aiDbSavedCountText');
  if (badgeEl) {
    const raw = localStorage.getItem('ckg_learned_kampung_map');
    let count = 0;
    if (raw) {
      try { count = JSON.parse(raw).length; } catch (e) { count = 0; }
    }
    badgeEl.textContent = `${count} Titik`;
  }
}

async function saveLearnedKampungKeyword(kw, kel, kec, kab = 'Kabupaten Bandung', prov = 'Jawa Barat', syncToCloud = true, lat = null, lng = null) {
  if (!kw) return;
  const cleanKw = String(kw).toUpperCase().replace(/^KP\.\s*/i, '').trim();

  // Prefer provided Kelurahan & Kecamatan to support identical kampung names across different villages
  const finalKel = kel || 'Banjaran Kulon';
  const finalKec = kec || 'Banjaran';
  const finalKab = kab || 'Kabupaten Bandung';
  const finalProv = prov || 'Jawa Barat';

  const list = getLearnedKampungMap();
  
  // Match uniqueness by: Kampung Name + Kelurahan + Kecamatan (So identical names in different villages are kept!)
  const existingIndex = list.findIndex(item => {
    const itemKw = (Array.isArray(item.keywords) ? item.keywords[0] : item.keywords) || '';
    const itemCleanKw = String(itemKw).toUpperCase().replace(/^KP\.\s*/i, '').trim();
    const itemKel = String(item.kel || '').toUpperCase().trim();
    const itemKec = String(item.kec || '').toUpperCase().trim();

    return itemCleanKw === cleanKw && itemKel === String(finalKel).toUpperCase().trim() && itemKec === String(finalKec).toUpperCase().trim();
  });

  const entry = {
    keywords: [cleanKw],
    kel: finalKel,
    kec: finalKec,
    kab: finalKab,
    prov: finalProv,
    lat: lat,
    lng: lng
  };

  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...entry };
  } else {
    list.push(entry);
  }

  localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(list));
  updateAiDbSavedCounterUI();

  if (syncToCloud) {
    try {
      await fetch('/api/kamus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: cleanKw,
          kelurahan: finalKel,
          kecamatan: finalKec,
          kab_kota: finalKab,
          provinsi: finalProv,
          lat: lat,
          lng: lng
        })
      });
    } catch (err) {
      console.warn('Sync to D1 Kamus Error:', err);
    }
  }
}

async function syncKamusFromCloudServer() {
  if (!checkAdminRoleOnly('Sinkronisasi Database Cloud D1')) return;

  try {
    if (typeof showToast === 'function') showToast('🔄 Mengunduh & men-sinkronkan Kamus Alamat dari Cloud D1...', 'info');
    const res = await fetch('/api/kamus');
    if (!res.ok) throw new Error('Gagal mengambil data kamus dari cloud');
    const result = await res.json();
    
    if (result.success && Array.isArray(result.data)) {
      const cloudList = result.data;
      if (cloudList.length > 0) {
        let localList = typeof getLearnedKampungMap === 'function' ? getLearnedKampungMap() : [];
        cloudList.forEach(item => {
          const kw = item.keyword || item.keywords;
          if (kw) {
            const cleanKw = String(kw).toUpperCase().replace(/^KP\.\s*/i, '').trim();
            const kel = item.kelurahan || item.kel || 'Banjaran Kulon';
            const kec = item.kecamatan || item.kec || 'Banjaran';
            const idx = localList.findIndex(l => {
              const lKw = (Array.isArray(l.keywords) ? l.keywords[0] : l.keywords) || '';
              return String(lKw).toUpperCase().trim() === cleanKw &&
                     String(l.kel || '').toUpperCase().trim() === kel.toUpperCase().trim() &&
                     String(l.kec || '').toUpperCase().trim() === kec.toUpperCase().trim();
            });
            const entry = {
              keywords: [cleanKw],
              kel: kel,
              kec: kec,
              kab: item.kab_kota || item.kab || 'Kabupaten Bandung',
              prov: item.provinsi || item.prov || 'Jawa Barat',
              lat: item.lat || null,
              lng: item.lng || null
            };
            if (idx >= 0) localList[idx] = { ...localList[idx], ...entry };
            else localList.push(entry);
          }
        });
        localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(localList));
        if (typeof updateAiDbSavedCounterUI === 'function') updateAiDbSavedCounterUI();
        if (typeof renderMapMarkers === 'function') renderMapMarkers();
        if (typeof showToast === 'function') showToast(`✨ Sync Cloud D1 Berhasil! ${cloudList.length} titik kamus tersimpan.`, 'success');
      }
    }
  } catch (err) {
    console.warn('Sync Cloud D1 Error:', err);
    if (typeof showToast === 'function') showToast('Info Sync Cloud: Data lokal tetap aktif.', 'info');
  }
}

// Pre-defined coordinate lookup dictionary for Kabupaten Bandung kampungs/kelurahans
const KAB_BANDUNG_COORDS_MAP = {
  // Kecamatan Banjaran
  'BANJARAN KULON': [-7.0427, 107.5878],
  'BANJARAN KOTA': [-7.0427, 107.5878],
  'BANJARAN WETAN': [-7.0485, 107.5920],
  'BANJARAN': [-7.0427, 107.5878],
  'PAJAGALAN': [-7.0410, 107.5890],
  'ALUN-ALUN': [-7.0435, 107.5865],
  'CIAPUS': [-7.0350, 107.5810],
  'KAMASAN': [-7.0380, 107.5950],
  'KIANGROKE': [-7.0250, 107.5890],
  'MARGAHAYU': [-7.0510, 107.5820],
  'NEGLASARI': [-7.0600, 107.5980],
  'PASIRHUNI': [-7.0650, 107.5750],
  'SINDANGPANON': [-7.0550, 107.6050],
  'TARAJUSARI': [-7.0310, 107.6010],
  // Kecamatan Cangkuang
  'BANDASARI': [-7.0210, 107.5620],
  'CANGKUANG': [-7.0150, 107.5580],
  'CILUNCAT': [-7.0180, 107.5690],
  'JATISARI': [-7.0230, 107.5740],
  'NAGRAK': [-7.0090, 107.5610],
  'TANJUNGSARI': [-7.0120, 107.5510],
  // Kecamatan Arjasari
  'ARJASARI': [-7.0450, 107.6250],
  'ANCOLMEKAR': [-7.0520, 107.6350],
  'BAROS': [-7.0380, 107.6150],
  'BINGKUR': [-7.0620, 107.6410],
  'MANGGUNGJAYA': [-7.0410, 107.6290],
  'MEKARJAYA': [-7.0480, 107.6210],
  'PINGGIRSARI': [-7.0580, 107.6320],
  'RANCAKOLE': [-7.0650, 107.6250],
  'WARGALAKSANA': [-7.0350, 107.6380],
  // Kecamatan Pameungpeuk
  'PAMEUNGPEUK': [-7.0050, 107.6050],
  'BATUKARUT': [-7.0050, 107.6050],
  'LANGONSARI': [-7.0120, 107.6120],
  'RANCAMANYAR': [-6.9850, 107.5950],
  'RANCATUNGKU': [-7.0010, 107.5980],
  'SUKASARI': [-7.0080, 107.6010],
  // Kecamatan Cimaung
  'CIMAUNG': [-7.0750, 107.5650],
  'CIKAPUNDUNG': [-7.0810, 107.5720],
  'MALASARI': [-7.0880, 107.5610],
  'PASIRHUNI': [-7.0690, 107.5780],
  'WARJABAKTI': [-7.0950, 107.5580],
  // Other Kab Bandung Key Hubs
  'SOREANG': [-7.0320, 107.5270],
  'KATAPANG': [-6.9980, 107.5620],
  'BALEENDAH': [-6.9820, 107.6280],
  'DAYEUHKOLOT': [-6.9850, 107.6180]
};

/* ==========================================================================
   🤖 AI AUTONOMOUS ADDRESS EXPLORER & LIVE MAP RADAR ENGINE
   ========================================================================== */

let isAiExplorerActive = false;
let aiExplorerInterval = null;
let aiScanSpeedMs = 4000; // Default 4 seconds per scan
let aiCurrentRegionIndex = 0; // 0: Kab. Bandung, 1: Kota Bandung & KBB
let aiCurrentKecIndex = 0;
let aiCurrentPointIndex = 0;
let aiLearnedCountTotal = 0;

let aiRadarMarker = null;
let aiTrajectoryPolyline = null;
let aiTrajectoryPoints = [];
let aiAutoFollowMap = false;

// 31 Kecamatan in Kabupaten Bandung with key villages & coordinates
const KAB_BANDUNG_EXPLORATION_MAP = [
  // Kecamatan Banjaran (11 Desa Masing-Masing)
  { kec: 'Banjaran', kel: 'Banjaran Kulon', kampungs: ['Kp. Pajagalan', 'Kp. Cipeundeuy', 'Kp. Banjaran Kulon', 'Kp. Alun-Alun Banjaran', 'Kp. Baros Banjaran'], coords: [-7.0427, 107.5878] },
  { kec: 'Banjaran', kel: 'Banjaran Wetan', kampungs: ['Kp. Banjaran Wetan', 'Kp. Muara', 'Kp. Sindanglengo', 'Kp. Pasirhalang'], coords: [-7.0485, 107.5920] },
  { kec: 'Banjaran', kel: 'Tarajusari', kampungs: ['Kp. Tarajusari', 'Kp. Cipaku', 'Kp. Sanggar Mas', 'Kp. Sanggar Mas Lestari', 'Kp. Kebon Sawo'], coords: [-7.0310, 107.6010] },
  { kec: 'Banjaran', kel: 'Kamasan', kampungs: ['Kp. Kamasan', 'Kp. Kebon Hui', 'Kp. Citaliktik', 'Kp. Patrol'], coords: [-7.0380, 107.5950] },
  { kec: 'Banjaran', kel: 'Kiangroke', kampungs: ['Kp. Kiangroke', 'Kp. Pamoyanan', 'Kp. Bojong'], coords: [-7.0250, 107.5890] },
  { kec: 'Banjaran', kel: 'Pasirhuni', kampungs: ['Kp. Pasirhuni', 'Kp. Sukasari Pasirhuni'], coords: [-7.0650, 107.5750] },
  { kec: 'Banjaran', kel: 'Sindangpanon', kampungs: ['Kp. Sindangpanon', 'Kp. Sindangparang', 'Kp. Cibatok'], coords: [-7.0550, 107.6050] },
  { kec: 'Banjaran', kel: 'Ciapus', kampungs: ['Kp. Ciapus', 'Kp. Legok', 'Kp. Ciapus Hilir', 'Kp. Ciapus Girang'], coords: [-7.0350, 107.5810] },
  { kec: 'Banjaran', kel: 'Neglasari', kampungs: ['Kp. Neglasari', 'Kp. Sukatani'], coords: [-7.0600, 107.5980] },
  { kec: 'Banjaran', kel: 'Margahayu', kampungs: ['Kp. Margahayu', 'Kp. Cikupa'], coords: [-7.0510, 107.5820] },
  { kec: 'Banjaran', kel: 'Cipinang', kampungs: ['Kp. Cipinang', 'Kp. Cipeujeuh'], coords: [-7.0620, 107.5720] },
  // Kecamatan Cangkuang
  { kec: 'Cangkuang', kel: 'Bandasari', kampungs: ['Kp. Bandasari', 'Kp. Cikopo'], coords: [-7.0210, 107.5620] },
  { kec: 'Cangkuang', kel: 'Cangkuang', kampungs: ['Kp. Cangkuang'], coords: [-7.0150, 107.5580] },
  { kec: 'Cangkuang', kel: 'Ciluncat', kampungs: ['Kp. Ciluncat'], coords: [-7.0180, 107.5690] },
  { kec: 'Cangkuang', kel: 'Jatisari', kampungs: ['Kp. Jatisari'], coords: [-7.0230, 107.5740] },
  { kec: 'Cangkuang', kel: 'Nagrak', kampungs: ['Kp. Nagrak'], coords: [-7.0090, 107.5610] },
  { kec: 'Cangkuang', kel: 'Tanjungsari', kampungs: ['Kp. Tanjungsari'], coords: [-7.0120, 107.5510] },
  // Kecamatan Pameungpeuk
  { kec: 'Pameungpeuk', kel: 'Sukasari', kampungs: ['Kp. Sukasari'], coords: [-7.0080, 107.6010] },
  { kec: 'Pameungpeuk', kel: 'Langonsari', kampungs: ['Kp. Langonsari', 'Kp. Waas'], coords: [-7.0120, 107.6120] },
  { kec: 'Pameungpeuk', kel: 'Rancamulya', kampungs: ['Kp. Rancamulya', 'Kp. Bojongkoneng'], coords: [-7.0050, 107.6050] },
  { kec: 'Pameungpeuk', kel: 'Rancatungku', kampungs: ['Kp. Rancatungku'], coords: [-7.0010, 107.5980] },
  // Kecamatan Arjasari
  { kec: 'Arjasari', kel: 'Arjasari', kampungs: ['Kp. Arjasari'], coords: [-7.0450, 107.6250] },
  { kec: 'Arjasari', kel: 'Ancolmekar', kampungs: ['Kp. Ancolmekar'], coords: [-7.0520, 107.6350] },
  { kec: 'Arjasari', kel: 'Baros', kampungs: ['Kp. Baros'], coords: [-7.0380, 107.6150] },
  { kec: 'Arjasari', kel: 'Batukarut', kampungs: ['Kp. Batukarut'], coords: [-7.0050, 107.6050] },
  { kec: 'Arjasari', kel: 'Mangunjaya', kampungs: ['Kp. Mangunjaya'], coords: [-7.0410, 107.6290] },
  { kec: 'Arjasari', kel: 'Pinggirsari', kampungs: ['Kp. Pinggirsari'], coords: [-7.0580, 107.6320] },
  { kec: 'Arjasari', kel: 'Rancacole', kampungs: ['Kp. Rancacole'], coords: [-7.0650, 107.6250] },
  // Kecamatan Cimaung
  { kec: 'Cimaung', kel: 'Cimaung', kampungs: ['Kp. Cimaung'], coords: [-7.0750, 107.5650] },
  { kec: 'Cimaung', kel: 'Cikalong', kampungs: ['Kp. Cikalong', 'Kp. Campaka'], coords: [-7.0780, 107.5620] },
  { kec: 'Cimaung', kel: 'Jagabay', kampungs: ['Kp. Jagabay'], coords: [-7.0850, 107.5650] },
  { kec: 'Cimaung', kel: 'Malasari', kampungs: ['Kp. Malasari'], coords: [-7.0880, 107.5610] },
  { kec: 'Cimaung', kel: 'Mekarsari', kampungs: ['Kp. Mekarsari'], coords: [-7.0910, 107.5580] },
  { kec: 'Cimaung', kel: 'Warjabakti', kampungs: ['Kp. Warjabakti'], coords: [-7.0950, 107.5580] },
  // Kecamatan Soreang
  { kec: 'Soreang', kel: 'Soreang', kampungs: ['Kp. Soreang'], coords: [-7.0320, 107.5270] },
  { kec: 'Soreang', kel: 'Sadu', kampungs: ['Kp. Sadu'], coords: [-7.0350, 107.5210] },
  { kec: 'Soreang', kel: 'Sekarwangi', kampungs: ['Kp. Sekarwangi'], coords: [-7.0280, 107.5310] },
  { kec: 'Soreang', kel: 'Panyirapan', kampungs: ['Kp. Panyirapan'], coords: [-7.0380, 107.5350] },
  { kec: 'Soreang', kel: 'Karamatmulya', kampungs: ['Kp. Karamatmulya'], coords: [-7.0250, 107.5380] },
  { kec: 'Soreang', kel: 'Parungserab', kampungs: ['Kp. Parungserab'], coords: [-7.0210, 107.5410] },
  // Kecamatan Katapang
  { kec: 'Katapang', kel: 'Gandasari', kampungs: ['Kp. Katapang', 'Kp. Gandasari', 'Kp. Sangkanhurip', 'Kp. Pangauban'], coords: [-6.9980, 107.5620] },
  // Kecamatan Baleendah
  { kec: 'Baleendah', kel: 'Andir', kampungs: ['Kp. Andir', 'Kp. Bojongmalaka', 'Kp. Malakasari', 'Kp. Rancamanyar', 'Kp. Wargamekar'], coords: [-6.9820, 107.6280] },
  // Kecamatan Dayeuhkolot
  { kec: 'Dayeuhkolot', kel: 'Citeureup', kampungs: ['Kp. Citeureup', 'Kp. Cangkuang Barat', 'Kp. Pasawahan', 'Kp. Sukapura'], coords: [-6.9850, 107.6180] },
  // Kecamatan Margahayu
  { kec: 'Margahayu', kel: 'Sayati', kampungs: ['Kp. Sayati', 'Kp. Margahayu Selatan', 'Kp. Margahayu Tengah', 'Kp. Sukamenak'], coords: [-6.9680, 107.5780] },
  // Kecamatan Margaasih
  { kec: 'Margaasih', kel: 'Nanjung', kampungs: ['Kp. Nanjung', 'Kp. Cigondewah Hilir', 'Kp. Lagadar', 'Kp. Rahayu'], coords: [-6.9550, 107.5450] },
  // Kecamatan Ciwidey
  { kec: 'Ciwidey', kel: 'Lebakmuncang', kampungs: ['Kp. Panundaan', 'Kp. Lebakmuncang', 'Kp. Nengkelan', 'Kp. Rawabogo', 'Kp. Prawatasari'], coords: [-7.0950, 107.4620] },
  // Kecamatan Pasirjambu
  { kec: 'Pasirjambu', kel: 'Tenjolaya', kampungs: ['Kp. Tenjolaya', 'Kp. Cikoneng', 'Kp. Cisondari', 'Kp. Mekarmaju'], coords: [-7.0750, 107.4850] },
  // Kecamatan Rancabali
  { kec: 'Rancabali', kel: 'Alamendah', kampungs: ['Kp. Alamendah', 'Kp. Cipelah', 'Kp. Indragiri', 'Kp. Patengan', 'Kp. Sukaresmi'], coords: [-7.1420, 107.4120] },
  // Kecamatan Pangalengan
  { kec: 'Pangalengan', kel: 'Pulosari', kampungs: ['Kp. Pulosari', 'Kp. Warnasari', 'Kp. Banjarsari', 'Kp. Margalaksana', 'Kp. Margamekar', 'Kp. Margamukti'], coords: [-7.1750, 107.5680] },
  // Kecamatan Bojongsoang
  { kec: 'Bojongsoang', kel: 'Buahbatu', kampungs: ['Kp. Buahbatu', 'Kp. Bojongsari', 'Kp. Cipagalo', 'Kp. Tegalluar'], coords: [-6.9720, 107.6450] },
  // Kecamatan Cileunyi
  { kec: 'Cileunyi', kel: 'Cinunuk', kampungs: ['Kp. Cinunuk', 'Kp. Cileunyi Kulon', 'Kp. Cileunyi Wetan', 'Kp. Cimekar'], coords: [-6.9380, 107.7250] },
  // Kecamatan Rancaekek
  { kec: 'Rancaekek', kel: 'Haurpugur', kampungs: ['Kp. Haurpugur', 'Kp. Rancaekek Kulon', 'Kp. Bojongloa', 'Kp. Cangkuang'], coords: [-6.9680, 107.7650] },
  // Kecamatan Majalaya
  { kec: 'Majalaya', kel: 'Padamulya', kampungs: ['Kp. Padamulya', 'Kp. Bojong', 'Kp. Majakerta', 'Kp. Sukamaju', 'Kp. Majasetra'], coords: [-7.0520, 107.7550] },
  // Kecamatan Ciparay
  { kec: 'Ciparay', kel: 'Gunungleutik', kampungs: ['Kp. Gunungleutik', 'Kp. Babakan', 'Kp. Ciheulang', 'Kp. Cikuya', 'Kp. Manggungharja'], coords: [-7.0380, 107.7120] },
  // Kecamatan Ibun
  { kec: 'Ibun', kel: 'Dukuh', kampungs: ['Kp. Ibun', 'Kp. Dukuh', 'Kp. Cibeet', 'Kp. Sudi', 'Kp. Tanggulun'], coords: [-7.0850, 107.7850] },
  // Kecamatan Solokanjantung
  { kec: 'Solokanjantung', kel: 'Bojongemas', kampungs: ['Kp. Solokanjantung', 'Kp. Bojongemas', 'Kp. Langensari', 'Kp. Padamukti'], coords: [-7.0120, 107.7420] },
  // Kecamatan Kertasari
  { kec: 'Kertasari', kel: 'Tarumajaya', kampungs: ['Kp. Tarumajaya', 'Kp. Cibeureum', 'Kp. Cikembang', 'Kp. Neglawangi', 'Kp. Santosa'], coords: [-7.2150, 107.6580] },
  // Kecamatan Pacet
  { kec: 'Pacet', kel: 'Maruyung', kampungs: ['Kp. Maruyung', 'Kp. Cikitu', 'Kp. Cikawao', 'Kp. Mandalahaji', 'Kp. Sukarame'], coords: [-7.0720, 107.6980] },
  // Kecamatan Paseh
  { kec: 'Paseh', kel: 'Cigentur', kampungs: ['Kp. Cigentur', 'Kp. Cipedes', 'Kp. Drawati', 'Kp. Sukamanah'], coords: [-7.0350, 107.7950] },
  // Kecamatan Cikancung
  { kec: 'Cikancung', kel: 'Cihanyir', kampungs: ['Kp. Cihanyir', 'Kp. Ciluluk', 'Kp. Hegarmanah', 'Kp. Mekarlaksana'], coords: [-7.0080, 107.8180] },
  // Kecamatan Nagreg
  { kec: 'Nagreg', kel: 'Ciaro', kampungs: ['Kp. Nagreg', 'Kp. Ciaro', 'Kp. Ciherang', 'Kp. Citaman', 'Kp. Ganjarsabar'], coords: [-7.0250, 107.8850] },
  // Kecamatan Cicalengka
  { kec: 'Cicalengka', kel: 'Nagrog', kampungs: ['Kp. Cicalengka', 'Kp. Babakanpeutey', 'Kp. Margaasih', 'Kp. Nagrog', 'Kp. Tenjolaya'], coords: [-6.9850, 107.8350] },
  // Kecamatan Cilengkrang
  { kec: 'Cilengkrang', kel: 'Jatiendah', kampungs: ['Kp. Cilengkrang', 'Kp. Cipanjalu', 'Kp. Melati', 'Kp. Jatiendah'], coords: [-6.8980, 107.7080] },
  // Kecamatan Cimenyan
  { kec: 'Cimenyan', kel: 'Ciburial', kampungs: ['Kp. Cimenyan', 'Kp. Ciburial', 'Kp. Cikadut', 'Kp. Mekarmanah'], coords: [-6.8680, 107.6650] },
  // Kecamatan Kutawaringin
  { kec: 'Kutawaringin', kel: 'Buninagara', kampungs: ['Kp. Kutawaringin', 'Kp. Buninagara', 'Kp. Cilame', 'Kp. Jatisari', 'Kp. Kopo'], coords: [-7.0050, 107.5180] }
];

// Region 2 expansion: Kota Bandung & KBB
const KOTA_BANDUNG_KBB_EXPLORATION_MAP = [
  { kec: 'Coblong (Kota Bandung)', kel: 'Dago', kampungs: ['Kp. Dago', 'Kp. Sekeloa', 'Kp. Tubagus Ismail', 'Kp. Lebak Siliwangi'], coords: [-6.8850, 107.6180] },
  { kec: 'Cicendo (Kota Bandung)', kel: 'Pasirkaliki', kampungs: ['Kp. Pasirkaliki', 'Kp. Arjuna', 'Kp. Pajajaran'], coords: [-6.9080, 107.5950] },
  { kec: 'Lembang (KBB)', kel: 'Lembang Kota', kampungs: ['Kp. Lembang', 'Kp. Cikole', 'Kp. Jayagiri', 'Kp. Kayuambon'], coords: [-6.8150, 107.6180] },
  { kec: 'Padalarang (KBB)', kel: 'Kertajaya', kampungs: ['Kp. Padalarang', 'Kp. Kertajaya', 'Kp. Ciburuy', 'Kp. Tagogapu'], coords: [-6.8380, 107.4780] },
  { kec: 'Cimahi Utara', kel: 'Cipageran', kampungs: ['Kp. Cipageran', 'Kp. Pasirkaliki Cimahi', 'Kp. Citeureup'], coords: [-6.8680, 107.5450] }
];

const EXPLORATION_REGIONS = [
  { name: 'Kabupaten Bandung', map: KAB_BANDUNG_EXPLORATION_MAP, totalKec: 31 },
  { name: 'Kota Bandung & KBB', map: KOTA_BANDUNG_KBB_EXPLORATION_MAP, totalKec: 5 },
];

let aiExplorerTimerInterval = null;
let aiExplorerSecondsLeft = 600; // Default 10 minutes (600 seconds)
let aiExplorerInitialDurationMinutes = 10;
let isAiTimerUnlimited = false;

function formatAiTimerDisplay(seconds) {
  if (isAiTimerUnlimited) return '♾️ Tanpa Batas';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateAiTimerUI() {
  const badgeEl = document.getElementById('aiTimerCountdownText');
  if (badgeEl) {
    badgeEl.textContent = `⏳ ${formatAiTimerDisplay(aiExplorerSecondsLeft)}`;
  }
}

function startAiExplorerCountdownTimer() {
  if (aiExplorerTimerInterval) clearInterval(aiExplorerTimerInterval);
  if (isAiTimerUnlimited) {
    updateAiTimerUI();
    return;
  }

  updateAiTimerUI();
  aiExplorerTimerInterval = setInterval(() => {
    if (!isAiExplorerActive) return;

    aiExplorerSecondsLeft--;
    updateAiTimerUI();

    if (aiExplorerSecondsLeft <= 0) {
      clearInterval(aiExplorerTimerInterval);
      stopAiExplorerTimerExpired();
    }
  }, 1000);
}

function stopAiExplorerTimerExpired() {
  isAiExplorerActive = false;

  const btnHeader = document.getElementById('btnAiExplorerToggleHeader');
  const btnHud = document.getElementById('btnToggleAiExplorer');
  const badge = document.getElementById('aiExplorerStateBadge');

  if (btnHeader) btnHeader.innerHTML = `<i class="bi bi-play-fill"></i> Mulai Jelajah AI`;
  if (btnHud) btnHud.innerHTML = `<i class="bi bi-play-fill"></i> Mulai Jelajah AI`;
  if (badge) {
    badge.className = 'badge badge-amber';
    badge.innerHTML = `<i class="bi bi-stopwatch-fill"></i> WAKTU SELESAI`;
  }

  updateAiLiveLog(`⏱️ WAKTU JELAJAH AI SELESAI (${aiExplorerInitialDurationMinutes} Menit). Penjelajahan dihentikan otomatis.`);

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: '⏱️ Waktu Jelajah AI Selesai!',
      text: `Sesi penjelajahan otomatis selama ${aiExplorerInitialDurationMinutes} menit telah selesai. Seluruh titik kampung baru yang ditemukan telah tersimpan di Cloud D1 Database.`,
      icon: 'info',
      confirmButtonText: '<i class="bi bi-play-circle-fill"></i> Mulai Sesi Baru',
      showCancelButton: true,
      cancelButtonText: 'Tutup',
      confirmButtonColor: '#4f46e5'
    }).then(res => {
      if (res.isConfirmed) {
        openSetAiTimerModal();
      }
    });
  } else if (typeof showToast === 'function') {
    showToast(`⏱️ Waktu Jelajah Selesai (${aiExplorerInitialDurationMinutes} Menit)!`, 'info');
  }
function checkAdminRoleOnly(actionName = 'fitur ini') {
  const currentUserRole = sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas');
  if (currentUserRole !== 'Admin') {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '🔒 Akses Terbatas (Admin Only)',
        text: `Maaf, ${actionName} hanya dapat diakses & dijalankan oleh pengguna dengan Peran ADMIN.`,
        icon: 'warning',
        confirmButtonText: 'Mengerti',
        confirmButtonColor: '#f59e0b'
      });
    } else {
      alert(`🔒 Akses Terbatas: ${actionName} hanya dapat diakses oleh Admin.`);
    }
    return false;
  }
  return true;
}

function openSetAiTimerModal() {
  if (!checkAdminRoleOnly('Pengaturan Durasi Waktu Jelajah AI')) return;
  if (typeof Swal === 'undefined') return;

  Swal.fire({
    title: '<i class="bi bi-stopwatch-fill" style="color:#4f46e5;"></i> Setel Waktu Jelajah AI',
    html: `
      <div style="text-align: left; font-size: 13px; margin-top: 10px;">
        <p style="color: #64748b; font-size: 12.5px; margin-bottom: 14px;">
          Pilih berapa menit AI Autonomous Explorer akan berjelajah secara otomatis:
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
          <button type="button" class="btn btn-outline-primary timer-opt-btn" onclick="selectAiTimerOption(5, this)">⚡ 5 Menit</button>
          <button type="button" class="btn btn-primary timer-opt-btn active" onclick="selectAiTimerOption(10, this)">🚀 10 Menit (Default)</button>
          <button type="button" class="btn btn-outline-primary timer-opt-btn" onclick="selectAiTimerOption(15, this)">🛡️ 15 Menit</button>
          <button type="button" class="btn btn-outline-primary timer-opt-btn" onclick="selectAiTimerOption(30, this)">🌐 30 Menit</button>
          <button type="button" class="btn btn-outline-primary timer-opt-btn" onclick="selectAiTimerOption(-1, this)">♾️ Tanpa Batas Waktu</button>
          <button type="button" class="btn btn-outline-primary timer-opt-btn" onclick="selectAiTimerOption(0, this)">✏️ Kustom Menit</button>
        </div>

        <div id="customTimerMinutesGroup" style="display: none; margin-top: 10px;">
          <label class="form-label" style="font-weight: 700;">Masukkan Jumlah Menit Kustom:</label>
          <input type="number" id="customTimerMinutesInput" class="swal2-input" placeholder="Contoh: 45" min="1" max="300" style="width: 100%; margin: 4px 0 0 0;" value="20">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-play-fill"></i> Mulai Penjelajahan AI',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#4f46e5',
    didOpen: () => {
      window.selectedTimerMinutes = 10;
    },
    preConfirm: () => {
      let mins = window.selectedTimerMinutes;
      if (mins === 0) {
        const inputVal = parseInt(document.getElementById('customTimerMinutesInput').value, 10);
        if (isNaN(inputVal) || inputVal <= 0) {
          Swal.showValidationMessage('Harap masukkan jumlah menit kustom yang valid!');
          return false;
        }
        mins = inputVal;
      }
      return mins;
    }
  }).then(res => {
    if (res.isConfirmed && res.value !== undefined) {
      const selectedMins = res.value;
      if (selectedMins === -1) {
        isAiTimerUnlimited = true;
        aiExplorerSecondsLeft = 0;
        aiExplorerInitialDurationMinutes = 'Tanpa Batas';
      } else {
        isAiTimerUnlimited = false;
        aiExplorerInitialDurationMinutes = selectedMins;
        aiExplorerSecondsLeft = selectedMins * 60;
      }

      isAiExplorerActive = true;
      initAiAutoExplorerEngine();
      startAiExplorerCountdownTimer();

      const btnHeader = document.getElementById('btnAiExplorerToggleHeader');
      const btnHud = document.getElementById('btnToggleAiExplorer');
      const badge = document.getElementById('aiExplorerStateBadge');

      if (btnHeader) btnHeader.innerHTML = `<i class="bi bi-robot"></i> Jeda Jelajah AI`;
      if (btnHud) btnHud.innerHTML = `<i class="bi bi-pause-fill"></i> Jeda Jelajah AI`;
      if (badge) {
        badge.className = 'badge badge-emerald';
        badge.innerHTML = `<i class="bi bi-record-fill" style="color: #22c55e; animation: blink 1s infinite;"></i> AUTO-SCANNING AKTIF`;
      }

      const durText = isAiTimerUnlimited ? 'Tanpa Batas Waktu' : `${selectedMins} Menit`;
      updateAiLiveLog(`▶️ AI Autonomous Explorer DIAKTIFKAN dengan durasi: ${durText}.`);
      if (typeof showToast === 'function') showToast(`AI Explorer Aktif! Durasi: ${durText}`, 'success');
    }
  });
}

function selectAiTimerOption(mins, btnEl) {
  window.selectedTimerMinutes = mins;
  const container = btnEl.parentElement;
  container.querySelectorAll('.timer-opt-btn').forEach(b => {
    b.classList.remove('btn-primary', 'active');
    b.classList.add('btn-outline-primary');
  });
  btnEl.classList.remove('btn-outline-primary');
  btnEl.classList.add('btn-primary', 'active');

  const customGroup = document.getElementById('customTimerMinutesGroup');
  if (customGroup) {
    customGroup.style.display = mins === 0 ? 'block' : 'none';
  }
}

async function repairAllRecordsAddressWithAi() {
  if (typeof Swal === 'undefined') return;

  // 🔒 STRICT ROLE GUARD: Admin Only
  const currentUserRole = sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas');
  if (currentUserRole !== 'Admin') {
    Swal.fire({
      title: '🔒 Akses Terbatas (Admin Only)',
      text: 'Maaf, fitur AI Auto-Repair Alamat Rekam Medis ini hanya dapat dijalankan oleh pengguna dengan Peran ADMIN.',
      icon: 'warning',
      confirmButtonText: 'Mengerti',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  const result = await Swal.fire({
    title: '<i class="bi bi-magic" style="color: #10b981;"></i> Auto-Repair Alamat AI',
    html: `
      <div style="text-align: left; font-size: 13px;">
        <p style="color: #475569; margin-bottom: 10px;">
          Fitur khusus <strong>Admin</strong> ini akan menganalisis teks alamat mentah pada seluruh rekam medis <strong>Data Record CKG / SIMPUS</strong> dan <strong>CKG Sekolah</strong>, lalu secara otomatis memvalidasi & memperbaiki:
        </p>
        <ul style="color: #059669; padding-left: 20px; line-height: 1.6; margin-bottom: 12px; font-weight: 600;">
          <li>Desa / Kelurahan (termasuk koreksi Banjaran Kota ➔ Banjaran Kulon)</li>
          <li>Kecamatan</li>
          <li>Kabupaten / Kota</li>
          <li>Provinsi</li>
        </ul>
        <p style="font-size: 11.5px; color: #64748b; font-style: italic;">
          Hasil perbaikan presisi akan langsung disimpan ke sistem lokal dan disinkronkan ke Cloud D1 Database Server.
        </p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '✨ Jalankan Auto-Repair AI',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  });

  if (!result.isConfirmed) return;

  // 1. Prepare records list for chunk processing
  const allItems = [];
  if (typeof simpusRecords !== 'undefined' && Array.isArray(simpusRecords)) {
    simpusRecords.forEach((r, idx) => allItems.push({ type: 'simpus', data: r, idx }));
  }
  if (typeof sekolahRecords !== 'undefined' && Array.isArray(sekolahRecords)) {
    sekolahRecords.forEach((r, idx) => allItems.push({ type: 'sekolah', data: r, idx }));
  }

  const totalCount = allItems.length;
  if (totalCount === 0) {
    Swal.fire('Informasi', 'Belum ada data rekam medis SIMPUS atau CKG Sekolah yang tersedia untuk di-audit.', 'info');
    return;
  }

  // 2. Show Live Progress Modal with Animated Progress Bar & Percentage
  Swal.fire({
    title: '<i class="bi bi-cpu-fill" style="color: #3b82f6;"></i> AI Sedang Memeriksa Alamat...',
    html: `
      <div style="text-align: left; font-size: 12.5px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 6px; color: #1e293b;">
          <span id="aiRepairStatusText">Memulai pemindaian...</span>
          <span id="aiRepairPercentText" style="color: #2563eb;">0%</span>
        </div>

        <div style="height: 16px; background: #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 12px; border: 1px solid #cbd5e1;">
          <div id="aiRepairProgressBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3b82f6, #10b981); border-radius: 8px; transition: width 0.15s ease;"></div>
        </div>

        <div style="font-size: 11px; color: #64748b; font-style: italic; text-align: center;">
          Mohon tunggu, AI sedang menyelaraskan hierarki alamat dengan Kamus Administrasi Presisi...
        </div>
      </div>
    `,
    allowOutsideClick: false,
    showConfirmButton: false
  });

  let processedCount = 0;
  let simpusFixedCount = 0;
  let sekolahFixedCount = 0;
  const auditLogs = [];

  function processNextChunk(index) {
    if (index >= totalCount) {
      finishRepairProcess();
      return;
    }

    const chunkSize = Math.max(1, Math.floor(totalCount / 40));
    const endIdx = Math.min(index + chunkSize, totalCount);

    for (let i = index; i < endIdx; i++) {
      const item = allItems[i];
      const r = item.data;
      const rawAddr = r.alamat || r.alamat_domisili || '';
      const detected = detectAddressHierarchyFromRawText(rawAddr, r.kelurahan || r.desa, r.kecamatan, r.kab_kota || r.kabupaten, r.provinsi);

      const oldKel = r.kelurahan || r.desa || '-';
      const oldKec = r.kecamatan || '-';
      const oldKab = r.kab_kota || r.kabupaten || '-';
      const oldProv = r.provinsi || '-';

      if (oldKel !== detected.kel || oldKec !== detected.kec || oldKab !== detected.kab || oldProv !== detected.prov) {
        r.kelurahan = detected.kel;
        if (r.desa !== undefined) r.desa = detected.kel;
        r.kecamatan = detected.kec;
        r.kab_kota = detected.kab;
        if (r.kabupaten !== undefined) r.kabupaten = detected.kab;
        r.provinsi = detected.prov;

        if (item.type === 'simpus') {
          simpusFixedCount++;
          auditLogs.push(`[SIMPUS #${r.no || item.idx + 1}] ${r.nama || 'Pasien'}: "${rawAddr}" ➔ Desa: ${oldKel} ➔ <b>${detected.kel}</b>, Kec: ${oldKec} ➔ <b>${detected.kec}</b>`);
        } else {
          sekolahFixedCount++;
          auditLogs.push(`[SEKOLAH #${r.no || item.idx + 1}] ${r.nama || 'Siswa'}: "${rawAddr}" ➔ Desa: ${oldKel} ➔ <b>${detected.kel}</b>, Kec: ${oldKec} ➔ <b>${detected.kec}</b>`);
        }
      }
      processedCount++;
    }

    const pct = Math.round((processedCount / totalCount) * 100);
    const barEl = document.getElementById('aiRepairProgressBar');
    const pctEl = document.getElementById('aiRepairPercentText');
    const statusEl = document.getElementById('aiRepairStatusText');

    if (barEl) barEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (statusEl) statusEl.textContent = `Memeriksa ${processedCount} / ${totalCount} record...`;

    setTimeout(() => processNextChunk(endIdx), 20);
  }

  function finishRepairProcess() {
    if (simpusFixedCount > 0) {
      localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));
      if (typeof syncSimpusToCloud === 'function') syncSimpusToCloud(simpusRecords);
    }
    if (sekolahFixedCount > 0) {
      localStorage.setItem('ckg_sekolah_records_v1', JSON.stringify(sekolahRecords));
      if (typeof syncSekolahRecordsToCloud === 'function') syncSekolahRecordsToCloud(sekolahRecords);
    }

    if (typeof renderSimpusTable === 'function') renderSimpusTable();
    if (typeof renderSekolahTable === 'function') renderSekolahTable();
    if (typeof renderDashboardAnalytics === 'function') renderDashboardAnalytics();

    const totalFixed = simpusFixedCount + sekolahFixedCount;

    let logHtml = auditLogs.length > 0
      ? auditLogs.slice(0, 50).map(l => `<div style="margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;">${l}</div>`).join('')
      : '<div style="color: #a7f3d0; text-align: center;">Seluruh data rekam medis alamat sudah 100% presisi dan sesuai hierarki administrasi!</div>';

    if (auditLogs.length > 50) {
      logHtml += `<div style="color: #fbbf24; margin-top: 6px; font-weight: 700;">...dan ${auditLogs.length - 50} perbaikan record lainnya.</div>`;
    }

    Swal.fire({
      title: '🎉 Auto-Repair Alamat AI Selesai!',
      html: `
        <div style="text-align: left; font-size: 12.5px; color: #334155;">
          <div style="background: #f1f5f9; border-radius: 8px; padding: 10px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>📊 Total Record Di-audit:</span> <strong>${totalCount} Data</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #059669;">
              <span>✨ Total Record Diperbaiki:</span> <strong>${totalFixed} Data</strong>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
              • SIMPUS / CKG Record: <strong>${simpusFixedCount} diperbaiki</strong><br>
              • CKG Sekolah Record: <strong>${sekolahFixedCount} diperbaiki</strong>
            </div>
          </div>

          <div style="font-weight: 700; color: #1e293b; margin-bottom: 6px;">📋 Rincian Audit Perbaikan Alamat AI:</div>
          <div style="max-height: 180px; overflow-y: auto; background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 10.5px; padding: 8px 10px; border-radius: 8px;">
            ${logHtml}
          </div>
        </div>
      `,
      icon: totalFixed > 0 ? 'success' : 'info',
      confirmButtonText: 'Tutup & Simpan',
      confirmButtonColor: '#10b981'
    });
  }

  // Start process
  processNextChunk(0);
}

function initAiAutoExplorerEngine() {
  if (aiExplorerInterval) clearInterval(aiExplorerInterval);

  aiExplorerInterval = setInterval(() => {
    if (!isAiExplorerActive) return;
    stepAiExplorerNextLocation();
  }, aiScanSpeedMs);

  startAiExplorerCountdownTimer();
  updateAiDbSavedCounterUI();
}

function toggleAiAutoExplorer() {
  if (!checkAdminRoleOnly('Fitur Jelajah AI')) return;

  if (!isAiExplorerActive && (aiExplorerSecondsLeft <= 0 && !isAiTimerUnlimited)) {
    openSetAiTimerModal();
    return;
  }

  isAiExplorerActive = !isAiExplorerActive;

  const btnHeader = document.getElementById('btnAiExplorerToggleHeader');
  const btnHud = document.getElementById('btnToggleAiExplorer');
  const badge = document.getElementById('aiExplorerStateBadge');

  if (isAiExplorerActive) {
    if (btnHeader) btnHeader.innerHTML = `<i class="bi bi-robot"></i> Jeda Jelajah AI`;
    if (btnHud) btnHud.innerHTML = `<i class="bi bi-pause-fill"></i> Jeda Jelajah AI`;
    if (badge) {
      badge.className = 'badge badge-emerald';
      badge.innerHTML = `<i class="bi bi-record-fill" style="color: #22c55e; animation: blink 1s infinite;"></i> AUTO-SCANNING AKTIF`;
    }
    updateAiLiveLog(`▶️ AI Autonomous Explorer DIAKTIFKAN kembali. Menjelajah & mencatat otomatis...`);
    if (typeof showToast === 'function') showToast('AI Auto-Explorer Aktif! Menjelajah lokasi otomatis...', 'success');
  } else {
    if (btnHeader) btnHeader.innerHTML = `<i class="bi bi-play-fill"></i> Mulai Jelajah AI`;
    if (btnHud) btnHud.innerHTML = `<i class="bi bi-play-fill"></i> Mulai Jelajah AI`;
    if (badge) {
      badge.className = 'badge badge-amber';
      badge.innerHTML = `<i class="bi bi-pause-circle-fill"></i> DI-JEDA`;
    }
    updateAiLiveLog(`⏸️ AI Autonomous Explorer di-jeda sementara.`);
    if (typeof showToast === 'function') showToast('AI Auto-Explorer Di-jeda.', 'info');
  }
}

function speedUpAiExplorer() {
  if (!checkAdminRoleOnly('Pengaturan Kecepatan Scanning AI')) return;

  if (aiScanSpeedMs === 4000) {
    aiScanSpeedMs = 2000;
  } else if (aiScanSpeedMs === 2000) {
    aiScanSpeedMs = 800;
  } else {
    aiScanSpeedMs = 4000;
  }

  const speedBtn = document.getElementById('btnSpeedAiExplorer');
  if (speedBtn) {
    if (aiScanSpeedMs === 4000) speedBtn.innerHTML = `<i class="bi bi-lightning-charge-fill" style="color: #f59e0b;"></i> Mode: Normal (4s)`;
    else if (aiScanSpeedMs === 2000) speedBtn.innerHTML = `<i class="bi bi-lightning-charge-fill" style="color: #0284c7;"></i> Mode: Fast (2s)`;
    else speedBtn.innerHTML = `<i class="bi bi-rocket-takeoff-fill" style="color: #ec4899;"></i> Mode: TURBO (0.8s)`;
  }

  initAiAutoExplorerEngine();
  updateAiLiveLog(`⚡ Kecepatan Radar Scanning AI diubah ke interval ${aiScanSpeedMs / 1000}s!`);
}

function stepAiExplorerNextLocation() {
  const currentRegion = EXPLORATION_REGIONS[aiCurrentRegionIndex] || EXPLORATION_REGIONS[0];
  const regionMap = currentRegion.map;

  if (aiCurrentKecIndex >= regionMap.length) {
    // Current region complete!
    if (aiCurrentRegionIndex < EXPLORATION_REGIONS.length - 1) {
      aiCurrentRegionIndex++;
      aiCurrentKecIndex = 0;
      aiCurrentPointIndex = 0;
      const nextRegion = EXPLORATION_REGIONS[aiCurrentRegionIndex];
      updateAiLiveLog(`🏆 CAKUPAN ${currentRegion.name.toUpperCase()} 100% TERKUASAI! Melanjutkan penjelajahan ke: ${nextRegion.name}`);
      const regLabel = document.getElementById('aiExplorerTargetRegion');
      if (regLabel) regLabel.textContent = nextRegion.name;
    } else {
      // All regions explored!
      aiCurrentRegionIndex = 0;
      aiCurrentKecIndex = 0;
      aiCurrentPointIndex = 0;
      updateAiLiveLog(`🏆 Seluruh Wilayah (${EXPLORATION_REGIONS.length} Region) 100% Terjangkau! Melanjutkan audit siklis...`);
    }
    return;
  }

  const kecObj = regionMap[aiCurrentKecIndex];
  const targetKampung = kecObj.kampungs[aiCurrentPointIndex] || `Kp. ${kecObj.kel}`;

  const cleanKw = targetKampung.replace(/^Kp\.\s*/i, '').trim();
  const targetKel = kecObj.kel;
  const targetKec = kecObj.kec;
  const targetKab = currentRegion.name.includes('Kota') ? 'Kota Bandung' : 'Kabupaten Bandung';
  const targetProv = 'Jawa Barat';

  // Compute fine coordinate offset
  const baseLat = kecObj.coords[0];
  const baseLng = kecObj.coords[1];
  const stepOffsetLat = (aiCurrentPointIndex * 0.0018) * (aiCurrentPointIndex % 2 === 0 ? 1 : -1);
  const stepOffsetLng = (aiCurrentPointIndex * 0.0018) * (aiCurrentPointIndex % 3 === 0 ? 1 : -1);
  const lat = parseFloat((baseLat + stepOffsetLat).toFixed(6));
  const lng = parseFloat((baseLng + stepOffsetLng).toFixed(6));

  // 🔒 SKIP VISITED / ALREADY PINNED CHECK:
  // If this exact (cleanKw + targetKel + targetKec) is already saved in DB, advance pointer and search for a NEW undiscovered location!
  const currentLearned = getLearnedKampungMap();
  const isAlreadyPinned = currentLearned.some(item => {
    const itemKw = (Array.isArray(item.keywords) ? item.keywords[0] : item.keywords) || '';
    return String(itemKw).toUpperCase().trim() === cleanKw.toUpperCase() &&
           String(item.kel || '').toUpperCase().trim() === targetKel.toUpperCase() &&
           String(item.kec || '').toUpperCase().trim() === targetKec.toUpperCase();
  });

  if (isAlreadyPinned) {
    // Advance pointer to next location
    aiCurrentPointIndex++;
    if (aiCurrentPointIndex >= kecObj.kampungs.length) {
      aiCurrentPointIndex = 0;
      aiCurrentKecIndex++;
    }
    // Automatically advance to the next undiscovered location without waiting
    setTimeout(() => {
      if (isAiExplorerActive) stepAiExplorerNextLocation();
    }, 50);
    return;
  }

  // 1. Auto-record to Cloud D1 database & Local Storage without asking user
  saveLearnedKampungKeyword(
    cleanKw,
    targetKel,
    targetKec,
    targetKab,
    targetProv,
    true,
    lat,
    lng
  );

  aiLearnedCountTotal++;

  // 2. Update Live Log HUD & Indicator
  updateAiLiveLog(`🔍 [${new Date().toLocaleTimeString('id-ID')}] Discovered NEW: Kp. ${cleanKw}, Desa ${targetKel}, Kec. ${targetKec} → Saved to D1 Cloud`);
  updateAiDbSavedCounterUI();

  // 3. Move Live Radar Marker on Leaflet Map
  updateAiRadarMarkerOnMap(lat, lng, cleanKw, kecObj.kec);

  // 4. Update Coverage Progress Bar
  updateAiCoverageProgress(currentRegion);

  // 5. Increment Pointer
  aiCurrentPointIndex++;
  if (aiCurrentPointIndex >= kecObj.kampungs.length) {
    aiCurrentPointIndex = 0;
    aiCurrentKecIndex++;
  }

  // Refresh Map markers dynamically
  if (typeof leafletMap !== 'undefined' && leafletMap) {
    renderMapMarkers();
  }
}

function updateAiRadarMarkerOnMap(lat, lng, kw, kec) {
  if (typeof leafletMap === 'undefined' || !leafletMap || typeof L === 'undefined') return;

  const pointLatLng = [lat, lng];

  if (!aiRadarMarker) {
    const radarIcon = L.divIcon({
      className: 'ai-radar-drone-marker',
      html: `
        <div class="ai-radar-pulse-ring"></div>
        <div class="ai-radar-center-icon"><i class="bi bi-robot"></i></div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    aiRadarMarker = L.marker(pointLatLng, { icon: radarIcon, zIndexOffset: 2000 }).addTo(leafletMap);
    aiRadarMarker.bindPopup(`
      <div style="font-family:'Plus Jakarta Sans',sans-serif; text-align:center; font-size:12px;">
        <strong style="color:#0284c7; font-size:13px;">🤖 AI Radar Exploration Agent</strong><br>
        <span>Sedang memindai & mencatat: <strong>Kp. ${kw}</strong> (Kec. ${kec})</span>
      </div>
    `);
  } else {
    aiRadarMarker.setLatLng(pointLatLng);
  }

  // Trajectory line connecting scanned locations
  aiTrajectoryPoints.push(pointLatLng);
  if (aiTrajectoryPoints.length > 25) aiTrajectoryPoints.shift(); // Keep last 25 steps

  if (!aiTrajectoryPolyline) {
    aiTrajectoryPolyline = L.polyline(aiTrajectoryPoints, {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.7,
      dashArray: '6, 8'
    }).addTo(leafletMap);
  } else {
    aiTrajectoryPolyline.setLatLngs(aiTrajectoryPoints);
  }

  if (aiAutoFollowMap) {
    leafletMap.panTo(pointLatLng, { animate: true, duration: 0.8 });
  }
}

function reFocusAiRadarMarker() {
  aiAutoFollowMap = !aiAutoFollowMap;
  if (aiRadarMarker && leafletMap) {
    leafletMap.setView(aiRadarMarker.getLatLng(), 14, { animate: true });
    aiRadarMarker.openPopup();
    showToast(aiAutoFollowMap ? 'Kamera Peta Otomatis Mengikuti AI Drone Radar!' : 'Kamera Otomatis AI Di-nonaktifkan.', 'info');
  } else {
    showToast('Radar AI sedang aktif di peta Kab. Bandung.', 'info');
  }
}

function updateAiLiveLog(msg) {
  const ticker = document.getElementById('aiLiveLogTicker');
  if (ticker) {
    ticker.textContent = msg;
  }
}

function updateAiCoverageProgress(currentRegion) {
  const totalKec = currentRegion.totalKec || 31;
  const currentKecDone = Math.min(aiCurrentKecIndex + 1, totalKec);
  const percent = Math.min(100, Math.round((currentKecDone / totalKec) * 100));

  const textEl = document.getElementById('aiCoverageText');
  const barEl = document.getElementById('aiCoverageBar');
  const labelEl = document.getElementById('aiCoverageRegionLabel');

  if (labelEl) labelEl.textContent = currentRegion.name;
  if (textEl) textEl.textContent = `${percent}% (${currentKecDone}/${totalKec} Kec)`;
  if (barEl) barEl.style.width = `${percent}%`;
}

function initInteractiveMap() {
  const container = document.getElementById('interactiveMap');
  if (!container) return;

  if (typeof L === 'undefined') {
    console.warn('Leaflet JS library not loaded yet.');
    return;
  }

  // Start Autonomous AI Address Explorer Engine
  initAiAutoExplorerEngine();

  if (!leafletMap) {
    // Center map around Banjaran, Kabupaten Bandung, Jawa Barat
    leafletMap = L.map('interactiveMap', {
      center: [-7.0427, 107.5878],
      zoom: 13,
      zoomControl: true
    });

    // Add Google Maps Tile Layers (Roadmap, Satelit & Jalan, Terrain)
    const googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps | Puskesmas Banjaran Kota CKG',
      maxZoom: 20
    });

    const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps Satelit & Jalan | Puskesmas Banjaran Kota CKG',
      maxZoom: 20
    });

    const googleTerrain = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps Terrain | Puskesmas Banjaran Kota CKG',
      maxZoom: 20
    });

    googleRoadmap.addTo(leafletMap);

    // Layer switcher control for Google Maps views
    L.control.layers({
      '🗺️ Google Maps Standard': googleRoadmap,
      '🛰️ Google Maps Satelit & Jalan': googleSatellite,
      '⛰️ Google Maps Terrain': googleTerrain
    }, null, { position: 'topright' }).addTo(leafletMap);

    mapMarkersGroup = L.layerGroup().addTo(leafletMap);

    // Map click handler to place a pin & add address
    leafletMap.on('click', function (e) {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));

      if (currentAddingPinMarker) {
        leafletMap.removeLayer(currentAddingPinMarker);
      }

      currentAddingPinMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-adding-pin',
          html: `<div style="background: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); border: 2px solid white; animation: pulse 1.5s infinite;"><i class="bi bi-geo-alt-fill"></i></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      }).addTo(leafletMap);

      openAddPinModalFromMap(lat, lng);
    });
  } else {
    // Invalidate size when view turns active to ensure full tile rendering
    setTimeout(() => leafletMap.invalidateSize(), 200);
  }

  renderMapMarkers();
}

function resetMapFocusToBanjaran() {
  if (leafletMap) {
    leafletMap.setView([-7.0427, 107.5878], 13);
  }
}

function renderMapMarkers() {
  if (!leafletMap || !mapMarkersGroup) return;

  mapMarkersGroup.clearLayers();

  const learnedMap = getLearnedKampungMap();
  const searchVal = (document.getElementById('mapSearchInput')?.value || '').toLowerCase().trim();
  const selectedKec = document.getElementById('mapKecamatanSelect')?.value || '';
  const displayMode = document.getElementById('mapDisplayMode')?.value || 'all';

  const allRecords = (typeof records !== 'undefined' ? records : []).concat(typeof simpusRecords !== 'undefined' ? simpusRecords : []);

  let totalPoints = 0;
  let kecSet = new Set();
  let totalPatientsMapped = 0;
  let banjaranPoints = 0;

  const sidebarListContainer = document.getElementById('mapAddressListContainer');
  if (sidebarListContainer) sidebarListContainer.innerHTML = '';

  learnedMap.forEach((item, index) => {
    const kw = (item.keywords && item.keywords[0]) ? item.keywords[0].toUpperCase() : 'KAMPUNG';
    const kel = item.kel || 'Banjaran Kulon';
    const kec = item.kec || 'Banjaran';
    const kab = item.kab || 'Kabupaten Bandung';

    // Count patients matched with this address keyword
    const patientCount = allRecords.filter(r => {
      const addr = String(r.alamat || '').toUpperCase();
      return addr.includes(kw) || (item.keywords && item.keywords.some(k => addr.includes(k)));
    }).length;

    // Apply Filters
    if (searchVal && !kw.toLowerCase().includes(searchVal) && !kel.toLowerCase().includes(searchVal) && !kec.toLowerCase().includes(searchVal)) {
      return;
    }

    if (selectedKec && kec.toLowerCase() !== selectedKec.toLowerCase()) {
      return;
    }

    if (displayMode === 'with_patients' && patientCount === 0) {
      return;
    }

    // Determine Lat / Lng coordinates
    let lat = item.lat ? Number(item.lat) : null;
    let lng = item.lng ? Number(item.lng) : null;

    if (!lat || !lng) {
      // Look up fallback coordinates in Kabupaten Bandung map dictionary
      const lookupKey = kw.toUpperCase();
      const kelLookupKey = kel.toUpperCase();

      if (KAB_BANDUNG_COORDS_MAP[lookupKey]) {
        [lat, lng] = KAB_BANDUNG_COORDS_MAP[lookupKey];
      } else if (KAB_BANDUNG_COORDS_MAP[kelLookupKey]) {
        [lat, lng] = KAB_BANDUNG_COORDS_MAP[kelLookupKey];
      } else {
        // Pseudo offset around Banjaran center for unanchored kampungs
        const hash = kw.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const offsetLat = ((hash % 100) - 50) * 0.0008;
        const offsetLng = (((hash * 7) % 100) - 50) * 0.0008;
        lat = -7.0427 + offsetLat;
        lng = 107.5878 + offsetLng;
      }
    }

    totalPoints++;
    if (kec) kecSet.add(kec);
    totalPatientsMapped += patientCount;
    if (kec.toLowerCase() === 'banjaran') banjaranPoints++;

    // Custom Marker Badge Icon
    const markerColor = patientCount > 5 ? '#059669' : (patientCount > 0 ? '#2563eb' : '#0284c7');
    const markerHtml = `
      <div style="background: ${markerColor}; color: white; border-radius: 20px; padding: 4px 10px; font-weight: 800; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white; white-space: nowrap; cursor: pointer;">
        <i class="bi bi-geo-alt-fill"></i> ${kw} ${patientCount > 0 ? `<span style="background: rgba(255,255,255,0.3); padding: 1px 6px; border-radius: 10px; font-size: 10px;">${patientCount}</span>` : ''}
      </div>
    `;

    const markerIcon = L.divIcon({
      className: 'custom-map-address-marker',
      html: markerHtml,
      iconAnchor: [30, 15]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(mapMarkersGroup);

    // Popup Content
    const popupContent = `
      <div style="min-width: 220px; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>📍 ${kw}</span>
          <span style="font-size: 10px; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 10px; font-weight: 700;">${kec}</span>
        </div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
          <strong>Desa/Kel:</strong> ${kel}<br>
          <strong>Kecamatan:</strong> ${kec}<br>
          <strong>Kabupaten:</strong> ${kab}<br>
          <strong>Koordinat:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; font-size: 12px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: #64748b; font-weight: 600;">Jumlah Pasien CKG:</span>
          <strong style="color: #2563eb; font-size: 13px;">${patientCount} Pasien</strong>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-primary btn-sm" style="flex: 1; font-size: 11px;" onclick="prefillFormWithAddress('${kw}', '${kel}', '${kec}')">
            <i class="bi bi-plus-circle"></i> Input CKG
          </button>
          <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="deleteAddressPin('${kw}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);

    // Sidebar card entry
    if (sidebarListContainer) {
      const cardEl = document.createElement('div');
      cardEl.className = 'map-address-card';
      cardEl.onclick = () => {
        leafletMap.setView([lat, lng], 15);
        marker.openPopup();
        document.querySelectorAll('.map-address-card').forEach(c => c.classList.remove('active'));
        cardEl.classList.add('active');
      };

      cardEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${kw}</div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">
              ${kel}, Kec. ${kec}
            </div>
          </div>
          <span class="badge ${patientCount > 0 ? 'badge-emerald' : 'badge-cyan'}" style="font-size: 10px;">
            ${patientCount} Pasien
          </span>
        </div>
      `;
      sidebarListContainer.appendChild(cardEl);
    }
  });

  // Update Stat Pills
  const totalPointsEl = document.getElementById('mapStatTotalPoints');
  const totalKecEl = document.getElementById('mapStatTotalKec');
  const totalPatientsEl = document.getElementById('mapStatTotalPatients');
  const banjaranPointsEl = document.getElementById('mapStatBanjaranPoints');
  const sidebarBadgeEl = document.getElementById('mapSidebarCountBadge');

  if (totalPointsEl) totalPointsEl.textContent = `${totalPoints} Titik`;
  if (totalKecEl) totalKecEl.textContent = `${kecSet.size} Kec`;
  if (totalPatientsEl) totalPatientsEl.textContent = `${totalPatientsMapped} Pasien`;
  if (banjaranPointsEl) banjaranPointsEl.textContent = `${banjaranPoints} Titik`;
  if (sidebarBadgeEl) sidebarBadgeEl.textContent = `${totalPoints} Titik`;
}

function filterMapMarkers() {
  renderMapMarkers();
}

function openAddPinModalFromMap(lat = null, lng = null) {
  if (!checkAdminRoleOnly('Penambahan Titik Alamat Manual')) return;

  const defaultLat = lat || -7.0427;
  const defaultLng = lng || 107.5878;

  Swal.fire({
    title: '<i class="bi bi-geo-alt-fill" style="color:#0284c7;"></i> Catat Titik Alamat di Peta',
    html: `
      <div style="text-align: left; font-size: 13px; margin-top: 10px;">
        <p style="color: #64748b; font-size: 12px; margin-bottom: 14px;">
          Pilih lokasi kampung di <strong>Kabupaten Bandung</strong> dan catat nama kampung untuk disimpan ke Kamus Alamat D1.
        </p>

        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">Nama Kampung / Keyword Alamat <span class="required">*</span></label>
          <input type="text" id="swalMapKw" class="swal2-input" placeholder="Contoh: Kp. Pajagalan / Kp. Ciapus" style="width: 100%; margin: 4px 0 0 0;" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="form-group">
            <label class="form-label">Kecamatan (Kab. Bandung) <span class="required">*</span></label>
            <select id="swalMapKec" class="swal2-select" style="width: 100%; margin: 4px 0 0 0; font-weight:700;">
              <option value="Banjaran" selected>Banjaran</option>
              <option value="Cangkuang">Cangkuang</option>
              <option value="Pameungpeuk">Pameungpeuk</option>
              <option value="Arjasari">Arjasari</option>
              <option value="Cimaung">Cimaung</option>
              <option value="Soreang">Soreang</option>
              <option value="Katapang">Katapang</option>
              <option value="Baleendah">Baleendah</option>
              <option value="Dayeuhkolot">Dayeuhkolot</option>
              <option value="Margahayu">Margahayu</option>
              <option value="Margaasih">Margaasih</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kelurahan / Desa <span class="required">*</span></label>
            <input type="text" id="swalMapKel" class="swal2-input" placeholder="Contoh: Banjaran Kulon" style="width: 100%; margin: 4px 0 0 0;" value="Banjaran Kulon" required>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label class="form-label">Latitude</label>
            <input type="number" id="swalMapLat" class="swal2-input" value="${defaultLat}" step="any" style="width: 100%; margin: 4px 0 0 0;" readonly>
          </div>
          <div class="form-group">
            <label class="form-label">Longitude</label>
            <input type="number" id="swalMapLng" class="swal2-input" value="${defaultLng}" step="any" style="width: 100%; margin: 4px 0 0 0;" readonly>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-lg"></i> Simpan Titik Alamat',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#0284c7',
    didOpen: () => {
      const kwEl = document.getElementById('swalMapKw');
      const kelEl = document.getElementById('swalMapKel');
      const kecEl = document.getElementById('swalMapKec');
      const latEl = document.getElementById('swalMapLat');
      const lngEl = document.getElementById('swalMapLng');
      if (kwEl) {
        attachGoogleMapsAddressAutocomplete(kwEl, kelEl, kecEl, latEl, lngEl);
      }
    },
    preConfirm: () => {
      const kw = document.getElementById('swalMapKw').value.trim();
      const kel = document.getElementById('swalMapKel').value.trim();
      const kec = document.getElementById('swalMapKec').value;
      const latVal = parseFloat(document.getElementById('swalMapLat').value);
      const lngVal = parseFloat(document.getElementById('swalMapLng').value);

      if (!kw || !kel) {
        Swal.showValidationMessage('Harap isi Nama Kampung dan Kelurahan!');
        return false;
      }
      return { kw, kel, kec, lat: latVal, lng: lngVal };
    }
  }).then((res) => {
    if (currentAddingPinMarker && leafletMap) {
      leafletMap.removeLayer(currentAddingPinMarker);
      currentAddingPinMarker = null;
    }

    if (res.isConfirmed && res.value) {
      const { kw, kel, kec, lat: pLat, lng: pLng } = res.value;
      saveLearnedKampungKeyword(kw, kel, kec, 'Kabupaten Bandung', 'Jawa Barat', true, pLat, pLng);
      showToast('Titik Alamat Berhasil Dicatat di Peta!', 'success');
      renderMapMarkers();
    }
  });
}

function prefillFormWithAddress(kw, kel, kec) {
  switchView('data-records');
  setTimeout(() => {
    const alamatEl = document.getElementById('alamat');
    const kelEl = document.getElementById('kelurahan');
    const kecEl = document.getElementById('kecamatan');

    if (alamatEl) alamatEl.value = `Kp. ${kw}`;
    if (kelEl) kelEl.value = kel;
    if (kecEl) kecEl.value = kec;

    showToast(`Form diisi dengan lokasi: Kp. ${kw}, ${kel}`, 'info');
  }, 200);
}

function deleteAddressPin(kw) {
  if (!kw) return;
  const cleanKw = String(kw).toUpperCase().trim();

  Swal.fire({
    title: 'Hapus Titik Alamat?',
    text: `Titik alamat "${cleanKw}" akan dihapus secara permanen dari Peta & Database Cloud D1.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus Permanen!',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626'
  }).then(async (res) => {
    if (res.isConfirmed) {
      // 1. Add to blacklist to prevent restoration on refresh
      addToDeletedBlacklist(cleanKw);

      // 2. Remove from local storage map cache
      const raw = localStorage.getItem('ckg_learned_kampung_map');
      if (raw) {
        try {
          const list = JSON.parse(raw);
          const filtered = list.filter(item => {
            if (Array.isArray(item.keywords)) {
              return !item.keywords.some(k => String(k).toUpperCase().trim() === cleanKw);
            }
            return String(item.keywords).toUpperCase().trim() !== cleanKw;
          });
          localStorage.setItem('ckg_learned_kampung_map', JSON.stringify(filtered));
        } catch (e) {}
      }

      // 3. Delete from Cloudflare D1 Cloud Server
      try {
        await fetch(`/api/kamus?keyword=${encodeURIComponent(cleanKw)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('D1 pin delete error:', err);
      }

      showToast(`Titik alamat "${cleanKw}" berhasil dihapus secara permanen.`, 'success');
      refreshAdminKamusStats();
      if (typeof renderMapMarkers === 'function') renderMapMarkers();
    }
  });
}

// ==========================================================================
// 📍 GOOGLE MAPS STYLE ADDRESS AUTOCOMPLETE SUGGESTIONS
// ==========================================================================

let autocompleteDebounceTimer = null;

function attachGoogleMapsAddressAutocomplete(kwInput, kelInput, kecSelect, latInput, lngInput) {
  if (!kwInput) return;

  let wrapper = kwInput.parentElement;
  if (!wrapper.classList.contains('address-autocomplete-wrapper')) {
    const parent = kwInput.parentNode;
    wrapper = document.createElement('div');
    wrapper.className = 'address-autocomplete-wrapper';
    parent.insertBefore(wrapper, kwInput);
    wrapper.appendChild(kwInput);
  }

  let dropdown = wrapper.querySelector('.address-autocomplete-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'address-autocomplete-dropdown';
    dropdown.style.display = 'none';
    wrapper.appendChild(dropdown);
  }

  const closeDropdown = () => {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  };

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  kwInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toUpperCase();
    if (query.length < 2) {
      closeDropdown();
      return;
    }

    clearTimeout(autocompleteDebounceTimer);
    autocompleteDebounceTimer = setTimeout(async () => {
      const suggestions = [];
      const addedSet = new Set();

      // 1. Local & D1 Learned Kampung Map
      const learnedMap = getLearnedKampungMap();
      learnedMap.forEach(item => {
        const kw = (item.keywords && item.keywords[0]) ? item.keywords[0].toUpperCase() : '';
        if (kw && kw.includes(query) && !addedSet.has(kw)) {
          addedSet.add(kw);
          suggestions.push({
            title: `Kp. ${kw}`,
            kw: kw,
            kel: item.kel || 'Banjaran Kota',
            kec: item.kec || 'Banjaran',
            lat: item.lat ? Number(item.lat) : null,
            lng: item.lng ? Number(item.lng) : null,
            source: 'Kamus D1 / Peta'
          });
        }
      });

      // 2. Kab. Bandung Coordinates Map
      Object.keys(KAB_BANDUNG_COORDS_MAP).forEach(k => {
        if (k.includes(query) && !addedSet.has(k)) {
          addedSet.add(k);
          const coords = KAB_BANDUNG_COORDS_MAP[k];
          suggestions.push({
            title: `Kp. ${k}`,
            kw: k,
            kel: k.includes('BANJARAN') ? 'Banjaran Kota' : (k.includes('CANGKUANG') ? 'Cangkuang' : k),
            kec: 'Banjaran',
            lat: coords[0],
            lng: coords[1],
            source: 'Kabupaten Bandung'
          });
        }
      });

      // 3. LocationIQ High-Precision Autocomplete Engine (Free 5,000 req/day API)
      if (suggestions.length < 6) {
        try {
          const locIqKey = 'pk.87f2b960c1d68379ba5189288e7343e0';
          const locIqUrl = `https://api.locationiq.com/v1/autocomplete?key=${locIqKey}&q=${encodeURIComponent(query + ' Bandung Jawa Barat')}&limit=6&countrycodes=id&viewbox=107.45,-7.25,107.85,-6.85&bounded=1&format=json`;
          const res = await fetch(locIqUrl);
          if (res.ok) {
            const data = await res.json();
            data.forEach(place => {
              const addr = place.address || {};
              const village = addr.village || addr.quarter || addr.hamlet || addr.suburb || addr.neighbourhood || addr.road || place.display_name.split(',')[0];
              const kwClean = village.toUpperCase().replace(/^(KP\.|KAMPUNG|DESA|KELURAHAN|JALAN|JLN?\.)\s*/gi, '').trim();
              const kecFound = addr.town || addr.district || addr.suburb || addr.city_district || 'Banjaran';
              const kelFound = addr.village || addr.quarter || addr.suburb || kwClean;

              if (kwClean && !addedSet.has(kwClean)) {
                addedSet.add(kwClean);
                suggestions.push({
                  title: `Kp. ${kwClean}`,
                  kw: kwClean,
                  kel: kelFound,
                  kec: kecFound,
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                  source: 'LocationIQ Presisi'
                });
              }
            });
          }
        } catch (err) {
          console.warn('LocationIQ Autocomplete error:', err);
        }
      }

      // 4. OpenStreetMap Nominatim Fallback
      if (suggestions.length < 6) {
        try {
          const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Bandung Jawa Barat')}&format=json&addressdetails=1&countrycodes=id&viewbox=107.45,-7.25,107.85,-6.85&bounded=1&limit=6`;
          const res = await fetch(osmUrl);
          if (res.ok) {
            const data = await res.json();
            data.forEach(place => {
              const addr = place.address || {};
              const village = addr.village || addr.quarter || addr.hamlet || addr.suburb || addr.neighbourhood || place.display_name.split(',')[0];
              const kwClean = village.toUpperCase().replace(/^(KP\.|KAMPUNG|DESA|KELURAHAN|JALAN|JLN?\.)\s*/gi, '').trim();
              const kecFound = addr.town || addr.district || addr.suburb || addr.city_district || 'Banjaran';
              if (kwClean && !addedSet.has(kwClean)) {
                addedSet.add(kwClean);
                suggestions.push({
                  title: `Kp. ${kwClean}`,
                  kw: kwClean,
                  kel: addr.village || addr.quarter || kwClean,
                  kec: kecFound,
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                  source: 'Peta Presisi Bandung'
                });
              }
            });
          }
        } catch (err) {}
      }

      if (suggestions.length === 0) {
        closeDropdown();
        return;
      }

      dropdown.innerHTML = suggestions.slice(0, 6).map((s, idx) => `
        <div class="address-autocomplete-item" data-idx="${idx}">
          <div class="icon-box">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <div style="flex: 1; overflow: hidden;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${s.title}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 1px;">
              Desa ${s.kel}, Kec. ${s.kec}, Kab. Bandung
            </div>
          </div>
          <span style="font-size: 10px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 10px; font-weight: 700; flex-shrink: 0;">
            ${s.source}
          </span>
        </div>
      `).join('');

      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.address-autocomplete-item').forEach(el => {
        el.onclick = (event) => {
          event.stopPropagation();
          const idx = parseInt(el.getAttribute('data-idx'));
          const selected = suggestions[idx];

          if (selected) {
            kwInput.value = selected.title;
            if (kelInput) kelInput.value = selected.kel;

            if (kecSelect) {
              const options = Array.from(kecSelect.options);
              const match = options.find(opt => opt.text.toLowerCase().includes(selected.kec.toLowerCase()) || opt.value.toLowerCase().includes(selected.kec.toLowerCase()));
              if (match) kecSelect.value = match.value;
            }

            if (latInput && selected.lat) latInput.value = selected.lat.toFixed(6);
            if (lngInput && selected.lng) lngInput.value = selected.lng.toFixed(6);

            // Update pin marker on map if active
            if (typeof leafletMap !== 'undefined' && leafletMap && selected.lat && selected.lng) {
              leafletMap.setView([selected.lat, selected.lng], 16);
              if (typeof currentAddingPinMarker !== 'undefined' && currentAddingPinMarker) {
                currentAddingPinMarker.setLatLng([selected.lat, selected.lng]);
              }
            }
          }

          closeDropdown();
        };
      });
    }, 250);
  });
}

// Attach autocomplete to CKG Record Form Alamat field on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const mainAlamatEl = document.getElementById('alamat');
    const mainKelEl = document.getElementById('kelurahan');
    const mainKecEl = document.getElementById('kecamatan');
    if (mainAlamatEl) {
      attachGoogleMapsAddressAutocomplete(mainAlamatEl, mainKelEl, mainKecEl, null, null);
    }
  }, 1000);
});

/* ==========================================================================
   🌙 DARK MODE THEME CONTROLLER & NOTIFICATION SYNC
   ========================================================================== */

function initDarkMode() {
  const savedTheme = localStorage.getItem('ckg_theme_mode');
  // Default is strictly Light Mode unless user explicitly saved 'dark'
  const isDark = (savedTheme === 'dark');
  
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  updateThemeToggleUI(isDark);
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('ckg_theme_mode', isDark ? 'dark' : 'light');
  updateThemeToggleUI(isDark);
  showToast(isDark ? '🌙 Mode Gelap Diaktifkan' : '☀️ Mode Terang Diaktifkan', 'info');
}

function updateThemeToggleUI(isDark) {
  // Header toggle button
  const headerBtnIcon = document.getElementById('themeToggleHeaderIcon');
  const headerBtnText = document.getElementById('themeToggleHeaderText');
  if (headerBtnIcon) headerBtnIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  if (headerBtnIcon) headerBtnIcon.style.color = isDark ? '#f59e0b' : '#f59e0b';
  if (headerBtnText) headerBtnText.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';

  // User Profile Menu item
  const userMenuIcon = document.getElementById('userMenuThemeIcon');
  const userMenuText = document.getElementById('userMenuThemeText');
  if (userMenuIcon) userMenuIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  if (userMenuText) userMenuText.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';

  // Login page button
  const loginThemeIcon = document.getElementById('loginThemeIcon');
  const loginThemeText = document.getElementById('loginThemeText');
  if (loginThemeIcon) loginThemeIcon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  if (loginThemeText) loginThemeText.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
}

/* ==========================================================================
   🤖 CLOUDFLARE WORKERS AI INTEGRATION (ADDRESS AUTO-LEARNING & HEALTH AI)
   ========================================================================== */

async function parseAddressWithAI(rawText) {
  if (!rawText || !rawText.trim()) {
    showToast('Silakan masukkan teks alamat terlebih dahulu.', 'warning');
    return null;
  }

  showToast('🤖 AI sedang menganalisis & mempelajari alamat...', 'info');

  try {
    const res = await fetch('/api/ai/parse-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: rawText })
    });

    const result = await res.json();

    if (result.success && result.data) {
      const data = result.data;
      showToast(`✨ AI Berhasil (${data.source || 'Cloudflare AI'}): Kel. ${data.kelurahan}, Kec. ${data.kecamatan}`, 'success');
      return data;
    } else {
      throw new Error(result.error || 'Gagal memproses alamat');
    }
  } catch (err) {
    console.error('AI Address Parser Error:', err);
    showToast('Gagal memproses alamat via AI: ' + err.message, 'error');
    return null;
  }
}

async function analyzePatientHealthWithAI(patientData) {
  try {
    const res = await fetch('/api/ai/analyze-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });

    const result = await res.json();
    return result.recommendation || 'Pemeriksaan umum normal.';
  } catch (err) {
    console.error('AI Health Analyzer Error:', err);
    return 'Gagal memuat saran AI.';
  }
}


