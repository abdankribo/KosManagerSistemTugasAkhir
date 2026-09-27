import { db } from '../../../lib/db';
import { getSession } from '../../../lib/auth';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method tidak diizinkan'});
  const sessionUserId=await getSession(req);
  if(!sessionUserId) return res.status(401).json({error:'Unauthorized'});
  const sessionUser=await db.user.findFirst({where:{id:sessionUserId,deletedAt:null},select:{owner:true,role:true}});
  if(!sessionUser || sessionUser.role==='TENANT') return res.status(403).json({error:'Akses ditolak'});

  const requestedDate=req.query.date ? new Date(String(req.query.date)+'T00:00:00') : new Date();
  if(Number.isNaN(requestedDate.getTime())) return res.status(400).json({error:'Tanggal mulai tidak valid'});
  requestedDate.setHours(0,0,0,0);
  const requestedEnd=new Date(requestedDate);
  requestedEnd.setHours(23,59,59,999);

  const rooms=await db.room.findMany({where:{deletedAt:null},orderBy:{number:'asc'}});
  const occupied=await db.lodging.findMany({
    where:{deletedAt:null,startAt:{lte:requestedEnd},OR:[{endAt:null},{endAt:{gte:requestedDate}}]},
    select:{roomId:true}
  });
  const occupiedIds=new Set(occupied.map(x=>x.roomId));
  return res.json(rooms.filter(room=>!occupiedIds.has(room.id)));
}
