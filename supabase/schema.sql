-- ================================================================
-- DATABASE SCHEMA — SPK PARIWISATA BALIKPAPAN
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLUSTERS
CREATE TABLE IF NOT EXISTS clusters (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT,           -- warna hex untuk peta & chart
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. ALTERNATIVES
CREATE TABLE IF NOT EXISTS alternatives (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,     -- A1, A2, ... A40
  name          TEXT NOT NULL,
  cluster_id    UUID REFERENCES clusters(id) ON DELETE SET NULL,
  description   TEXT,
  address       TEXT,
  latitude      DECIMAL(10, 8),
  longitude     DECIMAL(11, 8),
  image_url     TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. CRITERIA
CREATE TABLE IF NOT EXISTS criteria (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,       -- K1, K2, K3, K4, K5, K6, K7
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('benefit', 'cost')),
  description TEXT,
  weight      DECIMAL(10, 6) DEFAULT 0,   -- bobot hasil AHP (diisi otomatis)
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. SUB_CRITERIA
CREATE TABLE IF NOT EXISTS sub_criteria (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  criteria_id  UUID REFERENCES criteria(id) ON DELETE CASCADE,
  score_value  DECIMAL(4,2) NOT NULL,  -- 1.00, 2.00, 3.00, 4.00
  label        TEXT NOT NULL,          -- Tidak Baik / Kurang Baik / Baik / Sangat Baik
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 5. SCORES
CREATE TABLE IF NOT EXISTS scores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alternative_id  UUID REFERENCES alternatives(id) ON DELETE CASCADE,
  criteria_id     UUID REFERENCES criteria(id) ON DELETE CASCADE,
  score_value     DECIMAL(4,2) NOT NULL,   -- nilai 1.00 - 4.00
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alternative_id, criteria_id)
);

-- 6. AHP_MATRICES
CREATE TABLE IF NOT EXISTS ahp_matrices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name    TEXT NOT NULL DEFAULT 'Default',
  criteria_i_id   UUID REFERENCES criteria(id) ON DELETE CASCADE,
  criteria_j_id   UUID REFERENCES criteria(id) ON DELETE CASCADE,
  value           DECIMAL(10, 6) NOT NULL,  -- nilai perbandingan (1/9 s/d 9)
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_name, criteria_i_id, criteria_j_id)
);

-- 7. AHP_RESULTS
CREATE TABLE IF NOT EXISTS ahp_results (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name    TEXT NOT NULL DEFAULT 'Default',
  criteria_id     UUID REFERENCES criteria(id) ON DELETE CASCADE,
  weight          DECIMAL(10, 8) NOT NULL,  -- bobot prioritas
  lambda_max      DECIMAL(10, 8),
  ci              DECIMAL(10, 8),           -- Consistency Index
  cr              DECIMAL(10, 8),           -- Consistency Ratio
  is_consistent   BOOLEAN,                  -- CR < 0.1
  calculated_at   TIMESTAMPTZ DEFAULT now()
);

-- 8. TOPSIS_RESULTS
CREATE TABLE IF NOT EXISTS topsis_results (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name          TEXT NOT NULL DEFAULT 'Default',
  alternative_id        UUID REFERENCES alternatives(id) ON DELETE CASCADE,
  d_positive            DECIMAL(15, 10),   -- jarak ke solusi ideal positif
  d_negative            DECIMAL(15, 10),   -- jarak ke solusi ideal negatif
  preference_score      DECIMAL(10, 8),    -- nilai preferensi Ci (0-1)
  rank                  INTEGER,
  calculated_at         TIMESTAMPTZ DEFAULT now()
);

-- 9. TOPSIS_NORMALIZED
CREATE TABLE IF NOT EXISTS topsis_normalized (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name    TEXT NOT NULL DEFAULT 'Default',
  alternative_id  UUID REFERENCES alternatives(id) ON DELETE CASCADE,
  criteria_id     UUID REFERENCES criteria(id) ON DELETE CASCADE,
  r_value         DECIMAL(15, 10),   -- nilai normalisasi
  v_value         DECIMAL(15, 10),   -- nilai terbobot
  calculated_at   TIMESTAMPTZ DEFAULT now()
);

-- 10. REFERENCES_DOCS
CREATE TABLE IF NOT EXISTS references_docs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category      TEXT NOT NULL,  -- 'Peraturan Daerah' | 'Undang-Undang' | 'Jurnal Ilmiah' | 'Buku' | 'Lainnya'
  title         TEXT NOT NULL,
  number        TEXT,           -- nomor perda/UU jika ada
  year          INTEGER,
  publisher     TEXT,
  description   TEXT,
  url           TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 11. APP_SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key     TEXT UNIQUE NOT NULL,
  value   TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ahp_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ahp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE topsis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE topsis_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE references_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all public read/write since there is no authentication
CREATE POLICY "Allow all public clusters" ON clusters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public alternatives" ON alternatives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public criteria" ON criteria FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public sub_criteria" ON sub_criteria FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public ahp_matrices" ON ahp_matrices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public ahp_results" ON ahp_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public topsis_results" ON topsis_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public topsis_normalized" ON topsis_normalized FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public references_docs" ON references_docs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
