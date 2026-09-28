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

## Informasi Login

Berikut akun demo yang dapat digunakan untuk pengujian aplikasi:

| Role | Username | Password |
|---|---|---|
| Pemilik Kos | `admin55` | `admin55` |
| Karyawan Kos | `user55` | `user55` |
| Penyewa Kos | `rombengz` | `123456789qwe` |

### Catatan login
- Akun Pemilik Kos digunakan untuk pengelolaan penuh data kos.
- Akun Karyawan Kos digunakan untuk operasional kos sesuai hak aksesnya.
- Akun Penyewa Kos digunakan untuk portal penyewa dan mengakses data yang terkait dengan penyewa tersebut.
- Akun di atas merupakan akun demo untuk pengujian. Jangan gunakan credential tersebut untuk akun production yang sebenarnya.

## Catatan
Build dan koneksi MySQL perlu diverifikasi pada environment yang memiliki akses dependency install dan database sebenarnya; repository ini tidak menyimpan credential database.


## Role aplikasi

KosManager sekarang memiliki tiga jenis akun:

- **Admin / Pemilik Kos** — mengelola kamar, harga, pengguna, penyewa, tagihan, invoice, dan seluruh transaksi.
- **User / Karyawan** — mengelola operasional kos dan memverifikasi bukti pembayaran penyewa.
- **Penyewa / Tenant** — menggunakan portal sederhana untuk melihat kamar/tagihan miliknya, memilih tagihan, menentukan tanggal pembayaran, dan mengunggah foto bukti pembayaran.

### Alur pembayaran

1. Admin atau karyawan menyiapkan kamar, penyewa, penginapan, tagihan, dan invoice.
2. Penyewa masuk ke Portal Penyewa.
3. Penyewa memilih tagihan/kamar yang tersedia.
4. Nominal pembayaran diambil otomatis dari tagihan dan tidak dapat diubah oleh penyewa.
5. Penyewa memilih tanggal pembayaran dan mengunggah foto bukti pembayaran.
6. Pembayaran masuk dengan status **Menunggu Verifikasi**.
7. Admin atau karyawan memeriksa bukti pembayaran.
8. Pembayaran dapat diterima atau ditolak. Penyewa dapat melihat statusnya dari portal.

Akun tenant harus dihubungkan ke data penyewa agar tenant hanya dapat melihat tagihan dan pembayaran miliknya sendiri.
