-- Migration: Esteira de Locação e Assinaturas Digitais
--
-- Adiciona suporte a minuta digital, provedor de assinatura eletrônica (ZapSign, D4Sign, Clicksign)
-- e controle de status de assinatura por signatário na tabela leases.

ALTER TABLE public.leases 
  ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'rascunho' 
    CHECK (signature_status IN ('rascunho', 'aguardando_assinaturas', 'assinado', 'recusado', 'cancelado')),
  ADD COLUMN IF NOT EXISTS signature_provider TEXT DEFAULT 'zapsign',
  ADD COLUMN IF NOT EXISTS external_document_id TEXT,
  ADD COLUMN IF NOT EXISTS contract_document_url TEXT,
  ADD COLUMN IF NOT EXISTS signers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leases_signature_status ON public.leases(org_id, signature_status);
