import { db } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { createSession, setSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(422).json({ error: 'Email dan password wajib diisi' });
    const user = await db.user.findFirst({ where: { email, deletedAt: null } });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Email atau password salah' });
    setSession(res, await createSession(user.id));
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
