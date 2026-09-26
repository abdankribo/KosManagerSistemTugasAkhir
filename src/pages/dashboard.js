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
  <aside className="userSidebar">
   <div className="userLogo"><span className="userLogoMark">K</span><div><strong>Kos<span>Manager</span></strong><small>Workspace Operasional</small></div></div>
   <div className="userNavLabel">MENU UTAMA</div>
   <nav className="userSideNav">
    <a className="userSideActive" href="/dashboard"><span>⌂</span>Dashboard</a>
    <a href="/rooms"><span>▣</span>Kamar</a>
    <a href="/renters"><span>♙</span>Penyewa</a>
    <a href="/lodgings"><span>⌂</span>Penginapan</a>
    <a href="/bills"><span>▤</span>Tagihan</a>
    <a href="/invoices"><span>▥</span>Invoice</a>
    <a href="/payments"><span>▣</span>Pembayaran</a>
   </nav>
   <div className="userSideDivider"></div>
   <div className="userNavLabel">AKUN</div>
   <a className="userSideLink" href="/dashboard"><span>●</span>Profil Saya</a>
   <button className="userSideLogout" onClick={logout}><span>↪</span>Keluar</button>
   <div className="userDbStatus"><i></i><div><strong>Database terhubung</strong><small>Operasional normal</small></div><b>●</b></div>
  </aside>

  <section className="userMain">
   <header className="userHeader">
    <div className="userSearch"><span>⌕</span><input aria-label="Cari" placeholder="Cari kamar, penyewa, atau transaksi..." /></div>
    <div className="userHeaderRight"><button className="userNotif" aria-label="Notifikasi">♢<i></i></button><div className="userAvatar">U</div><div className="userIdentity"><strong>{user.firstName || 'User'}</strong><span><em></em>User</span></div></div>
   </header>

   <div className="userContent">
    <section className="userGreeting">
     <div><span className="userEyebrow">USER WORKSPACE</span><h1>Selamat datang kembali,<br/><strong>{user.firstName || 'User'}!</strong></h1><p>Berikut ringkasan aktivitas operasional kos Anda hari ini.</p></div>
     <div className="userGreetingMeta"><div className="userCalendar">▣</div><div><strong>Workspace aktif</strong><span>Akses operasional</span></div></div>
    </section>

    <section className="userStatsGrid">
     <a href="/rooms" className="userStatCard statBlue"><div className="statIcon">▣</div><div><span>Total Kamar</span><strong>{data.rooms}</strong><small>Kelola ketersediaan kamar <b>→</b></small></div></a>
     <a href="/renters" className="userStatCard statGreen"><div className="statIcon">♙</div><div><span>Total Penyewa</span><strong>{data.renters}</strong><small>Data penyewa kos <b>→</b></small></div></a>
     <a href="/lodgings" className="userStatCard statPurple"><div className="statIcon">⌂</div><div><span>Penginapan Aktif</span><strong>{data.lodgings}</strong><small>Pantau penginapan <b>→</b></small></div></a>
     <a href="/bills" className="userStatCard statOrange"><div className="statIcon">▤</div><div><span>Total Tagihan</span><strong>{data.bills}</strong><small>Kelola tagihan <b>→</b></small></div></a>
    </section>

    <section className="userSectionHead"><div><span className="userEyebrow">AKSI CEPAT</span><h2>Mulai pekerjaan Anda</h2><p>Akses modul yang paling sering digunakan.</p></div></section>
    <section className="userActionGrid">
     {userActions.map(([title,desc,href],i)=><a href={href} className={"userActionCard action-"+i} key={href}><span className="actionCircle">{['▣','♙','⌂','▤','▥','▣'][i]}</span><span><strong>{title}</strong><small>{desc}</small></span><b>→</b></a>)}
    </section>

    <section className="userBottomGrid">
     <div className="userInfoCard"><div className="userInfoHead"><div><span className="userEyebrow">PROFIL AKSES</span><h2>Akun Anda</h2></div><span className="userRolePill">USER</span></div><div className="userProfileRow"><div className="userBigAvatar">U</div><div><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span><small>Akun dengan akses operasional</small></div></div><div className="userAccessList"><div>✓ <span>Dapat mengelola data operasional</span></div><div>✓ <span>Dapat membuat dan mengubah data</span></div><div>× <span>Pengaturan pengguna khusus Admin</span></div><div>× <span>Penghapusan data khusus Admin</span></div></div></div>
     <div className="userQuoteCard"><span className="quoteMark">“</span><h2>Kelola data dengan rapi,<br/>layanan jadi lebih baik.</h2><p>Gunakan workspace ini untuk menjaga operasional kos tetap teratur.</p><div className="quoteDecor">KOS</div></div>
    </section>
   </div>
  </section>
 </main>
}
