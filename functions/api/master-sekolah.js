// Cloudflare Pages Function: API Endpoint for Master Sekolah Records (/api/master-sekolah)

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
      CREATE TABLE IF NOT EXISTS master_sekolah (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL UNIQUE,
        level TEXT NOT NULL,
        password TEXT DEFAULT '',
        allowed_menus TEXT DEFAULT '',
        is_active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    try { await env.DB.prepare("ALTER TABLE master_sekolah ADD COLUMN password TEXT DEFAULT ''").run(); } catch (_) {}
    try { await env.DB.prepare("ALTER TABLE master_sekolah ADD COLUMN allowed_menus TEXT DEFAULT ''").run(); } catch (_) {}
    try { await env.DB.prepare("ALTER TABLE master_sekolah ADD COLUMN is_active INTEGER DEFAULT 0").run(); } catch (_) {}

    let { results } = await env.DB.prepare('SELECT id, nama, level, password, allowed_menus, is_active, created_at FROM master_sekolah ORDER BY level ASC, nama ASC').all();
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
    const items = Array.isArray(body) ? body : [body];
    const stmt = env.DB.prepare(`
      INSERT INTO master_sekolah (nama, level, password, allowed_menus, is_active) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(nama) DO UPDATE SET 
        level = excluded.level,
        password = CASE WHEN excluded.password != '' THEN excluded.password ELSE master_sekolah.password END,
        allowed_menus = excluded.allowed_menus,
        is_active = excluded.is_active
    `);
    const statements = items.map(item => stmt.bind(
      (item.nama || '').trim().toUpperCase(), 
      (item.level || 'SD').trim().toUpperCase(),
      (item.password || '').trim(),
      (item.allowed_menus || '').trim(),
      item.is_active ? 1 : 0
    ));
    await env.DB.batch(statements);
    return new Response(JSON.stringify({ success: true, count: items.length }), { headers: corsHeaders });
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
    const targetNama = (body.oldNama || body.nama || '').trim().toUpperCase();
    if (!targetNama) {
      return new Response(JSON.stringify({ success: false, error: 'Nama sekolah required' }), { status: 400, headers: corsHeaders });
    }

    if (body.password !== undefined || body.allowed_menus !== undefined || body.is_active !== undefined) {
      const updates = [];
      const params = [];
      if (body.password !== undefined) { updates.push('password = ?'); params.push(String(body.password).trim()); }
      if (body.allowed_menus !== undefined) {
        updates.push('allowed_menus = ?');
        params.push(typeof body.allowed_menus === 'string' ? body.allowed_menus : JSON.stringify(body.allowed_menus));
      }
      if (body.is_active !== undefined) { updates.push('is_active = ?'); params.push(body.is_active ? 1 : 0); }
      params.push(targetNama);

      await env.DB.prepare(`UPDATE master_sekolah SET ${updates.join(', ')} WHERE UPPER(nama) = ?`).bind(...params).run();
      return new Response(JSON.stringify({ success: true, message: 'Akses sekolah berhasil diperbarui' }), { headers: corsHeaders });
    }

    const cleanOld = targetNama;
    const cleanNew = (body.newNama || body.nama || '').trim().toUpperCase();
    const cleanLevel = (body.level || 'SD').trim().toUpperCase();

    await env.DB.prepare('UPDATE master_sekolah SET nama = ?, level = ? WHERE UPPER(nama) = ?').bind(cleanNew, cleanLevel, cleanOld).run();

    let updatedStudents = 0;
    if (cleanOld !== cleanNew) {
      const updateRes = await env.DB.prepare('UPDATE ckg_sekolah_records SET sekolah = ? WHERE UPPER(sekolah) = ?').bind(cleanNew, cleanOld).run();
      updatedStudents = updateRes.meta?.changes || 0;
    }

    return new Response(JSON.stringify({ success: true, updatedStudents }), { headers: corsHeaders });
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
    const nama = url.searchParams.get('nama');
    if (!nama) {
      return new Response(JSON.stringify({ success: false, error: 'nama parameter required' }), { status: 400, headers: corsHeaders });
    }
    await env.DB.prepare('DELETE FROM master_sekolah WHERE UPPER(nama) = ?').bind(nama.trim().toUpperCase()).run();
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
