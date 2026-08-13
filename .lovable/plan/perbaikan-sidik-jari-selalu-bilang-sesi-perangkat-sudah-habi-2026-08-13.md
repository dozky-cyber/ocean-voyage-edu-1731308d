# Perbaikan: sidik jari selalu bilang "sesi perangkat sudah habis"

## Penyebab (sudah dipastikan dari kode + log auth)

Tombol "Keluar" di workspace memanggil sign out versi **global**. Sign out global memberitahu server untuk membatalkan seluruh sesi akun itu — termasuk token yang tersimpan terenkripsi di HP untuk buka-cepat sidik jari.

Jadi urutannya selalu begini:

```text
Login password  -> token disimpan di HP (sidik jari aktif)
Klik "Keluar"   -> server membatalkan token itu
Buka /auth      -> sidik jari sukses, tapi token sudah mati
                -> muncul "Sesi di perangkat ini sudah habis masa berlakunya"
```

Log auth memperkuatnya: setelah `logout` (204), permintaan berikutnya ke server dijawab `session_not_found` (403). Jadi ini bukan sidik jarinya yang bermasalah — token yang dibuka memang sudah dimatikan saat logout.

## Yang akan diperbaiki

1. **Logout lokal saat sidik jari aktif.** Kalau perangkat ini punya buka-cepat, tombol "Keluar" hanya mengakhiri sesi di browser ini (tidak membatalkan token di server). Hasilnya: setelah keluar, tap sidik jari langsung masuk lagi tanpa password. Kalau sidik jari tidak aktif, perilaku logout tetap seperti sekarang (global).
2. **Segarkan token sebelum disimpan.** Saat keluar, snapshot yang tersimpan di perangkat diperbarui dulu dengan token terbaru, supaya yang dipakai sidik jari selalu token paling segar.
3. **Opsi "Keluar total"** di halaman Settings: mematikan buka-cepat di perangkat ini sekaligus logout global — untuk kondisi HP hilang / ingin benar-benar mengunci.
4. **Pesan lebih jelas** kalau memang token sudah tidak berlaku (mis. sudah lewat batas masa aktif), bukan setiap kali habis logout.

## Catatan teknis

- `supabase.auth.signOut({ scope: "local" })` dipakai saat `hasBiometricEnrollment()` true; jika tidak, tetap default (global).
- Sebelum signOut, panggil `syncStoredSession` dengan sesi aktif terakhir agar refresh token yang tersimpan adalah yang belum terpakai.
- Perubahan file: `src/routes/_authenticated/admin.tsx` dan `src/routes/_authenticated/admin.settings.tsx` (fungsi `signOut`), plus penambahan kecil di `src/lib/auth/biometric-unlock.ts` bila diperlukan helper `signOutKeepingQuickUnlock`. Tidak ada perubahan database, RLS, atau guard rute.

## Verifikasi

Login password → keluar → halaman masuk → tap sidik jari → langsung ke /admin tanpa notif sesi habis. Lalu uji "Keluar total" di Settings: sidik jari hilang dan wajib password lagi.
