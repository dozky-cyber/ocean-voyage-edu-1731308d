/**
 * CONSULTANT ENGINE V4 — REGRESSION SUITE.
 *
 * Menguji 20+ skenario bisnis berbeda agar pemisahan tetap konsisten:
 *   CORE SOLUTION     = fitur yang menyelesaikan masalah yang customer sebut.
 *   POTENTIAL FEATURE = fitur pengembangan setelah masalah utama selesai.
 */

import { describe, expect, it } from "vitest";
import { selectConsultantFeatures } from "./consultant-library";
import { buildProblemSolutionPlan } from "./problem-solution-map";
import { decidePackageLevel } from "./package-decision-sop";
import type { OrderBriefData } from "../order-brief";

type Scenario = {
  name: string;
  businessText: string;
  problemText: string;
  goalText?: string;
  context: string;
  scaleText?: string;
  allowEnterprise?: boolean;
  /** Fitur yang WAJIB muncul sebagai core (menjawab masalah pada brief). */
  expectCore: string[];
  /** Fitur yang TIDAK boleh muncul sama sekali. */
  forbid?: string[];
};

const SCENARIOS: Scenario[] = [
  {
    name: "Laundry kiloan Andi — order manual + status cucian",
    businessText: "Laundry kiloan",
    problemText:
      "Order masih dicatat manual di buku, pesanan tertukar, customer sering tanya status cucian sudah selesai belum",
    goalText: "Operasional lebih rapi dan customer mudah memesan",
    context: "1 outlet, owner dan 4 karyawan, order via whatsapp",
    scaleText: "owner dan 4 karyawan",
    expectCore: ["order-management", "status-tracking"],
    forbid: ["inventory", "crm", "api-integration"],
  },
  {
    name: "Florist personal — katalog dan pemesanan online",
    businessText: "Toko bunga / florist",
    problemText: "Belum ada website, customer sulit melihat daftar produk dan sulit memesan",
    goalText: "Customer bisa pesan online",
    context: "dikelola personal, tanpa karyawan",
    scaleText: "Tidak (dikelola personal)",
    expectCore: ["katalog"],
    forbid: ["multi-user"],
  },
  {
    name: "Distributor sparepart — kontrol stok",
    businessText: "Distributor sparepart motor",
    problemText: "Stok sulit dikontrol, sering kehabisan barang, pencatatan order manual",
    context: "3 cabang, 30 karyawan, banyak SKU",
    scaleText: "30 user, 3 cabang",
    expectCore: ["inventory", "order-management"],
  },
  {
    name: "Bengkel mobil — jadwal bentrok",
    businessText: "Bengkel mobil",
    problemText: "Jadwal servis sering bentrok, penjadwalan mekanik manual",
    context: "1 bengkel, 6 mekanik",
    scaleText: "6 karyawan",
    expectCore: ["schedule-management"],
    forbid: ["inventory"],
  },
  {
    name: "Salon — booking online",
    businessText: "Salon kecantikan",
    problemText: "Customer sulit memesan jadwal, reservasi lewat chat menumpuk",
    context: "1 cabang, 5 kapster",
    scaleText: "5 karyawan",
    expectCore: ["booking"],
  },
  {
    name: "Katering rumahan — nota manual",
    businessText: "Katering rumahan",
    problemText: "Nota masih ditulis manual, bukti transaksi sering hilang",
    context: "pesanan harian kantor",
    scaleText: "dikelola personal",
    expectCore: ["digital-nota"],
    forbid: ["multi-user"],
  },
  {
    name: "Toko kelontong — laporan penjualan manual",
    businessText: "Toko kelontong",
    problemText: "Rekap omzet masih manual, laporan penjualan tidak pernah rapi",
    context: "1 toko, 2 kasir",
    scaleText: "2 karyawan",
    expectCore: ["laporan-penjualan"],
  },
  {
    name: "Klinik gigi — data pasien tidak tersimpan",
    businessText: "Klinik gigi",
    problemText: "Data pelanggan tidak tersimpan, riwayat kunjungan hilang",
    context: "1 klinik, 3 dokter",
    scaleText: "3 karyawan",
    expectCore: ["database-customer"],
  },
  {
    name: "Studio foto — pelanggan lama sulit follow up",
    businessText: "Studio fotografer",
    problemText: "Pelanggan lama sulit follow up, repeat order rendah",
    context: "1 studio",
    scaleText: "2 karyawan",
    expectCore: ["customer-history"],
  },
  {
    name: "Coffee shop — order chat bercampur",
    businessText: "Coffee shop",
    problemText: "Order manual lewat chat sering tertukar",
    goalText: "Merapikan operasional harian",
    context: "1 kedai, 4 barista",
    scaleText: "4 karyawan",
    expectCore: ["order-management"],
  },
  {
    name: "Cuci sepatu — status pengerjaan",
    businessText: "Jasa cuci sepatu",
    problemText: "Customer bertanya terus progress pengerjaan",
    context: "workshop kecil",
    scaleText: "2 karyawan",
    expectCore: ["status-tracking"],
    forbid: ["inventory"],
  },
  {
    name: "Toko online fashion — katalog belum tersusun",
    businessText: "Toko online fashion",
    problemText: "Informasi produk belum tersusun, belum ada website",
    context: "jualan via marketplace",
    scaleText: "dikelola personal",
    expectCore: ["katalog"],
    forbid: ["multi-user"],
  },
  {
    name: "Agen grosir sembako — pencatatan order",
    businessText: "Agen grosir sembako",
    problemText: "Pencatatan order manual dan stok gudang sulit dipantau",
    context: "2 gudang, 15 karyawan",
    scaleText: "15 karyawan",
    expectCore: ["order-management", "inventory"],
  },
  {
    name: "Barbershop — jadwal dan booking",
    businessText: "Barbershop",
    problemText: "Reservasi manual, customer sulit memesan jadwal potong",
    context: "2 cabang",
    scaleText: "8 karyawan",
    expectCore: ["booking"],
  },
  {
    name: "Service AC — hak akses teknisi",
    businessText: "Jasa service AC",
    problemText: "Perlu hak akses berbeda untuk admin dan teknisi, order dicatat manual",
    context: "10 teknisi lapangan",
    scaleText: "10 karyawan",
    expectCore: ["multi-user", "order-management"],
  },
  {
    name: "Rumah makan — menu dan nota",
    businessText: "Rumah makan",
    problemText: "Menu tidak terstruktur dan nota manual",
    context: "1 outlet",
    scaleText: "6 karyawan",
    expectCore: ["katalog", "digital-nota"],
  },
  {
    name: "Percetakan — status pekerjaan order",
    businessText: "Percetakan digital printing",
    problemText: "Status pekerjaan sulit dipantau, order manual di buku",
    context: "1 workshop",
    scaleText: "5 karyawan",
    expectCore: ["status-tracking", "order-management"],
  },
  {
    name: "Konsultan pajak — konten website",
    businessText: "Konsultan pajak",
    problemText: "Tidak bisa update konten sendiri, harus minta developer",
    context: "kantor kecil",
    scaleText: "3 karyawan",
    expectCore: ["cms"],
  },
  {
    name: "Toko elektronik — riwayat transaksi",
    businessText: "Toko elektronik",
    problemText: "Bukti transaksi tidak rapi, struk manual",
    context: "1 toko",
    scaleText: "3 karyawan",
    expectCore: ["digital-nota"],
  },
  {
    name: "Pabrik konveksi — operasional belum terpantau",
    businessText: "Pabrik konveksi",
    problemText: "Operasional berantakan, owner sulit memantau pekerjaan harian",
    context: "1 pabrik, 20 penjahit",
    scaleText: "20 karyawan",
    expectCore: ["dashboard-admin"],
  },
  {
    name: "Laundry sepatu premium — retensi pelanggan",
    businessText: "Laundry sepatu premium",
    problemText: "Pelanggan lama jarang kembali, follow up manual",
    context: "1 outlet",
    scaleText: "3 karyawan",
    expectCore: ["customer-history"],
  },
  {
    name: "Bidan praktik mandiri — jadwal pasien",
    businessText: "Bidan praktik mandiri",
    problemText: "Jadwal pasien bentrok dan data pelanggan tidak tersimpan",
    context: "praktik personal",
    scaleText: "Tidak (dikelola personal)",
    expectCore: ["schedule-management", "database-customer"],
    forbid: ["multi-user"],
  },
  {
    name: "Warung sembako — catat penjualan manual",
    businessText: "Warung sembako",
    problemText: "Catat penjualan manual di buku, sering lupa harga",
    context: "warung kecil, dijaga sendiri",
    scaleText: "Tidak (dikelola personal)",
    expectCore: ["order-management"],
    forbid: ["multi-user", "crm"],
  },
  {
    name: "Bakery — pesanan kue tertukar",
    businessText: "Toko bakery",
    problemText: "Pesanan kue dicatat manual dan sering tertukar, customer tanya status pesanan",
    context: "1 toko, 5 karyawan",
    scaleText: "5 karyawan",
    expectCore: ["order-management", "status-tracking"],
    forbid: ["crm"],
  },
  {
    name: "Kontraktor — progress proyek",
    businessText: "Kontraktor bangunan",
    problemText: "Progress proyek sulit dipantau, jadwal pekerjaan tim sering bentrok",
    context: "3 proyek berjalan, 12 pekerja",
    scaleText: "12 karyawan",
    expectCore: ["status-tracking", "schedule-management"],
    forbid: ["inventory"],
  },
  {
    name: "Travel agent — reservasi manual",
    businessText: "Travel agent / tour",
    problemText: "Reservasi paket wisata masih manual lewat chat, customer sulit memesan",
    context: "1 kantor, 4 staff",
    scaleText: "4 karyawan",
    expectCore: ["booking"],
    forbid: ["inventory"],
  },
  {
    name: "Agen properti — listing sulit disampaikan",
    businessText: "Agen properti",
    problemText: "Daftar listing properti sulit disampaikan ke calon pembeli, belum ada website",
    goalText: "Calon pembeli bisa melihat listing",
    context: "5 marketing",
    scaleText: "5 karyawan",
    expectCore: ["katalog"],
    forbid: ["inventory"],
  },
  {
    name: "Event organizer — jadwal dan progress",
    businessText: "Event organizer",
    problemText: "Jadwal event bentrok dan progress persiapan sulit dipantau",
    context: "tim 8 orang, banyak klien",
    scaleText: "8 karyawan",
    expectCore: ["schedule-management", "status-tracking"],
    forbid: ["inventory"],
  },
  {
    name: "Konter pulsa — rekap omzet manual",
    businessText: "Konter pulsa dan aksesoris HP",
    problemText: "Transaksi dicatat manual, rekap omzet harian tidak rapi",
    context: "1 konter, dijaga sendiri",
    scaleText: "Tidak (dikelola personal)",
    expectCore: ["order-management", "laporan-penjualan"],
    forbid: ["multi-user"],
  },
];

function run(scenario: Scenario) {
  return selectConsultantFeatures({
    businessText: scenario.businessText,
    problemText: scenario.problemText,
    goalText: scenario.goalText,
    context: `${scenario.problemText} ${scenario.goalText ?? ""} ${scenario.context} ${scenario.scaleText ?? ""}`,
    scaleText: scenario.scaleText,
    allowEnterprise: scenario.allowEnterprise ?? false,
    limit: 10,
  });
}

describe("Consultant Engine V4 — core solution vs potential feature", () => {
  it("menguji minimal 20 skenario bisnis berbeda", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SCENARIOS.map((s) => s.businessText)).size).toBe(SCENARIOS.length);
  });

  describe.each(SCENARIOS.map((s) => [s.name, s] as const))("%s", (_name, scenario) => {
    const picks = run(scenario);
    const core = picks.filter((p) => p.role === "core");
    const growth = picks.filter((p) => p.role === "growth");
    const coreIds = core.map((p) => p.id);
    const ids = picks.map((p) => p.id);

    it("core solution menjawab masalah yang customer sebut", () => {
      for (const id of scenario.expectCore) expect(coreIds).toContain(id);
    });

    it("setiap core menyebut masalah yang diselesaikan", () => {
      for (const pick of core) expect(pick.solves).toBeTruthy();
    });

    it("potential feature bukan penyelesai masalah utama", () => {
      for (const pick of growth) {
        expect(pick.solves).toBeNull();
        expect(coreIds).not.toContain(pick.id);
      }
    });

    it("potential feature hanya muncul bila core prasyaratnya terpilih", () => {
      for (const pick of growth) {
        if (pick.requiresCoreId) expect(coreIds).toContain(pick.requiresCoreId);
      }
    });

    it("tidak merekomendasikan fitur di luar alur bisnis", () => {
      for (const id of scenario.forbid ?? []) expect(ids).not.toContain(id);
    });

    it("tidak ada fitur duplikat antar section", () => {
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});

describe("Consultant Engine V5 — aturan khusus fitur", () => {
  const base = {
    businessText: "Toko kelontong",
    context: "1 toko, owner dan 2 karyawan",
    scaleText: "owner dan 2 karyawan",
    allowEnterprise: false,
    limit: 7,
  };

  const ids = (over: Partial<Parameters<typeof selectConsultantFeatures>[0]>) =>
    selectConsultantFeatures({ ...base, ...over }).map((p) => p.id);
  const coreIds = (over: Partial<Parameters<typeof selectConsultantFeatures>[0]>) =>
    selectConsultantFeatures({ ...base, ...over })
      .filter((p) => p.role === "core")
      .map((p) => p.id);

  it("inventory tidak muncul bila stok bukan masalah customer", () => {
    expect(ids({ problemText: "Pencatatan order manual di buku" })).not.toContain("inventory");
  });

  it("inventory muncul bila stok memang masalah customer", () => {
    expect(ids({ problemText: "Stok sering selisih dan kehabisan barang" })).toContain("inventory");
  });

  it("digital nota bukan core bila nota tidak disebut", () => {
    expect(coreIds({ problemText: "Pencatatan order manual di buku" })).not.toContain("digital-nota");
  });

  it("automation tidak pernah muncul kecuali diminta", () => {
    expect(ids({ problemText: "Order dicatat manual", context: "1 toko, 10 karyawan" })).not.toContain(
      "automation",
    );
  });

  it("crm tidak muncul untuk usaha kecil tanpa kebutuhan sales", () => {
    expect(ids({ problemText: "Order dicatat manual" })).not.toContain("crm");
  });

  it("multi user hanya bila ada kebutuhan hak akses berbeda", () => {
    expect(ids({ problemText: "Order dicatat manual", context: "10 karyawan" })).not.toContain(
      "multi-user",
    );
    expect(
      ids({
        problemText: "Order dicatat manual, butuh hak akses berbeda untuk kasir dan owner",
        context: "10 karyawan, hak akses berbeda",
      }),
    ).toContain("multi-user");
  });

  it("dashboard core hanya bila owner menyebut kebutuhan monitoring", () => {
    expect(coreIds({ problemText: "Order dicatat manual" })).not.toContain("dashboard-admin");
    expect(
      coreIds({ problemText: "Order dicatat manual, owner sulit memantau pekerjaan harian" }),
    ).toContain("dashboard-admin");
  });

  it("tidak merekomendasikan ulang fitur yang sudah ada pada brief", () => {
    expect(
      ids({
        problemText: "Customer sulit memesan, ingin pesan online",
        briefFeatureText: "Pemesanan online / booking",
      }),
    ).not.toContain("booking");
  });
});

describe("Problem → solution map", () => {

  it("tidak menghasilkan core tanpa masalah yang disebut customer", () => {
    const plan = buildProblemSolutionPlan({
      businessText: "Toko bunga",
      problemText: "",
      goalText: "",
      context: "toko bunga kecil",
    });
    expect(plan.core.size).toBe(0);
    expect(plan.growth.size).toBe(0);
  });

  it("sebuah fitur tidak boleh menjadi core sekaligus growth", () => {
    for (const scenario of SCENARIOS) {
      const plan = buildProblemSolutionPlan({
        businessText: scenario.businessText,
        problemText: scenario.problemText,
        goalText: scenario.goalText,
        context: scenario.context,
      });
      for (const id of plan.core.keys()) expect(plan.growth.has(id)).toBe(false);
    }
  });
});

describe("Enterprise hard filter", () => {
  const brief = (over: Partial<OrderBriefData>): OrderBriefData => ({
    version: 1,
    customerName: "Test",
    whatsapp: null,
    email: null,
    business: "Toko retail",
    project: "Website sistem",
    goal: "Merapikan operasional",
    problems: ["Order dicatat manual"],
    usersScale: "owner dan 10 karyawan",
    adminNeeds: "Ya",
    features: [],
    timeline: null,
    budget: null,
    recommendation: null,
    createdAt: new Date().toISOString(),
    ...over,
  });

  it("dashboard/database/laporan/karyawan/automation saja tidak menghasilkan Enterprise", () => {
    const decision = decidePackageLevel(
      brief({
        features: ["Dashboard admin", "Database customer", "Laporan penjualan", "Automation reminder"],
      }),
    );
    expect(decision.level).not.toBe("enterprise");
    expect(decision.allowEnterprise).toBe(false);
  });

  it("bisnis satu lokasi tidak pernah Enterprise", () => {
    const decision = decidePackageLevel(
      brief({ business: "Laundry kiloan 1 outlet", usersScale: "owner dan 4 karyawan" }),
    );
    expect(decision.level).not.toBe("enterprise");
  });
});
