// Cloudflare Pages Function: API Endpoint for CKG Gratis Records (/api/ckg-gratis)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_gratis_records (
        id TEXT PRIMARY KEY,
        nik TEXT,
        nama_pasien TEXT,
        petugas_entry TEXT,
        tanggal_entry TEXT,
        lokasi_pelayanan TEXT,
        status_entry TEXT,
        raw_json TEXT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS enco_pasien (
        id TEXT PRIMARY KEY,
        nik TEXT NOT NULL UNIQUE,
        nama TEXT NOT NULL,
        tanggal_lahir TEXT,
        jenis_kelamin TEXT,
        status_pernikahan TEXT DEFAULT '',
        pekerjaan TEXT DEFAULT '',
        provinsi TEXT DEFAULT 'Jawa Barat',
        kab_kota TEXT DEFAULT 'Kab. Bandung',
        kecamatan TEXT DEFAULT 'Banjaran',
        kelurahan TEXT DEFAULT '',
        alamat TEXT DEFAULT '',
        no_tiket TEXT,
        kategori TEXT DEFAULT 'Umum',
        status_pendaftaran TEXT DEFAULT 'Sudah Terdaftar',
        status_pelayanan TEXT DEFAULT 'Belum Pelayanan',
        petugas_bot TEXT DEFAULT '',
        raw_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let results = [];
    try {
      const q = await env.DB.prepare(`
        SELECT c.*, 
               e.id AS enco_pasien_id, 
               e.status_pendaftaran AS enco_status_pendaftaran, 
               e.status_pelayanan AS enco_status_pelayanan,
               e.no_tiket AS enco_no_tiket
        FROM ckg_gratis_records c
        LEFT JOIN enco_pasien e ON TRIM(c.nik) = TRIM(e.nik)
        ORDER BY c.rowid DESC
      `).all();
      results = q.results || [];
    } catch (_) {
      const q = await env.DB.prepare('SELECT * FROM ckg_gratis_records ORDER BY rowid DESC').all();
      results = q.results || [];
    }

    const parsed = results.map(r => {
      let item = {};
      if (r.raw_json) {
        try { item = JSON.parse(r.raw_json); } catch (_) {}
      }

      const isInBankData = (
        r.enco_pasien_id != null ||
        item.from_bank_data == 1 ||
        item.is_bank_data == 1 ||
        (item.status_pendaftaran && (item.status_pendaftaran === 'Sudah Terdaftar' || item.status_pendaftaran === 'berhasil')) ||
        (item.status_pelayanan && (item.status_pelayanan === 'Selesai Pelayanan' || item.status_pelayanan === 'selesai')) ||
        (r.enco_status_pendaftaran && (r.enco_status_pendaftaran === 'Sudah Terdaftar' || r.enco_status_pendaftaran === 'berhasil')) ||
        (r.enco_status_pelayanan && (r.enco_status_pelayanan === 'Selesai Pelayanan' || r.enco_status_pelayanan === 'selesai'))
      ) ? 1 : 0;

      return {
        ...item,
        id: item.id || (r.id ? (String(r.id).startsWith('CKG-G-') ? String(r.id) : `CKG-G-${r.id}`) : 'CKG-G-' + Date.now()),
        nik: item.nik || r.nik || '',
        nama: item.nama || item.nama_pasien || r.nama_pasien || '',
        petugas_entry: item.petugas_entry || r.petugas_entry || 'Admin',
        created_by: item.created_by || r.petugas_entry || 'Admin',
        tanggal_entry: item.tanggal_entry || r.tanggal_entry || '',
        created_at: item.created_at || r.tanggal_entry || '',
        jenis_kegiatan: item.jenis_kegiatan || r.lokasi_pelayanan || 'Luar Gedung',
        status_validasi: item.status_validasi || r.status_entry || 'Terverifikasi',
        is_bank_data: isInBankData,
        from_bank_data: item.from_bank_data ? 1 : (isInBankData ? 1 : 0),
        enco_pasien_id: r.enco_pasien_id || null,
        enco_status_pendaftaran: r.enco_status_pendaftaran || item.status_pendaftaran || '',
        enco_status_pelayanan: r.enco_status_pelayanan || item.status_pelayanan || '',
        status_pendaftaran: r.enco_status_pendaftaran || item.status_pendaftaran || '',
        status_pelayanan: r.enco_status_pelayanan || item.status_pelayanan || ''
      };
    });

    return new Response(JSON.stringify({ success: true, count: parsed.length, data: parsed }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_gratis_records (
        id TEXT PRIMARY KEY,
        nik TEXT,
        nama_pasien TEXT,
        petugas_entry TEXT,
        tanggal_entry TEXT,
        lokasi_pelayanan TEXT,
        status_entry TEXT,
        raw_json TEXT
      )
    `).run();

    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];

    const stmt = env.DB.prepare(`
      INSERT INTO ckg_gratis_records (id, nik, nama_pasien, petugas_entry, tanggal_entry, lokasi_pelayanan, status_entry, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nik = excluded.nik,
        nama_pasien = excluded.nama_pasien,
        petugas_entry = excluded.petugas_entry,
        tanggal_entry = excluded.tanggal_entry,
        lokasi_pelayanan = excluded.lokasi_pelayanan,
        status_entry = excluded.status_entry,
        raw_json = excluded.raw_json
    `);

    const statements = records.map(r => {
      const recId = String(r.id || (r.nik ? `CKG-G-${r.nik}` : `CKG-G-${Date.now()}-${Math.floor(Math.random()*10000)}`));
      return stmt.bind(
        recId,
        r.nik || '',
        r.nama || r.nama_pasien || '',
        r.petugas_entry || r.created_by || 'Admin',
        r.created_at || r.tanggal_entry || new Date().toISOString().substring(0, 10),
        r.jenis_kegiatan || r.lokasi_pelayanan || 'Luar Gedung',
        r.status_validasi || r.status_entry || 'Terverifikasi',
        JSON.stringify(r)
      );
    });

    const chunkSize = 20;
    for (let i = 0; i < statements.length; i += chunkSize) {
      const chunk = statements.slice(i, i + chunkSize);
      await env.DB.batch(chunk);
    }

    return new Response(JSON.stringify({ success: true, count: records.length }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    let body = null;
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      }
    } catch (_) {}

    const id = url.searchParams.get('id') || body?.id;
    const filter = url.searchParams.get('filter') || body?.filter;

    if (id) {
      await env.DB.prepare('DELETE FROM ckg_gratis_records WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true, deleted: 'single' }), { headers: corsHeaders });
    } else if (body && Array.isArray(body.ids) && body.ids.length > 0) {
      const batchSize = 50;
      let totalDeleted = 0;
      for (let i = 0; i < body.ids.length; i += batchSize) {
        const chunk = body.ids.slice(i, i + batchSize);
        const placeholders = chunk.map(() => '?').join(',');
        await env.DB.prepare(`DELETE FROM ckg_gratis_records WHERE id IN (${placeholders})`).bind(...chunk).run();
        totalDeleted += chunk.length;
      }
      return new Response(JSON.stringify({ success: true, deleted: 'batch', count: totalDeleted }), { headers: corsHeaders });
    } else if (filter === 'non_16_digit') {
      const delRes = await env.DB.prepare(`
        DELETE FROM ckg_gratis_records 
        WHERE (nik IS NOT NULL AND TRIM(nik) != '' AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(nik, ' ', ''), '-', ''), '.', ''), '\'', '')) != 16)
      `).run();
      return new Response(JSON.stringify({ success: true, deleted: 'non_16_digit', changes: delRes?.meta?.changes }), { headers: corsHeaders });
    } else {
      await env.DB.prepare('DELETE FROM ckg_gratis_records').run();
      return new Response(JSON.stringify({ success: true, deleted: 'all' }), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

