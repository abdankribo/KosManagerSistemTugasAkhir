import { db } from '../../lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '../../lib/auth';

const cfg = {
  users:{model:'user',fields:['firstName','lastName','email','password','owner','role','renterId','photoPath','accountId']},
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

async function addPaymentRenterNames(rows){
  if(!rows.length) return rows;
  const invoiceIds=[...new Set(rows.map(row=>row.invoiceId).filter(Number.isInteger))];
  if(!invoiceIds.length) return rows.map(row=>({...row,renterName:null}));
  const invoices=await db.invoice.findMany({where:{id:{in:invoiceIds},deletedAt:null},select:{id:true,billId:true}});
  const billIds=[...new Set(invoices.map(row=>row.billId).filter(Number.isInteger))];
  const bills=billIds.length?await db.bill.findMany({where:{id:{in:billIds},deletedAt:null},select:{id:true,lodgingId:true}}):[];
  const lodgingIds=[...new Set(bills.map(row=>row.lodgingId).filter(Number.isInteger))];
  const lodgings=lodgingIds.length?await db.lodging.findMany({where:{id:{in:lodgingIds},deletedAt:null},select:{id:true,renterId:true}}):[];
  const renterIds=[...new Set(lodgings.map(row=>row.renterId).filter(Number.isInteger))];
  const renters=renterIds.length?await db.renter.findMany({where:{id:{in:renterIds},deletedAt:null},select:{id:true,name:true}}):[];
  const invoiceMap=new Map(invoices.map(row=>[row.id,row.billId]));
  const billMap=new Map(bills.map(row=>[row.id,row.lodgingId]));
  const lodgingMap=new Map(lodgings.map(row=>[row.id,row.renterId]));
  const renterMap=new Map(renters.map(row=>[row.id,row.name]));
  return rows.map(row=>{
    const billId=invoiceMap.get(row.invoiceId);
    const lodgingId=billId===undefined?undefined:billMap.get(billId);
    const renterId=lodgingId===undefined?undefined:lodgingMap.get(lodgingId);
    return {...row,renterName:renterId===undefined?null:(renterMap.get(renterId)||null)};
  });
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
  if(resource==='users'){
    if(!d.firstName||!d.email) throw Error('Nama depan dan email wajib diisi');
    const role=d.role||'STAFF';
    if(!['ADMIN','STAFF','TENANT'].includes(role)) throw Error('Peran pengguna tidak valid');
    if(role==='TENANT'&&!Number.isInteger(d.renterId)) throw Error('Akun penyewa harus dihubungkan ke data penyewa');
  }
}

async function overlap(roomId,startAt,endAt,exceptId){
  if(!roomId||!startAt) return false;
  // Two date ranges overlap when the existing stay starts before the new
  // stay ends (or has no end) AND the existing stay ends after the new
  // stay starts (or has no end).
  return !!await db.lodging.findFirst({
    where:{
      roomId,
      deletedAt:null,
      id:exceptId?{not:exceptId}:undefined,
      startAt:{lte:endAt||new Date('9999-12-31T23:59:59.999Z')},
      OR:[
        {endAt:null},
        {endAt:{gte:startAt}}
      ]
    }
  });
}

export default async function handler(req,res){
  const parts=req.query.path||[],resource=parts[0],id=parts[1]?Number(parts[1]):null;
  if(!cfg[resource]) return res.status(404).json({error:'Resource tidak ditemukan'});

  const sessionUserId=await getSession(req);
  if(!sessionUserId) return res.status(401).json({error:'Unauthorized'});

  const sessionUser=await db.user.findFirst({
    where:{id:sessionUserId,deletedAt:null},
    select:{id:true,owner:true,role:true,renterId:true}
  });
  if(!sessionUser) return res.status(401).json({error:'Unauthorized'});

  const role=sessionUser.owner?'ADMIN':(sessionUser.role==='TENANT'?'TENANT':'STAFF');
  if(role==='TENANT') return res.status(403).json({error:'Akun Penyewa hanya dapat menggunakan portal pembayaran.'});

  const adminOnly = resource === 'users';
  const userCanWrite = ['renters','lodgings','bills','invoices','payments'].includes(resource);
  if(adminOnly && role!=='ADMIN') return res.status(403).json({error:resource==='rooms'?'Hanya administrator yang dapat menambah atau mengubah data kamar':'Hanya administrator yang dapat mengelola pengguna'});
  if(role!=='ADMIN' && !userCanWrite && req.method!=='GET') return res.status(403).json({error:'Akun User tidak memiliki izin untuk mengubah data ini'});

  const model=db[cfg[resource].model];
  try{
    if(req.method==='GET'){
      if(id){
        let item=resource==='payments'
          ? await model.findFirst({where:{id,deletedAt:null},select:{id:true,invoiceId:true,description:true,amount:true,status:true,paymentDate:true,proofName:true,verifiedAt:true,verifiedByUserId:true,createdAt:true}})
          : await model.findFirst({where:{id,deletedAt:null}});
        if(resource==='payments'&&item) item=(await addPaymentRenterNames([item]))[0];
        if(resource==='users' && item) delete item.password;
        return res.json(item||{});
      }
      const q=String(req.query.q||'').trim();
      let where={deletedAt:null};
      if(q&&['rooms','renters','bills','payments'].includes(resource)){
        const field=resource==='rooms'?'number':resource==='renters'?'name':resource==='bills'?'name':'description';
        where={...where,[field]:{contains:q}};
      }
      let rows=resource==='payments'
        ? await model.findMany({where,orderBy:{id:'desc'},take:200,select:{id:true,invoiceId:true,description:true,amount:true,status:true,paymentDate:true,proofName:true,verifiedAt:true,verifiedByUserId:true,createdAt:true}})
        : await model.findMany({where,orderBy:resource==='rooms'?{number:'asc'}:{id:'desc'},take:200});
      if(resource==='payments') rows=await addPaymentRenterNames(rows);
      if(resource==='rooms'){
        const requestedDate=req.query.date ? new Date(String(req.query.date)+'T00:00:00') : new Date();
        if(Number.isNaN(requestedDate.getTime())) return res.status(400).json({error:'Tanggal pengecekan tidak valid'});
        requestedDate.setHours(0,0,0,0);
        const requestedEnd=new Date(requestedDate);
        requestedEnd.setHours(23,59,59,999);
        const lodgings=await db.lodging.findMany({
          where:{deletedAt:null,startAt:{lte:requestedEnd},OR:[{endAt:null},{endAt:{gte:requestedDate}}]},
          select:{roomId:true,renterId:true,startAt:true,endAt:true}
        });
        const renterIds=[...new Set(lodgings.map(row=>row.renterId).filter(Number.isInteger))];
        const renters=renterIds.length?await db.renter.findMany({where:{id:{in:renterIds},deletedAt:null},select:{id:true,name:true}}):[];
        const renterMap=new Map(renters.map(row=>[row.id,row.name]));
        const lodgingMap=new Map(lodgings.map(row=>[row.roomId,row]));
        rows=rows.map(room=>{
          const lodging=lodgingMap.get(room.id);
          return {
            ...room,
            occupantName:lodging?renterMap.get(lodging.renterId)||null:null,
            occupantStartAt:lodging?.startAt||null,
            occupantEndAt:lodging?.endAt||null
          };
        });
      }
      if(resource==='users') rows.forEach(row=>delete row.password);
      return res.json(rows);
    }

    if(req.method==='POST'){
      if(role!=='ADMIN' && resource==='users') return res.status(403).json({error:'Hanya administrator yang dapat mengelola pengguna'});
      const data=clean(resource,req.body);

      if(resource==='users'){
        const requestedRole=data.role||'STAFF';
        data.role=requestedRole;
        data.owner=requestedRole==='ADMIN';
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
      if(resource==='users' && role!=='ADMIN') return res.status(403).json({error:'Hanya administrator yang dapat mengelola pengguna'});
      if(resource==='users'){
        if(data.role){
          if(!['ADMIN','STAFF','TENANT'].includes(data.role)) throw Error('Peran pengguna tidak valid');
          data.owner=data.role==='ADMIN';
        }
        if(data.password){
          if(String(data.password).length<8) throw Error('Password minimal 8 karakter');
          data.password=await bcrypt.hash(data.password,12);
        }
      }
      if(role!=='ADMIN'){
        delete data.accountId;
        delete data.owner;
        delete data.role;
        delete data.renterId;
      }
      validate(resource,data);
      if(resource==='lodgings'&&await overlap(data.roomId,data.startAt,data.endAt,id)) throw Error('Periode kamar bertabrakan dengan penginapan lain');
      return res.json(await model.update({where:{id},data}));
    }

    if(req.method==='DELETE'&&id){
      if(role!=='ADMIN') return res.status(403).json({error:'Hanya administrator yang dapat menghapus data'});
      return res.json(await model.update({where:{id},data:{deletedAt:new Date()}}));
    }

    return res.status(405).json({error:'Method tidak diizinkan'});
  }catch(e){return res.status(400).json({error:e?.message||'Permintaan tidak valid'});}
}