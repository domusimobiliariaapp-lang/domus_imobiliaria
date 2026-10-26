#!/usr/bin/env node
/**
 * Script de Auditoria RLS - Domus Multi-tenant
 * Versão simplificada em JavaScript puro
 *
 * Execução: node scripts/audit-rls.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carrega .env se não estiver definido
if (!process.env.VITE_SUPABASE_URL && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(process.cwd(), '.env'));
  } catch {
    // ignora se .env não existir
  }
}

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas.');
  console.error('  Execute: cp .env.example .env e preencha as variáveis');
  console.error('  Ou defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class RLSAuditor {
  constructor() {
    this.results = [];
    this.tables = [];
    this.issuesCount = { high: 0, medium: 0, low: 0 };
  }

  async runAudit() {
    console.log('🔍 Iniciando auditoria RLS do Domus...\n');

    await this.checkDatabaseConnection();
    await this.analyzeTables();
    await this.checkCriticalFunctions();
    await this.generateReport();
  }

  async checkDatabaseConnection() {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Conexão com o banco estabelecida');
    } catch (error) {
      console.error('❌ Falha na conexão com o banco:', error.message);
      process.exit(1);
    }
  }

  async analyzeTables() {
    console.log('\n📊 Analisando tabelas principais...');

    // Tabelas críticas do Domus
    const criticalTables = [
      'profiles', 'properties', 'leases', 'sales', 'payments', 'documents',
      'notifications', 'clients', 'lease_history', 'company_settings',
      'organizations'
    ];

    for (const tableName of criticalTables) {
      try {
        // Verifica existência da tabela
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);

        if (error) {
          if (error.code === '42P01') { // tabela não existe
            console.log(`  📝 ${tableName}: Não encontrada (pode ser legado)`);
            continue;
          }
          console.warn(`  ⚠️  ${tableName}: Erro - ${error.message}`);
          continue;
        }

        // Verifica se tem org_id (teste simples)
        const { error: orgIdError } = await supabase
          .from(tableName)
          .select('org_id')
          .limit(1);

        const hasOrgId = !orgIdError;

        // Conta linhas aproximadas
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        this.tables.push({
          name: tableName,
          hasOrgId,
          rowCount: count || 0
        });

        console.log(`  ✅ ${tableName}: ${count || 0} linhas${hasOrgId ? ' (com org_id)' : ''}`);

        // Verifica tabelas críticas sem org_id
        if (!hasOrgId && tableName !== 'organizations' && tableName !== 'profiles') {
          this.addResult({
            table: tableName,
            issue: 'Tabela de negócio sem coluna org_id',
            severity: 'HIGH',
            recommendation: 'Adicionar coluna org_id e trigger set_org_id'
          });
        }

      } catch (error) {
        console.warn(`  ⚠️  Erro ao analisar ${tableName}: ${error.message}`);
      }
    }
  }

  async checkCriticalFunctions() {
    console.log('\n⚙️  Verificando funções críticas...');

    const criticalFunctions = [
      'get_current_user_role',
      'current_org_id',
      'is_dev'
    ];

    for (const funcName of criticalFunctions) {
      try {
        // Tenta chamar a função com parâmetros seguros
        const { error } = await supabase.rpc(funcName);

        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            this.addResult({
              table: 'SYSTEM',
              issue: `Função ${funcName} não existe`,
              severity: 'HIGH',
              recommendation: `Executar migration 20260930000003_org_functions.sql`
            });
            console.log(`  🔴 ${funcName}: Não encontrada`);
          } else {
            console.log(`  ✅ ${funcName}: Disponível (retornou: ${error.message})`);
          }
        } else {
          console.log(`  ✅ ${funcName}: Disponível`);
        }
      } catch (error) {
        console.warn(`  ⚠️  ${funcName}: Erro na verificação - ${error.message}`);
      }
    }
  }

  async testMultiTenantIsolation() {
    console.log('\n🏢 Testando isolamento multi-tenant...');

    try {
      // Tenta buscar perfis de múltiplas organizações
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('org_id')
        .limit(10);

      if (error) {
        console.warn(`  ⚠️  Não foi possível verificar perfis: ${error.message}`);
        return;
      }

      if (profiles && profiles.length > 0) {
        const orgIds = profiles.map(p => p.org_id).filter(Boolean);
        const uniqueOrgs = [...new Set(orgIds)];

        console.log(`  📊 Encontrados ${profiles.length} perfis em ${uniqueOrgs.length} organização(ões)`);

        if (uniqueOrgs.length > 1) {
          console.log('  ⚠️  Múltiplas organizações encontradas');
          console.log('     (Pode ser normal para contas DEV ou ambiente de teste)');
        }
      }
    } catch (error) {
      console.warn(`  ⚠️  Erro no teste de isolamento: ${error.message}`);
    }
  }

  addResult(result) {
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

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO DE AUDITORIA RLS - RESUMO');
    console.log('='.repeat(60));

    // Resumo estatístico
    console.log('\n📊 RESUMO ESTATÍSTICO:');
    console.log(`  Tabelas analisadas: ${this.tables.length}`);
    console.log(`  Problemas HIGH: ${this.issuesCount.high}`);
    console.log(`  Problemas MEDIUM: ${this.issuesCount.medium}`);
    console.log(`  Problemas LOW: ${this.issuesCount.low}`);

    // Tabelas com/sem org_id
    const tablesWithOrgId = this.tables.filter(t => t.hasOrgId);
    const tablesWithoutOrgId = this.tables.filter(t => !t.hasOrgId);

    console.log(`\n🏢 ESTRUTURA: ${tablesWithOrgId.length} tabelas COM org_id`);
    tablesWithOrgId.forEach(t => {
      console.log(`  - ${t.name} (${t.rowCount} linhas)`);
    });

    if (tablesWithoutOrgId.length > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${tablesWithoutOrgId.length} tabelas SEM org_id`);
      tablesWithoutOrgId.forEach(t => {
        console.log(`  - ${t.name} (${t.rowCount} linhas)`);
      });
    }

    // Problemas encontrados
    if (this.results.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');

      const highIssues = this.results.filter(r => r.severity === 'HIGH');
      const mediumIssues = this.results.filter(r => r.severity === 'MEDIUM');
      const lowIssues = this.results.filter(r => r.severity === 'LOW');

      if (highIssues.length > 0) {
        console.log('\n🔴 ALTA PRIORIDADE (corrigir imediatamente):');
        highIssues.forEach((issue, i) => {
          console.log(`\n  ${i + 1}. [${issue.table}]`);
          console.log(`     Problema: ${issue.issue}`);
          console.log(`     Ação: ${issue.recommendation}`);
        });
      }

      if (mediumIssues.length > 0) {
        console.log('\n🟡 MÉDIA PRIORIDADE (corrigir em breve):');
        mediumIssues.forEach((issue, i) => {
          console.log(`\n  ${i + 1}. [${issue.table}]`);
          console.log(`     Problema: ${issue.issue}`);
          console.log(`     Ação: ${issue.recommendation}`);
        });
      }

      if (lowIssues.length > 0) {
        console.log('\n🟢 BAIXA PRIORIDADE (melhorias):');
        lowIssues.forEach((issue, i) => {
          console.log(`\n  ${i + 1}. [${issue.table}]`);
          console.log(`     Problema: ${issue.issue}`);
          console.log(`     Ação: ${issue.recommendation}`);
        });
      }
    } else {
      console.log('\n🎉 NENHUM PROBLEMA CRÍTICO IDENTIFICADO!');
      console.log('   O sistema parece estar com boa estrutura RLS.');
    }

    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES PRÁTICAS:');
    console.log('  1. Executar o script SQL completo: psql -f scripts/audit-rls.sql');
    console.log('  2. Verificar triggers set_org_id em todas as tabelas de negócio');
    console.log('  3. Testar com usuários de diferentes organizações');
    console.log('  4. Revisar edge functions que usam service role');
    console.log('  5. Manter auditoria periódica (sugerido: mensal)');

    // Status final
    console.log('\n' + '='.repeat(60));
    console.log('🏁 STATUS FINAL:');

    if (this.issuesCount.high > 0) {
      console.log('🔴 REQUER ATENÇÃO IMEDIATA');
      console.log(`   ${this.issuesCount.high} problema(s) de alta prioridade encontrado(s)`);
    } else if (this.issuesCount.medium > 0) {
      console.log('🟡 REQUER ATENÇÃO EM BREVE');
      console.log(`   ${this.issuesCount.medium} problema(s) de média prioridade`);
    } else {
      console.log('✅ SISTEMA ESTÁVEL');
      console.log('   Nenhum problema crítico identificado');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Auditoria concluída em:', new Date().toLocaleString('pt-BR'));
    console.log('='.repeat(60));

    // Salvar relatório
    this.saveReport();
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        tablesAnalyzed: this.tables.length,
        issues: this.issuesCount,
        tablesWithOrgId: this.tables.filter(t => t.hasOrgId).length,
        tablesWithoutOrgId: this.tables.filter(t => !t.hasOrgId).length
      },
      tables: this.tables,
      issues: this.results,
      recommendations: [
        'Executar script SQL completo de auditoria',
        'Verificar triggers set_org_id',
        'Testar isolamento multi-tenant',
        'Revisar edge functions'
      ]
    };

    const reportDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `rls-audit-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
  }
}

// Execução principal
async function main() {
  const auditor = new RLSAuditor();

  try {
    await auditor.runAudit();
  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { RLSAuditor };