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

// GET /api/simpus - Fetch all SIMPUS records from Cloudflare D1 Database
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
    
    // Parse boolean and number values
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

// POST /api/simpus - Insert or Bulk Sync SIMPUS records to Cloudflare D1 Database
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
      ON CONFLICT(id) DO UPDATE SET
        no = excluded.no,
        tanggal = excluded.tanggal,
        nama = excluded.nama,
        nik = excluded.nik,
        alamat = excluded.alamat,
        dob = excluded.dob,
        usia = excluded.usia,
        bb = excluded.bb,
        tb = excluded.tb,
        imt = excluded.imt,
        sistol = excluded.sistol,
        diastol = excluded.diastol,
        gula = excluded.gula,
        kolesterol = excluded.kolesterol,
        keterangan = excluded.keterangan,
        is_divided = excluded.is_divided,
        assigned_to = excluded.assigned_to,
        entry_status = excluded.entry_status
    `);

    const statements = records.map(r => stmt.bind(
      r.id,
      r.no || 0,
      r.tanggal || '',
      r.nama || '',
      r.nik || '',
      r.alamat || '',
      r.dob || '',
      r.usia || 0,
      r.bb || 0,
      r.tb || 0,
      r.imt || 0,
      r.sistol || 0,
      r.diastol || 0,
      r.gula || '-',
      r.kolesterol || '-',
      r.keterangan || 'Dewasa',
      r.is_divided ? 1 : 0,
      r.assigned_to || '',
      r.entry_status || 'belum'
    ));

    await env.DB.batch(statements);

    return new Response(JSON.stringify({ success: true, synced: records.length }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE /api/simpus - Delete all or specific SIMPUS record
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
    const recordId = url.searchParams.get('id');

    if (recordId) {
      await env.DB.prepare('DELETE FROM simpus_records WHERE id = ?').bind(recordId).run();
    } else {
      await env.DB.prepare('DELETE FROM simpus_records').run();
    }

    return new Response(JSON.stringify({ success: true, message: 'Deleted successfully' }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
