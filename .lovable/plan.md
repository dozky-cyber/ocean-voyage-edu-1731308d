# Proposal PDF — Problem Mapping Naratif + Rekomendasi Implementasi Bertahap

Dua perubahan logic generator proposal. Berlaku universal untuk semua proposal berikutnya, bukan hanya case ini. Order Brief tetap sumber data; tidak ada fitur baru yang muncul, tidak ada perubahan Consultant Engine, SOP Package, atau logic rekomendasi fitur.

## 1. Problem & Solution Mapping versi naratif

Sekarang barisnya terasa seperti pencocokan keyword:

```text
Portfolio tersebar di WA dan IG -> Portfolio (termasuk scope utama)
```

Jadi format dua baris konsultatif:

```text
Kondisi:
Hasil pekerjaan masih tersebar di beberapa media sehingga calon customer
belum memiliki tempat khusus untuk melihat referensi project yang pernah
dikerjakan.

Solusi:
Galeri / Portfolio Hasil Pekerjaan
```

Aturan penyusunan kalimat Kondisi:
- Kalimat dibangun dari masalah yang customer sampaikan, ditulis ulang jadi satu kalimat kondisi bisnis (situasi + akibatnya pada operasional/customer), bukan pengulangan mentah teks brief.
- Memakai Industry Context Library yang sudah ada supaya istilahnya mengikuti jenis usaha customer (workshop, klinik, laundry, distributor, kuliner, dst).
- Bila masalah tidak punya kalimat khusus, dipakai pola generik yang tetap natural — tidak pernah menampilkan potongan mentah brief sebagai panah.

Aturan baris Solusi:
- Nama fitur ditulis dengan label yang dipahami customer (mis. "Galeri / Portfolio Hasil Pekerjaan"), tetap merujuk fitur yang sama dengan Feature List agar mirror Order Brief tidak rusak.
- Keterangan sumber tetap ada tapi tidak lagi berupa label teknis dalam kurung di tengah kalimat: fitur di luar scope utama diberi keterangan singkat sebagai rekomendasi pengembangan pada baris Solusi.
- Masalah yang belum ada solusinya tetap ditulis apa adanya sebagai poin yang akan dibahas sebelum pengerjaan.

Setiap pasangan Kondisi/Solusi dijaga tidak terbelah antar halaman.

## 2. Rekomendasi Penyesuaian Scope

Kalimat yang menyebut angka budget sebagai alasan pemotongan fitur dihapus. Section diganti jadi:

```text
REKOMENDASI IMPLEMENTASI BERTAHAP

Berdasarkan hasil analisa kebutuhan bisnis, KERJAKU menyarankan implementasi
dilakukan secara bertahap agar sistem dapat dibangun sesuai prioritas utama
dan kebutuhan operasional.

Tahap Awal
Fokus pada fitur yang menjadi kebutuhan utama bisnis:
- Website Portfolio
- FAQ / Informasi Customer
- Pencatatan Project

Tujuan:
Membangun pondasi digital agar customer lebih mudah mengenal bisnis dan owner
dapat mengelola informasi project dengan lebih rapi.

Tahap Pengembangan
Setelah sistem utama berjalan, beberapa pengembangan dapat dilanjutkan:
- Status Tracking Progress Pekerjaan
- Notification Progress
- Invoice / Nota Digital

Tujuan:
Meningkatkan pengalaman customer dan efisiensi pengelolaan project.
```

Aturan:
- Isi Tahap Awal diambil dari scope utama Order Brief (prioritas tertinggi), Tahap Pengembangan dari sisa scope + rekomendasi pengembangan. Tidak ada fitur baru.
- Kalimat "Tujuan" dibuat dari manfaat fitur pada tahap tersebut, mengikuti konteks industri customer — jadi tetap relevan untuk semua jenis usaha.
- Blok bertahap ini muncul untuk setiap proposal yang punya lebih dari satu tahap kebutuhan, bukan hanya saat budget di bawah angka proposal. Angka budget customer masih boleh disebut satu kali sebagai konteks, tanpa dijadikan alasan pemangkasan fitur.
- Optional tetap di luar Total Investment.

## Catatan teknis

- File yang diubah: `src/lib/admin/proposal-from-brief.ts` (penyusun section mapping + section bertahap), plus helper narasi kondisi baru di `src/lib/admin/` yang memakai `industry-context.ts`.
- `src/lib/proposal-pdf.ts` disesuaikan agar heading baru "Rekomendasi Implementasi Bertahap" dirender pada posisi yang sama seperti Budget Alignment sekarang dan mapping Kondisi/Solusi dijaga utuh per pasangan.
- Bullet memakai karakter yang aman untuk font PDF (tanda hubung/bullet yang sudah dipakai sekarang), bukan glyph centang yang berisiko tidak ter-render.
- Verifikasi: render sample proposal (Furniture & Interior Custom Workshop + satu sample laundry) lalu cek visual tiap halaman, dan jalankan regression test consultant scenario yang sudah ada.
