-- ============================================================
-- SCRIPTS DE ÍNDICES DE PERFORMANCE - DOMUS MULTI-TENANT
-- ============================================================
--
-- Índices recomendados para melhorar performance em ambiente multi-tenant
-- Executar em ordem de prioridade, durante horário de baixo tráfego
-- ============================================================

\set QUIET on
\pset pager off
\pset tuples_only on

-- ============================================================
-- 1. ÍNDICES CRÍTICOS (ALTA PRIORIDADE)
-- ============================================================

\echo '=== 1. ÍNDICES CRÍTICOS (ALTA PRIORIDADE) ==='

-- Índice para queries mais comuns: org_id + status
\echo 'Criando idx_properties_org_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_org_status
ON public.properties(org_id, status)
WHERE status IN ('disponivel', 'alugado', 'vendido', 'manutencao');

\echo 'Criando idx_leases_org_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leases_org_status
ON public.leases(org_id, status)
WHERE status IN ('ativo', 'encerrado', 'cancelado');

\echo 'Criando idx_payments_org_due_status...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_org_due_status
ON public.payments(org_id, due_date, status)
WHERE status IN ('pendente', 'atrasado', 'pago');

-- ============================================================
-- 2. ÍNDICES PARA JOINS FREQUENTES (MÉDIA PRIORIDADE)
-- ============================================================

\echo ''
\echo '=== 2. ÍNDICES PARA JOINS FREQUENTES ==='

-- Índices para foreign keys que são frequentemente usadas em joins
\echo 'Criando idx_leases_property_tenant...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leases_property_tenant
ON public.leases(property_id, tenant_id, org_id);

\echo 'Criando idx_payments_lease_tenant...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_lease_tenant
ON public.payments(lease_id, tenant_id, org_id);

\echo 'Criando idx_sales_property_buyer...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_property_buyer
ON public.sales(property_id, buyer_id, org_id);

-- ============================================================
-- 3. ÍNDICES PARA RELATÓRIOS E DASHBOARDS (MÉDIA PRIORIDADE)
-- ============================================================

\echo ''
\echo '=== 3. ÍNDICES PARA RELATÓRIOS ==='

-- Índices para queries de relatórios por data
\echo 'Criando idx_properties_created_org...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_created_org
ON public.properties(created_at DESC, org_id);

\echo 'Criando idx_leases_created_org...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leases_created_org
ON public.leases(created_at DESC, org_id);

\echo 'Criando idx_payments_due_created_org...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_due_created_org
ON public.payments(due_date DESC, created_at DESC, org_id);

\echo 'Criando idx_sales_created_org...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_created_org
ON public.sales(created_at DESC, org_id);

-- ============================================================
-- 4. ÍNDICES PARA BUSCA TEXTUAL (BAIXA PRIORIDADE)
-- ============================================================

\echo ''
\echo '=== 4. ÍNDICES PARA BUSCA TEXTUAL ==='

-- Índices GIN para busca em arrays e texto
\echo 'Criando idx_properties_features_gin...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_features_gin
ON public.properties USING GIN(features);

\echo 'Criando idx_properties_address_trgm...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_address_trgm
ON public.properties USING GIN(address gin_trgm_ops, neighborhood gin_trgm_ops, city gin_trgm_ops);

-- Índice para busca em profiles
\echo 'Criando idx_profiles_name_email_trgm...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_name_email_trgm
ON public.profiles USING GIN(full_name gin_trgm_ops, email gin_trgm_ops);

-- ============================================================
-- 5. ÍNDICES PARA FUNÇÕES DE AGRUPAMENTO (BAIXA PRIORIDADE)
-- ============================================================

\echo ''
\echo '=== 5. ÍNDICES PARA AGRUPAMENTO ==='

-- Índices para GROUP BY e agregações
\echo 'Criando idx_payments_monthly_agg...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_monthly_agg
ON public.payments(org_id, date_trunc('month', due_date), status);

\echo 'Criando idx_leases_monthly_agg...'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leases_monthly_agg
ON public.leases(org_id, date_trunc('month', start_date), status);

-- ============================================================
-- 6. VERIFICAÇÃO DE ÍNDICES EXISTENTES
-- ============================================================

\echo ''
\echo '=== 6. VERIFICANDO ÍNDICES EXISTENTES ==='

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'leases', 'payments', 'sales', 'profiles', 'documents')
ORDER BY tablename, indexname;

-- ============================================================
-- 7. ESTATÍSTICAS DE PERFORMANCE
-- ============================================================

\echo ''
\echo '=== 7. ESTATÍSTICAS DE TABELAS ==='

SELECT
  schemaname,
  relname as tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  round(pg_relation_size(relid) / 1024.0 / 1024.0, 2) as size_mb,
  round(pg_total_relation_size(relid) / 1024.0 / 1024.0, 2) as total_size_mb,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('properties', 'leases', 'payments', 'sales', 'profiles')
ORDER BY n_live_tup DESC;

-- ============================================================
-- 8. RECOMENDAÇÕES DE MANUTENÇÃO
-- ============================================================

\echo ''
\echo '=== 8. RECOMENDAÇÕES DE MANUTENÇÃO ==='

\echo '1. ANALYZE após criar índices:'
SELECT 'ANALYZE ' || schemaname || '.' || tablename || ';' as analyze_cmd
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days')
  AND n_live_tup > 1000;

\echo ''
\echo '2. VACUUM para tabelas com muitos dead rows:'
SELECT
  'VACUUM ANALYZE ' || schemaname || '.' || relname || ';' as vacuum_cmd,
  n_dead_tup,
  round(n_dead_tup::float / NULLIF(n_live_tup, 0) * 100, 2) as dead_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
  AND n_dead_tup::float / NULLIF(n_live_tup, 0) > 0.1
ORDER BY n_dead_tup DESC;

\echo ''
\echo '3. Índices duplicados ou ineficientes (verificar manualmente):'
SELECT
  schemaname,
  tablename,
  array_agg(indexname) as possible_duplicates,
  count(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'leases', 'payments', 'sales')
GROUP BY schemaname, tablename, indexdef
HAVING count(*) > 1;

-- ============================================================
-- 9. SCRIPT DE MONITORAMENTO CONTÍNUO
-- ============================================================

\echo ''
\echo '=== 9. QUERIES LENTAS (últimas 24h) ==='

SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows,
  shared_blks_hit,
  shared_blks_read
FROM pg_stat_statements
WHERE query LIKE '%properties%'
   OR query LIKE '%leases%'
   OR query LIKE '%payments%'
   OR query LIKE '%sales%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================================
-- 10. RESUMO DA EXECUÇÃO
-- ============================================================

\echo ''
\echo '=== 10. RESUMO ==='

SELECT
  'Índices criados com sucesso' as status,
  COUNT(*) as quantidade
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND (indexname LIKE '%org%' OR indexname LIKE '%status%')

UNION ALL

SELECT
  'Tabelas sem índice em org_id',
  COUNT(DISTINCT c.relname)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'org_id'
LEFT JOIN pg_index i ON i.indrelid = c.oid
  AND a.attnum = ANY(i.indkey)
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attname IS NOT NULL
  AND i.oid IS NULL
  AND c.relname IN ('properties', 'leases', 'payments', 'sales', 'documents', 'notifications')

UNION ALL

SELECT
  'Tabelas grandes (>10k linhas)',
  COUNT(*)
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup > 10000;

\echo ''
\echo '=== INSTRUÇÕES FINAIS ==='
\echo '1. Executar índices em ordem de prioridade'
\echo '2. Rodar ANALYZE após criação de índices'
\echo '3. Monitorar performance com pg_stat_statements'
\echo '4. Revisar índices periodicamente (mensal)'
\echo '5. Considerar particionamento para tabelas muito grandes'
\echo ''
\echo 'Script concluído em: ' || CURRENT_TIMESTAMP;