# Audit & Perbaikan Invoice Generator (berlaku untuk semua invoice)

Hasil pembandingan dokumen yang Anda kirim (Proposal V5 vs Invoice INV-202608-5659) menemukan
kesalahan berikut, dan semuanya diperbaiki di level logic — bukan tambalan untuk satu invoice.

## Temuan pada invoice saat ini

| Bagian | Kondisi sekarang | Seharusnya |
| --- | --- | --- |
| CLIENT NAME | "Furniture & Interior Custom Workshop" (nama bisnis) | "Tobiin" (nama orang / kontak) |
| BUSINESS NAME | duplikat nama bisnis | nama bisnis lengkap (tanpa duplikasi dengan client name) |
| EMAIL | `ai-sess_gfjm2uw@leads.kerjaku.space` (email sistem) | baris email disembunyikan bila tidak ada email asli |
| Nama file | `Invoice_KERJAKU_Furniture_Interior_Custom_Workshop_Fadly_Furniture_Interior.pdf` | `Invoice_KERJAKU_Tobiin.pdf` |
| PROJECT | "Business System" (nama paket) | kebutuhan project dari proposal ("Website Portfolio & Project Tracking System"), paket sebagai keterangan |
| Format angka | `Rp28.000.000` | `Rp 28.000.000` dan konsisten dengan proposal |
| Header | "BUSINESS SYSTEM CONSULTANT" | samakan dengan proposal: "TEAM KERJAKU CONSULTANT" |
| Referensi | tidak ada | mencantumkan nomor/versi proposal sumber |
| Pengembangan opsional | hilang total | ditampilkan sebagai informasi "belum termasuk total" mengikuti proposal |

Nilai investasi utama sudah benar (Rp 28.000.000 = Subtotal Core Solution proposal); yang belum
mirror adalah data client, penamaan, dan bagian opsional.

## Perbaikan yang akan dikerjakan

### 1. Data client bersih (default semua invoice)
- Pakai guard yang sama seperti proposal (`customerEmail` / `customerWhatsapp`) di layer invoice:
  email/WhatsApp sistem (`@leads.kerjaku.space`, prefix `ai-`, `lead-`, placeholder "-") dianggap kosong.
- Baris EMAIL / WHATSAPP disembunyikan bila kosong — tidak ada lagi "-" atau email internal.
- CLIENT NAME diisi nama kontak (lead), BUSINESS NAME diisi nama bisnis. Bila keduanya sama,
  hanya satu baris yang tampil.

### 2. Mirror penuh dari proposal
- Saat invoice dibuat dari proposal: nama kontak, nama bisnis, kontak, mata uang, judul project,
  paket, dan seluruh item harga Core Solution disalin persis dari proposal versi terakhir.
- Item Pengembangan Opsional dari proposal ikut dibawa sebagai daftar informatif
  ("Estimasi pengembangan opsional — belum termasuk total"), tidak menambah total tagihan
  sampai admin menandainya disetujui customer.
- Nomor + versi proposal sumber dicetak pada invoice sebagai referensi.

### 3. Penamaan & link
- Nama file dan slug memakai nama kontak yang sudah dirapikan (maksimal wajar, tanpa kurung/
  duplikasi): `Invoice_KERJAKU_Tobiin.pdf`, link `kerjaku.space/i/invoice-tobiin`.
- Footer PDF memakai nama file yang sama (dipendekkan bila terlalu panjang).

### 4. Kerapian visual & profesionalisme PDF
- Samakan sub-brand header dengan proposal, format uang `Rp 28.000.000` konsisten di semua bagian.
- Kartu BILL TO otomatis menyesuaikan tinggi mengikuti jumlah baris yang benar-benar terisi.
- Tambahkan blok "Metode Pembayaran & Catatan" (transfer/payment link + catatan invoice) serta
  kalimat penutup profesional, agar invoice tidak berhenti di tabel angka.
- Status pembayaran memakai istilah konsisten (Belum Bayar / DP Terbayar / Lunas).

### 5. Pesan WhatsApp invoice
- Menampilkan nama kontak yang benar, nomor invoice, total, jadwal pembayaran, dan link pendek —
  tanpa nama file panjang.

## Catatan teknis

- `src/lib/invoice-doc.ts`: pindahkan guard kontak (reuse dari `proposal-doc.ts`), perbaiki
  `invoiceFileName` / `invoiceSlugBase` agar berbasis nama kontak, format uang `Rp 0.000.000`.
- `src/lib/invoice-pdf.ts`: BILL TO dinamis (sembunyikan field kosong), header sub-brand,
  referensi proposal, blok pembayaran/catatan, footer nama file pendek, bagian opsional informatif.
- `src/lib/billing.server.ts` (`createInvoiceFromProposal`): `client_name` = nama kontak lead,
  `client_company` = nama bisnis, `client_email` lewat guard, `project_name` dari kebutuhan project
  proposal, simpan `optional_items` dari proposal sebagai referensi (tidak dihitung ke total).
- `src/lib/invoice.functions.ts`: memakai data yang sudah dibersihkan untuk PDF, file name, dan pesan WA.
- `src/routes/_authenticated/admin.invoices.$id.tsx`: preview panel mengikuti aturan yang sama.
- Jalankan regresi test yang ada setelah perubahan.
