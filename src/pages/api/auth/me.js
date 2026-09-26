import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req, res) {
  const userId = await getSession(req);
  if (!userId) return res.status(401).json({ authenticated: false });

  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id:true, firstName:true, lastName:true, email:true, owner:true, role:true, renterId:true },
  });
  if (!user) return res.status(401).json({ authenticated: false });

  const role = user.owner ? 'ADMIN' : (user.role === 'TENANT' ? 'TENANT' : 'STAFF');
  return res.json({ authenticated: true, user: { ...user, role } });
}