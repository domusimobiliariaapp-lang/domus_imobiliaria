-- Dados comerciais e técnicos usados no cadastro e na página pública dos imóveis.
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'cobertura';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'studio';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'sobrado';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'chacara';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'sitio';

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'aluguel' CHECK (purpose IN ('aluguel', 'venda', 'temporada', 'ambos')),
  ADD COLUMN IF NOT EXISTS reference_code TEXT,
  ADD COLUMN IF NOT EXISTS area_util NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS suites INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS reference_point TEXT,
  ADD COLUMN IF NOT EXISTS proximity_details TEXT,
  ADD COLUMN IF NOT EXISTS parking_covered BOOLEAN,
  ADD COLUMN IF NOT EXISTS parking_type TEXT CHECK (parking_type IS NULL OR parking_type IN ('demarcada', 'livre', 'nao_informada')),
  ADD COLUMN IF NOT EXISTS floor_number INTEGER,
  ADD COLUMN IF NOT EXISTS floor_position TEXT CHECK (floor_position IS NULL OR floor_position IN ('frente', 'fundos', 'lateral')),
  ADD COLUMN IF NOT EXISTS solar_orientation TEXT CHECK (solar_orientation IS NULL OR solar_orientation IN ('nascente', 'poente', 'norte', 'sul', 'leste', 'oeste')),
  ADD COLUMN IF NOT EXISTS furnished_status TEXT NOT NULL DEFAULT 'vazio' CHECK (furnished_status IN ('vazio', 'semimobiliado', 'mobiliado')),
  ADD COLUMN IF NOT EXISTS construction_year INTEGER,
  ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IS NULL OR condition IN ('novo', 'reformado', 'usado')),
  ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pet_allowed BOOLEAN,
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepts_guarantor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_insurance BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_deposit BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_financing BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_exchange BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepts_fgts BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deed_registered BOOLEAN,
  ADD COLUMN IF NOT EXISTS iptu_paid BOOLEAN,
  ADD COLUMN IF NOT EXISTS occupancy_permit BOOLEAN,
  ADD COLUMN IF NOT EXISTS floor_plan_url TEXT,
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_reference_code ON properties(reference_code) WHERE reference_code IS NOT NULL;
