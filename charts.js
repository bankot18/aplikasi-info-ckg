// Chart.js Manager - Premium Visual Analytics
// Left: Grafik Produktivitas Entri Petugas Puskesmas (Top 10)
// Right: Grafik Total Entri Data CKG Tiap Bulan (Jan - Des per Tahun)

let productivityChartInstance = null;
let proportionChartInstance = null;

function initDashboardCharts(officers = []) {
  const prodCanvas = document.getElementById('productivityChart');
  const propCanvas = document.getElementById('proportionChart');

  if (!prodCanvas || !propCanvas) return;

  const prodCtx = prodCanvas.getContext('2d');
  const propCtx = propCanvas.getContext('2d');

  Chart.defaults.color = '#64748b';
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

  // Active filter year (default current year e.g. 2026)
  const yearSelect = document.getElementById('dashTahun');
  const selectedYear = yearSelect ? yearSelect.value : new Date().getFullYear().toString();

  // Update Right Chart Title if element exists
  const monthChartTitleEl = document.getElementById('monthlyTrendChartTitle');
  if (monthChartTitleEl) {
    monthChartTitleEl.innerHTML = `<i class="bi bi-calendar-event-fill" style="color: #10b981;"></i> Grafik Total Entri Data CKG Tiap Bulan <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">(Tahun ${selectedYear})</span>`;
  }

  // Create Bar Gradients for Left Canvas (Productivity Top 10)
  const gradientLuarProd = prodCtx.createLinearGradient(0, 0, 0, 300);
  gradientLuarProd.addColorStop(0, '#0284c7');
  gradientLuarProd.addColorStop(1, '#0369a1');

  const gradientDalamProd = prodCtx.createLinearGradient(0, 0, 0, 300);
  gradientDalamProd.addColorStop(0, '#10b981');
  gradientDalamProd.addColorStop(1, '#047857');

  // Sort officers by total entries descending and take Top 10
  const sortedOfficers = [...officers].sort((a, b) => (b.luarCount + b.dalamCount) - (a.luarCount + a.dalamCount));
  const top10Officers = sortedOfficers.slice(0, 10);

  const top10Labels = top10Officers.map(o => o.nama);
  const top10Luar = top10Officers.map(o => o.luarCount);
  const top10Dalam = top10Officers.map(o => o.dalamCount);

  // ==========================================================================
  // 1. LEFT CHART: Grafik Produktivitas Entri Petugas Puskesmas (Top 10)
  // ==========================================================================
  if (productivityChartInstance) productivityChartInstance.destroy();
  productivityChartInstance = new Chart(prodCtx, {
    type: 'bar',
    data: {
      labels: top10Labels,
      datasets: [
        {
          label: 'CKG Luar Gedung',
          data: top10Luar,
          backgroundColor: gradientLuarProd,
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          hoverBackgroundColor: '#38bdf8'
        },
        {
          label: 'CKG Dalam Gedung',
          data: top10Dalam,
          backgroundColor: gradientDalamProd,
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          hoverBackgroundColor: '#34d399'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { font: { size: 11, weight: '700' }, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { size: 12.5, weight: '800' },
          bodyFont: { size: 11.5, weight: '600' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            footer: function(items) {
              let total = 0;
              items.forEach(item => { total += item.raw; });
              return `✨ Total Entri: ${total.toLocaleString('id-ID')} data`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.6)', drawBorder: false },
          ticks: { font: { size: 10.5, weight: '600' }, precision: 0 }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: '600' },
            maxRotation: 45,
            minRotation: 25
          }
        }
      }
    }
  });

  // ==========================================================================
  // 2. RIGHT CHART: Grafik Total Entri Data CKG Tiap Bulan (Jan - Des)
  // ==========================================================================

  // Create Bar Gradients for Right Canvas (Monthly Trend)
  const gradientLuarMonth = propCtx.createLinearGradient(0, 0, 0, 300);
  gradientLuarMonth.addColorStop(0, '#0284c7');
  gradientLuarMonth.addColorStop(1, '#0369a1');

  const gradientDalamMonth = propCtx.createLinearGradient(0, 0, 0, 300);
  gradientDalamMonth.addColorStop(0, '#10b981');
  gradientDalamMonth.addColorStop(1, '#047857');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const luarMonthly = new Array(12).fill(0);
  const dalamMonthly = new Array(12).fill(0);

  // Aggregate monthly counts from global records for selectedYear
  const allRecords = (typeof records !== 'undefined' && Array.isArray(records)) ? records : [];

  allRecords.forEach(r => {
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      if (typeof isRecordInMonthYear === 'function' && isRecordInMonthYear(r, monthStr, selectedYear)) {
        const pel = String(r.jenis_pelayanan || r.pelayanan || '').toLowerCase();
        if (pel.includes('luar')) {
          luarMonthly[m - 1]++;
        } else {
          dalamMonthly[m - 1]++;
        }
        break;
      }
    }
  });

  if (proportionChartInstance) proportionChartInstance.destroy();
  proportionChartInstance = new Chart(propCtx, {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: 'CKG Luar Gedung',
          data: luarMonthly,
          backgroundColor: gradientLuarMonth,
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: { topLeft: 5, topRight: 5, bottomLeft: 0, bottomRight: 0 },
          hoverBackgroundColor: '#38bdf8',
          maxBarThickness: 16
        },
        {
          label: 'CKG Dalam Gedung',
          data: dalamMonthly,
          backgroundColor: gradientDalamMonth,
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: { topLeft: 5, topRight: 5, bottomLeft: 0, bottomRight: 0 },
          hoverBackgroundColor: '#34d399',
          maxBarThickness: 16
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { font: { size: 10.5, weight: '700' }, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { size: 12.5, weight: '800' },
          bodyFont: { size: 11.5, weight: '600' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: function(items) {
              const idx = items[0].dataIndex;
              return `📅 Bulan: ${fullMonthNames[idx]} ${selectedYear}`;
            },
            footer: function(items) {
              let total = 0;
              items.forEach(item => { total += item.raw; });
              return `✨ Total Entri: ${total.toLocaleString('id-ID')} data`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.6)', drawBorder: false },
          ticks: { font: { size: 10.5, weight: '600' }, precision: 0 }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10, weight: '700' }, padding: 4 }
        }
      }
    }
  });
}
