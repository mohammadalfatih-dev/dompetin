# Dompetin patch notes

## Perbaikan pada versi ini

1. `src/lib/supabase.ts`
   - `ensureUserProfile()` sekarang membaca nama profil yang sudah tersimpan terlebih dahulu.
   - Jika belum ada, fungsi memakai nama dari metadata auth, lalu bagian sebelum `@` pada email.
   - Jika semua sumber nama kosong, memakai `Pengguna Dompetin`.
   - Setiap upsert selalu mengirim `full_name` yang tidak kosong agar sesuai dengan constraint NOT NULL.

2. `src/hooks/useFinanceData.ts`
   - Tampilan nama profil memiliki fallback agar tidak kosong jika data profil lama belum tersedia.

3. Navigasi dan Settings
   - ZIP sumber ini sudah memiliki tombol Pengaturan langsung pada slot paling kanan navbar mobile.
   - Kartu Akun Dompetin (nama, email, metode login, Logout) sudah ada di Settings desktop. Keduanya dipertahankan.

## Catatan pengujian

- Pemeriksaan isi kode dilakukan.
- Build belum dapat dijalankan di lingkungan ini karena dependensi npm tidak berhasil dipasang.
- Setelah ZIP diekstrak, jalankan `npm ci` lalu `npm run build` sebelum deployment.
- Tidak ada SQL/database migration dalam patch ini. Data Supabase tidak diubah.
