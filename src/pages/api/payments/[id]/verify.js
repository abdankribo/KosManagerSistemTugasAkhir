import { db } from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

export default async function handler(req,res){
  if(req.method!=='PATCH') return res.status(405).json({error:'Method tidak diizinkan'});
  try{
    const userId=await getSession(req);
    if(!userId)return res.status(401).json({error:'Unauthorized'});
    const user=await db.user.findFirst({where:{id:userId,deletedAt:null},select:{owner:true,role:true}});
    const role=user?.owner?'ADMIN':(user?.role==='TENANT'?'TENANT':'STAFF');
    if(!user||role==='TENANT')return res.status(403).json({error:'Hanya Admin atau Karyawan yang dapat memverifikasi pembayaran.'});

    const id=Number(req.query.id);
    const action=String(req.body?.action||'').toUpperCase();
    const note=String(req.body?.note||'').trim();
    if(!Number.isInteger(id)||id<=0)return res.status(422).json({error:'Pembayaran tidak valid.'});
    if(!['APPROVED','REJECTED'].includes(action))return res.status(422).json({error:'Status verifikasi tidak valid.'});

    const payment=await db.payment.findFirst({where:{id,deletedAt:null}});
    if(!payment)return res.status(404).json({error:'Pembayaran tidak ditemukan.'});
    if(payment.status!=='PENDING')return res.status(409).json({error:'Pembayaran ini sudah diverifikasi.'});

    const description=note?payment.description+' · '+note:payment.description;
    const updated=await db.payment.update({
      where:{id},
      data:{status:action,verifiedAt:new Date(),verifiedByUserId:userId,description},
      select:{id:true,status:true,verifiedAt:true,verifiedByUserId:true,description:true}
    });
    return res.json({ok:true,payment:updated});
  }catch(error){
    console.error('Payment verification error:',error);
    return res.status(400).json({error:error?.message||'Verifikasi gagal.'});
  }
}