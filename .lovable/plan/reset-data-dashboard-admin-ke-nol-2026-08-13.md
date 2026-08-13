# Reset Data Dashboard Admin ke Nol

Tujuan: dashboard admin mulai dari nol (tanpa lead, konversasi AI, invoice, task otomatis, log). Tidak ada perubahan logic, prompt, rumus, atau tampilan — hanya penghapusan data.

## Data yang dihapus

| Data | Jumlah sekarang |
|---|---|
| Leads (consultations) | 3 |
| Percakapan AI Consultant | 7 |
| Versi requirement hasil AI | 4 |
| Invoice | 2 |
| Link dokumen pendek (brief/invoice) | 3 |
| Aktivitas AI pada lead | 29 |
| Task otomatis | 3 |
| Log otomasi | 32 |
| Brief harian Telegram | 3 |
| Thread + pesan asisten Telegram/admin | 1 thread, 26 pesan |

Semua tabel klien, project, task project, proposal, dan portfolio sudah kosong, jadi tidak terpengaruh.

## Data yang TETAP dipertahankan

- Akun login dan hak akses (user roles, workspace members)
- Pengaturan aturan otomasi (15 rules) — hanya log-nya yang dibersihkan
- Memori asisten AI (22 catatan) — ini pengetahuan bisnis, bukan data lead
- Semua kode: prompt AI, rumus lead scoring, template PDF/WhatsApp, layout dashboard

## Catatan teknis

Dijalankan sebagai satu operasi hapus data (bukan migrasi skema), urut mengikuti relasi antar tabel agar tidak ada error foreign key. File PDF lama di storage `order-briefs` menjadi yatim; link pendeknya sudah dihapus sehingga tidak bisa diakses lagi dari dashboard.
