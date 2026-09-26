import {useRouter} from 'next/router';
import {useEffect,useMemo,useState} from 'react';

const meta={
 users:{title:'Users',fields:[['firstName','Nama depan','text'],['lastName','Nama belakang','text'],['email','Email','email'],['password','Password','password'],['role','Peran','role']]},
 rooms:{title:'Kamar',fields:[['number','Nomor kamar','text'],['length','Panjang (m)','number'],['width','Lebar (m)','number'],['costPerMonth','Biaya/bulan','number']]},
 renters:{title:'Penyewa',fields:[['nik','NIK','text'],['name','Nama','text'],['phoneNumber','Telepon','tel'],['address','Alamat','text']]},
 lodgings:{title:'Penginapan',fields:[['renterId','Penyewa','renter'],['roomId','Kamar','room'],['startAt','Mulai','datetime-local'],['endAt','Selesai','datetime-local']]},
 bills:{title:'Tagihan',fields:[['lodgingId','Penginapan','lodging'],['name','Nama tagihan','text'],['description','Deskripsi','text'],['amount','Nominal','number']]},
 invoices:{title:'Invoice',fields:[['billId','Tagihan','bill']]},
 payments:{title:'Pembayaran',fields:[['invoiceId','Invoice','invoice'],['description','Deskripsi','text'],['amount','Nominal','number']]}
};
const nav=[['rooms','Kamar'],['renters','Penyewa'],['lodgings','Penginapan'],['bills','Tagihan'],['invoices','Invoice'],['payments','Pembayaran']];

function optionLabel(type,x){
 if(type==='renter') return x.name;
 if(type==='room') return 'Kamar '+x.number;
 if(type==='lodging') return '#'+x.id+' · Kamar '+x.roomId;
 if(type==='bill') return '#'+x.id+' · '+x.name;
 return '#'+x.id+' · Invoice';
}
function roleLabel(role,owner){
 if(owner||role==='ADMIN')return 'Administrator';
 if(role==='TENANT')return 'Penyewa';
 return 'Karyawan';
}
function itemLabel(resource,x,refs){
 if(resource==='rooms') return '#'+x.id+' · Kamar '+x.number+' · Rp '+Number(x.costPerMonth||0).toLocaleString('id-ID')+'/bulan';
 if(resource==='renters') return '#'+x.id+' · '+x.name+' · '+x.phoneNumber;
 if(resource==='lodgings') return '#'+x.id+' · '+(refs.renter?.[x.renterId]||'Penyewa '+x.renterId)+' · Kamar '+x.roomId;
 if(resource==='bills') return '#'+x.id+' · '+x.name+' · Rp '+Number(x.amount||0).toLocaleString('id-ID');
 if(resource==='invoices') return '#'+x.id+' · Tagihan #'+x.billId;
 if(resource==='payments') return '#'+x.id+' · Rp '+Number(x.amount||0).toLocaleString('id-ID')+' · '+x.description+' · '+(x.status==='APPROVED'?'Diterima':x.status==='REJECTED'?'Ditolak':'Menunggu verifikasi');
 return '#'+x.id+' · '+(x.firstName||'')+' '+(x.lastName||'')+' · '+roleLabel(x.role,x.owner)+' · '+x.email;
}

export default function Resource(){
 const router=useRouter(),resource=router.query.resource,info=meta[resource];
 const [items,setItems]=useState([]),[refs,setRefs]=useState({}),[form,setForm]=useState({}),[editing,setEditing]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[user,setUser]=useState(null);

 async function load(){
  if(!info)return;
  setLoading(true);
  const x=await fetch('/api/'+resource+(query?'?q='+encodeURIComponent(query):''));
  if(x.status===401){router.replace('/login');return;}
  if(x.status===403){setError(resource==='users'?'Halaman Users hanya dapat diakses administrator.':'Akses ditolak untuk akun ini.');setItems([]);setLoading(false);return;}
  setItems(x.ok?await x.json():[]);
  setLoading(false);
 }
 async function loadRefs(){
  if(!info)return;
  const types=[...new Set(info.fields.map(f=>f[2]).filter(t=>['renter','room','lodging','bill','invoice'].includes(t)))];
  const next={};
  for(const type of types){const x=await fetch('/api/'+type+'s');if(x.ok)next[type]=await x.json();}
  next.renterMap=Object.fromEntries((next.renter||[]).map(x=>[x.id,x.name]));
  setRefs(next);
 }
 useEffect(()=>{fetch('/api/auth/me').then(async r=>{if(!r.ok){router.replace('/login');return;}const body=await r.json();setUser(body.user);});},[router]);
 useEffect(()=>{load();loadRefs();},[resource,query]);
 const refMaps=useMemo(()=>({renter:refs.renterMap||{}}),[refs]);
 function change(k,v){setForm(f=>({...f,[k]:v}));}
 function edit(item){
  const f={...item};
  ['startAt','endAt'].forEach(k=>{if(f[k])f[k]=new Date(f[k]).toISOString().slice(0,16);});
  if(resource==='rooms')f.facilitiesList=String(f.facilities||'').split(',').filter(Boolean);
  setForm(f);setEditing(item.id);setError('');
 }
 function reset(){setForm({});setEditing(null);setError('');}
 async function save(e){
  e.preventDefault();setError('');
  const body={...form};
  if(resource==='rooms')body.facilities=(form.facilitiesList||[]).join(',');
  delete body.facilitiesList;
  if(resource==='users'&&body.role!=='TENANT')body.renterId=null;
  const x=await fetch('/api/'+resource+(editing?'/'+editing:''),{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!x.ok){setError((await x.json()).error||'Gagal menyimpan');return;}
  reset();await load();await loadRefs();
 }
 async function remove(id){
  if(!confirm('Hapus data ini? Data akan menjadi soft-deleted.'))return;
  const x=await fetch('/api/'+resource+'/'+id,{method:'DELETE'});
  if(!x.ok)setError((await x.json()).error||'Gagal menghapus');else{await load();await loadRefs();}
 }
 async function verifyPayment(id,action){
  const note=action==='REJECTED'?window.prompt('Alasan penolakan (opsional):')||'Bukti pembayaran ditolak.':'';
  const x=await fetch('/api/payments/'+id+'/verify',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,note})});
  const body=await x.json().catch(()=>({}));
  if(!x.ok){setError(body.error||'Verifikasi gagal');return;}
  await load();
 }
 if(!info||!user)return <main className="center">Memuat...</main>;
 if(resource==='users'&&!user.owner)return <main className="center"><div><h2>Akses ditolak</h2><p>Halaman Users hanya tersedia untuk Administrator.</p><a href="/dashboard">Kembali ke dashboard</a></div></main>;
 if(user.role==='TENANT')return <main className="center"><div><h2>Akses dibatasi</h2><p>Gunakan portal penyewa untuk pembayaran.</p><a href="/dashboard">Kembali ke dashboard</a></div></main>;

 return <main className="app">
  <header className="topbar"><div><a className="brand" href="/dashboard">KOS MANAGER</a><div className="muted">{roleLabel(user.role,user.owner)} · {resource==='users'?'Panel administrator':'Panel manajemen'}</div></div><nav>{user.owner&&<a className={resource==='users'?'activeNav':''} href="/users">Users</a>}{nav.map(([h,t])=><a className={resource===h?'activeNav':''} href={'/'+h} key={h}>{t}</a>)}</nav><a href="/dashboard">Dashboard</a></header>
  <section className="pageHead"><div><small>MANAGEMENT</small><h1>{info.title}</h1><p>{resource==='payments'?'Periksa bukti pembayaran, lalu terima atau tolak transaksi.':'Tambah, ubah, cari, dan kelola data '+info.title.toLowerCase()+'.'}</p></div><input className="search" placeholder="Cari data..." value={query} onChange={e=>setQuery(e.target.value)}/></section>
  {error&&<div className="error">{error}</div>}
  <section className="card"><div className="sectionTitle"><h2>{editing?'Edit data':'Tambah data'}</h2>{editing&&<button type="button" className="ghost" onClick={reset}>Batal</button>}</div>
   <form className="grid" onSubmit={save}>
    {info.fields.map(([k,l,t])=><label key={k}>{l}{t==='role'?<select required value={form[k]||'STAFF'} onChange={e=>change('role',e.target.value)}><option value="STAFF">Karyawan</option><option value="TENANT">Penyewa</option><option value="ADMIN">Administrator</option></select>:['renter','room','lodging','bill','invoice'].includes(t)?
      <select required value={form[k]??''} onChange={e=>change(k,e.target.value)}><option value="">Pilih {l.toLowerCase()}</option>{(refs[t]||[]).map(x=><option key={x.id} value={x.id}>{optionLabel(t,x)}</option>)}</select>
      :<input required={!['password','endAt'].includes(k)} type={t} value={form[k]??''} onChange={e=>change(k,e.target.value)}/>}</label>)}
    {resource==='users'&&form.role==='TENANT'&&<label>Data penyewa<select required value={form.renterId??''} onChange={e=>change('renterId',e.target.value)}><option value="">Pilih penyewa yang terhubung</option>{(refs.renter||[]).map(x=><option key={x.id} value={x.id}>{x.name} · {x.phoneNumber}</option>)}</select><small className="fieldHint">Akun ini hanya dapat melihat tagihan dan pembayaran penyewa tersebut.</small></label>}
    {resource==='renters'&&<label>Jenis kelamin<select required value={form.gender||''} onChange={e=>change('gender',e.target.value)}><option value="">Pilih</option><option>Laki-Laki</option><option>Perempuan</option></select></label>}
    {resource==='rooms'&&<fieldset><legend>Fasilitas</legend><div className="checks">{['AC','Bed','Bathroom','Furniture'].map(v=><label className="check" key={v}><input type="checkbox" checked={(form.facilitiesList||[]).includes(v)} onChange={e=>change('facilitiesList',e.target.checked?[...(form.facilitiesList||[]),v]:(form.facilitiesList||[]).filter(x=>x!==v))}/>{v}</label>)}</div></fieldset>}
    {resource==='bills'&&<label>Per bulan<select value={String(form.perMonth??false)} onChange={e=>change('perMonth',e.target.value==='true')}><option value="true">Ya</option><option value="false">Tidak</option></select></label>}
    <div className="actions"><button type="submit">{editing?'Simpan perubahan':'Simpan'}</button>{editing&&<button type="button" className="ghost" onClick={reset}>Batal</button>}</div>
   </form>
  </section>
  <section className="card"><div className="sectionTitle"><h2>Data tersimpan</h2><span className="muted">{items.length} data</span></div>
   {loading?<p className="muted">Memuat data...</p>:items.length===0?<p className="empty">Belum ada data.</p>:<div className="list">{items.map(x=><article className="row" key={x.id}>
    <div className="rowMain"><b>{itemLabel(resource,x,refMaps)}</b><div className="muted">{resource==='lodgings'&&x.startAt?new Date(x.startAt).toLocaleDateString('id-ID')+' — '+(x.endAt?new Date(x.endAt).toLocaleDateString('id-ID'):'berjalan'):resource==='payments'&&x.paymentDate?'Tanggal bayar: '+new Date(x.paymentDate).toLocaleDateString('id-ID'):''}</div>
    {resource==='payments'&&x.proofData&&<button type="button" className="proofButton" onClick={()=>window.open(x.proofData,'_blank','noopener,noreferrer')}>Lihat bukti pembayaran</button>}
    {resource==='payments'&&x.proofData&&<img className="paymentProofThumb" src={x.proofData} alt="Bukti pembayaran"/>}</div>
    <div className="rowActions">{resource==='payments'&&x.status==='PENDING'&&<><button className="approveButton" onClick={()=>verifyPayment(x.id,'APPROVED')}>✓ Terima</button><button className="rejectButton" onClick={()=>verifyPayment(x.id,'REJECTED')}>✕ Tolak</button></>}{resource!=='payments'&&<button className="ghost" onClick={()=>edit(x)}>Edit</button>}{resource==='payments'&&user.owner&&<button className="ghost" onClick={()=>edit(x)}>Edit</button>}{user.owner&&<button className="danger" onClick={()=>remove(x.id)}>Hapus</button>}</div>
   </article>)}</div>}
  </section>
 </main>;
}