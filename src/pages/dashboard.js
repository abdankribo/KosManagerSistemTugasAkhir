import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/router';

const adminCards=[['users','Pengguna','/users'],['rooms','Kamar','/rooms'],['renters','Penyewa','/renters'],['lodgings','Penginapan aktif','/lodgings'],['bills','Tagihan','/bills'],['payments','Pembayaran','/payments']];
const userActions=[['Kamar','Atur kamar dan harga sewa','/rooms'],['Penyewa','Kelola data penghuni kos','/renters'],['Penginapan','Hubungkan penyewa ke kamar','/lodgings'],['Tagihan','Buat dan kelola tagihan','/bills'],['Pembayaran','Periksa dan verifikasi pembayaran','/payments']];

function TenantDashboard({user,logout}){
 const [portal,setPortal]=useState(null),[selectedInvoice,setSelectedInvoice]=useState(''),[paymentDate,setPaymentDate]=useState(new Date().toISOString().slice(0,10)),[proof,setProof]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState(''),[saving,setSaving]=useState(false);

 async function load(){
  const r=await fetch('/api/tenant');
  if(!r.ok){setError((await r.json().catch(()=>({}))).error||'Portal penyewa belum siap.');return;}
  setPortal(await r.json());
 }
 useEffect(()=>{load();},[]);
 const invoices=portal?.invoices||[];
 const selected=invoices.find(x=>String(x.id)===String(selectedInvoice));
 const rooms=useMemo(()=>portal?.rooms||[],[portal]);
 const availableInvoices=invoices.filter(x=>!x.paymentHistory?.some(p=>p.status==='APPROVED'||p.status==='PENDING'));

 async function compressImage(file){
  return new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onerror=()=>reject(new Error('Foto tidak dapat dibaca.'));
   reader.onload=()=>{
    const img=new Image();
    img.onerror=()=>reject(new Error('File bukan foto yang valid.'));
    img.onload=()=>{
     const max=1200;
     const ratio=Math.min(1,max/Math.max(img.width,img.height));
     const canvas=document.createElement('canvas');
     canvas.width=Math.max(1,Math.round(img.width*ratio));
     canvas.height=Math.max(1,Math.round(img.height*ratio));
     const ctx=canvas.getContext('2d');
     ctx.drawImage(img,0,0,canvas.width,canvas.height);
     resolve(canvas.toDataURL('image/jpeg',0.76));
    };
    img.src=reader.result;
   };
   reader.readAsDataURL(file);
  });
 }
 async function chooseProof(e){
  const file=e.target.files?.[0];
  if(!file)return;
  setError('');setSuccess('');
  if(!file.type.startsWith('image/')){setError('Bukti pembayaran harus berupa foto.');return;}
  try{setProof(await compressImage(file));}catch(err){setError(err.message);}
 }
 async function submitPayment(e){
  e.preventDefault();setError('');setSuccess('');
  if(!selected){setError('Pilih tagihan terlebih dahulu.');return;}
  if(!proof){setError('Upload foto bukti pembayaran terlebih dahulu.');return;}
  setSaving(true);
  const r=await fetch('/api/tenant/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId:selected.id,paymentDate,proofData:proof,proofName:'bukti-pembayaran.jpg'})});
  const body=await r.json().catch(()=>({}));
  setSaving(false);
  if(!r.ok){setError(body.error||'Pembayaran gagal dikirim.');return;}
  setSuccess('Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi pengelola.');
  setSelectedInvoice('');setProof(null);await load();
 }
 return <main className="tenantPortal">
  <header className="tenantTopbar">
   <div className="tenantBrand"><span>K</span><div><strong>KosManager</strong><small>Portal Penyewa</small></div></div>
   <div className="tenantTopRight"><div><strong>{portal?.tenant?.name||user.firstName||'Penyewa'}</strong><small>{portal?.tenant?.email||user.email}</small></div><button onClick={logout}>Keluar</button></div>
  </header>
  <section className="tenantContent">
   <div className="tenantWelcome"><div><span className="tenantEyebrow">PORTAL PENYEWA</span><h1>Halo, {portal?.tenant?.name||user.firstName||'Penyewa'} 👋</h1><p>Bayar tagihan kos dan kirim bukti pembayaran dari satu tempat.</p></div><div className="tenantLock">🔒 Data pribadi Anda</div></div>
   {error&&<div className="tenantAlert error">{error}</div>}
   {success&&<div className="tenantAlert success">{success}</div>}
   <div className="tenantGrid">
    <section className="tenantCard">
     <div className="tenantCardHead"><div><span className="tenantEyebrow">KAMAR SAYA</span><h2>Informasi Kamar</h2></div></div>
     {rooms.length===0?<div className="tenantEmpty">Belum ada kamar aktif yang terhubung ke akun Anda. Hubungi pengelola kos.</div>:
      <div className="tenantRoomList">{rooms.map(x=><div className="tenantRoom" key={x.lodgingId}><div className="tenantRoomIcon">⌂</div><div><strong>Kamar {x.room.number}</strong><span>Rp {Number(x.room.costPerMonth||0).toLocaleString('id-ID')} / bulan</span><small>{x.startAt?new Date(x.startAt).toLocaleDateString('id-ID'):''} — {x.endAt?new Date(x.endAt).toLocaleDateString('id-ID'):'masih aktif'}</small></div></div>)}</div>}
    </section>
    <section className="tenantCard tenantPayCard">
     <div className="tenantCardHead"><div><span className="tenantEyebrow">PEMBAYARAN</span><h2>Kirim Bukti Pembayaran</h2></div><span className="tenantPayBadge">AMAN</span></div>
     <form onSubmit={submitPayment} className="tenantPayForm">
      <label>Kamar / Tagihan<select value={selectedInvoice} onChange={e=>setSelectedInvoice(e.target.value)} required><option value="">Pilih kamar dan tagihan</option>{availableInvoices.map(x=><option key={x.id} value={x.id}>Kamar {x.room?.number||'-'} · {x.name} · Rp {Number(x.amount).toLocaleString('id-ID')}</option>)}</select></label>
      <div className="tenantAmount"><span>Nominal pembayaran</span><strong>{selected?'Rp '+Number(selected.amount).toLocaleString('id-ID'):'Rp 0'}</strong><small>Nominal mengikuti tagihan kamar dan tidak dapat diubah.</small></div>
      <label>Tanggal pembayaran<input type="date" value={paymentDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setPaymentDate(e.target.value)} required/></label>
      <label>Foto bukti pembayaran<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseProof} required/><small>Foto akan diperkecil otomatis agar ringan. Format JPG/PNG/WEBP.</small></label>
      {proof&&<img className="tenantProofPreview" src={proof} alt="Preview bukti pembayaran"/>}
      <button className="tenantSubmit" disabled={saving}>{saving?'Mengirim...':'Kirim Bukti Pembayaran →'}</button>
     </form>
    </section>
   </div>
   <section className="tenantCard">
    <div className="tenantCardHead"><div><span className="tenantEyebrow">RIWAYAT</span><h2>Riwayat Pembayaran Saya</h2></div></div>
    {invoices.length===0?<div className="tenantEmpty">Belum ada invoice untuk akun Anda.</div>:<div className="tenantHistory">{invoices.map(inv=><div className="tenantHistoryRow" key={inv.id}><div><strong>Kamar {inv.room?.number||'-'} · {inv.name}</strong><small>Rp {Number(inv.amount).toLocaleString('id-ID')}</small></div><div className="tenantHistoryStatus">{inv.paymentHistory?.length?inv.paymentHistory.map(p=><span className={'tenantStatus '+String(p.status).toLowerCase()} key={p.id}>{p.status==='APPROVED'?'Lunas':p.status==='REJECTED'?'Ditolak':'Menunggu verifikasi'}{p.paymentDate?' · '+new Date(p.paymentDate).toLocaleDateString('id-ID'):''}</span>):<span className="tenantStatus unpaid">Belum dibayar</span>}</div></div>)}</div>}
   </section>
  </section>
 </main>;
}

export default function Dashboard(){
 const router=useRouter();
 const [data,setData]=useState(null),[user,setUser]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  Promise.all([fetch('/api/auth/me'),fetch('/api/dashboard')]).then(async([a,b])=>{
   if(!a.ok||!b.ok){router.replace('/login');return;}
   setUser((await a.json()).user);setData(await b.json());
  }).catch(()=>setError('Gagal memuat dashboard'));
 },[router]);
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.replace('/login');}
 if(error)return <main className="center">{error}</main>;
 if(!data||!user)return <main className="center">Memuat dashboard...</main>;

 if(user.role==='TENANT') return <TenantDashboard user={user} logout={logout}/>;

 if(user.owner) return <main className="app adminDashboard">
  <header className="adminTopbar">
   <div><a className="brand" href="/dashboard">KOS MANAGER</a><div className="muted">Administrator · {user.email}</div></div>
   <nav><a href="/users">Pengguna</a><a href="/rooms">Kamar</a><a href="/renters">Penyewa</a><a href="/lodgings">Penginapan</a><a href="/bills">Tagihan</a><a href="/payments">Pembayaran</a><button className="adminLogout" onClick={logout}>Keluar</button></nav>
  </header>
  <section className="adminHero"><div><span className="adminBadge">ADMINISTRATOR</span><h1>Kelola Kos</h1><p>Kelola pengguna, kamar, penyewa, tagihan, dan pembayaran dari satu tempat.</p></div><a className="adminPrimary" href="/users">Kelola pengguna →</a></section>
  <section className="adminStats">{adminCards.map(([k,l,href])=><a className="adminStat" href={href} key={k}><span>{l}</span><b>{data[k]}</b><small>Lihat detail →</small></a>)}</section>
  <section className="adminGrid">
   <div className="adminPanel"><span className="eyebrow">SYSTEM</span><h2>Status sistem</h2><p className="adminStatus">● Database production terhubung</p><p className="muted">Prisma + MySQL Railway · Session HttpOnly aktif.</p></div>
   <div className="adminPanel"><span className="eyebrow">ALUR KERJA</span><h2>Urutan pengelolaan</h2><div className="adminFlow"><span><b>1</b> Kamar</span><i>→</i><span><b>2</b> Penyewa</span><i>→</i><span><b>3</b> Penginapan</span><i>→</i><span><b>4</b> Tagihan</span><i>→</i><span><b>5</b> Pembayaran</span></div><p className="muted">Invoice dibuat sebagai bagian dari proses tagihan dan tidak perlu dikelola manual untuk pekerjaan harian.</p></div>
  </section>
 </main>;

 return <main className="app userDashboard">
  <aside className="userSidebar">
   <div className="userLogo"><span className="userLogoMark">K</span><div><strong>Kos<span>Manager</span></strong><small>Workspace Operasional</small></div></div>
   <div className="userNavLabel">MENU UTAMA</div>
   <nav className="userSideNav">
    <a className="userSideActive" href="/dashboard"><span>⌂</span>Dashboard</a><a href="/rooms"><span>▣</span>Kamar</a><a href="/renters"><span>♙</span>Penyewa</a><a href="/lodgings"><span>⌂</span>Penginapan</a><a href="/bills"><span>▤</span>Tagihan</a><a href="/payments"><span>▣</span>Pembayaran</a>
   </nav>
   <div className="userSideDivider"></div><div className="userNavLabel">AKUN</div>
   <a className="userSideLink" href="/dashboard"><span>●</span>Profil Saya</a><button className="userSideLogout" onClick={logout}><span>↪</span>Keluar</button>
   <div className="userDbStatus"><i></i><div><strong>Sistem siap</strong><small>Database terhubung</small></div><b>●</b></div>
  </aside>
  <section className="userMain">
   <header className="userHeader"><div className="userSearch"><span>⌕</span><input aria-label="Cari" placeholder="Cari kamar, penyewa, atau transaksi..." /></div><div className="userHeaderRight"><button className="userNotif" aria-label="Notifikasi">♢<i></i></button><div className="userAvatar">U</div><div className="userIdentity"><strong>{user.firstName || 'User'}</strong><span><em></em>Karyawan</span></div></div></header>
   <div className="userContent">
    <section className="userGreeting"><div><span className="userEyebrow">WORKSPACE KARYAWAN</span><h1>Selamat datang kembali,<br/><strong>{user.firstName || 'User'}!</strong></h1><p>Berikut ringkasan aktivitas operasional kos Anda hari ini.</p></div><div className="userGreetingMeta"><div className="userCalendar">▣</div><div><strong>Workspace aktif</strong><span>Akses pengelolaan kos</span></div></div></section>
    <section className="userStatsGrid"><a href="/rooms" className="userStatCard statBlue"><div className="statIcon">▣</div><div><span>Total Kamar</span><strong>{data.rooms}</strong><small>Kelola ketersediaan kamar <b>→</b></small></div></a><a href="/renters" className="userStatCard statGreen"><div className="statIcon">♙</div><div><span>Total Penyewa</span><strong>{data.renters}</strong><small>Data penyewa kos <b>→</b></small></div></a><a href="/lodgings" className="userStatCard statPurple"><div className="statIcon">⌂</div><div><span>Penginapan Aktif</span><strong>{data.lodgings}</strong><small>Pantau penginapan <b>→</b></small></div></a><a href="/payments" className="userStatCard statOrange"><div className="statIcon">▤</div><div><span>Menunggu Verifikasi</span><strong>{data.pendingPayments||0}</strong><small>Periksa bukti pembayaran <b>→</b></small></div></a></section>
    <section className="userSectionHead"><div><span className="userEyebrow">ALUR KERJA</span><h2>Kerjakan sesuai urutan</h2><p>Mulai dari kamar, lalu penyewa, penginapan, tagihan, dan pembayaran.</p></div></section>
    <section className="userActionGrid">{userActions.map(([title,desc,href],i)=><a href={href} className="userActionCard" key={href}><span className="actionStep">{i+1}</span><span className="actionCircle">{['▣','♙','⌂','▤','▣'][i]}</span><span><strong>{title}</strong><small>{desc}</small></span><b>→</b></a>)}</section>
    <section className="userBottomGrid"><div className="userInfoCard"><div className="userInfoHead"><div><span className="userEyebrow">PROFIL AKSES</span><h2>Akun Anda</h2></div><span className="userRolePill">KARYAWAN</span></div><div className="userProfileRow"><div className="userBigAvatar">U</div><div><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span><small>Akun pengelola operasional kos</small></div></div><div className="userAccessList"><div>✓ <span>Dapat mengelola data operasional</span></div><div>✓ <span>Dapat memverifikasi pembayaran</span></div><div>× <span>Pengaturan pengguna khusus Admin</span></div><div>× <span>Penghapusan data khusus Admin</span></div></div></div><div className="userQuoteCard"><span className="quoteMark">“</span><h2>Kelola data dengan rapi,<br/>layanan jadi lebih baik.</h2><p>Gunakan workspace ini untuk menjaga operasional kos tetap teratur.</p><div className="quoteDecor">KOS</div></div></section>
   </div>
  </section>
 </main>;
}