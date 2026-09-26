import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

async function getTenant(req) {
  const userId = await getSession(req);
  if (!userId) return null;
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null, owner: false, role: 'TENANT' },
    select: { id:true, firstName:true, lastName:true, email:true, renterId:true },
  });
  return user?.renterId ? user : null;
}

export default async function handler(req, res) {
  try {
    const tenant = await getTenant(req);
    if (!tenant) return res.status(403).json({ error: 'Akun ini bukan akun penyewa yang valid.' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });

    const renter = await db.renter.findFirst({ where: { id: tenant.renterId, deletedAt:null } });
    if (!renter) return res.status(404).json({ error: 'Data penyewa belum ditemukan.' });

    const now = new Date();
    const lodgings = await db.lodging.findMany({
      where: { renterId: tenant.renterId, deletedAt: null, startAt: { lte: now }, OR: [{ endAt: null }, { endAt: { gte: now } }] },
      orderBy: { id: 'desc' }, take: 20,
    });

    const roomIds=[...new Set(lodgings.map(x=>x.roomId))];
    const rooms=roomIds.length?await db.room.findMany({where:{id:{in:roomIds},deletedAt:null}}):[];
    const roomMap=Object.fromEntries(rooms.map(x=>[x.id,x]));
    const lodgingIds=lodgings.map(x=>x.id);
    const bills=lodgingIds.length?await db.bill.findMany({where:{lodgingId:{in:lodgingIds},deletedAt:null},orderBy:{id:'desc'}}):[];
    const billIds=bills.map(x=>x.id);
    const invoices=billIds.length?await db.invoice.findMany({where:{billId:{in:billIds},deletedAt:null},orderBy:{id:'desc'}}):[];
    const invoiceIds=invoices.map(x=>x.id);
    const payments=invoiceIds.length?await db.payment.findMany({
      where:{invoiceId:{in:invoiceIds},deletedAt:null},
      select:{id:true,invoiceId:true,description:true,amount:true,status:true,paymentDate:true,proofName:true,verifiedAt:true,createdAt:true},
      orderBy:{id:'desc'}
    }):[];

    const billMap=Object.fromEntries(bills.map(x=>[x.id,x]));
    const lodgingMap=Object.fromEntries(lodgings.map(x=>[x.id,x]));
    const paymentMap={};
    for(const p of payments)(paymentMap[p.invoiceId]??=[]).push(p);

    return res.json({
      tenant:{id:tenant.id,name:[tenant.firstName,tenant.lastName].filter(Boolean).join(' ')||renter.name,email:tenant.email},
      renter,
      rooms:lodgings.map(l=>({lodgingId:l.id,room:roomMap[l.roomId]||null,startAt:l.startAt,endAt:l.endAt})).filter(x=>x.room),
      invoices:invoices.map(invoice=>{
        const bill=billMap[invoice.billId];
        const lodging=bill?lodgingMap[bill.lodgingId]:null;
        const room=lodging?roomMap[lodging.roomId]:null;
        return {
          id:invoice.id,billId:invoice.billId,name:bill?.name||'Tagihan',description:bill?.description||'',
          amount:Number(bill?.amount||0),perMonth:Boolean(bill?.perMonth),
          room:room?{id:room.id,number:room.number,costPerMonth:room.costPerMonth}:null,
          paymentHistory:paymentMap[invoice.id]||[]
        };
      })
    });
  } catch (error) {
    console.error('Tenant portal error:', error);
    return res.status(503).json({ error: 'Data portal penyewa belum dapat dimuat.' });
  }
}