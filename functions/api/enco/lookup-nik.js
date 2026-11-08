// Cloudflare Pages Function: /api/enco/lookup-nik
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    const rawNik = (url.searchParams.get('nik') || '').replace(/\D/g, '').trim();
    if (!rawNik) {
      return new Response(JSON.stringify({ success: false, found: false, error: 'Parameter NIK dibutuhkan' }), {
        headers: corsHeaders
      });
    }

    // 1. Cek di tabel enco_pasien (Bank Data Rekam Pasien ASIK)
    let patient = await env.DB.prepare('SELECT * FROM enco_pasien WHERE TRIM(nik) = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1').bind(rawNik).first();

    // 2. Fallback: Cek di ckg_gratis_records atau records jika belum ada di enco_pasien
    if (!patient) {
      let rec = null;
      try {
        rec = await env.DB.prepare('SELECT * FROM ckg_gratis_records WHERE TRIM(nik) = ? ORDER BY created_at DESC LIMIT 1').bind(rawNik).first();
      } catch (_) {}
      if (!rec) {
        try {
          rec = await env.DB.prepare('SELECT * FROM records WHERE TRIM(nik) = ? ORDER BY created_at DESC LIMIT 1').bind(rawNik).first();
        } catch (_) {}
      }
      if (rec) {
        patient = {
          nik: rec.nik,
          nama: rec.nama || rec.nama_pasien || '',
          tanggal_lahir: rec.tanggal_lahir || '',
          jenis_kelamin: rec.jenis_kelamin || 'L',
          status_pernikahan: rec.status_pernikahan || '',
          pekerjaan: rec.pekerjaan || '',
          alamat: rec.alamat || '',
          provinsi: rec.provinsi || 'Jawa Barat',
          kab_kota: rec.kab_kota || 'Kab. Bandung',
          kecamatan: rec.kecamatan || 'Banjaran',
          kelurahan: rec.kelurahan || '',
          no_wa: rec.no_whatsapp || rec.no_wa || ''
        };
      }
    }

    if (patient) {
      return new Response(JSON.stringify({ success: true, found: true, data: patient }), { headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ success: true, found: false }), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
