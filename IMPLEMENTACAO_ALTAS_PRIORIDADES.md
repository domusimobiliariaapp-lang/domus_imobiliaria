# 🚀 IMPLEMENTAÇÃO DAS ALTAS PRIORIDADES - DOMUS

**Data:** 17/10/2026  
**Status:** Pronto para implementação  
**Impacto:** Alta - Segurança e Performance

---

## 📋 RESUMO EXECUTIVO

Foram implementadas soluções para as 3 altas prioridades identificadas na auditoria:

1. **✅ Auditoria RLS completa** - Scripts SQL e TypeScript para validação automática
2. **✅ Índices de performance** - Scripts SQL com índices otimizados para multi-tenant
3. **✅ Rate limiting distribuído** - Sistema com Redis + fallback em memória

---

## 🔐 1. AUDITORIA RLS COMPLETA

### 📁 Arquivos Criados

| Arquivo | Propósito | Tipo |
|---------|-----------|------|
| `scripts/audit-rls.sql` | Auditoria completa via PostgreSQL | SQL |
| `scripts/audit-rls.ts` | Auditoria programática via TypeScript | TypeScript |
| `scripts/audit-rls.js` | Auditoria simplificada em JavaScript | JavaScript |

### 🚀 Como Executar

#### Opção A: Auditoria SQL Completa (Recomendada)
```bash
# Conectar ao banco e executar
psql -h seu-host.supabase.co -p 5432 -d postgres -U postgres -f scripts/audit-rls.sql
```

#### Opção B: Auditoria Programática
```bash
# Configurar ambiente
cp .env.example .env
# Preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Executar auditoria
npm exec tsx scripts/audit-rls.ts
# ou
node scripts/audit-rls.js
```

### 📊 O que é Verificado

1. **Políticas sem WITH CHECK** - Vulnerabilidade crítica de cross-tenant
2. **Uso de auth.jwt()->>'role'** - Padrão antigo e inseguro
3. **Funções helper ausentes** - get_current_user_role, current_org_id, etc.
4. **Tabelas sem coluna org_id** - Potencial problema de isolamento
5. **Triggers set_org_id ausentes** - Falha na proteção automática
6. **Políticas sem in_current_org()** - Risco de vazamento entre organizações
7. **Índices de performance** - Verificação de índices em org_id
8. **Funções SECURITY DEFINER sem search_path** - Risco de escalada de privilégio

### 🎯 Resultados Esperados

- Relatório JSON em `reports/rls-audit-*.json`
- Output console com problemas classificados por severidade
- Recomendações específicas para correção

---

## 🚀 2. ÍNDICES DE PERFORMANCE

### 📁 Arquivo Criado

| Arquivo | Propósito |
|---------|-----------|
| `scripts/add-performance-indexes.sql` | Criação otimizada de índices |

### 🎯 Índices Críticos (Alta Prioridade)

```sql
-- 1. Índices org_id + status (queries mais comuns)
CREATE INDEX CONCURRENTLY idx_properties_org_status 
ON properties(org_id, status) 
WHERE status IN ('disponivel', 'alugado', 'vendido', 'manutencao');

-- 2. Índices para pagamentos pendentes
CREATE INDEX CONCURRENTLY idx_payments_org_due_status 
ON payments(org_id, due_date, status) 
WHERE status IN ('pendente', 'atrasado', 'pago');

-- 3. Índices para leases ativos
CREATE INDEX CONCURRENTLY idx_leases_org_status 
ON leases(org_id, status) 
WHERE status IN ('ativo', 'encerrado', 'cancelado');
```

### 📈 Índices para Performance (Média Prioridade)

- **Joins frequentes**: `idx_leases_property_tenant`, `idx_payments_lease_tenant`
- **Relatórios**: `idx_properties_created_org`, `idx_leases_created_org`
- **Busca textual**: `idx_properties_features_gin`, `idx_properties_address_trgm`
- **Agrupamento**: `idx_payments_monthly_agg`, `idx_leases_monthly_agg`

### 🚀 Como Executar

```bash
# Executar durante horário de baixo tráfego
psql -h seu-host.supabase.co -p 5432 -d postgres -U postgres -f scripts/add-performance-indexes.sql

# Rodar ANALYZE após criação de índices
ANALYZE properties;
ANALYZE leases;
ANALYZE payments;
ANALYZE sales;
```

### 📊 Benefícios Esperados

- **50-70% redução** em tempo de queries de dashboard
- **80% redução** em queries N+1
- Melhor escalabilidade para múltiplas organizações
- Performance consistente com crescimento de dados

---

## ⚡ 3. RATE LIMITING DISTRIBUÍDO

### 📁 Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `scripts/redis-rate-limiter.ts` | Biblioteca de rate limiting distribuído |
| `supabase/functions/cliente-login-request-redis/` | Edge function atualizada |

### 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Edge Function │───►│ Redis Rate   │───►│   Redis     │
│   (Supabase)    │    │   Limiter    │    │ (Upstash)   │
└─────────────────┘    └──────────────┘    └─────────────┘
         │                       │                  │
         │                       │                  │
         ▼                       ▼                  ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Memory Fall-  │    │   Multi-layer│    │   Statistics│
│     back        │    │   Protection │    │   & Logs    │
└─────────────────┘    └──────────────┘    └─────────────┘
```

### 🛡️ Camadas de Proteção

1. **IP-based**: 10 requisições/minuto por IP
2. **CPF/CNPJ-based**: 3 tentativas/15 minutos por documento
3. **Organization-based**: 30 requisições/minuto por org
4. **Email-based**: 2 emails/5 minutos por endereço

### 🔧 Configuração do Redis (Upstash)

```bash
# Variáveis de ambiente necessárias
UPSTASH_REDIS_URL=redis://seu-redis.upstash.io:6379
UPSTASH_REDIS_TOKEN=seu-token-aqui

# Adicionar ao .env do projeto e às variáveis do Supabase
```

### 🚀 Migração da Edge Function

```bash
# 1. Copiar nova função
cp -r supabase/functions/cliente-login-request-redis supabase/functions/cliente-login-request-new

# 2. Testar localmente
supabase functions serve cliente-login-request-new --no-verify-jwt

# 3. Deploy para produção
supabase functions deploy cliente-login-request-new

# 4. Atualizar frontend para usar nova URL
# 5. Remover função antiga após validação
```

### 📊 Headers de Resposta

A nova implementação inclui headers informativos:

```
X-RateLimit-IP-Limit: 10
X-RateLimit-IP-Remaining: 9
X-RateLimit-IP-Reset: 1739743260
X-RateLimit-CPF-Limit: 3
X-RateLimit-CPF-Remaining: 2
X-RateLimit-CPF-Reset: 1739744160
Retry-After: 60
```

### 🎯 Benefícios

- **Rate limiting distribuído**: Funciona entre múltiplas instâncias
- **Resiliência**: Fallback em memória se Redis falhar
- **Multi-camadas**: Proteção em IP, CPF, organização e email
- **Auditoria**: Logs detalhados para análise forense
- **Headers informativos**: Clientes sabem quando tentar novamente

---

## 📅 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Preparação (1-2 dias)
- [ ] Configurar ambiente de staging
- [ ] Criar backup completo do banco
- [ ] Configurar Upstash Redis (conta gratuita disponível)
- [ ] Testar scripts em ambiente de staging

### Fase 2: Auditoria RLS (1 dia)
- [ ] Executar `scripts/audit-rls.sql` em produção
- [ ] Analisar resultados e priorizar correções
- [ ] Corrigir políticas sem WITH CHECK
- [ ] Verificar triggers set_org_id

### Fase 3: Índices de Performance (1 dia - horário de baixo tráfego)
- [ ] Executar `scripts/add-performance-indexes.sql` (índices críticos primeiro)
- [ ] Monitorar performance durante 24h
- [ ] Executar ANALYZE nas tabelas principais
- [ ] Verificar uso de índices via pg_stat_statements

### Fase 4: Rate Limiting (2 dias)
- [ ] Configurar variáveis de ambiente do Redis
- [ ] Deploy da nova edge function em staging
- [ ] Testar rate limiting com carga simulada
- [ ] Deploy em produção com canary deployment
- [ ] Monitorar logs e métricas por 48h
- [ ] Desativar função antiga

### Fase 5: Validação e Monitoramento (3 dias contínuos)
- [ ] Executar auditoria RLS pós-implantação
- [ ] Monitorar performance com dashboards
- [ ] Verificar isolamento multi-tenant
- [ ] Testar cenários de rate limiting
- [ ] Documentar resultados e ajustes

---

## 🧪 TESTES RECOMENDADOS

### Testes de Isolamento Multi-tenant
```sql
-- Tentar acessar dados de outra organização
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"user-a", "role":"authenticated"}';
SELECT * FROM properties WHERE org_id = 'org-b-uuid';
-- ^ Deve retornar 0 linhas
```

### Testes de Rate Limiting
```bash
# Simular múltiplas requisições
for i in {1..15}; do
  curl -X POST https://api.domus.com/functions/v1/cliente-login-request-redis \
    -H "Content-Type: application/json" \
    -d '{"cpf_cnpj":"12345678900","telefone":"11999999999","slug":"domus"}'
  echo ""
done
# Deve receber 429 após 10 requisições
```

### Testes de Performance
```sql
-- Antes e depois dos índices
EXPLAIN ANALYZE
SELECT * FROM payments 
WHERE org_id = 'org-uuid' 
  AND status = 'pendente'
  AND due_date >= CURRENT_DATE;
```

---

## 📊 MÉTRICAS DE SUCESSO

### Segurança RLS
- [ ] 0 políticas sem WITH CHECK
- [ ] 0 usos de auth.jwt()->>'role'
- [ ] 100% das tabelas críticas com trigger set_org_id
- [ ] Auditoria passa sem erros HIGH

### Performance
- [ ] 50% redução no tempo médio de queries
- [ ] 80% redução em queries sequenciais (N+1)
- [ ] Índices usados em >95% das queries críticas
- [ ] 0 timeouts em queries de dashboard

### Rate Limiting
- [ ] 0 falhas de rate limiting distribuído
- [ ] < 1% de requisições bloqueadas (falsos positivos)
- [ ] Tempo de resposta < 100ms com Redis
- [ ] Fallback ativado em < 0.1% das requisições

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Índices bloqueiam tabelas | Alto | Usar CREATE INDEX CONCURRENTLY, executar fora do horário comercial |
| Rate limiting bloqueia usuários legítimos | Médio | Limites generosos, múltiplas camadas, headers informativos |
| Redis indisponível | Médio | Fallback em memória, health checks, alertas |
| Migração quebra funcionalidade existente | Alto | Canary deployment, rollback planejado, testes extensivos |
| Performance piora com índices | Baixo | Testes em staging, monitoramento contínuo, remoção de índices problemáticos |

---

## 📞 SUPORTE E MONITORAMENTO

### Alertas Configurar
- **Redis downtime**: > 1 minuto
- **Rate limit hits**: > 1000/hora
- **Query performance**: > 5 segundos
- **RLS policy failures**: Qualquer ocorrência

### Dashboards Recomendados
1. **Performance Database**: pg_stat_statements, índice usage
2. **Rate Limiting**: hits/misses, Redis health
3. **Security**: failed RLS policies, audit logs
4. **Business**: requisições por organização, usuários ativos

---

## 🎯 PRÓXIMOS PASSOS

1. **Imediato**: Executar auditoria RLS em staging
2. **Curto prazo (1 semana)**: Implementar índices críticos
3. **Médio prazo (2 semanas)**: Migrar rate limiting para Redis
4. **Longo prazo (1 mês)**: Automatizar auditorias periódicas
5. **Contínuo**: Monitoramento e otimização baseada em métricas

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Upstash Redis Rate Limiting](https://upstash.com/docs/redis/overall/ratelimiting)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Indexing Best Practices](https://www.postgresql.org/docs/current/indexes.html)

---

**✅ STATUS**: Pronto para implementação  
**🏷️ VERSÃO**: 1.0.0  
**👨‍💻 RESPONSÁVEL**: Equipe de Infraestrutura  
**📅 REVISÃO**: Mensal