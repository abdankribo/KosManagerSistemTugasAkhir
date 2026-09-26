import {useEffect,useState} from 'react';
import {useRouter} from 'next/router';

const cards=[['rooms','Kamar'],['renters','Penyewa'],['lodgings','Penginapan aktif'],['bills','Tagihan'],['invoices','Invoice'],['payments','Pembayaran']];

export default function Dashboard(){
 const router=useRouter(),[data,setData]=useState(null),[user,setUser]=useState(null),[error,setError]=useState('');
 useEffect(()=>{Promise.all([fetch('/api/auth/me'),fetch('/api/dashboard')]).then(async([a,b])=>{if(!a.ok||!b.ok){router.replace('/login');return;}setUser((await a.json()).user);setData(await b.json());}).catch(()=>setError('Gagal memuat dashboard'));},[router]);
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.replace('/login');}
 if(error)return <main className="center">{error}</main>;
 if(!data||!user)return <main className="center">Memuat dashboard...</main>;
 return <main className="app">
  <header className="topbar"><div><a className="brand" href="/dashboard">KOS MANAGER</a><div className="muted">Halo, {user.firstName} {user.lastName} · {user.owner?'Administrator':'User'} · {user.email}</div></div><nav>{user.owner&&<a href="/users">Users</a>}<a href="/rooms">Kamar</a><a href="/renters">Penyewa</a><a href="/lodgings">Penginapan</a><a href="/bills">Tagihan</a><a href="/invoices">Invoice</a><a href="/payments">Pembayaran</a><button className="linkBtn" onClick={logout}>Keluar</button></nav></header>
  <section className="hero"><small>{user.owner?'ADMIN CONTROL CENTER':'USER CONTROL CENTER'}</small><h1>Dashboard Kos Manager</h1><p>{user.owner?'Kelola pengguna dan seluruh operasional kos dari satu aplikasi Next.js.':'Kelola data operasional kos dari satu aplikasi Next.js.'}</p></section>
  <section className="stats">{cards.map(([k,l])=><a className="stat" href={'/'+k} key={k}><b>{data[k]}</b><span>{l}</span></a>)}</section>
  <section className="card"><h2>Status sistem</h2><p className="ok">● Database terhubung melalui Prisma</p><p className="muted">Session login menggunakan cookie HttpOnly bertanda tangan.</p></section>
 </main>;
}
