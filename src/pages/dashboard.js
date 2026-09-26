import {useEffect,useState} from 'react';
import {useRouter} from 'next/router';

const adminCards=[['users','Pengguna','/users'],['rooms','Kamar','/rooms'],['renters','Penyewa','/renters'],['lodgings','Penginapan aktif','/lodgings'],['invoices','Invoice','/invoices'],['payments','Pembayaran','/payments']];
const userActions=[['Kamar','Lihat dan kelola data kamar','/rooms'],['Penyewa','Kelola data penyewa','/renters'],['Penginapan','Pantau penginapan aktif','/lodgings'],['Tagihan','Kelola tagihan kos','/bills'],['Invoice','Periksa invoice','/invoices'],['Pembayaran','Catat pembayaran','/payments']];

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

 if(user.owner) return <main className="app adminDashboard">
  <header className="adminTopbar">
   <div><a className="brand" href="/dashboard">KOS MANAGER</a><div className="muted">Administrator · {user.email}</div></div>
   <nav><a href="/users">Users</a><a href="/rooms">Kamar</a><a href="/renters">Penyewa</a><a href="/bills">Tagihan</a><a href="/payments">Pembayaran</a><button className="adminLogout" onClick={logout}>Keluar</button></nav>
  </header>
  <section className="adminHero"><div><span className="adminBadge">ADMINISTRATOR</span><h1>Control Center</h1><p>Pusat kendali untuk pengguna, properti, transaksi, dan aktivitas operasional kos.</p></div><a className="adminPrimary" href="/users">Kelola pengguna →</a></section>
  <section className="adminStats">{adminCards.map(([k,l,href])=><a className="adminStat" href={href} key={k}><span>{l}</span><b>{data[k]}</b><small>Lihat detail →</small></a>)}</section>
  <section className="adminGrid">
   <div className="adminPanel"><span className="eyebrow">SYSTEM</span><h2>Status sistem</h2><p className="adminStatus">● Database production terhubung</p><p className="muted">Prisma + MySQL Railway · Session HttpOnly aktif.</p></div>
   <div className="adminPanel"><span className="eyebrow">ADMIN TOOLS</span><h2>Akses cepat</h2><div className="adminQuick"><a href="/users">Manajemen Users</a><a href="/rooms">Manajemen Kamar</a><a href="/invoices">Invoice</a><a href="/payments">Pembayaran</a></div></div>
  </section>
 </main>;

 return <main className="app userDashboard">
  <header className="userTopbar">
   <div><a className="userBrand" href="/dashboard">KOS MANAGER</a><div className="muted">Workspace Pengguna</div></div>
   <nav><a href="/rooms">Kamar</a><a href="/renters">Penyewa</a><a href="/lodgings">Penginapan</a><a href="/bills">Tagihan</a><a href="/invoices">Invoice</a><a href="/payments">Pembayaran</a><button className="userLogout" onClick={logout}>Keluar</button></nav>
  </header>
  <section className="userWelcome"><div><span className="userBadge">USER WORKSPACE</span><h1>Selamat datang, {user.firstName || 'User'}.</h1><p>Gunakan workspace ini untuk menjalankan aktivitas operasional kos sehari-hari.</p></div><div className="profileMini"><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span><small>Role: User</small></div></section>
  <section className="userSnapshot"><div><span>Kamar</span><b>{data.rooms}</b></div><div><span>Penyewa</span><b>{data.renters}</b></div><div><span>Penginapan aktif</span><b>{data.lodgings}</b></div><div><span>Tagihan</span><b>{data.bills}</b></div></section>
  <section className="userWork"><div className="userWorkHead"><div><span className="eyebrow">WORKSPACE</span><h2>Aktivitas operasional</h2></div><span className="muted">Pilih modul untuk mulai bekerja</span></div><div className="userActions">{userActions.map(([title,desc,href])=><a href={href} className="userAction" key={href}><span className="actionIcon">{title[0]}</span><span><strong>{title}</strong><small>{desc}</small></span><b>→</b></a>)}</div></section>
  <section className="userNote"><strong>Catatan akses</strong><span>Akun User dapat mengelola data operasional, tetapi pengaturan pengguna dan hak administrator hanya tersedia untuk Administrator.</span></section>
 </main>;
}
