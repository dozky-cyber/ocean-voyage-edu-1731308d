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

export type FeatureGroup = {
  title: string;
  items: string[];
};

export type Project = {
  name: string;
  category: string;
  tagline?: string;
  description: string;
  problem?: string;
  solution?: string;
  features?: string[];
  featureGroups?: FeatureGroup[];
  status?: "LIVE" | "IN DEVELOPMENT";
  icon: "activity" | "wallet" | "ruler" | "bot" | "workflow" | "sparkle";
  url?: string;
};

export const projects: Record<ProjectMode, Project[]> = {
  Products: [
    {
      name: "RO MEMORY",
      category: "FIELD ACTIVITY INTELLIGENCE SYSTEM",
      tagline: "Sistem Intelijen Aktivitas Lapangan",
      problem:
        "Sebagai Relationship Officer pada industri material interior, aktivitas lapangan membutuhkan pengelolaan data yang cepat, terstruktur, dan mudah dianalisa.\n\nTantangan yang terjadi:\n- Sulit mengetahui progres target dan pencapaian secara real-time.\n- Data workshop, customer, dan aktivitas visit masih tersebar.\n- Membutuhkan waktu lama untuk membuat laporan pekerjaan.\n- Informasi penting sering terlupakan karena tidak langsung terdokumentasi.\n- Sulit menentukan prioritas lokasi visit berikutnya.\n- Kesulitan mempresentasikan performa kerja karena data belum tervisualisasi dengan baik.",
      solution:
        "Sistem Field Activity Intelligence berbasis AI yang mengubah aktivitas lapangan menjadi informasi bisnis terstruktur melalui dashboard visual, analisa data, dan otomatisasi laporan.\n\nRO Memory membantu mengelola aktivitas visit, database workshop/customer, monitoring performa, hingga pembuatan laporan otomatis dalam satu platform terintegrasi.",
      description:
        "Dari data lapangan yang tercecer menjadi pusat kendali bisnis dalam satu genggaman. RO Memory mengubah aktivitas, data customer, dan laporan menjadi informasi yang terstruktur melalui dashboard pintar berbasis AI. Temukan informasi lebih cepat, buat laporan tanpa proses yang rumit, bagikan insight ke atasan hanya dengan satu klik, dan biarkan AI Assistant membantu tim mengambil keputusan yang lebih tepat.",
      featureGroups: [
        {
          title: "Smart Business Dashboard",
          items: [
            "Monitoring target dan pencapaian",
            "Grafik performa aktivitas",
            "Visualisasi data customer/workshop",
            "Business insight dari data lapangan",
          ],
        },
        {
          title: "AI Intelligence System",
          items: [
            "AI Assistant pribadi",
            "AI report generator",
            "Smart notes otomatis",
            "Voice to text reporting",
            "Automatic summary aktivitas",
          ],
        },
        {
          title: "Performance Analytics",
          items: [
            "Grafik tren performa",
            "Statistik aktivitas visit",
            "Monitoring progress target",
            "Visual report untuk presentasi",
          ],
        },
        {
          title: "Field Activity Management",
          items: [
            "Database workshop/customer",
            "Riwayat kunjungan",
            "Follow-up management",
            "Project tracking",
          ],
        },
        {
          title: "Location Intelligence",
          items: [
            "Share location database",
            "Mapping workshop/customer",
            "Pencarian lokasi berdasarkan area",
            "Support penentuan rute visit",
          ],
        },
        {
          title: "Automation & Data Integration",
          items: [
            "Spreadsheet integration",
            "Excel backup & restore",
            "Report sharing",
            "Reminder otomatis",
            "Personal assistant bot",
          ],
        },
      ],
      status: "LIVE",
      icon: "activity",
      url: "https://memory.kerjaku.space",
    },
    {
      name: "QResto",
      category: "Smart Order Management System",
      tagline: "Sistem Pemesanan Restoran Digital",
      problem:
        "Cafe dan restoran membutuhkan cara lebih mulus untuk menghubungkan pelanggan, kasir, dan operasional dapur dalam satu alur pesanan.",
      solution:
        "Pemesanan berbasis QR Code di setiap meja: pelanggan cukup scan, memilih menu, dan mengirim pesanan langsung dari ponsel tanpa antre di kasir.\n\nProses pemesanan menjadi lebih cepat dan minim salah catat, sementara operasional restoran berjalan lebih rapi karena pesanan, transaksi, dan laporan penjualan terkelola dalam satu dashboard.",
      description:
        "QResto membantu pelanggan memilih menu dan melakukan pemesanan dengan mudah tanpa harus antre di kasir. Tidak perlu khawatir kehilangan kursi pilihan anda, cukup scan barcode di meja, pesanan makanan dan minuman datang, dan nikmati layanan yang lebih cepat dan pintar. Di sisi bisnis, satu dashboard membantu restoran mengelola transaksi, penjualan, dan laporan secara lebih terstruktur dan update.",
      features: [
        "QR Code Menu di setiap meja",
        "Digital ordering langsung dari ponsel pelanggan",
        "Order management untuk kasir dan dapur",
        "Transaction dashboard terpusat",
        "Sales reporting real-time",
        "Cetak struk pesanan",
      ],
      status: "LIVE",
      icon: "workflow",
      url: "https://qresto.kerjaku.space/",
    },
    {
      name: "DOMPET GUE",
      category: "Personal Finance Workspace",
      tagline: "Sistem Manajemen Keuangan Pribadi",
      problem:
        "Pencatatan keuangan pribadi tersebar di catatan, aplikasi, dan spreadsheet sehingga sulit mendapatkan gambaran keuangan yang utuh.",
      solution:
        "Aplikasi keuangan pribadi untuk mencatat aset, pemasukan, pengeluaran, hutang, cicilan, dan aktivitas keuangan dalam satu tempat.",
      description:
        "Mengatur keuangan pribadi seharusnya sederhana. Dompet Gue merapikan pemasukan, pengeluaran, dan aset dalam satu workspace, sehingga setiap rupiah terlihat jelas ke mana perginya. Dalam sekali lihat, kondisi keuangan Anda hari ini menjadi mudah dipahami dan lebih mudah dikendalikan.",
      features: [
        "Asset tracking",
        "Cash flow monitoring",
        "Debt & installment tracking",
        "Monthly summary",
      ],
      status: "LIVE",
      icon: "wallet",
      url: "https://dompetgue.kerjaku.space",
    },
    {
      name: "MATERIAL ESTIMATOR",
      category: "Furniture & Interior Material Planning",
      tagline: "Sistem Estimasi Material Furniture & Interior",
      problem:
        "Perhitungan kebutuhan material furniture dan interior sering dilakukan manual sehingga rentan salah dan memakan waktu.",
      solution:
        "Sistem untuk membantu menghitung kebutuhan material furniture dan interior berdasarkan ukuran pekerjaan agar perencanaan bahan lebih cepat dan terstruktur.",
      description:
        "Menghitung kebutuhan material tidak perlu lagi menyita waktu. Material Estimator menerjemahkan ukuran pekerjaan furniture dan interior menjadi estimasi bahan yang rapi dan konsisten. Perencanaan proyek jadi lebih cepat, lebih terstruktur, dan lebih mudah dipertanggungjawabkan.",
      features: [
        "Material calculation",
        "Furniture planning",
        "Quantity estimation",
        "Material requirement planning",
      ],
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
