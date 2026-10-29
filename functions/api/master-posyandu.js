// Cloudflare Pages Function: API Endpoint for Master Posyandu Records (/api/master-posyandu)

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
  const { env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS master_posyandu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL UNIQUE,
        desa TEXT NOT NULL,
        rw TEXT DEFAULT '',
        password TEXT DEFAULT '',
        allowed_menus TEXT DEFAULT '',
        is_active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let { results } = await env.DB.prepare('SELECT id, nama, desa, rw, password, allowed_menus, is_active, created_at FROM master_posyandu ORDER BY desa ASC, nama ASC').all();

    if (!results || results.length === 0) {
      const defaultPosyandu = [
        { nama: 'Posyandu Mawar 1 (Tarajusari)', desa: 'Tarajusari', rw: 'RW 01' },
        { nama: 'Posyandu Mawar 2 (Tarajusari)', desa: 'Tarajusari', rw: 'RW 02' },
        { nama: 'Posyandu Melati 1 (Banjaran Kulon)', desa: 'Banjaran Kulon', rw: 'RW 01' },
        { nama: 'Posyandu Melati 2 (Banjaran Kulon)', desa: 'Banjaran Kulon', rw: 'RW 02' },
        { nama: 'Posyandu Cempaka 1 (Banjaran Wetan)', desa: 'Banjaran Wetan', rw: 'RW 01' },
        { nama: 'Posyandu Cempaka 2 (Banjaran Wetan)', desa: 'Banjaran Wetan', rw: 'RW 02' },
        { nama: 'Posyandu Teratai 1 (Kiangroke)', desa: 'Kiangroke', rw: 'RW 01' },
        { nama: 'Posyandu Anggrek 1 (Kamasan)', desa: 'Kamasan', rw: 'RW 01' },
        { nama: 'Posyandu Dahlia 1 (Ciapus)', desa: 'Ciapus', rw: 'RW 01' },
        { nama: 'Posyandu Kenanga 1 (Margahayu)', desa: 'Margahayu', rw: 'RW 01' },
        { nama: 'Posyandu Flamboyan 1 (Neglasari)', desa: 'Neglasari', rw: 'RW 01' },
        { nama: 'Posyandu Kamboja 1 (Pasirhuni)', desa: 'Pasirhuni', rw: 'RW 01' },
        { nama: 'Posyandu Nusa Indah 1 (Sindangpanon)', desa: 'Sindangpanon', rw: 'RW 01' }
      ];
      const insertStmt = env.DB.prepare('INSERT OR IGNORE INTO master_posyandu (nama, desa, rw) VALUES (?, ?, ?)');
      const stmts = defaultPosyandu.map(p => insertStmt.bind(p.nama, p.desa, p.rw));
      await env.DB.batch(stmts);
      const refetched = await env.DB.prepare('SELECT id, nama, desa, rw, password, allowed_menus, is_active, created_at FROM master_posyandu ORDER BY desa ASC, nama ASC').all();
      results = refetched.results || [];
    }

    return new Response(JSON.stringify({ success: true, data: results || [] }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const nama = (body.nama || '').trim();
    const desa = (body.desa || 'Tarajusari').trim();
    const rw = (body.rw || '').trim();
    const password = (body.password || '').trim();
    const allowed_menus = typeof body.allowed_menus === 'string' ? body.allowed_menus : JSON.stringify(body.allowed_menus || []);
    const is_active = body.is_active ? 1 : 0;

    if (!nama) {
      return new Response(JSON.stringify({ success: false, error: 'Nama Posyandu required' }), { status: 400, headers: corsHeaders });
    }

    await env.DB.prepare(`
      INSERT INTO master_posyandu (nama, desa, rw, password, allowed_menus, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(nama) DO UPDATE SET
        desa = excluded.desa,
        rw = excluded.rw,
        password = excluded.password,
        allowed_menus = excluded.allowed_menus,
        is_active = excluded.is_active
    `).bind(nama, desa, rw, password, allowed_menus, is_active).run();

    return new Response(JSON.stringify({ success: true, message: 'Posyandu berhasil disimpan' }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const id = body.id;
    const nama = (body.nama || '').trim();

    if (!id && !nama) {
      return new Response(JSON.stringify({ success: false, error: 'id or nama required' }), { status: 400, headers: corsHeaders });
    }

    const updates = [];
    const params = [];

    if (body.newNama !== undefined && body.newNama.trim()) { updates.push('nama = ?'); params.push(body.newNama.trim()); }
    if (body.desa !== undefined) { updates.push('desa = ?'); params.push(body.desa.trim()); }
    if (body.rw !== undefined) { updates.push('rw = ?'); params.push(body.rw.trim()); }
    if (body.password !== undefined) { updates.push('password = ?'); params.push(String(body.password).trim()); }
    if (body.allowed_menus !== undefined) {
      updates.push('allowed_menus = ?');
      params.push(typeof body.allowed_menus === 'string' ? body.allowed_menus : JSON.stringify(body.allowed_menus));
    }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); params.push(body.is_active ? 1 : 0); }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No fields to update' }), { status: 400, headers: corsHeaders });
    }

    if (id) {
      params.push(id);
      await env.DB.prepare(`UPDATE master_posyandu SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    } else {
      params.push(nama);
      await env.DB.prepare(`UPDATE master_posyandu SET ${updates.join(', ')} WHERE UPPER(nama) = UPPER(?)`).bind(...params).run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Data posyandu berhasil diperbarui' }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const nama = url.searchParams.get('nama');
    if (!id && !nama) {
      return new Response(JSON.stringify({ success: false, error: 'id or nama required' }), { status: 400, headers: corsHeaders });
    }
    if (id) {
      await env.DB.prepare('DELETE FROM master_posyandu WHERE id = ?').bind(id).run();
    } else {
      await env.DB.prepare('DELETE FROM master_posyandu WHERE UPPER(nama) = UPPER(?)').bind(nama.trim()).run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
