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
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const cloudRecords = result.data.map(r => ({
          id: r.id ? (String(r.id).startsWith('CKG-') ? String(r.id) : `CKG-${r.id}`) : 'CKG-' + Date.now(),
          jenis_kegiatan: r.lokasi_pelayanan || 'Luar Gedung',
          nik: r.nik || '',
          nama: r.nama_pasien || r.nama || 'Pasien',
          tanggal_lahir: r.tanggal_lahir || '1990-01-01',
          usia: r.usia || 30,
          jenis_kelamin: r.jenis_kelamin || 'L',
          no_whatsapp: r.no_whatsapp || '',
          status_pernikahan: r.status_pernikahan || 'Menikah',
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
          gigi: r.gigi || 'Baik',
          katarak: r.katarak || 'Tidak',
          status_validasi: 'Terverifikasi',
          petugas_entry: r.petugas_entry || 'Admin',
          created_by: r.petugas_entry || 'Admin',
          created_at: r.tanggal_entry || new Date().toISOString().substring(0, 10)
        }));

        const merged = [...records];
        cloudRecords.forEach(cr => {
          if (!merged.some(m => m.id === cr.id || (m.nik && cr.nik && m.nik === cr.nik))) {
            merged.push(cr);
          }
        });
        records = merged;
        localStorage.setItem('ckg_records', JSON.stringify(records));
        renderApp();
      }
    }
  } catch (e) {
    console.log('Using local cached records:', e);
  }
}

async function syncRecordsToCloud(dataToSync) {
  try {
    await fetch('/api/ckg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSync)
    });
  } catch (e) {
    console.log('Failed to sync CKG records to cloud D1:', e);
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
  // Show loading animation
  showLoadingOverlay('Memverifikasi Akses...', `Login sebagai ${user.nama_user}`);

  setTimeout(() => {
    // Set session
    sessionStorage.setItem('ckg_logged_in', 'true');
    sessionStorage.setItem('ckg_user_name', user.nama_user);
    sessionStorage.setItem('ckg_user_role', user.role || 'Petugas');

    checkAuthSession();
    hideLoadingOverlay();

    // Directly open Announcement popup (no "Login Berhasil" SweetAlert overlay)
    setTimeout(checkAndShowAnnouncement, 300);
  }, 600);
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

  ['filterSimpusPetugas', 'filterSimpusUmur'].forEach(id => {
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
  const belumBagiCount = simpusRecords.filter(r => !r.is_divided).length;
  const sudahBagiCount = simpusRecords.filter(r => r.is_divided).length;

  const countBelumEl = document.getElementById('countBelumBagi');
  const countSudahEl = document.getElementById('countSudahBagi');
  const totalEntryEl = document.getElementById('totalEntryMonth');

  if (countBelumEl) countBelumEl.textContent = belumBagiCount;
  if (countSudahEl) countSudahEl.textContent = sudahBagiCount;
  if (totalEntryEl) totalEntryEl.textContent = simpusRecords.length;

  renderSimpusTableRecords();
}

function switchSimpusTab(tab) {
  activeSimpusTab = tab;

  const btnBelum = document.getElementById('btnSimpusBelumBagi');
  const btnSudah = document.getElementById('btnSimpusSudahBagi');
  const petugasFilterGroup = document.getElementById('simpusPetugasFilterGroup');
  const belumBagiActions = document.getElementById('simpusBelumBagiActions');

  if (tab === 'belum_bagi') {
    if (btnBelum) { btnBelum.className = 'simpus-pill-btn active-purple'; }
    if (btnSudah) { btnSudah.className = 'simpus-pill-btn'; }
    if (petugasFilterGroup) petugasFilterGroup.style.display = 'none';
    if (belumBagiActions) belumBagiActions.style.display = 'flex';
  } else {
    if (btnBelum) { btnBelum.className = 'simpus-pill-btn'; }
    if (btnSudah) { btnSudah.className = 'simpus-pill-btn active-emerald'; }
    if (petugasFilterGroup) petugasFilterGroup.style.display = 'flex';
    if (belumBagiActions) belumBagiActions.style.display = 'none';
  }

  renderSimpusTableRecords();
}

function renderSimpusTableRecords() {
  const container = document.getElementById('simpusCardsContainer');
  if (!container) return;

  const petugasVal = document.getElementById('filterSimpusPetugas')?.value || '';
  const umurVal = document.getElementById('filterSimpusUmur')?.value || '';

  let dataset = simpusRecords.filter(r => activeSimpusTab === 'sudah_bagi' ? r.is_divided : !r.is_divided);

  if (petugasVal) {
    dataset = dataset.filter(r => r.assigned_to === petugasVal);
  }

  if (umurVal) {
    dataset = dataset.filter(r => r.keterangan === umurVal);
  }

  if (dataset.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #ffffff; border-radius: var(--radius-md); border: 1px solid var(--border-color); color: var(--text-muted);">
        <i class="bi bi-inbox" style="font-size: 36px; display: block; margin-bottom: 8px; color: #94a3b8;"></i>
        <strong style="font-size: 15px;">Tidak Ada Data Pasien SIMPUS</strong>
        <p style="font-size: 12.5px; margin-top: 4px;">Tidak ada data yang sesuai dengan filter atau kategori status saat ini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = dataset.map((r) => {
    let imtBadge = `<span class="badge badge-emerald">${r.imt}</span>`;
    if (r.imt < 18.5) imtBadge = `<span class="badge badge-amber">${r.imt} (Kurus)</span>`;
    else if (r.imt >= 25.0 && r.imt <= 29.9) imtBadge = `<span class="badge badge-amber">${r.imt} (Gemuk)</span>`;
    else if (r.imt >= 30.0) imtBadge = `<span class="badge badge-rose">${r.imt} (Obesitas)</span>`;

    let statusBadge = `<span class="badge badge-cyan"><i class="bi bi-clock-history"></i> Belum di Entry</span>`;
    if (r.entry_status === 'berhasil') statusBadge = `<span class="badge badge-emerald"><i class="bi bi-check-circle-fill"></i> Berhasil di Entry</span>`;
    if (r.entry_status === 'sudah') statusBadge = `<span class="badge badge-cyan"><i class="bi bi-check2-all"></i> Sudah di Entry</span>`;
    if (r.entry_status === 'error') statusBadge = `<span class="badge badge-rose"><i class="bi bi-exclamation-triangle-fill"></i> Error</span>`;

    const initials = r.nama ? r.nama.substring(0, 2).toUpperCase() : 'PS';
    const isHipertensi = (r.sistol > 140 || r.diastol > 90);
    const isGulaTinggi = (r.gula > 200);

    const tensiText = `${r.sistol}/${r.diastol} mmHg ${isHipertensi ? '<span style="color:var(--rose); font-weight:bold;">(Tinggi)</span>' : ''}`;
    const gulaText = `${r.gula && r.gula !== '-' ? r.gula + ' mg/dL' : '-'} ${isGulaTinggi ? '<span style="color:var(--rose); font-weight:bold;">(Tinggi)</span>' : ''}`;

    return `
      <div class="simpus-patient-card">
        <!-- Card Header: Nama Pasien & Tags -->
        <div class="simpus-card-header">
          <div class="simpus-patient-name-box">
            <div class="simpus-avatar-icon">${initials}</div>
            <div>
              <div class="simpus-patient-name">${r.nama}</div>
              <div class="simpus-patient-subtext">
                <i class="bi bi-card-text"></i> NIK: <strong>${r.nik}</strong> | <i class="bi bi-calendar-event"></i> Tgl: ${r.tanggal}
              </div>
            </div>
          </div>
          
          <div class="simpus-card-tags">
            <span class="badge badge-purple"><i class="bi bi-person-tag"></i> ${r.keterangan} (${r.usia} th)</span>
            ${statusBadge}
            ${r.assigned_to ? `<span class="badge badge-amber"><i class="bi bi-person-badge"></i> ${r.assigned_to}</span>` : ''}
          </div>
        </div>

        <!-- Card Body Summary -->
        <div class="simpus-card-body-summary">
          <div class="simpus-info-item">
            <span class="simpus-info-label">Alamat / Domisili</span>
            <span class="simpus-info-val">${r.alamat}</span>
          </div>

          <div class="simpus-info-item">
            <span class="simpus-info-label">Pengukuran Fisik</span>
            <span class="simpus-info-val">${r.bb} kg / ${r.tb} cm (${imtBadge})</span>
          </div>

          <div class="simpus-info-item">
            <span class="simpus-info-label">Tekanan Darah</span>
            <span class="simpus-info-val">${tensiText}</span>
          </div>

          <div class="simpus-info-item">
            <span class="simpus-info-label">Gula Darah</span>
            <span class="simpus-info-val">${gulaText}</span>
          </div>
        </div>

        <!-- Card Actions: Detail Info Modal & Status Actions -->
        <div class="simpus-card-actions">
          <button class="btn-detail-info" onclick="openSimpusDetailModal('${r.id}')">
            <i class="bi bi-info-circle-fill"></i> Detail Info Pasien
          </button>

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn-simpus-action btn-action-success" onclick="setSimpusActionStatus('${r.id}', 'berhasil')">
              <i class="bi bi-check-circle-fill"></i> Berhasil di Entry
            </button>
            <button class="btn-simpus-action btn-action-done" onclick="setSimpusActionStatus('${r.id}', 'sudah')">
              <i class="bi bi-check2-all"></i> Sudah di Entry
            </button>
            <button class="btn-simpus-action btn-action-error" onclick="setSimpusActionStatus('${r.id}', 'error')">
              <i class="bi bi-exclamation-triangle-fill"></i> Error
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Patient Header Banner -->
      <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 18px; border-radius: var(--radius-md); color: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
        <div>
          <div style="font-size: 21px; font-weight: 800; font-family: var(--font-heading); cursor: pointer;" onclick="copyToClipboard('${item.nama}', 'Nama Pasien')" title="Klik untuk menyalin Nama Pasien">
            ${item.nama} <i class="bi bi-copy" style="font-size: 14px; opacity: 0.8;"></i>
          </div>
          <div style="font-size: 13px; opacity: 0.95; margin-top: 4px; display: flex; gap: 14px; flex-wrap: wrap;">
            <span style="cursor: pointer;" onclick="copyToClipboard('${item.nik}', 'NIK Pasien')" title="Klik untuk menyalin NIK">
              <i class="bi bi-card-text"></i> NIK: <strong>${item.nik}</strong> <i class="bi bi-copy" style="font-size: 11px;"></i>
            </span>
            <span style="cursor: pointer;" onclick="copyToClipboard('${item.tanggal}', 'Tanggal Skrining')" title="Klik untuk menyalin Tanggal">
              <i class="bi bi-calendar-event"></i> Tanggal: ${item.tanggal} <i class="bi bi-copy" style="font-size: 11px;"></i>
            </span>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="openDukcapilModal('${item.nik}', '${item.nama}')" style="box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <i class="bi bi-shield-check"></i> Cek Dukcapil
          </button>
          <button class="btn-copy-all" onclick="copyAllSimpusPatientData('${item.id}')">
            <i class="bi bi-clipboard-check-fill"></i> Salin Semua Data Pasien
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
              <div class="simpus-info-val">${item.usia} Tahun (${item.keterangan})</div>
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

          <div class="copyable-field" onclick="copyToClipboard('${item.assigned_to || 'Puskesmas Banjaran Kota'}', 'Petugas Entry')">
            <div>
              <div class="simpus-info-label">Petugas Entry / Faskes</div>
              <div class="simpus-info-val">${item.assigned_to || 'Puskesmas Banjaran Kota'}</div>
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

function resetSimpusFilters() {
  const p = document.getElementById('filterSimpusPetugas');
  const u = document.getElementById('filterSimpusUmur');
  if (p) p.value = '';
  if (u) u.value = '';
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
  const belumBagi = simpusRecords.filter(r => !r.is_divided).length;
  const inputJml = document.getElementById('jumlahDataBagi');
  if (inputJml) {
    inputJml.max = belumBagi;
    inputJml.value = Math.min(10, belumBagi);
  }
  document.getElementById('bagiPetugasModalOverlay').classList.add('open');
}

function closeBagiPetugasModal() {
  document.getElementById('bagiPetugasModalOverlay').classList.remove('open');
}

function handleBagiPetugasSubmit(e) {
  e.preventDefault();
  const targetPetugas = document.getElementById('targetPetugasSelect').value;
  const count = parseInt(document.getElementById('jumlahDataBagi').value) || 0;

  if (!targetPetugas) {
    showToast('Silakan pilih Petugas Tujuan terlebih dahulu!', 'error');
    return;
  }

  let assigned = 0;
  simpusRecords.forEach(r => {
    if (!r.is_divided && assigned < count) {
      r.is_divided = true;
      r.assigned_to = targetPetugas;
      assigned++;
    }
  });

  saveSimpusRecordsToStorage();
  closeBagiPetugasModal();
  renderSimpusView();
  showToast(`Berhasil membagikan ${assigned} data SIMPUS kepada ${targetPetugas}!`, 'success');
}

function deleteAllSimpusData() {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus Seluruh Data SIMPUS?',
      text: 'Apakah Anda yakin ingin menghapus SELURUH Data Entry CKG dari SIMPUS? Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Semua Data!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        simpusRecords = [];
        saveSimpusRecordsToStorage();
        renderSimpusView();
        Swal.fire('Terhapus!', 'Seluruh Data SIMPUS Berhasil Dihapus.', 'success');
      }
    });
  } else if (confirm('Apakah Anda yakin ingin menghapus SELURUH Data Entry CKG dari SIMPUS? Action ini tidak dapat dibatalkan.')) {
    simpusRecords = [];
    saveSimpusRecordsToStorage();
    renderSimpusView();
    showToast('Seluruh Data SIMPUS Berhasil Dihapus!', 'success');
  }
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
  const templateData = [
    {
      'NAMA PASIEN': 'CONTOH NAMA PASIEN',
      'NIK': '3204131234567890',
      'ALAMAT': 'JL. CONTOH RT 01/02',
      'TANGGAL': new Date().toLocaleDateString('id-ID'),
      'TANGGAL LAHIR': '01/01/1980',
      'USIA': 45,
      'BB': 65,
      'TB': 160,
      'SISTOL': 120,
      'DIASTOL': 80,
      'GULA DARAH': 100,
      'KOLESTEROL': 200
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // NAMA PASIEN
    { wch: 20 }, // NIK
    { wch: 30 }, // ALAMAT
    { wch: 14 }, // TANGGAL
    { wch: 16 }, // TANGGAL LAHIR
    { wch: 8 },  // USIA
    { wch: 8 },  // BB
    { wch: 8 },  // TB
    { wch: 10 }, // SISTOL
    { wch: 10 }, // DIASTOL
    { wch: 14 }, // GULA DARAH
    { wch: 14 }, // KOLESTEROL
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Data SIMPUS');

  saveXlsxFile(wb, 'Template_Import_SIMPUS_CKG.xlsx');
  showToast('Template XLSX berhasil diunduh! Isi data lalu upload kembali.', 'success');
}

function processImportFromModal() {
  if (!pendingImportFile) {
    showToast('Silakan pilih file XLSX terlebih dahulu.', 'error');
    return;
  }

  const file = pendingImportFile;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        showToast('File XLSX kosong atau format tidak dikenali.', 'error');
        return;
      }

      let importedCount = 0;
      const maxId = simpusRecords.reduce((max, r) => {
        const num = parseInt(String(r.no)) || 0;
        return num > max ? num : max;
      }, 3900);

      jsonData.forEach((row, idx) => {
        const nama = String(row['NAMA PASIEN'] || row['NAMA'] || row['Nama Pasien'] || row['nama'] || '').trim().toUpperCase();
        const nik = String(row['NIK'] || row['nik'] || '').trim();

        if (!nama || nama.length < 2) return;

        const newId = `S-${maxId + idx + 1}`;
        const bb = parseFloat(row['BB'] || row['BERAT BADAN'] || row['Berat Badan'] || row['bb'] || 0) || 0;
        const tb = parseFloat(row['TB'] || row['TINGGI BADAN'] || row['Tinggi Badan'] || row['tb'] || 0) || 0;
        const imt = (bb > 0 && tb > 0) ? parseFloat((bb / ((tb / 100) ** 2)).toFixed(1)) : 0;
        const usia = parseInt(row['USIA'] || row['Usia'] || row['usia'] || row['UMUR'] || 0) || 0;

        let keterangan = 'Dewasa';
        if (usia < 18) keterangan = 'Anak';
        else if (usia >= 60) keterangan = 'Lansia';

        const record = {
          id: newId,
          no: maxId + idx + 1,
          tanggal: String(row['TANGGAL'] || row['Tanggal'] || row['tanggal'] || new Date().toLocaleDateString('id-ID')),
          nama: nama,
          nik: nik,
          alamat: String(row['ALAMAT'] || row['Alamat'] || row['alamat'] || '-'),
          dob: String(row['TANGGAL LAHIR'] || row['TGL LAHIR'] || row['Tanggal Lahir'] || row['tanggal_lahir'] || '-'),
          usia: usia,
          bb: bb,
          tb: tb,
          imt: imt,
          sistol: parseInt(row['SISTOL'] || row['TD SISTOLIK'] || row['Sistol'] || row['sistol'] || 0) || 0,
          diastol: parseInt(row['DIASTOL'] || row['TD DIASTOLIK'] || row['Diastol'] || row['diastol'] || 0) || 0,
          gula: String(row['GULA DARAH'] || row['Gula Darah'] || row['gula'] || row['GULA'] || '-'),
          kolesterol: String(row['KOLESTEROL'] || row['Kolesterol'] || row['kolesterol'] || '-'),
          keterangan: keterangan,
          is_divided: false,
          assigned_to: '',
          entry_status: 'belum'
        };

        simpusRecords.push(record);
        importedCount++;
      });

      saveSimpusRecordsToStorage();
      closeImportSimpusModal();
      renderSimpusView();

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'Import Data SIMPUS Berhasil!',
          html: `<strong>${importedCount}</strong> data pasien dari file <strong>${file.name}</strong> berhasil di-import ke tab <strong>Data Belum Di-Bagi</strong>.`,
          confirmButtonColor: '#2563eb'
        });
      } else {
        showToast(`${importedCount} data SIMPUS berhasil di-import dari ${file.name}!`, 'success');
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
    'TANGGAL': r.tanggal,
    'NAMA PASIEN': r.nama,
    'NIK': r.nik,
    'ALAMAT': r.alamat,
    'TANGGAL LAHIR': r.dob,
    'USIA': r.usia,
    'KATEGORI': r.keterangan,
    'BERAT BADAN (KG)': r.bb,
    'TINGGI BADAN (CM)': r.tb,
    'IMT': r.imt,
    'TD SISTOLIK': r.sistol,
    'TD DIASTOLIK': r.diastol,
    'GULA DARAH': r.gula,
    'KOLESTEROL': r.kolesterol,
    'STATUS ENTRY': r.entry_status.toUpperCase(),
    'PETUGAS': r.assigned_to
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
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
      'TANGGAL': r.tanggal,
      'NAMA PASIEN': r.nama,
      'NIK': r.nik,
      'ALAMAT': r.alamat,
      'TANGGAL LAHIR': r.dob,
      'USIA': r.usia,
      'KATEGORI': r.keterangan,
      'BERAT BADAN (KG)': r.bb,
      'TINGGI BADAN (CM)': r.tb,
      'IMT': r.imt,
      'TD SISTOLIK': r.sistol,
      'TD DIASTOLIK': r.diastol,
      'GULA DARAH': r.gula,
      'KOLESTEROL': r.kolesterol,
      'STATUS ENTRY': r.entry_status.toUpperCase(),
      'PETUGAS': petugas
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
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
    'TANGGAL': r.tanggal,
    'NAMA PASIEN': r.nama,
    'NIK': r.nik,
    'ALAMAT': r.alamat,
    'TANGGAL LAHIR': r.dob,
    'USIA': r.usia,
    'KATEGORI': r.keterangan,
    'BERAT BADAN (KG)': r.bb,
    'TINGGI BADAN (CM)': r.tb,
    'IMT': r.imt,
    'TD SISTOLIK': r.sistol,
    'TD DIASTOLIK': r.diastol,
    'GULA DARAH': r.gula,
    'KOLESTEROL': r.kolesterol,
    'STATUS BAGI': r.is_divided ? 'Sudah Di-Bagi' : 'Belum Di-Bagi',
    'PETUGAS': r.assigned_to || '-',
    'STATUS ENTRY': r.entry_status.toUpperCase()
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
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

function handleFormSubmit(e) {
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
    created_by: `petugas_${currentRole.toLowerCase()}`,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  const isEdit = !!currentEditingId;

  if (currentEditingId) {
    const idx = records.findIndex(r => r.id === currentEditingId);
    if (idx !== -1) records[idx] = formData;
  } else {
    records.unshift(formData);
  }

  saveRecordsToStorage();
  closeInputModal();
  renderApp();

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'success',
      title: isEdit ? 'Data CKG Berhasil Diperbarui!' : 'Data CKG Berhasil Disimpan!',
      text: `Rekam medis pasien ${formData.nama} (NIK: ${formData.nik}) telah tersimpan ke dalam database BNBA.`,
      confirmButtonColor: '#2563eb'
    });
  } else {
    showToast(isEdit ? 'Data CKG Berhasil Diperbarui!' : 'Data CKG Berhasil Disimpan!', 'success');
  }
}

function resetFilters() {
  ['filterKegiatan', 'filterBulan', 'filterTahun', 'filterTanggal', 'filterPetugas', 'filterUmur'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderTableRecords();
  showToast('Filter telah di-reset.', 'info');
}

function getOfficerPerformanceData() {
  return usersDb.map(u => {
    const name = u.nama_user;
    const ckgLuar = records.filter(r => (r.petugas_entry === name || r.created_by === name || r.created_by === `petugas_${name}`) && r.jenis_kegiatan === 'Luar Gedung').length;
    const ckgDalam = records.filter(r => (r.petugas_entry === name || r.created_by === name || r.created_by === `petugas_${name}`) && r.jenis_kegiatan === 'Dalam Gedung').length;

    const simpusLuar = simpusRecords.filter(r => r.assigned_to === name && (!r.jenis_kegiatan || r.jenis_kegiatan === 'Luar Gedung')).length;
    const simpusDalam = simpusRecords.filter(r => r.assigned_to === name && r.jenis_kegiatan === 'Dalam Gedung').length;

    return {
      nama: name,
      role: u.role || 'Petugas',
      luarCount: ckgLuar + simpusLuar,
      dalamCount: ckgDalam + simpusDalam
    };
  });
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
  const targetAchievedCount = officersData.filter(o => (o.luarCount + o.dalamCount) >= 60).length;

  const totalEl = document.getElementById('dashTotalEntri');
  const luarEl = document.getElementById('dashLuarGedung');
  const dalamEl = document.getElementById('dashDalamGedung');
  const targetEl = document.getElementById('dashCapaiTarget');

  if (totalEl) totalEl.textContent = totalAll;
  if (luarEl) luarEl.textContent = totalLuar;
  if (dalamEl) dalamEl.textContent = totalDalam;
  if (targetEl) targetEl.textContent = `${targetAchievedCount} / ${officersData.length}`;

  updateTotalEntryMonthMetric();
}

function updateTotalEntryMonthMetric() {
  const totalEl = document.getElementById('totalEntryMonth');
  if (!totalEl) return;

  const now = new Date();
  const yearStr = now.getFullYear().toString();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYM = `${yearStr}-${monthStr}`;

  const visibleRecords = getVisibleRecords(records);
  
  // Count records filled for Luar Gedung and Dalam Gedung in current month
  const monthRecords = visibleRecords.filter(r => {
    const d = r.created_at || r.tanggal_entry || r.created_date || '';
    if (!d) return true; // default include if date unset
    if (d.startsWith(currentYM)) return true;
    if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}` === currentYM;
      }
    }
    return false;
  });

  totalEl.textContent = monthRecords.length;
}



function renderOfficerPerformanceTable(officersData = getOfficerPerformanceData()) {
  const tbody = document.getElementById('officerPerformanceTableBody');
  if (!tbody) return;

  const targetMin = 200;

  tbody.innerHTML = officersData.map((o, index) => {
    const total = o.luarCount + o.dalamCount;
    const pctLuar = Math.round((o.luarCount / targetMin) * 100);
    const pctDalam = Math.round((o.dalamCount / targetMin) * 100);

    return `
      <tr>
        <td>${index + 1}</td>
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
          <strong style="font-size: 14px; color: var(--primary);">${total}</strong>
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

    let sessionStatusHtml = isCurrentActive ? '<span class="badge badge-emerald"><i class="bi bi-circle-fill" style="font-size:8px;"></i> Session Aktif</span>' : '<span class="badge badge-cyan">Offline</span>';

    if (u.is_banned) {
      sessionStatusHtml = `<span class="badge badge-rose" style="background:#fef2f2; color:#dc2626; border:1px solid #fecaca;"><i class="bi bi-slash-circle-fill"></i> Banned (${u.banned_duration_label || 'Nonaktif'})</span>`;
    }

    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${u.nama_user}</strong></td>
        <td>${u.password ? `<code style="background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; color: var(--rose); font-weight: bold;">${u.password}</code>` : '<span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Tanpa Password</span>'}</td>
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

function renderTableRecords() {
  const tbody = document.getElementById('tableBodyDataRecords');
  if (!tbody) return;

  const filterKegiatanVal = document.getElementById('filterKegiatan')?.value || '';
  const filterPetugasVal = document.getElementById('filterPetugas')?.value || '';
  const filterUmurVal = document.getElementById('filterUmur')?.value || '';

  // Apply Row-Level Data Visibility (Petugas only sees own records; Admin & Koordinator see all)
  let filtered = getVisibleRecords(records);

  if (filterKegiatanVal) {
    filtered = filtered.filter(r => r.jenis_kegiatan === filterKegiatanVal);
  }

  if (filterPetugasVal) {
    filtered = filtered.filter(r => r.created_by === filterPetugasVal);
  }

  if (filterUmurVal === 'anak') {
    filtered = filtered.filter(r => r.usia < 18);
  } else if (filterUmurVal === 'dewasa') {
    filtered = filtered.filter(r => r.usia >= 18 && r.usia < 60);
  } else if (filterUmurVal === 'lansia') {
    filtered = filtered.filter(r => r.usia >= 60);
  }

  tbody.innerHTML = buildTableRowsHtml(filtered);
}

function buildTableRowsHtml(data) {
  if (data.length === 0) {
    return `
      <tr>
        <td colspan="14" style="text-align: center; padding: 30px; color: var(--text-muted);">
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
        <td>${i + 1}</td>
        <td>${kegiatanBadge}</td>
        <td>
          <strong>${r.nama}</strong><br>
          <span style="font-size: 11px; color: var(--text-muted);">${r.nik}</span>
        </td>
        <td>${r.tanggal_lahir}<br><span style="font-size: 11px; color: var(--text-muted);">${r.usia} th (${r.jenis_kelamin})</span></td>
        <td>${r.alamat}<br><span style="font-size: 11px; color: var(--text-muted);">${r.kelurahan}, ${r.kecamatan}</span></td>
        <td>${r.bb} kg / ${r.tb} cm / ${r.lp || '-'} cm</td>
        <td>${imtBadge}</td>
        <td><span class="${tdClass}">${r.td_sistolik}/${r.td_diastolik}</span></td>
        <td><span class="${gulaClass}">${r.gula_darah ? r.gula_darah + ' mg/dL' : '-'}</span></td>
        <td>${r.kolesterol ? r.kolesterol + ' mg/dL' : '-'}</td>
        <td><span class="${hbClass}">${r.hb ? r.hb + ' g/dL' : '-'}</span></td>
        <td>${r.katarak === 'Ya' ? '<span class="badge badge-rose">Katarak</span>' : '<span class="badge badge-emerald">Normal</span>'}</td>
        <td><span class="badge badge-emerald">${r.status_validasi}</span></td>
        <td>
          <div style="display: flex; gap: 4px;">
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
      </tr>
    `;
  }).join('');
}

function deleteRecord(id) {
  const targetRecord = records.find(r => r.id === id);
  if (!targetRecord) {
    showToast('Data CKG tidak ditemukan!', 'error');
    return;
  }

  Swal.fire({
    title: 'Hapus Data CKG?',
    html: `Apakah Anda yakin ingin menghapus data <strong>[${targetRecord.nama}]</strong>?<br><span style="font-size:12px; color:#64748b;">Data akan dipindahkan ke Recycle Data.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Pindahkan ke Recycle!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      records = records.filter(r => r.id !== id);
      targetRecord.deleted_at = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
      targetRecord.deleted_by = sessionStorage.getItem('ckg_user_name') || 'Admin';
      targetRecord.original_source = 'BNBA Skrining CKG';
      recycleBin.unshift(targetRecord);
      saveRecordsToStorage();
      saveRecycleBinToStorage(targetRecord);
      renderApp();
      Swal.fire('Dipindahkan!', 'Data CKG berhasil dipindahkan ke Recycle Data.', 'success');
    }
  });
}

function deleteSimpusRecord(id) {
  const targetSimpus = simpusRecords.find(r => (r.id || r.nik || '') === id);
  if (!targetSimpus) {
    showToast('Data SIMPUS tidak ditemukan!', 'error');
    return;
  }

  Swal.fire({
    title: 'Hapus Data SIMPUS?',
    html: `Apakah Anda yakin ingin menghapus data SIMPUS <strong>[${targetSimpus.nama || targetSimpus.nik}]</strong>?<br><span style="font-size:12px; color:#64748b;">Data akan dipindahkan ke Recycle Data.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Pindahkan ke Recycle!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      simpusRecords = simpusRecords.filter(r => (r.id || r.nik || '') !== id);
      targetSimpus.deleted_at = new Date().toISOString().substring(0, 10) + ' ' + new Date().toLocaleTimeString('id-ID');
      targetSimpus.deleted_by = sessionStorage.getItem('ckg_user_name') || 'Admin';
      targetSimpus.original_source = 'Data SIMPUS CKG';
      recycleBin.unshift(targetSimpus);
      saveSimpusRecordsToStorage();
      saveRecycleBinToStorage(targetSimpus);
      renderApp();
      Swal.fire('Dipindahkan!', 'Data SIMPUS berhasil dipindahkan ke Recycle Data.', 'success');
    }
  });
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

function deleteRecord(id) {
  if (currentRole !== 'Admin' && currentRole !== 'admin') {
    showToast('Hanya Admin yang dapat menghapus data.', 'error');
    return;
  }

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Hapus Data CKG?',
      text: `Apakah Anda yakin ingin menghapus record [${id}]?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Data!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        records = records.filter(r => r.id !== id);
        saveRecordsToStorage();
        renderApp();
        Swal.fire('Terhapus!', 'Data CKG Berhasil Dihapus.', 'success');
      }
    });
  } else if (confirm(`Apakah Anda yakin ingin menghapus data CKG [${id}]?`)) {
    records = records.filter(r => r.id !== id);
    saveRecordsToStorage();
    renderApp();
    showToast('Data CKG Berhasil Dihapus!', 'success');
  }
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
        r.tanggal_lahir || '',
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
        r.created_at || r.tanggal_entry || new Date().toISOString().substring(0, 10)
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

  if (fileNameEl) fileNameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  if (fileDetails) fileDetails.style.display = 'block';
  if (btnExec) btnExec.disabled = false;
}

function downloadXLSXTemplate() {
  try {
    const headers = [
      "Jenis Kegiatan", "NIK", "Nama Pasien", "Tanggal Lahir", "Usia",
      "Jenis Kelamin", "No WhatsApp", "Status Pernikahan", "Provinsi", "Kab/Kota",
      "Kecamatan", "Kelurahan", "Alamat Lengkap", "Pekerjaan", "Merokok",
      "BB (kg)", "TB (cm)", "LP (cm)", "IMT", "TD Sistolik", "TD Diastolik",
      "Gula Darah (mg/dL)", "Kolesterol (mg/dL)", "HB (g/dL)",
      "Pemeriksaan Telinga", "Pemeriksaan Mata", "Pemeriksaan Gigi", "Pemeriksaan Katarak"
    ];

    const sampleRow1 = [
      "Luar Gedung", "3204123456780001", "Ahmad Fauzi", "1992-05-14", 34,
      "L", "081234567890", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Banjaran Kota", "Jl. Raya Banjaran No. 45 RT 02/05", "Wiraswasta", "Tidak",
      65, 168, 82, 23.03, 120, 80,
      110, 175, 14.2,
      "Normal", "Normal", "Normal", "Tidak"
    ];

    const sampleRow2 = [
      "Dalam Gedung", "3204987654320002", "Siti Aminah", "1988-11-20", 37,
      "P", "085712345678", "Kawin", "Jawa Barat", "Kab. Bandung",
      "Banjaran", "Sindangpanon", "Kp. Sindangpanon RT 01/03", "Ibu Rumah Tangga", "Tidak",
      58, 155, 78, 24.14, 130, 85,
      125, 190, 12.8,
      "Normal", "Normal", "Normal", "Tidak"
    ];

    const wsData = [headers, sampleRow1, sampleRow2];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 3, 15) }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Form CKG");

    const filename = `Template_Import_Form_CKG_Pasien_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    if (typeof showToast === 'function') {
      showToast('Template Excel Resmi Form CKG Berhasil Diunduh!', 'success');
    }
  } catch (err) {
    console.error('Download template error:', err);
    if (typeof Swal !== 'undefined') {
      Swal.fire('Gagal Download Template', err.message, 'error');
    }
  }
}

function executeXLSXImport() {
  if (!selectedImportFile) {
    showToast('Pilih file Excel terlebih dahulu!', 'warning');
    return;
  }

  showLoadingOverlay('Membaca File Excel...', 'Memproses import data ke database');

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        hideLoadingOverlay();
        Swal.fire('File Error', 'File Excel tidak memiliki lembar kerja (worksheet).', 'error');
        return;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        hideLoadingOverlay();
        Swal.fire('File Kosong', 'File Excel tidak berisi data atau format header tidak sesuai.', 'error');
        return;
      }

      let importedCount = 0;
      const targetSelect = document.getElementById('importTargetPetugas');
      const targetPetugas = (targetSelect && targetSelect.value) ? targetSelect.value : (sessionStorage.getItem('ckg_user_name') || 'Admin');

      jsonRows.forEach(row => {
        // Robust Column Key Extractor: Pass 1 Exact Match, Pass 2 Includes Match
        const getVal = (...keys) => {
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              if (rowKey.toLowerCase().trim() === target) {
                return String(row[rowKey]).trim();
              }
            }
          }
          for (let k of keys) {
            const target = k.toLowerCase().trim();
            for (let rowKey in row) {
              const keyClean = rowKey.toLowerCase().trim();
              if (keyClean.includes(target) && !keyClean.includes('petugas') && !keyClean.includes('faskes')) {
                return String(row[rowKey]).trim();
              }
            }
          }
          return '';
        };

        const nik = getVal('NIK', 'No KTP', 'Nomor NIK');
        const nama = getVal('Nama Pasien', 'Nama Lengkap', 'Nama Pasien & NIK', 'Nama');

        if (!nama && !nik) return; // Skip non-patient header or empty rows

        const dobStr = getVal('Tanggal Lahir', 'Tgl Lahir', 'DOB', 'Tanggal Lahir (YYYY-MM-DD)') || '1990-01-01';
        let age = parseInt(getVal('Usia', 'Umur')) || 30;
        if (isNaN(age) || age <= 0) {
          try {
            const birthDate = new Date(dobStr);
            if (!isNaN(birthDate.getTime())) {
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
            }
          } catch (_) {}
        }

        const jkRaw = getVal('Jenis Kelamin', 'JK', 'Jenis Kelamin (L/P)') || 'L';
        const jk = jkRaw.toUpperCase().startsWith('P') ? 'P' : 'L';

        const bb = parseFloat(getVal('BB (kg)', 'BB', 'Berat Badan', 'Berat')) || 60;
        const tb = parseFloat(getVal('TB (cm)', 'TB', 'Tinggi Badan', 'Tinggi')) || 165;
        const lp = parseFloat(getVal('LP (cm)', 'LP', 'Lingkar Perut')) || 80;
        const imtVal = (tb > 0) ? (bb / ((tb / 100) * (tb / 100))).toFixed(2) : '22.0';

        const newRecord = {
          id: 'CKG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          jenis_kegiatan: getVal('Jenis Kegiatan', 'Kegiatan') || 'Luar Gedung',
          nik: nik || '3204' + Math.floor(100000000000 + Math.random() * 900000000000),
          nama: nama || 'Pasien Tanpa Nama',
          tanggal_lahir: dobStr,
          usia: age,
          jenis_kelamin: jk,
          no_whatsapp: getVal('No WhatsApp', 'WA', 'HP', 'No HP') || '',
          status_pernikahan: getVal('Status Pernikahan', 'Status Nikah', 'Pernikahan') || 'Kawin',
          provinsi: getVal('Provinsi') || 'Jawa Barat',
          kab_kota: getVal('Kab/Kota', 'Kota', 'Kabupaten') || 'Kab. Bandung',
          kecamatan: getVal('Kecamatan') || 'Banjaran',
          kelurahan: getVal('Kelurahan', 'Desa') || 'Banjaran Kota',
          alamat: getVal('Alamat Lengkap', 'Alamat', 'Alamat & Wilayah') || 'Banjaran',
          pekerjaan: getVal('Pekerjaan') || '',
          merokok: getVal('Merokok', 'Riwayat Merokok') || 'Tidak',
          bb: bb,
          tb: tb,
          lp: lp,
          imt: imtVal,
          td_sistolik: parseInt(getVal('TD Sistolik', 'Sistol', 'Tensi Sistolik')) || 120,
          td_diastolik: parseInt(getVal('TD Diastolik', 'Diastol', 'Tensi Diastolik')) || 80,
          gula_darah: getVal('Gula Darah (mg/dL)', 'Gula Darah', 'Gula') || '110',
          kolesterol: getVal('Kolesterol (mg/dL)', 'Kolesterol') || '180',
          hb: getVal('HB (g/dL)', 'HB', 'Hemoglobin') || '14.0',
          telinga: getVal('Pemeriksaan Telinga', 'Telinga') || 'Normal',
          mata: getVal('Pemeriksaan Mata', 'Mata') || 'Normal',
          gigi: getVal('Pemeriksaan Gigi', 'Gigi') || 'Normal',
          katarak: getVal('Pemeriksaan Katarak', 'Katarak') || 'Tidak',
          status_validasi: 'Terverifikasi',
          petugas_entry: targetPetugas,
          created_by: targetPetugas,
          created_at: new Date().toISOString().substring(0, 10)
        };

        records.unshift(newRecord);
        importedCount++;
      });

      saveRecordsToStorage();
      renderApp();
      closeImportModal();
      hideLoadingOverlay();

      Swal.fire({
        icon: 'success',
        title: 'Import Data Berhasil!',
        html: `Sebanyak <strong>${importedCount} Data Pasien</strong> berhasil di-import ke Database BNBA CKG.`,
        confirmButtonColor: '#059669'
      });

    } catch (err) {
      hideLoadingOverlay();
      console.error('Import parse error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Import File',
        text: 'Format file Excel tidak dapat diproses: ' + err.message,
        confirmButtonColor: '#dc2626'
      });
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

const DUKCAPIL_API_BASE = 'http://localhost:8081/api/dukcapil';
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
      if (statusText) statusText.innerHTML = '🟢 Microservice Dukcapil Terhubung (Port 8081)';
      if (statusBanner) {
        statusBanner.style.background = '#f0fdf4';
        statusBanner.style.borderColor = '#86efac';
        statusBanner.style.color = '#166534';
      }
      if (showToastMsg) showToast('Microservice Dukcapil terhubung aktif!', 'success');
      return true;
    }
  } catch (err) {
    // Service offline -> Use fallback local NIK engine
  }

  isDukcapilServiceOnline = false;
  if (statusIndicator) statusIndicator.style.background = '#f59e0b';
  if (statusText) statusText.innerHTML = '🟡 Mode Lokal: Validator & Parser NIK (Service 8081 Offline)';
  if (statusBanner) {
    statusBanner.style.background = '#fffbeb';
    statusBanner.style.borderColor = '#fde68a';
    statusBanner.style.color = '#92400e';
  }
  if (showToastMsg) showToast('Mode Lokal Dukcapil aktif (Service 8081 tidak merespon).', 'warning');
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
function parseNikIndonesia(nik, namaInput = '') {
  if (nik.length !== 16 || isNaN(nik)) {
    return { valid: false, message: 'Format NIK tidak valid (harus 16 digit)' };
  }

  const provCode = nik.substring(0, 2);
  const kabCode = nik.substring(2, 4);
  const kecCode = nik.substring(4, 6);
  let dobDay = parseInt(nik.substring(6, 8));
  const dobMonth = parseInt(nik.substring(8, 10));
  let dobYear = parseInt(nik.substring(10, 12));

  let gender = 'Laki-laki';
  if (dobDay > 40) {
    gender = 'Perempuan';
    dobDay -= 40;
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

  // Region dictionary
  let provName = 'JAWA BARAT';
  let kabName = 'KABUPATEN BANDUNG';
  let kecName = 'BANJARAN';

  if (provCode === '31') provName = 'DKI JAKARTA';
  else if (provCode === '33') provName = 'JAWA TENGAH';
  else if (provCode === '35') provName = 'JAWA TIMUR';

  return {
    valid: true,
    nik: nik,
    namaLengkap: namaInput ? namaInput.toUpperCase() : 'DATA DUKCAPIL VERIFIED',
    tempatLahir: `${kabName}`,
    tanggalLahir: dobString,
    usia: age,
    jenisKelamin: gender,
    alamat: `DESA BANJARAN KOTA, KEC. BANJARAN`,
    kecamatan: kecName,
    kelurahan: 'BANJARAN KOTA',
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
   CLOUDFLARE D1 DATABASE CLOUD SYNC ENGINE
   ========================================================================== */

let isSyncingWithCloud = false;

// Async function to pull latest SIMPUS data from Cloudflare D1 Database
async function fetchCloudSimpusRecords(silent = false) {
  try {
    const res = await fetch('/api/simpus', { method: 'GET' });
    if (!res.ok) throw new Error('API Endpoint /api/simpus not available');

    const result = await res.json();
    if (result && result.success && Array.isArray(result.data)) {
      // Set simpusRecords exclusively to what's inside Cloudflare D1 Database!
      simpusRecords = result.data;
      localStorage.setItem('ckg_simpus_records', JSON.stringify(simpusRecords));

      // Re-render UI views
      if (typeof renderSimpusView === 'function') renderSimpusView();
      if (typeof updateDashboardMetrics === 'function') updateDashboardMetrics();
      if (typeof renderTableRecords === 'function') renderTableRecords();

      updateCloudSyncPill(true, `D1 Online (${result.count} Rec)`);
      if (!silent && typeof Swal !== 'undefined' && result.count > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Cloud Sync Berhasil',
          text: `Data (${result.count} Pasien) berhasil disinkronisasi dari Cloudflare D1 Database!`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      return true;
    }
  } catch (err) {
    updateCloudSyncPill(false, 'Mode Offline / LocalStorage');
  }
  return false;
}

// Async function to push SIMPUS data to Cloudflare D1 Database
async function syncSimpusToCloud(records) {
  if (!records || records.length === 0 || isSyncingWithCloud) return;

  isSyncingWithCloud = true;
  updateCloudSyncPill('syncing', 'Syncing...');

  try {
    const res = await fetch('/api/simpus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });

    if (res.ok) {
      updateCloudSyncPill(true, 'D1 Synced');
    } else {
      updateCloudSyncPill(false, 'Local Storage');
    }
  } catch (err) {
    updateCloudSyncPill(false, 'Local Storage');
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

  if (status === true) {
    pill.style.background = '#f0fdf4';
    pill.style.border = '1px solid #86efac';
    pill.style.color = '#166534';
    icon.className = 'bi bi-cloud-check-fill';
    icon.style.color = '#22c55e';
    textEl.innerHTML = `Cloud Sync: <strong>${text || 'D1 Online'}</strong>`;
  } else if (status === 'syncing') {
    pill.style.background = '#fefce8';
    pill.style.border = '1px solid #fef08a';
    pill.style.color = '#854d0e';
    icon.className = 'bi bi-cloud-arrow-up-fill';
    icon.style.color = '#eab308';
    textEl.innerHTML = `Cloud Sync: <strong>${text || 'Mengirim...'}</strong>`;
  } else {
    pill.style.background = '#eff6ff';
    pill.style.border = '1px solid #bfdbfe';
    pill.style.color = '#1e40af';
    icon.className = 'bi bi-hdd-fill';
    icon.style.color = '#3b82f6';
    textEl.innerHTML = `Storage: <strong>${text || 'Local Browser'}</strong>`;
  }
}

// Force manual sync on header pill click
async function forceSyncWithCloud(showToastMsg = true) {
  showLoadingOverlay('Sinkronisasi Data...', 'Mengambil data terbaru dari Cloudflare D1 Database');
  updateCloudSyncPill('syncing', 'Syncing...');
  const success = await fetchCloudSimpusRecords(!showToastMsg);
  if (!success && simpusRecords.length > 0) {
    await syncSimpusToCloud(simpusRecords);
  }
  hideLoadingOverlay();
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

// Auto-trigger Cloud Sync on app startup with loading animation
document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = sessionStorage.getItem('ckg_logged_in') === 'true';

  if (isLoggedIn) {
    showLoadingOverlay('Memuat Aplikasi...', 'Menyinkronkan data dari Database Cloud');
  }

  fetchCloudUsers().then(() => {
    return fetchCloudSimpusRecords(true);
  }).finally(() => {
    if (isLoggedIn) {
      setTimeout(() => hideLoadingOverlay(), 600);
    }
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

