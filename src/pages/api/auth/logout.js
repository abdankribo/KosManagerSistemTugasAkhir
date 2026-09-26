import { clearSession } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  clearSession(res);
  return res.json({ ok: true });
}
