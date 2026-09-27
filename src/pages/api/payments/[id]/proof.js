import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

function parseImageDataUrl(value) {
  const match = String(value || '').match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  return { mime: match[1] === 'image/jpg' ? 'image/jpeg' : match[1], data: match[2] };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });

  try {
    const userId = await getSession(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await db.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { owner: true, role: true, renterId: true }
    });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const role = user.owner ? 'ADMIN' : (user.role === 'TENANT' ? 'TENANT' : 'STAFF');
    const id = Number(req.query.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(422).json({ error: 'Pembayaran tidak valid.' });

    const payment = await db.payment.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        proofData: true,
        proofName: true,
        invoice: {
          select: {
            bill: {
              select: {
                lodging: {
                  select: { renterId: true }
                }
              }
            }
          }
        }
      }
    });

    if (!payment) return res.status(404).json({ error: 'Pembayaran tidak ditemukan.' });

    if (role === 'TENANT' && payment.invoice?.bill?.lodging?.renterId !== user.renterId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke bukti pembayaran ini.' });
    }

    if (!payment.proofData) return res.status(404).json({ error: 'Bukti pembayaran tidak tersedia.' });

    const image = parseImageDataUrl(payment.proofData);
    if (!image) return res.status(415).json({ error: 'Format bukti pembayaran tidak didukung.' });

    res.setHeader('Content-Type', image.mime);
    res.setHeader('Content-Disposition', 'inline; filename="' + String(payment.proofName || 'bukti-pembayaran').replace(/[^a-zA-Z0-9._-]/g, '_') + '"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(Buffer.from(image.data, 'base64'));
  } catch (error) {
    console.error('Payment proof error:', error);
    return res.status(400).json({ error: 'Bukti pembayaran tidak dapat ditampilkan.' });
  }
}
