import { db } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '../../../lib/auth';

function fail(message){ throw new Error(message); }

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method tidak diizinkan'});
  const sessionUserId=await getSession(req);
  if(!sessionUserId) return res.status(401).json({error:'Unauthorized'});
  const actor=await db.user.findFirst({where:{id:sessionUserId,deletedAt:null},select:{id:true,accountId:true,owner:true,role:true}});
  if(!actor || actor.role==='TENANT') return res.status(403).json({error:'Akun Penyewa tidak dapat menerima penyewa baru'});

  try{
    const body=req.body||{};
    const name=String(body.name||'').trim();
    const nik=String(body.nik||'').trim();
    const gender=String(body.gender||'').trim();
    const phoneNumber=String(body.phoneNumber||'').trim();
    const address=String(body.address||'').trim();
    const roomId=Number(body.roomId);
    const startAt=new Date(body.startAt||'');
    const username=String(body.username||'').trim().toLowerCase();
    const password=String(body.password||'');
    if(!name||!/^[0-9]{16}$/.test(nik)||!['Laki-Laki','Perempuan'].includes(gender)||!/^[0-9]{10,15}$/.test(phoneNumber)||!address) fail('Data penyewa belum lengkap atau tidak valid');
    if(!Number.isInteger(roomId)) fail('Kamar harus dipilih');
    if(Number.isNaN(startAt.getTime())) fail('Tanggal mulai tidak valid');
    if(!username) fail('Username wajib diisi');
    if(password.length<8) fail('Password minimal 8 karakter');

    const room=await db.room.findFirst({where:{id:roomId,deletedAt:null}});
    if(!room) fail('Kamar tidak ditemukan');
    const occupied=await db.lodging.findFirst({where:{roomId,deletedAt:null,startAt:{lte:startAt},OR:[{endAt:null},{endAt:{gte:startAt}}]}});
    if(occupied) fail('Kamar tersebut sudah terisi pada tanggal mulai yang dipilih');
    const duplicateUser=await db.user.findFirst({where:{email:username}});
    if(duplicateUser) fail('Username sudah digunakan');
    const duplicateRenter=await db.renter.findFirst({where:{nik,deletedAt:null}});
    if(duplicateRenter) fail('NIK penyewa sudah terdaftar');

    const result=await db.$transaction(async tx=>{
      const renter=await tx.renter.create({data:{nik,name,gender,phoneNumber,address}});
      const lodging=await tx.lodging.create({data:{renterId:renter.id,roomId,startAt,endAt:null}});
      const monthLabel=startAt.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
      const bill=await tx.bill.create({data:{lodgingId:lodging.id,name:'Sewa Kamar',description:'Sewa kamar '+room.number+' untuk '+monthLabel,amount:room.costPerMonth,perMonth:true}});
      const invoice=await tx.invoice.create({data:{billId:bill.id}});
      const user=await tx.user.create({data:{accountId:actor.accountId,firstName:name.split(' ')[0],lastName:name.split(' ').slice(1).join(' '),email:username,password:await bcrypt.hash(password,12),owner:false,role:'TENANT',renterId:renter.id}});
      return {renter,lodging,bill,invoice,user};
    });
    return res.status(201).json({ok:true,tenant:{id:result.renter.id,name:result.renter.name,username:result.user.email},room:{id:room.id,number:room.number,costPerMonth:room.costPerMonth},billId:result.bill.id,invoiceId:result.invoice.id});
  }catch(e){return res.status(400).json({error:e?.message||'Gagal menerima penyewa'});}
}
