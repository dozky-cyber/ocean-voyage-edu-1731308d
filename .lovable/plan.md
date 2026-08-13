# Penilaian Order Brief Tobiin V2 + Rencana Consultant Engine V8 (Closing-Oriented)

## Nilai saya: 7.5 / 10

Naik jauh dari 6.5. Yang sudah benar: tidak ada duplikat, Potential Feature kembali jadi section sendiri dengan 5 ide yang masuk akal, alasan paket sudah ringkas, boilerplate Enterprise hilang.

Yang membuat belum 9: dokumen ini masih **laporan konsultasi**, belum **alat closing**. Sebagai konsultan yang memakai dokumen ini untuk masuk ke proposal dan invoice, lima hal di bawah yang akan saya protes.

## Temuan (dibaca langsung dari PDF Tobiin V2)

1. **Data inkonsisten di halaman 1-2.** Email tertulis `-`, dan di PROJECT DETAIL kolom "Kebutuhan admin/team" tertulis `-`, padahal Project Summary menyebut "Ya, dashboard pengelolaan mandiri oleh owner". Satu dokumen dua jawaban berbeda. Tanpa email, jalur kirim proposal juga tinggal WhatsApp.

2. **Kalimat ALASAN pecah secara tata bahasa.** Isinya: "Kebutuhan Furniture & Interior Custom Workshop difokuskan untuk Kak Tobiin pemilik Fadly Furniture Interior membutuhkan website portfolio profesional terpusat..." — kalimat tujuan disalin mentah ke dalam kalimat lain.

3. **Tidak ada uji kecocokan budget vs scope.** Budget Rp 5.000.000, timeline 1 bulan, paket Business System, plus 5 ide tambahan. Inilah sumber lead gagal closing: customer membaca brief, membayangkan semua fitur masuk, lalu kaget saat proposal keluar. Brief harus menyatakan lebih dulu mana yang muat di budget dan mana yang fase berikutnya.

4. **Potential Feature tidak berprioritas dan alasannya berulang.** Tiga dari lima berbunyi persis sama: "Kelanjutan alur bisnis setelah Order Management". Kolom ALASAN RELEVANSI dan KAITAN DENGAN ALUR BISNIS isinya kembar. Tidak ada penanda mana yang layak dikerjakan lebih dulu.

5. **Halaman "PENYEMPURNAAN SCOPE" kosong isinya.** Hanya tiga paragraf penjelasan tanpa satu pun item — satu halaman penuh tanpa nilai baca.

6. **Hilang elemen yang membuat brief menutup deal:** pemetaan Business Problem → solusi (bukti bahwa kami mendengar), batas scope (yang TIDAK termasuk), asumsi/risiko, masa berlaku brief, dan langkah lanjut yang konkret dengan nama serta kontak konsultan.

## Rencana perbaikan — Consultant Engine V8

### A. Integritas data
- Field kosong tidak lagi dicetak `-`. Email kosong → "Belum diberikan (pengiriman via WhatsApp)".
- "Kebutuhan admin/team" diambil dari satu sumber yang sama dengan Project Summary, sehingga tidak mungkin berbeda.
- Bila email kosong, chatbot menandai lead sebagai "kontak belum lengkap" agar follow-up admin jelas.

### B. Perbaiki kalimat ALASAN
Tiga kalimat tetap, tapi kalimat pertama memakai ringkasan tujuan yang sudah dinormalisasi (dipotong ke inti, huruf besar/kecil dirapikan, tanpa menyalin nama orang), bukan tempelan kalimat brief.

### C. Blok baru: PROBLEM → SOLUTION MAPPING
Tabel ringkas di halaman rekomendasi:

```text
Masalah customer                        Diselesaikan oleh
Portfolio tersebar di WA dan IG         Galeri / Portfolio (scope customer)
Pertanyaan awal berulang                Halaman FAQ (scope customer)
Pencatatan project manual               Pencatatan Project (scope customer)
Customer bertanya progress              Status Tracking (scope customer)
                                        + Notification (opsional, fase 2)
```

Ini menggantikan halaman "PENYEMPURNAAN SCOPE" yang kosong, sekaligus menjadi bukti bahwa setiap masalah sudah punya jawaban.

### D. Potential Feature diberi prioritas dan fase
- Setiap ide mendapat label **Prioritas 1 / 2 / 3** dari skor relasi yang sudah ada (enhancement ke fitur inti lebih tinggi daripada complementary jauh).
- Ditambah label fase: **Fase 1 (bisa masuk sekarang)** atau **Fase 2 (setelah sistem berjalan)**, ditentukan oleh sisa ruang budget.
- Kolom dirapikan jadi tiga saja: **Kenapa relevan**, **Dampak**, **Kaitan** — dan Kenapa relevan tidak boleh sama persis dengan Kaitan; kalimat relevansi diambil dari masalah/aktivitas customer, bukan mengulang nama relasi.
- Maksimal tetap 5.

### E. Blok baru: CATATAN BUDGET & SCOPE
Tiga baris netral, tanpa menyebut harga:
- Fitur inti sesuai Feature List menjadi prioritas utama pengerjaan.
- Ide tambahan bersifat opsional dan dapat dijadwalkan ke fase berikutnya bila melebihi budget yang disiapkan.
- Timeline yang disebut customer dicek terhadap jumlah fitur; bila padat, ditulis sebagai catatan penyesuaian, bukan janji.

### F. Penutup yang mengarah ke closing
- Batas scope singkat: yang tidak termasuk (misalnya pembelian domain/hosting, konten foto, integrasi pembayaran) selama tidak diminta.
- Masa berlaku brief 14 hari.
- Langkah lanjut jadi tiga langkah bernomor dengan penanggung jawab: konfirmasi scope → penawaran harga → penjadwalan pengerjaan.
- Footer menampilkan nama konsultan dan kontak KERJAKU.

### G. Konsistensi ke proposal
Urutan dan penamaan fitur pada Feature List serta Potential Feature dikunci agar terbawa 1:1 ke generator proposal (Core vs Optional), sehingga customer melihat dokumen yang sama berkembang, bukan dokumen baru.

## Verifikasi
- Sample Tobiin diaudit ulang: tidak ada `-` ganda, ALASAN satu paragraf tiga kalimat yang wajar, mapping masalah lengkap 5 baris, Potential berlabel prioritas + fase, tidak ada kalimat relevansi kembar.
- Seluruh regression suite (saat ini 190 assertion) tetap hijau, plus assertion baru untuk mapping, prioritas, dan catatan budget.
- QA render PDF per halaman: tidak ada section terpotong dan tidak ada halaman berisi paragraf saja.

## Catatan teknis
File yang disentuh: `src/lib/order-brief-insight.ts` (normalisasi alasan, mapping masalah, prioritas/fase, catatan budget, penutup), `src/lib/order-brief-pdf.ts` (blok mapping, tabel potential 3 kolom, footer kontak, hapus halaman kosong), `src/lib/admin/consultant-library.ts` (kalimat relevansi berbasis masalah), `src/lib/admin/problem-solution-map.ts`, `src/lib/admin/consultant-scenarios.test.ts`. Tidak ada perubahan database, harga, atau struktur input Order Brief.
