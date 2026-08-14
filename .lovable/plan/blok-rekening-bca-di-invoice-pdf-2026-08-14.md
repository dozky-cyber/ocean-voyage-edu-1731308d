# Blok Rekening BCA di Invoice PDF

Menambahkan identitas bank pada bagian "Metode Pembayaran & Catatan" di semua invoice yang digenerate (bukan hanya invoice ini).

## Tampilan yang dibuat

Di bawah teks "Transfer Manual" muncul kartu pembayaran rapi:

```text
METODE PEMBAYARAN
Transfer Manual

┌───────────────────────────────────────────────┐
│  [ BCA ]   Bank Central Asia                  │
│            NO. REKENING   6280 664349         │
│            ATAS NAMA      AJI TAUFIK AKBAR    │
└───────────────────────────────────────────────┘
```

- Logo BCA digambar sebagai badge biru (warna korporat BCA) dengan tulisan "BCA" putih tebal, ukuran proporsional dengan teks invoice (tinggi ~26pt) — engine PDF di project ini murni vektor/teks dan tidak mendukung penyisipan file gambar, jadi lambang dibuat sebagai mark tipografi yang bersih dan konsisten dengan gaya dokumen KERJAKU.
- Nomor rekening ditulis besar dan tebal agar mudah dibaca/disalin; nama pemilik rekening di bawahnya.
- Kartu memakai gaya kartu yang sama dengan bagian lain (background lembut, garis aksen), sehingga terlihat seperti invoice profesional pada umumnya.

## Aturan tampil

- Kartu rekening tampil ketika metode pembayaran adalah transfer manual (atau tidak ada payment link).
- Jika invoice memakai payment link/gateway, kartu tetap ditampilkan sebagai alternatif transfer, di bawah link.
- Kartu tidak terpotong antar halaman (dipaksa tetap satu blok utuh).

## Catatan teknis

- `src/lib/invoice-pdf.ts`: tambah fungsi `bankAccountCard(doc)` dipanggil dari `paymentInfo`, memakai `doc.ensure` agar blok utuh, `doc.rect` untuk badge + kartu, dan `textWidth` untuk perataan.
- Data rekening disimpan sebagai konstanta bank KERJAKU di `src/lib/invoice-doc.ts` (`KERJAKU_BANK = { bank: "BCA", name: "Bank Central Asia", account: "6280 664349", holder: "AJI TAUFIK AKBAR" }`) agar bisa dipakai ulang oleh dokumen lain dan mudah diubah.
- Panel preview invoice di `src/routes/_authenticated/admin.invoices.$id.tsx` menampilkan info rekening yang sama agar admin melihat persis seperti PDF.
- Verifikasi dengan render PDF contoh dan inspeksi visual halaman 2.
