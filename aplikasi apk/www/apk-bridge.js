/**
 * APK Bridge & Role-Based Menu, Mobile Sidebar, Remember Password & Enhanced OCR
 * Puskesmas Banjaran Kota - Sistem Informasi CKG
 */
(function() {
  'use strict';

  // Pastikan kelas is-native-apk aktif di APK Capacitor
  const isCapacitorEnv = Boolean(
    (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' ||
    (navigator.userAgent && navigator.userAgent.includes('Capacitor')) ||
    window.location.search.includes('apk=1') ||
    window.location.search.includes('native=1') ||
    (window.Capacitor && window.Capacitor.platform === 'android')
  );

  if (isCapacitorEnv) {
    document.documentElement.classList.add('is-native-apk');
    if (document.body) document.body.classList.add('is-native-apk');
    window.IS_NATIVE_APK = true;
  }

  /* ==========================================================================
     1. HELPER: CEK IZIN MENU BERDASARKAN ROLE USER
     ========================================================================== */
  window.isMenuAllowedForCurrentRole = function(menuId) {
    const role = (sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas')).toLowerCase();
    const portalType = (sessionStorage.getItem('ckg_portal_type') || 'puskesmas').toLowerCase();

    // Admin selalu punya hak akses penuh ke seluruh menu
    if (role === 'admin') return true;

    // Ambil konfigurasi menu terkini
    const config = (typeof currentMenuConfig !== 'undefined' && Array.isArray(currentMenuConfig) && currentMenuConfig.length > 0)
      ? currentMenuConfig
      : (typeof DEFAULT_MENU_CONFIG !== 'undefined' ? DEFAULT_MENU_CONFIG : []);

    const item = config.find(m => m.id === menuId);
    if (!item) return false;
    if (item.enabled === false) return false;

    const permittedRoles = item.roles || item.defaultRoles || [];

    if (portalType === 'sekolah') {
      let allowedArr = [];
      try {
        const raw = sessionStorage.getItem('ckg_allowed_menus') || '[]';
        allowedArr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (_) { }
      return allowedArr.includes(menuId) && permittedRoles.includes('sekolah');
    } else if (portalType === 'posyandu') {
      let allowedArr = [];
      try {
        const raw = sessionStorage.getItem('ckg_allowed_menus') || '[]';
        allowedArr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (_) { }
      return allowedArr.includes(menuId) && permittedRoles.includes('posyandu');
    } else {
      return permittedRoles.includes(role);
    }
  };

  /* ==========================================================================
     2. MOBILE SIDEBAR DRAWER (DRAWER NAVIGASI SAMPING SESUAI ROLE)
     ========================================================================== */
  window.openApkSidebar = function() {
    const drawer = document.getElementById('apkSidebarDrawer');
    const overlay = document.getElementById('apkSidebarOverlay');
    if (!drawer || !overlay) return;

    window.renderApkSidebarMenu();
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeApkSidebar = function() {
    const drawer = document.getElementById('apkSidebarDrawer');
    const overlay = document.getElementById('apkSidebarOverlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.toggleApkSidebar = function() {
    const drawer = document.getElementById('apkSidebarDrawer');
    if (drawer && drawer.classList.contains('active')) {
      window.closeApkSidebar();
    } else {
      window.openApkSidebar();
    }
  };

  /**
   * Render item menu di dalam Sidebar Drawer sesuai role user
   */
  window.renderApkSidebarMenu = function() {
    const listEl = document.getElementById('apkSidebarMenuList');
    if (!listEl) return;

    const userName = sessionStorage.getItem('ckg_user_name') || 'Petugas CKG';
    const userRole = (sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas')).toUpperCase();
    const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Update header profil di sidebar & top bar
    const avatarEl = document.getElementById('apkSidebarAvatar');
    const nameEl = document.getElementById('apkSidebarUserName');
    const badgeEl = document.getElementById('apkSidebarRoleBadge');
    const topAvatar = document.getElementById('apkHeaderAvatarText');
    const topRolePill = document.getElementById('apkHeaderRolePill');

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = userName;
    if (badgeEl) badgeEl.textContent = userRole;
    if (topAvatar) topAvatar.textContent = initials;
    if (topRolePill) topRolePill.textContent = userRole;

    // Master list semua menu
    const masterMenus = [
      { id: 'dashboard', label: 'Dashboard Analytics', icon: 'bi-speedometer2', color: '#2563eb' },
      { id: 'ckg-gratis', label: 'Cek Kesehatan Gratis', icon: 'bi-heart-pulse-fill', color: '#10b981' },
      { id: 'sekolah', label: 'Skrining Sekolah', icon: 'bi-mortarboard-fill', color: '#4f46e5' },
      { id: 'data-records', label: 'Data Records CKG', icon: 'bi-folder-symlink-fill', color: '#0284c7' },
      { id: 'alat-bnhp', label: 'Alat & BNHP CKG', icon: 'bi-box-seam-fill', color: '#059669' },
      { id: 'laporan', label: 'Laporan & Rekapitulasi', icon: 'bi-file-earmark-bar-graph', color: '#d97706' },
      { id: 'enco', label: 'ENCO / ASIK Bot', icon: 'bi-robot', color: '#06b6d4', badge: 'ASIK' },
      { id: 'recycle-data', label: 'Recycle (Tempat Sampah)', icon: 'bi-trash3-fill', color: '#ef4444' },
      { id: 'admin-panel', label: 'Admin Panel & Sistem', icon: 'bi-person-workspace', color: '#7c3aed' }
    ];

    // Cek menu mana yang sedang aktif
    const activeViewBtn = document.querySelector('.apk-nav-btn.active, .nav-tab-btn.active');
    const activeViewId = activeViewBtn ? activeViewBtn.getAttribute('data-view') : 'dashboard';

    // Filter menu berdasarkan izin role
    const allowedMenus = masterMenus.filter(m => window.isMenuAllowedForCurrentRole(m.id));

    let menuHtml = allowedMenus.map(m => {
      const isActive = (m.id === activeViewId);
      const badgeHtml = m.badge
        ? `<span class="badge" style="background: linear-gradient(135deg, #06b6d4, #2563eb); font-size: 9px; padding: 2px 6px; border-radius: 8px; color: #fff; margin-left: auto;">${m.badge}</span>`
        : '';
      return `
        <button type="button" class="apk-sidebar-item ${isActive ? 'active' : ''}" onclick="window.closeApkSidebar(); switchView('${m.id}');">
          <i class="bi ${m.icon}" style="color: ${m.color};"></i>
          <span>${m.label}</span>
          ${badgeHtml}
        </button>
      `;
    }).join('');

    // Khusus Admin di APK: Sediakan Menu Management untuk Mengaktifkan/Menonaktifkan Menu
    const isAdmin = (userRole.toLowerCase() === 'admin');
    if (isAdmin) {
      menuHtml += `
        <div style="margin: 14px 4px 6px 4px; padding-top: 10px; border-top: 1.5px dashed #cbd5e1;">
          <div style="font-size: 11px; font-weight: 800; color: #7c3aed; margin-bottom: 6px; letter-spacing: 0.3px;">PENGATURAN MENU ADMIN</div>
          <button type="button" class="apk-sidebar-item" onclick="window.closeApkSidebar(); if(typeof openMenuConfigModal === 'function') openMenuConfigModal();" style="background: rgba(124, 58, 237, 0.08); border: 1.5px solid rgba(124, 58, 237, 0.25); border-radius: 12px; margin-bottom: 4px;">
            <i class="bi bi-sliders2-vertical" style="color: #7c3aed; font-size: 18px;"></i>
            <span style="font-weight: 800; color: #6d28d9;">Kelola Menu (Aktif/Nonaktif)</span>
            <span class="badge" style="background: #7c3aed; color: #fff; font-size: 8.5px; padding: 2px 6px; border-radius: 6px; margin-left: auto;">ADMIN</span>
          </button>
        </div>
      `;
    }

    listEl.innerHTML = menuHtml;
  };

  /* ==========================================================================
     3. BOTTOM NAV ROLE VISIBILITY (SESUAI ROLE USER)
     ========================================================================== */
  window.applyApkBottomNavRoleVisibility = function() {
    const bottomNav = document.getElementById('apkBottomNav');
    if (!bottomNav) return;

    const role = (sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas')).toLowerCase();
    const portalType = (sessionStorage.getItem('ckg_portal_type') || 'puskesmas').toLowerCase();

    // Filter tombol nav bawah
    bottomNav.querySelectorAll('.apk-nav-btn').forEach(btn => {
      const viewId = btn.getAttribute('data-view');
      if (!viewId) return;

      // Jika tombol ENCO dan role bukan admin, ganti jadi Records jika records diizinkan
      if (viewId === 'enco' && role !== 'admin') {
        if (window.isMenuAllowedForCurrentRole('data-records')) {
          btn.setAttribute('data-view', 'data-records');
          btn.setAttribute('onclick', "handleApkNavClick('data-records')");
          const span = btn.querySelector('span');
          const icon = btn.querySelector('i');
          if (span) span.textContent = 'Records';
          if (icon) icon.className = 'bi bi-folder-symlink-fill';
          btn.style.display = 'flex';
          return;
        }
      }

      const allowed = window.isMenuAllowedForCurrentRole(viewId);
      btn.style.display = allowed ? 'flex' : 'none';
    });

    // Tombol Scan OCR tengah
    const ocrCenter = bottomNav.querySelector('.apk-nav-center-wrapper');
    if (ocrCenter) {
      const isAllowedOcr = (portalType === 'puskesmas' || role === 'admin');
      ocrCenter.style.display = isAllowedOcr ? 'flex' : 'none';
    }

    // Perbarui juga data di header APK
    const userName = sessionStorage.getItem('ckg_user_name') || 'Petugas CKG';
    const userRole = (sessionStorage.getItem('ckg_user_role') || (typeof currentRole !== 'undefined' ? currentRole : 'Petugas')).toUpperCase();
    const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const topAvatar = document.getElementById('apkHeaderAvatarText');
    const topRolePill = document.getElementById('apkHeaderRolePill');
    if (topAvatar) topAvatar.textContent = initials;
    if (topRolePill) topRolePill.textContent = userRole;
  };

  /* ==========================================================================
     4. FITUR "INGAT SAYA" (REMEMBER PASSWORD) KHUSUS APK ANDROID
     ========================================================================== */

  // A. Hook ke Gerbang Puskesmas (openPuskesmasGate)
  const origOpenPuskesmasGate = window.openPuskesmasGate;
  window.openPuskesmasGate = function() {
    const rememberedGatePass = localStorage.getItem('ckg_apk_remember_gate_pass');

    // Jika password gerbang sudah tersimpan, langsung buka gerbang!
    if (rememberedGatePass && rememberedGatePass.trim() !== '') {
      const portalOverlay = document.getElementById('portalSelectionContainer');
      const puskesmasOverlay = document.getElementById('loginViewContainer');
      if (portalOverlay) { portalOverlay.classList.add('hidden'); portalOverlay.style.display = 'none'; }
      if (puskesmasOverlay) {
        puskesmasOverlay.classList.remove('hidden');
        puskesmasOverlay.style.display = 'flex';
      }
      if (typeof populatePegawaiDropdown === 'function') populatePegawaiDropdown();
      return;
    }

    // Tampilkan popup dengan opsi "Ingat Saya"
    const isDark = document.body.classList.contains('dark-mode');
    Swal.fire({
      title: '<span style="font-weight: 800; font-size: 20px;">Autentikasi Gerbang Puskesmas</span>',
      html: `
        <div style="text-align: center; margin-bottom: 14px;">
          <div style="width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #059669, #10b981); display: inline-flex; align-items: center; justify-content: center; font-size: 28px; color: #fff; margin-bottom: 10px; box-shadow: 0 6px 18px rgba(5,150,105,0.25);">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div style="font-size: 13px; color: ${isDark ? '#94a3b8' : '#64748b'}; line-height: 1.5; margin-bottom: 14px;">
            Masukkan kata sandi akses internal Puskesmas Banjaran Kota:
          </div>
          <div style="position: relative; margin-bottom: 12px;">
            <input type="password" id="swalGatePasswordInput" class="form-control" placeholder="Masukkan kata sandi..." style="height: 46px; font-size: 14px; padding-right: 42px; border-radius: 10px;">
            <button type="button" onclick="const i = document.getElementById('swalGatePasswordInput'); i.type = i.type === 'password' ? 'text' : 'password';" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; font-size: 16px;">
              <i class="bi bi-eye"></i>
            </button>
          </div>
          <label style="display: flex; align-items: center; gap: 8px; justify-content: center; font-size: 13px; font-weight: 600; color: ${isDark ? '#cbd5e1' : '#334155'}; cursor: pointer; user-select: none;">
            <input type="checkbox" id="chkRememberGatePass" checked style="width: 17px; height: 17px; accent-color: #059669; cursor: pointer;">
            <span>Ingat Saya</span>
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-door-open-fill"></i> Masuk Gerbang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#94a3b8',
      preConfirm: () => {
        const passInp = document.getElementById('swalGatePasswordInput');
        const chk = document.getElementById('chkRememberGatePass');
        const passVal = passInp ? passInp.value.trim() : '';

        if (!passVal) {
          Swal.showValidationMessage('Kata sandi tidak boleh kosong!');
          return false;
        }

        // Simpan jika Ingat Saya dicentang
        if (chk && chk.checked) {
          localStorage.setItem('ckg_apk_remember_gate_pass', passVal);
        } else {
          localStorage.removeItem('ckg_apk_remember_gate_pass');
        }

        return passVal;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const portalOverlay = document.getElementById('portalSelectionContainer');
        const puskesmasOverlay = document.getElementById('loginViewContainer');
        if (portalOverlay) { portalOverlay.classList.add('hidden'); portalOverlay.style.display = 'none'; }
        if (puskesmasOverlay) {
          puskesmasOverlay.classList.remove('hidden');
          puskesmasOverlay.style.display = 'flex';
        }
        if (typeof populatePegawaiDropdown === 'function') populatePegawaiDropdown();
      }
    });
  };

  // B. Hook ke Login Pegawai Puskesmas (handleLogin password popup)
  // Periksa password tersimpan saat pegawai dipilih
  window.checkAndAutoFillPegawaiPassword = function(pegawaiName) {
    if (!pegawaiName) return '';
    return localStorage.getItem('ckg_apk_remember_pass_' + pegawaiName.toLowerCase()) || '';
  };

  window.savePegawaiPasswordRemember = function(pegawaiName, password, isRemember) {
    if (!pegawaiName) return;
    const key = 'ckg_apk_remember_pass_' + pegawaiName.toLowerCase();
    if (isRemember && password) {
      localStorage.setItem(key, password);
    } else {
      localStorage.removeItem(key);
    }
  };

  // Override handleLogin untuk menambahkan popup "Ingat Saya"
  const origHandleLogin = window.handleLogin;
  window.handleLogin = function(e) {
    if (e) e.preventDefault();

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
    const user = (typeof usersDb !== 'undefined' && Array.isArray(usersDb))
      ? usersDb.find(u => u.nama_user.toLowerCase() === selectedPegawai.toLowerCase())
      : null;

    if (!user) {
      if (typeof origHandleLogin === 'function') origHandleLogin(e);
      return;
    }

    const dbPassword = (user.password || '').trim();

    // Jika user tidak memiliki password, langsung masuk
    if (dbPassword === '') {
      if (typeof performLoginSuccess === 'function') performLoginSuccess(user);
      return;
    }

    // Cek apakah ada password yang tersimpan
    const savedPass = window.checkAndAutoFillPegawaiPassword(selectedPegawai);

    // Jika password tersimpan cocok dengan database, langsung login otomatis!
    if (savedPass && savedPass === dbPassword) {
      if (typeof performLoginSuccess === 'function') {
        performLoginSuccess(user);
        return;
      }
    }

    // Tampilkan popup password dengan checkbox "Ingat Saya"
    const isDark = document.body.classList.contains('dark-mode');
    Swal.fire({
      title: 'Masukkan Kata Sandi',
      html: `
        <div style="text-align:center; margin-bottom: 8px;">
          <div style="width:48px; height:48px; border-radius:50%; background: linear-gradient(135deg, #2563eb, #0284c7); display:inline-flex; align-items:center; justify-content:center; margin-bottom:8px;">
            <i class="bi bi-shield-lock-fill" style="color:#fff; font-size:22px;"></i>
          </div>
          <div style="font-size:13.5px; color:${isDark ? '#cbd5e1' : '#64748b'}; font-weight:600; margin-bottom: 12px;">
            Verifikasi akses <strong style="color:${isDark ? '#f1f5f9' : '#0f172a'};">${user.nama_user}</strong> (${user.role})
          </div>
          <div style="position: relative; margin-bottom: 12px;">
            <input type="password" id="swalUserPasswordInput" class="form-control"
              value="${escapeHtml(savedPass)}"
              placeholder="Masukkan kata sandi..."
              style="height: 46px; font-size: 14px; padding-right: 42px; border-radius: 10px;">
            <button type="button" onclick="const i = document.getElementById('swalUserPasswordInput'); i.type = i.type === 'password' ? 'text' : 'password';" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; font-size: 16px;">
              <i class="bi bi-eye"></i>
            </button>
          </div>
          <label style="display: flex; align-items: center; gap: 8px; justify-content: center; font-size: 13px; font-weight: 600; color: ${isDark ? '#cbd5e1' : '#334155'}; cursor: pointer; user-select: none;">
            <input type="checkbox" id="chkRememberUserPass" ${savedPass ? 'checked' : 'checked'} style="width: 17px; height: 17px; accent-color: #2563eb; cursor: pointer;">
            <span>Ingat Saya</span>
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-box-arrow-in-right"></i> Masuk',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const passInp = document.getElementById('swalUserPasswordInput');
        const chk = document.getElementById('chkRememberUserPass');
        const inputPass = passInp ? passInp.value.trim() : '';

        if (!inputPass) {
          Swal.showValidationMessage('Kata sandi tidak boleh kosong!');
          return false;
        }

        if (inputPass !== dbPassword) {
          Swal.showValidationMessage('Kata sandi salah! Periksa kembali.');
          return false;
        }

        // Simpan / hapus remember me
        window.savePegawaiPasswordRemember(selectedPegawai, inputPass, chk ? chk.checked : false);
        return true;
      }
    }).then((res) => {
      if (res.isConfirmed) {
        if (typeof performLoginSuccess === 'function') performLoginSuccess(user);
      }
    });
  };

  /* ==========================================================================
     5. ENHANCED HIGH-ACCURACY OCR IDENTITAS (KTP / KK / KIA)
     ========================================================================== */

  /**
   * Preprocessing Gambar Khusus KTP: Grayscale + Contrast Boost via Canvas
   */
  function preprocessKtpImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          // Ambil dataUrl warna asli (resized & compressed) untuk Cloudflare AI Vision
          const colorDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          // Tingkatkan kontras dan ubah ke grayscale pada canvas untuk Tesseract OCR lokal
          try {
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const contrast = 35; // Boost
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            for (let i = 0; i < d.length; i += 4) {
              const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const cGray = factor * (gray - 128) + 128;
              d[i] = cGray;
              d[i + 1] = cGray;
              d[i + 2] = cGray;
            }
            ctx.putImageData(imgData, 0, 0);
          } catch (_) { }

          resolve({
            dataUrl: colorDataUrl,
            canvas: canvas
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Parser Regex Cerdas Khusus Format e-KTP / KK / KIA Indonesia
   */
  function parseIndonesianKtpText(rawText) {
    if (!rawText) return {};
    const text = rawText.replace(/\r/g, '\n');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const result = {
      nik: '',
      nama: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: '',
      alamat: '',
      rt_rw: '',
      kelurahan: '',
      kecamatan: '',
      agama: '',
      raw_text: rawText
    };

    // 1. Ekstrak NIK (16 digit angka berurutan)
    // Cegah kesalahan OCR angka (seperti 'D' -> 0, 'O' -> 0, 'l'/'I' -> 1)
    const cleanedDigitsOnly = text.replace(/[oO]/g, '0').replace(/[ilI|]/g, '1');
    const nikMatch = cleanedDigitsOnly.match(/\b([1-9]\d{15})\b/) || text.match(/\b(\d{16})\b/);
    if (nikMatch) {
      result.nik = nikMatch[1];
    }

    // 2. Ekstrak Nama
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/nama/i.test(line)) {
        let val = line.replace(/.*nama\s*[:;]?\s*/i, '').trim();
        // Jika nama di baris berikutnya
        if (!val && i + 1 < lines.length) val = lines[i + 1].trim();
        if (val && !/[:;]/.test(val) && val.length > 2) {
          result.nama = val.replace(/[^A-Za-z\s.,'-]/g, '').trim().toUpperCase();
          break;
        }
      }
    }

    // 3. Ekstrak Tanggal Lahir & Jenis Kelamin
    for (const line of lines) {
      if (/lahir/i.test(line)) {
        const dobMatch = line.match(/(\d{2})[-\/.](\d{2})[-\/.](\d{4})/);
        if (dobMatch) {
          result.tanggal_lahir = `${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`;
        }
      }
      if (/laki|pria/i.test(line)) {
        result.jenis_kelamin = 'Laki-laki';
      } else if (/perempuan|wanita/i.test(line)) {
        result.jenis_kelamin = 'Perempuan';
      }
    }

    // 4. Ekstrak Alamat
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/alamat/i.test(line)) {
        let val = line.replace(/.*alamat\s*[:;]?\s*/i, '').trim();
        if (!val && i + 1 < lines.length) val = lines[i + 1].trim();
        if (val) result.alamat = val;
      }
      if (/kel|desa/i.test(line)) {
        result.kelurahan = line.replace(/.*(?:kel|desa)\s*[:;]?\s*/i, '').trim();
      }
      if (/kec/i.test(line)) {
        result.kecamatan = line.replace(/.*kec(?:amatan)?\s*[:;]?\s*/i, '').trim();
      }
    }

    return result;
  }

  /**
   * Eksekusi OCR Utama dengan Tesseract Lokal + Backend Cloudflare D1 Lookup
   */
  window.processOcrIdentity = async function(file, target) {
    if (!window.Swal) return;

    Swal.fire({
      title: 'Memindai Kartu Identitas...',
      html: `
        <div style="text-align: center; padding: 14px 6px;">
          <div class="spinner-border text-primary" role="status" style="width: 2.8rem; height: 2.8rem; margin-bottom: 12px; color: #7c3aed !important;"></div>
          <div style="font-weight: 700; font-size: 15px; color: #1e293b;">AI Vision & OCR Engine Membaca Dokumen...</div>
          <div style="font-size: 12.5px; color: #64748b; margin-top: 6px; line-height: 1.5;">
            Mengekstrak NIK, Nama, Tanggal Lahir, Jenis Kelamin, serta otomatis memeriksa kecocokan di Bank Data Puskesmas...
          </div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // 1. Preprocess Gambar
      const { dataUrl, canvas } = await preprocessKtpImage(file);

      let extractedLocal = {};
      let localRawText = '';

      // 2. Jalankan Tesseract OCR di Client jika tersedia
      if (typeof Tesseract !== 'undefined') {
        try {
          Swal.update({
            title: 'Menganalisis Teks e-KTP...',
            html: `<div style="font-size: 13px; color: #475569;">Mengekstrak nomor NIK 16 digit secara lokal di perangkat...</div>`
          });
          const tRes = await Tesseract.recognize(canvas, 'ind+eng');
          localRawText = tRes?.data?.text || '';
          if (localRawText) {
            extractedLocal = parseIndonesianKtpText(localRawText);
          }
        } catch (tessErr) {
          console.warn('Tesseract client OCR notice:', tessErr);
        }
      }

      // 3. Kirim ke Endpoint Cloudflare /api/ai/ocr-ktp dengan data gambar DAN teks hasil OCR lokal
      let responseData = null;
      try {
        const res = await fetch('/api/ai/ocr-ktp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            text: localRawText,
            target: target
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.success) {
            responseData = json;
          }
        }
      } catch (netErr) {
        console.warn('Network OCR API notice:', netErr);
      }

      // 4. Jika Backend belum menemukan NIK tapi Client Tesseract menemukan NIK:
      // Bentuk responseData dari hasil lokal & coba lookup NIK ke database lokal
      if ((!responseData || !responseData.extracted_data?.nik) && extractedLocal.nik && extractedLocal.nik.length === 16) {
        responseData = {
          success: true,
          found_in_bank_data: false,
          bank_data_source: 'OCR On-Device Engine',
          extracted_data: {
            ...extractedLocal,
            ocr_engine: 'On-Device Tesseract + Smart Regex'
          },
          nik_valid: true
        };
      }

      // 5. Validasi Hasil: Jika NIK sama sekali tidak terbaca
      const finalNik = responseData?.extracted_data?.nik || '';
      if (!finalNik || finalNik.length !== 16) {
        throw new Error('Nomor NIK 16 digit tidak terdeteksi dari foto. Pastikan e-KTP / KK diposisikan horizontal, fokus tajam, dan tidak ada pantulan silau.');
      }

      // 6. Tampilkan Dialog Hasil Verifikasi
      showOcrResultDialog(responseData, target, dataUrl);

    } catch (err) {
      console.error('OCR Processing error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Pemindaian Gagal',
        html: `
          <div style="font-size: 13.5px; color: #475569; text-align: left;">
            ${escapeHtml(err.message || 'Terjadi kesalahan saat memproses OCR.')}<br><br>
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; font-size: 12px; color: #64748b; line-height: 1.6;">
              <strong>Tips agar scan berhasil:</strong>
              <ul style="margin: 4px 0 0 0; padding-left: 18px;">
                <li>Posisikan kartu e-KTP tegak lurus dan horizontal</li>
                <li>Pastikan 16 angka NIK tampak tajam & jelas</li>
                <li>Hindari pantulan lampu/flash pada kartu plastik</li>
              </ul>
            </div>
          </div>
        `,
        confirmButtonText: '<i class="bi bi-camera-fill"></i> Foto Ulang',
        confirmButtonColor: '#7c3aed',
        showCancelButton: true,
        cancelButtonText: 'Input Manual Saja',
        cancelButtonColor: '#94a3b8'
      }).then(res => {
        if (res.isConfirmed) {
          triggerOcrIdentityScan(target);
        }
      });
    }
  };

  /* ==========================================================================
     6. INISIALISASI & HOOKS
     ========================================================================== */
  const origApplyMenuConfig = window.applyMenuConfiguration;
  window.applyMenuConfiguration = function() {
    if (typeof origApplyMenuConfig === 'function') {
      try { origApplyMenuConfig(); } catch (e) { }
    }
    try {
      window.applyApkBottomNavRoleVisibility();
      window.renderApkSidebarMenu();
    } catch (_) { }
  };

  const origSwitchView = window.switchView;
  window.switchView = function(viewId) {
    if (typeof origSwitchView === 'function') {
      origSwitchView(viewId);
    }
    try {
      window.applyApkBottomNavRoleVisibility();
      window.renderApkSidebarMenu();
    } catch (_) { }
  };

  /* ==========================================================================
     7. PAGINATION MOBILE & APK: DEFAULT 5 DATA SISWA & PASIEN (ANTI-LAG)
     ========================================================================== */
  window.sekolahMobileLimit = 5;
  window.ckgMobileLimit = 5;

  function isMobileOrApkView() {
    return (window.innerWidth <= 768) ||
           document.documentElement.classList.contains('is-native-apk') ||
           (document.body && document.body.classList.contains('is-native-apk')) ||
           Boolean(window.IS_NATIVE_APK);
  }

  // Hook renderSekolahView
  const origRenderSekolahView = window.renderSekolahView;
  window.renderSekolahView = function() {
    if (typeof origRenderSekolahView === 'function') {
      origRenderSekolahView();
    }

    if (!isMobileOrApkView()) return;

    const tbody = document.getElementById('tableBodySekolah');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr:not(.tr-load-more-mobile)'));
    if (rows.length === 0) return;
    if (rows.length === 1 && rows[0].querySelector('td[colspan]')) return;

    const totalCount = rows.length;
    const currentLimit = window.sekolahMobileLimit || 5;

    rows.forEach((row, idx) => {
      if (idx < currentLimit) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    const existingCard = document.getElementById('sekolahMobileLoadMoreWrapper');
    if (existingCard) existingCard.remove();

    if (totalCount > currentLimit) {
      const loadMoreContainer = document.createElement('div');
      loadMoreContainer.id = 'sekolahMobileLoadMoreWrapper';
      loadMoreContainer.className = 'mobile-load-more-card';
      loadMoreContainer.innerHTML = `
        <div style="font-size: 12.5px; font-weight: 700; color: #64748b; margin-bottom: 8px;">
          Menampilkan <strong>${Math.min(currentLimit, totalCount)}</strong> dari <strong>${totalCount.toLocaleString('id-ID')}</strong> siswa
        </div>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary btn-sm" onclick="window.loadMoreSekolahRecords(5)" style="padding: 7px 16px; border-radius: 10px; font-weight: 700; background: linear-gradient(135deg, #4f46e5, #4338ca); color: #fff; border: none; box-shadow: 0 4px 10px rgba(79,70,229,0.25); cursor: pointer;">
            <i class="bi bi-chevron-down"></i> Tampilkan 5 Lagi
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.loadMoreSekolahRecords(20)" style="padding: 7px 14px; border-radius: 10px; font-weight: 700; cursor: pointer;">
            +20 Siswa
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.loadMoreSekolahRecords('all')" style="padding: 7px 14px; border-radius: 10px; font-weight: 700; cursor: pointer;">
            Semua (${totalCount.toLocaleString('id-ID')})
          </button>
        </div>
      `;
      const tableWrapper = tbody.closest('.simpus-table-wrapper') || tbody.parentElement;
      if (tableWrapper && tableWrapper.parentElement) {
        tableWrapper.parentElement.appendChild(loadMoreContainer);
      }
    }
  };

  window.loadMoreSekolahRecords = function(amount) {
    if (amount === 'all') {
      window.sekolahMobileLimit = 999999;
    } else {
      window.sekolahMobileLimit = (window.sekolahMobileLimit || 5) + Number(amount);
    }
    if (typeof origRenderSekolahView === 'function') origRenderSekolahView();
    window.renderSekolahView();
  };

  // Hook renderCkgGratisTable
  const origRenderCkgGratisTable = window.renderCkgGratisTable;
  window.renderCkgGratisTable = function() {
    if (typeof origRenderCkgGratisTable === 'function') {
      origRenderCkgGratisTable();
    }

    if (!isMobileOrApkView()) return;

    const tbody = document.getElementById('tableBodyCkgGratis');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr:not(.tr-load-more-mobile)'));
    if (rows.length === 0) return;
    if (rows.length === 1 && rows[0].querySelector('td[colspan]')) return;

    const totalCount = rows.length;
    const currentLimit = window.ckgMobileLimit || 5;

    rows.forEach((row, idx) => {
      if (idx < currentLimit) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    const existingCard = document.getElementById('ckgMobileLoadMoreWrapper');
    if (existingCard) existingCard.remove();

    if (totalCount > currentLimit) {
      const loadMoreContainer = document.createElement('div');
      loadMoreContainer.id = 'ckgMobileLoadMoreWrapper';
      loadMoreContainer.className = 'mobile-load-more-card';
      loadMoreContainer.innerHTML = `
        <div style="font-size: 12.5px; font-weight: 700; color: #64748b; margin-bottom: 8px;">
          Menampilkan <strong>${Math.min(currentLimit, totalCount)}</strong> dari <strong>${totalCount.toLocaleString('id-ID')}</strong> pasien
        </div>
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary btn-sm" onclick="window.loadMoreCkgRecords(5)" style="padding: 7px 16px; border-radius: 10px; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; box-shadow: 0 4px 10px rgba(16,185,129,0.25); cursor: pointer;">
            <i class="bi bi-chevron-down"></i> Tampilkan 5 Lagi
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.loadMoreCkgRecords(20)" style="padding: 7px 14px; border-radius: 10px; font-weight: 700; cursor: pointer;">
            +20 Pasien
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.loadMoreCkgRecords('all')" style="padding: 7px 14px; border-radius: 10px; font-weight: 700; cursor: pointer;">
            Semua (${totalCount.toLocaleString('id-ID')})
          </button>
        </div>
      `;
      const tableWrapper = tbody.closest('.simpus-table-wrapper') || tbody.parentElement;
      if (tableWrapper && tableWrapper.parentElement) {
        tableWrapper.parentElement.appendChild(loadMoreContainer);
      }
    }
  };

  window.loadMoreCkgRecords = function(amount) {
    if (amount === 'all') {
      window.ckgMobileLimit = 999999;
    } else {
      window.ckgMobileLimit = (window.ckgMobileLimit || 5) + Number(amount);
    }
    if (typeof origRenderCkgGratisTable === 'function') origRenderCkgGratisTable();
    window.renderCkgGratisTable();
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Reset limit ke 5 saat filter sekolah diubah
    ['filterSelectSekolah', 'filterSelectKelas', 'filterSelectTahun', 'searchSekolahRecords', 'filterSekolahNik'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => { window.sekolahMobileLimit = 5; });
        if (id === 'searchSekolahRecords') {
          el.addEventListener('input', () => { window.sekolahMobileLimit = 5; });
        }
      }
    });

    setTimeout(() => {
      window.applyApkBottomNavRoleVisibility();
      window.renderApkSidebarMenu();
    }, 400);

    // Inisialisasi Layar Check Update Khusus APK
    if (isCapacitorEnv) {
      window.initApkCheckUpdate();
    }
  });

  /* ==========================================================================
     8. LAYAR PEMERIKSAAN PEMBARUAN (CHECK UPDATE) KHUSUS APK ANDROID
     ========================================================================== */
  const CURRENT_APK_VERSION = '1.0.0';

  window.skipApkUpdateCheck = function() {
    const screen = document.getElementById('apkCheckUpdateScreen');
    const portal = document.getElementById('portalSelectionContainer');
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(() => {
        screen.style.display = 'none';
        screen.classList.remove('fade-out');
      }, 400);
    }
    if (portal) {
      portal.style.display = '';
      portal.classList.remove('hidden');
    }
    sessionStorage.setItem('apk_update_checked', 'true');
  };

  window.initApkCheckUpdate = function() {
    // Jika sudah pernah cek dalam sesi aktif ini, langsung tampilkan portal
    if (sessionStorage.getItem('apk_update_checked') === 'true') {
      return;
    }

    const screen = document.getElementById('apkCheckUpdateScreen');
    const portal = document.getElementById('portalSelectionContainer');
    if (!screen) return;

    // Sembunyikan portal sementara dan tampilkan layar check update
    if (portal) portal.style.display = 'none';
    screen.style.display = 'flex';

    const boxChecking = document.getElementById('apkUpdateChecking');
    const boxLatest = document.getElementById('apkUpdateLatest');
    const boxAvailable = document.getElementById('apkUpdateAvailable');

    if (boxChecking) boxChecking.style.display = 'flex';
    if (boxLatest) boxLatest.style.display = 'none';
    if (boxAvailable) boxAvailable.style.display = 'none';

    // Fetch versi ke server dengan timeout 2500ms
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetch('/api/apk/version', { signal: controller.signal, cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data && data.success && data.updateAvailable && data.latestVersion && data.latestVersion !== CURRENT_APK_VERSION) {
          // Ada versi baru
          if (boxChecking) boxChecking.style.display = 'none';
          if (boxAvailable) {
            boxAvailable.style.display = 'flex';
            const oldEl = document.getElementById('apkUpdateOldVer');
            const newEl = document.getElementById('apkUpdateNewVer');
            const noteEl = document.getElementById('apkUpdateReleaseNotes');
            const btnDl = document.getElementById('btnDownloadApkUpdate');
            if (oldEl) oldEl.textContent = 'v' + CURRENT_APK_VERSION;
            if (newEl) newEl.textContent = 'v' + data.latestVersion;
            if (noteEl && data.releaseNotes) noteEl.textContent = data.releaseNotes;
            if (btnDl && data.downloadUrl) btnDl.href = data.downloadUrl;
          }
        } else {
          // Sudah versi terbaru
          showLatestAndProceed();
        }
      })
      .catch(err => {
        console.log('[ApkCheckUpdate] Offline atau tidak dapat menghubungi server pembaruan:', err);
        // Fallback anggap versi saat ini sudah aman dan lanjut
        showLatestAndProceed();
      });

    function showLatestAndProceed() {
      if (boxChecking) boxChecking.style.display = 'none';
      if (boxLatest) boxLatest.style.display = 'flex';
      // Berikan jeda sejenak agar user melihat tanda centang hijau
      setTimeout(() => {
        window.skipApkUpdateCheck();
      }, 1200);
    }
  };

})();

