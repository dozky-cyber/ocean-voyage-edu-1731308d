/**
 * Centralized content for the KERJAKU experience.
 * All copy/data lives here so text and assets can be swapped in
 * without touching layout or animation code.
 */

export type ProjectMode = "Products" | "Experiments";

export const brand = {
  name: "KERJAKU",
  tagline: "DIGITAL PRODUCT JOURNEY",
  motto: "Work, made your way.",
  contactEmail: "cs@kerjaku.space",
};

export const projectModes: {
  id: ProjectMode;
  label: string;
  full: string;
  description: string;
}[] = [
  {
    id: "Products",
    label: "Products",
    full: "Shipped & Live",
    description: "Produk digital yang sudah berjalan dan dipakai dalam pekerjaan nyata.",
  },
  {
    id: "Experiments",
    label: "Experiments",
    full: "In The Lab",
    description: "Eksperimen AI, automation, dan tools kecil yang sedang saya uji.",
  },
];

export const hero = {
  title: "Work, made your way.",
  subtitle:
    "Ruang untuk merancang ide, membangun sistem, dan menciptakan produk digital yang membantu menyelesaikan masalah nyata.",
  primaryCta: "Explore My Work",
  secondaryCta: "About Me",
};

export const pastel = {
  eyebrow: "Permukaan",
  title: "Ideas Behind The Build",
  subtitle: "Every product starts with a problem worth solving.",
  body: "Setiap produk dimulai dari memahami masalah, kebutuhan pengguna, dan alur kerja yang sebenarnya sebelum menentukan solusi.",
  fragments: [
    { label: "Masalah Nyata", note: "Melihat apa yang benar-benar menghambat pekerjaan." },
    {
      label: "Memahami Alur",
      note: "Mencari pola kerja dan informasi yang sebenarnya dibutuhkan.",
    },
    {
      label: "Membangun Solusi",
      note: "Mengubah kebutuhan menjadi sistem yang sederhana dan bisa digunakan.",
    },
    {
      label: "Dipakai & Diperbaiki",
      note: "Menguji langsung, melihat kekurangan, lalu memperbaikinya.",
    },
  ],
};

export type WorldId = "web" | "data" | "ai";

export const worlds: {
  id: WorldId;
  title: string;
  subtitle: string;
  body: string;
  depth: string;
  points: string[];
}[] = [
  {
    id: "web",
    title: "Web Applications",
    subtitle: "Antarmuka Kerja",
    body: "Sistem kerja yang dapat digunakan dari desktop maupun mobile.",
    depth: "-120 m",
    points: [
      "Dashboard dan form kerja harian",
      "Responsif untuk mobile dan desktop",
      "Autentikasi dan hak akses pengguna",
    ],
  },
  {
    id: "data",
    title: "Data & Workflow Systems",
    subtitle: "Fondasi Data",
    body: "Mengubah aktivitas operasional menjadi data yang lebih terstruktur, mudah dibaca, dan bisa digunakan kembali.",
    depth: "-320 m",
    points: [
      "Struktur data yang rapi dan konsisten",
      "Riwayat dan jejak aktivitas",
      "Ringkasan dan ekspor untuk pelaporan",
    ],
  },
  {
    id: "ai",
    title: "AI & Automation",
    subtitle: "Lapisan Cerdas",
    body: "AI digunakan ketika memang membantu mempercepat pencatatan, pencarian informasi, dan pengambilan keputusan.",
    depth: "-520 m",
    points: [
      "Ringkasan aktivitas otomatis",
      "Pencarian informasi internal",
      "Alur kerja yang berjalan sendiri",
    ],
  },
];

export const systems = {
  eyebrow: "Arus Tengah",
  title: "Systems & Solutions",
  body: "Tiga area kerja yang saya gunakan untuk mengubah ide menjadi sistem digital yang benar-benar dipakai.",
};

export const products = {
  eyebrow: "Palung",
  title: "Products I Build",
  body: "Produk digital yang sedang dan telah saya kembangkan.",
};

export type Project = {
  name: string;
  category: string;
  description: string;
  status?: "LIVE" | "IN DEVELOPMENT";
  icon: "activity" | "wallet" | "ruler" | "bot" | "workflow" | "sparkle";
  url?: string;
};

export const projects: Record<ProjectMode, Project[]> = {
  Products: [
    {
      name: "RO MEMORY",
      category: "Field Activity Intelligence System",
      description:
        "Sistem kerja untuk mencatat aktivitas kunjungan, mengelola workshop, membaca performa, dan membantu pekerjaan lapangan melalui AI dan Telegram.",
      status: "LIVE",
      icon: "activity",
      url: "https://memory.kerjaku.space",
    },
    {
      name: "QResto",
      category: "SMART ORDER MANAGEMENT SYSTEM",
      description:
        "Platform smart order management untuk cafe dan restoran yang menghubungkan pelanggan, kasir, dan operasional bisnis melalui sistem QR meja. Pelanggan dapat melakukan pemesanan secara mandiri melalui perangkat mereka, sementara admin dapat mengelola pesanan, transaksi, pencetakan nota, serta memantau laporan penjualan secara real-time melalui satu dashboard terintegrasi.",
      icon: "workflow",
      url: "https://qresto.kerjaku.space/",
    },
    {
      name: "DOMPET GUE",
      category: "Personal Finance Workspace",
      description:
        "Aplikasi pencatatan keuangan pribadi untuk melihat aset, pemasukan, pengeluaran, hutang, cicilan, dan aktivitas keuangan dalam satu tempat.",
      status: "LIVE",
      icon: "wallet",
      url: "https://dompetgue.kerjaku.space",
    },
    {
      name: "MATERIAL ESTIMATOR",
      category: "Furniture & Interior Material Planning",
      description:
        "Sistem untuk membantu menghitung kebutuhan material furniture dan interior berdasarkan ukuran pekerjaan agar perencanaan bahan lebih cepat dan terstruktur.",
      status: "IN DEVELOPMENT",
      icon: "ruler",
    },
  ],
  Experiments: [
    {
      name: "AI HPL FINDER",
      category: "Visual Material Recognition",
      description:
        "Eksperimen pencarian kode HPL dari foto material, untuk mempercepat pencocokan finishing di lapangan.",
      status: "IN DEVELOPMENT",
      icon: "sparkle",
    },
    {
      name: "TELEGRAM WORKFLOW",
      category: "Chat-based Automation",
      description:
        "Uji coba alur kerja lewat Telegram: pencatatan cepat, pengingat, dan laporan terjadwal tanpa membuka aplikasi.",
      status: "IN DEVELOPMENT",
      icon: "workflow",
    },
    {
      name: "AI ASSISTANT",
      category: "Conversational Work Helper",
      description:
        "Eksperimen asisten yang merangkum catatan kerja dan menyusun langkah tindak lanjut secara bertahap.",
      status: "IN DEVELOPMENT",
      icon: "bot",
    },
  ],
};

export const profile = {
  eyebrow: "Dasar Laut",
  title: "Digital Product Builder",
  body: "Saya membangun produk digital dari masalah yang saya temui dalam pekerjaan dan kehidupan sehari-hari, lalu mengubahnya menjadi sistem yang benar-benar bisa digunakan.",
  name: "Adji Taufiq",
  caption: "Adji Taufiq",
  skills: [
    "Problem-first",
    "AI-assisted development",
    "Operational systems",
    "Product experimentation",
  ],
};

export const lab = {
  eyebrow: "Laboratorium",
  title: "KERJAKU LAB",
  subtitle: "Experiments, AI & Automation",
  body: "Eksperimen teknologi untuk mengubah data, aktivitas lapangan, dan kebutuhan kerja menjadi sistem yang lebih cepat, praktis, dan mudah dipahami.",
  cards: [
    {
      title: "AI REPORTING",
      subtitle: "Daily, Weekly & Monthly Reporting",
      note: "AI membantu merangkum aktivitas, performa, dan insight menjadi laporan harian, mingguan, atau bulanan.",
      icon: "report",
    },
    {
      title: "AI DATA VISUALIZATION",
      subtitle: "Automatic Charts & Presentation View",
      note: "AI membantu mengubah data menjadi grafik otomatis yang relevan, mudah dibaca, dan siap digunakan untuk analisis maupun kebutuhan presentasi.",
      icon: "chart",
    },
    {
      title: "AI SMART NOTES",
      subtitle: "Notes-to-Structured Visit",
      note: "AI membantu merapikan catatan berdasarkan kategori serta mengolah catatan kunjungan menjadi data dan laporan visit yang lebih terstruktur untuk ditinjau sebelum disimpan.",
      icon: "notes",
    },
    {
      title: "VOICE TO DATA",
      subtitle: "AI Voice-to-Structured Data",
      note: "Ubah input suara menjadi data terstruktur untuk mempercepat pencatatan aktivitas tanpa banyak mengetik.",
      icon: "voice",
    },
    {
      title: "TELEGRAM FIELD ASSISTANT",
      subtitle: "Conversational Work Assistant",
      note: "Asisten Telegram untuk membaca data workshop, visit, toko, performa, mencatat Smart Notes, dan membantu pekerjaan lapangan lewat percakapan.",
      icon: "chat",
    },
    {
      title: "AI PJP RECOMMENDATION",
      subtitle: "Smart Visit Planning",
      note: "Rekomendasi prioritas kunjungan berdasarkan PJP, status visit, data workshop, dan konteks yang tersedia.",
      icon: "route",
    },
    {
      title: "SMART SHARE LOCATION",
      subtitle: "Nearby Workshop Recommendation",
      note: "Dari lokasi saat ini, sistem membantu menemukan workshop yang relevan dan terdekat untuk dikunjungi.",
      icon: "location",
    },
    {
      title: "AI HPL CODE FINDER",
      subtitle: "Visual Material Recognition",
      note: "AI membantu mencari kecocokan kode HPL dari foto material untuk membantu identifikasi dan pencocokan finishing di lapangan.",
      icon: "scan",
    },
  ] as const,
  examples: [
    "Bagaimana AI membantu laporan lapangan?",
    "Otomatiskan follow-up pekerjaan mingguan",
    "Rancang sistem estimasi material",
    "Ide fitur untuk aplikasi keuangan pribadi",
  ],
};

export const finalCta = {
  eyebrow: "Penutup",
  title: "Keep Building",
  body: "Setiap masalah bisa melahirkan ide yang memiliki kesempatan untuk menjadi sesuatu yang berguna.",
  primary: "Let's Connect",
};

export const workPanel: Record<ProjectMode, { subject: string; topics: string[] }[]> = {
  Products: [
    {
      subject: "RO MEMORY",
      topics: ["Aktivitas kunjungan", "Workshop", "Performa kerja", "AI & Telegram"],
    },
    {
      subject: "QResto",
      topics: ["QR meja", "Order management", "Kasir & transaksi", "Laporan real-time"],
    },
    {
      subject: "DOMPET GUE",
      topics: [
        "Aset & arus kas",
        "Hutang dan cicilan",
        "Kategori pengeluaran",
        "Ringkasan bulanan",
      ],
    },
    {
      subject: "MATERIAL ESTIMATOR",
      topics: [
        "Material calculation",
        "Furniture planning",
        "Quantity estimation",
        "Material requirement planning",
      ],
    },
  ],
  Experiments: [
    {
      subject: "AI HPL Finder",
      topics: ["Foto material", "Pencocokan kode", "Uji akurasi", "Catatan lapangan"],
    },
    {
      subject: "Telegram Workflow",
      topics: ["Pencatatan cepat", "Pengingat pekerjaan", "Laporan terjadwal", "Sinkronisasi data"],
    },
    {
      subject: "AI Assistant",
      topics: [
        "Ringkasan catatan",
        "Tanya jawab internal",
        "Saran tindak lanjut",
        "Bahasa sederhana",
      ],
    },
  ],
};

export const processSteps = [
  {
    title: "1. Pahami masalahnya",
    body: "Mulai dari masalah nyata di pekerjaan: apa yang lambat, berulang, atau mudah salah.",
  },
  {
    title: "2. Pahami alurnya",
    body: "Kumpulkan konteks, data, dan cara kerja pengguna sebelum menulis satu baris kode.",
  },
  {
    title: "3. Rancang sistemnya",
    body: "Susun alur, struktur data, dan antarmuka yang paling sederhana untuk menyelesaikan masalah.",
  },
  {
    title: "4. Bangun & otomatisasi",
    body: "Kembangkan aplikasi, tambahkan automation dan lapisan AI di titik yang benar-benar membantu.",
  },
  {
    title: "5. Pakai, ukur, perbaiki",
    body: "Gunakan produknya di pekerjaan sehari-hari, ukur hasilnya, lalu perbaiki secara bertahap.",
  },
];

/** Deterministic local demo response — no external AI call is made. */
export function buildDemoAnswer(question: string, mode: ProjectMode): string[] {
  const q = question.trim().replace(/\s+/g, " ");
  const topic = q.replace(/[?.!]+$/, "");
  return [
    `Konteks ${mode}: "${topic}" bisa didekati lewat tiga lapisan, dari masalah sampai produk yang berjalan.`,
    `Lapisan 1 — Permukaan: rumuskan masalahnya dalam satu kalimat dan tentukan siapa penggunanya.`,
    `Lapisan 2 — Sistem: petakan alur kerja dan data yang dibutuhkan, lalu cari bagian yang bisa diotomatiskan.`,
    `Lapisan 3 — Produk: bangun versi terkecil yang bisa dipakai, ukur hasilnya, lalu iterasi.`,
    `Catatan: jawaban ini adalah demo lokal KERJAKU, bukan hasil dari layanan AI eksternal.`,
  ];
}
