# Login Sidik Jari (Quick Unlock) untuk /admin

Menambahkan buka-cepat dengan sidik jari HP di halaman masuk workspace, khusus akun owner, dengan form password tetap tersedia.

## Cara kerjanya

1. Login pertama di HP tetap seperti sekarang: email + password.
2. Setelah berhasil masuk, muncul tawaran sekali: "Aktifkan buka cepat dengan sidik jari di perangkat ini?" Kalau disetujui, HP mendaftarkan biometrik (sidik jari / face unlock bawaan perangkat) untuk situs ini.
3. Kunjungan berikutnya di HP yang sama, halaman masuk menampilkan tombol besar "Masuk dengan sidik jari" di atas, dan form email + password tetap ada di bawahnya sebagai cadangan.
4. Tap tombol → HP minta sidik jari → sesi yang tersimpan di perangkat dipulihkan → langsung masuk ke /admin.
5. Kalau sesi tersimpan sudah kedaluwarsa atau sidik jari gagal, sistem otomatis kembali ke form password dan menghapus data buka-cepat yang basi.

Di menu Settings admin ditambahkan satu baris "Buka cepat sidik jari" untuk melihat status di perangkat ini dan tombol "Matikan di perangkat ini".

## Batasan yang perlu diketahui

- Ini kunci perangkat, bukan pengganti password di server. Sidik jari membuka sesi yang sudah tersimpan di HP itu; ganti HP atau hapus data browser berarti harus login password lagi (itu sengaja).
- Hanya jalan di browser yang mendukung biometrik perangkat (Chrome/Safari modern di Android & iOS). Kalau tidak didukung, tombol sidik jari tidak muncul sama sekali — tampilan kembali persis seperti sekarang.
- Hanya aktif untuk akun owner; anggota tim lain tetap login biasa.

## Catatan teknis

- WebAuthn platform authenticator (`navigator.credentials.create/get` dengan `userVerification: "required"`, `authenticatorAttachment: "platform"`), dipakai murni sebagai gate lokal — tidak ada verifikasi passkey di server, jadi tidak ada tabel atau migration baru.
- Refresh token sesi disimpan di IndexedDB perangkat, dienkripsi dengan kunci AES-GCM non-extractable di WebCrypto; kunci hanya dipakai setelah assertion WebAuthn berhasil. Pemulihan sesi lewat `supabase.auth.setSession`.
- File yang disentuh: `src/routes/auth.tsx` (tombol + tawaran enroll setelah login), modul baru `src/lib/auth/biometric-unlock.ts` (enroll, unlock, disable, deteksi dukungan), dan `src/routes/_authenticated/admin.settings.tsx` (toggle perangkat ini). Guard rute, role, dan server function tidak diubah.
- Enrollment dibatasi ke email owner; semua operasi dijaga `typeof window` agar aman saat SSR (`/auth` sudah `ssr: false`).

## Verifikasi

Cek di preview: tombol sidik jari tidak muncul di browser tanpa dukungan, alur password tetap berfungsi, dan sesi kedaluwarsa jatuh bersih ke form password.
