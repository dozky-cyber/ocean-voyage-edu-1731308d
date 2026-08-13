# Filter Enterprise vs Business System pada AI Order Brief

Ya, konsep Anda benar dan saat ini logic-nya belum cukup ketat. Gate Enterprise sekarang lolos hanya dengan satu sinyal saja — misalnya kata "integrasi", "api", atau "otomatis" di brief, atau angka user yang kebetulan cocok. Untuk laundry 1 outlet dengan owner + 4 karyawan, itu membuat opsi pengembangan naik ke Enterprise System, padahal seharusnya berhenti di Business System.

## Definisi yang akan dipakai

Enterprise hanya boleh muncul bila bisnis benar-benar kompleks secara organisasi, bukan karena butuh fitur banyak.

```text
BUSINESS SYSTEM                     ENTERPRISE SYSTEM
1 lokasi / 1 outlet                 banyak cabang / multi lokasi
owner + beberapa karyawan           struktur berjenjang (manager, supervisor, admin cabang, staff)
role sederhana (owner/staff)        banyak role dengan hak akses & approval berbeda
< ~25 user                          user besar (>= ~50) atau banyak divisi
operasional harian satu alur        laporan antar cabang/divisi, kontrol pusat
tanpa integrasi sistem luar         integrasi ERP/API/sistem lain yang nyata
```

## Perubahan logic

1. **Enterprise butuh minimal 2 sinyal kuat**, bukan 1. Sinyal kuat: (a) multi cabang/lokasi, (b) struktur organisasi berjenjang / approval / antar divisi, (c) user besar (>= 50 atau "ratusan/ribuan"), (d) integrasi sistem eksternal nyata (ERP, API ke sistem lain, sinkronisasi data antar sistem).
2. **Blok eksplisit skala kecil**: bila brief menyebut 1 outlet/1 cabang/1 lokasi, atau jumlah user kecil (angka <= 25, "owner + karyawan", "5 orang"), Enterprise dikunci — walaupun ada kata "integrasi" atau "otomatis".
3. **Kata "api"/"integrasi" tidak lagi menjadi sinyal tunggal.** Kata "api" saja terlalu longgar (bisa muncul dari kata lain); akan dipakai pola yang lebih spesifik seperti "integrasi api", "api eksternal", "erp", "sinkron dengan sistem".
4. **Ceiling package**: bila Enterprise tidak lolos, ceiling maksimal turun ke Business System (Digital Workflow), baik untuk package pada Order Brief maupun untuk opsi pengembangan Team KERJAKU Consultant.
5. **Alasan rekomendasi menyebut skala.** Reason pada PDF menjelaskan dasar keputusan (jumlah user, jumlah lokasi), sehingga terlihat kenapa Business System yang dipilih, bukan Enterprise.
6. **Chatbot prompt disamakan** dengan aturan ini agar AI konsultasi tidak menjanjikan Enterprise untuk bisnis satu outlet.

## Detail teknis

- `src/lib/order-brief-insight.ts`: ganti `enterpriseScaleJustified` menjadi penilaian multi-sinyal (butuh >= 2 sinyal, dengan hard-block skala kecil), perketat `complexityCeiling` untuk kata "api"/"integrasi", dan pastikan `buildConsultantOption` tidak pernah naik ke Enterprise saat gate gagal.
- `src/lib/admin/consultant-library.ts`: tambahkan penjagaan agar fitur bertier `enterprise` tidak terpilih saat gate Enterprise gagal (bukan hanya saat skala personal).
- `src/routes/api/public/consultant-chat.ts`: tambahkan aturan pembeda Business vs Enterprise ke system prompt.

## Verifikasi

Uji dengan brief laundry 1 outlet, owner + 4 karyawan: package tetap Business System dan opsi pengembangan tidak menawarkan Enterprise. Uji juga brief laundry 3 cabang + 60 user: Enterprise boleh muncul.
