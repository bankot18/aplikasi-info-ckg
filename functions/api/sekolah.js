// Cloudflare Pages Function: API Endpoint for CKG Sekolah Records (/api/sekolah)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
        kuku TEXT DEFAULT 'Pendek Bersih',
        merokok TEXT DEFAULT 'Tidak',
        jenis_rokok TEXT DEFAULT '-',
        intensitas_merokok TEXT DEFAULT '-',
        jumlah_batang TEXT DEFAULT '-',
        status_kesehatan TEXT DEFAULT 'Sehat',
        catatan_rujukan TEXT DEFAULT '-',
        is_examined BOOLEAN DEFAULT 0,
        petugas_entry TEXT DEFAULT 'Admin',
        tanggal_entry TEXT,
        tahun_skrining TEXT DEFAULT '2026',
        antro_done INTEGER DEFAULT 0,
        vital_done INTEGER DEFAULT 0,
        lab_done INTEGER DEFAULT 0,
        organ_done INTEGER DEFAULT 0,
        kesimpulan_done INTEGER DEFAULT 0,
        identitas_done INTEGER DEFAULT 0,
        raw_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {}

  try { await env.DB.prepare('ALTER TABLE ckg_sekolah_records ADD COLUMN antro_done INTEGER DEFAULT 0').run(); } catch (_) {}
  try { await env.DB.prepare('ALTER TABLE ckg_sekolah_records ADD COLUMN vital_done INTEGER DEFAULT 0').run(); } catch (_) {}
  try { await env.DB.prepare('ALTER TABLE ckg_sekolah_records ADD COLUMN lab_done INTEGER DEFAULT 0').run(); } catch (_) {}
  try { await env.DB.prepare('ALTER TABLE ckg_sekolah_records ADD COLUMN organ_done INTEGER DEFAULT 0').run(); } catch (_) {}
  try { await env.DB.prepare('ALTER TABLE ckg_sekolah_records ADD COLUMN kesimpulan_done INTEGER DEFAULT 0').run(); } catch (_) {}
  try { await env.DB.prepare('ALTER TABLE ckg_sekolah_records ADD COLUMN identitas_done INTEGER DEFAULT 0').run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE ckg_sekolah_records ADD COLUMN kuku TEXT DEFAULT 'Pendek Bersih'").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE ckg_sekolah_records ADD COLUMN merokok TEXT DEFAULT 'Tidak'").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE ckg_sekolah_records ADD COLUMN jenis_rokok TEXT DEFAULT '-'").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE ckg_sekolah_records ADD COLUMN intensitas_merokok TEXT DEFAULT '-'").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE ckg_sekolah_records ADD COLUMN jumlah_batang TEXT DEFAULT '-'").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE ckg_sekolah_records ADD COLUMN tahun_skrining TEXT DEFAULT '2026'").run(); } catch (_) {}

  try {
    const url = new URL(request.url);
    const idFilter = url.searchParams.get('id');
    const sekolahFilter = url.searchParams.get('sekolah');
    const kelasFilter = url.searchParams.get('kelas');

    let query = 'SELECT * FROM ckg_sekolah_records';
    const params = [];
    const conditions = [];

    if (idFilter) {
      conditions.push('id = ?');
      params.push(idFilter);
    }
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

async function handlePartialUpdate(env, body) {
  const targetId = body.id;
  if (!targetId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing student id for partial update' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const allowedCols = [
    'nama', 'kelas', 'sekolah', 'jk', 'nik', 'tanggal_lahir', 'no_whatsapp',
    'provinsi', 'kab_kota', 'kecamatan', 'kelurahan', 'alamat',
    'bb', 'tb', 'lp', 'imt', 'status_imt',
    'td_sistolik', 'td_diastolik', 'gula_darah', 'hb',
    'telinga', 'gigi', 'mata', 'kebugaran', 'menstruasi', 'kuku',
    'merokok', 'jenis_rokok', 'intensitas_merokok', 'jumlah_batang',
    'status_kesehatan', 'catatan_rujukan',
    'is_examined', 'petugas_entry', 'tanggal_entry', 'tahun_skrining',
    'antro_done', 'vital_done', 'lab_done', 'organ_done', 'kesimpulan_done', 'identitas_done'
  ];

  const updateData = body.fields || body;
  const setClauses = [];
  const setParams = [];

  for (const col of allowedCols) {
    if (updateData[col] !== undefined) {
      setClauses.push(`${col} = ?`);
      let val = updateData[col];
      if (typeof val === 'boolean') val = val ? 1 : 0;
      setParams.push(val);
    }
  }

  if (setClauses.length === 0) {
    return new Response(JSON.stringify({ success: true, message: 'No fields to update' }), { headers: corsHeaders });
  }

  let currentJson = {};
  try {
    const existing = await env.DB.prepare('SELECT raw_json FROM ckg_sekolah_records WHERE id = ?').bind(targetId).first();
    if (existing && existing.raw_json) {
      currentJson = JSON.parse(existing.raw_json || '{}');
    }
  } catch (_) {}

  const mergedJson = { ...currentJson, ...updateData };
  delete mergedJson.id;
  setClauses.push('raw_json = ?');
  setParams.push(JSON.stringify(mergedJson));

  setParams.push(targetId);
  const updateSql = `UPDATE ckg_sekolah_records SET ${setClauses.join(', ')} WHERE id = ?`;
  await env.DB.prepare(updateSql).bind(...setParams).run();

  const updatedRecord = await env.DB.prepare('SELECT * FROM ckg_sekolah_records WHERE id = ?').bind(targetId).first();
  let finalJson = {};
  try { finalJson = JSON.parse(updatedRecord.raw_json || '{}'); } catch (_) {}
  const result = { ...finalJson, ...updatedRecord };

  return new Response(JSON.stringify({ success: true, message: 'Updated successfully', data: result }), {
    headers: corsHeaders
  });
}

export async function onRequestPatch(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding (DB) not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    return await handlePartialUpdate(env, body);
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
    const isPartial = body && (body.action === 'partial_update' || body.is_partial || (body.id && body.fields));

    if (isPartial) {
      return await handlePartialUpdate(env, body);
    }

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
        is_examined, petugas_entry, tanggal_entry,
        antro_done, vital_done, lab_done, organ_done, kesimpulan_done, identitas_done,
        raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        antro_done = excluded.antro_done,
        vital_done = excluded.vital_done,
        lab_done = excluded.lab_done,
        organ_done = excluded.organ_done,
        kesimpulan_done = excluded.kesimpulan_done,
        identitas_done = excluded.identitas_done,
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

      const antroDone = (item.antro_done || (bb > 0 && tb > 0)) ? 1 : 0;
      const vitalDone = (item.vital_done || Number(item.td_sistolik || 0) > 0) ? 1 : 0;
      const labDone = (item.lab_done || (item.hb && item.hb !== '-') || (item.gula_darah && item.gula_darah !== '-')) ? 1 : 0;
      const organDone = item.organ_done ? 1 : 0;
      const kesimpulanDone = item.kesimpulan_done ? 1 : 0;
      const identitasDone = (item.identitas_done || item.nama) ? 1 : 0;
      // PENTING: Identitas BUKAN pemeriksaan!
      const isExamined = (antroDone || vitalDone || labDone || organDone || kesimpulanDone) ? 1 : 0;

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
        String(item.telinga || '-'),
        String(item.gigi || '-'),
        String(item.mata || '-'),
        String(item.kebugaran || '-'),
        String(item.menstruasi || '-'),
        String(item.status_kesehatan || 'Sehat'),
        String(item.catatan_rujukan || '-'),
        isExamined,
        String(item.petugas_entry || 'Admin'),
        String(item.tanggal_entry || new Date().toISOString().substring(0, 10)),
        antroDone,
        vitalDone,
        labDone,
        organDone,
        kesimpulanDone,
        identitasDone,
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
    let body = null;
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      }
    } catch (_) {}

    const id = url.searchParams.get('id') || body?.id;

    if (id) {
      await env.DB.prepare('DELETE FROM ckg_sekolah_records WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true, count: 1 }), {
        headers: corsHeaders
      });
    }

    if (body && Array.isArray(body.ids) && body.ids.length > 0) {
      const batchSize = 50;
      let totalDeleted = 0;
      for (let i = 0; i < body.ids.length; i += batchSize) {
        const chunk = body.ids.slice(i, i + batchSize);
        const placeholders = chunk.map(() => '?').join(',');
        const stmt = env.DB.prepare(`DELETE FROM ckg_sekolah_records WHERE id IN (${placeholders})`).bind(...chunk);
        const res = await stmt.run();
        totalDeleted += (res?.meta?.changes ?? chunk.length);
      }
      return new Response(JSON.stringify({ success: true, count: totalDeleted }), {
        headers: corsHeaders
      });
    }

    const sekolah = url.searchParams.get('sekolah') || body?.sekolah;
    const kelas = url.searchParams.get('kelas') || body?.kelas;
    const tahun = url.searchParams.get('tahun') || body?.tahun;
    const status = url.searchParams.get('status') || body?.status;

    let query = 'DELETE FROM ckg_sekolah_records';
    const conditions = [];
    const params = [];

    if (sekolah && sekolah !== 'all' && sekolah !== 'ALL') {
      conditions.push('UPPER(TRIM(sekolah)) = UPPER(TRIM(?))');
      params.push(sekolah);
    }
    if (kelas && kelas !== 'all' && kelas !== 'ALL') {
      conditions.push('UPPER(TRIM(kelas)) = UPPER(TRIM(?))');
      params.push(kelas);
    }
    if (tahun && tahun !== 'all' && tahun !== 'ALL') {
      conditions.push('(tahun_skrining = ? OR (tahun_skrining IS NULL AND substr(tanggal_entry, 1, 4) = ?))');
      params.push(tahun, tahun);
    }
    if (status && status !== 'all' && status !== 'ALL') {
      if (status === 'sudah') {
        conditions.push('is_examined = 1');
      } else if (status === 'belum') {
        conditions.push('(is_examined = 0 AND antro_done = 0 AND vital_done = 0 AND lab_done = 0 AND organ_done = 0 AND kesimpulan_done = 0)');
      } else if (status === 'sebagian') {
        conditions.push('(is_examined = 0 AND (antro_done = 1 OR vital_done = 1 OR lab_done = 1 OR organ_done = 1 OR kesimpulan_done = 1))');
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    let stmt = env.DB.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    const res = await stmt.run();

    return new Response(JSON.stringify({ success: true, count: res?.meta?.changes ?? 0 }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
