# Kos Manager — Next.js

Aplikasi manajemen kos yang dimigrasikan dari Laravel/Inertia ke Next.js + React + Prisma + MySQL.

## Fitur
- Login dengan JWT session pada cookie HttpOnly.
- Dashboard statistik.
- CRUD Users, Kamar, Penyewa, Penginapan, Tagihan, Invoice, dan Pembayaran.
- Form edit dan soft delete.
- Validasi NIK, telepon, fasilitas, nominal, dan bentrok periode kamar.
- Dropdown relasi untuk penginapan, tagihan, invoice, dan pembayaran.
- Pencarian pada modul yang mendukung pencarian.
- Responsive UI desktop dan mobile.

## Menjalankan
1. `npm install`
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `DATABASE_URL` dengan database MySQL.
4. Isi `AUTH_SECRET` dengan secret acak panjang, minimal 32 karakter.
5. `npx prisma generate`
6. `npm run dev`
7. Buka `http://localhost:3000`.

## Database lama
Arahkan `DATABASE_URL` ke database MySQL lama setelah melakukan backup. Jangan menjalankan `prisma db push` pada database produksi. Bila perlu menyelaraskan schema Prisma dengan database yang sudah ada, gunakan `npx prisma db pull` setelah struktur database diverifikasi.

## Deployment Vercel
- Framework: Next.js
- Build Command: `npm run build`
- Environment Variables: `DATABASE_URL`, `AUTH_SECRET`
- Node.js: gunakan versi yang didukung project/Vercel.

## Catatan
Build dan koneksi MySQL perlu diverifikasi pada environment yang memiliki akses dependency install dan database sebenarnya; repository ini tidak menyimpan credential database.
