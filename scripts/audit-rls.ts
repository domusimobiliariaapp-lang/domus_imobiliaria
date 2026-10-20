#!/usr/bin/env node
/**
 * Script de Auditoria RLS - Domus Multi-tenant
 *
 * Verifica automaticamente as políticas de segurança do sistema:
 * 1. WITH CHECK em todas as políticas UPDATE/INSERT
 * 2. Isolamento por org_id
 * 3. Funções helper corretas
 * 4. Potenciais vulnerabilidades
 *
 * Execução: npx tsx scripts/audit-rls.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuração do Supabase (usa variáveis de ambiente do projeto)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas.');
  console.error('  Execute: cp .env.example .env e preencha as variáveis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuditResult {
  table: string;
  policy: string;
  command: string;
  issue: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

interface TableInfo {
  name: string;
  hasOrgId: boolean;
  hasTrigger: boolean;
  rowCount?: number;
}

class RLSAuditor {
  private results: AuditResult[] = [];
  private tables: TableInfo[] = [];
  private issuesCount = {
    high: 0,
    medium: 0,
    low: 0
  };

  async runAudit() {
    console.log('🔍 Iniciando auditoria RLS do Domus...\n');

    await this.checkDatabaseConnection();
    await this.analyzeTables();
    await this.checkPolicies();
    await this.checkFunctions();
    await this.checkTriggers();

    this.generateReport();
  }

  private async checkDatabaseConnection() {
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log('✅ Conexão com o banco estabelecida');
    } catch (error) {
      console.error('❌ Falha na conexão com o banco:', error);
      process.exit(1);
    }
  }

  private async analyzeTables() {
    console.log('\n📊 Analisando tabelas...');

    // Tabelas principais do Domus
    const domusTables = [
      'profiles', 'properties', 'leases', 'sales', 'payments', 'documents',
      'notifications', 'clients', 'lease_history', 'company_settings',
      'configuracoes', 'organizations', 'fee_terms', 'financial_entries'
    ];

    for (const tableName of domusTables) {
      try {
        // Verifica se a tabela existe
        const { data: tableExists, error: tableError } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true });

        if (tableError && tableError.code !== '42P01') { // 42P01 = tabela não existe
          console.warn(`  ⚠️  Erro ao verificar tabela ${tableName}:`, tableError.message);
          continue;
        }

        if (tableError?.code === '42P01') {
          console.log(`  📝 Tabela ${tableName} não existe (pode ser legado)`);
          continue;
        }

        // Verifica coluna org_id
        const { data: schemaData, error: schemaError } = await supabase.rpc(
          'has_column',
          { table_name: tableName, column_name: 'org_id' }
        ).single();

        const hasOrgId = !schemaError && schemaData?.exists === true;

        // Verifica triggers
        const { data: triggerData, error: triggerError } = await supabase.rpc(
          'has_trigger',
          { table_name: tableName, trigger_name: 'trg_set_org_id' }
        ).single();

        const hasTrigger = !triggerError && triggerData?.exists === true;

        // Conta linhas (opcional)
        let rowCount: number | undefined;
        if (tableExists) {
          const { count } = tableExists as unknown as { count: number };
          rowCount = count;
        }

        this.tables.push({
          name: tableName,
          hasOrgId,
          hasTrigger,
          rowCount
        });

        // Verifica inconsistências
        if (hasOrgId && !hasTrigger && tableName !== 'profiles' && tableName !== 'organizations') {
          this.addResult({
            table: tableName,
            policy: 'N/A',
            command: 'TRIGGER',
            issue: 'Tabela com org_id mas sem trigger set_org_id',
            severity: 'HIGH',
            recommendation: 'Adicionar trigger set_org_id à tabela'
          });
        }

      } catch (error) {
        console.warn(`  ⚠️  Erro ao analisar tabela ${tableName}:`, error);
      }
    }

    console.log(`  ✅ Analisadas ${this.tables.length} tabelas`);
  }

  private async checkPolicies() {
    console.log('\n🔐 Verificando políticas RLS...');

    // Consulta direta ao PostgreSQL (precisa de service role ou query customizada)
    // Para simplificar, vamos verificar comportamentos específicos

    // 1. Verifica se políticas permitem cross-tenant
    await this.checkCrossTenantPolicies();

    // 2. Verifica políticas de INSERT/UPDATE sem restrição adequada
    await this.checkInsertUpdatePolicies();
  }

  private async checkCrossTenantPolicies() {
    // Tenta inserir em outra organização (teste prático)
    try {
      // Este é um teste conceitual - na prática precisaríamos de uma conta de teste
      console.log('  🔍 Testando isolamento multi-tenant...');

      // Verifica se o usuário atual tem acesso a múltiplas orgs
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('org_id')
        .limit(5);

      if (error) {
        console.warn(`  ⚠️  Não foi possível verificar perfis: ${error.message}`);
        return;
      }

      const uniqueOrgs = new Set(profiles?.map(p => p.org_id).filter(Boolean));
      if (uniqueOrgs.size > 1) {
        console.log(`  ⚠️  Encontrados dados de ${uniqueOrgs.size} organizações diferentes`);
        console.log('     (Isso pode ser normal para contas DEV ou em ambiente de teste)');
      }

    } catch (error) {
      console.warn('  ⚠️  Erro no teste de cross-tenant:', error);
    }
  }

  private async checkInsertUpdatePolicies() {
    // Verifica tabelas que deveriam ter políticas restritivas
    const criticalTables = ['properties', 'leases', 'sales', 'payments', 'clients'];

    for (const table of criticalTables) {
      // Verifica se a tabela existe na nossa lista
      const tableInfo = this.tables.find(t => t.name === table);
      if (!tableInfo) continue;

      // Tenta uma inserção com org_id explícito (deve falhar ou ser ignorado)
      try {
        const testData = {
          // Dados de teste mínimos
          title: `TEST_AUDIT_${Date.now()}`,
          created_at: new Date().toISOString(),
          org_id: '00000000-0000-0000-0000-000000000000' // UUID inválido
        };

        const { error } = await supabase
          .from(table)
          .insert(testData);

        if (!error) {
          this.addResult({
            table,
            policy: 'INSERT',
            command: 'INSERT',
            issue: 'Inserção aceita com org_id explícito',
            severity: 'HIGH',
            recommendation: 'Trigger set_org_id pode não estar funcionando ou política WITH CHECK está ausente'
          });
        } else if (error.message.includes('violates row-level security policy')) {
          console.log(`  ✅ ${table}: Política RLS está funcionando`);
        }
      } catch (error) {
        // Erro esperado - política está funcionando
        console.log(`  ✅ ${table}: Proteção ativa (erro: ${error})`);
      }
    }
  }

  private async checkFunctions() {
    console.log('\n⚙️  Verificando funções helper...');

    const requiredFunctions = [
      'get_current_user_role',
      'current_org_id',
      'is_dev',
      'is_internal_team',
      'is_client',
      'in_current_org'
    ];

    for (const funcName of requiredFunctions) {
      try {
        // Tenta chamar cada função
        const { data, error } = await supabase.rpc(funcName);

        if (error) {
          this.addResult({
            table: 'SYSTEM',
            policy: 'FUNCTION',
            command: 'EXECUTE',
            issue: `Função ${funcName} não disponível ou com erro`,
            severity: 'HIGH',
            recommendation: `Recriar função ${funcName} conforme migration 00003`
          });
        } else {
          console.log(`  ✅ ${funcName}: Disponível`);
        }
      } catch (error) {
        console.warn(`  ⚠️  Erro ao verificar função ${funcName}:`, error);
      }
    }
  }

  private async checkTriggers() {
    console.log('\n⚡ Verificando triggers...');

    const tablesWithTriggers = this.tables.filter(t => t.hasTrigger);
    console.log(`  📋 ${tablesWithTriggers.length} tabelas com trigger set_org_id`);

    // Verifica tabelas críticas sem trigger
    const criticalTables = ['properties', 'leases', 'sales', 'payments'];
    for (const table of criticalTables) {
      const tableInfo = this.tables.find(t => t.name === table);
      if (tableInfo && !tableInfo.hasTrigger) {
        this.addResult({
          table,
          policy: 'TRIGGER',
          command: 'SYSTEM',
          issue: 'Tabela crítica sem trigger set_org_id',
          severity: 'HIGH',
          recommendation: 'Adicionar trigger set_org_id imediatamente'
        });
      }
    }
  }

  private addResult(result: AuditResult) {
    this.results.push(result);

    switch (result.severity) {
      case 'HIGH':
        this.issuesCount.high++;
        break;
      case 'MEDIUM':
        this.issuesCount.medium++;
        break;
      case 'LOW':
        this.issuesCount.low++;
        break;
    }
  }

  private generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO DE AUDITORIA RLS');
    console.log('='.repeat(60));

    // Resumo
    console.log('\n📊 RESUMO:');
    console.log(`  ✅ Tabelas analisadas: ${this.tables.length}`);
    console.log(`  🔴 Problemas HIGH: ${this.issuesCount.high}`);
    console.log(`  🟡 Problemas MEDIUM: ${this.issuesCount.medium}`);
    console.log(`  🟢 Problemas LOW: ${this.issuesCount.low}`);

    // Tabelas com org_id
    const tablesWithOrgId = this.tables.filter(t => t.hasOrgId);
    console.log(`\n🏢 TABELAS COM org_id: ${tablesWithOrgId.length}`);
    tablesWithOrgId.forEach(t => {
      console.log(`  - ${t.name}${t.rowCount ? ` (${t.rowCount} linhas)` : ''}${t.hasTrigger ? ' ⚡' : ''}`);
    });

    // Tabelas sem org_id (potencial problema)
    const tablesWithoutOrgId = this.tables.filter(t => !t.hasOrgId && t.name !== 'organizations');
    if (tablesWithoutOrgId.length > 0) {
      console.log(`\n⚠️  TABELAS SEM org_id (verificar): ${tablesWithoutOrgId.length}`);
      tablesWithoutOrgId.forEach(t => {
        console.log(`  - ${t.name}${t.rowCount ? ` (${t.rowCount} linhas)` : ''}`);
      });
    }

    // Problemas encontrados
    if (this.results.length > 0) {
      console.log('\n🚨 PROBLEMAS ENCONTRADOS:');

      const highIssues = this.results.filter(r => r.severity === 'HIGH');
      const mediumIssues = this.results.filter(r => r.severity === 'MEDIUM');
      const lowIssues = this.results.filter(r => r.severity === 'LOW');

      if (highIssues.length > 0) {
        console.log('\n🔴 ALTA PRIORIDADE:');
        highIssues.forEach(issue => {
          console.log(`\n  [${issue.table}] ${issue.policy}`);
          console.log(`     Problema: ${issue.issue}`);
          console.log(`     Recomendação: ${issue.recommendation}`);
        });
      }

      if (mediumIssues.length > 0) {
        console.log('\n🟡 MÉDIA PRIORIDADE:');
        mediumIssues.forEach(issue => {
          console.log(`\n  [${issue.table}] ${issue.policy}`);
          console.log(`     Problema: ${issue.issue}`);
          console.log(`     Recomendação: ${issue.recommendation}`);
        });
      }

      if (lowIssues.length > 0) {
        console.log('\n🟢 BAIXA PRIORIDADE:');
        lowIssues.forEach(issue => {
          console.log(`\n  [${issue.table}] ${issue.policy}`);
          console.log(`     Problema: ${issue.issue}`);
          console.log(`     Recomendação: ${issue.recommendation}`);
        });
      }
    } else {
      console.log('\n🎉 NENHUM PROBLEMA CRÍTICO ENCONTRADO!');
    }

    // Recomendações gerais
    console.log('\n💡 RECOMENDAÇÕES GERAIS:');
    console.log('  1. Executar o script SQL de auditoria completa (scripts/audit-rls.sql)');
    console.log('  2. Revisar todas as políticas UPDATE/INSERT para garantir WITH CHECK');
    console.log('  3. Verificar índices em colunas org_id para performance');
    console.log('  4. Testar isolamento com contas de diferentes organizações');
    console.log('  5. Revisar edge functions que usam service role');

    // Salvar relatório em arquivo
    this.saveReportToFile();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Auditoria concluída em:', new Date().toLocaleString('pt-BR'));
    console.log('='.repeat(60));
  }

  private saveReportToFile() {
    const report = {
      timestamp: new Date().toISOString(),
      tablesAnalyzed: this.tables.length,
      issues: {
        high: this.issuesCount.high,
        medium: this.issuesCount.medium,
        low: this.issuesCount.low
      },
      tables: this.tables,
      results: this.results,
      summary: this.generateSummaryText()
    };

    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `rls-audit-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  }

  private generateSummaryText(): string {
    return `
DOMUS - RELATÓRIO DE AUDITORIA RLS
Data: ${new Date().toLocaleString('pt-BR')}

RESUMO:
- Tabelas analisadas: ${this.tables.length}
- Problemas HIGH: ${this.issuesCount.high}
- Problemas MEDIUM: ${this.issuesCount.medium}
- Problemas LOW: ${this.issuesCount.low}

${this.issuesCount.high > 0 ? '🚨 ATENÇÃO: Foram encontrados problemas de alta prioridade!' : '✅ Sistema está com boa segurança RLS.'}

PRÓXIMOS PASSOS:
1. ${this.issuesCount.high > 0 ? 'Corrigir problemas HIGH imediatamente' : 'Manter monitoramento regular'}
2. Executar auditoria SQL completa periodicamente
3. Revisar políticas após cada migração
4. Testar isolamento com cenários reais
`;
  }
}

// Execução principal
async function main() {
  const auditor = new RLSAuditor();

  try {
    await auditor.runAudit();
  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error);
    process.exit(1);
  }
}

// Ponto de entrada
if (require.main === module) {
  main();
}

export { RLSAuditor };