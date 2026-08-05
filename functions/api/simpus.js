
// Cloudflare Pages Function: API Endpoint for SIMPUS Records (/api/simpus)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const { results } = await env.DB.prepare('SELECT * FROM simpus_records ORDER BY no DESC').all();
    const formatted = (results || []).map(r => ({
      ...r,
      is_divided: Boolean(r.is_divided),
      usia: Number(r.usia || 0),
      bb: Number(r.bb || 0),
      tb: Number(r.tb || 0),
      imt: Number(r.imt || 0),
      sistol: Number(r.sistol || 0),
      diastol: Number(r.diastol || 0)
    }));

    return new Response(JSON.stringify({ success: true, count: formatted.length, data: formatted }), {
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

    const stmt = env.DB.prepare(`
      INSERT INTO simpus_records (
        id, no, tanggal, nama, nik, alamat, dob, usia, bb, tb, imt,
        sistol, diastol, gula, kolesterol, keterangan, is_divided, assigned_to, entry_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
