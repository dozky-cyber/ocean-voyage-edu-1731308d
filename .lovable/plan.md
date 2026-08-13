# Consultant Engine V4 — Core Solution vs Potential Feature

## Masalah saat ini

Mesin rekomendasi memilih fitur berdasarkan skor kecocokan (jenis bisnis, sinyal, pola alur bisnis), lalu memotong hasilnya: 4 teratas masuk "Team KERJAKU Consultant Recommendation" dan sisanya masuk "Potential Feature Recommendation". Tidak ada aturan yang membedakan **fitur yang menyelesaikan masalah yang customer sebut** dari **fitur pengembangan setelah masalah utama selesai**. Akibatnya pada kasus Andi (laundry kiloan, order manual, status cucian sulit dicek), isi kedua bagian bisa tertukar dan terasa tidak relate.

## Prinsip baru (berlaku untuk semua bisnis, bukan hanya laundry)

```text
Business Problem (dari Order Brief)
        |
        v
CORE SOLUTION      = fitur yang LANGSUNG menyelesaikan masalah yang disebut customer
        |
        v
POTENTIAL FEATURE  = fitur yang membantu bisnis berkembang SETELAH masalah utama selesai
```

Aturan tegas:
- Fitur hanya boleh masuk Core kalau bisa ditelusuri ke satu masalah/tujuan eksplisit pada brief.
- Fitur yang hanya "bagus untuk nanti" (notifikasi otomatis, database pelanggan, laporan, automation, CRM) tidak pernah masuk Core kecuali customer menyebutnya sebagai masalah.
- Fitur bertim (Multi User) hanya muncul jika brief menyebut kebutuhan hak akses berbeda — bukan sekadar karena ada karyawan.
- Fitur di luar alur bisnis (Inventory pada laundry jasa, CRM pada usaha kecil) tetap diblok seperti sekarang.

## Yang akan dibangun

### 1. Peta Problem to Solution (file baru)
`src/lib/admin/problem-solution-map.ts` — daftar sinyal masalah dan fitur core yang menjawabnya, plus fitur lanjutan yang menjadi pengembangan alaminya. Contoh baris:

- "catat manual / buku / pesanan tertukar" to core: Order Management; growth: Business Report
- "status cucian / progress pekerjaan / customer tanya terus" to core: Status Tracking; growth: Notification System
- "bukti transaksi / nota / pembayaran" to core: Digital Nota
- "customer sulit memesan / pesan online" to core: Online Order / Booking
- "operasional berantakan / owner ingin memantau" to core: Dashboard Operasional (versi harian, bukan enterprise)
- "pelanggan kembali / repeat order" to core: Customer Database (hanya jika retensi disebut sebagai masalah)

Peta ini dilengkapi default per pola bisnis (retail, proses/laundry, jasa, distributor, kuliner) agar bisnis lain tetap mendapat pemisahan yang sama.

### 2. Klasifikasi core vs growth pada pemilihan fitur
`src/lib/admin/consultant-library.ts` — `selectConsultantFeatures` mengembalikan setiap pick dengan penanda `role: "core" | "growth"` dan alasan yang menyebut masalah spesifik yang diselesaikan. Skor core selalu di atas growth. Growth yang merupakan lanjutan dari core yang tidak terpilih ikut gugur.

### 3. Penyusunan section pada brief
`src/lib/order-brief-insight.ts`:
- Team KERJAKU Consultant Recommendation diisi hanya oleh pick `core` (maksimal 4), dengan alasan berbasis masalah customer.
- Potential Feature Recommendation diisi hanya oleh pick `growth` (maksimal 3).
- Jika tidak ada core (semua masalah sudah tercover fitur pada brief), bagian consultant tidak dipaksa muncul.
- Aturan yang sudah ada tetap berlaku: tidak ada duplikasi dengan fitur pada brief, package tidak dinaikkan, bahasa tetap "opsi pengembangan".

### 4. PDF
`src/lib/order-brief-pdf.ts` — setiap item Core menampilkan satu baris "Menyelesaikan: <masalah customer>", sehingga terlihat jelas kaitannya dengan brief. Aturan anti-potong halaman tetap.

### 5. Chatbot
`src/routes/api/public/consultant-chat.ts` — prompt diberi aturan yang sama agar rekomendasi saat chat konsisten dengan PDF: sebutkan Core Solution lebih dulu (menyelesaikan masalah), baru Potential Feature (pengembangan lanjutan).

## Verifikasi
Menjalankan kasus Andi (laundry kiloan, 1 outlet, owner + 4 karyawan, order manual, status cucian) dan membandingkan hasil terhadap ekspektasi:
- Core: Order Management, Status Tracking, Digital Nota, Dashboard Operasional
- Potential: Notification System, Customer Database, Business Report
- Tidak muncul: Inventory, Automation, CRM, Enterprise System, Multi User

Ditambah dua kasus pembanding (florist personal dan distributor multi cabang) untuk memastikan pemisahan bekerja lintas jenis bisnis.
