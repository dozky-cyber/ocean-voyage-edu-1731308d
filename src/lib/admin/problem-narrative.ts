/**
 * NARASI KONDISI BISNIS (Proposal Problem Mapping).
 *
 * Mengubah masalah mentah pada Order Brief menjadi satu kalimat kondisi
 * bisnis yang natural (situasi + akibatnya), memakai kosakata industri
 * customer bila industrinya dikenali. Dipakai oleh semua proposal, bukan
 * hanya satu case.
 */

import type { IndustryContext } from "./industry-context";

type Terms = {
  job: string;
  customer: string;
  product: string;
  material: string;
};

function terms(ctx: IndustryContext | null): Terms {
  return {
    job: ctx?.jobTerm || "pekerjaan",
    customer: ctx?.customerTerm || "customer",
    product: ctx?.productTerm || "layanan",
    material: ctx?.materialTerm || "bahan",
  };
}

type Pattern = { match: RegExp; text: (t: Terms) => string };

const PATTERNS: Pattern[] = [
  {
    match: /(portfolio|portofolio|galeri|hasil kerja|hasil pekerjaan|foto|katalog|instagram|\big\b|whatsapp|\bwa\b|tersebar|berserak)/i,
    text: (t) =>
      `Hasil pekerjaan masih tersebar di beberapa media sehingga calon ${t.customer} belum memiliki tempat khusus untuk melihat referensi ${t.job} yang pernah dikerjakan.`,
  },
  {
    match: /(faq|pertanyaan berulang|tanya (yang )?sama|jawab satu per satu|nanya terus|informasi harga)/i,
    text: (t) =>
      `Pertanyaan yang sama datang berulang setiap hari dan harus dijawab satu per satu, sehingga waktu ${t.customer} menunggu jawaban jadi lebih lama.`,
  },
  {
    match: /(progress|status|update|perkembangan|sampai mana|sudah sampai)/i,
    text: (t) =>
      `${cap(t.customer)} sering menanyakan perkembangan pekerjaan karena belum ada informasi status ${t.job} yang bisa dilihat sendiri.`,
  },
  {
    match: /(nota|invoice|kwitansi|tagihan|pembayaran|bayar|\bdp\b|pelunasan)/i,
    text: (t) =>
      `Pembayaran sering berjalan bertahap dan bukti transaksinya belum tercatat rapi, sehingga status pembayaran tiap ${t.job} sulit dipastikan.`,
  },
  {
    match: /(stok|bahan|material|persediaan|inventory|kehabisan)/i,
    text: (t) =>
      `Ketersediaan ${t.material} belum terpantau dengan rapi, sehingga pengerjaan bisa tertunda ketika stok ternyata kurang saat dibutuhkan.`,
  },
  {
    match: /(jadwal|booking|antri|antre|reservasi|bentrok|schedul)/i,
    text: (t) =>
      `Penjadwalan masih diatur manual lewat percakapan, sehingga jadwal ${t.job} mudah bentrok dan sulit dipastikan kapasitas hariannya.`,
  },
  {
    match: /(laporan|omzet|omset|rekap|keuangan|pemasukan|profit|untung)/i,
    text: () =>
      `Owner belum memiliki rekap yang siap dibaca, sehingga performa bisnis hanya bisa diperkirakan dan sulit dicek angkanya secara cepat.`,
  },
  {
    match: /(data pelanggan|data customer|riwayat|history|follow ?up|repeat|pelanggan lama)/i,
    text: (t) =>
      `Data ${t.customer} tersimpan terpisah di beberapa tempat, sehingga riwayat ${t.job} sebelumnya sulit ditelusuri saat dibutuhkan.`,
  },
  {
    match: /(lupa|telat|terlewat|kelewat|molor|deadline)/i,
    text: (t) =>
      `Beberapa ${t.job} mudah terlewat karena pengingatnya masih mengandalkan ingatan dan pesan pribadi.`,
  },
  {
    match: /(website|web|online|google|dicari|branding|profesional|kepercayaan|belum punya)/i,
    text: (t) =>
      `Bisnis belum memiliki kehadiran online yang bisa diakses calon ${t.customer} saat mencari referensi dan memastikan kredibilitas.`,
  },
  {
    match: /(tim|karyawan|staff|koordinasi|pembagian tugas|pegawai)/i,
    text: () =>
      `Koordinasi tim masih berjalan lewat percakapan terpisah, sehingga pembagian tugas mudah simpang siur dan progresnya sulit dipantau.`,
  },
  {
    match: /(manual|buku|catat|excel|kertas|tercecer|hilang)/i,
    text: (t) =>
      `Pencatatan ${t.job} masih dilakukan manual, sehingga datanya mudah tercecer dan butuh waktu untuk dicari kembali.`,
  },
];

function cap(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function tidy(problem: string) {
  return problem.trim().replace(/^[-•\s]+/, "").replace(/[.。]+$/, "");
}

/**
 * Kalimat "Kondisi" untuk satu masalah customer. Selalu berbentuk kalimat
 * utuh — potongan teks brief tidak pernah ditampilkan mentah.
 */
export function conditionSentence(
  problem: string,
  ctx: IndustryContext | null,
): string {
  const raw = tidy(problem);
  if (!raw) return "Kondisi operasional saat ini masih perlu dirapikan agar pekerjaan lebih mudah dipantau.";
  const t = terms(ctx);
  const found = PATTERNS.find((p) => p.match.test(raw));
  if (found) return found.text(t);
  const lower = raw.charAt(0).toLowerCase() + raw.slice(1);
  return `Saat ini ${lower}, sehingga proses ${t.job} belum berjalan serapi yang diharapkan dan sebagian pekerjaan masih ditangani manual.`;
}

/** Label solusi yang mudah dipahami customer (tetap merujuk fitur yang sama). */
const SOLUTION_LABELS: { match: RegExp; label: string }[] = [
  { match: /(portfolio|portofolio|galeri)/i, label: "Galeri / Portfolio Hasil Pekerjaan" },
  { match: /\bfaq\b/i, label: "FAQ / Informasi Customer" },
  { match: /(nota|invoice)/i, label: "Invoice / Nota Digital" },
  { match: /(status|tracking)/i, label: "Status Tracking Progress Pekerjaan" },
  { match: /(notifikasi|notification)/i, label: "Notifikasi Progress Otomatis" },
  { match: /(booking|reservasi)/i, label: "Booking Jadwal Online" },
  { match: /(katalog|produk online)/i, label: "Katalog Produk Online" },
];

export function solutionLabel(name: string): string {
  const clean = name.trim();
  if (!clean) return clean;
  const found = SOLUTION_LABELS.find((row) => row.match.test(clean));
  return found ? found.label : clean;
}
