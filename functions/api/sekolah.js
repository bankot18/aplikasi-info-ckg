// Cloudflare Pages Function: API Endpoint for CKG Sekolah Records (/api/sekolah)

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
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    // Auto-create table if not exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_sekolah_records (
        id TEXT PRIMARY KEY,
        no INTEGER,
        nama TEXT NOT NULL,
        kelas TEXT,
        sekolah TEXT,
        jk TEXT DEFAULT 'L',
        nik TEXT,
        tanggal_lahir TEXT,
        no_whatsapp TEXT,
        provinsi TEXT DEFAULT 'Jawa Barat',
        kab_kota TEXT DEFAULT 'Kab. Bandung',
        kecamatan TEXT DEFAULT 'Banjaran',
        kelurahan TEXT DEFAULT 'Tarajusari',
        alamat TEXT,
        bb REAL DEFAULT 0,
        tb REAL DEFAULT 0,
        lp REAL DEFAULT 0,
        imt REAL DEFAULT 0,
        status_imt TEXT DEFAULT 'Normal',
        td_sistolik INTEGER DEFAULT 0,
        td_diastolik INTEGER DEFAULT 0,
        gula_darah TEXT DEFAULT '-',
        hb TEXT DEFAULT '-',
        telinga TEXT DEFAULT 'Tidak ada serumen',
        gigi TEXT DEFAULT 'Tidak ada',
        mata TEXT DEFAULT 'Normal',
        kebugaran TEXT DEFAULT 'Baik',
        menstruasi TEXT DEFAULT 'Belum',
        status_kesehatan TEXT DEFAULT 'Sehat',
        catatan_rujukan TEXT DEFAULT '-',
        is_examined BOOLEAN DEFAULT 0,
        petugas_entry TEXT DEFAULT 'Admin',
        tanggal_entry TEXT,
        raw_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const url = new URL(request.url);
    const sekolahFilter = url.searchParams.get('sekolah');
    const kelasFilter = url.searchParams.get('kelas');

    let query = 'SELECT * FROM ckg_sekolah_records';
    const params = [];
    const conditions = [];

    if (sekolahFilter) {
      conditions.push('UPPER(sekolah) = ?');
      params.push(sekolahFilter.toUpperCase());
    }
    if (kelasFilter) {
      conditions.push('UPPER(kelas) = ?');
      params.push(kelasFilter.toUpperCase());
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY no ASC, rowid DESC';

    let stmt = env.DB.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }

    const { results } = await stmt.all();
    const parsed = (results || []).map(r => {
      let json = {};
      try { json = JSON.parse(r.raw_json || '{}'); } catch (_) {}
      return { ...json, ...r };
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
    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];
    if (records.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), { headers: corsHeaders });
    }

    const stmt = env.DB.prepare(`
      INSERT INTO ckg_sekolah_records (
        id, no, nama, kelas, sekolah, jk, nik, tanggal_lahir, no_whatsapp,
        provinsi, kab_kota, kecamatan, kelurahan, alamat,
        bb, tb, lp, imt, status_imt,
        td_sistolik, td_diastolik, gula_darah, hb,
        telinga, gigi, mata, kebugaran, menstruasi, status_kesehatan, catatan_rujukan,
        is_examined, petugas_entry, tanggal_entry, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        no = excluded.no,
        nama = excluded.nama,
        kelas = excluded.kelas,
        sekolah = excluded.sekolah,
        jk = excluded.jk,
        nik = excluded.nik,
        tanggal_lahir = excluded.tanggal_lahir,
        no_whatsapp = excluded.no_whatsapp,
        provinsi = excluded.provinsi,
        kab_kota = excluded.kab_kota,
        kecamatan = excluded.kecamatan,
        kelurahan = excluded.kelurahan,
        alamat = excluded.alamat,
        bb = excluded.bb,
        tb = excluded.tb,
        lp = excluded.lp,
        imt = excluded.imt,
        status_imt = excluded.status_imt,
        td_sistolik = excluded.td_sistolik,
        td_diastolik = excluded.td_diastolik,
        gula_darah = excluded.gula_darah,
        hb = excluded.hb,
        telinga = excluded.telinga,
        gigi = excluded.gigi,
        mata = excluded.mata,
        kebugaran = excluded.kebugaran,
        menstruasi = excluded.menstruasi,
        status_kesehatan = excluded.status_kesehatan,
        catatan_rujukan = excluded.catatan_rujukan,
        is_examined = excluded.is_examined,
        petugas_entry = excluded.petugas_entry,
        tanggal_entry = excluded.tanggal_entry,
        raw_json = excluded.raw_json
    `);

    const statements = records.map((item, idx) => {
      const bb = Number(item.bb || 0);
      const tb = Number(item.tb || 0);
      let imt = Number(item.imt || 0);
      if (bb > 0 && tb > 0 && imt === 0) {
        const tbM = tb / 100;
        imt = Number((bb / (tbM * tbM)).toFixed(2));
      }

      return stmt.bind(
        String(item.id || item.nik || `SCH-${Date.now()}-${idx}`),
        Number(item.no || idx + 1),
        String(item.nama || item.nama_siswa || '').trim().toUpperCase(),
        String(item.kelas || '').trim().toUpperCase(),
        String(item.sekolah || item.nama_sekolah || '').trim().toUpperCase(),
        String(item.jk || item.jenis_kelamin || 'L'),
        String(item.nik || item.nisn_nik || '').trim(),
        String(item.tanggal_lahir || ''),
        String(item.no_whatsapp || ''),
        String(item.provinsi || 'Jawa Barat'),
        String(item.kab_kota || 'Kab. Bandung'),
        String(item.kecamatan || 'Banjaran'),
        String(item.kelurahan || 'Tarajusari'),
        String(item.alamat || ''),
        bb,
        tb,
        Number(item.lp || 0),
        imt,
        String(item.status_imt || 'Normal'),
        Number(item.td_sistolik || 0),
        Number(item.td_diastolik || 0),
        String(item.gula_darah || '-'),
        String(item.hb || '-'),
        String(item.telinga || 'Tidak ada serumen'),
        String(item.gigi || 'Tidak ada'),
        String(item.mata || 'Normal'),
        String(item.kebugaran || 'Baik'),
        String(item.menstruasi || 'Belum'),
        String(item.status_kesehatan || 'Sehat'),
        String(item.catatan_rujukan || '-'),
        item.is_examined ? 1 : 0,
        String(item.petugas_entry || 'Admin'),
        String(item.tanggal_entry || new Date().toISOString().substring(0, 10)),
        JSON.stringify(item)
      );
    });

    const chunkSize = 25;
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

  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      await env.DB.prepare('DELETE FROM ckg_sekolah_records WHERE id = ?').bind(id).run();
    } else {
      await env.DB.prepare('DELETE FROM ckg_sekolah_records').run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
