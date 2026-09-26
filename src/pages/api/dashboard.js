import {db} from '../../lib/db';
import {getSession} from '../../lib/auth';

export default async function handler(req,res){
 try{
  const userId=await getSession(req);
  if(!userId)return res.status(401).json({error:'Unauthorized'});
  const user=await db.user.findFirst({where:{id:userId,deletedAt:null},select:{id:true,firstName:true,lastName:true,email:true,owner:true,role:true,renterId:true}});
  if(!user)return res.status(401).json({error:'Unauthorized'});
  const role=user.owner?'ADMIN':(user.role==='TENANT'?'TENANT':'STAFF');

  if(role==='TENANT'){
    return res.json({users:0,rooms:0,renters:0,lodgings:0,bills:0,invoices:0,payments:0,database:true,role});
  }

  const now=new Date();
  const [users,rooms,renters,lodgings,bills,invoices,payments]=await Promise.all([
   db.user.count({where:{deletedAt:null}}),
   db.room.count({where:{deletedAt:null}}),
   db.renter.count({where:{deletedAt:null}}),
   db.lodging.count({where:{deletedAt:null,startAt:{lte:now},OR:[{endAt:null},{endAt:{gte:now}}]}}),
   db.bill.count({where:{deletedAt:null}}),
   db.invoice.count({where:{deletedAt:null}}),
   db.payment.count({where:{deletedAt:null}})
  ]);
  const pendingPayments=await db.payment.count({where:{deletedAt:null,status:'PENDING'}});
  return res.json({users,rooms,renters,lodgings,bills,invoices,payments,pendingPayments,database:true,role});
 }catch(e){return res.status(503).json({error:'Database tidak tersedia',database:false});}
}