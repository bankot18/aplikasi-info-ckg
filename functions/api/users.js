// Cloudflare Pages Function: API Endpoint for Users (/api/users)

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
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    const { results } = await env.DB.prepare('SELECT nama_user, password, role FROM users ORDER BY rowid ASC').all();
    return new Response(JSON.stringify({ success: true, data: results || [] }), {
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
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    const users = Array.isArray(body) ? body : [body];

    const stmt = env.DB.prepare(`
      INSERT INTO users (nama_user, password, role) VALUES (?, ?, ?)
      ON CONFLICT(nama_user) DO UPDATE SET
        password = excluded.password,
        role = excluded.role
    `);

    const statements = users.map(u => stmt.bind(u.nama_user, u.password || '', u.role || 'Petugas'));
    await env.DB.batch(statements);

    return new Response(JSON.stringify({ success: true, count: users.length }), {
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
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(request.url);
    const nama_user = url.searchParams.get('nama_user');

    if (!nama_user) {
      return new Response(JSON.stringify({ success: false, error: 'nama_user parameter is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    await env.DB.prepare('DELETE FROM users WHERE nama_user = ?').bind(nama_user).run();

    return new Response(JSON.stringify({ success: true, message: `User ${nama_user} deleted` }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

