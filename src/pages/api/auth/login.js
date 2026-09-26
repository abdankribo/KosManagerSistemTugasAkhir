import { db } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { createSession, setSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  try {
    const username = String(req.body?.username ?? req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(422).json({ error: 'Username dan password wajib diisi' });
    }

    const user = await db.user.findFirst({
      where: { email: username, deletedAt: null },
    });

    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    setSession(res, await createSession(user.id));
    return res.json({ ok: true });
  } catch (error) {
    console.error('Login error:', error);

    const code = error?.code;
    if (code === 'P1001' || code === 'P1002') {
      return res.status(503).json({ error: 'Database belum terhubung. Periksa DATABASE_URL di Vercel.' });
    }
    if (code === 'P2021') {
      return res.status(503).json({ error: 'Tabel database belum tersedia. Database perlu disiapkan terlebih dahulu.' });
    }
    if (code === 'P2022') {
      return res.status(503).json({ error: 'Struktur tabel database belum sesuai dengan aplikasi.' });
    }

    return res.status(500).json({ error: 'Terjadi kesalahan server saat memproses login.' });
  }
}
