import {useRouter} from 'next/router';
import {useEffect,useMemo,useState} from 'react';

const meta={
 users:{title:'Pengguna',description:'Buat dan kelola akun Administrator, Karyawan, dan Penyewa yang dapat masuk ke sistem.',fields:[['firstName','Nama depan','text'],['lastName','Nama belakang','text'],['email','Username','text'],['password','Password','password'],['role','Peran','role']]},
 rooms:{title:'Kamar',description:'Atur nomor kamar, ukuran, harga sewa, dan fasilitas agar data kamar selalu jelas.',fields:[['number','Nomor kamar','text'],['length','Panjang (m)','number'],['width','Lebar (m)','number'],['costPerMonth','Biaya/bulan','number']]},
 renters:{title:'Penyewa',description:'Simpan data orang yang menyewa kos, mulai dari identitas, nomor telepon, hingga alamat.',fields:[['nik','NIK','text'],['name','Nama','text'],['phoneNumber','Telepon','tel'],['address','Alamat','text']]},
 lodgings:{title:'Penginapan',description:'Hubungkan penyewa dengan kamar dan tentukan periode tinggal agar status hunian mudah dipantau.',fields:[['renterId','Penyewa','renter'],['roomId','Kamar','room'],['startAt','Mulai','datetime-local'],['endAt','Selesai','datetime-local']]},
 bills:{title:'Tagihan',description:'Catat biaya yang harus dibayar penyewa, termasuk nama tagihan, keterangan, dan nominalnya.',fields:[['lodgingId','Penginapan','lodging'],['name','Nama tagihan','text'],['description','Deskripsi','text'],['amount','Nominal','number']]},
 invoices:{title:'Invoice',description:'Buat catatan invoice dari tagihan sebagai dokumen transaksi pembayaran penyewa.',fields:[['billId','Tagihan','bill']]},
 payments:{title:'Pembayaran',description:'Periksa pembayaran penyewa, lihat bukti transfer, lalu terima atau tolak transaksi.',fields:[['invoiceId','Invoice','invoice'],['description','Deskripsi','text'],['amount','Nominal','number']]}
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
 const [items,setItems]=useState([]),[refs,setRefs]=useState({}),[form,setForm]=useState({}),[editing,setEditing]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[user,setUser]=useState(null),[createdCredentials,setCreatedCredentials]=useState(null),[availableRooms,setAvailableRooms]=useState([]),[onboardForm,setOnboardForm]=useState({startAt:new Date().toISOString().slice(0,10),gender:'Laki-Laki'}),[onboardResult,setOnboardResult]=useState(null);

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
 useEffect(()=>{load();loadRefs();if(resource==='renters'&&!user?.owner)loadAvailableRooms(onboardForm.startAt);},[resource,query,user?.owner]);
 async function loadAvailableRooms(date){const x=await fetch('/api/rooms/available?date='+encodeURIComponent(date||new Date().toISOString().slice(0,10)));if(x.ok)setAvailableRooms(await x.json());}
 function changeOnboard(k,v){setOnboardForm(f=>({...f,[k]:v}));if(k==='startAt')loadAvailableRooms(v);}
 async function onboard(e){e.preventDefault();setError('');setOnboardResult(null);const x=await fetch('/api/tenant/onboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(onboardForm)});const body=await x.json().catch(()=>({}));if(!x.ok){setError(body.error||'Gagal menerima penyewa');return;}setOnboardResult(body);setOnboardForm({startAt:new Date().toISOString().slice(0,10),gender:'Laki-Laki'});await load();await loadAvailableRooms(new Date().toISOString().slice(0,10));}
 const refMaps=useMemo(()=>({renter:refs.renterMap||{}}),[refs]);
 function change(k,v){setForm(f=>({...f,[k]:v}));}
 function edit(item){
  const f={...item};
  ['startAt','endAt'].forEach(k=>{if(f[k])f[k]=new Date(f[k]).toISOString().slice(0,16);});
  if(resource==='rooms')f.facilitiesList=String(f.facilities||'').split(',').filter(Boolean);
  setForm(f);setEditing(item.id);setError('');
 }
 function reset(){setForm({});setEditing(null);setError('');setCreatedCredentials(null);}
 async function save(e){
  e.preventDefault();setError('');
  const body={...form};
  if(resource==='rooms')body.facilities=(form.facilitiesList||[]).join(',');
  delete body.facilitiesList;
  if(resource==='users'&&body.role!=='TENANT')body.renterId=null;
  const x=await fetch('/api/'+resource+(editing?'/'+editing:''),{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!x.ok){setError((await x.json()).error||'Gagal menyimpan');return;}
  if(resource==='users'&&body.role==='TENANT'&&!editing){setCreatedCredentials({username:body.email,password:form.password,name:[body.firstName,body.lastName].filter(Boolean).join(' ')});setForm({});setEditing(null);setError('');}else{reset();} await load();await loadRefs();
 }
 async function remove(id){
  if(!confirm('Hapus data ini? Data akan menjadi soft-deleted.'))return;
  const x=await fetch('/api/'+resource+'/'+id,{method:'DELETE'});
  if(!x.ok)setError((await x.json()).error||'Gagal menghapus');else{await load();await loadRefs();}
 }
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.replace('/login');}
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

 return <main className={user.owner ? "app" : "userDashboard"}>
  {user.owner ? (<header className="topbar"><div><a className="brand" href="/dashboard">KOS MANAGER</a><div className="muted">{roleLabel(user.role,user.owner)} · {resource==='users'?'Panel administrator':'Panel manajemen'}</div></div><nav>{user.owner&&<a className={resource==='users'?'activeNav':''} href="/users">Users</a>}{nav.map(([h,t])=><a className={resource===h?'activeNav':''} href={'/'+h} key={h}>{t}</a>)}</nav><a href="/dashboard">Dashboard</a></header>) : null}
  {!user.owner && (  <aside className="userSidebar">
    <a className="userLogo" href="/dashboard"><span className="userLogoMark">K</span><div><strong>Kos<span>Manager</span></strong><small>Workspace Operasional</small></div></a>
    <div className="userNavLabel">MENU UTAMA</div>
    <nav className="userSideNav">
      <a href="/dashboard"><span>⌂</span>Dashboard</a>
      <a className={resource==="rooms"?"userSideActive":""} href="/rooms"><span>▣</span>Kamar</a>
      <a className={resource==="renters"?"userSideActive":""} href="/renters"><span>♙</span>Penyewa</a>
      <a className={resource==="bills"?"userSideActive":""} href="/bills"><span>▤</span>Tagihan</a>
      <a className={resource==="payments"?"userSideActive":""} href="/payments"><span>▣</span>Pembayaran</a>
    </nav>
    <div className="userSideDivider"></div>
    <div className="userNavLabel">AKUN</div>
    <a className="userSideLink" href="/dashboard"><span>●</span>Profil Saya</a>
    <button className="userSideLogout" type="button" onClick={logout}><span>↪</span>Keluar</button>
    <div className="userDbStatus"><i></i><div><strong>Sistem siap</strong><small>Database terhubung</small></div><b>•</b></div>
  </aside>)}
  <div className={user.owner ? "" : "userMain"}>
  {!user.owner && (  <header className="userHeader">
    <label className="userSearch"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari data..." /></label>
    <div className="userHeaderRight"><button className="userNotif" type="button" aria-label="Notifikasi">♢<i></i></button><div className="userAvatar">{(user.firstName||user.email||"U").charAt(0).toUpperCase()}</div><div className="userIdentity"><strong>{user.firstName||"User"}</strong><span><em></em>Karyawan</span></div></div>
  </header>)}
  {user.owner ? (<section className="pageHead"><div><small>MANAGEMENT</small><h1>{info.title}</h1><p>{info.description}</p></div><input className="search" placeholder="Cari data..." value={query} onChange={e=>setQuery(e.target.value)}/></section>) : (  <section className="resourceUserHeading">
    <div><span className="userEyebrow">WORKSPACE KARYAWAN · {info.title.toUpperCase()}</span><h1>{info.title}</h1><p>{info.description}</p></div>
    <a className="resourceBackDashboard" href="/dashboard">← Dashboard</a>
  </section>)}
  {error&&<div className="error">{error}</div>}
  {resource==='users'&&createdCredentials&&<section className="card credentialCard"><div className="sectionTitle"><div><small>AKUN BERHASIL DIBUAT</small><h2>Serahkan akses ini kepada penyewa</h2></div><button type="button" className="ghost" onClick={()=>setCreatedCredentials(null)}>Tutup</button></div><p className="credentialNote">Simpan atau berikan kredensial ini kepada penyewa. Password hanya ditampilkan sekali di halaman ini.</p><div className="credentialGrid"><div><span>Username</span><strong>{createdCredentials.username}</strong></div><div><span>Password</span><strong>{createdCredentials.password}</strong></div></div><div className="credentialTip">Akun ini sudah terhubung ke data penyewa {createdCredentials.name||'tersebut'}.</div></section>}
  <section className="featureGuide"><div className="featureGuideIcon">{resource==='rooms'?'▣':resource==='renters'?'♙':resource==='lodgings'?'⌂':resource==='bills'?'▤':resource==='payments'?'✓':resource==='invoices'?'▥':'U'}</div><div><span className="userEyebrow">TENTANG FITUR</span><h2>{info.title}</h2><p>{resource==='renters'&&!user.owner?'Terima penyewa baru dalam satu langkah: pilih kamar yang tersedia, isi data penyewa, dan buat akun login sekaligus.':' '+info.description}</p></div></section>
  {resource==='renters'&&!user.owner ? <section className="card onboardingCard">
    <div className="sectionTitle"><div><small>PROSES PENYEWA BARU</small><h2>Terima penyewa</h2><p className="sectionHint">Pilih kamar yang tersedia, masukkan data penyewa, lalu sistem otomatis membuat penginapan, tagihan sewa, invoice, dan akun penyewa.</p></div></div>
    {onboardResult&&<div className="onboardSuccess"><strong>Penyewa berhasil ditambahkan.</strong><span>Kamar {onboardResult.room.number} · Rp {Number(onboardResult.room.costPerMonth).toLocaleString('id-ID')}/bulan</span><span>Username: <b>{onboardResult.tenant.username}</b></span><span>Berikan username dan password yang kamu buat kepada penyewa.</span></div>}
    <form className="grid" onSubmit={onboard}>
      <label>Tanggal mulai<input required type="date" value={onboardForm.startAt||''} onChange={e=>changeOnboard('startAt',e.target.value)}/></label>
      <label>Kamar tersedia<select required value={onboardForm.roomId||''} onChange={e=>changeOnboard('roomId',e.target.value)}><option value="">Pilih kamar</option>{availableRooms.map(x=><option key={x.id} value={x.id}>Kamar {x.number} · Rp {Number(x.costPerMonth).toLocaleString('id-ID')}/bulan</option>)}</select>{availableRooms.length===0&&<small className="fieldHint">Tidak ada kamar tersedia pada tanggal tersebut.</small>}</label>
      <label>Nama lengkap<input required value={onboardForm.name||''} onChange={e=>changeOnboard('name',e.target.value)} /></label>
      <label>NIK<input required maxLength={16} value={onboardForm.nik||''} onChange={e=>changeOnboard('nik',e.target.value)} /></label>
      <label>Jenis kelamin<select required value={onboardForm.gender||'Laki-Laki'} onChange={e=>changeOnboard('gender',e.target.value)}><option>Laki-Laki</option><option>Perempuan</option></select></label>
      <label>Nomor telepon<input required value={onboardForm.phoneNumber||''} onChange={e=>changeOnboard('phoneNumber',e.target.value)} /></label>
      <label>Alamat<input required value={onboardForm.address||''} onChange={e=>changeOnboard('address',e.target.value)} /></label>
      <label>Username penyewa<input required value={onboardForm.username||''} onChange={e=>changeOnboard('username',e.target.value)} /><small className="fieldHint">Username ini diberikan kepada penyewa untuk login.</small></label>
      <label>Password penyewa<input required minLength={8} type="password" value={onboardForm.password||''} onChange={e=>changeOnboard('password',e.target.value)} /><small className="fieldHint">Minimal 8 karakter. Simpan dan berikan kepada penyewa.</small></label>
      <div className="actions"><button type="submit" disabled={!availableRooms.length}>Simpan penyewa & buat tagihan</button></div>
    </form>
  </section> : null}
  <section className="card"><div className="sectionTitle"><div><small>{resource==='users'?'MANAJEMEN AKUN':'MANAGEMENT'}</small><h2>{editing?'Edit data':resource==='users'?'Buat akun pengguna':'Tambah data'}</h2><p className="sectionHint">{editing?'Perbarui informasi yang diperlukan lalu simpan perubahan.':resource==='rooms'?'Isi data kamar untuk menambah unit kos yang dapat dikelola.':resource==='renters'?'Masukkan data penyewa sesuai identitas yang diberikan.':resource==='lodgings'?'Pilih penyewa dan kamar untuk mencatat masa tinggal.':resource==='bills'?'Pilih penginapan lalu masukkan biaya yang perlu dibayar.':resource==='payments'?'Gunakan halaman ini untuk memeriksa dan memverifikasi pembayaran.':resource==='invoices'?'Hubungkan invoice dengan tagihan yang sudah dibuat.':'Isi data akun sesuai peran pengguna.'}</p></div>{editing&&<button type="button" className="ghost" onClick={reset}>Batal</button>}</div>
   <form className="grid" onSubmit={save}>
    {info.fields.map(([k,l,t])=><label key={k}>{l}{t==='role'?<select required value={form[k]||'STAFF'} onChange={e=>change('role',e.target.value)}><option value="STAFF">Karyawan</option><option value="TENANT">Penyewa</option><option value="ADMIN">Administrator</option></select>:['renter','room','lodging','bill','invoice'].includes(t)?
      <select required value={form[k]??''} onChange={e=>change(k,e.target.value)}><option value="">Pilih {l.toLowerCase()}</option>{(refs[t]||[]).map(x=><option key={x.id} value={x.id}>{optionLabel(t,x)}</option>)}</select>
      :<input required={!['password','endAt'].includes(k)} type={t} value={form[k]??''} onChange={e=>change(k,e.target.value)}/>}</label>)}
    {resource==='users'&&form.role==='TENANT'&&<label>Data penyewa<select required value={form.renterId??''} onChange={e=>change('renterId',e.target.value)}><option value="">Pilih penyewa yang terhubung</option>{(refs.renter||[]).map(x=><option key={x.id} value={x.id}>{x.name} · {x.phoneNumber}</option>)}</select><small className="fieldHint">Pengelola memberikan Username dan Password ini kepada penyewa. Penyewa hanya dapat mengakses portal miliknya.</small></label>}
    {resource==='renters'&&<label>Jenis kelamin<select required value={form.gender||''} onChange={e=>change('gender',e.target.value)}><option value="">Pilih</option><option>Laki-Laki</option><option>Perempuan</option></select></label>}
    {resource==='rooms'&&<fieldset><legend>Fasilitas</legend><div className="checks">{['AC','Bed','Bathroom','Furniture'].map(v=><label className="check" key={v}><input type="checkbox" checked={(form.facilitiesList||[]).includes(v)} onChange={e=>change('facilitiesList',e.target.checked?[...(form.facilitiesList||[]),v]:(form.facilitiesList||[]).filter(x=>x!==v))}/>{v}</label>)}</div></fieldset>}
    {resource==='bills'&&<label>Per bulan<select value={String(form.perMonth??false)} onChange={e=>change('perMonth',e.target.value==='true')}><option value="true">Ya</option><option value="false">Tidak</option></select></label>}
    <div className="actions"><button type="submit">{editing?'Simpan perubahan':'Simpan'}</button>{editing&&<button type="button" className="ghost" onClick={reset}>Batal</button>}</div>
   </form>
  </section>
  <section className="card"><div className="sectionTitle"><div><small>DATA TERSIMPAN</small><h2>Daftar {info.title.toLowerCase()}</h2><p className="sectionHint">{resource==='rooms'?'Gunakan daftar ini untuk melihat kamar dan harga sewanya.':resource==='renters'?'Data ini menjadi dasar saat menempatkan penyewa ke kamar.':resource==='lodgings'?'Data ini menunjukkan siapa yang menempati kamar dan periode tinggalnya.':resource==='bills'?'Tagihan yang tersimpan dapat digunakan untuk proses invoice dan pembayaran.':resource==='payments'?'Pembayaran berstatus Menunggu verifikasi perlu diperiksa bukti transaksinya.':resource==='invoices'?'Invoice menghubungkan tagihan dengan proses pembayaran.':'Gunakan daftar ini untuk memantau akun yang tersedia.'}</p></div><span className="muted">{items.length} data</span></div>
   {loading?<p className="muted">Memuat data...</p>:items.length===0?<p className="empty">Belum ada data.</p>:<div className="list">{items.map(x=><article className="row" key={x.id}>
    <div className="rowMain"><b>{itemLabel(resource,x,refMaps)}</b><div className="muted">{resource==='lodgings'&&x.startAt?new Date(x.startAt).toLocaleDateString('id-ID')+' — '+(x.endAt?new Date(x.endAt).toLocaleDateString('id-ID'):'berjalan'):resource==='payments'&&x.paymentDate?'Tanggal bayar: '+new Date(x.paymentDate).toLocaleDateString('id-ID'):''}</div>
    {resource==='payments'&&x.proofData&&<button type="button" className="proofButton" onClick={()=>window.open(x.proofData,'_blank','noopener,noreferrer')}>Lihat bukti pembayaran</button>}
    {resource==='payments'&&x.proofData&&<img className="paymentProofThumb" src={x.proofData} alt="Bukti pembayaran"/>}</div>
    <div className="rowActions">{resource==='payments'&&x.status==='PENDING'&&<><button className="approveButton" onClick={()=>verifyPayment(x.id,'APPROVED')}>✓ Terima</button><button className="rejectButton" onClick={()=>verifyPayment(x.id,'REJECTED')}>✕ Tolak</button></>}{resource!=='payments'&&<button className="ghost" onClick={()=>edit(x)}>Edit</button>}{resource==='payments'&&user.owner&&<button className="ghost" onClick={()=>edit(x)}>Edit</button>}{user.owner&&<button className="danger" onClick={()=>remove(x.id)}>Hapus</button>}</div>
   </article>)}</div>}
  </section>
  </div>
 </main>;
}