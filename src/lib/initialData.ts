// ================================================================
// INITIAL SEED DATA FOR MOCK LOCAL DATABASE FALLBACK
// ================================================================

import { Cluster, Criteria, SubCriteria, Alternative, Score, ReferenceDoc, AppSetting, AhpMatrix } from "@/types";

export const INITIAL_CLUSTERS: Cluster[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Wisata Bahari, Pesisir & Pantai",
    description: "Destinasi wisata yang berhubungan dengan pantai, laut, dan aktivitas pesisir di Kota Balikpapan.",
    color: "#0ea5e9",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Wisata Alam, Konservasi & Edukasi",
    description: "Destinasi wisata hutan, waduk, kebun raya, dan pusat konservasi keanekaragaman hayati.",
    color: "#22c55e",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Wisata Sejarah, Budaya & Heritage",
    description: "Kawasan cagar budaya, kampung sejarah, sumur minyak tua, dan museum kebudayaan.",
    color: "#f59e0b",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Wisata Kreatif, Kuliner & Belanja",
    description: "Pusat perbelanjaan kerajinan khas, pasar tradisional, batik, dan sentra kuliner Balikpapan.",
    color: "#a855f7",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Wisata MICE & Bisnis",
    description: "Gedung pertemuan besar, taman hiburan indoor, pelabuhan penyeberangan, bandara, dan kawasan ekonomi.",
    color: "#ef4444",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_CRITERIA: Criteria[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    code: "K1",
    name: "Aksesibilitas",
    type: "benefit",
    description: "Kemudahan akses, kondisi jalan, transportasi umum, dan rambu penunjuk arah menuju lokasi.",
    weight: 0.1614, // Calculated from initial AHP matrix
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    code: "K2",
    name: "Amenitas",
    type: "benefit",
    description: "Ketersediaan fasilitas penunjang seperti toilet, tempat ibadah, tempat parkir, warung makan, dan penginapan.",
    weight: 0.0934,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    code: "K3",
    name: "Atraksi",
    type: "benefit",
    description: "Keunikan objek wisata, daya tarik utama, keindahan alam, kegiatan rekreasi, dan pagelaran seni.",
    weight: 0.3541,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    code: "K4",
    name: "Kelembagaan",
    type: "benefit",
    description: "Adanya pengelola resmi, keterlibatan pokdarwis, pemandu wisata, serta dukungan regulasi.",
    weight: 0.0683,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a5555555-5555-5555-5555-555555555555",
    code: "K5",
    name: "Dampak Ekonomi",
    type: "benefit",
    description: "Kontribusi terhadap pendapatan asli daerah (PAD), peluang usaha UMKM, dan penyerapan tenaga kerja.",
    weight: 0.2248,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a6666666-6666-6666-6666-666666666666",
    code: "K6",
    name: "Kelestarian Lingk.",
    type: "benefit",
    description: "Upaya pelestarian alam, kebersihan lingkungan, pengelolaan sampah, dan kelestarian ekosistem.",
    weight: 0.0632,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a7777777-7777-7777-7777-777777777777",
    code: "K7",
    name: "Relevansi IKN",
    type: "benefit",
    description: "Keterkaitan dan kesiapan destinasi dalam menyangga serta melayani kebutuhan pariwisata Ibu Kota Nusantara.",
    weight: 0.0348,
    sort_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_SUB_CRITERIA: SubCriteria[] = [
  // K1
  { id: "s1", criteria_id: "a1111111-1111-1111-1111-111111111111", score_value: 1, label: "Tidak Baik", description: "Akses jalan rusak parah, tidak ada transportasi umum, rambu sangat minim." },
  { id: "s2", criteria_id: "a1111111-1111-1111-1111-111111111111", score_value: 2, label: "Kurang Baik", description: "Akses jalan sedang/sebagian rusak, transportasi umum jarang, rambu terbatas." },
  { id: "s3", criteria_id: "a1111111-1111-1111-1111-111111111111", score_value: 3, label: "Baik", description: "Akses jalan aspal baik, ada pilihan transportasi online/umum, rambu cukup lengkap." },
  { id: "s4", criteria_id: "a1111111-1111-1111-1111-111111111111", score_value: 4, label: "Sangat Baik", description: "Akses jalan sangat mulus/utama, dekat pintu tol/bandara, transportasi lengkap, rambu sangat jelas." },
  // K2
  { id: "s5", criteria_id: "a2222222-2222-2222-2222-222222222222", score_value: 1, label: "Tidak Baik", description: "Tidak memiliki toilet layak, tidak ada tempat ibadah atau tempat parkir." },
  { id: "s6", criteria_id: "a2222222-2222-2222-2222-222222222222", score_value: 2, label: "Kurang Baik", description: "Toilet seadanya, lahan parkir sempit, mushola darurat/jauh." },
  { id: "s7", criteria_id: "a2222222-2222-2222-2222-222222222222", score_value: 3, label: "Baik", description: "Toilet bersih, mushola memadai, lahan parkir luas, ada warung makan/kios cinderamata." },
  { id: "s8", criteria_id: "a2222222-2222-2222-2222-222222222222", score_value: 4, label: "Sangat Baik", description: "Fasilitas sangat lengkap, toilet standar hotel, pusat kuliner modern, area parkir bus, penginapan terintegrasi." },
  // K3
  { id: "s9", criteria_id: "a3333333-3333-3333-3333-333333333333", score_value: 1, label: "Tidak Baik", description: "Daya tarik biasa saja, tidak ada keunikan khusus dibandingkan lokasi lain." },
  { id: "s10", criteria_id: "a3333333-3333-3333-3333-333333333333", score_value: 2, label: "Kurang Baik", description: "Memiliki potensi keindahan namun kurang terawat, atraksi penunjang minim." },
  { id: "s11", criteria_id: "a3333333-3333-3333-3333-333333333333", score_value: 3, label: "Baik", description: "Pemandangan indah/unik, ada spot foto, aktivitas rekreasi beragam, terpelihara dengan baik." },
  { id: "s12", criteria_id: "a3333333-3333-3333-3333-333333333333", score_value: 4, label: "Sangat Baik", description: "Daya tarik kelas dunia/nasional, warisan budaya langka, keindahan alam spektakuler, event rutin skala besar." },
  // K4
  { id: "s13", criteria_id: "a4444444-4444-4444-4444-444444444444", score_value: 1, label: "Tidak Baik", description: "Tidak ada pengelola formal, dikelola seadanya oleh warga tanpa aturan." },
  { id: "s14", criteria_id: "a4444444-4444-4444-4444-444444444444", score_value: 2, label: "Kurang Baik", description: "Dikelola oleh perorangan, belum berbadan hukum/tidak ada pokdarwis." },
  { id: "s15", criteria_id: "a4444444-4444-4444-4444-444444444444", score_value: 3, label: "Baik", description: "Dikelola oleh Pokdarwis aktif atau UPTD Dinas, memiliki SOP pelayanan dasar." },
  { id: "s16", criteria_id: "a4444444-4444-4444-4444-444444444444", score_value: 4, label: "Sangat Baik", description: "Dikelola BUMN/BUMD/Swasta Profesional dengan regulasi perda khusus, pemandu bersertifikat, promosi digital." },
  // K5
  { id: "s17", criteria_id: "a5555555-5555-5555-5555-555555555555", score_value: 1, label: "Tidak Baik", description: "Tidak ada transaksi ekonomi, tidak berdampak pada kesejahteraan warga." },
  { id: "s18", criteria_id: "a5555555-5555-5555-5555-555555555555", score_value: 2, label: "Kurang Baik", description: "Dampak ekonomi kecil, hanya segelintir pedagang musiman." },
  { id: "s19", criteria_id: "a5555555-5555-5555-5555-555555555555", score_value: 3, label: "Baik", description: "Menyerap tenaga kerja lokal, membuka peluang UMKM (oleh-oleh/makanan) menetap." },
  { id: "s20", criteria_id: "a5555555-5555-5555-5555-555555555555", score_value: 4, label: "Sangat Baik", description: "Penyumbang PAD besar, investasi pihak ketiga tinggi, sentra ekonomi baru bagi wilayah sekitar." },
  // K6
  { id: "s21", criteria_id: "a6666666-6666-6666-6666-666666666666", score_value: 1, label: "Tidak Baik", description: "Lingkungan kotor, penumpukan sampah liar, rawan erosi/kerusakan ekosistem." },
  { id: "s22", criteria_id: "a6666666-6666-6666-6666-666666666666", score_value: 2, label: "Kurang Baik", description: "Ada tempat sampah terbatas, kebersihan kurang terjaga pada hari libur." },
  { id: "s23", criteria_id: "a6666666-6666-6666-6666-666666666666", score_value: 3, label: "Baik", description: "Kebersihan terjaga baik, terdapat pengelolaan pemilahan sampah, sosialisasi lingkungan." },
  { id: "s24", criteria_id: "a6666666-6666-6666-6666-666666666666", score_value: 4, label: "Sangat Baik", description: "Memiliki sertifikat eco-tourism/green destination, konservasi aktif, nol sampah plastik/pengolahan modern." },
  // K7
  { id: "s25", criteria_id: "a7777777-7777-7777-7777-777777777777", score_value: 1, label: "Tidak Baik", description: "Sangat jauh dari IKN, tidak memiliki relevansi strategis sebagai penyangga pariwisata." },
  { id: "s26", criteria_id: "a7777777-7777-7777-7777-777777777777", score_value: 2, label: "Kurang Baik", description: "Relevansi rendah, hanya dikunjungi sesekali oleh tamu IKN karena keterbatasan fasilitas." },
  { id: "s27", criteria_id: "a7777777-7777-7777-7777-777777777777", score_value: 3, label: "Baik", description: "Sangat potensial menjadi destinasi akhir pekan (weekend gateway) bagi ASN/pekerja di IKN." },
  { id: "s28", criteria_id: "a7777777-7777-7777-7777-777777777777", score_value: 4, label: "Sangat Baik", description: "Ditetapkan secara nasional/daerah sebagai hub wisata penyangga IKN utama, akses langsung jalan tol IKN." },
];

export const INITIAL_ALTERNATIVES: Omit<Alternative, "cluster" | "scores">[] = [
  // Cluster 1
  { id: "b1", code: "A1", name: "Pantai Manggar Segarasari", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai wisata paling populer di Balikpapan dengan hamparan pasir putih luas.", address: "Kelurahan Teritip, Kecamatan Balikpapan Timur", latitude: -1.2745, longitude: 116.9231, image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b2", code: "A2", name: "Pantai Lamaru", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai yang teduh dengan barisan pohon cemara yang rindang.", address: "Kelurahan Lamaru, Kecamatan Balikpapan Timur", latitude: -1.2890, longitude: 116.9401, image_url: "https://images.unsplash.com/photo-1545579133-99bb5ab189bd?w=500", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b3", code: "A3", name: "Pantai Kemala", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai strategis di pusat kota dengan fasilitas kuliner pinggir pantai.", address: "Jalan Jenderal Sudirman, Balikpapan Kota", latitude: -1.2634, longitude: 116.8832, image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=500", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b4", code: "A4", name: "Pantai Nelayan", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai dengan aktivitas nelayan tradisional dan pemandangan perahu layar.", address: "Kelurahan Manggar Baru, Balikpapan Timur", latitude: -1.2701, longitude: 116.8954, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b5", code: "A5", name: "Pantai Monpera", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai bersejarah yang terletak dekat Monumen Perjuangan Rakyat.", address: "Jalan Jenderal Sudirman, Balikpapan Kota", latitude: -1.2590, longitude: 116.8756, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b6", code: "A6", name: "Pasar Sore Manggar", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Sentra perdagangan hasil laut segar langsung dari nelayan.", address: "Kelurahan Manggar, Balikpapan Timur", latitude: -1.2712, longitude: 116.9187, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b7", code: "A7", name: "Pasar Pringgodani", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pasar berkonsep tradisional Jawa di pinggir pantai dengan kuliner lokal.", address: "Kelurahan Teritip, Balikpapan Timur", latitude: -1.2801, longitude: 116.9042, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b8", code: "A8", name: "Pantai BSB", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Area rekreasi pantai modern berkonsep outdoor mall dengan pertunjukan seni.", address: "Kawasan Balikpapan Superblock, Balikpapan Kota", latitude: -1.2453, longitude: 116.8923, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b9", code: "A9", name: "Pantai Seraya", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai berpasir kecokelatan yang menawarkan suasana tenang dan alami.", address: "Kelurahan Teritip, Balikpapan Timur", latitude: -1.2987, longitude: 116.9512, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b10", code: "A10", name: "Pantai Melawai", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Tempat berkumpul sore hari terpopuler untuk menikmati pemandangan matahari terbenam.", address: "Jalan Gajah Mada, Balikpapan Kota", latitude: -1.2543, longitude: 116.8634, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b11", code: "A11", name: "Pantai Ambalat", cluster_id: "11111111-1111-1111-1111-111111111111", description: "Pantai tenang di ujung Balikpapan Timur berbatasan dengan Samboja.", address: "Kelurahan Amborawang, Balikpapan Timur", latitude: -1.3012, longitude: 116.9623, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cluster 2
  { id: "b12", code: "A12", name: "Kws Wisata Pendidikan Lingk. Hidup Beruang Madu", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Pusat konservasi maskot Kota Balikpapan, Beruang Madu, di habitat alami.", address: "Jalan Soekarno Hatta KM 23, Balikpapan Utara", latitude: -1.2123, longitude: 116.8234, image_url: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=500", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b13", code: "A13", name: "Kebun Raya Balikpapan", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Pusat konservasi tumbuhan kayu Kalimantan seluas 309 hektar.", address: "Jalan Soekarno Hatta KM 15, Karang Joang", latitude: -1.2234, longitude: 116.8345, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b14", code: "A14", name: "Bukit Kebo", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Kawasan perbukitan hijau dengan pemandangan peternakan kerbau liar.", address: "Kelurahan Karang Joang, Balikpapan Utara", latitude: -1.2456, longitude: 116.8567, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b15", code: "A15", name: "Bamboe Wanades", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Kawasan wisata Hutan Bambu asri dengan danau buatan kecil.", address: "Kelurahan Karang Joang, Balikpapan Utara", latitude: -1.2678, longitude: 116.8789, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b16", code: "A16", name: "Kawasan WisataMeranti", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Hutan edukasi pelestarian pohon meranti khas Kalimantan.", address: "Kelurahan Karang Joang, Balikpapan Utara", latitude: -1.2890, longitude: 116.9012, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b17", code: "A17", name: "Mangrove Margomulyo", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Jembatan kayu sepanjang 800 meter melintasi hutan bakau lebat dengan menara pandang.", address: "Kelurahan Margomulyo, Balikpapan Barat", latitude: -1.1890, longitude: 116.8234, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b18", code: "A18", name: "Waduk Manggar", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Sumber air bersih kota yang juga menjadi tempat wisata pemancingan.", address: "Kelurahan Karang Joang, Balikpapan Utara", latitude: -1.2634, longitude: 116.9123, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b19", code: "A19", name: "Hutan Lindung Sungai Wain", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Hutan hujan tropis primer terluas di pesisir Balikpapan dengan flora fauna langka.", address: "Jalan Soekarno Hatta KM 15, Balikpapan Utara", latitude: -1.1234, longitude: 116.7890, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b20", code: "A20", name: "Mangrove Graha Indah", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Wisata susur sungai mangrove menggunakan perahu untuk melihat satwa Bekantan.", address: "Kawasan Graha Indah, Balikpapan Utara", latitude: -1.2012, longitude: 116.7901, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b21", code: "A21", name: "Teluk Balikpapan", cluster_id: "22222222-2222-2222-2222-222222222222", description: "Kawasan perairan teluk yang kaya akan keanekaragaman hayati laut dan mangrove.", address: "Kecamatan Balikpapan Barat / IKN", latitude: -1.2890, longitude: 116.8456, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cluster 3
  { id: "b22", code: "A22", name: "Kawasan Cagar Budaya Sumur Minyak Mathilda", cluster_id: "33333333-3333-3333-3333-333333333333", description: "Sumur minyak pertama di Balikpapan (1897) sebagai simbol sejarah industri minyak.", address: "Jalan Minyak, Balikpapan Kota", latitude: -1.2678, longitude: 116.8234, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b23", code: "A23", name: "Kampung Warna Warni", cluster_id: "33333333-3333-3333-3333-333333333333", description: "Kawasan permukiman padat pesisir yang dihias dengan cat warna-warni kreatif.", address: "Kelurahan Telagasari, Balikpapan Kota", latitude: -1.2789, longitude: 116.8345, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b24", code: "A24", name: "Kampung Atas Air Margasari", cluster_id: "33333333-3333-3333-3333-333333333333", description: "Kampung percontohan pemukiman panggung di atas air dengan tata lingkungan bersih.", address: "Kelurahan Margasari, Balikpapan Barat", latitude: -1.2890, longitude: 116.8456, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b25", code: "A25", name: "Kampung Wisata Tenun Kampung Baru", cluster_id: "33333333-3333-3333-3333-333333333333", description: "Pusat pembuatan kain tenun tradisional khas Kalimantan.", address: "Kelurahan Baru Tengah, Balikpapan Barat", latitude: -1.2901, longitude: 116.8567, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b26", code: "A26", name: "Museum Mulawarman Balikpapan", cluster_id: "33333333-3333-3333-3333-333333333333", description: "Galeri sejarah militer Kodam VI Mulawarman dan perjuangan rakyat.", address: "Jalan Jenderal Sudirman, Balikpapan Kota", latitude: -1.2456, longitude: 116.8123, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b27", code: "A27", name: "Monumen Perjuangan Balikpapan", cluster_id: "33333333-3333-3333-3333-333333333333", description: "Tugu peringatan perjuangan rakyat Kalimantan Timur melawan penjajah.", address: "Jalan Jenderal Sudirman, Balikpapan Kota", latitude: -1.2567, longitude: 116.8234, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cluster 4
  { id: "b28", code: "A28", name: "Pasar Klandasan", cluster_id: "44444444-4444-4444-4444-444444444444", description: "Pasar tradisional tertua di tepi laut yang terkenal dengan pusat kuliner lautnya.", address: "Jalan Jenderal Sudirman, Balikpapan Kota", latitude: -1.2678, longitude: 116.8345, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b29", code: "A29", name: "Kawasan Kuliner Kebun Sayur", cluster_id: "44444444-4444-4444-4444-444444444444", description: "Pusat belanja batu permata, cinderamata suku Dayak, dan kuliner kepiting.", address: "Kelurahan Margasari, Balikpapan Barat", latitude: -1.2789, longitude: 116.8456, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b30", code: "A30", name: "Kawasan Seni Budaya RIKO", cluster_id: "44444444-4444-4444-4444-444444444444", description: "Kawasan pertunjukan seni, kerajinan kayu, dan kreasi budaya lokal.", address: "Kecamatan Penajam / Batas Balikpapan", latitude: -1.2890, longitude: 116.8567, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b31", code: "A31", name: "Pusat Oleh-Oleh Balikpapan", cluster_id: "44444444-4444-4444-4444-444444444444", description: "Sentra penjualan makanan khas mantau, abon kepiting, dan amplang.", address: "Jalan Jenderal Sudirman, Balikpapan Kota", latitude: -1.2901, longitude: 116.8678, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b32", code: "A32", name: "Food Street Rapak", cluster_id: "44444444-4444-4444-4444-444444444444", description: "Kawasan jajanan malam dengan aneka kuliner nusantara murah meriah.", address: "Jalan Soekarno Hatta, Muara Rapak", latitude: -1.2567, longitude: 116.8234, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b33", code: "A33", name: "Batik Benang Bintik", cluster_id: "44444444-4444-4444-4444-444444444444", description: "Sentra kerajinan batik khas dengan motif khas Kalimantan Timur.", address: "Kecamatan Balikpapan Tengah", latitude: -1.2678, longitude: 116.8345, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cluster 5
  { id: "b34", code: "A34", name: "Balikpapan Sport & Convention Center", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Gedung Dome Balikpapan sebagai arena konser, pameran, dan olahraga internasional.", address: "Jalan Ruhui Rahayu, Balikpapan Selatan", latitude: -1.2456, longitude: 116.8123, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b35", code: "A35", name: "Grand Senyiur Convention Hall", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Pusat pertemuan bisnis eksklusif bintang lima penyedia layanan MICE.", address: "Jalan ARS Mohammad, Balikpapan Kota", latitude: -1.2567, longitude: 116.8234, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b36", code: "A36", name: "Trans Studio Balikpapan", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Taman bermain dalam ruangan (indoor theme park) modern terbesar di Kaltim.", address: "Jalan MT Haryono, Balikpapan Selatan", latitude: -1.2678, longitude: 116.8345, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b37", code: "A37", name: "Kawasan Wisata Edukatif IKN", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Kawasan pusat edukasi perencanaan pembangunan Ibu Kota Nusantara.", address: "Kecamatan Sepaku, Penajam Paser Utara", latitude: -1.1234, longitude: 116.7123, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b38", code: "A38", name: "Pelabuhan Feri Kariangau", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Infrastruktur gerbang transportasi laut penyeberangan menuju IKN.", address: "Kawasan Industri Kariangau, Balikpapan Barat", latitude: -1.2012, longitude: 116.7234, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b39", code: "A39", name: "Bandara Internasional SAMS", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Bandara Internasional Sultan Aji Muhammad Sulaiman Sepinggan pintu masuk utama.", address: "Jalan Jenderal Sudirman, Balikpapan Selatan", latitude: -1.2678, longitude: 116.8901, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "b40", code: "A40", name: "Kawasan Ekonomi Khusus Kariangau", cluster_id: "55555555-5555-5555-5555-555555555555", description: "Zona kawasan industri strategis penyokong suplai logistik regional.", address: "Kelurahan Kariangau, Balikpapan Barat", latitude: -1.2123, longitude: 116.7345, image_url: null, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Seed Scores mapping
// A1: K1=4, K2=4, K3=4, K4=3, K5=4, K6=3, K7=4 ...
export const INITIAL_SCORES_MAP: Record<string, Record<string, number>> = {
  A1: { K1: 4, K2: 4, K3: 4, K4: 3, K5: 4, K6: 3, K7: 4 },
  A2: { K1: 3, K2: 3, K3: 4, K4: 3, K5: 3, K6: 3, K7: 3 },
  A3: { K1: 4, K2: 4, K3: 3, K4: 3, K5: 4, K6: 2, K7: 4 },
  A4: { K1: 3, K2: 4, K3: 4, K4: 4, K5: 3, K6: 4, K7: 3 },
  A5: { K1: 3, K2: 3, K3: 4, K4: 3, K5: 3, K6: 3, K7: 4 },
  A6: { K1: 3, K2: 4, K3: 3, K4: 4, K5: 2, K6: 4, K7: 3 },
  A7: { K1: 4, K2: 3, K3: 4, K4: 3, K5: 2, K6: 4, K7: 4 },
  A8: { K1: 3, K2: 4, K3: 4, K4: 4, K5: 3, K6: 3, K7: 3 },
  A9: { K1: 4, K2: 3, K3: 3, K4: 2, K5: 4, K6: 4, K7: 3 },
  A10: { K1: 4, K2: 4, K3: 3, K4: 3, K5: 3, K6: 4, K7: 4 },
  A11: { K1: 3, K2: 3, K3: 3, K4: 3, K5: 2, K6: 3, K7: 4 },
  A12: { K1: 4, K2: 4, K3: 3, K4: 2, K5: 3, K6: 4, K7: 3 },
  A13: { K1: 3, K2: 3, K3: 3, K4: 4, K5: 3, K6: 3, K7: 3 },
  A14: { K1: 4, K2: 4, K3: 2, K4: 4, K5: 3, K6: 4, K7: 4 },
  A15: { K1: 4, K2: 3, K3: 4, K4: 3, K5: 3, K6: 3, K7: 3 },
  A16: { K1: 3, K2: 3, K3: 4, K4: 4, K5: 3, K6: 3, K7: 3 },
  A17: { K1: 4, K2: 2, K3: 3, K4: 4, K5: 4, K6: 3, K7: 3 },
  A18: { K1: 3, K2: 4, K3: 4, K4: 3, K5: 3, K6: 4, K7: 3 },
  A19: { K1: 3, K2: 3, K3: 4, K4: 4, K5: 3, K6: 3, K7: 2 },
  A20: { K1: 2, K2: 4, K3: 3, K4: 3, K5: 2, K6: 4, K7: 4 },
  A21: { K1: 4, K2: 4, K3: 4, K4: 3, K5: 4, K6: 4, K7: 3 },
  A22: { K1: 4, K2: 2, K3: 3, K4: 3, K5: 2, K6: 4, K7: 2 },
  A23: { K1: 4, K2: 4, K3: 4, K4: 3, K5: 4, K6: 4, K7: 4 },
  A24: { K1: 3, K2: 3, K3: 4, K4: 3, K5: 3, K6: 3, K7: 3 },
  A25: { K1: 4, K2: 4, K3: 3, K4: 3, K5: 3, K6: 4, K7: 4 },
  A26: { K1: 3, K2: 3, K3: 3, K4: 4, K5: 3, K6: 3, K7: 3 },
  A27: { K1: 4, K2: 3, K3: 4, K4: 3, K5: 3, K6: 3, K7: 3 },
  A28: { K1: 4, K2: 4, K3: 3, K4: 3, K5: 4, K6: 2, K7: 3 },
  A29: { K1: 3, K2: 4, K3: 4, K4: 4, K5: 3, K6: 3, K7: 3 },
  A30: { K1: 3, K2: 3, K3: 4, K4: 3, K5: 3, K6: 4, K7: 3 },
  A31: { K1: 4, K2: 4, K3: 3, K4: 3, K5: 4, K6: 3, K7: 3 },
  A32: { K1: 3, K2: 4, K3: 4, K4: 3, K5: 3, K6: 3, K7: 3 },
  A33: { K1: 3, K2: 3, K3: 3, K4: 4, K5: 2, K6: 4, K7: 2 },
  A34: { K1: 4, K2: 4, K3: 4, K4: 4, K5: 4, K6: 3, K7: 4 },
  A35: { K1: 4, K2: 4, K3: 3, K4: 4, K5: 4, K6: 3, K7: 4 },
  A36: { K1: 4, K2: 4, K3: 4, K4: 3, K5: 4, K6: 3, K7: 4 },
  A37: { K1: 3, K2: 3, K3: 3, K4: 3, K5: 4, K6: 4, K7: 4 },
  A38: { K1: 4, K2: 3, K3: 2, K4: 4, K5: 3, K6: 3, K7: 4 },
  A39: { K1: 4, K2: 4, K3: 3, K4: 4, K5: 4, K6: 2, K7: 4 },
  A40: { K1: 3, K2: 3, K3: 2, K4: 3, K5: 4, K6: 3, K7: 4 },
};

export const INITIAL_REFERENCES: ReferenceDoc[] = [
  { id: "r1", category: "Peraturan Daerah", title: "Rencana Tata Ruang Wilayah (RTRW) Kota Balikpapan", number: "No. 12 Tahun 2012", year: 2012, publisher: "DPRD Kota Balikpapan", description: "Dokumen regulasi tata ruang wilayah Kota Balikpapan penyangga utama pembangunan daerah.", url: "https://balikpapan.go.id", sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "r2", category: "Peraturan Daerah", title: "Rencana Pembangunan Jangka Menengah Daerah (RPJMD) Kota Balikpapan", number: "No. 6 Tahun 2021", year: 2021, publisher: "Pemerintah Kota Balikpapan", description: "Pedoman perencanaan pembangunan jangka menengah daerah kota Balikpapan.", url: "https://balikpapan.go.id", sort_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "r3", category: "Undang-Undang", title: "Undang-Undang tentang Ibu Kota Negara (IKN)", number: "Nomor 3 Tahun 2022", year: 2022, publisher: "Sekretariat Negara RI", description: "Landasan hukum pemindahan dan pembangunan Ibu Kota Nusantara.", url: "https://setneg.go.id", sort_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "r4", category: "Undang-Undang", title: "Undang-Undang tentang Kepariwisataan", number: "Nomor 10 Tahun 2009", year: 2009, publisher: "Sekretariat Negara RI", description: "Undang-undang yang mengatur penyelenggaraan kepariwisataan di Indonesia.", url: "https://setneg.go.id", sort_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "r5", category: "Jurnal Ilmiah", title: "The Analytic Hierarchy Process", number: null, year: 1980, publisher: "McGraw-Hill, New York", description: "Buku referensi utama penemu metode AHP oleh Thomas Lorie Saaty.", url: "https://books.google.com", sort_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "r6", category: "Jurnal Ilmiah", title: "Multiple Attribute Decision Making: Methods and Applications", number: null, year: 1981, publisher: "Springer-Verlag, Berlin", description: "Buku teori pendukung metode keputusan MADM termasuk TOPSIS oleh Hwang & Yoon.", url: "https://books.google.com", sort_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const INITIAL_SETTINGS: AppSetting[] = [
  { id: "s_1", key: "active_session", value: "Default", updated_at: new Date().toISOString() },
  { id: "s_2", key: "app_title", value: "SPK Pariwisata Balikpapan", updated_at: new Date().toISOString() },
  { id: "s_3", key: "app_subtitle", value: "AHP-TOPSIS Prioritas Pengembangan Pariwisata", updated_at: new Date().toISOString() },
  { id: "s_4", key: "city", value: "Kota Balikpapan", updated_at: new Date().toISOString() },
  { id: "s_5", key: "year", value: "2026", updated_at: new Date().toISOString() },
];

export const INITIAL_AHP_MATRICES_LIST: Omit<AhpMatrix, "id" | "created_at" | "updated_at">[] = [
  // K1 vs K2 = 2
  { session_name: "Default", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a2222222-2222-2222-2222-222222222222", value: 2 },
  { session_name: "Default", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a3333333-3333-3333-3333-333333333333", value: 0.333333 },
  { session_name: "Default", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a4444444-4444-4444-4444-444444444444", value: 3 },
  { session_name: "Default", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.5 },
  { session_name: "Default", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 3 },
  { session_name: "Default", criteria_i_id: "a1111111-1111-1111-1111-111111111111", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 4 },

  // K2
  { session_name: "Default", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a3333333-3333-3333-3333-333333333333", value: 0.25 },
  { session_name: "Default", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a4444444-4444-4444-4444-444444444444", value: 2 },
  { session_name: "Default", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.333333 },
  { session_name: "Default", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 2 },
  { session_name: "Default", criteria_i_id: "a2222222-2222-2222-2222-222222222222", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 3 },

  // K3
  { session_name: "Default", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a4444444-4444-4444-4444-444444444444", value: 5 },
  { session_name: "Default", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 2 },
  { session_name: "Default", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 5 },
  { session_name: "Default", criteria_i_id: "a3333333-3333-3333-3333-333333333333", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 6 },

  // K4
  { session_name: "Default", criteria_i_id: "a4444444-4444-4444-4444-444444444444", criteria_j_id: "a5555555-5555-5555-5555-555555555555", value: 0.25 },
  { session_name: "Default", criteria_i_id: "a4444444-4444-4444-4444-444444444444", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 1 },
  { session_name: "Default", criteria_i_id: "a4444444-4444-4444-4444-444444444444", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 2 },

  // K5
  { session_name: "Default", criteria_i_id: "a5555555-5555-5555-5555-555555555555", criteria_j_id: "a6666666-6666-6666-6666-666666666666", value: 4 },
  { session_name: "Default", criteria_i_id: "a5555555-5555-5555-5555-555555555555", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 5 },

  // K6
  { session_name: "Default", criteria_i_id: "a6666666-6666-6666-6666-666666666666", criteria_j_id: "a7777777-7777-7777-7777-777777777777", value: 2 },
];
