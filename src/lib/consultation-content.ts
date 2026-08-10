/** Content + option lists for the "Kenapa Memilih KERJAKU" and consultation sections. */

export const whyKerjaku = {
  eyebrow: "Kenapa KERJAKU",
  title: "Kenapa Memilih KERJAKU",
  cards: [
    {
      title: "Berangkat dari Masalah Nyata",
      body: "KERJAKU memahami kebutuhan dan proses kerja terlebih dahulu sebelum menentukan solusi digital.",
    },
    {
      title: "Custom Sesuai Kebutuhan",
      body: "Website, aplikasi, dan sistem dibuat mengikuti kebutuhan project, bukan hanya menggunakan template.",
    },
    {
      title: "Produk Digital Nyata",
      body: "KERJAKU membangun produk digital dan sistem nyata sebagai pengalaman pengembangan.",
    },
    {
      title: "Dapat Dikembangkan Bertahap",
      body: "Solusi dapat dimulai dari kebutuhan utama dan dikembangkan sesuai kebutuhan berikutnya.",
    },
  ],
} as const;

export const consultationSection = {
  eyebrow: "Konsultasi",
  title: "Konsultasikan Project Anda",
  body: "Ceritakan kebutuhan digital Anda. KERJAKU akan mempelajari kebutuhan, masalah, dan ruang lingkup project sebelum menentukan solusi.",
  cta: "Mulai Konsultasi",
} as const;

export const projectTypes = [
  "Website Company Profile",
  "Website Bisnis",
  "Landing Page",
  "Web Application",
  "Aplikasi Custom",
  "Dashboard Sistem",
  "Sistem Operasional",
  "E-Commerce",
  "AI & Automation",
  "Integrasi Sistem",
  "Lainnya",
] as const;

export const budgetOptions = [
  "Sampai Rp500.000",
  "Rp500.000 - Rp1.000.000",
  "Rp1.000.000 - Rp3.000.000",
  "Rp3.000.000 - Rp5.000.000",
  "Rp5.000.000 - Rp10.000.000",
  "Di atas Rp10.000.000",
] as const;

export const timelineOptions = [
  "Secepatnya",
  "1 bulan",
  "2-3 bulan",
  "Lebih dari 3 bulan",
  "Fleksibel",
] as const;
