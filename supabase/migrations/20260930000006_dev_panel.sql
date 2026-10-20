-- Migration: painel do DEV — logs de erro, chamados e auditoria
--
-- Depende da 00004 (org_id NOT NULL), que fica atrás do backfill manual.
--
-- Isolamento aqui é simples: a conta DEV não pertence a nenhuma org, e é lida
-- por is_dev(). Os chamados, ao contrário, pertencem a uma org — e são lidos
-- pela equipe interna da própria org e pelo DEV.

-- ============================================================
-- LOGS DE ERRO
-- ============================================================

-- Erro de tela (React, fetch, exceção) não tem onde ser registrado hoje. O
-- ErrorBoundary no front-end e as edge functions escrevem aqui; só o DEV lê.
CREATE TABLE IF NOT EXISTS public.app_error_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source     TEXT NOT NULL,
  message    TEXT NOT NULL,
  stack      TEXT,
  context    JSONB,
  severity   TEXT NOT NULL DEFAULT 'error'
             CHECK (severity IN ('error', 'warning', 'info')),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_error_logs_created ON app_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_error_logs_org     ON app_error_logs(org_id);

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode reportar um erro, inclusive visitante da vitrine pública —
-- é justamente no acesso anônimo que um erro costuma passar despercebido. O
-- que se escreve é mensagem, origem e contexto do próprio navegador, nada que
-- o autor não tenha em mãos. A leitura é exclusiva do DEV.
DROP POLICY IF EXISTS "Anyone can report errors" ON app_error_logs;
CREATE POLICY "Anyone can report errors" ON app_error_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev can read errors" ON app_error_logs;
CREATE POLICY "Dev can read errors" ON app_error_logs FOR SELECT
  USING (public.is_dev());

-- ============================================================
-- CHAMADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opened_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subject       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'aberto'
                CHECK (status IN ('aberto', 'respondido', 'fechado')),
  last_reply_at TIMESTAMPTZ,
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  body       TEXT NOT NULL,
  is_dev     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org    ON support_tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at);

-- A org do chamado vem de quem abriu, nunca do corpo da requisição — mesma
-- regra das demais tabelas. O trigger set_org_id já ignora o valor do cliente
-- e usa current_org_id(), e o DEV preserva o valor existente ao responder.
DROP TRIGGER IF EXISTS trg_set_org_id ON public.support_tickets;
CREATE TRIGGER trg_set_org_id BEFORE INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();

ALTER TABLE public.support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dev can view all tickets" ON support_tickets;
CREATE POLICY "Dev can view all tickets" ON support_tickets FOR SELECT
  USING (public.is_dev());

DROP POLICY IF EXISTS "Team can view own org tickets" ON support_tickets;
CREATE POLICY "Team can view own org tickets" ON support_tickets FOR SELECT
  USING (public.is_internal_team() AND public.in_current_org(org_id));

-- Só a equipe interna da própria imobiliária abre chamado. A policy exige que
-- o autor seja alguém real da org: sem isso, um cliente do portal poderia
-- abrir chamado em nome de outra imobiliária.
DROP POLICY IF EXISTS "Team can open own org tickets" ON support_tickets;
CREATE POLICY "Team can open own org tickets" ON support_tickets FOR INSERT
  WITH CHECK (
    public.is_internal_team()
    AND public.in_current_org(org_id)
    AND opened_by = auth.uid()
  );

DROP POLICY IF EXISTS "Team and dev can update tickets" ON support_tickets;
CREATE POLICY "Team and dev can update tickets" ON support_tickets FOR UPDATE
  USING ((public.is_internal_team() AND public.in_current_org(org_id)) OR public.is_dev())
  WITH CHECK ((public.is_internal_team() AND public.in_current_org(org_id)) OR public.is_dev());

-- Mensagens: leitura acompanha o chamado, escrita só por quem participa dele.
DROP POLICY IF EXISTS "Dev can view all messages" ON support_messages;
CREATE POLICY "Dev can view all messages" ON support_messages FOR SELECT
  USING (public.is_dev());

DROP POLICY IF EXISTS "Team can view own org messages" ON support_messages;
CREATE POLICY "Team can view own org messages" ON support_messages FOR SELECT
  USING (EXISTS (
          SELECT 1 FROM public.support_tickets t
           WHERE t.id = support_messages.ticket_id
             AND public.is_internal_team()
             AND public.in_current_org(t.org_id)
        ));

DROP POLICY IF EXISTS "Participants can post messages" ON support_messages;
CREATE POLICY "Participants can post messages" ON support_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      public.is_dev()
      OR EXISTS (
        SELECT 1 FROM public.support_tickets t
         WHERE t.id = support_messages.ticket_id
           AND public.is_internal_team()
           AND public.in_current_org(t.org_id)
      )
    )
  );

-- ============================================================
-- AUDITORIA
-- ============================================================

-- Criar, apagar ou trocar senha de uma conta é ação sensível. Registrar quem
-- fez o quê é o que permite reconstituir o histórico depois.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Escrita pela edge function dev-admin, via service role. Leitura só do DEV.
DROP POLICY IF EXISTS "Dev can read audit log" ON admin_audit_log;
CREATE POLICY "Dev can read audit log" ON admin_audit_log FOR SELECT
  USING (public.is_dev());

-- ============================================================
-- ESTATÍSTICAS PARA O PAINEL
-- ============================================================

-- SECURITY DEFINER porque precisa atravessar a RLS para contar linhas de
-- todas as orgs. Expõe só contagens, nunca conteúdo.
CREATE OR REPLACE FUNCTION public.dev_org_stats()
RETURNS TABLE (
  org_id     UUID,
  org_name   TEXT,
  org_slug   TEXT,
  active     BOOLEAN,
  created_at TIMESTAMPTZ,
  profiles   BIGINT,
  properties BIGINT,
  leases     BIGINT,
  sales      BIGINT,
  tickets    BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- SECURITY DEFINER atravessa a RLS para contar linhas de todas as orgs, o
  -- que significa que a checagem do papel precisa acontecer aqui dentro:
  -- uma function definer sem este WHERE entregaria a contagem de todos os
  -- clientes do sistema para qualquer usuário autenticado.
  SELECT o.id,
         o.name,
         o.slug,
         o.active,
         o.created_at,
         (SELECT count(*) FROM public.profiles p WHERE p.org_id = o.id),
         (SELECT count(*) FROM public.properties pr WHERE pr.org_id = o.id),
         (SELECT count(*) FROM public.leases l WHERE l.org_id = o.id),
         (SELECT count(*) FROM public.sales s WHERE s.org_id = o.id),
         (SELECT count(*) FROM public.support_tickets t WHERE t.org_id = o.id)
    FROM public.organizations o
   WHERE public.is_dev();
$$;

REVOKE ALL ON FUNCTION public.dev_org_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dev_org_stats() TO authenticated;

-- A tabela organizations só é legível pela própria org (ou pela DEV, via
-- policy). Como as telas do DEV precisam ler as imobiliárias sem depender
-- dessa policy nem do GRANT da tabela, esta RPC é o caminho único.
--
-- Filtra por is_dev() DENTRO da função: SECURITY DEFINER atravessa a RLS, e
-- sem esse WHERE qualquer usuário autenticado leria a lista inteira.
CREATE OR REPLACE FUNCTION public.dev_org_names()
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  slug        TEXT,
  active      BOOLEAN,
  cnpj        TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  email       TEXT,
  logo_url    TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.slug, o.active, o.cnpj, o.phone, o.whatsapp,
         o.email, o.logo_url, o.address, o.created_at, o.updated_at
    FROM public.organizations o
   WHERE public.is_dev()
   ORDER BY o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.dev_org_names() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dev_org_names() TO authenticated;
