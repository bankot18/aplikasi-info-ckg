// Cloudflare Pages Function: API Endpoint for Alat & BNHP CKG Logistik (/api/alat-bnhp)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// GET /api/alat-bnhp - Ambil semua item inventaris, log pemakaian, dan peminjaman
export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    // Pastikan tabel ada
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_logistik_items (
        id TEXT PRIMARY KEY,
        kode TEXT,
        nama TEXT NOT NULL,
        kategori TEXT NOT NULL DEFAULT 'BNHP',
        satuan TEXT NOT NULL DEFAULT 'Pcs',
        stok INTEGER NOT NULL DEFAULT 0,
        stok_min INTEGER NOT NULL DEFAULT 10,
        batch_no TEXT DEFAULT '-',
        expired_date TEXT DEFAULT '-',
        kondisi TEXT DEFAULT 'Baik',
        catatan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_logistik_pemakaian (
        id TEXT PRIMARY KEY,
        tanggal TEXT NOT NULL,
        lokasi_kegiatan TEXT NOT NULL,
        petugas TEXT NOT NULL,
        items_json TEXT NOT NULL,
        items_detail_json TEXT,
        jumlah_sasaran INTEGER DEFAULT 0,
        catatan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS ckg_logistik_peminjaman (
        id TEXT PRIMARY KEY,
        tanggal_pinjam TEXT NOT NULL,
        rencana_kembali TEXT,
        tanggal_kembali TEXT DEFAULT '-',
        peminjam TEXT NOT NULL,
        kontak TEXT,
        daftar_alat_json TEXT NOT NULL,
        status TEXT DEFAULT 'Dipinjam',
        kondisi_kembali TEXT DEFAULT '-',
        catatan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const { results: items } = await env.DB.prepare('SELECT * FROM ckg_logistik_items ORDER BY kategori ASC, nama ASC').all();
    const { results: pemakaian } = await env.DB.prepare('SELECT * FROM ckg_logistik_pemakaian ORDER BY tanggal DESC, created_at DESC LIMIT 200').all();
    const { results: peminjaman } = await env.DB.prepare('SELECT * FROM ckg_logistik_peminjaman ORDER BY tanggal_pinjam DESC, created_at DESC LIMIT 200').all();

    // Format nested json arrays
    const formattedPemakaian = (pemakaian || []).map(p => {
      let details = [];
      try {
        if (p.items_detail_json) details = JSON.parse(p.items_detail_json);
      } catch (e) {}
      return {
        ...p,
        items_detail: details
      };
    });

    const formattedPeminjaman = (peminjaman || []).map(p => {
      let alatList = [];
      try {
        if (p.daftar_alat_json) alatList = JSON.parse(p.daftar_alat_json);
      } catch (e) {}
      return {
        ...p,
        daftar_alat: alatList,
        daftar_alat_text: Array.isArray(alatList) ? alatList.join(', ') : (p.daftar_alat_json || '-')
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        items: items || [],
        pemakaian: formattedPemakaian,
        peminjaman: formattedPeminjaman
      }
    }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

// POST /api/alat-bnhp - Simpan item, catat pemakaian, atau pinjam alat
export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const action = body.action;
    const payload = body.payload || {};

    if (action === 'seed' || action === 'save_item') {
      const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(body.items) ? body.items : [payload]);
      const stmt = env.DB.prepare(`
        INSERT INTO ckg_logistik_items (
          id, kode, nama, kategori, satuan, stok, stok_min, batch_no, expired_date, kondisi, catatan, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          kode = excluded.kode,
          nama = excluded.nama,
          kategori = excluded.kategori,
          satuan = excluded.satuan,
          stok = excluded.stok,
          stok_min = excluded.stok_min,
          batch_no = excluded.batch_no,
          expired_date = excluded.expired_date,
          kondisi = excluded.kondisi,
          catatan = excluded.catatan,
          updated_at = excluded.updated_at
      `);

      const statements = items.map(it => stmt.bind(
        it.id || ('itm-' + Date.now()),
        it.kode || '',
        it.nama || '',
        it.kategori || 'BNHP',
        it.satuan || 'Pcs',
        Number(it.stok || 0),
        Number(it.stok_min || 10),
        it.batch_no || '-',
        it.expired_date || '-',
        it.kondisi || 'Baik',
        it.catatan || '',
        new Date().toISOString()
      ));

      await env.DB.batch(statements);
      return new Response(JSON.stringify({ success: true, count: items.length }), { headers: corsHeaders });
    }

    if (action === 'restock') {
      const { id, qty } = payload;
      await env.DB.prepare(`
        UPDATE ckg_logistik_items 
        SET stok = stok + ?, updated_at = ?
        WHERE id = ?
      `).bind(Number(qty || 0), new Date().toISOString(), id).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === 'catat_pemakaian') {
      const p = payload;
      await env.DB.prepare(`
        INSERT INTO ckg_logistik_pemakaian (
          id, tanggal, lokasi_kegiatan, petugas, items_json, items_detail_json, jumlah_sasaran, catatan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        p.id,
        p.tanggal,
        p.lokasi_kegiatan,
        p.petugas,
        p.items_json || '',
        JSON.stringify(p.items_detail || []),
        Number(p.jumlah_sasaran || 0),
        p.catatan || ''
      ).run();

      // Kurangi stok di Cloudflare D1
      if (Array.isArray(p.items_detail)) {
        for (const it of p.items_detail) {
          await env.DB.prepare(`
            UPDATE ckg_logistik_items 
            SET stok = MAX(0, stok - ?), updated_at = ?
            WHERE id = ?
          `).bind(Number(it.qty || 0), new Date().toISOString(), it.id).run();
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === 'pinjam_alat') {
      const p = payload;
      await env.DB.prepare(`
        INSERT INTO ckg_logistik_peminjaman (
          id, tanggal_pinjam, rencana_kembali, tanggal_kembali, peminjam, kontak, daftar_alat_json, status, kondisi_kembali, catatan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        p.id,
        p.tanggal_pinjam,
        p.rencana_kembali || '',
        p.tanggal_kembali || '-',
        p.peminjam,
        p.kontak || '',
        JSON.stringify(p.daftar_alat || []),
        p.status || 'Dipinjam',
        p.kondisi_kembali || '-',
        p.catatan || ''
      ).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === 'kembali_alat') {
      const p = payload;
      await env.DB.prepare(`
        UPDATE ckg_logistik_peminjaman
        SET status = 'Dikembalikan',
            tanggal_kembali = ?,
            kondisi_kembali = ?,
            catatan = ?
        WHERE id = ?
      `).bind(
        p.tanggal_kembali || new Date().toISOString().split('T')[0],
        p.kondisi_kembali || 'Lengkap & Berfungsi Baik',
        p.catatan || '',
        p.id
      ).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

// DELETE /api/alat-bnhp - Hapus item, pemakaian, atau peminjaman
export async function onRequestDelete(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database D1 binding not configured' }), { status: 500, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'item'; // 'item', 'pemakaian', 'peminjaman'
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Parameter id wajib disertakan' }), { status: 400, headers: corsHeaders });
    }

    if (type === 'pemakaian') {
      await env.DB.prepare('DELETE FROM ckg_logistik_pemakaian WHERE id = ?').bind(id).run();
    } else if (type === 'peminjaman') {
      await env.DB.prepare('DELETE FROM ckg_logistik_peminjaman WHERE id = ?').bind(id).run();
    } else {
      await env.DB.prepare('DELETE FROM ckg_logistik_items WHERE id = ?').bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}
