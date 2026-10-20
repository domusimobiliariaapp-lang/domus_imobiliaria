-- ============================================================
-- SCRIPT DE AUDITORIA RLS - DOMUS MULTI-TENANT
-- ============================================================
--
-- Este script verifica:
-- 1. Todas as políticas UPDATE/INSERT têm WITH CHECK
-- 2. Isolamento por org_id está correto
-- 3. Funções helper estão sendo usadas corretamente
-- 4. Potenciais vulnerabilidades de cross-tenant
--
-- Executar com: psql -h <host> -U <user> -d <database> -f audit-rls.sql
-- ============================================================

\set QUIET on
\pset pager off
\pset tuples_only on
\pset format unaligned

-- ============================================================
-- 1. VERIFICAÇÃO DE POLÍTICAS SEM WITH CHECK
-- ============================================================

\echo '=== 1. POLÍTICAS UPDATE/INSERT SEM WITH CHECK ==='

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN has_row_security = false THEN 'TABELA SEM RLS'
    WHEN permissive = 'R' THEN 'RESTRITIVA'
    ELSE 'PERMISSIVA'
  END as tipo_politica,
  CASE
    WHEN cmd IN ('UPDATE', 'INSERT', 'ALL') AND (qual::text NOT LIKE '%WITH CHECK%' OR qual IS NULL)
    THEN 'FALTA WITH CHECK'
    ELSE 'OK'
  END as status_with_check
FROM pg_policies p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE schemaname = 'public'
  AND cmd IN ('UPDATE', 'INSERT', 'ALL')
  AND (qual::text NOT LIKE '%WITH CHECK%' OR qual IS NULL)
ORDER BY tablename, cmd;

\echo ''
\echo '=== 2. POLÍTICAS QUE USAM auth.jwt()->>''role'' (VULNERÁVEL) ==='

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  'USA auth.jwt()->>''role''' as problema
FROM pg_policies p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE schemaname = 'public'
  AND (qual::text LIKE '%auth.jwt()%role%' OR with_check::text LIKE '%auth.jwt()%role%')
ORDER BY tablename;

\echo ''
\echo '=== 3. VERIFICAÇÃO DE FUNÇÕES HELPER ==='

SELECT
  proname as funcao,
  CASE
    WHEN proname IN ('get_current_user_role', 'current_org_id', 'is_dev', 'is_internal_team', 'is_client', 'in_current_org')
    THEN 'OK'
    ELSE 'FUNÇÃO NÃO RECONHECIDA'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('get_current_user_role', 'current_org_id', 'is_dev', 'is_internal_team', 'is_client', 'in_current_org')
ORDER BY proname;

\echo ''
\echo '=== 4. TABELAS SEM COLUNA org_id (POTENCIAL PROBLEMA) ==='

SELECT
  n.nspname as schemaname,
  c.relname as tablename
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'org_id'
WHERE n.nspname = 'public'
  AND c.relkind = 'r'  -- tabelas regulares
  AND a.attname IS NULL  -- sem coluna org_id
  AND c.relname NOT IN (
    -- Tabelas que não precisam de org_id por design
    'organizations',      -- tabela mãe
    'profiles',          -- org_id vem do próprio perfil
    'auth.users',        -- tabela do Supabase Auth
    'storage.objects',   -- storage usa prefixo
    'app_error_logs',    -- logs do sistema
    'support_tickets',   -- tickets de suporte (global)
    'support_messages',  -- mensagens de suporte (global)
    'admin_audit_log'    -- auditoria global
  )
ORDER BY c.relname;

\echo ''
\echo '=== 5. TRIGGERS set_org_id POR TABELA ==='

SELECT
  n.nspname as schemaname,
  c.relname as tablename,
  t.tgname as trigger_name,
  CASE
    WHEN t.tgname LIKE '%set_org_id%' THEN 'OK'
    ELSE 'TRIGGER INESPERADO'
  END as status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND (t.tgname LIKE '%set_org_id%' OR t.tgname LIKE '%notification%')
ORDER BY c.relname, t.tgname;

\echo ''
\echo '=== 6. POLÍTICAS QUE PERMITEM CROSS-TENANT (SEM in_current_org) ==='

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  'FALTA in_current_org()' as problema
FROM pg_policies p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE schemaname = 'public'
  AND cmd IN ('SELECT', 'UPDATE', 'INSERT', 'DELETE', 'ALL')
  AND tablename NOT IN ('organizations', 'profiles')
  AND (
    (qual::text NOT LIKE '%in_current_org%' AND qual::text NOT LIKE '%current_org_id%')
    OR
    (with_check::text NOT LIKE '%in_current_org%' AND with_check::text NOT LIKE '%current_org_id%')
  )
  AND (qual::text NOT LIKE '%is_dev%' OR qual IS NULL)
ORDER BY tablename, cmd;

\echo ''
\echo '=== 7. VERIFICAÇÃO DE ÍNDICES PARA PERFORMANCE ==='

SELECT
  n.nspname as schemaname,
  c.relname as tablename,
  a.attname as coluna,
  CASE
    WHEN a.attname = 'org_id' THEN 'OK - COLUNA PRESENTE'
    ELSE 'SEM ÍNDICE EM org_id'
  END as status_indice
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'org_id'
LEFT JOIN pg_index i ON i.indrelid = c.oid
  AND a.attnum = ANY(i.indkey)
  AND i.indisunique = false  -- não considera índices únicos
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attname IS NOT NULL
  AND i.oid IS NULL  -- sem índice
  AND c.relname NOT IN ('organizations', 'profiles')
ORDER BY c.relname;

\echo ''
\echo '=== 8. FUNÇÕES SECURITY DEFINER SEM search_path ==='

SELECT
  proname as funcao,
  CASE
    WHEN prosecdef = true AND prosrc NOT LIKE '%SET search_path%'
    THEN 'FALTA SET search_path'
    ELSE 'OK'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND prosecdef = true  -- SECURITY DEFINER
ORDER BY proname;

\echo ''
\echo '=== 9. RESUMO DA AUDITORIA ==='

SELECT
  'Políticas sem WITH CHECK' as categoria,
  COUNT(*) as quantidade
FROM pg_policies p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE schemaname = 'public'
  AND cmd IN ('UPDATE', 'INSERT', 'ALL')
  AND (qual::text NOT LIKE '%WITH CHECK%' OR qual IS NULL)

UNION ALL

SELECT
  'Tabelas sem coluna org_id',
  COUNT(DISTINCT c.relname)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'org_id'
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attname IS NULL
  AND c.relname NOT IN ('organizations', 'profiles', 'auth.users', 'storage.objects',
                       'app_error_logs', 'support_tickets', 'support_messages', 'admin_audit_log')

UNION ALL

SELECT
  'Políticas vulneráveis (auth.jwt->>role)',
  COUNT(*)
FROM pg_policies p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE schemaname = 'public'
  AND (qual::text LIKE '%auth.jwt()%role%' OR with_check::text LIKE '%auth.jwt()%role%')

UNION ALL

SELECT
  'Tabelas sem índice em org_id',
  COUNT(DISTINCT c.relname)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'org_id'
LEFT JOIN pg_index i ON i.indrelid = c.oid
  AND a.attnum = ANY(i.indkey)
  AND i.indisunique = false
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attname IS NOT NULL
  AND i.oid IS NULL
  AND c.relname NOT IN ('organizations', 'profiles');

\echo ''
\echo '=== INSTRUÇÕES ==='
\echo '1. Corrigir políticas sem WITH CHECK primeiro'
\echo '2. Remover uso de auth.jwt()->>''role'' onde existir'
\echo '3. Adicionar índices em org_id para tabelas grandes'
\echo '4. Verificar funções SECURITY DEFINER sem search_path'
\echo ''
\echo 'Auditoria concluída em: ' || CURRENT_TIMESTAMP;