// Chart.js Manager - Premium Visual Styling for Monthly Trend & Proportion Analytics

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

  // Get active selected year from dashboard filter
  const yearSelect = document.getElementById('dashTahun');
  const selectedYear = yearSelect ? yearSelect.value : new Date().getFullYear().toString();

  // Update Title Element if present
  const titleEl = document.getElementById('monthlyTrendChartTitle');
  if (titleEl) {
    titleEl.innerHTML = `<i class="bi bi-bar-chart-line-fill" style="color: #2563eb;"></i> Grafik Total Entri Data CKG Tiap Bulan <span style="font-size: 12px; color: #64748b; font-weight: 600;">(Tahun ${selectedYear})</span>`;
  }

  // 12 Months Labels (Indonesian)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const luarMonthly = new Array(12).fill(0);
  const dalamMonthly = new Array(12).fill(0);

  // Aggregate monthly counts from global records
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

  // Calculate annual totals for Doughnut
  const totalLuarYear = luarMonthly.reduce((a, b) => a + b, 0);
  const totalDalamYear = dalamMonthly.reduce((a, b) => a + b, 0);
  const grandTotalYear = totalLuarYear + totalDalamYear;

  // Create Bar Gradients
  const gradientLuar = prodCtx.createLinearGradient(0, 0, 0, 300);
  gradientLuar.addColorStop(0, '#0284c7');
  gradientLuar.addColorStop(1, '#0369a1');

  const gradientDalam = prodCtx.createLinearGradient(0, 0, 0, 300);
  gradientDalam.addColorStop(0, '#10b981');
  gradientDalam.addColorStop(1, '#047857');

  // 1. BAR CHART: Total Entry Tiap Bulan Per Tahun (Jan - Des)
  if (productivityChartInstance) productivityChartInstance.destroy();
  productivityChartInstance = new Chart(prodCtx, {
    type: 'bar',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: 'CKG Luar Gedung',
          data: luarMonthly,
          backgroundColor: gradientLuar,
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          hoverBackgroundColor: '#38bdf8',
          maxBarThickness: 28
        },
        {
          label: 'CKG Dalam Gedung',
          data: dalamMonthly,
          backgroundColor: gradientDalam,
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          hoverBackgroundColor: '#34d399',
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            font: { size: 11.5, weight: '700' },
            padding: 14,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { size: 13, weight: '800' },
          bodyFont: { size: 12, weight: '600' },
          padding: 12,
          cornerRadius: 10,
          boxPadding: 6,
          callbacks: {
            title: function(items) {
              const idx = items[0].dataIndex;
              return `📅 Bulan: ${fullMonthNames[idx]} ${selectedYear}`;
            },
            footer: function(items) {
              let total = 0;
              items.forEach(item => {
                total += item.raw;
              });
              return `✨ Total Entri: ${total.toLocaleString('id-ID')} data`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(226, 232, 240, 0.7)',
            drawBorder: false
          },
          ticks: {
            font: { size: 11, weight: '600' },
            padding: 8,
            precision: 0
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11, weight: '700' },
            padding: 6
          }
        }
      }
    }
  });

  // 2. DOUGHNUT CHART: Proporsi Luar vs Dalam (Tahun Ini)
  if (proportionChartInstance) proportionChartInstance.destroy();
  proportionChartInstance = new Chart(propCtx, {
    type: 'doughnut',
    data: {
      labels: ['Luar Gedung', 'Dalam Gedung'],
      datasets: [{
        data: [totalLuarYear, totalDalamYear],
        backgroundColor: ['#0284c7', '#10b981'],
        hoverBackgroundColor: ['#38bdf8', '#34d399'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 11.5, weight: '700' },
            padding: 14,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { size: 12, weight: '800' },
          bodyFont: { size: 12, weight: '600' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              const pct = grandTotalYear > 0 ? ((val / grandTotalYear) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${val.toLocaleString('id-ID')} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}
