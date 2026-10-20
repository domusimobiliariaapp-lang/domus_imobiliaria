-- Migration: privilégios de tabela que faltavam
--
-- Policy sem GRANT não concede nada. O Postgres checa o privilégio de tabela
-- ANTES de avaliar a RLS, e responde "permission denied for table X" — o que
-- faz o usuário concluir que o problema é a policy, quando na verdade a policy
-- nunca chegou a ser avaliada.
--
-- As tabelas criadas pelas migrations 01 e 06 saíram com a policy e sem o
-- GRANT. O padrão veio da migration 14, que precisou fazer o mesmo por
-- company_settings: o navegador conecta com a role authenticated e precisa de
-- privilégio explícito, além das policies.
--
-- Nada aqui amplia o que a RLS permite. A policy continua sendo a fronteira:
-- o GRANT diz que a role *pode* tocar na tabela, e a policy diz em quais linhas.

-- ============================================================
-- organizations
-- ============================================================

-- A aba Imobiliárias lista e alterna o status das imobiliárias.
GRANT SELECT ON TABLE public.organizations TO authenticated;
GRANT UPDATE ON TABLE public.organizations TO authenticated;

-- UPDATE não tem policy correspondente, então hoje é inerte: um corretor que
-- tentasse mudar algo alteraria zero linhas. O privilégio existe para o painel
-- do DEV, que é quem passa por is_dev().
--
-- INSERT e DELETE seguem sem GRANT: criar e apagar imobiliária é exclusividade
-- da edge function dev-create-organization, com service role. Com DELETE no
-- authenticated, bastaria um usuário logado apagar a base de uma cliente.

-- A vitrine pública lê por RPC SECURITY DEFINER. Dar SELECT ao anon permitiria
-- enumerar o slug de todas as imobiliárias, e as policies não protegem o anon
-- — ele só passa pelas funções.
REVOKE ALL ON TABLE public.organizations FROM anon;

-- ============================================================
-- Painel do DEV
-- ============================================================

-- As policies abaixo já restringem tudo a is_dev() ou à própria org; o GRANT
-- apenas remove o "permission denied" que impedia a policy de ser avaliada.
--
-- INSERT em app_error_logs é liberado a authenticated de propósito: o
-- ErrorBoundary e o logger de query reportam de dentro do app, e o erro
-- acontece justamente onde não há sessão — a vitrine pública, por exemplo. O
-- conteúdo é a mensagem e o contexto do próprio navegador; a LEITURA é
-- exclusiva do DEV.
GRANT SELECT, INSERT ON TABLE public.app_error_logs TO authenticated;
GRANT SELECT ON TABLE public.admin_audit_log TO authenticated;

-- Chamados: a equipe interna da própria imobiliária abre e responde; o DEV lê
-- todos para fazer o suporte. INSERT e UPDATE acompanham as policies, que já
-- exigem is_internal_team() + in_current_org(), ou is_dev().
GRANT SELECT, INSERT, UPDATE ON TABLE public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON TABLE public.support_messages TO authenticated;

-- DELETE fica sem GRANT em todas: apagar chamado e limpar log passa pela edge
-- function dev-admin, que registra na auditoria antes de remover.

-- ============================================================
-- CONFERÊNCIA
-- ============================================================

-- Estilo da migration 14: o comentário registra o porquê. A verificação real é
-- abrir as abas do painel.
--
-- Para as tabelas do painel, a role authenticated precisa de SELECT ao menos —
-- e mais que isso nas que têm escrita via RLS. Qualquer tabela que falte aqui
-- volta a aparecer como "permission denied" na tela em vez de cair na RLS.

DO $$
DECLARE
  faltando TEXT;
BEGIN
  SELECT string_agg(format('%I', t.candidate), ', ') INTO faltando
    FROM (
      SELECT unnest(ARRAY[
        'organizations', 'company_settings', 'configuracoes',
        'app_error_logs', 'support_tickets', 'support_messages', 'admin_audit_log'
      ]) AS candidate
    ) t
   WHERE to_regclass(format('public.%I', t.candidate)) IS NOT NULL
     AND NOT has_table_privilege('authenticated', format('public.%I', t.candidate), 'SELECT');

  IF faltando IS NOT NULL THEN
    RAISE WARNING 'SELECT ainda ausente para o authenticated em: %', faltando;
  ELSE
    RAISE NOTICE 'Privilégios conferidos: todas as tabelas do painel são legíveis.';
  END IF;
END $$;
