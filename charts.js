// Chart.js Manager matching Reference Dashboard (Produktivitas & Proporsi)

let productivityChartInstance = null;
let proportionChartInstance = null;

function initDashboardCharts(officers = []) {
  const prodCtx = document.getElementById('productivityChart');
  const propCtx = document.getElementById('proportionChart');

  if (!prodCtx || !propCtx) return;

  Chart.defaults.color = '#64748b';
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

  // Sort officers by total entries descending and take Top 10 for Bar Chart
  const sortedOfficers = [...officers].sort((a, b) => (b.luarCount + b.dalamCount) - (a.luarCount + a.dalamCount));
  const top10Officers = sortedOfficers.slice(0, 10);

  // Top 10 Officer Labels & Data
  const labels = top10Officers.map(o => o.nama);
  const luarData = top10Officers.map(o => o.luarCount);
  const dalamData = top10Officers.map(o => o.dalamCount);

  // Total Luar vs Dalam for Doughnut (All officers)
  const totalLuar = officers.reduce((a, b) => a + b.luarCount, 0);
  const totalDalam = officers.reduce((a, b) => a + b.dalamCount, 0);

  // 1. Grouped Bar Chart (Produktivitas Entri Petugas Puskesmas)
  if (productivityChartInstance) productivityChartInstance.destroy();
  productivityChartInstance = new Chart(prodCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'CKG Luar Gedung',
          data: luarData,
          backgroundColor: '#0284c7',
          borderRadius: 4
        },
        {
          label: 'CKG Dalam Gedung',
          data: dalamData,
          backgroundColor: '#059669',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11, weight: '600' } }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#fff',
          bodyColor: '#cbd5e1'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { stepSize: 20 }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: '500' },
            maxRotation: 45,
            minRotation: 30
          }
        }
      }
    }
  });

  // 2. Doughnut Chart (Proporsi Luar vs Dalam)
  if (proportionChartInstance) proportionChartInstance.destroy();
  proportionChartInstance = new Chart(propCtx, {
    type: 'doughnut',
    data: {
      labels: ['Luar Gedung', 'Dalam Gedung'],
      datasets: [{
        data: [totalLuar, totalDalam],
        backgroundColor: ['#0284c7', '#059669'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11, weight: '600' }, usePointStyle: true }
        }
      }
    }
  });
}
