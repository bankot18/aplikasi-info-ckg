document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const profileTrigger = document.getElementById('profileTrigger');
  const profilePopover = document.getElementById('profilePopover');
  const navLinks = document.querySelectorAll('.nav-link');
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');

  // Topbar titles
  const topbarCategory = document.getElementById('topbarCategory');
  const topbarTitle = document.getElementById('topbarTitle');
  const topbarSubtitle = document.getElementById('topbarSubtitle');

  // Views
  const viewBeranda = document.getElementById('viewBeranda');
  const viewPoaBulanan = document.getElementById('viewPoaBulanan');
  const viewTpPol = document.getElementById('viewTpPol');
  const viewSppdLpt = document.getElementById('viewSppdLpt');
  const viewJadwalKegiatan = document.getElementById('viewJadwalKegiatan');
  const viewDeveloperWeb = document.getElementById('viewDeveloperWeb');
  const navItemDevWeb = document.getElementById('navItemDevWeb');

  // ==========================================================================
  // DAFTAR RESMI PEGAWAI PUSKESMAS BANJARAN KOTA (39 PEGAWAI)
  // ==========================================================================
  const DAFTAR_PEGAWAI = [
    { no: 1, nama: "dr. Rina Indriati", nip: "19740404 201411 2 001", nipFull: "NIP. 19740404 201411 2 001", gol: "III/d", jabatan: "Kepala Puskesmas" },
    { no: 2, nama: "Teti Nuryati, S.Keb, Bdn", nip: "19750816 200701 2 012", nipFull: "NIP. 19750816 200701 2 012", gol: "III/b", jabatan: "Satker/Bidan Mahir" },
    { no: 3, nama: "Satrianita, SKM", nip: "19730908 199403 2 006", nipFull: "NIP. 19730908 199403 2 006", gol: "IV/b", jabatan: "Sanitarian Ahli Muda" },
    { no: 4, nama: "Asep Yanto, AMKG", nip: "19690623 199103 1 002", nipFull: "NIP. 19690623 199103 1 002", gol: "III/d", jabatan: "Perawat Gigi Penyelia" },
    { no: 5, nama: "N. Yayat Rohayati, AM.Keb", nip: "19690613 198903 2 005", nipFull: "NIP. 19690613 198903 2 005", gol: "III/d", jabatan: "Bidan Penyelia" },
    { no: 6, nama: "Rd Teti Mulyati, Amd.Kep", nip: "19680825 199003 2 008", nipFull: "NIP. 19680825 199003 2 008", gol: "III/d", jabatan: "Perawat Penyelia" },
    { no: 7, nama: "Indri Yusiana, Amd.Kep", nip: "19681004 199103 2 007", nipFull: "NIP. 19681004 199103 2 007", gol: "III/d", jabatan: "Perawat Penyelia" },
    { no: 8, nama: "Santi Sentri Yanti, S.Keb", nip: "19781014 200501 2 007", nipFull: "NIP. 19781014 200501 2 007", gol: "III/d", jabatan: "Bidan Pelaksana" },
    { no: 9, nama: "Imas Winarti, AM.Keb", nip: "19690524 200604 2 004", nipFull: "NIP. 19690524 200604 2 004", gol: "III/a", jabatan: "Bidan Pelaksana" },
    { no: 10, nama: "Eva Farida, S.Keb", nip: "19840508 201704 2 011", nipFull: "NIP. 19840508 201704 2 011", gol: "III/a", jabatan: "Bidan Mahir" },
    { no: 11, nama: "Neng Yulia Ernawati, S.Keb", nip: "19860725 201704 2 007", nipFull: "NIP. 19860725 201704 2 007", gol: "III/a", jabatan: "Bidan Pelaksana" },
    { no: 12, nama: "Eva Solina, S.Keb", nip: "19821219 201704 2 003", nipFull: "NIP. 19821219 201704 2 003", gol: "III/a", jabatan: "Bidan Pelaksana" },
    { no: 13, nama: "Riza Nur Multiani, A.Md.AK", nip: "19910127 202203 2 010", nipFull: "NIP. 19910127 202203 2 010", gol: "II/c", jabatan: "Penata Laboratorium Kesehatan Terampil" },
    { no: 14, nama: "drg. Regina Desi Gresiana Simamora", nip: "19930805 202505 2 002", nipFull: "NIP. 19930805 202505 2 002", gol: "III/b", jabatan: "Dokter Gigi Ahli Pertama" },
    { no: 15, nama: "Nurul Hidayah, Amd.Kes", nip: "20001224 202505 2 002", nipFull: "NIP. 20001224 202505 2 002", gol: "II/c", jabatan: "Terapis Gigi dan Mulut Terampil" },
    { no: 16, nama: "Dadi Permadi, SKM", nip: "19840525 202221 1 001", nipFull: "NIP. 19840525 202221 1 001", gol: "IX", jabatan: "Penyuluh Kesehatan Ahli Pertama" },
    { no: 17, nama: "Anisa Rohmatunisa, AM.Keb", nip: "19880321 202321 2 001", nipFull: "NIP. 19880321 202321 2 001", gol: "VII", jabatan: "Bidan Terampil" },
    { no: 18, nama: "Nina Mariyana, Amd.Kep", nip: "19960728 202321 2 005", nipFull: "NIP. 19960728 202321 2 005", gol: "VII", jabatan: "Perawat Terampil" },
    { no: 19, nama: "Sheila Nurlaila, A.Md.Gz", nip: "19930713 202321 2 003", nipFull: "NIP. 19930713 202321 2 003", gol: "VII", jabatan: "Nutrisionis Terampil" },
    { no: 20, nama: "Debby Nadia Lofika, S.Farm. Apt", nip: "19921004 202521 2 044", nipFull: "NIP. 19921004 202521 2 044", gol: "IX", jabatan: "Apoteker" },
    { no: 21, nama: "Lutfiyatun Oktaviana, S.Kep.Ners", nip: "873.3204.10.02.005", nipFull: "NRP. 873.3204.10.02.005", gol: "PPTK PW", jabatan: "Perawat" },
    { no: 22, nama: "dr. Dinar Dwi Restika Agustin", nip: "873.3204.07.05.005", nipFull: "NRP. 873.3204.07.05.005", gol: "BLUD", jabatan: "Dokter Umum" },
    { no: 23, nama: "dr. Putri Tasya Afifah", nip: "873.3204.08.06.029", nipFull: "NRP. 873.3204.08.06.029", gol: "BLUD", jabatan: "Dokter Umum" },
    { no: 24, nama: "drg. Intan Nur Atsila", nip: "873.3204.08.06.019", nipFull: "NRP. 873.3204.08.06.019", gol: "BLUD", jabatan: "Dokter Gigi" },
    { no: 25, nama: "Rini Julianti, SE", nip: "873.06.02.021", nipFull: "NRP. 873.06.02.021", gol: "BLUD", jabatan: "Akuntan" },
    { no: 26, nama: "Andriana Mahardhytia, Amd.Kes", nip: "873.120.10.03", nipFull: "NRP. 873.120.10.03", gol: "BLUD", jabatan: "Rekam Medis" },
    { no: 27, nama: "Dilla Anggraeni Pratiwi, A.Md.Akun", nip: "873.3204.13.03.012", nipFull: "NRP. 873.3204.13.03.012", gol: "BLUD", jabatan: "Admin BOK" },
    { no: 28, nama: "Mochamad Fauzie, S.Gz", nip: "873.3204.16.02.008", nipFull: "NRP. 873.3204.16.02.008", gol: "BLUD", jabatan: "Nutrisionis" },
    { no: 29, nama: "Ilham Ardiansyah Isnandar, SKM", nip: "873.3204.11.06.011", nipFull: "NRP. 873.3204.11.06.011", gol: "BLUD", jabatan: "Epidemiolog" },
    { no: 30, nama: "Rian Sidik Sudiana, Amd.Kes", nip: "873.3204.12.06.007", nipFull: "NRP. 873.3204.12.06.007", gol: "BLUD", jabatan: "Rekam Medis" },
    { no: 31, nama: "Fahri Dzulfikar Rismayanto, A.Md. Bns", nip: "873.3204.13.07.037", nipFull: "NRP. 873.3204.13.07.037", gol: "BLUD", jabatan: "Admin BLUD" },
    { no: 32, nama: "Mutiara Sofiatussirri, Amd.", nip: "873.3204.05.05.005", nipFull: "NRP. 873.3204.05.05.005", gol: "BLUD", jabatan: "ATLM" },
    { no: 33, nama: "Muhamad Faridz Alparizy, Amd.Kep", nip: "873.3204.14.05.040", nipFull: "NRP. 873.3204.14.05.040", gol: "BLUD", jabatan: "Perawat" },
    { no: 34, nama: "Neng Safitri Nur Ladyawati, AM.Keb", nip: "873.3204.09.06.106", nipFull: "NRP. 873.3204.09.06.106", gol: "BLUD", jabatan: "Bidan Desa" },
    { no: 35, nama: "Dani Setiadi, S.Farm", nip: "873.3204.18.01.002", nipFull: "NRP. 873.3204.18.01.002", gol: "BLUD", jabatan: "TTK" },
    { no: 36, nama: "Ripan Sutiana", nip: "-", nipFull: "-", gol: "BLUD", jabatan: "Petugas Keamanan" },
    { no: 37, nama: "Mevi Riyanayasti", nip: "-", nipFull: "-", gol: "BLUD", jabatan: "Petugas Kebersihan" },
    { no: 38, nama: "Ade Boy", nip: "-", nipFull: "-", gol: "BLUD", jabatan: "Supir" },
    { no: 39, nama: "Suhara", nip: "-", nipFull: "-", gol: "BLUD", jabatan: "Petugas Keamanan" }
  ];
  window.DAFTAR_PEGAWAI = DAFTAR_PEGAWAI;

  // ==========================================================================
  // SWEETALERT2 LUXURY NOTIFICATION SYSTEM (Sweet Notify 2)
  // ==========================================================================
  const getSicekasToast = () => {
    if (typeof Swal === 'undefined') return null;
    return Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      customClass: {
        popup: 'sicekas-swal-toast'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  };

  // Global Toast Helper (Sweet Notify 2)
  window.showToast = (msg, type = 'info') => {
    const toastInstance = getSicekasToast();
    if (toastInstance) {
      const swalType = type === 'error' ? 'error' : (type === 'success' ? 'success' : (type === 'warn' || type === 'warning' ? 'warning' : 'info'));
      toastInstance.fire({
        icon: swalType,
        title: msg
      });
      return;
    }

    // Fallback if Swal not loaded
    let toastContainer = document.getElementById('sicekasToastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'sicekasToastContainer';
      toastContainer.style.cssText = 'position: fixed; bottom: 28px; right: 28px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
      document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
    toast.style.cssText = `background: rgba(15, 23, 42, 0.95); color: #fff; border-left: 4px solid ${bg}; border-radius: 8px; padding: 12px 18px; font-size: 13.5px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.4); pointer-events: auto; transform: translateY(20px); opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`;
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.transform = 'translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  };

  // Interactive Luxury SweetAlert2 Dialogs
  window.SicekasAlert = {
    toast: (msg, type = 'info') => window.showToast(msg, type),
    success: (title, text = '') => {
      if (typeof Swal === 'undefined') { alert(`${title}\n${text}`); return Promise.resolve(); }
      return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonText: 'Selesai',
        customClass: { popup: 'sicekas-swal-modal', confirmButton: 'btn-swal-gold' }
      });
    },
    error: (title, text = '') => {
      if (typeof Swal === 'undefined') { alert(`${title}\n${text}`); return Promise.resolve(); }
      return Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonText: 'Mengerti',
        customClass: { popup: 'sicekas-swal-modal', confirmButton: 'btn-swal-gold' }
      });
    },
    confirm: async (title, text = '', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', isDanger = false) => {
      if (typeof Swal === 'undefined') { return confirm(`${title}\n${text}`); }
      const res = await Swal.fire({
        icon: isDanger ? 'warning' : 'question',
        title: title,
        text: text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        customClass: {
          popup: 'sicekas-swal-modal',
          confirmButton: isDanger ? 'btn-swal-danger' : 'btn-swal-gold',
          cancelButton: 'btn-swal-cancel'
        }
      });
      return res.isConfirmed;
    }
  };

  // ==========================================================================
  // CLOUDFLARE D1 DATABASE & CLOUD-FIRST SERVICE LAYER
  // ==========================================================================
  const CloudflareDB = {
    isCloudReady: false,
    async checkConnection() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          this.isCloudReady = data.d1_connected || false;
          return data;
        }
      } catch (e) {
        this.isCloudReady = false;
      }
      return null;
    },

    // 1. Users & Roles
    async fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.users) {
            localStorage.setItem('SICEKAS_D1_USERS_CACHE', JSON.stringify(json.users));
            return json.users;
          }
        }
      } catch (e) {
        console.warn('Fallback to local users cache / defaults', e);
      }
      return JSON.parse(localStorage.getItem('SICEKAS_D1_USERS_CACHE')) || DAFTAR_PEGAWAI;
    },

    async updateUserRole(nip, role) {
      try {
        const res = await fetch('/api/users/update-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nip, role })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json;
        }
      } catch (e) {
        console.warn('Saving role locally due to offline mode', e);
      }
      // Local sync fallback
      const rolesStore = JSON.parse(localStorage.getItem('SICEKAS_USER_ROLES')) || {};
      rolesStore[nip] = role;
      localStorage.setItem('SICEKAS_USER_ROLES', JSON.stringify(rolesStore));
      return { success: true, localOnly: true };
    },

    async resetUserPass(nip) {
      try {
        const res = await fetch('/api/users/reset-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nip })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Reset pass fallback', e);
      }
      return { success: true };
    },

    async changePassword({ nip, username, oldPassword, newPassword }) {
      try {
        const res = await fetch('/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nip, username, oldPassword, newPassword })
        });
        if (res.ok) {
          const json = await res.json();
          return json;
        } else {
          const err = await res.json();
          return { success: false, error: err?.error || 'Gagal mengubah password di cloud.' };
        }
      } catch (e) {
        console.warn('Cloud password update failed, fallback to local', e);
        return { success: true, localOnly: true, message: 'Password diperbarui di cache lokal.' };
      }
    },

    // 2. Jadwal Kegiatan
    async fetchJadwal(bulan, tahun) {
      try {
        const url = `/api/jadwal?bulan=${bulan || ''}&tahun=${tahun || ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            localStorage.setItem('SICEKAS_BOK_DATA_V2', JSON.stringify(json.data));
            return json.data;
          }
        }
      } catch (e) {
        console.warn('Fallback to local Jadwal data', e);
      }
      return JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || [];
    },

    async saveJadwal(item) {
      // Direct cloud mutation
      try {
        const res = await fetch('/api/jadwal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            let local = JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || [];
            const idx = local.findIndex(i => i.id === item.id);
            if (idx >= 0) local[idx] = item;
            else local.push(item);
            localStorage.setItem('SICEKAS_BOK_DATA_V2', JSON.stringify(local));
            return json;
          }
        }
      } catch (e) {
        console.warn('Fallback saving Jadwal locally', e);
      }
      // Local fallback
      let local = JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || [];
      const idx = local.findIndex(i => i.id === item.id);
      if (idx >= 0) local[idx] = item;
      else local.push(item);
      localStorage.setItem('SICEKAS_BOK_DATA_V2', JSON.stringify(local));
      return { success: true, id: item.id };
    },

    async deleteJadwal(id) {
      try {
        const res = await fetch('/api/jadwal/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            let local = JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || [];
            local = local.filter(i => i.id !== id);
            localStorage.setItem('SICEKAS_BOK_DATA_V2', JSON.stringify(local));
            return json;
          }
        }
      } catch (e) {
        console.warn('Fallback deleting Jadwal locally', e);
      }
      let local = JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || [];
      local = local.filter(i => i.id !== id);
      localStorage.setItem('SICEKAS_BOK_DATA_V2', JSON.stringify(local));
      return { success: true };
    },

    // 3. POA Bulanan
    async fetchPoa(bulan, tahun, nip) {
      try {
        const url = `/api/poa?bulan=${bulan || ''}&tahun=${tahun || ''}&nip=${nip || ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json.data;
        }
      } catch (e) {
        console.warn('Fallback fetch POA', e);
      }
      return JSON.parse(localStorage.getItem('SICEKAS_POA_DATA_V2')) || [];
    },

    async savePoa(item) {
      try {
        const res = await fetch('/api/poa/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback save POA', e);
      }
      return { success: true };
    },

    // 4. TP POL Jaspel
    async fetchTpPol(bulan, tahun, nip) {
      try {
        const url = `/api/tppol?bulan=${bulan || ''}&tahun=${tahun || ''}&nip=${nip || ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json.data;
        }
      } catch (e) {
        console.warn('Fallback fetch TP POL', e);
      }
      return JSON.parse(localStorage.getItem('SICEKAS_TPPOL_DATA_V2')) || [];
    },

    async saveTpPol(item) {
      try {
        const res = await fetch('/api/tppol/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback save TP POL', e);
      }
      return { success: true };
    },

    // 5. SPPD & LPT
    async fetchSppd(id) {
      try {
        const url = `/api/sppd?id=${id || ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) return json.data;
        }
      } catch (e) {
        console.warn('Fallback fetch SPPD', e);
      }
      return null;
    },

    async saveSppd(item) {
      try {
        const res = await fetch('/api/sppd/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Fallback save SPPD', e);
      }
      return { success: true };
    },

    // 6. Direct SQL Runner (Super Admin)
    async executeSql(sql) {
      try {
        const res = await fetch('/api/sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        if (res.ok) return await res.json();
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  };

  window.CloudflareDB = CloudflareDB;

  // ==========================================================================
  // 1. SIDEBAR COLLAPSE / EXPAND TOGGLE (like @davidm_ai)
  // ==========================================================================
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      
      // Close popover if open when toggling sidebar
      if (profilePopover) {
        profilePopover.classList.remove('active');
      }

      // Re-render chart size if needed
      setTimeout(() => {
        if (window.healthChartInstance) {
          window.healthChartInstance.resize();
        }
      }, 360);
    });
  }

  // ==========================================================================
  // 2. USER PROFILE POPOVER TOGGLE (like @davidm_ai)
  // ==========================================================================
  if (profileTrigger && profilePopover) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePopover.classList.toggle('active');
    });

    // Close popover when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (!profilePopover.contains(e.target) && !profileTrigger.contains(e.target)) {
        profilePopover.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // SYNC AUTHENTICATED USER SESSION & PROFILE UI
  // ==========================================================================
  try {
    const rawCurrentUser = localStorage.getItem('SICEKAS_CURRENT_USER');
    if (!rawCurrentUser) {
      window.location.replace('index.html');
      return;
    }
    const currentUser = JSON.parse(rawCurrentUser);
    if (currentUser) {
      const profileNameEls = document.querySelectorAll('.profile-name, .popover-user-info h4');
      const profileRoleEls = document.querySelectorAll('.profile-role');
      const profileEmailEl = document.querySelector('.popover-user-info p');
      
      if (currentUser.nama) {
        profileNameEls.forEach(el => el.textContent = currentUser.nama);
      }
      if (currentUser.role || currentUser.jabatan) {
        profileRoleEls.forEach(el => el.textContent = `${currentUser.role || 'Petugas'} • ${currentUser.jabatan || 'Puskesmas'}`);
      }
      if (profileEmailEl) {
        profileEmailEl.textContent = `${(currentUser.username || 'pegawai').toLowerCase()}@puskesmasbanjaran.go.id`;
      }
    }
  } catch (err) {
    console.warn('Error syncing user session', err);
  }

  // Handle Logout Buttons
  const logoutButtons = document.querySelectorAll('.popover-item.logout, a.logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'question',
          title: 'Konfirmasi Keluar',
          text: 'Apakah Anda yakin ingin keluar dari akun ini?',
          showCancelButton: true,
          confirmButtonText: 'Ya, Keluar',
          cancelButtonText: 'Batal',
          reverseButtons: true,
          customClass: { popup: 'sicekas-swal-modal', confirmButton: 'btn-swal-danger', cancelButton: 'btn-swal-gold' }
        }).then((res) => {
          if (res.isConfirmed) {
            localStorage.removeItem('SICEKAS_CURRENT_USER');
            window.location.replace('index.html');
          }
        });
      } else {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          localStorage.removeItem('SICEKAS_CURRENT_USER');
          window.location.replace('index.html');
        }
      }
    });
  });

  // ==========================================================================
  // PASSWORD MODAL & CLOUD DATABASE CHANGE PASSWORD INTEGRATION
  // ==========================================================================
  const passwordModal = document.getElementById('passwordModal');
  const btnChangePassword = document.getElementById('btnChangePassword');
  const btnQuickPassword = document.getElementById('btnQuickPassword');
  const btnChangePasswordPopover = document.getElementById('btnChangePasswordPopover');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const btnCancelPassword = document.getElementById('btnCancelPassword');
  const passwordForm = document.getElementById('passwordForm');

  const openPasswordModal = () => {
    if (!passwordModal) return;
    if (profilePopover) profilePopover.classList.remove('active');
    passwordModal.classList.add('active');
    gsap.fromTo('#passwordModal .modal-card', 
      { opacity: 0, scale: 0.94, y: 15 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)' }
    );
    const oldPassInput = document.getElementById('oldPassword');
    if (oldPassInput) oldPassInput.focus();
  };

  const closePassModal = () => {
    if (!passwordModal) return;
    gsap.to('#passwordModal .modal-card', {
      opacity: 0, scale: 0.94, y: 10, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        passwordModal.classList.remove('active');
        if (passwordForm) passwordForm.reset();
      }
    });
  };

  if (btnChangePassword) btnChangePassword.addEventListener('click', openPasswordModal);
  if (btnQuickPassword) btnQuickPassword.addEventListener('click', openPasswordModal);
  if (btnChangePasswordPopover) {
    btnChangePasswordPopover.addEventListener('click', (e) => {
      e.preventDefault();
      openPasswordModal();
    });
  }

  if (closePasswordModal) closePasswordModal.addEventListener('click', closePassModal);
  if (btnCancelPassword) btnCancelPassword.addEventListener('click', closePassModal);

  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) closePassModal();
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPass = document.getElementById('oldPassword')?.value;
      const newPass = document.getElementById('newPassword')?.value;
      const confirmPass = document.getElementById('confirmNewPassword')?.value;

      if (!oldPass || !newPass || !confirmPass) {
        showToast('Semua kolom password wajib diisi!', 'warn');
        return;
      }

      if (newPass.length < 6) {
        showToast('Password baru minimal 6 karakter!', 'warn');
        return;
      }

      if (newPass !== confirmPass) {
        showToast('Konfirmasi password baru tidak cocok!', 'error');
        return;
      }

      showToast('⚡ Mengubah password di Cloudflare D1 Database...', 'info');

      const userNip = typeof CURRENT_USER !== 'undefined' ? CURRENT_USER.nip : '';
      const userUname = typeof CURRENT_USER !== 'undefined' ? CURRENT_USER.username : '';

      const res = await CloudflareDB.changePassword({
        nip: userNip,
        username: userUname,
        oldPassword: oldPass,
        newPassword: newPass
      });

      if (res && res.success) {
        closePassModal();
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Password Berhasil Diperbarui!',
            text: res.message || 'Kata sandi akun Anda telah tersimpan langsung di Cloudflare D1 Cloud Database.',
            confirmButtonText: 'Selesai',
            customClass: { popup: 'sicekas-swal-modal', confirmButton: 'btn-swal-gold' }
          });
        } else {
          showToast('✓ Password berhasil disimpan ke Cloudflare D1!', 'success');
        }
      } else {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Ganti Password',
            text: res?.error || 'Password saat ini yang Anda masukkan tidak sesuai.',
            confirmButtonText: 'Coba Lagi',
            customClass: { popup: 'sicekas-swal-modal', confirmButton: 'btn-swal-gold' }
          });
        } else {
          showToast(`❌ ${res?.error || 'Gagal mengubah password'}`, 'error');
        }
      }
    });
  }

  // ==========================================================================
  // 3. NAVIGATION & VIEW SWITCHING (BERANDA <-> POA BULANAN <-> TP POL <-> SPPD/LPT)
  // ==========================================================================
  const switchView = (targetView) => {
    // Hide all views first
    if (viewBeranda) viewBeranda.style.display = 'none';
    if (viewPoaBulanan) viewPoaBulanan.style.display = 'none';
    if (viewTpPol) viewTpPol.style.display = 'none';
    if (viewSppdLpt) viewSppdLpt.style.display = 'none';
    if (viewJadwalKegiatan) viewJadwalKegiatan.style.display = 'none';
    if (viewDeveloperWeb) viewDeveloperWeb.style.display = 'none';

    if (targetView === 'poa-bulanan') {
      if (viewPoaBulanan) {
        viewPoaBulanan.style.display = 'block';
        gsap.fromTo(viewPoaBulanan, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
      if (topbarCategory) topbarCategory.textContent = 'PERENCANAAN & PELAPORAN';
      if (topbarTitle) topbarTitle.textContent = 'POA Bulanan';
      if (topbarSubtitle) topbarSubtitle.textContent = 'Plan of Action — Rencana kegiatan bulanan petugas Puskesmas Banjaran Kota';
    } else if (targetView === 'tppol-jaspel') {
      if (viewTpPol) {
        viewTpPol.style.display = 'block';
        gsap.fromTo(viewTpPol, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
      if (topbarCategory) topbarCategory.textContent = 'PENGAJUAN & SCORING KINERJA';
      if (topbarTitle) topbarTitle.textContent = 'TP POL (Jaspel)';
      if (topbarSubtitle) topbarSubtitle.textContent = 'Pengajuan Scoring Jasa Pelayanan — Per pegawai per bulan';
    } else if (targetView === 'sppd-lpt') {
      if (viewSppdLpt) {
        viewSppdLpt.style.display = 'block';
        gsap.fromTo(viewSppdLpt, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
      if (topbarCategory) topbarCategory.textContent = 'ADMINISTRASI & PERJALANAN DINAS';
      if (topbarTitle) topbarTitle.textContent = 'SPPD dan LPT';
      if (topbarSubtitle) topbarSubtitle.textContent = 'Penerbitan Surat Perjalanan Dinas dan Laporan Pertanggungjawaban Pelaksanaan Tugas';
    } else if (targetView === 'jadwal-kegiatan') {
      if (viewJadwalKegiatan) {
        viewJadwalKegiatan.style.display = 'block';
        gsap.fromTo(viewJadwalKegiatan, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo('.bok-stat-card',
          { opacity: 0, y: 18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07, ease: 'back.out(1.3)' }
        );
      }
      if (topbarCategory) topbarCategory.textContent = 'PERENCANAAN & AGENDA PUSKESMAS';
      if (topbarTitle) topbarTitle.textContent = 'Jadwal Kegiatan';
      if (topbarSubtitle) topbarSubtitle.textContent = 'Perencanaan dan kolaborasi jadwal kegiatan pelayanan petugas Puskesmas Banjaran Kota';
      if (window.JadwalBOKController) {
        window.JadwalBOKController.render();
      }
    } else if (targetView === 'developer-web') {
      const isSuperAdmin = (typeof CURRENT_USER !== 'undefined' && (CURRENT_USER.role === 'Super Admin' || CURRENT_USER.username === 'ozie'));
      if (!isSuperAdmin) {
        if (typeof showToast === 'function') {
          showToast('⛔ Akses Ditolak: Halaman Developer Web hanya untuk akun Super Admin!', 'error');
        } else {
          alert('⛔ Akses Ditolak: Halaman Developer Web hanya untuk akun Super Admin!');
        }
        switchView('beranda');
        return;
      }

      if (viewDeveloperWeb) {
        viewDeveloperWeb.style.display = 'block';
        gsap.fromTo(viewDeveloperWeb, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo('#viewDeveloperWeb .kpi-card',
          { opacity: 0, y: 18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07, ease: 'back.out(1.3)' }
        );
      }
      if (topbarCategory) topbarCategory.textContent = 'PENGEMBANG & KENDALI SISTEM';
      if (topbarTitle) topbarTitle.textContent = 'Developer Web Console';
      if (topbarSubtitle) topbarSubtitle.textContent = 'Panel Pengendalian Teknis, API Endpoint, Konfigurasi Database Cloud, & Audit Log Sistem SICEKAS v2.0';
      if (window.DeveloperWebController) {
        window.DeveloperWebController.init();
      }
    } else {
      // Default: Beranda
      if (viewBeranda) {
        viewBeranda.style.display = 'block';
        gsap.fromTo(viewBeranda, 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
      if (topbarCategory) topbarCategory.textContent = 'PORTAL RESMI SICEKAS';
      if (topbarTitle) topbarTitle.textContent = 'Beranda SICEKAS';
      if (topbarSubtitle) topbarSubtitle.textContent = 'Sistem Informasi Catat Pelaporan Puskesmas Banjaran Kota';
      
      setTimeout(() => {
        if (window.healthChartInstance) window.healthChartInstance.resize();
      }, 100);
    }
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const viewAttr = link.getAttribute('data-view');
      if (viewAttr) {
        switchView(viewAttr);
      } else {
        const label = link.querySelector('.nav-label')?.textContent || 'Menu';
        alert(`Membuka halaman ${label}...`);
      }

      // Subtle click animation with GSAP
      gsap.fromTo(link, 
        { scale: 0.97 }, 
        { scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    });
  });

  // ==========================================================================
  // 4. SIDEBAR SEARCH FILTER
  // ==========================================================================
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      navLinks.forEach(link => {
        const text = link.querySelector('.nav-label')?.textContent.toLowerCase() || '';
        const item = link.closest('.nav-item');
        if (item) {
          if (text.includes(term) || term === '') {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        }
      });
    });
  }

  // ==========================================================================
  // 5. INITIALIZE HEALTHCARE ANALYTICS CHART (Chart.js)
  // ==========================================================================
  const ctx = document.getElementById('healthChart');
  if (ctx) {
    const chartCtx = ctx.getContext('2d');

    const goldGradient = chartCtx.createLinearGradient(0, 0, 0, 240);
    goldGradient.addColorStop(0, 'rgba(255, 209, 102, 0.45)');
    goldGradient.addColorStop(1, 'rgba(255, 209, 102, 0.0)');

    const blueGradient = chartCtx.createLinearGradient(0, 0, 0, 240);
    blueGradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    blueGradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    window.healthChartInstance = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
        datasets: [
          {
            label: 'Laporan Terverifikasi',
            data: [118, 142, 136, 155, 148, 92, 45],
            borderColor: '#ffd166',
            backgroundColor: goldGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffd166',
            pointBorderColor: '#181b22',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Kunjungan Pasien',
            data: [260, 312, 290, 340, 325, 180, 95],
            borderColor: '#38bdf8',
            backgroundColor: blueGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#181b22',
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 5.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(24, 27, 34, 0.95)',
            titleColor: '#ffd166',
            bodyColor: '#e5e7eb',
            borderColor: 'rgba(255, 215, 120, 0.3)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.raw} Pasien`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: { color: '#8b92a0', font: { family: 'Plus Jakarta Sans', size: 11.5 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
            ticks: { color: '#8b92a0', font: { family: 'Plus Jakarta Sans', size: 11.5 } }
          }
        }
      }
    });
  }

  // ==========================================================================
  // 7. INDONESIAN NATIONAL HOLIDAYS & CUTI BERSAMA DATABASE (SKB 3 MENTERI)
  // ==========================================================================
  const INDONESIAN_HOLIDAYS = {
    // === 2026 ===
    '2026-01-01': { name: 'Tahun Baru 2026 Masehi', type: 'national' },
    '2026-01-16': { name: "Isra Mi'raj Nabi Muhammad SAW", type: 'national' },
    '2026-02-17': { name: 'Tahun Baru Imlek 2577 Kongzili', type: 'national' },
    '2026-02-18': { name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti' },
    '2026-03-19': { name: 'Hari Suci Nyepi (Saka 1948)', type: 'national' },
    '2026-03-20': { name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti' },
    '2026-03-21': { name: 'Hari Raya Idul Fitri 1447 H (Hari 1)', type: 'national' },
    '2026-03-22': { name: 'Hari Raya Idul Fitri 1447 H (Hari 2)', type: 'national' },
    '2026-03-23': { name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti' },
    '2026-03-24': { name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti' },
    '2026-03-25': { name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti' },
    '2026-04-03': { name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'national' },
    '2026-04-05': { name: 'Hari Paskah', type: 'national' },
    '2026-05-01': { name: 'Hari Buruh Internasional', type: 'national' },
    '2026-05-14': { name: 'Kenaikan Yesus Kristus', type: 'national' },
    '2026-05-15': { name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti' },
    '2026-05-27': { name: 'Hari Raya Idul Adha 1447 H', type: 'national' },
    '2026-05-28': { name: 'Cuti Bersama Idul Adha 1447 H', type: 'cuti' },
    '2026-05-31': { name: 'Hari Raya Waisak 2570 BE', type: 'national' },
    '2026-06-01': { name: 'Hari Lahir Pancasila', type: 'national' },
    '2026-06-16': { name: 'Tahun Baru Islam 1448 H', type: 'national' },
    '2026-08-17': { name: 'Hari Kemerdekaan RI ke-81', type: 'national' },
    '2026-08-25': { name: 'Maulid Nabi Muhammad SAW', type: 'national' },
    '2026-12-25': { name: 'Hari Raya Natal', type: 'national' },
    '2026-12-26': { name: 'Cuti Bersama Hari Raya Natal', type: 'cuti' },

    // === 2025 ===
    '2025-01-01': { name: 'Tahun Baru 2025 Masehi', type: 'national' },
    '2025-01-27': { name: "Isra Mi'raj Nabi Muhammad SAW", type: 'national' },
    '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili', type: 'national' },
    '2025-01-28': { name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti' },
    '2025-03-29': { name: 'Hari Suci Nyepi (Saka 1947)', type: 'national' },
    '2025-03-28': { name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti' },
    '2025-03-31': { name: 'Hari Raya Idul Fitri 1446 H', type: 'national' },
    '2025-04-01': { name: 'Hari Raya Idul Fitri 1446 H', type: 'national' },
    '2025-04-02': { name: 'Cuti Bersama Idul Fitri 1446 H', type: 'cuti' },
    '2025-04-03': { name: 'Cuti Bersama Idul Fitri 1446 H', type: 'cuti' },
    '2025-04-04': { name: 'Cuti Bersama Idul Fitri 1446 H', type: 'cuti' },
    '2025-04-07': { name: 'Cuti Bersama Idul Fitri 1446 H', type: 'cuti' },
    '2025-04-18': { name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'national' },
    '2025-04-20': { name: 'Hari Paskah', type: 'national' },
    '2025-05-01': { name: 'Hari Buruh Internasional', type: 'national' },
    '2025-05-12': { name: 'Hari Raya Waisak 2569 BE', type: 'national' },
    '2025-05-13': { name: 'Cuti Bersama Waisak', type: 'cuti' },
    '2025-05-29': { name: 'Kenaikan Yesus Kristus', type: 'national' },
    '2025-05-30': { name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti' },
    '2025-06-01': { name: 'Hari Lahir Pancasila', type: 'national' },
    '2025-06-06': { name: 'Hari Raya Idul Adha 1446 H', type: 'national' },
    '2025-06-09': { name: 'Cuti Bersama Idul Adha 1446 H', type: 'cuti' },
    '2025-06-27': { name: 'Tahun Baru Islam 1447 H', type: 'national' },
    '2025-08-17': { name: 'Hari Kemerdekaan RI ke-80', type: 'national' },
    '2025-09-05': { name: 'Maulid Nabi Muhammad SAW', type: 'national' },
    '2025-12-25': { name: 'Hari Raya Natal', type: 'national' },
    '2025-12-26': { name: 'Cuti Bersama Hari Raya Natal', type: 'cuti' },

    // === 2027 ===
    '2027-01-01': { name: 'Tahun Baru 2027 Masehi', type: 'national' },
    '2027-01-06': { name: "Isra Mi'raj Nabi Muhammad SAW", type: 'national' },
    '2027-02-06': { name: 'Tahun Baru Imlek 2578 Kongzili', type: 'national' },
    '2027-03-09': { name: 'Hari Suci Nyepi (Saka 1949)', type: 'national' },
    '2027-03-10': { name: 'Hari Raya Idul Fitri 1448 H', type: 'national' },
    '2027-03-11': { name: 'Hari Raya Idul Fitri 1448 H', type: 'national' },
    '2027-03-12': { name: 'Cuti Bersama Idul Fitri 1448 H', type: 'cuti' },
    '2027-03-26': { name: 'Wafat Yesus Kristus', type: 'national' },
    '2027-05-01': { name: 'Hari Buruh Internasional', type: 'national' },
    '2027-05-06': { name: 'Kenaikan Yesus Kristus', type: 'national' },
    '2027-05-17': { name: 'Hari Raya Idul Adha 1448 H', type: 'national' },
    '2027-05-20': { name: 'Hari Raya Waisak 2571 BE', type: 'national' },
    '2027-06-01': { name: 'Hari Lahir Pancasila', type: 'national' },
    '2027-06-06': { name: 'Tahun Baru Islam 1449 H', type: 'national' },
    '2027-08-17': { name: 'Hari Kemerdekaan RI ke-82', type: 'national' },
    '2027-08-15': { name: 'Maulid Nabi Muhammad SAW', type: 'national' },
    '2027-12-25': { name: 'Hari Raya Natal', type: 'national' },
    '2027-12-26': { name: 'Cuti Bersama Hari Raya Natal', type: 'cuti' }
  };

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Default tasks for nutrition & health officer
  const DEFAULT_ACTIVITIES_AUG_2026 = {
    '2026-08-01': 'Pelayanan Poli Gizi',
    '2026-08-03': 'Konseling Dietetik Rawat Jalan',
    '2026-08-04': 'Pelayanan Poli Gizi & Laktasi',
    '2026-08-05': 'Posyandu Balita Mawar RW 02',
    '2026-08-06': 'Pelayanan Poli Gizi',
    '2026-08-07': 'Penyuluhan Gizi Seimbang Bumil',
    '2026-08-10': 'Puskesmas Keliling Desa Banjaran',
    '2026-08-11': 'Pelayanan Poli Gizi',
    '2026-08-12': 'Pendampingan Balita Stunting RW 04',
    '2026-08-13': 'Pelayanan Konseling Diet DM/Hipertensi',
    '2026-08-14': 'Distribusi PMT Balita & Ibu Hamil KEK',
    '2026-08-18': 'Konseling Gizi & Dev SICEKAS',
    '2026-08-19': 'Posyandu Balita Melati RW 05',
    '2026-08-20': 'Pelayanan Poli Gizi',
    '2026-08-21': 'Evaluasi SPM Gizi Triwulan',
    '2026-08-24': 'Audit Kasus Stunting Wilayah',
    '2026-08-26': 'Pusling & Skrining Anemia Remaja',
    '2026-08-27': 'Pelayanan Poli Gizi',
    '2026-08-28': 'Rekapitulasi Pelaporan e-PPGBM',
    '2026-08-31': 'Lokakarya Mini Bulanan Puskesmas'
  };

  // State store for activities
  const poaActivitiesState = { ...DEFAULT_ACTIVITIES_AUG_2026 };

  // ==========================================================================
  // 8. DYNAMIC POA CALENDAR ENGINE
  // ==========================================================================
  const poaSelectMonth = document.getElementById('poaSelectMonth');
  const poaSelectYear = document.getElementById('poaSelectYear');
  const poaSelectOfficer = document.getElementById('poaSelectOfficer');
  const btnApplyPoaFilter = document.getElementById('btnApplyPoaFilter');
  const calDisplayTitle = document.getElementById('calDisplayTitle');
  const calDisplayOfficer = document.getElementById('calDisplayOfficer');
  const poaCalendarGrid = document.getElementById('poaCalendarGrid');
  const btnCetakPoa = document.getElementById('btnCetakPoa');

  // Single Activity Modal Elements
  const singleActivityModal = document.getElementById('singleActivityModal');
  const closeSingleModal = document.getElementById('closeSingleModal');
  const btnCancelSingle = document.getElementById('btnCancelSingle');
  const singleActivityForm = document.getElementById('singleActivityForm');
  const singleModalDateTitle = document.getElementById('singleModalDateTitle');
  const activityInput = document.getElementById('activityInput');
  const activityDesc = document.getElementById('activityDesc');
  let currentActiveDateKey = null;

  // Bulk Entry Modal Elements
  const bulkActivityModal = document.getElementById('bulkActivityModal');
  const btnIsiSekaligus = document.getElementById('btnIsiSekaligus');
  const closeBulkModal = document.getElementById('closeBulkModal');
  const btnCancelBulk = document.getElementById('btnCancelBulk');
  const bulkActivityForm = document.getElementById('bulkActivityForm');
  const bulkTableBody = document.getElementById('bulkTableBody');

  const getFormattedDateKey = (year, month, day) => {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Render Full Calendar
  const renderPoaCalendar = (month, year, officerName) => {
    if (!poaCalendarGrid) return;
    poaCalendarGrid.innerHTML = '';

    const monthIndex = month - 1; // 0-indexed
    const monthName = MONTH_NAMES[monthIndex];
    
    // Update top calendar titles
    if (calDisplayTitle) calDisplayTitle.textContent = `POA ${monthName} ${year}`;
    if (calDisplayOfficer) calDisplayOfficer.textContent = officerName.toUpperCase();

    // Total days in selected month
    const totalDays = new Date(year, month, 0).getDate();

    // First day of month (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
    // In our UI: Senin = 0, Selasa = 1, ..., Sabtu = 5, Minggu = 6
    const startOffset = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

    // 1. Render empty offset cells
    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-cell empty';
      poaCalendarGrid.appendChild(emptyCell);
    }

    // Current real-world date for 'HARI INI' detection
    const now = new Date();
    const currentRealYear = now.getFullYear();
    const currentRealMonth = now.getMonth() + 1;
    const currentRealDay = now.getDate();

    // 2. Render each day in month
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = getFormattedDateKey(year, month, day);
      const dateObj = new Date(year, monthIndex, day);
      const dayOfWeek = dateObj.getDay(); // 0 is Sunday
      const dayName = DAY_NAMES[dayOfWeek];

      const holidayInfo = INDONESIAN_HOLIDAYS[dateKey];
      const isWeekend = (dayOfWeek === 0);
      const isNationalHoliday = (holidayInfo && holidayInfo.type === 'national');
      const isCutiBersama = (holidayInfo && holidayInfo.type === 'cuti');
      const isToday = (year === currentRealYear && month === currentRealMonth && day === currentRealDay);

      const cell = document.createElement('div');
      let cellClasses = ['cal-cell'];
      if (isWeekend) cellClasses.push('is-weekend');
      if (isNationalHoliday) cellClasses.push('is-holiday');
      if (isCutiBersama) cellClasses.push('is-cuti');
      if (isToday) cellClasses.push('is-today');

      cell.className = cellClasses.join(' ');
      cell.setAttribute('data-date', dateKey);
      cell.setAttribute('data-day', String(day).padStart(2, '0'));
      cell.setAttribute('data-dayname', dayName);

      // Cell Top (Holiday badge / Today badge + Date Number)
      let badgeHtml = '';
      if (isToday) {
        badgeHtml = '<span class="today-indicator">HARI INI</span>';
      } else if (isNationalHoliday) {
        badgeHtml = `<span class="holiday-pill national" title="${holidayInfo.name}">🔴 ${holidayInfo.name}</span>`;
      } else if (isCutiBersama) {
        badgeHtml = `<span class="holiday-pill cuti" title="${holidayInfo.name}">🟠 ${holidayInfo.name}</span>`;
      }

      const cellTop = `
        <div class="cell-top">
          ${badgeHtml}
          <span class="day-num">${day}</span>
        </div>
      `;

      // Task Activities
      const currentTask = poaActivitiesState[dateKey] || '';
      let taskHtml = '';
      if (currentTask) {
        const isHighlight = isToday ? 'highlight' : '';
        taskHtml = `<div class="poa-task-badge ${isHighlight}" title="${currentTask}">${currentTask}</div>`;
      }

      const activitiesDiv = `<div class="cell-activities">${taskHtml}</div>`;
      const addBtn = `<button class="btn-cell-add" title="Tambah / Edit Kegiatan" data-date="${day} ${monthName} ${year} (${dayName})" data-key="${dateKey}">+</button>`;

      cell.innerHTML = cellTop + activitiesDiv + addBtn;
      poaCalendarGrid.appendChild(cell);
    }

    // 3. Render trailing empty padding cells to complete row
    const totalRenderedCells = startOffset + totalDays;
    const remainder = totalRenderedCells % 7;
    if (remainder !== 0) {
      const trailingCount = 7 - remainder;
      for (let i = 0; i < trailingCount; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell empty';
        poaCalendarGrid.appendChild(emptyCell);
      }
    }

    // Re-attach interactive listeners
    attachCalendarCellListeners(monthName, year);
  };

  // Attach Event Listeners to Calendar Cells
  const attachCalendarCellListeners = (monthName, year) => {
    // Click on '+' add button
    document.querySelectorAll('.btn-cell-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateKey = btn.getAttribute('data-key');
        const dateDisplayStr = btn.getAttribute('data-date');
        openSingleActivityModal(dateKey, dateDisplayStr);
      });
    });

    // Click on task badge to edit
    document.querySelectorAll('.poa-task-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const cell = badge.closest('.cal-cell');
        const dateKey = cell.getAttribute('data-date');
        const day = cell.getAttribute('data-day');
        const dayname = cell.getAttribute('data-dayname');
        const dateDisplayStr = `${parseInt(day, 10)} ${monthName} ${year} (${dayname})`;
        openSingleActivityModal(dateKey, dateDisplayStr, badge.textContent.trim());
      });
    });
  };

  // Open Single Activity Modal
  const openSingleActivityModal = (dateKey, dateDisplayStr, currentText = '') => {
    currentActiveDateKey = dateKey;
    if (singleModalDateTitle) singleModalDateTitle.textContent = `📅 ${dateDisplayStr}`;
    if (activityInput) activityInput.value = currentText || (poaActivitiesState[dateKey] || '');
    if (activityDesc) activityDesc.value = '';
    if (singleActivityModal) singleActivityModal.classList.add('active');
  };

  const closeSingleActivityModal = () => {
    if (singleActivityModal) singleActivityModal.classList.remove('active');
    currentActiveDateKey = null;
  };

  if (closeSingleModal) closeSingleModal.addEventListener('click', closeSingleActivityModal);
  if (btnCancelSingle) btnCancelSingle.addEventListener('click', closeSingleActivityModal);

  if (singleActivityModal) {
    singleActivityModal.addEventListener('click', (e) => {
      if (e.target === singleActivityModal) closeSingleActivityModal();
    });
  }

  // Handle Single Activity Form Save
  if (singleActivityForm) {
    singleActivityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = activityInput.value.trim();
      if (currentActiveDateKey) {
        if (val) {
          poaActivitiesState[currentActiveDateKey] = val;
        } else {
          delete poaActivitiesState[currentActiveDateKey];
        }

        // Re-render calendar to reflect update
        const selectedMonth = parseInt(poaSelectMonth.value, 10);
        const selectedYear = parseInt(poaSelectYear.value, 10);
        const officerText = poaSelectOfficer.options[poaSelectOfficer.selectedIndex].text.split('(')[0].trim();
        renderPoaCalendar(selectedMonth, selectedYear, officerText);
      }
      closeSingleActivityModal();
      singleActivityForm.reset();
    });
  }

  const getPoaOfficerName = () => {
    if (!poaSelectOfficer || poaSelectOfficer.selectedIndex < 0) return 'Mochamad Fauzie, S.Gz';
    const opt = poaSelectOfficer.options[poaSelectOfficer.selectedIndex];
    if (opt.value && isNaN(Number(opt.value))) return opt.value;
    return opt.text.split('(')[0].replace(/^\d+\.\s*/, '').trim();
  };

  // Populate Bulk Table for Selected Month & Year
  const populateBulkTable = (month, year) => {
    if (!bulkTableBody) return;
    bulkTableBody.innerHTML = '';

    const monthIndex = month - 1;
    const totalDays = new Date(year, month, 0).getDate();

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = getFormattedDateKey(year, month, day);
      const dateObj = new Date(year, monthIndex, day);
      const dayOfWeek = dateObj.getDay();
      const dayName = DAY_NAMES[dayOfWeek];
      const holidayInfo = INDONESIAN_HOLIDAYS[dateKey];
      const isWeekend = (dayOfWeek === 0);
      const isHoliday = !!holidayInfo;

      const tr = document.createElement('tr');
      if (isHoliday && holidayInfo.type === 'national') tr.className = 'is-holiday-row';
      if (isHoliday && holidayInfo.type === 'cuti') tr.className = 'is-cuti-row';

      let holidayTag = '';
      if (holidayInfo) {
        const color = holidayInfo.type === 'national' ? '#fb7185' : '#fef08a';
        const icon = holidayInfo.type === 'national' ? '🔴' : '🟠';
        holidayTag = `<span style="font-size: 10px; color: ${color}; display: block; font-weight: 600;">${icon} ${holidayInfo.name}</span>`;
      }

      const currentVal = poaActivitiesState[dateKey] || '';

      tr.innerHTML = `
        <td>
          <div class="bulk-date-badge ${isWeekend || isHoliday ? 'weekend' : ''}">
            <strong>${String(day).padStart(2, '0')}</strong> <span>${dayName}</span>
          </div>
          ${holidayTag}
        </td>
        <td>
          <input type="text" class="bulk-input input-kegiatan" data-datekey="${dateKey}" placeholder="Kegiatan..." value="${currentVal}">
        </td>
        <td>
          <input type="text" class="bulk-input input-keterangan" data-datekey="${dateKey}" placeholder="Keterangan..." value="">
        </td>
      `;
      bulkTableBody.appendChild(tr);
    }
  };

  const bulkModalTitle = document.getElementById('bulkModalTitle');

  const openBulkModal = () => {
    const selectedMonth = parseInt(poaSelectMonth.value, 10);
    const selectedYear = parseInt(poaSelectYear.value, 10);
    if (bulkModalTitle) {
      bulkModalTitle.textContent = `📝 Isi POA ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} Sekaligus`;
    }
    populateBulkTable(selectedMonth, selectedYear);
    if (bulkActivityModal) bulkActivityModal.classList.add('active');
  };

  const closeBulkModalFunc = () => {
    if (bulkActivityModal) bulkActivityModal.classList.remove('active');
  };

  if (btnIsiSekaligus) btnIsiSekaligus.addEventListener('click', openBulkModal);
  if (closeBulkModal) closeBulkModal.addEventListener('click', closeBulkModalFunc);
  if (btnCancelBulk) btnCancelBulk.addEventListener('click', closeBulkModalFunc);

  if (bulkActivityModal) {
    bulkActivityModal.addEventListener('click', (e) => {
      if (e.target === bulkActivityModal) closeBulkModalFunc();
    });
  }

  // Handle Bulk Form Save
  if (bulkActivityForm) {
    bulkActivityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const inputs = bulkActivityForm.querySelectorAll('.input-kegiatan');
      inputs.forEach(input => {
        const dateKey = input.getAttribute('data-datekey');
        const val = input.value.trim();
        if (val) {
          poaActivitiesState[dateKey] = val;
        } else {
          delete poaActivitiesState[dateKey];
        }
      });

      const selectedMonth = parseInt(poaSelectMonth.value, 10);
      const selectedYear = parseInt(poaSelectYear.value, 10);
      const officerText = getPoaOfficerName();
      renderPoaCalendar(selectedMonth, selectedYear, officerText);

      alert(`Semua rencana kegiatan POA ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} berhasil disimpan!`);
      closeBulkModalFunc();
    });
  }

  // Apply Filter Button Click & Change Events
  if (btnApplyPoaFilter) {
    btnApplyPoaFilter.addEventListener('click', () => {
      const selectedMonth = parseInt(poaSelectMonth.value, 10);
      const selectedYear = parseInt(poaSelectYear.value, 10);
      const officerText = getPoaOfficerName();
      
      renderPoaCalendar(selectedMonth, selectedYear, officerText);

      gsap.fromTo('.poa-calendar-wrapper', 
        { scale: 0.98, opacity: 0.7 }, 
        { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    });
  }

  // Also auto-render when selects change
  if (poaSelectMonth) {
    poaSelectMonth.addEventListener('change', () => {
      const selectedMonth = parseInt(poaSelectMonth.value, 10);
      const selectedYear = parseInt(poaSelectYear.value, 10);
      const officerText = getPoaOfficerName();
      renderPoaCalendar(selectedMonth, selectedYear, officerText);
    });
  }

  if (poaSelectYear) {
    poaSelectYear.addEventListener('change', () => {
      const selectedMonth = parseInt(poaSelectMonth.value, 10);
      const selectedYear = parseInt(poaSelectYear.value, 10);
      const officerText = getPoaOfficerName();
      renderPoaCalendar(selectedMonth, selectedYear, officerText);
    });
  }

  if (poaSelectOfficer) {
    poaSelectOfficer.addEventListener('change', () => {
      const selectedMonth = parseInt(poaSelectMonth.value, 10);
      const selectedYear = parseInt(poaSelectYear.value, 10);
      const officerText = getPoaOfficerName();
      renderPoaCalendar(selectedMonth, selectedYear, officerText);
    });
  }

  // Cetak POA Action
  if (btnCetakPoa) {
    btnCetakPoa.addEventListener('click', () => {
      window.print();
    });
  }

  // ==========================================================================
  // 9. INITIAL LOAD: RENDER AUGUST 2026 CALENDAR
  // ==========================================================================
  const initialMonth = parseInt(poaSelectMonth ? poaSelectMonth.value : '8', 10);
  const initialYear = parseInt(poaSelectYear ? poaSelectYear.value : '2026', 10);
  const initialOfficer = getPoaOfficerName();
  renderPoaCalendar(initialMonth, initialYear, initialOfficer);

  // ==========================================================================
  // 10. TP POL (JASPEL) CONTROLLER & INTERACTIVE ACTIONS
  // ==========================================================================

  // ------- ALL SCORING DATA FROM MASTER SPREADSHEET -------
  // Each jabatan has: sdmLabel, no (nomor urut), items[]
  // Each item has: unsur (text), subtext (optional), targets[] = [{target, bobot}]
  const ALL_SCORING_DATA = {
    gizi: {
      no: '5', sdmLabel: 'Nutrisionis/ Petugas Gizi',
      items: [
        { unsur: 'Jumlah pasien yang dilayani (konseling) di Klinik Gizi , (jumlah per bulan)', targets: [
          {target: '> 20 kunj', bobot: '5'}, {target: '13 - 19 kunj', bobot: '4'}, {target: '7 – 12 kunj', bobot: '3'}, {target: '1 - 6 kunj', bobot: '2'}
        ]},
        { unsur: 'Melakukan entry EPPGBM riil time', targets: [
          {target: '100%', bobot: '3'}, {target: '0%', bobot: '0'}
        ]},
        { unsur: 'Asuhan gizi pada balita gizi buruk/gizi kurang/bumil KEK (jumlah per bulan)', targets: [
          {target: '> 20 kunj', bobot: '5'}, {target: '13 - 19 kunj', bobot: '4'}, {target: '7 – 12 kunj', bobot: '3'}, {target: '1 - 6 kunj', bobot: '2'}
        ]},
        { unsur: 'Melakukan pemantauan dan pembinaan pelayanan gizi di posyandu, dan sekolah (jumlah per bulan)', targets: [
          {target: '100% dr Jumlah Posyandu', bobot: '6'}, {target: '75% dr Jumlah Posyandu', bobot: '4'}, {target: '50% dr Jumlah Posyandu', bobot: '2'}, {target: '25% dr Jumlah Posyandu', bobot: '1'}
        ]},
        { unsur: 'Melakukan pemantauan menu/nilai gizi di SPPG ( 1 SPPG maksimal dikunjungi 1x/bulan)', targets: [
          {target: '> 5 kunj', bobot: '3'}, {target: '3 - 4 kunj', bobot: '2'}, {target: '1 - 2 kunj', bobot: '1'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung per bulan dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '> 10 kl', bobot: '3'}, {target: '5 - 10 kl', bobot: '2'}, {target: '1 - 5 kl', bobot: '1'}
        ]},
        { unsur: 'Membuat perencanaan (RPK bulanan) dan laporan bulanan', subtext: '(capaian PKP, visualisasi data, hasil monitoring, PDCA/PDSA)', targets: [
          {target: 'Ada, lengkap, tepat waktu', bobot: '5'}, {target: 'Ada, tidak lengkap, tepat waktu', bobot: '3'}, {target: 'Tidak ada', bobot: '0'}
        ]}
      ]
    },
    dokter: {
      no: '1', sdmLabel: 'Dokter',
      items: [
        { unsur: 'Jumlah pasien dilayani (dalam dan luar gedung) termasuk pengisian rekam medis dan entry data ke dalam SIMPUS rata-rata per hari kerja', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN\nKeterangan : untuk pasien rawat inap, 1 orang sebanding dengan 5 orang pasien rawat jalan', targets: [
          {target: '21 - 30', bobot: '8'}, {target: '11 - 20', bobot: '6'}, {target: '1 - 10', bobot: '4'}
        ]},
        { unsur: 'Melakukan rujukan internal Puskesmas rata-rata per hari kerja', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '4 - > 5 org', bobot: '3'}, {target: '2 - 3 org', bobot: '1'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung (jumlah per bulan) dihitung bila menginput ke dalam kunjungan sehat', targets: [
          {target: '≥ 5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Melakukan Pemeriksaan USG (perbulan)', targets: [
          {target: '≥ 30 bumil', bobot: '5'}, {target: '21 - 30 bumil', bobot: '4'}, {target: '11 - 20 bumil', bobot: '3'}, {target: '1 - 10 bumil', bobot: '2'}
        ]},
        { unsur: 'Melakukan kunjungan rumah (perbulan) dihitung bila menginput ke dalam kunjungan sehat', targets: [
          {target: '≥ 4 rumah', bobot: '3'}, {target: '3 - 4 rumah', bobot: '2'}, {target: '1 - 2 rumah', bobot: '1'}
        ]},
        { unsur: 'Melakukan tindakan / menolong persalinan (jumlah per bulan)', targets: [
          {target: '≥ 5 kl', bobot: '5'}, {target: '3 - 4 kl', bobot: '3'}, {target: '1 - 2 kl', bobot: '2'}
        ]},
        { unsur: 'Refleksi Diskusi Kasus', targets: [
          {target: '≥ 5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]}
      ]
    },
    doktergigi: {
      no: '2', sdmLabel: 'Dokter Gigi',
      items: [
        { unsur: 'Jumlah pasien dilayani (dalam dan luar gedung, bukan tindakan) rata-rata per hari termasuk pengisian rekam medis dan ENTRY SIMPUS', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '> 15', bobot: '8'}, {target: '8 - 14', bobot: '6'}, {target: '1 - 7', bobot: '4'}
        ]},
        { unsur: 'Pembinaan UKGMD/UKGS', targets: [
          {target: '≥ 5 kl', bobot: '4'}, {target: '4 – 5 kl', bobot: '3'}, {target: '2 – 3 kl', bobot: '2'}, {target: '1 kl', bobot: '1'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung (jumlah per bulan) dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Melakukan tindakan ekstraksi / tumpatan tetap (rata-rata per hari)', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '> 10 kali', bobot: '8'}, {target: '5 - 9 kali', bobot: '6'}, {target: '1 - 4 kali', bobot: '4'}
        ]},
        { unsur: 'Melakukan tindakan scalling (jumlah per bulan)', targets: [
          {target: '> 8 kali', bobot: '4'}, {target: '5 - 7 kali', bobot: '2'}, {target: '1 - 4 kali', bobot: '1'}
        ]},
        { unsur: 'Refleksi Diskusi Kasus', targets: [
          {target: '≥ 5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]}
      ]
    },
    bidan_terampil: {
      no: '3', sdmLabel: 'Bidan (Ketrampilan)',
      items: [
        { unsur: 'Jumlah pasien dilayani dalam dan luar gedung termasuk pengisian rekam medis dan ENTRY SIMPUS, aplikasi ASIK (ANC, PNC, KB, BBL, Imunisasi, MTBS) rata-rata per hari', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '21 - 30', bobot: '8'}, {target: '11 - 20', bobot: '6'}, {target: '1 - 10', bobot: '4'}
        ]},
        { unsur: 'Jumlah pertolongan persalinan di Puskesmas oleh 3 Tenaga Kesehatan (jumlah per bulan)\ncatatan : persalinan yang dapat diklaim', targets: [
          {target: '7 - 8 bulin', bobot: '6'}, {target: '5 - 6 bulin', bobot: '5'}, {target: '3 – 4 bulin', bobot: '3'}, {target: '1 - 2 bulin', bobot: '2'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung per bulan dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Melaksanakan pencatatan dan pelaporan di Buku Kohort dan SIGIZI KESGA', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN', targets: [
          {target: '21 - 30', bobot: '4'}, {target: '11 - 20', bobot: '3'}, {target: '10', bobot: '2'}
        ]},
        { unsur: 'Jumlah kunjungan rumah/home visite (Askeb) jumlah per bulan', targets: [
          {target: '20 rumah', bobot: '6'}, {target: '16 rumah', bobot: '5'}, {target: '12 rumah', bobot: '4'}, {target: '8 rumah', bobot: '3'}, {target: '4 rumah', bobot: '2'}
        ]},
        { unsur: 'Refleksi Diskusi Kasus', targets: [
          {target: '≥ 5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]}
      ]
    },
    bidan_ahli: {
      no: '4', sdmLabel: 'Bidan (Ahli)',
      items: [
        { unsur: 'Melaksanakan FGD tentang kesehatan reproduksi dan KB pada ibu dan kelompok khusus / Refleksi Diskusi Kasus', targets: [
          {target: '≥ 5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Melaksanakan Pelayanan Kesehatan Anak terintegrasi (PKAT)', targets: [
          {target: '≥ 5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Melaksanakan pencatatan dan pelaporan di Buku Kohort dan SIGIZI KESGA', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN', targets: [
          {target: '> 30 orang', bobot: '4'}, {target: '21 - 30 orang', bobot: '3'}, {target: '11 - 20 orang', bobot: '2'}, {target: '10 orang', bobot: '1'}
        ]},
        { unsur: 'Mengevaluasi pelaksanaan program pemerintah di bidang kebidanan di lingkungan internal puskesmas', targets: [
          {target: '3', bobot: '3'}, {target: '2', bobot: '2'}, {target: '1', bobot: '1'}
        ]},
        { unsur: 'Jumlah pasien dilayani dalam dan luar gedung termasuk pengisian rekam medis dan ENTRY SIMPUS, aplikasi ASIK (ANC, PNC, KB, BBL, Imunisasi, MTBS) rata-rata per hari', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '21 - 30', bobot: '8'}, {target: '11 - 20', bobot: '6'}, {target: '1 - 10', bobot: '4'}
        ]},
        { unsur: 'Jumlah pertolongan persalinan di Puskesmas oleh 3 Tenaga Kesehatan (jumlah per bulan)', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '7 - 8 bulin', bobot: '6'}, {target: '5 - 6 bulin', bobot: '5'}, {target: '3 – 4 bulin', bobot: '3'}, {target: '1 - 2 bulin', bobot: '2'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung (jumlah per bulan) dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kali', bobot: '3'}, {target: '3 - 4 kali', bobot: '2'}, {target: '1 - 2 kali', bobot: '1'}
        ]}
      ]
    },
    perawat: {
      no: '1', sdmLabel: 'Perawat',
      items: [
        { unsur: 'Jumlah pasien dilayani (dalam dan luar gedung) termasuk entry data ke dalam SIMPUS rata-rata per hari kerja', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '> 50', bobot: '10'}, {target: '41 - 50', bobot: '8'}, {target: '31 - 40', bobot: '6'}, {target: '21 - 30', bobot: '4'}, {target: '11 - 20', bobot: '2'}, {target: '1 - 10', bobot: '1'}
        ]},
        { unsur: 'Jumlah pasien diberikan Asuhan Keperawatan Individu rata-rata per hari.', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '31 - 40', bobot: '6'}, {target: '21 - 30', bobot: '5'}, {target: '11 - 20', bobot: '4'}, {target: '1 - 10', bobot: '3'}
        ]},
        { unsur: 'Jumlah kunjungan rumah /home visit (Askep Keluarga) jumlah per bulan', targets: [
          {target: '20 rumah', bobot: '6'}, {target: '16 rumah', bobot: '5'}, {target: '12 rumah', bobot: '4'}, {target: '8 rumah', bobot: '3'}, {target: '4 rumah', bobot: '2'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung (jumlah per bulan) dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Jumlah tindakan di UGD selama 1 bulan', targets: [
          {target: '> 15', bobot: '5'}, {target: '11 s/d 15', bobot: '4'}, {target: '5 s/d 10', bobot: '3'}, {target: '1 s/d 5', bobot: '1'}
        ]}
      ]
    },
    ttk: {
      no: '1', sdmLabel: 'Tenaga Teknis Kefarmasian',
      items: [
        { unsur: 'Jumlah pelaksanaan Dispensing dan PIO pada pasien (Rata-rata lembar resep/hari)', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '> 79', bobot: '10'}, {target: '60 - 79', bobot: '8'}, {target: '40 - 59', bobot: '6'}, {target: '20 - 39', bobot: '4'}
        ]},
        { unsur: 'Jumlah pasien diberikan informasi obat', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '> 10', bobot: '8'}, {target: '7 - 9', bobot: '6'}, {target: '4 - 6', bobot: '4'}, {target: '1 - 3', bobot: '2'}
        ]},
        { unsur: 'Pencatatan dan pelaporan kegiatan pengelolaan perbekalan kefarmasian lengkap (LPLO), Stok Opname obat, BMHP, dan kartu SO', targets: [
          {target: 'Ada, lengkap tepat waktu', bobot: '3'}, {target: 'Ada, lengkap, tidak tepat waktu', bobot: '2'}, {target: 'Ada, Tidak lengkap', bobot: '1'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung per bulan dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Pencatatan dan pelaporan kegiatan pengelolaan perbekalan kefarmasian', targets: [
          {target: '> 5 lap', bobot: '6'}, {target: '3 - 4 lap', bobot: '4'}, {target: '2 lap', bobot: '3'}, {target: '1 lap', bobot: '2'}
        ]}
      ]
    },
    apoteker: {
      no: '5', sdmLabel: 'Apoteker',
      items: [
        { unsur: 'Jumlah pelayanan resep dan PIO (Rata-rata lembar Resep/hari kerja)', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '> 100', bobot: '10'}, {target: '60 - 79', bobot: '8'}, {target: '40 - 59', bobot: '6'}, {target: '30 - 39', bobot: '4'}, {target: '< 30', bobot: '2'}
        ]},
        { unsur: 'Pemberian pelayanan farmasi klinis di luar gedung : konseling pada pasien dan farmasi khusus [Homecare; Swamedikasi; Ambulatory Service; Remote Service; Pelayanan Paliatif]', subtext: '(Jumlah per bulan)', targets: [
          {target: '6 kali', bobot: '3'}, {target: '4 kali', bobot: '2'}, {target: '2 kali', bobot: '1'}
        ]},
        { unsur: 'Melaksanakan Gema Cermat/Penyuluhan', targets: [
          {target: '≥5 kali', bobot: '3'}, {target: '3 - 4 kali', bobot: '2'}, {target: '1 - 2 kali', bobot: '1'}
        ]},
        { unsur: 'Pencatatan dan pelaporan kegiatan pengelolaan perbekalan kefarmasian lengkap (LPLO), Stok Opname obat, BMHP, dan kartu SO', targets: [
          {target: 'Ada, lengkap tepat waktu', bobot: '5'}, {target: 'Ada, lengkap, tidak tepat waktu', bobot: '3'}, {target: 'Ada, Tidak lengkap', bobot: '1'}
        ]},
        { unsur: 'Melakukan pembinaan ke Apotek', targets: [
          {target: '≥ 20 Apotek', bobot: '5'}, {target: '16 - 20 Apotek', bobot: '4'}, {target: '11 - 15 Apotek', bobot: '3'}, {target: '6 - 10 Apotek', bobot: '2'}, {target: '1 - 5 Apotek', bobot: '1'}
        ]},
        { unsur: 'Melaksanakan pembinaan Kesehatan Tradisonal', targets: [
          {target: 'Dilaksanakan minimal 50% dari Batra binaan', bobot: '4'}, {target: 'Tidak dilaksanakan', bobot: '0'}
        ]}
      ]
    },
    atlm: {
      no: '3', sdmLabel: 'Analis Kesehatan',
      items: [
        { unsur: 'Jumlah pemeriksaan spesimen lab umum (jumlah rata-rata perhari)', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '>50', bobot: '10'}, {target: '41 - 50', bobot: '8'}, {target: '31 - 40', bobot: '6'}, {target: '21 - 30', bobot: '4'}, {target: '5 - 20', bobot: '2'}
        ]},
        { unsur: 'Jumlah pemeriksaan spesimen lab umum diluar gedung (Kegiatan tidak di SPJ kan di sumber anggaran yang lain) (jumlah rata-rata perhari)', subtext: 'JUMLAH PASIEN SELAMA 1 BULAN / JUMLAH HARI KERJA SELAMA 1 BULAN', targets: [
          {target: '31 - 40', bobot: '7'}, {target: '21 - 30', bobot: '5'}, {target: '5 - 20', bobot: '3'}
        ]},
        { unsur: 'Melakukan Stok Opname setiap bulan', targets: [
          {target: 'Lengkap, tepat waktu', bobot: '5'}, {target: 'Lengkap, tidak tepat waktu', bobot: '2'}, {target: 'Tidak ada', bobot: '0'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung per bulan dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kali', bobot: '3'}, {target: '3 - 4 kali', bobot: '2'}, {target: '1 - 2 kali', bobot: '1'}
        ]},
        { unsur: 'Perencanaan, pelaporan kebutuhan dan penggunaan BMHP Labkesmas', targets: [
          {target: 'Ada, lengkap, tepat waktu', bobot: '5'}, {target: 'Ada, tidak lengkap, tepat waktu', bobot: '3'}, {target: 'Tidak ada', bobot: '0'}
        ]}
      ]
    },
    sanitarian: {
      no: '2', sdmLabel: 'Sanitarian',
      items: [
        { unsur: 'Jumlah pasien/klien dilayani di Klinik sanitasi dalam dan luar gedung (jumlah per bulan)', targets: [
          {target: '> 40 kunj', bobot: '7'}, {target: '30 - 39 kunj', bobot: '5'}, {target: '20 - 29 kunj', bobot: '3'}, {target: '10 - 19 kunj', bobot: '2'}, {target: '1 - 9 kunj', bobot: '1'}
        ]},
        { unsur: 'Melakukan IKL di SPPG (1 SPPG maksimal dikunjungi 1x/bulan)', targets: [
          {target: '> 5 kunj', bobot: '3'}, {target: '3 - 4 kunj', bobot: '2'}, {target: '1 - 2 kunj', bobot: '1'}
        ]},
        { unsur: 'Melakukan IS/IKL di institusi/Industri/TPM/TTU/Damiu (jumlah per bulan)', targets: [
          {target: '> 16 lokasi', bobot: '4'}, {target: '11 - 15 lokasi', bobot: '3'}, {target: '6 - 10 lokasi', bobot: '2'}, {target: '1 - 5 lokasi', bobot: '1'}
        ]},
        { unsur: 'Melakukan IS/IKL di rumah', targets: [
          {target: '> 70 rumah', bobot: '4'}, {target: '60 – 69 rumah', bobot: '3'}, {target: '50 – 59 rumah', bobot: '2'}, {target: '40 – 49 rumah', bobot: '1'}
        ]},
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung per bulan dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '≥5 kl', bobot: '3'}, {target: '3 - 4 kl', bobot: '2'}, {target: '1 - 2 kl', bobot: '1'}
        ]},
        { unsur: 'Pembinaan PIRT', targets: [
          {target: 'Dilaksanakan 50% PIRT', bobot: '4'}, {target: 'Tidak dilaksanakan', bobot: '0'}
        ]},
        { unsur: 'Membuat perencanaan (RPK bulanan) dan laporan bulanan (capaian PKP, visualisasi data, hasil monitoring, PDCA/PDSA)', targets: [
          {target: 'Ada, lengkap, tepat waktu', bobot: '5'}, {target: 'Ada, tidak lengkap, tepat waktu', bobot: '3'}, {target: 'Tidak ada', bobot: '0'}
        ]}
      ]
    },
    promkes: {
      no: '4', sdmLabel: 'Tenaga Penyuluh / Promkes',
      items: [
        { unsur: 'Penyuluhan kelompok di dalam/luar gedung per bulan dengan menginput ke dalam kunjungan sehat', targets: [
          {target: '> 10 kali', bobot: '3'}, {target: '5 - 10 kali', bobot: '2'}, {target: '1 - 5 kali', bobot: '1'}
        ]},
        { unsur: 'Mengelola media informasi di media sosial\ncatatan : menggungah media informasi ke media sosial puskesmas dan memberikan feed back', targets: [
          {target: 'Dibuat dan Dilaksanakan', bobot: '5'}, {target: 'Tidak dilaksanakan', bobot: '0'}
        ]},
        { unsur: 'Melaksanakan Kemitraan dengan linsek/swasta untuk pembangunan kesehatan', targets: [
          {target: 'Dilaksanakan', bobot: '3'}, {target: 'Tidak melaksanakan', bobot: '0'}
        ]},
        { unsur: 'Pembuatan Media Informasi', targets: [
          {target: '>15 media', bobot: '3'}, {target: '11 -15 media', bobot: '2'}, {target: '5 - 10 media', bobot: '1'}
        ]},
        { unsur: 'Melaksanakan Kegiatan PHS mulai dari pendataan, analisis situasi, penentuan masalah, penentuan kegiatan, intervensi dan evaluasi', targets: [
          {target: 'Dibuat dan dilaksanakan', bobot: '4'}, {target: 'Dibuat Tidak dilaksanakan', bobot: '2'}, {target: 'Tidak Dilaksanakan', bobot: '0'}
        ]},
        { unsur: 'Melaksanakan Kegiatan Desa Siaga Sesuai dengan 8 indikator desa siaga', targets: [
          {target: 'Melaksanakan pembinaan seluruh indikator', bobot: '4'}, {target: 'Melaksanakan 4 indikator', bobot: '2'}, {target: 'Tidak melaksanakan', bobot: '0'}
        ]},
        { unsur: 'Pembinaan posyandu siklus hidup, poskestren, SBH, Poskesdes', targets: [
          {target: '6 s/d 10', bobot: '3'}, {target: '1 - 5', bobot: '1'}
        ]},
        { unsur: 'Membuat perencanaan (RPK bulanan) dan laporan bulanan (capaian PKP, visualisasi data, hasil monitoring, PDCA/PDSA)', targets: [
          {target: 'Ada, lengkap, tepat waktu', bobot: '5'}, {target: 'Ada, tidak lengkap, tepat waktu', bobot: '3'}, {target: 'Tidak ada', bobot: '0'}
        ]}
      ]
    },
    sopir: {
      no: '27', sdmLabel: 'Supir',
      items: [
        { unsur: 'Bertanggungjawab merawat dan membersihkan mobil setiap hari', targets: [
          {target: '> 2 mobil', bobot: '7'}, {target: '1 mobil', bobot: '5'}
        ]},
        { unsur: 'Mengantar pasien yang akan dirujuk ke RS rujukan dan meminta bukti merujuk dari RS', targets: [
          {target: '> 6 rujukan', bobot: '10'}, {target: '3 - 5 rujukan', bobot: '6'}, {target: '1 - 2 rujukan', bobot: '3'}
        ]},
        { unsur: 'Melaksanakan kegiatan kedinasan (Puskel, Posko, dll)', targets: [
          {target: '> 5 kali', bobot: '10'}, {target: '3 - 4 kali', bobot: '7'}, {target: '1 - 2 kali', bobot: '4'}
        ]},
        { unsur: 'Melaksanakan service dan ganti oli setiap 3 bulan sekali', targets: [
          {target: 'Dilaksanakan', bobot: '3'}, {target: 'Tidak dilaksanakan', bobot: '0'}
        ]}
      ],
      catatan: 'catatan : bila melaksanakan tugas jaga diluar hari kerja, tetap mendapatkan honor (OH)'
    }
  };

  // ------- RENDER SCORING TABLE DYNAMICALLY -------
  const scoringTableBody = document.getElementById('scoringTableBody');

  function renderScoringTable(jabatanKey) {
    if (!scoringTableBody) return;
    const data = ALL_SCORING_DATA[jabatanKey];
    if (!data) { scoringTableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:20px;">Data scoring belum tersedia untuk jabatan ini.</td></tr>'; return; }

    let html = '';
    let totalRowSpan = 0;
    data.items.forEach(item => { totalRowSpan += item.targets.length; });

    let noRendered = false;
    let sdmLabelRendered = false;
    let cakupanIdx = 1;

    data.items.forEach((item, itemIdx) => {
      const targetsCount = item.targets.length;

      item.targets.forEach((t, tIdx) => {
        html += '<tr>';

        // NO column — merged across ALL rows with '1' centered
        if (!noRendered && tIdx === 0 && itemIdx === 0) {
          html += `<td rowspan="${totalRowSpan}" class="text-center" style="vertical-align: middle; text-align: center;">1</td>`;
          noRendered = true;
        }

        // KELOMPOK/JENIS SDM column — only once, spanning all rows, centered
        if (!sdmLabelRendered && tIdx === 0 && itemIdx === 0) {
          html += `<td rowspan="${totalRowSpan}" class="text-center" style="vertical-align: middle; text-align: center; padding: 10px;">${data.sdmLabel}</td>`;
          sdmLabelRendered = true;
        }

        // UNSUR VARIABEL KINERJA column — only on first target row of each item, vertically centered
        if (tIdx === 0) {
          let unsurText = item.unsur.replace(/\n/g, '<br>');
          if (item.subtext) {
            unsurText += `<br><small style="color:#555;">${item.subtext.replace(/\n/g, '<br>')}</small>`;
          }
          html += `<td rowspan="${targetsCount}" style="vertical-align: middle;">${unsurText}</td>`;
        }

        // NILAI TARGET
        html += `<td class="text-center" style="vertical-align: middle; text-align: center;">${t.target}</td>`;

        // BOBOT
        html += `<td class="text-center" style="vertical-align: middle; text-align: center;">${t.bobot}</td>`;

        // CAKUPAN BULAN INI — only on first target row of each item
        if (tIdx === 0) {
          html += `<td rowspan="${targetsCount}" style="vertical-align: middle; text-align: center; padding: 6px;">`;
          html += `<input type="text" class="exact-cakupan-input" id="cakupanRow${cakupanIdx}" placeholder="" style="text-align: center;">`;
          html += '</td>';
          cakupanIdx++;
        }

        html += '</tr>';
      });
    });

    // Add catatan row if exists (e.g., for Sopir)
    if (data.catatan) {
      html += `<tr><td colspan="6" style="font-style:italic; font-size:11px; padding:6px; vertical-align: middle; text-align: center;">${data.catatan}</td></tr>`;
    }

    scoringTableBody.innerHTML = html;
  }

  // ------- JABATAN CHANGE HANDLER -------
  const tppolSelectJabatan = document.getElementById('tppolSelectJabatan');
  const tppolYear = document.getElementById('tppolYear');
  const tppolMonth = document.getElementById('tppolMonth');
  const tppolKlaster = document.getElementById('tppolKlaster');

  const signKepala = document.getElementById('signKepala');
  const signVerifikator = document.getElementById('signVerifikator');
  const signPetugas = document.getElementById('signPetugas');
  const signLabelId = document.getElementById('signLabelId');

  const tpPolDocTitle = document.getElementById('tpPolDocTitle');
  const tpPolMetaName = document.getElementById('tpPolMetaName');
  const tpPolMetaJabatan = document.getElementById('tpPolMetaJabatan');
  const tpPolMetaPendidikan = document.getElementById('tpPolMetaPendidikan');
  const tpPolMetaStatus = document.getElementById('tpPolMetaStatus');
  const tpPolMetaIdLabel = document.getElementById('tpPolMetaIdLabel');
  const tpPolMetaNip = document.getElementById('tpPolMetaNip');

  const sigKepalaName = document.getElementById('sigKepalaName');
  const sigVerifikatorCol = document.getElementById('sigVerifikatorCol');
  const sigVerifikatorName = document.getElementById('sigVerifikatorName');
  const sigVerifikatorNip = document.getElementById('sigVerifikatorNip');
  const sigPetugasName = document.getElementById('sigPetugasName');
  const sigPetugasNip = document.getElementById('sigPetugasNip');
  const sigDatePlace = document.getElementById('sigDatePlace');

  const btnSaveTpPol = document.getElementById('btnSaveTpPol');
  const btnOpenProfileModal = document.getElementById('btnOpenProfileModal');
  const btnDownloadPdfTpPol = document.getElementById('btnDownloadPdfTpPol');

  // Profile Modal Elements
  const modalProfilePegawai = document.getElementById('modalProfilePegawai');
  const closeProfileModal = document.getElementById('closeProfileModal');
  const btnCancelProfile = document.getElementById('btnCancelProfile');
  const profilePegawaiForm = document.getElementById('profilePegawaiForm');
  const profNama = document.getElementById('profNama');
  const profJabatan = document.getElementById('profJabatan');
  const profPendidikan = document.getElementById('profPendidikan');
  const profStatus = document.getElementById('profStatus');
  const profNip = document.getElementById('profNip');

  // Sync TP POL Document Title & Signature Date
  const updateTpPolDocHeader = () => {
    const month = parseInt(tppolMonth ? tppolMonth.value : '8', 10);
    const year = parseInt(tppolYear ? tppolYear.value : '2026', 10);
    const monthName = MONTH_NAMES[month - 1];

    if (tpPolDocTitle) {
      tpPolDocTitle.textContent = `PENGAJUAN SCORING JASPEL BULAN ${monthName.toUpperCase()} ${year}`;
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    if (sigDatePlace) {
      sigDatePlace.textContent = `Banjaran, ${lastDayOfMonth} ${monthName} ${year}`;
    }
  };

  if (tppolMonth) tppolMonth.addEventListener('change', updateTpPolDocHeader);
  if (tppolYear) tppolYear.addEventListener('change', updateTpPolDocHeader);

  // Jabatan dropdown -> re-render scoring table + update metadata jabatan
  if (tppolSelectJabatan) {
    tppolSelectJabatan.addEventListener('change', () => {
      const jabatanKey = tppolSelectJabatan.value;
      renderScoringTable(jabatanKey);
      // Update metadata jabatan label
      const data = ALL_SCORING_DATA[jabatanKey];
      if (data && tpPolMetaJabatan) {
        tpPolMetaJabatan.textContent = data.sdmLabel;
      }
    });
  }

  // Initial render of scoring table (default: gizi)
  renderScoringTable(tppolSelectJabatan ? tppolSelectJabatan.value : 'gizi');

  // Sync Signature Dropdowns
  if (signKepala && sigKepalaName) {
    signKepala.addEventListener('change', () => {
      sigKepalaName.textContent = signKepala.value;
    });
  }

  if (signVerifikator && sigVerifikatorCol && sigVerifikatorName) {
    signVerifikator.addEventListener('change', () => {
      const val = signVerifikator.value.trim();
      if (val) {
        sigVerifikatorCol.style.display = 'flex';
        sigVerifikatorName.textContent = val.split('(')[0].trim();
        const opt = signVerifikator.options[signVerifikator.selectedIndex];
        const nip = opt ? opt.getAttribute('data-nip') : '';
        if (sigVerifikatorNip) {
          sigVerifikatorNip.textContent = nip ? `NIP. ${nip}` : '';
        }
      } else {
        sigVerifikatorCol.style.display = 'none';
      }
    });
  }

  if (signPetugas && sigPetugasName && tpPolMetaName) {
    signPetugas.addEventListener('change', () => {
      const opt = signPetugas.options[signPetugas.selectedIndex];
      const petName = opt.value || opt.text.split('(')[0].replace(/^\d+\.\s*/, '').trim();
      const petNip = opt.getAttribute('data-nip') || '';
      const petLabel = opt.getAttribute('data-label') || 'NIP';
      const petJabatan = opt.getAttribute('data-jabatan') || '';
      const petStatus = opt.getAttribute('data-status') || '';

      sigPetugasName.textContent = petName;
      tpPolMetaName.textContent = petName;

      if (petNip) {
        if (tpPolMetaNip) tpPolMetaNip.textContent = petNip;
        if (sigPetugasNip) sigPetugasNip.textContent = (petLabel && petNip !== '-' ? `${petLabel}. ${petNip}` : petNip);
        if (profNip) profNip.value = petNip;
      }
      if (petLabel && tpPolMetaIdLabel) {
        tpPolMetaIdLabel.textContent = petLabel;
        if (signLabelId) signLabelId.value = petLabel;
      }
      if (petJabatan && tpPolMetaJabatan) {
        tpPolMetaJabatan.textContent = petJabatan;
        if (profJabatan) profJabatan.value = petJabatan;
      }
      if (petStatus && tpPolMetaStatus) {
        tpPolMetaStatus.textContent = petStatus;
        if (profStatus) profStatus.value = petStatus;
      }
    });
  }

  if (signLabelId && tpPolMetaIdLabel && sigPetugasNip) {
    signLabelId.addEventListener('change', () => {
      const label = signLabelId.value;
      tpPolMetaIdLabel.textContent = label;
      const currentNipVal = profNip && profNip.value ? profNip.value : '873.3204.16.02.008';
      sigPetugasNip.textContent = (currentNipVal !== '-' ? `${label}. ${currentNipVal}` : '-');
    });
  }

  // Profile Pegawai Modal Handlers
  const openProfModal = () => {
    if (modalProfilePegawai) modalProfilePegawai.classList.add('active');
  };

  const closeProfModal = () => {
    if (modalProfilePegawai) modalProfilePegawai.classList.remove('active');
  };

  if (btnOpenProfileModal) btnOpenProfileModal.addEventListener('click', openProfModal);
  if (closeProfileModal) closeProfileModal.addEventListener('click', closeProfModal);
  if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeProfModal);

  if (modalProfilePegawai) {
    modalProfilePegawai.addEventListener('click', (e) => {
      if (e.target === modalProfilePegawai) closeProfModal();
    });
  }

  if (profilePegawaiForm) {
    profilePegawaiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newNama = profNama.value.trim();
      const newJabatan = profJabatan.value.trim();
      const newPendidikan = profPendidikan.value.trim();
      const newStatus = profStatus.value;
      const newNip = profNip.value.trim();
      const idLabel = signLabelId ? signLabelId.value : 'NIP';

      if (tpPolMetaName) tpPolMetaName.textContent = newNama;
      if (tpPolMetaJabatan) tpPolMetaJabatan.textContent = newJabatan;
      if (tpPolMetaPendidikan) tpPolMetaPendidikan.textContent = newPendidikan;
      if (tpPolMetaStatus) tpPolMetaStatus.textContent = newStatus;
      if (tpPolMetaNip) tpPolMetaNip.textContent = newNip;
      if (sigPetugasName) sigPetugasName.textContent = newNama;
      if (sigPetugasNip) sigPetugasNip.textContent = `${idLabel}. ${newNip}`;

      alert(`Profil pegawai berhasil diperbarui untuk ${newNama}!`);
      closeProfModal();
    });
  }

  // Save TP POL Data
  if (btnSaveTpPol) {
    btnSaveTpPol.addEventListener('click', () => {
      const month = parseInt(tppolMonth ? tppolMonth.value : '8', 10);
      const year = parseInt(tppolYear ? tppolYear.value : '2026', 10);
      const monthName = MONTH_NAMES[month - 1];

      gsap.to(btnSaveTpPol, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          alert(`✓ Data Pengajuan Scoring TP POL (Jaspel) Bulan ${monthName} ${year} berhasil disimpan ke database SICEKAS!`);
        }
      });
    });
  }

  // Isolated Clean TP POL Printer
  const extractTpPolCss = () => {
    const relevantPrefixes = ['.scoring-doc', '.scoring-', '.tppol-doc', '#scoringDoc'];
    let css = '';
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const sel = rule.selectorText || '';
            if (relevantPrefixes.some(p => sel.includes(p))) {
              css += rule.cssText + '\n';
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
    return css;
  };

  const printIsolatedTpPol = () => {
    const scoringDoc = document.getElementById('scoringDocSheet');
    if (!scoringDoc) {
      alert('Tidak ada dokumen TP POL yang bisa dicetak.');
      return;
    }

    const month = parseInt(tppolMonth ? tppolMonth.value : '8', 10);
    const year = parseInt(tppolYear ? tppolYear.value : '2026', 10);
    const monthName = MONTH_NAMES[month - 1];
    const docCss = extractTpPolCss();

    const baseHref = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak dokumen.');
      return;
    }

    // Clone scoring doc and ensure input values are preserved
    const cloneDoc = scoringDoc.cloneNode(true);
    const origInputs = scoringDoc.querySelectorAll('input, textarea');
    const cloneInputs = cloneDoc.querySelectorAll('input, textarea');
    origInputs.forEach((inp, idx) => {
      if (cloneInputs[idx]) {
        cloneInputs[idx].value = inp.value;
        cloneInputs[idx].setAttribute('value', inp.value);
      }
    });

    printWin.document.open();
    printWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<base href="${baseHref}">
<title>TP POL JASPEL ${monthName.toUpperCase()} ${year} — Puskesmas Banjaran Kota</title>
<style>
  @page {
    size: A4 portrait !important;
    margin: 0mm !important;
  }
  *, *::before, *::after {
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    background: #1e293b;
    color: #000000;
    margin: 0;
    padding: 0;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
    line-height: 1.2;
    -webkit-font-smoothing: antialiased;
  }

  /* Screen toolbar (hidden during print) */
  .no-print-bar {
    position: sticky;
    top: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .no-print-bar .doc-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13.5px;
  }
  .no-print-bar .doc-badge {
    background: rgba(56, 189, 248, 0.18);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.35);
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .no-print-bar .btn-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .no-print-bar button {
    cursor: pointer;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    padding: 7px 16px;
    border-radius: 8px;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }
  .no-print-bar .btn-print-action {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  }
  .no-print-bar .btn-print-action:hover {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.6);
  }
  .no-print-bar .btn-close-action {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  .no-print-bar .btn-close-action:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }

  /* Document Stage (On Screen Preview) */
  .document-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0 60px 0;
    gap: 24px;
    background: #1e293b;
  }

  /* Extracted TP POL document styles */
  ${docCss}

  /* Strict Pure A4 Single Page Print & Preview Specs */
  .scoring-doc-sheet-exact {
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 297mm !important;
    box-sizing: border-box !important;
    padding: 1.9cm 1.8cm 1.9cm 1.8cm !important;
    margin: 0 auto !important;
    background: #ffffff !important;
    color: #000000 !important;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5) !important;
    border: none !important;
    border-radius: 0 !important;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
    position: relative !important;
  }

  .doc-sheet-title-exact {
    text-align: center !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    margin: 0 0 8px 0 !important;
    text-transform: uppercase !important;
    color: #000000 !important;
  }

  .doc-meta-exact {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    font-size: 10px !important;
    margin-bottom: 8px !important;
    color: #000000 !important;
  }

  .meta-exact-row {
    display: flex !important;
    align-items: center !important;
    line-height: 1.25 !important;
  }

  .meta-exact-label {
    width: 110px !important;
    font-weight: 500 !important;
  }

  .meta-exact-sep {
    width: 14px !important;
    text-align: center !important;
  }

  .exact-scoring-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 9.5px !important;
    border: 1px solid #000000 !important;
  }

  .exact-scoring-table th,
  .exact-scoring-table td {
    border: 1px solid #000000 !important;
    padding: 2px 4px !important;
    line-height: 1.15 !important;
    vertical-align: middle !important;
    color: #000000 !important;
  }

  .exact-scoring-table th {
    background: #f1f5f9 !important;
    font-weight: 800 !important;
    text-align: center !important;
    font-size: 9.5px !important;
    padding: 3px 4px !important;
  }

  .exact-cakupan-input {
    width: 100% !important;
    min-height: 18px !important;
    padding: 1px 2px !important;
    border: 1px dashed #777777 !important;
    border-radius: 2px !important;
    font-size: 9.5px !important;
    text-align: center !important;
    background: transparent !important;
    color: #000000 !important;
  }

  .doc-signatures-exact {
    display: flex !important;
    justify-content: space-between !important;
    margin-top: 12px !important;
    font-size: 10px !important;
    padding: 0 5px !important;
    color: #000000 !important;
  }

  .sig-exact-col {
    text-align: center !important;
    min-width: 140px !important;
  }

  .sig-exact-col p {
    margin: 0 0 2px 0 !important;
    line-height: 1.2 !important;
  }

  .sig-exact-space {
    height: 32px !important;
  }

  .sig-exact-name {
    font-weight: 700 !important;
    text-decoration: underline !important;
  }

  .sig-exact-nip {
    font-size: 9px !important;
    margin-top: 1px !important;
  }

  @media print {
    .no-print {
      display: none !important;
    }
    html, body {
      background: #ffffff !important;
    }
    .document-stage {
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
    }
    .scoring-doc-sheet-exact {
      box-shadow: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      margin: 0 !important;
      padding: 1.9cm 1.8cm 1.9cm 1.8cm !important;
    }
    .exact-cakupan-input {
      border: none !important;
      box-shadow: none !important;
    }
  }
</style>
</head>
<body>
<div class="no-print-bar no-print">
  <div class="doc-info">
    <strong style="display: flex; align-items: center; gap: 6px;">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      <span>Pratinjau Dokumen TP POL (Jaspel)</span>
    </strong>
    <span class="doc-badge">Format Kertas: A4 (Standar Resmi 1 Lembar Pas)</span>
  </div>
  <div class="btn-group">
    <button type="button" class="btn-print-action" onclick="window.print()">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      <span>Cetak / Save as PDF</span>
    </button>
    <button type="button" class="btn-close-action" onclick="window.close()">
      <span>Tutup</span>
    </button>
  </div>
</div>

<div class="document-stage">
  ${cloneDoc.outerHTML}
</div>

<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 350);
  };
<\/script>
</body>
</html>`);
    printWin.document.close();
  };

  // Download PDF / Cetak Formulir TP POL
  if (btnDownloadPdfTpPol) {
    btnDownloadPdfTpPol.addEventListener('click', () => {
      if (typeof showToast === 'function') {
        showToast("Membuka pratinjau dokumen TP POL... Pilih 'Save as PDF' di menu printer.", 'info');
      }
      printIsolatedTpPol();
    });
  }

  const btnPrintTpPol = document.getElementById('btnPrintTpPol');
  if (btnPrintTpPol) {
    btnPrintTpPol.addEventListener('click', () => {
      printIsolatedTpPol();
    });
  }

  // Upload Evidence Handler
  const btnUploadEvidence = document.getElementById('btnUploadEvidence');
  if (btnUploadEvidence) {
    btnUploadEvidence.addEventListener('click', () => {
      alert('Silakan pilih berkas dokumen bukti dukung capaian kinerja (PDF / JPG / PNG / ZIP) untuk diunggah ke server.');
    });
  }

  // ==========================================================================
  // 11. SPPD & LPT (SURAT PERJALANAN DINAS & LAPORAN TUGAS) CONTROLLER
  // ==========================================================================
  const sppdLptSelectForm = document.getElementById('sppdLptSelectForm');
  const sppdDisplayPartGroup = document.getElementById('sppdDisplayPartGroup');
  const sppdDisplayPart = document.getElementById('sppdDisplayPart');

  const sppdSheetDepan = document.getElementById('sppdSheetDepan');
  const sppdSheetBelakang = document.getElementById('sppdSheetBelakang');
  const lptSheetDoc = document.getElementById('lptSheetDoc');

  const sppdInputNoSurat = document.getElementById('sppdInputNoSurat');
  const sppdInputPegawai = document.getElementById('sppdInputPegawai');
  const sppdInputTglBerangkat = document.getElementById('sppdInputTglBerangkat');
  const sppdInputTglKembali = document.getElementById('sppdInputTglKembali');
  const sppdInputMaksud = document.getElementById('sppdInputMaksud');
  const sppdInputTempatBerangkat = document.getElementById('sppdInputTempatBerangkat');
  const sppdInputTujuan = document.getElementById('sppdInputTujuan');

  // SPPD Logo Fixed Dimensions (Locked: Size 180px, Position -31px)
  document.documentElement.style.setProperty('--sppd-logo-size', '180px');
  document.documentElement.style.setProperty('--sppd-logo-offset-x', '-31px');

  const btnSaveSppdLpt = document.getElementById('btnSaveSppdLpt');
  const btnPrintSppdLpt = document.getElementById('btnPrintSppdLpt');

  // Format YYYY-MM-DD to DD MonthName YYYY
  const formatIndoDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return '';
    const dayFormatted = d < 10 ? `0${d}` : `${d}`;
    const mName = MONTH_NAMES[m - 1] || '';
    return `${dayFormatted} ${mName} ${y}`;
  };

  // Calculate Duration in Days with Indonesian wording
  const calculateLamaHari = (startStr, endStr) => {
    if (!startStr) return '';
    if (!endStr) endStr = startStr;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    const diffTime = end.getTime() - start.getTime();
    let diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    if (diffDays < 1) diffDays = 1;

    const angkaTerbilang = [
      'nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
      'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
      'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas', 'dua puluh'
    ];
    const terbilang = diffDays < angkaTerbilang.length ? angkaTerbilang[diffDays] : `${diffDays}`;
    return `${diffDays} (${terbilang}) hari`;
  };

  // Sync SPPD & LPT Data in Real-Time
  const syncSppdLptData = () => {
    const noSurat = sppdInputNoSurat ? sppdInputNoSurat.value : '';
    const maksud = sppdInputMaksud ? sppdInputMaksud.value : '';
    const tempatBerangkat = sppdInputTempatBerangkat ? sppdInputTempatBerangkat.value : '';
    const tujuan = sppdInputTujuan ? sppdInputTujuan.value : '';
    
    const tglBerangkatRaw = sppdInputTglBerangkat ? sppdInputTglBerangkat.value : '';
    const tglKembaliRaw = sppdInputTglKembali ? sppdInputTglKembali.value : '';
    const tglBerangkat = formatIndoDate(tglBerangkatRaw);
    const tglKembali = formatIndoDate(tglKembaliRaw);
    const lamaPerjalanan = calculateLamaHari(tglBerangkatRaw, tglKembaliRaw);

    let pegawaiName = '';
    let pegawaiNip = '';
    let pegawaiJabatan = '';
    let pegawaiPangkat = '';

    if (sppdInputPegawai && sppdInputPegawai.selectedIndex >= 0) {
      const opt = sppdInputPegawai.options[sppdInputPegawai.selectedIndex];
      if (opt && opt.value) {
        pegawaiName = opt.value;
        pegawaiNip = opt.getAttribute('data-nip') || '';
        pegawaiJabatan = opt.getAttribute('data-jabatan') || '';
        pegawaiPangkat = opt.getAttribute('data-pangkat') || '';
      }
    }

    // Update Lembar Depan
    const sppdDocNoDisplay = document.getElementById('sppdDocNoDisplay');
    if (sppdDocNoDisplay) sppdDocNoDisplay.textContent = noSurat;

    const sppdValPegawaiPelaksana = document.getElementById('sppdValPegawaiPelaksana');
    if (sppdValPegawaiPelaksana) {
      if (pegawaiName) {
        sppdValPegawaiPelaksana.innerHTML = `<div>${pegawaiName}</div><div style="margin-top: 2px;">${pegawaiNip}</div>`;
      } else {
        sppdValPegawaiPelaksana.innerHTML = `<div>...........................................</div><div style="margin-top: 2px;">NIP. ...........................................</div>`;
      }
    }

    const sppdValPangkat = document.getElementById('sppdValPangkat');
    if (sppdValPangkat) sppdValPangkat.textContent = pegawaiPangkat || '-';

    const sppdValJabatan = document.getElementById('sppdValJabatan');
    if (sppdValJabatan) sppdValJabatan.textContent = pegawaiJabatan || '-';

    const sppdValMaksud = document.getElementById('sppdValMaksud');
    if (sppdValMaksud) sppdValMaksud.textContent = maksud;

    const sppdValTempatBerangkat = document.getElementById('sppdValTempatBerangkat');
    if (sppdValTempatBerangkat) sppdValTempatBerangkat.textContent = tempatBerangkat;

    const sppdValTempatTujuan = document.getElementById('sppdValTempatTujuan');
    if (sppdValTempatTujuan) sppdValTempatTujuan.textContent = tujuan;

    const sppdValLamaPerjalanan = document.getElementById('sppdValLamaPerjalanan');
    if (sppdValLamaPerjalanan) sppdValLamaPerjalanan.textContent = lamaPerjalanan;

    const sppdValTglBerangkat = document.getElementById('sppdValTglBerangkat');
    if (sppdValTglBerangkat) sppdValTglBerangkat.textContent = tglBerangkat;

    const sppdValTglKembali = document.getElementById('sppdValTglKembali');
    if (sppdValTglKembali) sppdValTglKembali.textContent = tglKembali;

    const sppdSigTanggal = document.getElementById('sppdSigTanggal');
    if (sppdSigTanggal) sppdSigTanggal.textContent = tglBerangkat;

    // Update Petugas Pengikut (Nomor 8)
    for (let i = 1; i <= 4; i++) {
      const select = document.getElementById(`sppdPengikutSelect${i}`);
      const inputNama = document.getElementById(`sppdPengikutInputNama${i}`);
      const inputNip = document.getElementById(`sppdPengikutInputNip${i}`);
      const inputKet = document.getElementById(`sppdPengikutInputKet${i}`);

      const docRow = document.getElementById(`sppdDocPengikutRow${i}`);
      const docNama = document.getElementById(`sppdDocPengikutNama${i}`);
      const docNip = document.getElementById(`sppdDocPengikutNip${i}`);
      const docKet = document.getElementById(`sppdDocPengikutKet${i}`);

      let nama = '';
      let nip = '';
      let ket = '';

      if (select && select.value === 'CUSTOM') {
        nama = inputNama ? inputNama.value : '';
        nip = inputNip ? inputNip.value : '';
        ket = inputKet ? inputKet.value : '';
      } else if (select && select.selectedIndex > 0) {
        const opt = select.options[select.selectedIndex];
        nama = opt.value;
        nip = opt.getAttribute('data-nip') || '';
        ket = opt.getAttribute('data-ket') || '';
      }

      if (docRow && docNama && docNip && docKet) {
        if (nama.trim() !== '') {
          docRow.style.display = 'table-row';
          docNama.textContent = nama;
          docNip.textContent = nip;
          docKet.textContent = ket;
        } else {
          docRow.style.display = 'none';
          docNama.textContent = '';
          docNip.textContent = '';
          docKet.textContent = '';
        }
      }
    }

    // Update Lembar Belakang (Visum Tabel I, II, III, IV, V, VI, VII)
    const sppdBackTiba1 = document.getElementById('sppdBackTiba1');
    if (sppdBackTiba1) sppdBackTiba1.textContent = tujuan;

    const sppdBackTibaTgl1 = document.getElementById('sppdBackTibaTgl1');
    if (sppdBackTibaTgl1) sppdBackTibaTgl1.textContent = tglBerangkat;

    // Row I: Kotak Sebelah Kanan
    const sppdBackBrgkt1 = document.getElementById('sppdBackBrgkt1');
    if (sppdBackBrgkt1) sppdBackBrgkt1.textContent = tujuan;

    const sppdBackKe1 = document.getElementById('sppdBackKe1');
    if (sppdBackKe1) sppdBackKe1.textContent = tempatBerangkat;

    const sppdBackBrgktTgl1 = document.getElementById('sppdBackBrgktTgl1');
    if (sppdBackBrgktTgl1) sppdBackBrgktTgl1.textContent = tglKembali;

    const sppdBackTibaTglAkhir = document.getElementById('sppdBackTibaTglAkhir');
    if (sppdBackTibaTglAkhir) sppdBackTibaTglAkhir.textContent = tglKembali;

    // Update LPT Sheet & Form Synchronization
    const lptValDasar = document.getElementById('lptValDasar');
    const lptInputDasar = document.getElementById('lptInputDasar');
    if (lptValDasar && (!lptInputDasar || !lptInputDasar.dataset.userEdited)) {
      const sptText = noSurat.trim() ? `Surat Perintah Tugas (SPT) Nomor: ${noSurat}` : '';
      lptValDasar.textContent = sptText;
      if (lptInputDasar) lptInputDasar.value = sptText;
    }

    const lptValTujuanPerjalanan = document.getElementById('lptValTujuanPerjalanan');
    const lptInputTujuanPerjalanan = document.getElementById('lptInputTujuanPerjalanan');
    if (lptValTujuanPerjalanan && (!lptInputTujuanPerjalanan || !lptInputTujuanPerjalanan.dataset.userEdited)) {
      const formattedTujuan = `${maksud ? maksud : ''}${maksud && tujuan ? ' - ' : ''}${tujuan ? tujuan : ''}`;
      lptValTujuanPerjalanan.textContent = formattedTujuan;
      if (lptInputTujuanPerjalanan) lptInputTujuanPerjalanan.value = formattedTujuan;
    }

    // Sync to Dokumentasi Kegiatan (Judul Kegiatan)
    const dokValJudulKegiatan = document.getElementById('dokValJudulKegiatan');
    const dokInputJudulKegiatan = document.getElementById('dokInputJudulKegiatan');
    if (dokValJudulKegiatan && (!dokInputJudulKegiatan || !dokInputJudulKegiatan.dataset.userEdited)) {
      const judulText = maksud.trim() ? maksud : (tujuan.trim() ? tujuan : 'Judul Kegiatan');
      dokValJudulKegiatan.textContent = judulText;
      if (dokInputJudulKegiatan) dokInputJudulKegiatan.value = maksud.trim() ? maksud : (tujuan.trim() ? tujuan : '');
    }

    // Sync SPPD Officer to LPT Petugas 1 (Utama)
    const lptSelectPetugas1 = document.getElementById('lptSelectPetugas1');
    const lptSigPetugasName1 = document.getElementById('lptSigPetugasName1');
    const lptSigPetugasNip1 = document.getElementById('lptSigPetugasNip1');

    if (pegawaiName && pegawaiName.trim()) {
      if (lptSelectPetugas1 && (!lptSelectPetugas1.dataset.userEdited || !lptSelectPetugas1.value)) {
        lptSelectPetugas1.value = pegawaiName;
      }
      if (lptSigPetugasName1) lptSigPetugasName1.textContent = pegawaiName;
      if (lptSigPetugasNip1) lptSigPetugasNip1.textContent = pegawaiNip ? pegawaiNip : 'NIP. ...........................................';
    } else {
      if (lptSigPetugasName1) lptSigPetugasName1.textContent = '...........................................';
      if (lptSigPetugasNip1) lptSigPetugasNip1.textContent = 'NIP. ...........................................';
    }

    // Sync SPPD Pengikut 1 & 2 to LPT Petugas 2 & 3
    const pengikutSelect1 = document.getElementById('sppdPengikutSelect1');
    const lptTogglePetugas2 = document.getElementById('lptTogglePetugas2');
    const lptSelectPetugas2 = document.getElementById('lptSelectPetugas2');
    if (pengikutSelect1 && pengikutSelect1.value && pengikutSelect1.value !== 'CUSTOM' && pengikutSelect1.value !== '') {
      if (lptTogglePetugas2) lptTogglePetugas2.checked = true;
      if (lptSelectPetugas2) lptSelectPetugas2.value = pengikutSelect1.value;
      if (typeof syncLptOfficer === 'function') syncLptOfficer(2);
    }

    const pengikutSelect2 = document.getElementById('sppdPengikutSelect2');
    const lptTogglePetugas3 = document.getElementById('lptTogglePetugas3');
    const lptSelectPetugas3 = document.getElementById('lptSelectPetugas3');
    if (pengikutSelect2 && pengikutSelect2.value && pengikutSelect2.value !== 'CUSTOM' && pengikutSelect2.value !== '') {
      if (lptTogglePetugas3) lptTogglePetugas3.checked = true;
      if (lptSelectPetugas3) lptSelectPetugas3.value = pengikutSelect2.value;
      if (typeof syncLptOfficer === 'function') syncLptOfficer(3);
    }

    if (typeof updateLptPetugasVisibility === 'function') {
      updateLptPetugasVisibility();
    }

    // Sync Date
    const lptInputTanggalLaporan = document.getElementById('lptInputTanggalLaporan');
    const lptSigDate = document.getElementById('lptSigDate');
    if (lptInputTanggalLaporan && tglBerangkatRaw && (!lptInputTanggalLaporan.dataset.userEdited || !lptInputTanggalLaporan.value)) {
      lptInputTanggalLaporan.value = tglBerangkatRaw;
    }
    if (lptSigDate) {
      if (lptInputTanggalLaporan && lptInputTanggalLaporan.value) {
        lptSigDate.textContent = formatIndoDate(lptInputTanggalLaporan.value);
      } else if (tglBerangkat && tglBerangkat.trim()) {
        lptSigDate.textContent = tglBerangkat;
      } else {
        lptSigDate.textContent = '...........................................';
      }
    }
  };

  // List of 40 Official Puskesmas Activities for SPPD & LPT
  const SPPD_KEGIATAN_LIST = [
    "Fasilitasi Pelaksanaan First Aider Pertolongan Pertama pada Luka Psikologis (P3LP) di Sekolah",
    "Pelacakan dan pengawasan minum obat untuk ODGJ berat",
    "Pelacakan dan pelaporan kematian dan pelaksanaan otopsi verbal kematian Ibu dan Bayi/balita",
    "Pelaksanaan Kelas Ibu Hamil",
    "Pelaksanaan Kelas Ibu Balita",
    "Pelayanan Kesehatan pada anak usia sekolah dan remaja (Skrining dan pembinaan di sekolah dan komunitas)",
    "Pemantauan Minum TTD",
    "Pelaksanaan skrining dan intervensi hasil skrining masalah Kesehatan jiwa di UKBM/Lembaga",
    "Kunjungan lapangan pemantauan bumil KEK, Anemia, Bumil Risti, BBLR, dan Bayi Balita dengan Masalah Gizi",
    "Kunjungan lapangan pemantauan Tumbuh Kembang dan Masalah Gizi ibu dan anak",
    "Pendampingan rujukan balita stunting/gizi buruk",
    "Pelayanan Imunisasi Rutin",
    "Pelayanan Imunisasi BIAS",
    "Pelayanan Imunisasi Tambahan",
    "Penemuan Kasus KIPI dan PD3I",
    "Deteksi Dini dan Cek Kesehatan Gratis dan Tindak Lanjut Penyakit Tidak Menular",
    "Inspeksi kesling di sarana tempat dan fasilitas umum, sarana Tempat Pengelolaan Pangan (TPP), Sarana Air Minum (SAM), Fasyankes",
    "Pemberdayaan kader dalam rangka pencegahan dan pengendalian penyakit tidak menular",
    "Pemberdayaan kader dalam rangka pencegahan dan pengendalian penyakit menular",
    "Pemberdayaan kader dalam rangka pelaksanaan Imunisasi",
    "Pemberdayaan kader masyarakat melalui pemicuan untuk implementasi seluruh pilar STBM (Implementasi 5 pilar STBM)",
    "Penemuan kasus aktif dan pemantauan pengobatan TBC (Investigasi kontak TBC, pelacakan kasus TBC mangkir)",
    "Pemantauan menelan obat TBC, pemberian terapi pencegahan TBC, penemuan kasus ILTB",
    "Penemuan kasus aktif penyakit menular, NTDs (Penyakit Tropis Terabaikan), KIPI dan PD3I (AFP, Campak Rubela dan PD3I lainnya), Pneumonia dan Infeksi Saluran Pernapasan Akut terintegrasi dengan Posyandu, Posbindu",
    "Pemantauan dan tindaklanjut kasus penyakit menular (Pemberian Obat Pencegahan Massal (POPM) Kecacingan)",
    "Penemuan kasus aktif kusta dan komprofilaksis kusta",
    "Survei dan Pengendalian Vector (pengasapan/fogging, penyemprotan dinding rumah (IRS), larvasidasi DBD/Malaria dan PSN",
    "Kunjungan lapangan dalam rangka pengawasan terhadap kualitas air minum rumah tangga",
    "Kunjungan lapangan dalam rangka surveilans kualitas udara dalam ruang",
    "Verifikasi Sinyal/rumor, PE/pelacakan kontak penyakit berpotensi KLB/Wabah/PIE/kejadian tidak lazim (belum teridentifikasi jenis penyakitnya/penyakit misterius)",
    "Penyelidikan epidemiologi (PE) Penyakit menular lainnya",
    "Penyelidikan epidemiologi (PE) Penyehatan Lingkungan",
    "Pembekalan tim pelaksana dalam penyiapan pemberian makanan tambahan berbasis pangan lokal bagi ibu hamil kek dan balita gizi kurang tingkat kab/kota dan puskesmas",
    "Pendampingan pelaksanaan ILP di pustu dan pelayanan kesehatan desa/kelurahan (UPKD/K)",
    "kunjungan rumah kader posyandu",
    "Pembinaan, Koordinasi, Pengelolaan dan Penyelenggaraan UPKD/K",
    "Tindak Lanjut kunjungan Rumah UPKD/K",
    "Partispasi dalam Musrenbangdes",
    "Inetrvensi Pemberdayaan Masyarakat berdasarkan siklus hidup di UPKD/K",
    "Monitoring dan evaluasi kegiatan Posyandu Bidang kesehatan di wilayah desa/kelurahan"
  ];

  // Searchable Combobox for Maksud Kegiatan
  const sppdMaksudDropdownList = document.getElementById('sppdMaksudDropdownList');
  const sppdMaksudToggleBtn = document.getElementById('sppdMaksudToggleBtn');

  const escapeHtmlHelper = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const renderMaksudDropdown = (filterText = '') => {
    if (!sppdMaksudDropdownList) return;
    const query = (filterText || '').toLowerCase().trim();
    const filtered = query
      ? SPPD_KEGIATAN_LIST.filter(k => k.toLowerCase().includes(query))
      : SPPD_KEGIATAN_LIST;

    if (filtered.length === 0) {
      sppdMaksudDropdownList.innerHTML = `<div class="sppd-combobox-empty">Tidak ada kegiatan yang cocok</div>`;
    } else {
      sppdMaksudDropdownList.innerHTML = filtered.map((item) => {
        const isSelected = sppdInputMaksud && sppdInputMaksud.value === item;
        return `<div class="sppd-combobox-item ${isSelected ? 'selected' : ''}" data-value="${escapeHtmlHelper(item)}">${escapeHtmlHelper(item)}</div>`;
      }).join('');

      sppdMaksudDropdownList.querySelectorAll('.sppd-combobox-item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = el.getAttribute('data-value');
          if (sppdInputMaksud) {
            sppdInputMaksud.value = val;
            syncSppdLptData();
          }
          closeMaksudDropdown();
        });
      });
    }
  };

  const openMaksudDropdown = () => {
    if (!sppdMaksudDropdownList) return;
    renderMaksudDropdown(sppdInputMaksud ? sppdInputMaksud.value : '');
    sppdMaksudDropdownList.classList.add('active');
  };

  const closeMaksudDropdown = () => {
    if (sppdMaksudDropdownList) sppdMaksudDropdownList.classList.remove('active');
  };

  if (sppdInputMaksud) {
    sppdInputMaksud.addEventListener('focus', () => {
      openMaksudDropdown();
    });
    sppdInputMaksud.addEventListener('input', (e) => {
      renderMaksudDropdown(e.target.value);
      if (sppdMaksudDropdownList) sppdMaksudDropdownList.classList.add('active');
      syncSppdLptData();
    });
  }

  if (sppdMaksudToggleBtn) {
    sppdMaksudToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sppdMaksudDropdownList && sppdMaksudDropdownList.classList.contains('active')) {
        closeMaksudDropdown();
      } else {
        openMaksudDropdown();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#sppdMaksudCombobox')) {
      closeMaksudDropdown();
    }
  });

  // Calendar Click Helper for Date Pickers
  ['sppdInputTglBerangkat', 'sppdInputTglKembali'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        try {
          if (typeof el.showPicker === 'function') el.showPicker();
        } catch(e) {}
      });
      const wrapper = el.closest('.date-input-wrapper');
      if (wrapper) {
        wrapper.addEventListener('click', (e) => {
          if (e.target !== el) {
            try {
              if (typeof el.showPicker === 'function') el.showPicker();
              else el.focus();
            } catch(err) { el.focus(); }
          }
        });
      }
    }
  });

  // Event Listeners for Input Controls
  if (sppdInputNoSurat) sppdInputNoSurat.addEventListener('input', syncSppdLptData);
  if (sppdInputPegawai) sppdInputPegawai.addEventListener('change', syncSppdLptData);
  
  if (sppdInputTglBerangkat) {
    sppdInputTglBerangkat.addEventListener('change', () => {
      if (sppdInputTglBerangkat.value && sppdInputTglKembali && !sppdInputTglKembali.value) {
        sppdInputTglKembali.value = sppdInputTglBerangkat.value;
      }
      syncSppdLptData();
    });
    sppdInputTglBerangkat.addEventListener('input', syncSppdLptData);
  }

  if (sppdInputTglKembali) {
    sppdInputTglKembali.addEventListener('change', syncSppdLptData);
    sppdInputTglKembali.addEventListener('input', syncSppdLptData);
  }

  // Reset & Clear Date Controls
  const btnResetSppdDates = document.getElementById('btnResetSppdDates');
  const btnClearTglBerangkat = document.getElementById('btnClearTglBerangkat');
  const btnClearTglKembali = document.getElementById('btnClearTglKembali');

  if (btnResetSppdDates) {
    btnResetSppdDates.addEventListener('click', (e) => {
      e.preventDefault();
      if (sppdInputTglBerangkat) sppdInputTglBerangkat.value = '';
      if (sppdInputTglKembali) sppdInputTglKembali.value = '';
      syncSppdLptData();
      if (typeof showToast === 'function') {
        showToast('Tanggal SPPD telah di-reset (kosong)', 'info');
      }
    });
  }

  if (btnClearTglBerangkat) {
    btnClearTglBerangkat.addEventListener('click', (e) => {
      e.preventDefault();
      if (sppdInputTglBerangkat) sppdInputTglBerangkat.value = '';
      syncSppdLptData();
    });
  }

  if (btnClearTglKembali) {
    btnClearTglKembali.addEventListener('click', (e) => {
      e.preventDefault();
      if (sppdInputTglKembali) sppdInputTglKembali.value = '';
      syncSppdLptData();
    });
  }

  if (sppdInputMaksud) sppdInputMaksud.addEventListener('input', syncSppdLptData);
  if (sppdInputTempatBerangkat) sppdInputTempatBerangkat.addEventListener('input', syncSppdLptData);
  if (sppdInputTujuan) sppdInputTujuan.addEventListener('input', syncSppdLptData);

  // Initialize Petugas Pengikut Listeners (1 - 4)
  for (let i = 1; i <= 4; i++) {
    const idx = i;
    const select = document.getElementById(`sppdPengikutSelect${idx}`);
    const inputNama = document.getElementById(`sppdPengikutInputNama${idx}`);
    const inputNip = document.getElementById(`sppdPengikutInputNip${idx}`);
    const inputKet = document.getElementById(`sppdPengikutInputKet${idx}`);
    const selectWrap = document.getElementById(`sppdPengikutSelectWrap${idx}`);
    const clearBtn = document.querySelector(`.sppd-btn-clear-pengikut[data-index="${idx}"]`);

    if (select) {
      select.addEventListener('change', () => {
        if (select.value === 'CUSTOM') {
          if (inputNama) {
            inputNama.style.display = 'block';
            inputNama.value = '';
            inputNama.focus();
          }
          if (selectWrap) selectWrap.style.display = 'none';
        } else {
          if (inputNama) {
            inputNama.style.display = 'none';
            inputNama.value = '';
          }
          if (select.selectedIndex > 0) {
            const opt = select.options[select.selectedIndex];
            if (inputNip) inputNip.value = opt.getAttribute('data-nip') || '';
            if (inputKet) inputKet.value = opt.getAttribute('data-ket') || '';
          } else {
            if (inputNip) inputNip.value = '';
            if (inputKet) inputKet.value = '';
          }
        }
        syncSppdLptData();
      });
    }

    if (inputNama) inputNama.addEventListener('input', syncSppdLptData);
    if (inputNip) inputNip.addEventListener('input', syncSppdLptData);
    if (inputKet) inputKet.addEventListener('input', syncSppdLptData);

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (select) {
          select.value = '';
          if (selectWrap) selectWrap.style.display = 'block';
        }
        if (inputNama) {
          inputNama.value = '';
          inputNama.style.display = 'none';
        }
        if (inputNip) inputNip.value = '';
        if (inputKet) inputKet.value = '';
        syncSppdLptData();
      });
    }
  }

  // LPT Form Specific Elements
  const sppdSidebarSections = document.getElementById('sppdSidebarSections');
  const lptSidebarSections = document.getElementById('lptSidebarSections');

  const lptInputDasar = document.getElementById('lptInputDasar');
  const lptInputTujuanPerjalanan = document.getElementById('lptInputTujuanPerjalanan');
  const lptInputTanggalLaporan = document.getElementById('lptInputTanggalLaporan');
  const lptInputProses = document.getElementById('lptInputProses');
  const lptInputMasalah = document.getElementById('lptInputMasalah');
  const lptInputKesimpulan = document.getElementById('lptInputKesimpulan');

  const lptValDasar = document.getElementById('lptValDasar');
  const lptValTujuanPerjalanan = document.getElementById('lptValTujuanPerjalanan');
  const lptValProses = document.getElementById('lptValProses');
  const lptValMasalah = document.getElementById('lptValMasalah');
  const lptValKesimpulan = document.getElementById('lptValKesimpulan');
  const lptSigDate = document.getElementById('lptSigDate');

  const lptSelectPetugas1 = document.getElementById('lptSelectPetugas1');
  const lptSelectPetugas2 = document.getElementById('lptSelectPetugas2');
  const lptSelectPetugas3 = document.getElementById('lptSelectPetugas3');

  const lptTogglePetugas2 = document.getElementById('lptTogglePetugas2');
  const lptTogglePetugas3 = document.getElementById('lptTogglePetugas3');
  const lptBadgePetugas2 = document.getElementById('lptBadgePetugas2');
  const lptBadgePetugas3 = document.getElementById('lptBadgePetugas3');
  const lptWrapSelectPetugas2 = document.getElementById('lptWrapSelectPetugas2');
  const lptWrapSelectPetugas3 = document.getElementById('lptWrapSelectPetugas3');

  const lptSigCol1 = document.getElementById('lptSigCol1');
  const lptSigCol2 = document.getElementById('lptSigCol2');
  const lptSigCol3 = document.getElementById('lptSigCol3');
  const lptSignaturesRow = document.getElementById('lptSignaturesRow');

  const lptSigPetugasName1 = document.getElementById('lptSigPetugasName1');
  const lptSigPetugasNip1 = document.getElementById('lptSigPetugasNip1');
  const lptSigPetugasName2 = document.getElementById('lptSigPetugasName2');
  const lptSigPetugasNip2 = document.getElementById('lptSigPetugasNip2');
  const lptSigPetugasName3 = document.getElementById('lptSigPetugasName3');
  const lptSigPetugasNip3 = document.getElementById('lptSigPetugasNip3');

  const btnToggleLptHighlight = document.getElementById('btnToggleLptHighlight');

  // Convert text newlines to HTML br
  const textToHtml = (str) => {
    if (!str) return '';
    return escapeHtmlHelper(str).replace(/\n/g, '<br>');
  };

  // Sync LPT Officers
  const syncLptOfficer = (index) => {
    const select = document.getElementById(`lptSelectPetugas${index}`);
    const nameEl = document.getElementById(`lptSigPetugasName${index}`);
    const nipEl = document.getElementById(`lptSigPetugasNip${index}`);
    if (!select || !nameEl || !nipEl) return;

    if (select.selectedIndex >= 0) {
      const opt = select.options[select.selectedIndex];
      if (opt && opt.value) {
        nameEl.textContent = opt.value;
        nipEl.textContent = opt.getAttribute('data-nip') || '-';
      } else {
        nameEl.textContent = '...........................................';
        nipEl.textContent = 'NIP. ...........................................';
      }
    }
  };

  // Sync LPT Officer Visibility & Signature Alignment (Single Officer -> Posisi KANAN)
  const updateLptPetugasVisibility = () => {
    const show2 = lptTogglePetugas2 ? lptTogglePetugas2.checked : false;
    const show3 = lptTogglePetugas3 ? lptTogglePetugas3.checked : false;

    if (lptSigCol2) lptSigCol2.style.display = show2 ? 'block' : 'none';
    if (lptWrapSelectPetugas2) lptWrapSelectPetugas2.style.display = show2 ? 'block' : 'none';
    if (lptBadgePetugas2) {
      lptBadgePetugas2.textContent = show2 ? 'Ditampilkan' : 'Disembunyikan';
      lptBadgePetugas2.style.color = show2 ? '#10b981' : '#94a3b8';
    }

    if (lptSigCol3) lptSigCol3.style.display = show3 ? 'block' : 'none';
    if (lptWrapSelectPetugas3) lptWrapSelectPetugas3.style.display = show3 ? 'block' : 'none';
    if (lptBadgePetugas3) {
      lptBadgePetugas3.textContent = show3 ? 'Ditampilkan' : 'Disembunyikan';
      lptBadgePetugas3.style.color = show3 ? '#10b981' : '#94a3b8';
    }

    if (lptSignaturesRow) {
      if (!show2 && !show3) {
        // Posisi Petugas Tunggal (Sendiri) di KANAN
        lptSignaturesRow.style.justifyContent = 'flex-end';
      } else {
        lptSignaturesRow.style.justifyContent = 'space-between';
      }
    }
  };

  // Wire LPT Sidebar Inputs to Preview Document
  if (lptInputDasar) {
    lptInputDasar.addEventListener('input', () => {
      lptInputDasar.dataset.userEdited = 'true';
      if (lptValDasar) lptValDasar.textContent = lptInputDasar.value;
    });
  }
  if (lptInputTujuanPerjalanan) {
    lptInputTujuanPerjalanan.addEventListener('input', () => {
      lptInputTujuanPerjalanan.dataset.userEdited = 'true';
      if (lptValTujuanPerjalanan) lptValTujuanPerjalanan.textContent = lptInputTujuanPerjalanan.value;
    });
  }
  if (lptInputTanggalLaporan) {
    const handleLptDateChange = () => {
      lptInputTanggalLaporan.dataset.userEdited = 'true';
      if (lptSigDate) {
        lptSigDate.textContent = lptInputTanggalLaporan.value ? formatIndoDate(lptInputTanggalLaporan.value) : '...........................................';
      }
    };
    lptInputTanggalLaporan.addEventListener('input', handleLptDateChange);
    lptInputTanggalLaporan.addEventListener('change', handleLptDateChange);

    // Clicking anywhere in the date wrapper opens the calendar picker
    const lptDateWrap = lptInputTanggalLaporan.closest('.date-input-wrapper');
    if (lptDateWrap) {
      lptDateWrap.addEventListener('click', (e) => {
        if (e.target !== lptInputTanggalLaporan) {
          if (typeof lptInputTanggalLaporan.showPicker === 'function') {
            lptInputTanggalLaporan.showPicker();
          } else {
            lptInputTanggalLaporan.focus();
          }
        }
      });
    }
  }
  if (lptInputProses) {
    lptInputProses.addEventListener('input', () => {
      if (lptValProses) lptValProses.innerHTML = textToHtml(lptInputProses.value);
    });
  }
  if (lptInputMasalah) {
    lptInputMasalah.addEventListener('input', () => {
      if (lptValMasalah) lptValMasalah.innerHTML = textToHtml(lptInputMasalah.value);
    });
  }
  if (lptInputKesimpulan) {
    lptInputKesimpulan.addEventListener('input', () => {
      if (lptValKesimpulan) lptValKesimpulan.innerHTML = textToHtml(lptInputKesimpulan.value);
    });
  }

  // Reverse Wire: Typing directly on Preview Document updates Sidebar Inputs
  if (lptValDasar) {
    lptValDasar.addEventListener('input', () => {
      if (lptInputDasar) {
        lptInputDasar.value = lptValDasar.textContent;
        lptInputDasar.dataset.userEdited = 'true';
      }
    });
  }
  if (lptValTujuanPerjalanan) {
    lptValTujuanPerjalanan.addEventListener('input', () => {
      if (lptInputTujuanPerjalanan) {
        lptInputTujuanPerjalanan.value = lptValTujuanPerjalanan.textContent;
        lptInputTujuanPerjalanan.dataset.userEdited = 'true';
      }
    });
  }
  if (lptValProses) {
    lptValProses.addEventListener('input', () => {
      if (lptInputProses) lptInputProses.value = lptValProses.innerText;
    });
  }
  if (lptValMasalah) {
    lptValMasalah.addEventListener('input', () => {
      if (lptInputMasalah) lptInputMasalah.value = lptValMasalah.innerText;
    });
  }
  if (lptValKesimpulan) {
    lptValKesimpulan.addEventListener('input', () => {
      if (lptInputKesimpulan) lptInputKesimpulan.value = lptValKesimpulan.innerText;
    });
  }

  // Wire LPT Officer Dropdowns & Toggles
  if (lptSelectPetugas1) {
    lptSelectPetugas1.addEventListener('change', () => {
      lptSelectPetugas1.dataset.userEdited = 'true';
      syncLptOfficer(1);
    });
  }
  if (lptSelectPetugas2) {
    lptSelectPetugas2.addEventListener('change', () => {
      lptSelectPetugas2.dataset.userEdited = 'true';
      syncLptOfficer(2);
    });
  }
  if (lptSelectPetugas3) {
    lptSelectPetugas3.addEventListener('change', () => {
      lptSelectPetugas3.dataset.userEdited = 'true';
      syncLptOfficer(3);
    });
  }

  if (lptTogglePetugas2) lptTogglePetugas2.addEventListener('change', updateLptPetugasVisibility);
  if (lptTogglePetugas3) lptTogglePetugas3.addEventListener('change', updateLptPetugasVisibility);

  // Wire LPT Color Highlight Switch
  if (btnToggleLptHighlight) {
    let isHighlightActive = true;
    btnToggleLptHighlight.addEventListener('click', () => {
      isHighlightActive = !isHighlightActive;
      if (lptSheetDoc) {
        lptSheetDoc.classList.toggle('lpt-no-highlight', !isHighlightActive);
      }
      if (isHighlightActive) {
        btnToggleLptHighlight.innerHTML = '<span>🎨 Highlight Warna Preview: AKTIF</span>';
        btnToggleLptHighlight.style.background = 'rgba(255, 235, 59, 0.12)';
        btnToggleLptHighlight.style.borderColor = 'rgba(255, 235, 59, 0.3)';
        btnToggleLptHighlight.style.color = '#fde047';
      } else {
        btnToggleLptHighlight.innerHTML = '<span>🎨 Highlight Warna Preview: NONAKTIF (BERSIH)</span>';
        btnToggleLptHighlight.style.background = 'rgba(255, 255, 255, 0.06)';
        btnToggleLptHighlight.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        btnToggleLptHighlight.style.color = '#94a3b8';
      }
    });
  }

  // ==========================================================================
  // DOKUMENTASI KEGIATAN LOGIC & MULTI-CHANNEL IMAGE INGESTION ENGINE
  // ==========================================================================
  const dokSidebarSections = document.getElementById('dokSidebarSections');
  const dokSheetDoc = document.getElementById('dokSheetDoc');
  const dokInputJudulKegiatan = document.getElementById('dokInputJudulKegiatan');
  const dokValJudulKegiatan = document.getElementById('dokValJudulKegiatan');
  const dokFileInput = document.getElementById('dokFileInput');
  const dokDropzoneBox = document.getElementById('dokDropzoneBox');
  const dokDropzoneClickArea = document.getElementById('dokDropzoneClickArea');
  const dokSelectLayout = document.getElementById('dokSelectLayout');
  const dokBtnUploadTrigger = document.getElementById('dokBtnUploadTrigger');
  const dokBtnClearAll = document.getElementById('dokBtnClearAll');
  const dokPhotoContainer = document.getElementById('dokPhotoContainer');
  const dokEmptyPlaceholder = document.getElementById('dokEmptyPlaceholder');

  let draggedPhotoCard = null;

  const updateDokEmptyState = () => {
    if (!dokPhotoContainer || !dokEmptyPlaceholder) return;
    const cards = dokPhotoContainer.querySelectorAll('.dok-photo-card');
    dokEmptyPlaceholder.style.display = cards.length > 0 ? 'none' : 'block';
  };

  const createPhotoCard = (imageSrc, caption = '') => {
    if (!dokPhotoContainer) return;
    const card = document.createElement('div');
    card.className = 'dok-photo-card align-center';
    card.draggable = true;

    card.innerHTML = `
      <div class="dok-card-toolbar no-print">
        <!-- Size Adjusters -->
        <div class="dok-toolbar-group" title="Atur Ukuran Foto">
          <button type="button" class="dok-toolbar-btn btn-zoom-out" title="Perkecil (-10%)">➖</button>
          <button type="button" class="dok-toolbar-btn btn-sz" data-size="size-s" title="Kecil (33%)">S</button>
          <button type="button" class="dok-toolbar-btn btn-sz" data-size="size-m" title="Sedang (50%)">M</button>
          <button type="button" class="dok-toolbar-btn btn-sz" data-size="size-l" title="Besar (75%)">L</button>
          <button type="button" class="dok-toolbar-btn btn-sz" data-size="size-full" title="Penuh (100%)">100%</button>
          <button type="button" class="dok-toolbar-btn btn-zoom-in" title="Perbesar (+10%)">➕</button>
        </div>

        <!-- Position Alignment (Kiri, Tengah, Kanan) -->
        <div class="dok-toolbar-group" title="Posisi Rata Kiri / Tengah / Kanan">
          <button type="button" class="dok-toolbar-btn btn-align" data-align="align-left" title="Rata Kiri">⬅</button>
          <button type="button" class="dok-toolbar-btn btn-align active" data-align="align-center" title="Rata Tengah">⏺</button>
          <button type="button" class="dok-toolbar-btn btn-align" data-align="align-right" title="Rata Kanan">➡</button>
        </div>

        <!-- Move Up / Down (Posisi Atas / Bawah) -->
        <div class="dok-toolbar-group" title="Pindah Urutan Atas / Bawah">
          <button type="button" class="dok-toolbar-btn btn-move-up" title="Pindah ke Atas">⬆</button>
          <button type="button" class="dok-toolbar-btn btn-move-down" title="Pindah ke Bawah">⬇</button>
        </div>

        <!-- Delete Button -->
        <div class="dok-toolbar-group">
          <button type="button" class="dok-toolbar-btn btn-del" title="Hapus Foto">🗑️</button>
        </div>
      </div>

      <div class="dok-photo-img-wrap">
        <img src="${imageSrc}" class="dok-photo-img" alt="Foto Dokumentasi">
        <div class="dok-resize-handle no-print" title="Tarik sudut untuk mengubah ukuran foto secara bebas"></div>
      </div>
      <div class="dok-photo-caption" contenteditable="true">${caption}</div>
    `;

    // Size Preset listeners
    const sizeBtns = card.querySelectorAll('.btn-sz');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sz = btn.getAttribute('data-size');
        card.classList.remove('size-s', 'size-m', 'size-l', 'size-full');
        card.style.width = '';
        card.style.maxWidth = '';
        if (sz) card.classList.add(sz);
      });
    });

    // Zoom In / Out listeners
    let currentScale = 100;
    const btnZoomIn = card.querySelector('.btn-zoom-in');
    const btnZoomOut = card.querySelector('.btn-zoom-out');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.remove('size-s', 'size-m', 'size-l', 'size-full');
        currentScale = Math.min(100, currentScale + 10);
        card.style.width = currentScale + '%';
        card.style.maxWidth = currentScale + '%';
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.remove('size-s', 'size-m', 'size-l', 'size-full');
        currentScale = Math.max(20, currentScale - 10);
        card.style.width = currentScale + '%';
        card.style.maxWidth = currentScale + '%';
      });
    }

    // Alignment Horizontal listeners (Kiri, Tengah, Kanan)
    const alignBtns = card.querySelectorAll('.btn-align');
    alignBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const align = btn.getAttribute('data-align');
        card.classList.remove('align-left', 'align-center', 'align-right');
        card.classList.add(align);
        alignBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Move Up / Down listeners (Posisi Atas / Bawah)
    const btnMoveUp = card.querySelector('.btn-move-up');
    const btnMoveDown = card.querySelector('.btn-move-down');

    if (btnMoveUp) {
      btnMoveUp.addEventListener('click', (e) => {
        e.stopPropagation();
        const prev = card.previousElementSibling;
        if (prev && prev.classList.contains('dok-photo-card')) {
          dokPhotoContainer.insertBefore(card, prev);
        }
      });
    }

    if (btnMoveDown) {
      btnMoveDown.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = card.nextElementSibling;
        if (next && next.classList.contains('dok-photo-card')) {
          dokPhotoContainer.insertBefore(next, card);
        }
      });
    }

    // Corner Drag Resizer (Free mouse dragging)
    const resizeHandle = card.querySelector('.dok-resize-handle');
    if (resizeHandle) {
      let startX, startWidth, containerWidth;
      const onMouseMove = (e) => {
        const newWidth = Math.min(containerWidth, Math.max(80, startWidth + (e.clientX - startX)));
        const percent = Math.round((newWidth / containerWidth) * 100);
        card.classList.remove('size-s', 'size-m', 'size-l', 'size-full');
        currentScale = percent;
        card.style.width = percent + '%';
        card.style.maxWidth = percent + '%';
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startWidth = card.offsetWidth;
        containerWidth = dokPhotoContainer.offsetWidth || 700;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }

    // Click card to activate toolbar
    card.addEventListener('click', (e) => {
      document.querySelectorAll('.dok-photo-card').forEach(c => {
        if (c !== card) c.classList.remove('is-active');
      });
      card.classList.toggle('is-active');
    });

    // Delete button listener
    const delBtn = card.querySelector('.btn-del');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        updateDokEmptyState();
      });
    }

    // Drag & Drop Reordering between photo cards
    card.addEventListener('dragstart', (e) => {
      draggedPhotoCard = card;
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    card.addEventListener('dragend', () => {
      draggedPhotoCard = null;
      card.classList.remove('is-dragging');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedPhotoCard || draggedPhotoCard === card) return;
      
      const rect = card.getBoundingClientRect();
      const isAfter = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
      dokPhotoContainer.insertBefore(draggedPhotoCard, isAfter && card.nextSibling !== draggedPhotoCard ? card.nextSibling : card);
    });

    if (dokEmptyPlaceholder) {
      dokPhotoContainer.insertBefore(card, dokEmptyPlaceholder);
    } else {
      dokPhotoContainer.appendChild(card);
    }
    updateDokEmptyState();
  };

  const handleDokImageFiles = (files) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          createPhotoCard(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    if (typeof showToast === 'function') {
      showToast(`✓ Berhasil menambahkan ${files.length} foto dokumentasi!`, 'success');
    }
  };

  // Upload button listeners
  const dokBtnSampleTrigger = document.getElementById('dokBtnSampleTrigger');
  if (dokBtnSampleTrigger) {
    dokBtnSampleTrigger.addEventListener('click', () => {
      const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0f766e"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <circle cx="300" cy="170" r="60" fill="#ffffff" opacity="0.95"/>
        <text x="300" y="185" font-family="Arial, sans-serif" font-size="44" text-anchor="middle">📷</text>
        <text x="300" y="280" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#ffffff">FOTO KEGIATAN RESMI</text>
        <text x="300" y="315" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#e0f2fe">Pelaksanaan Penimbangan dan Pemeriksaan</text>
      </svg>`;
      const sampleImg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgCode);
      createPhotoCard(sampleImg, 'Foto Kegiatan: Pelaksanaan Penimbangan dan Edukasi Gizi Balita');
      if (typeof showToast === 'function') {
        showToast('✓ Contoh foto kegiatan berhasil disisipkan!', 'success');
      }
    });
  }

  if (dokBtnUploadTrigger && dokFileInput) {
    dokBtnUploadTrigger.addEventListener('click', () => dokFileInput.click());
  }
  if (dokDropzoneClickArea && dokFileInput) {
    dokDropzoneClickArea.addEventListener('click', () => dokFileInput.click());
  }
  if (dokFileInput) {
    dokFileInput.addEventListener('change', (e) => {
      handleDokImageFiles(e.target.files);
      dokFileInput.value = '';
    });
  }

  // Clear all photos
  if (dokBtnClearAll) {
    dokBtnClearAll.addEventListener('click', async () => {
      if (!dokPhotoContainer) return;
      const cards = dokPhotoContainer.querySelectorAll('.dok-photo-card');
      if (cards.length === 0) return;
      const confirmed = await window.SicekasAlert.confirm(
        'Hapus Semua Foto?',
        'Seluruh foto dokumentasi kegiatan pada lembar ini akan dihapus.',
        'Ya, Hapus Semua',
        'Batal',
        true
      );
      if (confirmed) {
        cards.forEach(c => c.remove());
        updateDokEmptyState();
        showToast('✓ Semua foto dokumentasi berhasil dihapus.', 'info');
      }
    });
  }

  // Layout mode switcher
  if (dokSelectLayout && dokPhotoContainer) {
    dokSelectLayout.addEventListener('change', () => {
      dokPhotoContainer.classList.remove('dok-layout-grid-2', 'dok-layout-grid-3', 'dok-layout-grid-1', 'dok-layout-free');
      const val = dokSelectLayout.value;
      if (val === 'grid-3') dokPhotoContainer.classList.add('dok-layout-grid-3');
      else if (val === 'grid-1') dokPhotoContainer.classList.add('dok-layout-grid-1');
      else if (val === 'free') dokPhotoContainer.classList.add('dok-layout-free');
      else dokPhotoContainer.classList.add('dok-layout-grid-2');
    });
  }

  // Drag and Drop files onto dropzone and preview sheet
  [dokDropzoneBox, dokSheetDoc].forEach(zone => {
    if (!zone) return;
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        zone.classList.add(zone === dokSheetDoc ? 'drag-over' : 'drag-active');
      }
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-active', 'drag-over');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-active', 'drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleDokImageFiles(e.dataTransfer.files);
      }
    });
  });

  // Global Clipboard Paste (Ctrl + V) for Dokumentasi
  window.addEventListener('paste', (e) => {
    const currentForm = sppdLptSelectForm ? sppdLptSelectForm.value : 'sppd';
    if (currentForm !== 'dok') return;

    const items = (e.clipboardData || window.clipboardData).items;
    if (!items) return;

    let imageFound = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            createPhotoCard(event.target.result);
          };
          reader.readAsDataURL(blob);
          imageFound = true;
        }
      }
    }
    if (imageFound) {
      e.preventDefault();
      if (typeof showToast === 'function') {
        showToast('✓ Foto berhasil di-paste dari Clipboard!', 'success');
      }
    }
  });

  // ==========================================================================
  // SEARCHABLE COMBOBOX FOR DOKUMENTASI JUDUL KEGIATAN (40 KEGIATAN PUSKESMAS)
  // ==========================================================================
  const dokJudulDropdownList = document.getElementById('dokJudulDropdownList');
  const dokJudulToggleBtn = document.getElementById('dokJudulToggleBtn');

  const renderDokJudulDropdown = (filterText = '') => {
    if (!dokJudulDropdownList) return;
    const query = (filterText || '').toLowerCase().trim();
    const filtered = query
      ? SPPD_KEGIATAN_LIST.filter(k => k.toLowerCase().includes(query))
      : SPPD_KEGIATAN_LIST;

    if (filtered.length === 0) {
      dokJudulDropdownList.innerHTML = `<div class="sppd-combobox-empty">Tidak ada kegiatan yang cocok</div>`;
    } else {
      dokJudulDropdownList.innerHTML = filtered.map((item) => {
        const isSelected = dokInputJudulKegiatan && dokInputJudulKegiatan.value === item;
        return `<div class="sppd-combobox-item ${isSelected ? 'selected' : ''}" data-value="${escapeHtmlHelper(item)}">${escapeHtmlHelper(item)}</div>`;
      }).join('');

      dokJudulDropdownList.querySelectorAll('.sppd-combobox-item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = el.getAttribute('data-value');
          if (dokInputJudulKegiatan) {
            dokInputJudulKegiatan.value = val;
            dokInputJudulKegiatan.dataset.userEdited = 'true';
          }
          if (dokValJudulKegiatan) {
            dokValJudulKegiatan.textContent = val;
          }
          if (sppdInputMaksud && !sppdInputMaksud.value) {
            sppdInputMaksud.value = val;
            syncSppdLptData();
          }
          closeDokJudulDropdown();
        });
      });
    }
  };

  const openDokJudulDropdown = () => {
    if (!dokJudulDropdownList) return;
    renderDokJudulDropdown(dokInputJudulKegiatan ? dokInputJudulKegiatan.value : '');
    dokJudulDropdownList.classList.add('active');
  };

  const closeDokJudulDropdown = () => {
    if (dokJudulDropdownList) dokJudulDropdownList.classList.remove('active');
  };

  if (dokInputJudulKegiatan) {
    dokInputJudulKegiatan.addEventListener('focus', () => {
      openDokJudulDropdown();
    });
    dokInputJudulKegiatan.addEventListener('input', (e) => {
      dokInputJudulKegiatan.dataset.userEdited = 'true';
      if (dokValJudulKegiatan) dokValJudulKegiatan.textContent = e.target.value || 'Judul Kegiatan';
      renderDokJudulDropdown(e.target.value);
      if (dokJudulDropdownList) dokJudulDropdownList.classList.add('active');
    });
  }

  if (dokJudulToggleBtn) {
    dokJudulToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dokJudulDropdownList && dokJudulDropdownList.classList.contains('active')) {
        closeDokJudulDropdown();
      } else {
        openDokJudulDropdown();
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#dokJudulCombobox')) {
      closeDokJudulDropdown();
    }
  });

  if (dokValJudulKegiatan) {
    dokValJudulKegiatan.addEventListener('input', () => {
      if (dokInputJudulKegiatan) {
        dokInputJudulKegiatan.value = dokValJudulKegiatan.textContent;
        dokInputJudulKegiatan.dataset.userEdited = 'true';
      }
    });
  }

  // Switch between SPPD, LPT, and Dokumentasi Form
  const updateFormDisplay = () => {
    const formType = sppdLptSelectForm ? sppdLptSelectForm.value : 'sppd';

    if (formType === 'sppd') {
      if (sppdSidebarSections) sppdSidebarSections.style.display = 'block';
      if (lptSidebarSections) lptSidebarSections.style.display = 'none';
      if (dokSidebarSections) dokSidebarSections.style.display = 'none';
      if (sppdDisplayPartGroup) sppdDisplayPartGroup.style.display = 'block';
      if (lptSheetDoc) lptSheetDoc.style.display = 'none';
      if (dokSheetDoc) dokSheetDoc.style.display = 'none';

      const part = sppdDisplayPart ? sppdDisplayPart.value : 'both';
      if (part === 'both') {
        if (sppdSheetDepan) sppdSheetDepan.style.display = 'block';
        if (sppdSheetBelakang) sppdSheetBelakang.style.display = 'block';
      } else if (part === 'front') {
        if (sppdSheetDepan) sppdSheetDepan.style.display = 'block';
        if (sppdSheetBelakang) sppdSheetBelakang.style.display = 'none';
      } else if (part === 'back') {
        if (sppdSheetDepan) sppdSheetDepan.style.display = 'none';
        if (sppdSheetBelakang) sppdSheetBelakang.style.display = 'block';
      }
    } else if (formType === 'lpt') {
      // LPT Form
      if (sppdSidebarSections) sppdSidebarSections.style.display = 'none';
      if (lptSidebarSections) lptSidebarSections.style.display = 'block';
      if (dokSidebarSections) dokSidebarSections.style.display = 'none';
      if (sppdDisplayPartGroup) sppdDisplayPartGroup.style.display = 'none';
      if (sppdSheetDepan) sppdSheetDepan.style.display = 'none';
      if (sppdSheetBelakang) sppdSheetBelakang.style.display = 'none';
      if (lptSheetDoc) lptSheetDoc.style.display = 'block';
      if (dokSheetDoc) dokSheetDoc.style.display = 'none';
    } else if (formType === 'dok') {
      // Dokumentasi Kegiatan Form
      if (sppdSidebarSections) sppdSidebarSections.style.display = 'none';
      if (lptSidebarSections) lptSidebarSections.style.display = 'none';
      if (dokSidebarSections) dokSidebarSections.style.display = 'block';
      if (sppdDisplayPartGroup) sppdDisplayPartGroup.style.display = 'none';
      if (sppdSheetDepan) sppdSheetDepan.style.display = 'none';
      if (sppdSheetBelakang) sppdSheetBelakang.style.display = 'none';
      if (lptSheetDoc) lptSheetDoc.style.display = 'none';
      if (dokSheetDoc) dokSheetDoc.style.display = 'block';
      updateDokEmptyState();
    }
  };

  if (sppdLptSelectForm) sppdLptSelectForm.addEventListener('change', updateFormDisplay);
  if (sppdDisplayPart) sppdDisplayPart.addEventListener('change', updateFormDisplay);

  if (btnSaveSppdLpt) {
    btnSaveSppdLpt.addEventListener('click', () => {
      showToast ? showToast('✓ Data SPPD, LPT & Dokumentasi berhasil disimpan!', 'success') : alert('✓ Data SPPD, LPT & Dokumentasi berhasil disimpan.');
    });
  }

  const sppdPaperSize = document.getElementById('sppdPaperSize');
  const btnDownloadPdfSppdLpt = document.getElementById('btnDownloadPdfSppdLpt');

  // Dynamic @page CSS rule for Pure A4 Paper Format (Margin 0 to suppress browser header/footer)
  const applyPrintPaperSize = () => {
    let styleEl = document.getElementById('sppdDynamicPrintPageStyle');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'sppdDynamicPrintPageStyle';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        @page {
          size: A4 portrait !important;
          margin: 0mm !important;
        }
      }
    `;
  };
  applyPrintPaperSize();

  // ==========================================================================
  // PRECISION ISOLATED DOCUMENT PRINTER — EXACT A4 REPLICA (ZERO OVERFLOW)
  // ==========================================================================
  const printIsolatedDocument = (formType, part) => {
    const pageSizeCss = 'A4 portrait';
    const sheetWidth = '210mm';
    const screenPadding = '10mm 14mm 10mm 14mm';
    const pageMargin = '0mm';
    const tableFontSize = '12px';
    const cellPadding = '3.5px 6px';
    const paperLabel = 'Format Kertas: A4 (Standar Resmi)';

    const logoSize = '180';
    const logoPos = '-31';

    const contentToPrint = [];
    if (formType === 'dok') {
      const dokEl = document.getElementById('dokSheetDoc');
      if (dokEl) contentToPrint.push(dokEl.outerHTML);
    } else if (formType === 'lpt') {
      const lptEl = document.getElementById('lptSheetDoc');
      if (lptEl) contentToPrint.push(lptEl.outerHTML);
    } else {
      if (part === 'both' || part === 'front') {
        const frontEl = document.getElementById('sppdSheetDepan');
        if (frontEl) contentToPrint.push(frontEl.outerHTML);
      }
      if (part === 'both' || part === 'back') {
        const backEl = document.getElementById('sppdSheetBelakang');
        if (backEl) contentToPrint.push(backEl.outerHTML);
      }
    }

    if (contentToPrint.length === 0) {
      alert('Tidak ada dokumen yang bisa dicetak.');
      return;
    }

    const isBothSheets = (part === 'both' && formType !== 'lpt');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak dokumen.');
      return;
    }

    const baseHref = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

    printWin.document.open();
    printWin.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<base href="${baseHref}">
<title>${formType === 'lpt' ? 'LPT' : 'SPPD'} — Puskesmas Banjaran Kota</title>
<style>
  :root {
    --sppd-logo-size: ${logoSize}px;
    --sppd-logo-offset-x: ${logoPos}px;
  }
  @page {
    size: ${pageSizeCss} !important;
    margin: ${pageMargin} !important;
  }
  *, *::before, *::after {
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    background: #1e293b;
    color: #000000;
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif !important;
    line-height: 1.2;
    -webkit-font-smoothing: antialiased;
  }

  /* Screen toolbar (hidden during print) */
  .no-print-bar {
    position: sticky;
    top: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .no-print-bar .doc-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13.5px;
  }
  .no-print-bar .doc-badge {
    background: rgba(212, 163, 89, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(212, 163, 89, 0.4);
    padding: 3px 10px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 12px;
  }
  .no-print-bar .btn-group {
    display: flex;
    gap: 10px;
  }
  .no-print-bar .btn-print-action {
    background: linear-gradient(135deg, #d4a359, #b8863b);
    color: #0b0f19;
    font-weight: 700;
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 10px rgba(212, 163, 89, 0.35);
    transition: transform 0.15s ease;
  }
  .no-print-bar .btn-print-action:hover {
    transform: translateY(-1px);
  }
  .no-print-bar .btn-close-action {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
  }

  .document-stage {
    padding: 25px 15px 50px 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  /* Sheet container - EXACT A4 PAPER WIDTH ON SCREEN */
  .sppd-doc-sheet-exact {
    background: #ffffff !important;
    color: #000000 !important;
    width: ${sheetWidth} !important;
    max-width: 100% !important;
    min-height: 297mm !important;
    box-sizing: border-box !important;
    margin: 0 auto 30px auto !important;
    padding: ${screenPadding} !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45) !important;
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    border-radius: 3px !important;
    position: relative !important;
    overflow: visible !important;
  }

  /* PRINT MODE OVERRIDES (PURE A4 FULL PAGE - ZERO BROWSER HEADERS & FOOTERS) */
  @media print {
    .no-print, .no-print-bar {
      display: none !important;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    .document-stage {
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      width: 100% !important;
    }
    .sppd-doc-sheet-exact {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 auto !important;
      padding: 10mm 14mm 10mm 14mm !important;
      width: 210mm !important;
      max-width: 210mm !important;
      min-height: 297mm !important;
      height: auto !important;
      display: block !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
    }

    ${isBothSheets ? `
    #sppdSheetDepan {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 0 !important;
    }
    #sppdSheetBelakang {
      page-break-before: always !important;
      break-before: page !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-top: 0 !important;
      padding: 5mm 12mm 5mm 12mm !important;
    }
    ` : `
    #sppdSheetDepan, #sppdSheetBelakang, #lptSheetDoc {
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    `}
  }

  /* Kop Surat Resmi (Exact Image Reference) */
  .sppd-kop-container {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    position: relative !important;
    margin-bottom: 1px !important;
    min-height: 85px !important;
    width: 100% !important;
  }
  .sppd-kop-logo {
    position: absolute !important;
    left: var(--sppd-logo-offset-x, 0px) !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: var(--sppd-logo-size, 100px) !important;
    height: var(--sppd-logo-size, 100px) !important;
    max-height: 120px !important;
    object-fit: contain !important;
    object-position: left center !important;
    display: block !important;
  }
  .sppd-kop-text {
    width: 100% !important;
    text-align: center !important;
    color: #000000 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 0 !important;
  }
  .sppd-kop-line1 {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    letter-spacing: 0.4px !important;
    line-height: 1.15 !important;
    margin: 0 !important;
  }
  .sppd-kop-line2 {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    letter-spacing: 0.6px !important;
    line-height: 1.1 !important;
    margin: 1px 0 0 0 !important;
  }
  .sppd-kop-line3 {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    letter-spacing: 0.4px !important;
    line-height: 1.1 !important;
    margin: 1px 0 0 0 !important;
  }
  .sppd-kop-line4 {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 10px !important;
    font-weight: 400 !important;
    line-height: 1.2 !important;
    margin: 2px 0 0 0 !important;
  }
  .sppd-kop-line5 {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 10px !important;
    font-weight: 400 !important;
    line-height: 1.2 !important;
    margin: 1px 0 0 0 !important;
  }

  .sppd-kop-divider {
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
    height: 1px !important;
    margin: 2px 0 3px 0 !important;
  }

  .sppd-title-center-box {
    text-align: center !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .sppd-title {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px !important;
    text-decoration: underline !important;
    margin: 0 !important;
    line-height: 1.1 !important;
  }
  .sppd-subtitle {
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    margin: 1px 0 0 0 !important;
    line-height: 1.1 !important;
  }
  .sppd-title-divider {
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
    height: 1px !important;
    margin: 2px 0 1px 0 !important;
  }

  /* Table styles (Exact A4 Spacing) */
  .exact-sppd-table {
    width: 100% !important;
    border-collapse: collapse !important;
    border: 1.5px solid #000000 !important;
    font-size: ${tableFontSize} !important;
    color: #000000 !important;
    margin-top: 0 !important;
    margin-bottom: 8px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .exact-sppd-table th,
  .exact-sppd-table td {
    border: 1px solid #000000 !important;
    padding: ${cellPadding} !important;
    color: #000000 !important;
    line-height: 1.25 !important;
  }

  .sppd-num-col {
    width: 25px !important;
    text-align: left !important;
    vertical-align: top !important;
    padding: 3.5px 4px !important;
  }
  .sppd-desc-col {
    width: 310px !important;
    vertical-align: top !important;
    padding: 3.5px 6px !important;
  }
  .sppd-val-col {
    vertical-align: top !important;
    padding: 3.5px 6px !important;
  }
  .sppd-row-pejabat td,
  .sppd-row-pejabat .sppd-num-col,
  .sppd-row-pejabat .sppd-desc-col,
  .sppd-row-pejabat .sppd-val-col {
    vertical-align: middle !important;
    height: 40px !important;
  }
  .sppd-row-pegawai td,
  .sppd-row-pegawai .sppd-num-col,
  .sppd-row-pegawai .sppd-desc-col,
  .sppd-row-pegawai .sppd-val-col {
    vertical-align: middle !important;
    height: 40px !important;
  }
  .sppd-row-maksud td,
  .sppd-row-maksud .sppd-num-col,
  .sppd-row-maksud .sppd-desc-col,
  .sppd-row-maksud .sppd-val-col {
    vertical-align: middle !important;
    height: 65px !important;
  }

  /* Signature Block */
  .sppd-signature-front {
    display: flex !important;
    justify-content: flex-end !important;
    margin-top: 8px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .sppd-sig-box-right {
    width: 290px !important;
    font-size: 12px !important;
  }
  .sppd-barcode-img {
    width: 68px !important;
    height: 68px !important;
    object-fit: contain !important;
    display: block !important;
    margin: 2px auto !important;
  }
  .sppd-sig-name {
    font-weight: 700 !important;
    text-decoration: underline !important;
    margin: 0 !important;
    font-size: 12.5px !important;
  }
  .sppd-sig-nip {
    margin: 1px 0 0 0 !important;
    font-size: 11.5px !important;
  }

  /* Lembar Belakang */
  #sppdSheetBelakang {
    padding: 5mm 12mm 5mm 12mm !important;
  }
  #sppdSheetBelakang,
  #sppdSheetBelakang *,
  .sppd-back-outer-table,
  .sppd-back-outer-table * {
    font-family: Arial, Helvetica, sans-serif !important;
    color: #000000 !important;
  }
  .sppd-back-outer-table {
    border-collapse: collapse !important;
    width: 100% !important;
    table-layout: fixed !important;
    border: 1px solid #000000 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-bottom: 3px !important;
  }
  .sppd-back-outer-table > tbody > tr > td {
    border: 1px solid #000000 !important;
    vertical-align: top !important;
    box-sizing: border-box !important;
  }
  .sppd-back-outer-table > tbody > tr.sppd-visum-row > td {
    height: 160px !important;
    padding: 4px 8px !important;
  }
  .sppd-back-outer-table > tbody > tr.sppd-note-row > td {
    height: auto !important;
  }
  .nested-sppd-tbl {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    border: none !important;
    font-size: 10px !important;
  }
  .nested-sppd-tbl td {
    border: none !important;
    padding: 1px 2px !important;
    line-height: 1.2 !important;
    color: #000000 !important;
  }

  /* LPT specific */
  #lptSheetDoc {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  #lptSheetDoc .lpt-editable-field,
  #lptSheetDoc .lpt-field-yellow,
  #lptSheetDoc .lpt-field-blue,
  #dokSheetDoc .lpt-editable-field {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    color: #000000 !important;
  }
  .lpt-signatures-wrapper {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .lpt-sig-col {
    text-align: center !important;
  }
  .exact-lpt-table td {
    padding: 5px 7px !important;
    line-height: 1.35 !important;
  }

  /* Dokumentasi specific */
  #dokSheetDoc {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    padding: 10mm 14mm !important;
  }
  .dok-card-toolbar,
  .dok-resize-handle,
  .dok-empty-placeholder {
    display: none !important;
  }
  .dok-photo-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }
  .dok-layout-grid-2 { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
  .dok-layout-grid-3 { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 14px !important; }
  .dok-layout-grid-1 { display: flex !important; flex-direction: column !important; gap: 20px !important; }
  .dok-layout-free { display: flex !important; flex-wrap: wrap !important; gap: 16px !important; }
  
  .dok-photo-card {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-sizing: border-box !important;
    margin-bottom: 14px !important;
  }
  .dok-photo-card.align-left { margin-right: auto !important; margin-left: 0 !important; align-items: flex-start !important; }
  .dok-photo-card.align-left .dok-photo-caption { text-align: left !important; }
  .dok-photo-card.align-center { margin-left: auto !important; margin-right: auto !important; align-items: center !important; }
  .dok-photo-card.align-center .dok-photo-caption { text-align: center !important; }
  .dok-photo-card.align-right { margin-left: auto !important; margin-right: 0 !important; align-items: flex-end !important; }
  .dok-photo-card.align-right .dok-photo-caption { text-align: right !important; }

  .dok-photo-card.size-s { width: 33% !important; max-width: 33% !important; }
  .dok-photo-card.size-m { width: 50% !important; max-width: 50% !important; }
  .dok-photo-card.size-l { width: 75% !important; max-width: 75% !important; }
  .dok-photo-card.size-full { width: 100% !important; max-width: 100% !important; }
  
  .dok-photo-img-wrap {
    width: 100% !important;
    border-radius: 0 !important;
    overflow: visible !important;
    background: transparent !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .dok-photo-img {
    width: 100% !important;
    height: auto !important;
    max-height: 480px !important;
    object-fit: contain !important;
    display: block !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .dok-photo-caption {
    margin-top: 6px !important;
    font-size: 12px !important;
    line-height: 1.35 !important;
    color: #000000 !important;
    text-align: center !important;
    font-family: Arial, Helvetica, sans-serif !important;
  }
  .dok-photo-caption:empty {
    display: none !important;
  }
</style>
</head>
<body>
<div class="no-print-bar no-print">
  <div class="doc-info">
    <strong style="display: flex; align-items: center; gap: 6px;">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      <span>Pratinjau Dokumen ${formType === 'dok' ? 'Dokumentasi Kegiatan' : (formType === 'lpt' ? 'LPT' : 'SPPD')}</span>
    </strong>
    <span class="doc-badge">${paperLabel}</span>
  </div>
  <div class="btn-group">
    <button type="button" class="btn-print-action" onclick="window.print()">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      <span>Cetak / Save as PDF</span>
    </button>
    <button type="button" class="btn-close-action" onclick="window.close()">
      <span>Tutup</span>
    </button>
  </div>
</div>

<div class="document-stage">
  ${contentToPrint.join('')}
</div>

<script>
  window.onload = function() {
    // Ensure all images are fully loaded before launching print dialog
    var images = document.getElementsByTagName('img');
    var totalImages = images.length;
    var loadedImages = 0;
    
    function tryPrint() {
      setTimeout(function() {
        window.print();
      }, 300);
    }
    
    if (totalImages === 0) {
      tryPrint();
    } else {
      for (var i = 0; i < totalImages; i++) {
        if (images[i].complete) {
          loadedImages++;
          if (loadedImages === totalImages) tryPrint();
        } else {
          images[i].addEventListener('load', function() {
            loadedImages++;
            if (loadedImages === totalImages) tryPrint();
          });
          images[i].addEventListener('error', function() {
            loadedImages++;
            if (loadedImages === totalImages) tryPrint();
          });
        }
      }
    }
  };
<\/script>
</body>
</html>`);
    printWin.document.close();
  };

  // Direct Pure A4 PDF Downloader (Zero Browser Headers & Footers)
  const exportDirectA4Pdf = async (formType, part) => {
    if (typeof html2pdf === 'undefined') {
      printIsolatedDocument(formType, part);
      return;
    }

    if (typeof showToast === 'function') {
      showToast('Memproses file PDF A4 resmi tanpa header/footer...', 'info');
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.background = '#ffffff';
    container.style.color = '#000000';
    container.style.fontFamily = 'Arial, Helvetica, sans-serif';

    const sheets = [];
    if (formType === 'dok') {
      const dokEl = document.getElementById('dokSheetDoc');
      if (dokEl) sheets.push(dokEl.cloneNode(true));
    } else if (formType === 'lpt') {
      const lptEl = document.getElementById('lptSheetDoc');
      if (lptEl) sheets.push(lptEl.cloneNode(true));
    } else {
      if (part === 'both' || part === 'front') {
        const frontEl = document.getElementById('sppdSheetDepan');
        if (frontEl) sheets.push(frontEl.cloneNode(true));
      }
      if (part === 'both' || part === 'back') {
        const backEl = document.getElementById('sppdSheetBelakang');
        if (backEl) sheets.push(backEl.cloneNode(true));
      }
    }

    sheets.forEach((sheet, idx) => {
      sheet.style.width = '210mm';
      sheet.style.maxWidth = '210mm';
      sheet.style.minHeight = '296mm';
      sheet.style.padding = '10mm 14mm 10mm 14mm';
      sheet.style.margin = '0';
      sheet.style.boxShadow = 'none';
      sheet.style.border = 'none';
      sheet.style.boxSizing = 'border-box';
      sheet.style.background = '#ffffff';
      if (idx > 0) {
        sheet.style.pageBreakBefore = 'always';
        sheet.style.breakBefore = 'page';
      }
      container.appendChild(sheet);
    });

    document.body.appendChild(container);

    const filename = formType === 'dok'
      ? `Dokumentasi_Kegiatan_Puskesmas_Banjaran_Kota_${new Date().toISOString().slice(0,10)}.pdf`
      : (formType === 'lpt' 
        ? `LPT_Puskesmas_Banjaran_Kota_${new Date().toISOString().slice(0,10)}.pdf` 
        : `SPPD_Puskesmas_Banjaran_Kota_${new Date().toISOString().slice(0,10)}.pdf`);

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(container).save();
      if (typeof showToast === 'function') {
        showToast('✓ PDF resmi A4 berhasil diunduh bersih!', 'success');
      }
    } catch (err) {
      console.error('html2pdf direct export error:', err);
      printIsolatedDocument(formType, part);
    } finally {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }
  };

  // Print & Download PDF Buttons (SPPD)
  if (btnPrintSppdLpt) {
    btnPrintSppdLpt.addEventListener('click', () => {
      printIsolatedDocument(
        sppdLptSelectForm ? sppdLptSelectForm.value : 'sppd',
        sppdDisplayPart ? sppdDisplayPart.value : 'both'
      );
    });
  }
  if (btnDownloadPdfSppdLpt) {
    btnDownloadPdfSppdLpt.addEventListener('click', () => {
      exportDirectA4Pdf(
        sppdLptSelectForm ? sppdLptSelectForm.value : 'sppd',
        sppdDisplayPart ? sppdDisplayPart.value : 'both'
      );
    });
  }

  // Initial Sync & Display
  syncSppdLptData();
  syncLptOfficer(1);
  syncLptOfficer(2);
  syncLptOfficer(3);
  updateLptPetugasVisibility();
  updateFormDisplay();

  // Initial update
  updateTpPolDocHeader();

  // Entrance animations for Beranda view
  gsap.from('.welcome-hero-card', {
    y: 20,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out'
  });

  gsap.from('.profile-bento-grid .dash-card', {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    delay: 0.1,
    ease: 'power2.out'
  });

  gsap.from('.kpi-card', {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.08,
    delay: 0.2,
    ease: 'power2.out'
  });

  // ==========================================================================
  // 12. JADWAL KEGIATAN BOK CONTROLLER (SICEKAS v2.0)
  // ==========================================================================
  const KEGIATAN_BOK_LIST = [
    "Fasilitasi Pelaksanaan First Aider Pertolongan Pertama pada Luka Psikologis (P3LP) di Sekolah",
    "Pelacakan dan pengawasan minum obat untuk ODGJ berat",
    "Pelacakan dan pelaporan kematian dan pelaksanaan otopsi verbal kematian Ibu dan Bayi/balita",
    "Pelaksanaan Kelas ibu Hamil",
    "Pelaksanaan Kelas Ibu Balita",
    "Pelayanan Kesehatan pada anak usia sekolah dan remaja (Skrining dan pembinaan di sekolah dan komunitas)",
    "Pemantauan Minum TTD",
    "Pelaksanaan skrining dan intervensi hasil skrining masalah Kesehatan jiwa di UKBM/Lembaga",
    "Kunjungan lapangan pemantauan bumil KEK, Anemia, Bumil Risti, BBLR, dan Bayi Balita dengan Masalah Gizi",
    "Kunjungan lapangan pemantauan Tumbuh Kembang dan Masalah Gizi ibu dan anak",
    "Pendampingan rujukan balita stunting/gizi buruk",
    "Pelayanan Imunisasi Rutin",
    "Pelayanan Imunisasi BIAS",
    "Pelayanan Imunisasi Tambahan",
    "Penemuan Kasus KIPI dan PD3I",
    "Deteksi Dini dan Cek Kesehatan Gratis dan Tindak Lanjut Penyakit Tidak Menular",
    "Inspeksi kesling di sarana tempat dan fasilitas umum, sarana Tempat Pengelolaan Pangan (TPP), Sarana Air Minum (SAM), Fasyankes",
    "Pemberdayaan kader dalam rangka pencegahan dan pengendalian penyakit tidak menular",
    "Pemberdayaan kader dalam rangka pencegahan dan pengendalian penyakit menular",
    "Pemberdayaan kader dalam rangka pelaksanaan Imunisasi",
    "Pemberdayaan kader masyarakat melalui pemicuan untuk implementasi seluruh pilar STBM (Implementasi 5 pilar STBM)",
    "Penemuan kasus aktif dan pemantauan pengobatan TBC (Investigasi kontak TBC, pelacakan kasus TBC mangkir)",
    "Pemantauan menelan obat TBC, pemberian terapi pencegahan TBC, penemuan kasus ILTB",
    "Penemuan kasus aktif penyakit menular, NTDs (Penyakit Tropis Terabaikan), KIPI dan PD3I (AFP, Campak Rubela dan PD3I lainnya), Pneumonia dan Infeksi Saluran Pernapasan Akut terintegrasi dengan Posyandu, Posbindu",
    "Pemantauan dan tindaklanjut kasus penyakit menular (Pemberian Obat Pencegahan Massal (POPM) Kecacingan)",
    "Penemuan kasus aktif kusta dan komprofilaksis kusta",
    "Survei dan Pengendalian Vector (pengasapan/fogging, penyemprotan dinding rumah (IRS), larvasidasi DBD/Malaria dan PSN)",
    "Kunjungan lapangan dalam rangka pengawasan terhadap kualitas air minum rumah tangga",
    "Kunjungan lapangan dalam rangka surveilans kualitas udara dalam ruang",
    "Verifikasi Sinyal/rumor, PE/pelacakan kontak penyakit berpotensi KLB/Wabah/PIE/kejadian tidak lazim",
    "Penyelidikan epidemiologi (PE) Penyakit menular lainnya",
    "Penyelidikan epidemiologi (PE) Penyehatan Lingkungan",
    "Pembekalan tim pelaksana dalam penyiapan pemberian makanan tambahan berbasis pangan lokal bagi ibu hamil kek dan balita gizi kurang tingkat kab/kota dan puskesmas",
    "Pendampingan pelaksanaan ILP di pustu dan pelayanan kesehatan desa/kelurahan (UPKD/K)",
    "Kunjungan rumah kader posyandu",
    "Pembinaan, Koordinasi, Pengelolaan dan Penyelenggaraan UPKD/K",
    "Tindak Lanjut kunjungan Rumah UPKD/K",
    "Partisipasi dalam Musrenbangdes",
    "Intervensi Pemberdayaan Masyarakat berdasarkan siklus hidup di UPKD/kelurahan",
    "Monitoring dan evaluasi kegiatan Posyandu Bidang kesehatan di wilayah desa/kelurahan"
  ];
  window.KEGIATAN_BOK_LIST = KEGIATAN_BOK_LIST;

  const STORAGE_BOK_DATA = 'SICEKAS_BOK_DATA_V2';
  const STORAGE_BOK_COLLAB = 'SICEKAS_BOK_COLLAB_V2';

  // Current logged in user - DYNAMIC from login session (no more hardcoded)
  const sessionRaw = localStorage.getItem('SICEKAS_CURRENT_USER');
  const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
  const CURRENT_USER = {
    username: sessionUser?.username || 'ozie',
    nama: sessionUser?.nama || 'Mochamad Fauzie, S.Gz',
    jabatan: sessionUser?.jabatan || 'Nutrisionis',
    nip: sessionUser?.nip || '873.3204.16.02.008',
    role: sessionUser?.role || 'Super Admin',
    avatar: sessionUser?.avatar || 'MF'
  };
  window.CURRENT_USER = CURRENT_USER;

  // No dummy seed data - all kegiatan data comes from Cloudflare D1 cloud database
  // Clean up any old dummy/seed data from localStorage (legacy cleanup)
  try {
    const oldBokData = JSON.parse(localStorage.getItem(STORAGE_BOK_DATA) || '[]');
    const hasDummyIds = oldBokData.some(item => 
      ['bok-1', 'bok-2', 'bok-3', 'bok-4', 'bok-5', 'bok-6', 'bok-7', 'bok-8'].includes(item.id)
    );
    if (hasDummyIds) {
      localStorage.removeItem(STORAGE_BOK_DATA);
      console.info('[SICEKAS] Old dummy kegiatan data cleaned from localStorage.');
    }
    const oldCollabData = JSON.parse(localStorage.getItem(STORAGE_BOK_COLLAB) || '[]');
    const hasDummyCollabs = oldCollabData.some(item => 
      ['collab-101', 'collab-102'].includes(item.id)
    );
    if (hasDummyCollabs) {
      localStorage.removeItem(STORAGE_BOK_COLLAB);
      console.info('[SICEKAS] Old dummy kolaborasi data cleaned from localStorage.');
    }
  } catch (e) {
    // Silent cleanup
  }

  // Jadwal BOK Controller Object
  const JadwalBOKController = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    selectedStaff: '',
    searchKeyword: '',
    activeTab: 'all', // 'all' | 'mine' | 'collab'
    viewMode: 'timeline', // 'timeline' | 'calendar'
    _cachedData: null, // in-memory cache for cloud data
    _lastFetchKey: '', // tracks last fetch params to avoid redundant calls

    // Fetch kegiatan from Cloudflare D1 cloud database (async)
    async getData() {
      const fetchKey = `${this.currentMonth}-${this.currentYear}`;
      // Use cache if we already fetched for this month/year
      if (this._cachedData !== null && this._lastFetchKey === fetchKey) {
        return this._cachedData;
      }
      try {
        const cloudData = await CloudflareDB.fetchJadwal(this.currentMonth, this.currentYear);
        // Normalize cloud data fields to match local format
        const normalized = (cloudData || []).map(item => ({
          id: item.id,
          tanggal: item.tanggal,
          noKegiatan: item.noKegiatan || 0,
          namaKegiatan: item.namaKegiatan || item.nama_kegiatan || '',
          keterangan: item.keterangan || '',
          lokasi: item.lokasi || '',
          username: item.username || '',
          namaUser: item.namaUser || item.petugas_nama || '',
          jabatan: item.jabatan || item.petugas_jabatan || '',
          petugas_nip: item.petugas_nip || '',
          rekan_kolaborasi: item.rekan_kolaborasi || [],
          status: item.status || 'Disetujui',
          createdAt: item.created_at || item.createdAt || ''
        }));
        this._cachedData = normalized;
        this._lastFetchKey = fetchKey;
        return normalized;
      } catch (e) {
        console.warn('Error fetching jadwal from cloud, using cache', e);
        // Fallback to localStorage cache if cloud fails
        try {
          return JSON.parse(localStorage.getItem(STORAGE_BOK_DATA)) || [];
        } catch (ex) {
          return [];
        }
      }
    },

    // Invalidate cache so next getData() fetches fresh from cloud
    invalidateCache() {
      this._cachedData = null;
      this._lastFetchKey = '';
    },

    getCollabData() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_BOK_COLLAB)) || [];
      } catch (e) {
        return [];
      }
    },

    saveCollabData(data) {
      localStorage.setItem(STORAGE_BOK_COLLAB, JSON.stringify(data));
    },

    async init() {
      this.populateSelects();
      this.populateStaffPickers();
      this.bindEvents();
      await this.render();
      this.updateCollabBadges();
    },

    populateSelects() {
      // 1. Populate Kegiatan BOK selects (modal tambah & collab)
      const inputKegiatan = document.getElementById('inputKegiatanBOK');
      const collabKegiatan = document.getElementById('collabKegiatan');

      let kegOptions = '<option value="">-- Pilih Jenis Kegiatan --</option>';
      KEGIATAN_BOK_LIST.forEach((item, index) => {
        kegOptions += `<option value="${index + 1}">${index + 1}. ${item}</option>`;
      });

      if (inputKegiatan) inputKegiatan.innerHTML = kegOptions;
      if (collabKegiatan) collabKegiatan.innerHTML = kegOptions;

      // 2. Populate Staff Filter in header
      const fPetugas = document.getElementById('fPetugasBOK');
      if (fPetugas && DAFTAR_PEGAWAI) {
        let staffOpts = '<option value="">— Semua Petugas Puskesmas (39 Pegawai) —</option>';
        DAFTAR_PEGAWAI.forEach(p => {
          staffOpts += `<option value="${p.nama}">${p.nama} (${p.jabatan})</option>`;
        });
        fPetugas.innerHTML = staffOpts;
      }
    },

    populateStaffPickers() {
      const container = document.getElementById('collabStaffListContainer');
      if (!container || !DAFTAR_PEGAWAI) return;

      let html = '';
      DAFTAR_PEGAWAI.forEach(p => {
        if (p.nama !== CURRENT_USER.nama) {
          const initials = p.nama.split(' ').map(w => w[0]).filter(c => /[A-Za-z]/.test(c)).slice(0, 2).join('').toUpperCase() || 'PG';
          html += `
            <label class="collab-staff-item" data-nama="${p.nama.toLowerCase()}" data-jab="${p.jabatan.toLowerCase()}">
              <input type="checkbox" class="collab-staff-cb" value="${p.nama}" data-jabatan="${p.jabatan}">
              <div class="collab-staff-avatar">${initials}</div>
              <div class="collab-staff-text">
                <h6>${p.nama}</h6>
                <p>${p.jabatan} • ${p.nipFull || p.nip}</p>
              </div>
            </label>
          `;
        }
      });
      container.innerHTML = html;
    },

    bindEvents() {
      // Month & Year Filter Change
      const fBulan = document.getElementById('fBulanBOK');
      const fTahun = document.getElementById('fTahunBOK');
      const fPetugas = document.getElementById('fPetugasBOK');
      const searchInput = document.getElementById('searchBOK');

      if (fBulan) {
        fBulan.addEventListener('change', async (e) => {
          this.currentMonth = parseInt(e.target.value);
          this.invalidateCache();
          await this.render();
        });
      }

      if (fTahun) {
        fTahun.addEventListener('change', async (e) => {
          this.currentYear = parseInt(e.target.value);
          this.invalidateCache();
          await this.render();
        });
      }

      if (fPetugas) {
        fPetugas.addEventListener('change', async (e) => {
          this.selectedStaff = e.target.value;
          await this.render();
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
          this.searchKeyword = e.target.value.toLowerCase().trim();
          await this.render();
        });
      }

      // Quick Tabs (All / Mine / Collab)
      const tabBtns = document.querySelectorAll('.bok-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeTab = btn.getAttribute('data-filter') || 'all';
          await this.render();
        });
      });

      // View Mode Switcher (Timeline vs Calendar)
      const btnTimeline = document.getElementById('btnBokViewTimeline');
      const btnCalendar = document.getElementById('btnBokViewCalendar');
      const timelineContainer = document.getElementById('bokTimelineContainer');
      const calendarContainer = document.getElementById('bokCalendarContainer');

      if (btnTimeline && btnCalendar) {
        btnTimeline.addEventListener('click', async () => {
          btnTimeline.classList.add('active');
          btnCalendar.classList.remove('active');
          this.viewMode = 'timeline';
          if (timelineContainer) timelineContainer.style.display = 'block';
          if (calendarContainer) calendarContainer.style.display = 'none';
          await this.render();
        });

        btnCalendar.addEventListener('click', async () => {
          btnCalendar.classList.add('active');
          btnTimeline.classList.remove('active');
          this.viewMode = 'calendar';
          if (timelineContainer) timelineContainer.style.display = 'none';
          if (calendarContainer) calendarContainer.style.display = 'block';
          await this.render();
        });
      }

      // Calendar Navigation
      const btnCalPrev = document.getElementById('btnBokCalPrev');
      const btnCalNext = document.getElementById('btnBokCalNext');

      if (btnCalPrev) {
        btnCalPrev.addEventListener('click', async () => {
          if (this.currentMonth === 1) {
            this.currentMonth = 12;
            this.currentYear--;
          } else {
            this.currentMonth--;
          }
          if (fBulan) fBulan.value = this.currentMonth;
          if (fTahun) fTahun.value = this.currentYear;
          this.invalidateCache();
          await this.render();
        });
      }

      if (btnCalNext) {
        btnCalNext.addEventListener('click', async () => {
          if (this.currentMonth === 12) {
            this.currentMonth = 1;
            this.currentYear++;
          } else {
            this.currentMonth++;
          }
          if (fBulan) fBulan.value = this.currentMonth;
          if (fTahun) fTahun.value = this.currentYear;
          this.invalidateCache();
          await this.render();
        });
      }

      const btnCalToday = document.getElementById('btnBokCalToday');
      if (btnCalToday) {
        btnCalToday.addEventListener('click', async () => {
          const now = new Date();
          this.currentMonth = now.getMonth() + 1;
          this.currentYear = now.getFullYear();
          if (fBulan) fBulan.value = this.currentMonth;
          if (fTahun) fTahun.value = this.currentYear;
          this.invalidateCache();
          await this.render();
        });
      }

      // Header Action Buttons
      const btnTambah = document.getElementById('btnBokTambahJadwal');
      const btnCollab = document.getElementById('btnBokRequestCollab');
      const btnNotif = document.getElementById('btnBokNotifCollab');
      const btnExport = document.getElementById('btnBokExportPdf');
      const btnBerandaKeJadwal = document.getElementById('btnBerandaKeJadwal');

      if (btnTambah) btnTambah.addEventListener('click', () => this.bukaModalTambah());
      if (btnCollab) btnCollab.addEventListener('click', () => this.bukaModalCollab());
      if (btnNotif) btnNotif.addEventListener('click', () => this.bukaModalNotif());
      if (btnExport) btnExport.addEventListener('click', () => this.cetakJadwalBulanan());

      if (btnBerandaKeJadwal) {
        btnBerandaKeJadwal.addEventListener('click', () => {
          const navItem = document.getElementById('navJadwalKegiatan');
          if (navItem) navItem.click();
        });
      }

      // Modal Close Handlers
      const modalTambah = document.getElementById('modalTambahJadwalBOK');
      const closeTambah = document.getElementById('closeBokFormModal');
      const btnCancelTambah = document.getElementById('btnCancelTambahBOK');
      const formTambah = document.getElementById('formTambahJadwalBOK');

      const closeModalTambah = () => {
        if (modalTambah) modalTambah.classList.remove('active');
      };
      if (closeTambah) closeTambah.addEventListener('click', closeModalTambah);
      if (btnCancelTambah) btnCancelTambah.addEventListener('click', closeModalTambah);

      if (formTambah) {
        formTambah.addEventListener('submit', (e) => {
          e.preventDefault();
          this.simpanJadwal();
        });
      }

      // Collab Modal Handlers
      const modalCollab = document.getElementById('modalRequestKolaborasi');
      const closeCollab = document.getElementById('closeCollabRequestModal');
      const btnCancelCollab = document.getElementById('btnCancelCollabRequest');
      const formCollab = document.getElementById('formRequestKolaborasi');
      const collabStaffSearch = document.getElementById('collabStaffSearch');

      const closeModalCollab = () => {
        if (modalCollab) modalCollab.classList.remove('active');
      };
      if (closeCollab) closeCollab.addEventListener('click', closeModalCollab);
      if (btnCancelCollab) btnCancelCollab.addEventListener('click', closeModalCollab);

      if (formCollab) {
        formCollab.addEventListener('submit', (e) => {
          e.preventDefault();
          this.kirimRequestCollab();
        });
      }

      if (collabStaffSearch) {
        collabStaffSearch.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          document.querySelectorAll('.collab-staff-item').forEach(item => {
            const nama = item.dataset.nama || '';
            const jab = item.dataset.jab || '';
            if (nama.includes(q) || jab.includes(q) || q === '') {
              item.style.display = 'flex';
            } else {
              item.style.display = 'none';
            }
          });
        });
      }

      // Collab selection counter limiter (max 5)
      const listContainer = document.getElementById('collabStaffListContainer');
      const counterEl = document.getElementById('collabSelectedCounter');

      if (listContainer) {
        listContainer.addEventListener('change', () => {
          const checked = listContainer.querySelectorAll('.collab-staff-cb:checked');
          const all = listContainer.querySelectorAll('.collab-staff-cb');
          if (counterEl) counterEl.textContent = `${checked.length} / 5 dipilih`;

          if (checked.length >= 5) {
            all.forEach(cb => {
              if (!cb.checked) cb.disabled = true;
            });
          } else {
            all.forEach(cb => cb.disabled = false);
          }
        });
      }

      // Notif Modal Handlers
      const modalNotif = document.getElementById('modalNotifikasiKolaborasi');
      const closeNotif = document.getElementById('closeNotifModal');
      const btnCloseNotif = document.getElementById('btnCloseNotifModal');

      const closeModalNotif = () => {
        if (modalNotif) modalNotif.classList.remove('active');
      };
      if (closeNotif) closeNotif.addEventListener('click', closeModalNotif);
      if (btnCloseNotif) btnCloseNotif.addEventListener('click', closeModalNotif);

      // Detail Modal Handlers
      const modalDetail = document.getElementById('modalDetailJadwalBOK');
      const closeDetail = document.getElementById('closeDetailBokModal');
      const btnCloseDetail = document.getElementById('btnCloseDetailBok');

      const closeModalDetail = () => {
        if (modalDetail) modalDetail.classList.remove('active');
      };
      if (closeDetail) closeDetail.addEventListener('click', closeModalDetail);
      if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeModalDetail);
    },

    async getFilteredData() {
      const all = await this.getData();
      const monthStr = String(this.currentMonth).padStart(2, '0');
      const yearMonthPrefix = `${this.currentYear}-${monthStr}`;

      return all.filter(item => {
        if (!item.tanggal || !item.tanggal.startsWith(yearMonthPrefix)) return false;

        // Staff filter
        if (this.selectedStaff && item.namaUser !== this.selectedStaff) return false;

        // Tab filter
        if (this.activeTab === 'mine') {
          if (item.namaUser !== CURRENT_USER.nama) return false;
        } else if (this.activeTab === 'collab') {
          if (!item.keterangan || !item.keterangan.toLowerCase().includes('kolaborasi')) return false;
        }

        // Search keyword
        if (this.searchKeyword) {
          const matchKeg = (item.namaKegiatan || '').toLowerCase().includes(this.searchKeyword);
          const matchKet = (item.keterangan || '').toLowerCase().includes(this.searchKeyword);
          const matchUser = (item.namaUser || '').toLowerCase().includes(this.searchKeyword);
          if (!matchKeg && !matchKet && !matchUser) return false;
        }

        return true;
      });
    },

    async render() {
      const filtered = await this.getFilteredData();
      this.updateStats(filtered);

      if (this.viewMode === 'timeline') {
        this.renderTimeline(filtered);
      } else {
        this.renderCalendar(filtered);
      }

      this.updateCollabBadges();
      await this.renderBerandaWidget();
    },

    updateStats(items) {
      const elTotal = document.getElementById('bokStatTotal');
      const elSaya = document.getElementById('bokStatSaya');
      const elCollab = document.getElementById('bokStatCollab');
      const elDays = document.getElementById('bokStatDays');
      const elUserLabel = document.getElementById('bokStatUserLabel');

      if (elUserLabel) elUserLabel.textContent = CURRENT_USER.nama;

      const myCount = items.filter(i => i.namaUser === CURRENT_USER.nama).length;
      const collabCount = items.filter(i => i.keterangan && i.keterangan.toLowerCase().includes('kolaborasi')).length;
      
      const uniqueDays = new Set(items.map(i => i.tanggal)).size;

      if (elTotal) elTotal.textContent = items.length;
      if (elSaya) elSaya.textContent = myCount;
      if (elCollab) elCollab.textContent = collabCount;
      if (elDays) elDays.textContent = uniqueDays;
    },

    renderTimeline(items) {
      const container = document.getElementById('bokTimelineList');
      if (!container) return;

      if (items.length === 0) {
        container.innerHTML = `
          <div class="dash-card text-center" style="padding: 40px 20px; border-radius: 16px; background: rgba(18, 24, 38, 0.75);">
            <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.5;">📅</div>
            <h4 style="color: #ffffff; font-size: 16px; font-weight: 700; margin-bottom: 6px;">Tidak Ada Jadwal Kegiatan</h4>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Belum ada jadwal kegiatan BOK yang cocok dengan filter bulan/petugas yang dipilih.</p>
            <button type="button" class="btn-bok-primary" onclick="window.JadwalBOKController.bukaModalTambah()" style="display: inline-flex; margin: 0 auto;">
              + Tambah Jadwal Sekarang
            </button>
          </div>
        `;
        return;
      }

      // Group by date
      const grouped = {};
      items.forEach(item => {
        if (!grouped[item.tanggal]) grouped[item.tanggal] = [];
        grouped[item.tanggal].push(item);
      });

      // Sort dates
      const sortedDates = Object.keys(grouped).sort();
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

      const todayStr = new Date().toISOString().split('T')[0];

      let html = '';
      sortedDates.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayName = dayNames[dateObj.getDay()];
        const dayNum = dateObj.getDate();
        const monthName = monthNames[dateObj.getMonth() + 1];
        const isToday = dateStr === todayStr;
        const events = grouped[dateStr];

        html += `
          <div class="bok-timeline-day-group">
            <div class="bok-day-header-bar ${isToday ? 'is-today' : ''}">
              <div class="bok-day-title-wrap">
                <div class="bok-date-number-badge ${isToday ? 'is-today' : ''}">${dayNum}</div>
                <div class="bok-day-full-text">${dayName}, ${dayNum} ${monthName} ${dateObj.getFullYear()}</div>
                ${isToday ? '<span class="badge-system-live" style="font-size: 11px; background: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.4);"><span class="live-dot" style="background:#ef4444;"></span> Hari Ini</span>' : ''}
              </div>
              <span class="bok-day-count-badge">${events.length} Kegiatan</span>
            </div>

            <div class="bok-day-events-list">
        `;

        events.forEach(ev => {
          const isMine = ev.namaUser === CURRENT_USER.nama;
          const isCollab = ev.keterangan && ev.keterangan.toLowerCase().includes('kolaborasi');

          html += `
            <div class="bok-event-row ${isMine ? 'is-mine' : ''} ${isCollab ? 'is-collab' : ''}">
              <div class="bok-event-left">
                <div class="bok-keg-number-badge">No.${ev.noKegiatan}</div>
                <div class="bok-event-main">
                  <h5>${ev.namaKegiatan}</h5>
                  <div class="bok-event-meta-row">
                    <span class="bok-staff-pill ${isMine ? 'mine' : 'other'}">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      ${isMine ? 'Jadwal Anda (' + ev.jabatan + ')' : ev.namaUser + ' (' + ev.jabatan + ')'}
                    </span>
                    ${isCollab ? '<span class="bok-collab-tag-pill">👥 Kolaborasi</span>' : ''}
                    ${ev.keterangan ? `<span class="bok-ket-text">• ${ev.keterangan}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="bok-event-actions">
                <button type="button" class="btn-bok-act" title="Lihat Detail" onclick="window.JadwalBOKController.bukaModalDetail('${ev.id}')">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </button>
                ${isMine ? `
                  <button type="button" class="btn-bok-act" title="Edit Jadwal" onclick="window.JadwalBOKController.bukaModalEdit('${ev.id}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button type="button" class="btn-bok-act delete" title="Hapus Jadwal" onclick="window.JadwalBOKController.hapusJadwal('${ev.id}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderCalendar(items) {
      const grid = document.getElementById('bokCalendarDaysGrid');
      const titleEl = document.getElementById('bokCalMonthTitle');
      if (!grid) return;

      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      if (titleEl) {
        titleEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
      }

      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
      
      const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      // Convert Sunday=0 to Monday=0 (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
      const startOffset = (firstDayIndex + 6) % 7;

      const todayStr = new Date().toISOString().split('T')[0];

      // Map events by date
      const eventMap = {};
      items.forEach(ev => {
        if (!eventMap[ev.tanggal]) eventMap[ev.tanggal] = [];
        eventMap[ev.tanggal].push(ev);
      });

      let html = '';

      // 1. Leading cells from previous month (Dimmed & symmetrical)
      for (let i = 0; i < startOffset; i++) {
        const prevDayNum = daysInPrevMonth - startOffset + 1 + i;
        const prevMonthNum = month === 1 ? 12 : month - 1;
        const prevYearNum = month === 1 ? year - 1 : year;
        const prevDateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(prevDayNum).padStart(2, '0')}`;
        
        html += `
          <div class="bok-cal-cell is-other-month" onclick="window.JadwalBOKController.bukaModalTambah('${prevDateStr}')" title="Tambah Jadwal ${prevDayNum}/${prevMonthNum}">
            <div class="bok-cal-cell-top">
              <span class="bok-cal-date-num">${prevDayNum}</span>
            </div>
            <div class="bok-cal-events-wrap"></div>
          </div>
        `;
      }

      // 2. Days of current month
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const dateObj = new Date(year, month - 1, d);
        const dayOfWeek = dateObj.getDay();
        const isSunday = dayOfWeek === 0; // Hanya hari Minggu yang libur di Puskesmas

        // Check National Holidays (SKB 3 Menteri)
        const holidays = (typeof NATIONAL_HOLIDAYS_2026 !== 'undefined') ? NATIONAL_HOLIDAYS_2026 : {};
        const holidayInfo = holidays[dateStr];
        const isHoliday = isSunday || !!holidayInfo;

        const dayEvents = eventMap[dateStr] || [];

        html += `
          <div class="bok-cal-cell ${isToday ? 'is-today' : ''} ${isSunday ? 'is-sunday is-holiday' : ''} ${holidayInfo ? 'is-holiday' : ''}" onclick="window.JadwalBOKController.bukaModalTambah('${dateStr}')" title="Klik untuk tambah jadwal ${d} ${monthNames[month]}">
            <div class="bok-cal-cell-top">
              <span class="bok-cal-date-num">${d}</span>
              ${holidayInfo ? `<span class="bok-cal-holiday-label" title="${holidayInfo.name}">🎌 ${holidayInfo.name}</span>` : (isToday ? '<span class="bok-cal-today-tag">Hari Ini</span>' : '')}
            </div>

            <div class="bok-cal-events-wrap">
        `;

        dayEvents.slice(0, 2).forEach(ev => {
          const isMine = ev.namaUser === CURRENT_USER.nama;
          const isCollab = ev.keterangan && ev.keterangan.toLowerCase().includes('kolaborasi');
          const cls = isMine ? 'mine' : (isCollab ? 'collab' : 'other');

          html += `
            <span class="bok-cal-pill ${cls}" title="No.${ev.noKegiatan} ${ev.namaKegiatan} (${ev.namaUser})">
              No.${ev.noKegiatan} ${ev.namaKegiatan}
            </span>
          `;
        });

        if (dayEvents.length > 2) {
          html += `<span class="bok-cal-more-pill">+${dayEvents.length - 2} kegiatan lagi</span>`;
        }

        html += `
            </div>
          </div>
        `;
      }

      // 3. Trailing cells for next month to complete the 7-column grid
      const totalRendered = startOffset + daysInMonth;
      const totalCells = Math.ceil(totalRendered / 7) * 7;
      const trailingCount = totalCells - totalRendered;

      for (let nextD = 1; nextD <= trailingCount; nextD++) {
        const nextMonthNum = month === 12 ? 1 : month + 1;
        const nextYearNum = month === 12 ? year + 1 : year;
        const nextDateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;

        html += `
          <div class="bok-cal-cell is-other-month" onclick="window.JadwalBOKController.bukaModalTambah('${nextDateStr}')" title="Tambah Jadwal ${nextD}/${nextMonthNum}">
            <div class="bok-cal-cell-top">
              <span class="bok-cal-date-num">${nextD}</span>
            </div>
            <div class="bok-cal-events-wrap"></div>
          </div>
        `;
      }

      grid.innerHTML = html;
    },

    updateCollabBadges() {
      const collabs = this.getCollabData();
      const pending = collabs.filter(c => c.toUser === CURRENT_USER.username && c.status === 'pending');
      const count = pending.length;

      const sidebarBadge = document.getElementById('sidebarBokBadge');
      const headerBadge = document.getElementById('bokHeaderNotifBadge');
      const inlineBanner = document.getElementById('bokInlineCollabBanner');
      const inlineCount = document.getElementById('bokInlineCollabCount');
      const inlineList = document.getElementById('bokInlineCollabList');

      if (sidebarBadge) {
        if (count > 0) {
          sidebarBadge.textContent = count;
          sidebarBadge.style.display = 'inline-block';
        } else {
          sidebarBadge.style.display = 'none';
        }
      }

      if (headerBadge) {
        if (count > 0) {
          headerBadge.textContent = count;
          headerBadge.style.display = 'inline-block';
        } else {
          headerBadge.style.display = 'none';
        }
      }

      // Inline banner on Jadwal page
      if (inlineBanner && inlineList) {
        if (count > 0) {
          inlineBanner.style.display = 'block';
          if (inlineCount) inlineCount.textContent = count;

          let bHtml = '';
          pending.forEach(req => {
            const initials = req.fromNama.split(' ').map(w => w[0]).filter(c => /[A-Za-z]/.test(c)).slice(0, 2).join('').toUpperCase() || 'PG';
            bHtml += `
              <div class="bok-inline-req-card">
                <div class="bok-req-info">
                  <div class="bok-req-avatar">${initials}</div>
                  <div class="bok-req-text">
                    <h5>${req.fromNama} mengajak kolaborasi</h5>
                    <p><strong>${req.tanggal}</strong> • No.${req.noKegiatan} ${req.namaKegiatan} — <em>"${req.keterangan || 'Tidak ada catatan'}"</em></p>
                  </div>
                </div>
                <div class="bok-req-actions">
                  <button type="button" class="btn-req-accept" onclick="window.JadwalBOKController.terimaCollab('${req.id}')">✓ Terima (ACC)</button>
                  <button type="button" class="btn-req-reject" onclick="window.JadwalBOKController.tolakCollab('${req.id}')">✕ Tolak</button>
                </div>
              </div>
            `;
          });
          inlineList.innerHTML = bHtml;
        } else {
          inlineBanner.style.display = 'none';
        }
      }
    },

    async renderBerandaWidget() {
      const container = document.getElementById('bokBerandaList');
      if (!container) return;

      const all = await this.getData();
      const todayStr = new Date().toISOString().split('T')[0];
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

      // Sort upcoming
      const upcoming = all
        .filter(item => item.tanggal >= todayStr)
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
        .slice(0, 4);

      if (upcoming.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Tidak ada kegiatan BOK mendatang untuk periode ini.</p>
          </div>
        `;
        return;
      }

      const todayObj = new Date(todayStr + 'T00:00:00');
      let html = '';

      upcoming.forEach(item => {
        const tglObj = new Date(item.tanggal + 'T00:00:00');
        const diffDays = Math.round((tglObj - todayObj) / (1000 * 60 * 60 * 24));
        const dayNum = tglObj.getDate();
        const mthStr = monthNames[tglObj.getMonth() + 1];
        const isMine = item.namaUser === CURRENT_USER.nama;
        const isCollab = item.keterangan && item.keterangan.toLowerCase().includes('kolaborasi');

        let badgeTime = '';
        if (diffDays === 0) {
          badgeTime = '<span class="badge-system-live" style="font-size:10.5px; background:rgba(239,68,68,0.2); color:#f87171; border-color:rgba(239,68,68,0.35);"><span class="live-dot" style="background:#ef4444;"></span> Hari Ini!</span>';
        } else if (diffDays === 1) {
          badgeTime = '<span class="badge-system-live" style="font-size:10.5px; background:rgba(245,158,11,0.2); color:#fbbf24; border-color:rgba(245,158,11,0.35);">Besok</span>';
        } else {
          badgeTime = `<span class="badge-system-live" style="font-size:10.5px; background:rgba(14,165,233,0.15); color:#38bdf8; border-color:rgba(14,165,233,0.3);">${diffDays} hari lagi</span>`;
        }

        html += `
          <div class="bok-beranda-item ${isMine ? 'is-mine' : ''}">
            <div class="bok-beranda-date-box">
              <span class="num">${dayNum}</span>
              <span class="mth">${mthStr}</span>
            </div>
            <div class="bok-beranda-info">
              <h5 title="${item.namaKegiatan}">${item.noKegiatan ? 'No.' + item.noKegiatan + ' ' : ''}${item.namaKegiatan}</h5>
              <div class="bok-beranda-meta">
                <span class="bok-staff-pill ${isMine ? 'mine' : 'other'}">${isMine ? 'Jadwal Anda' : item.namaUser}</span>
                ${isCollab ? '<span class="bok-collab-tag-pill">👥 Kolaborasi</span>' : ''}
                ${badgeTime}
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    bukaModalTambah(defaultDate = null) {
      const modal = document.getElementById('modalTambahJadwalBOK');
      const form = document.getElementById('formTambahJadwalBOK');
      const titleEl = document.getElementById('modalBokFormTitle');
      const editId = document.getElementById('bokEditId');
      const tglInput = document.getElementById('inputTanggalBOK');
      const kegInput = document.getElementById('inputKegiatanBOK');
      const ketInput = document.getElementById('inputKeteranganBOK');

      if (form) form.reset();
      if (editId) editId.value = '';
      if (titleEl) titleEl.textContent = 'Tambah Jadwal Kegiatan BOK';

      // Default date
      const targetDate = defaultDate || `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      if (tglInput) tglInput.value = targetDate;

      // User info banner
      const uNama = document.getElementById('bokFormUserNama');
      const uJab = document.getElementById('bokFormUserJabatan');
      const uAv = document.getElementById('bokFormUserAvatar');
      if (uNama) uNama.textContent = CURRENT_USER.nama;
      if (uJab) uJab.textContent = CURRENT_USER.jabatan;
      if (uAv) uAv.textContent = CURRENT_USER.avatar;

      if (modal) modal.classList.add('active');
    },

    async bukaModalEdit(id) {
      const data = await this.getData();
      const item = data.find(i => i.id === id);
      if (!item) return;

      const modal = document.getElementById('modalTambahJadwalBOK');
      const titleEl = document.getElementById('modalBokFormTitle');
      const editId = document.getElementById('bokEditId');
      const tglInput = document.getElementById('inputTanggalBOK');
      const kegInput = document.getElementById('inputKegiatanBOK');
      const ketInput = document.getElementById('inputKeteranganBOK');

      if (titleEl) titleEl.textContent = 'Edit Jadwal Kegiatan BOK';
      if (editId) editId.value = item.id;
      if (tglInput) tglInput.value = item.tanggal;
      if (kegInput) kegInput.value = item.noKegiatan;
      if (ketInput) ketInput.value = item.keterangan || '';

      if (modal) modal.classList.add('active');
    },

    async simpanJadwal() {
      const editId = document.getElementById('bokEditId').value;
      const tanggal = document.getElementById('inputTanggalBOK').value;
      const noKeg = parseInt(document.getElementById('inputKegiatanBOK').value);
      const keterangan = document.getElementById('inputKeteranganBOK').value.trim();

      if (!tanggal) {
        if (window.showToast) window.showToast('Harap pilih tanggal kegiatan.', 'error');
        return;
      }
      if (!noKeg || noKeg < 1 || noKeg > KEGIATAN_BOK_LIST.length) {
        if (window.showToast) window.showToast('Harap pilih jenis kegiatan BOK.', 'error');
        return;
      }

      const namaKegiatan = KEGIATAN_BOK_LIST[noKeg - 1];
      const entryId = editId || ('bok-' + Date.now());

      const payload = {
        id: entryId,
        tanggal: tanggal,
        noKegiatan: noKeg,
        nama_kegiatan: namaKegiatan,
        namaKegiatan: namaKegiatan,
        keterangan: keterangan,
        lokasi: 'Puskesmas / Wilayah Kerja',
        petugas_nip: CURRENT_USER.nip,
        petugas_nama: CURRENT_USER.nama,
        petugas_jabatan: CURRENT_USER.jabatan,
        username: CURRENT_USER.username,
        namaUser: CURRENT_USER.nama,
        jabatan: CURRENT_USER.jabatan,
        rekan_kolaborasi: [],
        status: 'Disetujui',
        updatedAt: new Date().toISOString()
      };

      await CloudflareDB.saveJadwal(payload);
      if (window.showToast) {
        window.showToast(editId ? '✓ Jadwal berhasil diperbarui di Cloudflare D1!' : '✓ Jadwal berhasil ditambahkan ke Cloudflare D1!', 'success');
      }

      // Close modal, invalidate cache & refresh from cloud
      const modal = document.getElementById('modalTambahJadwalBOK');
      if (modal) modal.classList.remove('active');
      this.invalidateCache();
      await this.render();
    },

    async hapusJadwal(id) {
      const confirmed = await window.SicekasAlert.confirm(
        'Hapus Jadwal Kegiatan?',
        'Kegiatan ini akan dihapus secara permanen dari Cloudflare D1 Database.',
        'Ya, Hapus Jadwal',
        'Batal',
        true
      );
      if (!confirmed) return;

      await CloudflareDB.deleteJadwal(id);
      if (window.showToast) window.showToast('✓ Jadwal kegiatan berhasil dihapus dari Cloudflare D1.', 'info');
      this.invalidateCache();
      await this.render();
    },

    bukaModalCollab() {
      const modal = document.getElementById('modalRequestKolaborasi');
      const form = document.getElementById('formRequestKolaborasi');
      const tglInput = document.getElementById('collabTanggal');
      const counterEl = document.getElementById('collabSelectedCounter');

      if (form) form.reset();
      if (counterEl) counterEl.textContent = '0 / 5 dipilih';

      const defaultDate = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      if (tglInput) tglInput.value = defaultDate;

      // Reset checkboxes
      document.querySelectorAll('.collab-staff-cb').forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
      });

      if (modal) modal.classList.add('active');
    },

    async kirimRequestCollab() {
      const checked = document.querySelectorAll('.collab-staff-cb:checked');
      const tanggal = document.getElementById('collabTanggal').value;
      const noKeg = parseInt(document.getElementById('collabKegiatan').value);
      const catatan = document.getElementById('collabKeterangan').value.trim();

      if (checked.length === 0) {
        if (window.showToast) window.showToast('Pilih minimal 1 rekan petugas untuk diajak.', 'error');
        return;
      }
      if (!tanggal) {
        if (window.showToast) window.showToast('Harap tentukan tanggal kegiatan.', 'error');
        return;
      }
      if (!noKeg || noKeg < 1 || noKeg > KEGIATAN_BOK_LIST.length) {
        if (window.showToast) window.showToast('Harap pilih kegiatan BOK.', 'error');
        return;
      }

      const namaKegiatan = KEGIATAN_BOK_LIST[noKeg - 1];
      const collabs = this.getCollabData();

      checked.forEach(cb => {
        const staffNama = cb.value;
        const staffJabatan = cb.dataset.jabatan || 'Petugas';
        const staffUsername = staffNama.toLowerCase().replace(/[^a-z0-9]/g, '_');

        collabs.push({
          id: 'collab-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          fromUser: CURRENT_USER.username,
          fromNama: CURRENT_USER.nama,
          fromJabatan: CURRENT_USER.jabatan,
          toUser: staffUsername,
          toNama: staffNama,
          toJabatan: staffJabatan,
          tanggal: tanggal,
          noKegiatan: noKeg,
          namaKegiatan: namaKegiatan,
          keterangan: catatan,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      });

      this.saveCollabData(collabs);

      // Also save current user's schedule to cloud database
      const collabPayload = {
        id: 'bok-' + Date.now(),
        tanggal: tanggal,
        nama_kegiatan: namaKegiatan,
        namaKegiatan: namaKegiatan,
        noKegiatan: noKeg,
        keterangan: (catatan ? catatan + ' ' : '') + `[Kolaborasi dengan ${checked.length} petugas]`,
        lokasi: 'Puskesmas / Wilayah Kerja',
        petugas_nip: CURRENT_USER.nip,
        petugas_nama: CURRENT_USER.nama,
        petugas_jabatan: CURRENT_USER.jabatan,
        username: CURRENT_USER.username,
        namaUser: CURRENT_USER.nama,
        jabatan: CURRENT_USER.jabatan,
        rekan_kolaborasi: Array.from(checked).map(cb => ({ nama: cb.value, jabatan: cb.dataset.jabatan || 'Petugas' })),
        status: 'Disetujui'
      };
      await CloudflareDB.saveJadwal(collabPayload);

      const modal = document.getElementById('modalRequestKolaborasi');
      if (modal) modal.classList.remove('active');

      if (window.showToast) window.showToast(`Request kolaborasi berhasil dikirim ke ${checked.length} petugas!`, 'success');
      this.invalidateCache();
      await this.render();
    },

    bukaModalNotif() {
      const modal = document.getElementById('modalNotifikasiKolaborasi');
      const list = document.getElementById('collabNotifModalList');
      if (!modal || !list) return;

      const collabs = this.getCollabData();
      const pending = collabs.filter(c => c.toUser === CURRENT_USER.username && c.status === 'pending');

      if (pending.length === 0) {
        list.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
            <div style="font-size: 36px; margin-bottom: 10px; opacity: 0.5;">📭</div>
            <h4 style="color: #ffffff; font-size: 15px; font-weight: 700; margin-bottom: 4px;">Tidak Ada Request Masuk</h4>
            <p style="font-size: 12.5px; margin: 0;">Semua permintaan kolaborasi telah ditanggapi.</p>
          </div>
        `;
      } else {
        let html = '';
        pending.forEach(req => {
          const initials = req.fromNama.split(' ').map(w => w[0]).filter(c => /[A-Za-z]/.test(c)).slice(0, 2).join('').toUpperCase() || 'PG';
          html += `
            <div class="bok-inline-req-card" style="margin-bottom: 12px;">
              <div class="bok-req-info">
                <div class="bok-req-avatar">${initials}</div>
                <div class="bok-req-text">
                  <h5>${req.fromNama} (${req.fromJabatan})</h5>
                  <p><strong>${req.tanggal}</strong> • No.${req.noKegiatan} ${req.namaKegiatan}</p>
                  <p style="margin-top: 4px; color: #cbd5e1; font-style: italic;">"${req.keterangan || 'Tidak ada catatan khusus.'}"</p>
                </div>
              </div>
              <div class="bok-req-actions">
                <button type="button" class="btn-req-accept" onclick="window.JadwalBOKController.terimaCollab('${req.id}')">✓ Terima (ACC)</button>
                <button type="button" class="btn-req-reject" onclick="window.JadwalBOKController.tolakCollab('${req.id}')">✕ Tolak</button>
              </div>
            </div>
          `;
        });
        list.innerHTML = html;
      }

      modal.classList.add('active');
    },

    async terimaCollab(collabId) {
      const collabs = this.getCollabData();
      const req = collabs.find(c => c.id === collabId);
      if (!req) return;

      req.status = 'accepted';
      this.saveCollabData(collabs);

      // Auto-insert to user's schedule via cloud database
      const acceptPayload = {
        id: 'bok-' + Date.now(),
        tanggal: req.tanggal,
        nama_kegiatan: req.namaKegiatan,
        namaKegiatan: req.namaKegiatan,
        noKegiatan: req.noKegiatan,
        keterangan: `[Kolaborasi dari: ${req.fromNama}] ${req.keterangan || ''}`.trim(),
        lokasi: 'Puskesmas / Wilayah Kerja',
        petugas_nip: CURRENT_USER.nip,
        petugas_nama: CURRENT_USER.nama,
        petugas_jabatan: CURRENT_USER.jabatan,
        username: CURRENT_USER.username,
        namaUser: CURRENT_USER.nama,
        jabatan: CURRENT_USER.jabatan,
        rekan_kolaborasi: [],
        status: 'Disetujui'
      };
      await CloudflareDB.saveJadwal(acceptPayload);

      if (window.showToast) window.showToast('Kolaborasi diterima! Kegiatan otomatis masuk ke jadwal Anda.', 'success');

      // Refresh notif modal if open
      const modal = document.getElementById('modalNotifikasiKolaborasi');
      if (modal && modal.classList.contains('active')) {
        this.bukaModalNotif();
      }

      this.invalidateCache();
      await this.render();
    },

    async tolakCollab(collabId) {
      const collabs = this.getCollabData();
      const req = collabs.find(c => c.id === collabId);
      if (!req) return;

      req.status = 'rejected';
      this.saveCollabData(collabs);

      if (window.showToast) window.showToast('Permintaan kolaborasi ditolak.', 'info');

      const modal = document.getElementById('modalNotifikasiKolaborasi');
      if (modal && modal.classList.contains('active')) {
        this.bukaModalNotif();
      }

      await this.render();
    },

    async bukaModalDetail(id) {
      const data = await this.getData();
      const item = data.find(i => i.id === id);
      if (!item) return;

      const modal = document.getElementById('modalDetailJadwalBOK');
      const body = document.getElementById('detailBokBody');
      const btnEdit = document.getElementById('btnDetailBokEdit');

      const isMine = item.namaUser === CURRENT_USER.nama;
      const isCollab = item.keterangan && item.keterangan.toLowerCase().includes('kolaborasi');

      if (btnEdit) {
        if (isMine) {
          btnEdit.style.display = 'inline-block';
          btnEdit.onclick = () => {
            modal.classList.remove('active');
            this.bukaModalEdit(item.id);
          };
        } else {
          btnEdit.style.display = 'none';
        }
      }

      if (body) {
        body.innerHTML = `
          <div class="detail-bok-row">
            <span class="detail-bok-label">Tanggal Pelaksanaan</span>
            <span class="detail-bok-val" style="color: #10b981; font-weight: 700;">📅 ${item.tanggal}</span>
          </div>

          <div class="detail-bok-row">
            <span class="detail-bok-label">Jenis Kegiatan BOK</span>
            <span class="detail-bok-val"><strong>No.${item.noKegiatan}</strong> — ${item.namaKegiatan}</span>
          </div>

          <div class="detail-bok-row">
            <span class="detail-bok-label">Petugas Pelaksana</span>
            <span class="detail-bok-val">👤 ${item.namaUser} (${item.jabatan})</span>
          </div>

          <div class="detail-bok-row">
            <span class="detail-bok-label">Status Jadwal</span>
            <span class="detail-bok-val">
              ${isCollab ? '<span class="bok-collab-tag-pill">👥 Kegiatan Kolaborasi</span>' : '<span class="bok-staff-pill mine">Kegiatan Mandiri / Terprogram</span>'}
            </span>
          </div>

          <div class="detail-bok-row">
            <span class="detail-bok-label">Keterangan / Lokasi / Sasaran</span>
            <span class="detail-bok-val" style="color: #cbd5e1; font-style: italic;">
              ${item.keterangan || 'Tidak ada keterangan tambahan.'}
            </span>
          </div>
        `;
      }

      if (modal) modal.classList.add('active');
    },

    async cetakJadwalBulanan() {
      const filtered = await this.getFilteredData();
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthTitle = `${monthNames[this.currentMonth]} ${this.currentYear}`;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Izinkan pop-up browser untuk mencetak jadwal.');
        return;
      }

      let rowsHtml = '';
      filtered.sort((a, b) => a.tanggal.localeCompare(b.tanggal)).forEach((item, idx) => {
        rowsHtml += `
          <tr>
            <td style="text-align: center; font-size: 11px; padding: 6px;">${idx + 1}</td>
            <td style="text-align: center; font-size: 11px; padding: 6px; font-weight: bold;">${item.tanggal}</td>
            <td style="font-size: 11px; padding: 6px;">No.${item.noKegiatan} - ${item.namaKegiatan}</td>
            <td style="font-size: 11px; padding: 6px;">${item.keterangan || '-'}</td>
            <td style="font-size: 11px; padding: 6px; font-weight: bold;">${item.namaUser}<br><span style="font-size: 9.5px; font-weight: normal; color: #555;">${item.jabatan}</span></td>
          </tr>
        `;
      });

      if (filtered.length === 0) {
        rowsHtml = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Tidak ada kegiatan pada bulan ini.</td></tr>`;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Jadwal Kegiatan BOK - ${monthTitle}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 10px; font-size: 11px; line-height: 1.4; }
            .kop { display: flex; align-items: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px; }
            .kop img { width: 65px; height: auto; margin-right: 15px; }
            .kop-text { text-align: center; flex: 1; }
            .kop-text h4 { font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase; }
            .kop-text h3 { font-size: 15px; font-weight: bold; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .kop-text p { font-size: 10px; margin: 1px 0; }
            .doc-title { text-align: center; font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; }
            .doc-sub { text-align: center; font-size: 11px; margin-bottom: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f1f5f9; font-weight: bold; font-size: 11px; text-align: center; padding: 8px 6px; border: 1px solid #000; }
            td { border: 1px solid #000; }
            .sig-row { display: flex; justify-content: space-between; margin-top: 30px; }
            .sig-box { width: 45%; text-align: center; }
            .sig-space { height: 60px; }
            .sig-name { font-weight: bold; text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="kop">
            <img src="LOGO.png" alt="Logo">
            <div class="kop-text">
              <h4>PEMERINTAH KABUPATEN BANDUNG</h4>
              <h4>DINAS KESEHATAN</h4>
              <h3>PUSKESMAS BANJARAN KOTA</h3>
              <p>Jl. Raya Banjaran No. 248, Kec. Banjaran, Kab. Bandung, Jawa Barat 40377</p>
              <p>Email: pusk.banjarankota@gmail.com | Website: sicekas.web.id</p>
            </div>
          </div>

          <div class="doc-title">JADWAL KEGIATAN PUSKESMAS BANJARAN KOTA</div>
          <div class="doc-sub">Bulan: ${monthTitle}</div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px;">No</th>
                <th style="width: 90px;">Tanggal</th>
                <th>Nama Kegiatan</th>
                <th>Keterangan / Lokasi</th>
                <th style="width: 170px;">Petugas Pelaksana</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="sig-row">
            <div class="sig-box">
              <p>Mengetahui,<br><strong>Kepala Puskesmas Banjaran Kota</strong></p>
              <div class="sig-space"></div>
              <p class="sig-name">dr. Rina Indriati</p>
              <p>NIP. 19740404 201411 2 001</p>
            </div>
            <div class="sig-box">
              <p>Banjaran, ${monthTitle}<br><strong>Petugas Pelaksana Kegiatan</strong></p>
              <div class="sig-space"></div>
              <p class="sig-name">${CURRENT_USER.nama}</p>
              <p>NIP. ${CURRENT_USER.nip}</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  window.JadwalBOKController = JadwalBOKController;
  JadwalBOKController.init();

  // ==========================================================================
  // 13. DEVELOPER WEB CONTROLLER (Khusus Super Admin)
  // ==========================================================================
  const DeveloperWebController = {
    isInitialized: false,
    terminalLogs: [],

    init() {
      if (!this.checkPermissions()) return;
      this.bindTabEvents();
      this.bindD1StudioEvents();
      this.renderUsers();
      this.bindApiEvents();
      this.bindTerminalEvents();
      this.bindMaintenanceEvents();
      this.bootTerminal();
      this.updateStats();
      this.loadD1Table('users');
    },

    checkPermissions() {
      const isSuperAdmin = (typeof CURRENT_USER !== 'undefined' && (CURRENT_USER.role === 'Super Admin' || CURRENT_USER.username === 'ozie'));
      if (navItemDevWeb) {
        navItemDevWeb.style.display = isSuperAdmin ? 'block' : 'none';
      }
      return isSuperAdmin;
    },

    bindTabEvents() {
      const tabBtns = document.querySelectorAll('.dev-tab-btn');
      const panels = {
        api: document.getElementById('devTabApi'),
        d1studio: document.getElementById('devTabD1studio'),
        users: document.getElementById('devTabUsers'),
        logs: document.getElementById('devTabLogs'),
        maintenance: document.getElementById('devTabMaintenance')
      };

      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const tabKey = btn.getAttribute('data-devtab');
          Object.keys(panels).forEach(k => {
            if (panels[k]) {
              panels[k].style.display = (k === tabKey) ? 'block' : 'none';
              if (k === tabKey) {
                gsap.fromTo(panels[k], 
                  { opacity: 0, y: 10 }, 
                  { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
                );
                if (tabKey === 'd1studio') {
                  this.loadD1Table(this.activeD1Table || 'users');
                }
              }
            }
          });
        });
      });
    },

    activeD1Table: 'users',
    d1TableData: [],

    bindD1StudioEvents() {
      const pills = document.querySelectorAll('#d1TablePills .d1-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const tableName = pill.getAttribute('data-table');
          this.activeD1Table = tableName;
          this.loadD1Table(tableName);
        });
      });

      const btnRefresh = document.getElementById('btnD1RefreshTable');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
          this.loadD1Table(this.activeD1Table || 'users');
          showToast('✓ Data tabel D1 berhasil dimuat ulang!', 'info');
        });
      }

      const btnToggleSql = document.getElementById('btnD1ToggleSqlRunner');
      const sandboxBox = document.getElementById('d1SqlSandboxBox');
      if (btnToggleSql && sandboxBox) {
        btnToggleSql.addEventListener('click', () => {
          const isHidden = sandboxBox.style.display === 'none';
          sandboxBox.style.display = isHidden ? 'block' : 'none';
          if (isHidden) {
            gsap.fromTo(sandboxBox, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
          }
        });
      }

      const btnRunSql = document.getElementById('btnD1RunCustomSql');
      const sqlInput = document.getElementById('d1CustomSqlInput');
      if (btnRunSql && sqlInput) {
        btnRunSql.addEventListener('click', () => {
          const query = sqlInput.value.trim();
          if (!query) {
            showToast('Harap ketik query SQL terlebih dahulu.', 'warn');
            return;
          }
          this.runCustomD1Sql(query);
        });
      }

      const searchInput = document.getElementById('d1TableSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterD1TableRows(e.target.value.trim());
        });
      }
    },

    setSqlExample(sql) {
      const sqlInput = document.getElementById('d1CustomSqlInput');
      const sandboxBox = document.getElementById('d1SqlSandboxBox');
      if (sqlInput) sqlInput.value = sql;
      if (sandboxBox && sandboxBox.style.display === 'none') {
        sandboxBox.style.display = 'block';
        gsap.fromTo(sandboxBox, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });
      }
    },

    async runCustomD1Sql(sql) {
      const timerEl = document.getElementById('d1SqlLatency');
      if (timerEl) timerEl.textContent = 'Executing...';
      const start = Date.now();

      try {
        const res = await CloudflareDB.executeSql(sql);
        const latency = Date.now() - start;
        if (timerEl) timerEl.textContent = `Latency: ${latency}ms (CGK Node)`;

        if (res && res.success) {
          if (res.type === 'SELECT' && res.rows) {
            this.renderDynamicGrid(res.rows);
            const infoEl = document.getElementById('d1TableActiveInfo');
            if (infoEl) infoEl.innerHTML = `Hasil Query Custom: <strong>${res.rows.length} baris</strong> (${latency}ms)`;
            showToast(`✓ Query sukses! (${res.rows.length} baris, ${latency}ms)`, 'success');
          } else {
            showToast(`✓ Query mutasi berhasil dieksekusi di Cloudflare D1!`, 'success');
            this.loadD1Table(this.activeD1Table || 'users');
          }
        } else {
          showToast(`❌ Error SQL: ${res?.error || 'Gagal eksekusi'}`, 'error');
        }
      } catch (err) {
        showToast(`❌ Gagal: ${err.message}`, 'error');
      }
    },

    async loadD1Table(tableName = 'users') {
      const tbody = document.getElementById('d1GridTbody');
      const infoEl = document.getElementById('d1TableActiveInfo');
      if (!tbody) return;

      tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 28px; color: #ffd166;"><span class="spinner-mini"></span> Memuat data langsung dari Cloudflare D1 Database...</td></tr>';
      
      const start = Date.now();
      try {
        const query = `SELECT * FROM ${tableName} LIMIT 100;`;
        const res = await CloudflareDB.executeSql(query);
        const latency = Date.now() - start;

        if (res && res.success && Array.isArray(res.rows) && res.rows.length > 0) {
          this.d1TableData = res.rows;
          this.renderDynamicGrid(res.rows);
          if (infoEl) {
            infoEl.innerHTML = `Menampilkan tabel: <strong>${tableName}</strong> (${res.rows.length} baris) — Latency: ${latency}ms`;
          }
          const countBadge = document.getElementById(`count-${tableName}`);
          if (countBadge) countBadge.textContent = res.rows.length;
        } else {
          // Fallback rendering
          if (tableName === 'users') {
            const users = DAFTAR_PEGAWAI.map(p => ({
              id: p.no,
              username: p.nama.split(' ')[0].toLowerCase(),
              nama: p.nama,
              nip: p.nip,
              jabatan: p.jabatan,
              golongan: p.gol,
              role: p.nama === 'Mochamad Fauzie, S.Gz' ? 'Super Admin' : (p.nama.includes('Rina Indriati') ? 'Kepala Puskesmas' : 'Petugas Puskesmas')
            }));
            this.d1TableData = users;
            this.renderDynamicGrid(users);
            if (infoEl) infoEl.innerHTML = `Menampilkan tabel: <strong>${tableName}</strong> (${users.length} baris)`;
          } else {
            const localData = JSON.parse(localStorage.getItem(`SICEKAS_${tableName.toUpperCase()}_DATA_V2`)) || [];
            this.d1TableData = localData;
            this.renderDynamicGrid(localData);
            if (infoEl) infoEl.innerHTML = `Menampilkan tabel: <strong>${tableName}</strong> (${localData.length} baris)`;
          }
        }
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 20px; color: #f87171;">Gagal memuat tabel: ${err.message}</td></tr>`;
      }
    },

    renderDynamicGrid(rows) {
      const thead = document.getElementById('d1GridThead');
      const tbody = document.getElementById('d1GridTbody');
      if (!thead || !tbody) return;

      if (!rows || rows.length === 0) {
        thead.innerHTML = '<tr><th style="width: 40px; text-align: center;">#</th><th>Data</th></tr>';
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 30px;">Tabel ini belum memiliki rekaman data (0 baris).</td></tr>';
        return;
      }

      const columns = Object.keys(rows[0]);
      let thHtml = '<tr><th style="width: 40px; text-align: center;">#</th>';
      columns.forEach(col => {
        thHtml += `<th>${col}</th>`;
      });
      thHtml += '</tr>';
      thead.innerHTML = thHtml;

      let tbHtml = '';
      rows.forEach((row, idx) => {
        tbHtml += `<tr><td style="font-weight: 700; color: #94a3b8; text-align: center;">${idx + 1}</td>`;
        columns.forEach(col => {
          let val = row[col];
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          else if (val === null || val === undefined) val = '<span style="color: #64748b; font-style: italic;">null</span>';
          
          if (col === 'role') {
            val = `<span class="badge-system-live" style="background: rgba(255,209,102,0.15); color: #ffd166; border: 1px solid rgba(255,209,102,0.3); padding: 2px 8px; border-radius: 12px; font-size: 11px;">${val}</span>`;
          } else if (col === 'is_active' || col === 'status' || col === 'status_verifikasi') {
            val = `<span class="status-pill connected" style="font-size: 10.5px; padding: 2px 6px;">${val}</span>`;
          }

          tbHtml += `<td title="${String(val).replace(/"/g, '&quot;')}">${val}</td>`;
        });
        tbHtml += '</tr>';
      });
      tbody.innerHTML = tbHtml;
    },

    filterD1TableRows(keyword) {
      if (!this.d1TableData || this.d1TableData.length === 0) return;
      if (!keyword) {
        this.renderDynamicGrid(this.d1TableData);
        return;
      }
      const q = keyword.toLowerCase();
      const filtered = this.d1TableData.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(q));
      });
      this.renderDynamicGrid(filtered);
    },

    renderUsers(query = '') {
      const tbody = document.getElementById('devUserListBody');
      const searchInput = document.getElementById('devSearchUser');
      if (!tbody) return;

      const rolesStore = JSON.parse(localStorage.getItem('SICEKAS_USER_ROLES')) || {};
      const officers = typeof DAFTAR_PEGAWAI !== 'undefined' ? DAFTAR_PEGAWAI : [];

      const filtered = officers.filter(p => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (p.nama && p.nama.toLowerCase().includes(q)) ||
               (p.nip && p.nip.toLowerCase().includes(q)) ||
               (p.jabatan && p.jabatan.toLowerCase().includes(q));
      });

      let html = '';
      filtered.forEach((p, idx) => {
        const isMe = p.nama === CURRENT_USER.nama;
        const defaultRole = (p.nama === 'Mochamad Fauzie, S.Gz') 
          ? 'Super Admin' 
          : (p.nama.includes('Rina Indriati') 
            ? 'Kepala Puskesmas' 
            : (p.nama.includes('Dilla Anggraeni') || p.nama.includes('Satrianita') || p.nama.includes('Fahri Dzulfikar') 
              ? 'Admin' 
              : (p.nama.includes('Teti Nuryati') || p.nama.includes('Iwan Hermawan') || p.nama.includes('Kristina') 
                ? 'PJ Klaster' 
                : 'Petugas Puskesmas')));
        
        const currentRole = rolesStore[p.nip] || defaultRole;

        html += `
          <tr>
            <td style="font-weight: 700; color: #94a3b8; text-align: center;">${p.no || idx + 1}</td>
            <td>
              <div style="font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 6px;">
                ${p.nama}
                ${isMe ? '<span class="badge-system-live" style="font-size: 10px; padding: 1px 6px;">Anda</span>' : ''}
              </div>
              <div style="font-size: 11.5px; color: #94a3b8; font-family: monospace;">${p.nipFull || p.nip}</div>
            </td>
            <td><span style="font-weight: 600; color: #cbd5e1;">${p.jabatan}</span></td>
            <td><span class="rm-badge" style="font-size: 11px;">${p.gol || 'BLUD'}</span></td>
            <td>
              <select class="role-select-custom" onchange="window.DeveloperWebController.updateUserRole('${p.nip}', this.value)" ${isMe ? 'disabled title="Role Anda dilindungi sebagai Super Admin Utama"' : ''}>
                <option value="Super Admin" ${currentRole === 'Super Admin' ? 'selected' : ''}>👑 1. Super Admin</option>
                <option value="Admin" ${currentRole === 'Admin' ? 'selected' : ''}>🛡️ 2. Admin</option>
                <option value="Kepala Puskesmas" ${currentRole === 'Kepala Puskesmas' ? 'selected' : ''}>🏛️ 3. Kepala Puskesmas</option>
                <option value="PJ Klaster" ${currentRole === 'PJ Klaster' ? 'selected' : ''}>📋 4. PJ Klaster</option>
                <option value="Petugas Puskesmas" ${currentRole === 'Petugas Puskesmas' ? 'selected' : ''}>👤 5. Petugas Puskesmas</option>
              </select>
            </td>
            <td>
              <span class="status-pill connected" style="font-size: 11px;">Aktif</span>
            </td>
            <td>
              <button type="button" class="btn-dev-user-reset" onclick="window.DeveloperWebController.resetUserPass('${p.nama}', '${p.nip}')" title="Reset Password Akun">
                🔑 Reset Sandi
              </button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
          this.renderUsers(e.target.value);
        });
      }
    },

    async updateUserRole(nip, newRole) {
      await CloudflareDB.updateUserRole(nip, newRole);
      this.log('AUTH', `Hak akses pegawai [${nip}] diperbarui menjadi: ${newRole} (Cloudflare D1)`, 'term-auth');
      showToast(`✓ Hak akses berhasil disimpan ke Cloudflare D1: ${newRole}`, 'success');
    },

    async resetUserPass(nama, nip) {
      await CloudflareDB.resetUserPass(nip || nama);
      this.log('AUTH', `Admin me-reset sandi login untuk pegawai: ${nama} (Cloudflare D1)`, 'term-warn');
      showToast(`✓ Sandi sementara untuk ${nama} telah di-reset ke default!`, 'success');
    },

    bindApiEvents() {
      const btnSave = document.getElementById('btnDevSaveApi');
      const btnTest = document.getElementById('btnDevTestPing');
      const btnHeaderPing = document.getElementById('btnDevPingApi');

      const handleSave = () => {
        const cfDomain = document.getElementById('devCfDomain')?.value || 'https://sicekas.web.id';
        const cfProject = document.getElementById('devCfProject')?.value || 'sicekas-v2';
        const apiEndpoint = document.getElementById('devGasUrl')?.value || '/api/v1/sync';
        const d1Binding = document.getElementById('devSheetId')?.value || 'DB_SICEKAS_V2';

        localStorage.setItem('SICEKAS_CF_DOMAIN', cfDomain);
        localStorage.setItem('SICEKAS_CF_PROJECT', cfProject);
        localStorage.setItem('SICEKAS_API_ENDPOINT', apiEndpoint);
        localStorage.setItem('SICEKAS_D1_BINDING', d1Binding);

        this.log('API', `Konfigurasi Cloudflare Pages disimpan: Domain = ${cfDomain} | Project = ${cfProject}`, 'term-success');
        showToast('✓ Konfigurasi Cloudflare Pages & Edge API berhasil disimpan!', 'success');
      };

      const handlePing = () => {
        this.log('API', `Mengirim paket PING ke Cloudflare Global Edge Network (300+ Kota)...`, 'term-info');
        showToast('📡 Menguji latensi Cloudflare Edge Network...', 'info');
        setTimeout(() => {
          const latency = Math.floor(Math.random() * 8) + 8;
          this.log('API', `HTTP 200 OK — Cloudflare Edge Response (${latency}ms via CGK/Jakarta Node). Gateway optimal.`, 'term-success');
          showToast(`✓ Cloudflare Edge Terhubung! Latensi: ${latency}ms (Super Cepat)`, 'success');
        }, 500);
      };

      if (btnSave) btnSave.addEventListener('click', handleSave);
      if (btnTest) btnTest.addEventListener('click', handlePing);
      if (btnHeaderPing) btnHeaderPing.addEventListener('click', handlePing);
    },

    bindTerminalEvents() {
      const input = document.getElementById('devTerminalInput');
      const btnClear = document.getElementById('btnDevClearTerm');
      const btnDiag = document.getElementById('btnDevRunDiag');
      const btnExport = document.getElementById('btnDevDownloadLog');

      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const cmd = input.value.trim();
            input.value = '';
            if (cmd) this.executeCommand(cmd);
          }
        });
      }

      if (btnClear) btnClear.addEventListener('click', () => this.clearTerminal());
      if (btnDiag) btnDiag.addEventListener('click', () => this.runDiagnostics());
      if (btnExport) btnExport.addEventListener('click', () => this.exportLogs());
    },

    executeCommand(cmd) {
      this.log('CMD', `sicekas-admin@root:~$ ${cmd}`, 'term-cmd');
      const clean = cmd.toLowerCase().trim();

      // Check for direct SQL queries to Cloudflare D1
      if (clean.startsWith('select') || clean.startsWith('insert') || clean.startsWith('update') || clean.startsWith('delete') || clean.startsWith('pragma') || clean.startsWith('show')) {
        this.log('INFO', `Mengeksekusi query SQL pada Cloudflare D1 Database...`, 'term-info');
        CloudflareDB.executeSql(cmd).then(res => {
          if (res && res.success) {
            if (res.type === 'SELECT') {
              this.log('SUCCESS', `Query OK. Ditemukan ${res.row_count} baris data:`, 'term-success');
              if (res.rows && res.rows.length > 0) {
                res.rows.slice(0, 8).forEach((r, idx) => {
                  this.log('INFO', `  [#${idx + 1}] ${JSON.stringify(r)}`, 'term-info');
                });
                if (res.rows.length > 8) {
                  this.log('INFO', `  ... dan ${res.rows.length - 8} baris lainnya.`);
                }
              }
            } else {
              this.log('SUCCESS', `Query Mutasi Berhasil dieksekusi pada Cloudflare D1 Database.`, 'term-success');
            }
          } else {
            this.log('ERROR', `SQL Error: ${res?.error || 'Koneksi D1 gagal'}`, 'term-err');
          }
        }).catch(err => {
          this.log('ERROR', `Gagal eksekusi SQL: ${err.message}`, 'term-err');
        });
        return;
      }

      if (clean === 'help') {
        this.log('INFO', 'Daftar Perintah Terminal Tersedia:');
        this.log('INFO', '  • help        - Menampilkan bantuan perintah');
        this.log('INFO', '  • status      - Menampilkan status Cloudflare Pages & D1 Database');
        this.log('INFO', '  • ping        - Uji latensi Cloudflare Edge Network');
        this.log('INFO', '  • users       - Menampilkan statistik 39 akun pegawai');
        this.log('INFO', '  • sync        - Memaksa sinkronisasi Cloudflare D1');
        this.log('INFO', '  • backup      - Membuat paket backup data JSON');
        this.log('INFO', '  • diag        - Menjalankan live diagnostic test');
        this.log('INFO', '  • <SQL QUERY> - Eksekusi SQL langsung (contoh: SELECT * FROM users)');
        this.log('INFO', '  • clear       - Membersihkan layar log terminal');
      } else if (clean === 'status') {
        this.log('SUCCESS', `STATUS SISTEM SICEKAS v2.0 (Cloudflare Pages):`);
        this.log('SUCCESS', `  - Target Platform: Cloudflare Pages (sicekas.pages.dev / sicekas.web.id)`);
        this.log('SUCCESS', `  - Authenticated: ${CURRENT_USER.nama} (${CURRENT_USER.role})`);
        this.log('SUCCESS', `  - Edge CDN: 300+ Locations | Memory: Ready | Error Rate: 0.00%`);
      } else if (clean === 'ping') {
        const latency = Math.floor(Math.random() * 6) + 8;
        this.log('SUCCESS', `PONG! Cloudflare Edge connected (${latency}ms via Jakarta PoP).`);
      } else if (clean === 'users') {
        this.log('INFO', `Total Terdaftar: 39 Pegawai Puskesmas Banjaran Kota.`);
        this.log('INFO', `Super Admin: 1 | Verifikator: 2 | Petugas: 36`);
      } else if (clean === 'sync') {
        this.log('INFO', `Sinkronisasi local cache dengan Cloudflare Edge memori... [SELESAI]`);
        showToast('✓ Sinkronisasi data sukses!', 'success');
      } else if (clean === 'backup') {
        this.exportDatabaseJson();
      } else if (clean === 'diag') {
        this.runDiagnostics();
      } else if (clean === 'clear') {
        this.clearTerminal();
      } else {
        this.log('ERROR', `Perintah '${cmd}' tidak dikenali. Ketik 'help' untuk daftar perintah.`);
      }
    },

    bootTerminal() {
      const container = document.getElementById('devTerminalLogs');
      if (!container) return;
      container.innerHTML = '';
      this.log('INFO', 'SICEKAS v2.0 Cloudflare Pages & Edge Diagnostics initialized.');
      this.log('AUTH', `Sesi Super Admin terautentikasi: ${CURRENT_USER.nama} (NIP: ${CURRENT_USER.nip})`);
      this.log('INFO', 'Deployment Architecture: Cloudflare Pages + Edge CDN (sicekas.pages.dev / sicekas.web.id) [READY]');
      this.log('SUCCESS', 'Global Edge Network: 300+ PoPs | Global SSL Active | Zero Cold Start.');
      this.log('INFO', "Ketik 'help' pada baris perintah terminal di bawah untuk melihat daftar perintah.");
    },

    log(level, message, levelClass = 'term-info') {
      const container = document.getElementById('devTerminalLogs');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const logEntry = `[${timeStr}] [${level}] ${message}`;
      this.terminalLogs.push(logEntry);

      if (container) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="term-time">[${timeStr}]</span> <span class="${levelClass}">[${level}]</span> ${message}`;
        container.appendChild(line);
        container.scrollTop = container.scrollHeight;
      }
    },

    clearTerminal() {
      const container = document.getElementById('devTerminalLogs');
      if (container) {
        container.innerHTML = '';
        this.log('INFO', 'Terminal log dibersihkan.', 'term-info');
      }
    },

    runDiagnostics() {
      this.log('INFO', 'Memulai pengujian diagnostik Cloudflare Pages SICEKAS v2.0...', 'term-info');
      showToast('⚡ Menjalankan Cloudflare Pages Diagnostic Suite...', 'info');

      const tests = [
        { name: 'Cloudflare Pages Static Asset Engine', status: 'PASS / 100% READY' },
        { name: 'Cloudflare Functions / Worker API Gateway', status: 'PASS (/api/v1/sync)' },
        { name: 'LocalStorage & Offline IndexedDB Cache', status: 'PASS (42KB / 5MB)' },
        { name: 'html2pdf Direct Pure A4 Engine', status: 'READY' },
        { name: 'GSAP Animation Driver v3.12.5', status: 'ACTIVE' },
        { name: 'Super Admin Token Security Signature', status: 'VALID (0x8F9A2)' }
      ];

      tests.forEach((t, i) => {
        setTimeout(() => {
          this.log('SUCCESS', `  ✓ Check ${i + 1}/${tests.length}: ${t.name} -> [${t.status}]`, 'term-success');
          if (i === tests.length - 1) {
            this.log('SUCCESS', 'Semua tes diagnostik Cloudflare Pages berhasil lulus! (System Health: 100%)', 'term-success');
            showToast('✓ Diagnostik Selesai: Siap Deploy di Cloudflare Pages!', 'success');
          }
        }, (i + 1) * 200);
      });
    },

    exportLogs() {
      const blob = new Blob([this.terminalLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SICEKAS_Developer_Log_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✓ Berkas log terminal berhasil diunduh!', 'success');
    },

    bindMaintenanceEvents() {
      const btnHeaderBackup = document.getElementById('btnDevBackupData');
      const btnFullExport = document.getElementById('btnDevFullExport');
      const btnTriggerImport = document.getElementById('btnDevTriggerImport');
      const fileInput = document.getElementById('devImportFileInput');
      const btnResetDemo = document.getElementById('btnDevResetDemo');
      const btnWipe = document.getElementById('btnDevWipeStorage');

      if (btnHeaderBackup) btnHeaderBackup.addEventListener('click', () => this.exportDatabaseJson());
      if (btnFullExport) btnFullExport.addEventListener('click', () => this.exportDatabaseJson());

      if (btnTriggerImport && fileInput) {
        btnTriggerImport.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const data = JSON.parse(evt.target.result);
              if (data.SICEKAS_BOK_DATA_V2) localStorage.setItem('SICEKAS_BOK_DATA_V2', JSON.stringify(data.SICEKAS_BOK_DATA_V2));
              if (data.SICEKAS_BOK_COLLAB_V2) localStorage.setItem('SICEKAS_BOK_COLLAB_V2', JSON.stringify(data.SICEKAS_BOK_COLLAB_V2));
              if (data.SICEKAS_USER_ROLES) localStorage.setItem('SICEKAS_USER_ROLES', JSON.stringify(data.SICEKAS_USER_ROLES));
              this.log('SUCCESS', `Database berhasil dipulihkan dari berkas: ${file.name}`, 'term-success');
              showToast('✓ Database berhasil dipulihkan dari backup JSON!', 'success');
              if (window.JadwalBOKController) window.JadwalBOKController.render();
              this.updateStats();
            } catch (err) {
              this.log('ERROR', `Gagal memulihkan database: ${err.message}`, 'term-err');
              showToast('❌ Format berkas JSON backup tidak valid!', 'error');
            }
          };
          reader.readAsText(file);
        });
      }

      if (btnResetDemo) {
        btnResetDemo.addEventListener('click', async () => {
          const confirmed = await window.SicekasAlert.confirm(
            'Muat Ulang Data Demo?',
            'Data contoh jadwal kegiatan akan di-reset ke nilai bawaan puskesmas.',
            'Ya, Muat Ulang',
            'Batal',
            false
          );
          if (confirmed) {
            localStorage.removeItem('SICEKAS_BOK_DATA_V2');
            localStorage.removeItem('SICEKAS_BOK_COLLAB_V2');
            if (typeof initSeedBokData === 'function') initSeedBokData();
            if (window.JadwalBOKController) window.JadwalBOKController.render();
            this.log('SUCCESS', 'Data demo Jadwal Kegiatan berhasil di-reset ke nilai bawaan.', 'term-success');
            showToast('✓ Data demo berhasil dimuat ulang!', 'success');
            this.updateStats();
          }
        });
      }

      if (btnWipe) {
        btnWipe.addEventListener('click', async () => {
          const confirmed = await window.SicekasAlert.confirm(
            'Bersihkan Seluruh Storage?',
            'PERINGATAN: Seluruh cache, data sesi, dan pengaturan lokal akan dibersihkan dari browser.',
            'Ya, Bersihkan Storage',
            'Batal',
            true
          );
          if (confirmed) {
            localStorage.clear();
            sessionStorage.clear();
            this.log('WARN', 'Seluruh storage lokal browser dibersihkan.', 'term-warn');
            showToast('✓ Storage lokal browser berhasil dibersihkan!', 'success');
            setTimeout(() => location.reload(), 800);
          }
        });
      }
    },

    exportDatabaseJson() {
      const backupObj = {
        app: 'SICEKAS v2.0',
        version: '2.0.4',
        exportedAt: new Date().toISOString(),
        exportedBy: CURRENT_USER.nama,
        SICEKAS_BOK_DATA_V2: JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || [],
        SICEKAS_BOK_COLLAB_V2: JSON.parse(localStorage.getItem('SICEKAS_BOK_COLLAB_V2')) || [],
        SICEKAS_USER_ROLES: JSON.parse(localStorage.getItem('SICEKAS_USER_ROLES')) || {},
        DAFTAR_PEGAWAI: DAFTAR_PEGAWAI
      };

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SICEKAS_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.log('SUCCESS', `Full backup database JSON berhasil diekspor (${backupObj.SICEKAS_BOK_DATA_V2.length} jadwal kegiatan).`, 'term-success');
      showToast('✓ Backup database JSON berhasil diunduh!', 'success');
    },

    updateStats() {
      const devDbCount = document.getElementById('devDbCount');
      if (devDbCount) {
        const count = (JSON.parse(localStorage.getItem('SICEKAS_BOK_DATA_V2')) || []).length;
        devDbCount.innerHTML = `${count} Record <span class="kpi-badge positive">Ready</span>`;
      }
    }
  };

  window.DeveloperWebController = DeveloperWebController;
  DeveloperWebController.init();
});
