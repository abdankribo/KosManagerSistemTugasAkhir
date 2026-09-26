import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '../../lib/auth';

const cfg = {
  users:{model:'user',fields:['firstName','lastName','email','password','owner','photoPath','accountId']},
  rooms:{model:'room',fields:['number','length','width','facilities','costPerMonth']},
  renters:{model:'renter',fields:['nik','name','gender','phoneNumber','address']},
  lodgings:{model:'lodging',fields:['renterId','roomId','startAt','endAt']},
  bills:{model:'bill',fields:['lodgingId','name','description','amount','perMonth']},
  invoices:{model:'invoice',fields:['billId']},
  payments:{model:'payment',fields:['invoiceId','description','amount']}
};
const numeric=new Set(['length','width','costPerMonth','amount','accountId','renterId','roomId','lodgingId','billId','invoiceId']);
const boolean=new Set(['owner','perMonth']);

function clean(resource,body={}) {
  const out={};
  for(const key of cfg[resource].fields){
    if(body[key]===undefined) continue;
    let value=body[key];
    if(numeric.has(key)) value=Number(value);
    if(boolean.has(key)) value=value===true||value==='true'||value===1||value==='1';
    if(['startAt','endAt'].includes(key)) value=value?new Date(value):null;
    if(typeof value==='string') value=value.trim();
    out[key]=value;
  }
  return out;
}
function validate(resource,d){
  if(resource==='rooms'){
    if(!d.number) throw Error('Nomor kamar wajib diisi');
    if(!Number.isFinite(d.length)||d.length<=0||!Number.isFinite(d.width)||d.width<=0) throw Error('Ukuran kamar harus lebih dari 0');
    if(!Number.isFinite(d.costPerMonth)||d.costPerMonth<0) throw Error('Biaya bulanan tidak valid');
    const a=String(d.facilities||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(a.some(x=>!['AC','Bed','Bathroom','Furniture'].includes(x))) throw Error('Fasilitas tidak valid');
    d.facilities=a.join(',');
  }
  if(resource==='renters'){
    if(!/^\d{16}$/.test(d.nik||'')) throw Error('NIK harus 16 digit');
    if(!/^\d{10,15}$/.test(d.phoneNumber||'')) throw Error('Nomor telepon harus 10-15 digit');
    if(!['Laki-Laki','Perempuan'].includes(d.gender)) throw Error('Jenis kelamin tidak valid');
    if(!d.name||!d.address) throw Error('Nama dan alamat wajib diisi');
  }
  if(['bills','payments'].includes(resource)&&(!Number.isFinite(d.amount)||d.amount<=0)) throw Error('Nominal harus lebih dari 0');
  if(resource==='lodgings'){
    if(!Number.isInteger(d.renterId)||!Number.isInteger(d.roomId)) throw Error('Penyewa dan kamar wajib dipilih');
    if(d.startAt&&d.endAt&&d.endAt<d.startAt) throw Error('Tanggal selesai tidak boleh sebelum tanggal mulai');
  }
}
async function overlap(roomId,startAt,endAt,exceptId){
  if(!startAt||!endAt) return false;
  return !!await db.lodging.findFirst({where:{roomId,deletedAt:null,id:exceptId?{not:exceptId}:undefined,startAt:{lte:endAt},endAt:{gte:startAt}}});
}
export default async function handler(req,res){
  const parts=req.query.path||[],resource=parts[0],id=parts[1]?Number(parts[1]):null;
  if(!cfg[resource]) return res.status(404).json({error:'Resource tidak ditemukan'});
  const sessionUserId=await getSession(req);
  if(!sessionUserId) return res.status(401).json({error:'Unauthorized'});
  const sessionUser=await db.user.findFirst({where:{id:sessionUserId,deletedAt:null},select:{id:true,owner:true}});
  if(!sessionUser) return res.status(401).json({error:'Unauthorized'});
  const adminOnly = resource === 'users';
  const userCanWrite = ['rooms','renters','lodgings','bills','invoices','payments'].includes(resource);
  if(adminOnly && !sessionUser.owner) return res.status(403).json({error:'Hanya administrator yang dapat mengelola pengguna'});
  if(!sessionUser.owner && !userCanWrite && req.method !== 'GET') return res.status(403).json({error:'Akun User tidak memiliki izin untuk mengubah data ini'});
  const model=db[cfg[resource].model];
  try{
    if(req.method==='GET'){
      if(id){
        const item=await model.findFirst({where:{id,deletedAt:null}});
        return res.json(item||{});
      }
      const q=String(req.query.q||'').trim();
      let where={deletedAt:null};
      if(q&&['rooms','renters','bills','payments'].includes(resource)){
        const field=resource==='rooms'?'number':resource==='renters'?'name':resource==='bills'?'name':'description';
        where={...where,[field]:{contains:q}};
      }
      return res.json(await model.findMany({where,orderBy:{id:'desc'},take:200}));
    }
    if(req.method==='POST'){
      const data=clean(resource,req.body);
      if(resource==='users' && !sessionUser.owner) return res.status(403).json({error:'Hanya administrator yang dapat mengelola pengguna'});
      if(!sessionUser.owner){
        delete data.accountId;
        delete data.owner;
        delete data.password;
      }
      if(resource==='users'){
        if(!data.accountId){const account=await db.account.findFirst();if(!account)throw Error('Buat account terlebih dahulu');data.accountId=account.id;}
        if(!data.password||String(data.password).length<8) throw Error('Password minimal 8 karakter');
        data.password=await bcrypt.hash(data.password,12);
      }
      validate(resource,data);
      if(resource==='lodgings'&&await overlap(data.roomId,data.startAt,data.endAt)) throw Error('Periode kamar bertabrakan dengan penginapan lain');
      return res.status(201).json(await model.create({data}));
    }
    if(req.method==='PUT'&&id){
      const data=clean(resource,req.body);
      if(resource==='users' && !sessionUser.owner) return res.status(403).json({error:'Hanya administrator yang dapat mengelola pengguna'});
      if(!sessionUser.owner){
        delete data.accountId;
        delete data.owner;
      }
      if(resource==='users'&&data.password){
        if(String(data.password).length<8) throw Error('Password minimal 8 karakter');
        data.password=await bcrypt.hash(data.password,12);
      }
      validate(resource,data);
      if(resource==='lodgings'&&await overlap(data.roomId,data.startAt,data.endAt,id)) throw Error('Periode kamar bertabrakan dengan penginapan lain');
      return res.json(await model.update({where:{id},data}));
    }
    if(req.method==='DELETE'&&id){
      if(!sessionUser.owner) return res.status(403).json({error:'Hanya administrator yang dapat menghapus data'});
      return res.json(await model.update({where:{id},data:{deletedAt:new Date()}}));
    }
    return res.status(405).json({error:'Method tidak diizinkan'});
  }catch(e){return res.status(400).json({error:e?.message||'Permintaan tidak valid'});}
}
