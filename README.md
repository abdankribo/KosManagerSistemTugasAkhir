# Kos Manager — Next.js

Aplikasi manajemen kos yang telah dimigrasikan dari Laravel/Inertia ke Next.js dan Prisma.

## Stack
- Next.js
- React
- Prisma ORM
- MySQL

## Menjalankan

1. `npm install`
2. Salin `.env.example` menjadi `.env.local` dan isi `DATABASE_URL`.
3. `npx prisma generate`
4. `npm run dev`
5. Buka `http://localhost:3000`

Untuk database yang sudah berisi data lama, gunakan `DATABASE_URL` ke database MySQL yang sama. Jangan menjalankan migrasi yang menghapus data.

## Modul
Dashboard, Users, Kamar, Penyewa, Penginapan, Tagihan, Invoice, dan Pembayaran.

## API
`/api/health`, `/api/dashboard`, serta CRUD `/api/users`, `/api/rooms`, `/api/renters`, `/api/lodgings`, `/api/bills`, `/api/invoices`, dan `/api/payments`.
