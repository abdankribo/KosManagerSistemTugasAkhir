import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });
  try {
    const userId=await getSession(req);
    if(!userId) return res.status(401).json({error:'Unauthorized'});
    const tenant=await db.user.findFirst({where:{id:userId,deletedAt:null,owner:false,role:'TENANT'},select:{id:true,renterId:true}});
    if(!tenant?.renterId) return res.status(403).json({error:'Akun belum terhubung ke data penyewa.'});

    const invoiceId=Number(req.body?.invoiceId);
    const paymentDate=new Date(String(req.body?.paymentDate||''));
    const proofData=String(req.body?.proofData||'');
    const proofName=String(req.body?.proofName||'bukti-pembayaran.jpg').slice(0,120);

    if(!Number.isInteger(invoiceId)||invoiceId<=0) return res.status(422).json({error:'Tagihan belum dipilih.'});
    if(Number.isNaN(paymentDate.getTime())) return res.status(422).json({error:'Tanggal pembayaran tidak valid.'});
    if(paymentDate>new Date()) return res.status(422).json({error:'Tanggal pembayaran tidak boleh di masa depan.'});
    if(!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(proofData)) return res.status(422).json({error:'Bukti pembayaran harus berupa foto JPG, PNG, atau WEBP.'});
    if(proofData.length>5_500_000) return res.status(413).json({error:'Ukuran bukti pembayaran terlalu besar. Gunakan foto maksimal sekitar 4 MB.'});

    const invoice=await db.invoice.findFirst({where:{id:invoiceId,deletedAt:null}});
    if(!invoice) return res.status(404).json({error:'Invoice tidak ditemukan.'});
    const bill=await db.bill.findFirst({where:{id:invoice.billId,deletedAt:null}});
    if(!bill) return res.status(404).json({error:'Tagihan tidak ditemukan.'});
    const lodging=await db.lodging.findFirst({where:{id:bill.lodgingId,renterId:tenant.renterId,deletedAt:null}});
    if(!lodging) return res.status(403).json({error:'Invoice ini bukan milik akun penyewa Anda.'});

    const existing=await db.payment.findFirst({where:{invoiceId,deletedAt:null,status:{in:['PENDING','APPROVED']}}});
    if(existing?.status==='APPROVED') return res.status(409).json({error:'Invoice ini sudah memiliki pembayaran yang diterima.'});
    if(existing?.status==='PENDING') return res.status(409).json({error:'Pembayaran untuk invoice ini sedang menunggu verifikasi.'});

    const payment=await db.payment.create({
      data:{invoiceId,description:'Pembayaran '+bill.name,amount:Number(bill.amount),status:'PENDING',paymentDate,proofData,proofName},
      select:{id:true,invoiceId:true,amount:true,status:true,paymentDate:true,proofName:true,createdAt:true}
    });
    return res.status(201).json({ok:true,payment});
  } catch (error) {
    console.error('Tenant payment error:', error);
    return res.status(400).json({error:error?.message||'Pembayaran tidak dapat dikirim.'});
  }
}