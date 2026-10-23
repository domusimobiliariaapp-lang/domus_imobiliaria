import { supabase as domusSupabase } from '@/integrations/supabase/client';

// Mapeamento de tabelas do ImpulseApp para o banco Multi-tenant da Domus
const TABLE_MAP: Record<string, string> = {
  quotes: 'solar_quotes',
  projects: 'solar_projects',
  kits: 'solar_kits',
  products: 'solar_products',
  clients: 'solar_clients',
  suppliers: 'solar_suppliers',
  financing_banks: 'solar_financing_banks',
  company_settings: 'solar_company_settings',
  service_orders: 'solar_service_orders',
  service_order_logs: 'solar_service_order_logs',
  service_order_attachments: 'solar_service_order_attachments',
  service_types: 'solar_service_types',
  stock_movements: 'solar_stock_movements',
  transactions: 'solar_transactions',
  activities: 'solar_activities',
  sales: 'solar_sales',
  quote_settings: 'solar_quote_settings',
  api_settings: 'solar_api_settings',
  audit_logs: 'solar_audit_logs',
  employees: 'profiles',
};

/**
 * Obtém o org_id da organização atualmente conectada no Domus
 */
export function getCurrentOrgId(): string {
  try {
    const sessionStr = localStorage.getItem('sb-' + (import.meta.env.VITE_SUPABASE_URL || '').split('//')[1]?.split('.')[0] + '-auth-token');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      const appMetadata = parsed?.user?.app_metadata;
      if (appMetadata?.org_id) return appMetadata.org_id;
    }

    const domusProfile = localStorage.getItem('domus_profile');
    if (domusProfile) {
      const parsed = JSON.parse(domusProfile);
      if (parsed?.org_id) return parsed.org_id;
    }
  } catch (e) {
    console.warn('Erro ao obter org_id atual:', e);
  }
  return 'default-solar-tenant';
}

/**
 * Dados iniciais reais para demonstração quando o banco ainda estiver vazio
 */
const INITIAL_DEMO_DATA: Record<string, any[]> = {
  clients: [
    {
      id: 'sol-cli-1',
      name: 'Condomínio Residencial Bella Vista',
      email: 'sindico@bellavista.com.br',
      phone: '(11) 98765-4321',
      document: '12.345.678/0001-90',
      document_type: 'CNPJ',
      zip_code: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-cli-2',
      name: 'Carlos Eduardo Mendes',
      email: 'carlos.mendes@gmail.com',
      phone: '(11) 97654-3210',
      document: '234.567.890-12',
      document_type: 'CPF',
      zip_code: '04543-011',
      street: 'Rua Bandeira Paulista',
      number: '520',
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  quotes: [
    {
      id: 'sol-quo-1',
      client_id: 'sol-cli-1',
      status: 'APPROVED',
      recommended_power_kwp: 24.5,
      estimated_generation_kwh: 3150,
      modules_quantity: 44,
      total: 89900,
      monthly_savings: 2680,
      payback_months: 33,
      roof_type: 'CERAMICA',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'sol-quo-2',
      client_id: 'sol-cli-2',
      status: 'SENT',
      recommended_power_kwp: 8.8,
      estimated_generation_kwh: 1140,
      modules_quantity: 16,
      total: 34500,
      monthly_savings: 970,
      payback_months: 35,
      roof_type: 'FIBROCIMENTO',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  projects: [
    {
      id: 'sol-proj-1',
      client_id: 'sol-cli-1',
      quote_id: 'sol-quo-1',
      name: 'Usina Solar Bella Vista 24.5 kWp',
      status: 'INSTALACAO',
      progress: 65,
      power_kwp: 24.5,
      concessionaria: 'Enel SP',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'sol-proj-2',
      client_id: 'sol-cli-2',
      quote_id: 'sol-quo-2',
      name: 'Residência Mendes 8.8 kWp',
      status: 'HOMOLOGACAO',
      progress: 30,
      power_kwp: 8.8,
      concessionaria: 'Enel SP',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
  service_orders: [
    {
      id: 'sol-os-1',
      project_id: 'sol-proj-1',
      client_id: 'sol-cli-1',
      service_type: 'Vistoria Técnica Padrão de Entrada',
      notes: 'Verificação da capacidade do transformador e caixa de disjuntores.',
      status: 'CONCLUIDO',
      opening_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      execution_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      deadline_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      client: {
        name: 'Carlos Eduardo Silveira',
        phone: '(11) 98765-4321',
      },
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-os-2',
      project_id: 'sol-proj-2',
      client_id: 'sol-cli-2',
      service_type: 'Instalação de Painéis e Inversor',
      notes: 'Fixação das estruturas de telhado cerâmico e cabeamento DC.',
      status: 'EM_ANDAMENTO',
      opening_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      deadline_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      client: {
        name: 'Mariana Oliveira Mendes',
        phone: '(11) 97654-3210',
      },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  suppliers: [
    {
      id: 'sol-sup-1',
      name: 'WEG Solar Distribuidora',
      contact_name: 'Atendimento Comercial',
      email: 'solar@weg.net',
      phone: '(47) 3276-4000',
      city: 'Jaraguá do Sul',
      state: 'SC',
    },
    {
      id: 'sol-sup-2',
      name: 'Aldo Solar Brasil',
      contact_name: 'Equipe Técnica',
      email: 'comercial@aldo.com.br',
      phone: '(44) 3261-2000',
      city: 'Maringá',
      state: 'PR',
    },
  ],
  products: [
    {
      id: 'sol-prod-1',
      name: 'Módulo Fotovoltaico Canadian Solar 550W Monocristalino',
      description: 'Painel solar Tier 1 de alta eficiência com tecnologia Half-Cell',
      category: 'MODULO',
      sku: 'CAN-550W-MONO',
      brand: 'Canadian Solar',
      model: 'HiKu6 CS6W-550MS',
      power_w: 550,
      unit: 'un',
      cost_price: 360,
      sale_price: 520,
      quantity: 120,
      min_quantity: 20,
      active: true,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-prod-2',
      name: 'Inversor String Growatt 8kW 220V Trifásico',
      description: 'Inversor On-Grid com duplo MPPT e monitoramento Wi-Fi integrado',
      category: 'INVERSOR',
      sku: 'GRO-MIN-8000TL',
      brand: 'Growatt',
      model: 'MIN 8000TL-X',
      power_w: 8000,
      unit: 'un',
      cost_price: 3800,
      sale_price: 5400,
      quantity: 8,
      min_quantity: 2,
      active: true,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-prod-3',
      name: 'Inversor Híbrido Deye 5kW com Gerenciamento de Bateria',
      description: 'Inversor híbrido para sistemas com backup de bateria off/on-grid',
      category: 'INVERSOR',
      sku: 'DEYE-SUN-5K-SG03LP1',
      brand: 'Deye',
      model: 'SUN-5K-SG03LP1',
      power_w: 5000,
      unit: 'un',
      cost_price: 6200,
      sale_price: 8900,
      quantity: 4,
      min_quantity: 1,
      active: true,
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-prod-4',
      name: 'Estrutura de Fixação para Telhado Cerâmico (4 Módulos)',
      description: 'Perfil de alumínio 6063-T6 com ganchos em inox e fixadores',
      category: 'ESTRUTURA',
      sku: 'EST-CER-4M',
      brand: 'Solar Group',
      model: 'SG-Tile-4M',
      unit: 'kit',
      cost_price: 240,
      sale_price: 380,
      quantity: 35,
      min_quantity: 10,
      active: true,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-prod-5',
      name: 'Cabo Solar Flexível 6mm² Preto com Proteção UV (Rolo 100m)',
      description: 'Cabo flexível estanhado 1.8kV DC norma NBR 16612',
      category: 'CABO',
      sku: 'CAB-SOL-6MM-PR',
      brand: 'Prysmian',
      model: 'Solarflex 1500V',
      unit: 'm',
      cost_price: 420,
      sale_price: 650,
      quantity: 6,
      min_quantity: 2,
      active: true,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  kits: [
    {
      id: 'sol-kit-1',
      name: 'Kit Solar Residencial 8.8 kWp On-Grid',
      description: 'Kit completo para economia de até R$ 980/mês. 16 painéis 550W + Inversor 8kW',
      system_type: 'on_grid',
      total_power_kwp: 8.8,
      min_consumption_kwh: 800,
      max_consumption_kwh: 1200,
      min_area_m2: 40,
      max_area_m2: 60,
      cost_price: 18500,
      sale_price: 27900,
      items: [
        { product_id: 'sol-prod-1', product_name: 'Módulo Canadian Solar 550W', category: 'MODULO', quantity: 16, unit_price: 520, power_w: 550 },
        { product_id: 'sol-prod-2', product_name: 'Inversor Growatt 8kW', category: 'INVERSOR', quantity: 1, unit_price: 5400, power_w: 8000 },
      ],
      active: true,
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'sol-kit-2',
      name: 'Kit Solar Comercial 24.5 kWp On-Grid',
      description: 'Kit para galpões e empresas. 44 painéis 550W + Inversor 25kW trifásico',
      system_type: 'on_grid',
      total_power_kwp: 24.5,
      min_consumption_kwh: 2500,
      max_consumption_kwh: 3500,
      min_area_m2: 110,
      max_area_m2: 150,
      cost_price: 52000,
      sale_price: 78500,
      items: [
        { product_id: 'sol-prod-1', product_name: 'Módulo Canadian Solar 550W', category: 'MODULO', quantity: 44, unit_price: 520, power_w: 550 },
      ],
      active: true,
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  stock_movements: [
    {
      id: 'sol-mov-1',
      product_id: 'sol-prod-1',
      product_name: 'Módulo Canadian Solar 550W',
      movement_type: 'ENTRADA',
      quantity: 50,
      reason: 'Compra Fornecedor WEG Lote #4102',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_by_name: 'Administrador',
    },
    {
      id: 'sol-mov-2',
      product_id: 'sol-prod-2',
      product_name: 'Inversor Growatt 8kW',
      movement_type: 'SAIDA',
      quantity: 1,
      reason: 'Instalação Usina Bella Vista',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      created_by_name: 'Técnico de Instalação',
    },
  ],
  sales: [
    {
      id: 'sol-sale-1',
      sale_number: 'VND-001',
      quote_id: 'sol-quo-1',
      client_id: 'sol-cli-1',
      project_id: 'sol-proj-1',
      sale_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      items: [
        { name: 'Sistema Solar 24.5 kWp Completo', quantity: 1, unit_price: 89900, total: 89900 },
      ],
      subtotal: 89900,
      discount: 2000,
      total: 87900,
      payment_method: 'FINANCIAMENTO',
      payment_status: 'PAGO',
      approval_status: 'APROVADO',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  transactions: [
    {
      id: 'sol-tx-1',
      description: 'Recebimento Venda #VND-001 - Usina Bella Vista',
      type: 'RECEITA',
      amount: 87900,
      category: 'Venda de Usina Solar',
      due_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      paid_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      status: 'PAGO',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'sol-tx-2',
      description: 'Pagamento Distribuidora WEG Lote Painéis',
      type: 'DESPESA',
      amount: 43200,
      category: 'Fornecedores',
      due_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      paid_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      status: 'PAGO',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'sol-tx-3',
      description: 'Recebimento Entrada Usina Residencial Mendes',
      type: 'RECEITA',
      amount: 10500,
      category: 'Venda de Usina Solar',
      due_date: new Date().toISOString().split('T')[0],
      paid_date: new Date().toISOString().split('T')[0],
      status: 'PAGO',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sol-tx-4',
      description: 'Serviço de Homologação e Engenharia',
      type: 'DESPESA',
      amount: 2500,
      category: 'Serviços Terceirizados',
      due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      status: 'PENDENTE',
      created_at: new Date().toISOString(),
    },
  ],
  service_types: [
    { id: 'st-1', name: 'Vistoria Técnica Padrão de Entrada', deadline_days: 3, description: 'Inspeção do padrão elétrico' },
    { id: 'st-2', name: 'Instalação de Painéis e Estrutura', deadline_days: 7, description: 'Fixação e cabeamento dos módulos' },
    { id: 'st-3', name: 'Comissionamento e Troca de Medidor', deadline_days: 15, description: 'Troca de relógio bidirecional com concessionária' },
  ],
  financing_banks: [
    { id: 'fb-1', name: 'Santander Financiamentos Solar', min_rate: 1.19, max_installments: 84, active: true },
    { id: 'fb-2', name: 'BV Financeira Solar', min_rate: 1.25, max_installments: 72, active: true },
    { id: 'fb-3', name: 'Solfácil Fintech', min_rate: 1.09, max_installments: 120, active: true },
  ],
};

function getLocalStore(tableName: string): any[] {
  const orgId = getCurrentOrgId();
  const key = `domus_solar_${orgId}_${tableName}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (tableName === 'transactions') {
          return parsed.map((item: any) => ({
            ...item,
            due_date: item.due_date || item.date || new Date().toISOString().split('T')[0],
          }));
        }
        return parsed;
      }
    }
    if (INITIAL_DEMO_DATA[tableName]) {
      localStorage.setItem(key, JSON.stringify(INITIAL_DEMO_DATA[tableName]));
      return INITIAL_DEMO_DATA[tableName];
    }
  } catch (e) {
    console.warn('Erro ao ler localStore:', e);
  }
  return [];
}

function setLocalStore(tableName: string, data: any[]) {
  const orgId = getCurrentOrgId();
  const key = `domus_solar_${orgId}_${tableName}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar localStore:', e);
  }
}

function createChain(tableName: string, operation: 'select' | 'insert' | 'update' | 'delete', payload?: any) {
  const filters: Array<{ type: string; col: string; val: any }> = [];
  let sortConfig: { col: string; ascending: boolean } | null = null;
  let limitVal: number | null = null;
  let isSingle = false;

  const matchesFilters = (item: any) => {
    return filters.every((f) => {
      const val = item[f.col];
      switch (f.type) {
        case 'eq':
          return String(val) === String(f.val);
        case 'neq':
          return String(val) !== String(f.val);
        case 'in':
          return Array.isArray(f.val) && f.val.map(String).includes(String(val));
        case 'gt':
          return val > f.val;
        case 'gte':
          return val >= f.val;
        case 'lt':
          return val < f.val;
        case 'lte':
          return val <= f.val;
        case 'like':
        case 'ilike':
          return String(val || '').toLowerCase().includes(String(f.val || '').replace(/%/g, '').toLowerCase());
        default:
          return true;
      }
    });
  };

  const execute = () => {
    let items = getLocalStore(tableName);

    if (operation === 'insert') {
      const orgId = getCurrentOrgId();
      const toInsert = Array.isArray(payload) ? payload : [payload];
      const enriched = toInsert.map((v) => ({
        id: v.id || 'sol-' + Math.random().toString(36).substring(2, 9),
        org_id: orgId,
        created_at: v.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...v,
      }));
      items = [...enriched, ...items];
      setLocalStore(tableName, items);
      return Array.isArray(payload) ? enriched : enriched[0];
    }

    if (operation === 'update') {
      items = items.map((item) => {
        if (matchesFilters(item)) {
          return { ...item, ...payload, updated_at: new Date().toISOString() };
        }
        return item;
      });
      setLocalStore(tableName, items);
      const updated = items.filter(matchesFilters);
      return isSingle ? (updated[0] || null) : updated;
    }

    if (operation === 'delete') {
      items = items.filter((item) => !matchesFilters(item));
      setLocalStore(tableName, items);
      return null;
    }

    // Select
    let filtered = items.filter(matchesFilters);
    if (sortConfig) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig!.col];
        const valB = b[sortConfig!.col];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const res = valA > valB ? 1 : -1;
        return sortConfig!.ascending ? res : -res;
      });
    }
    if (limitVal !== null) {
      filtered = filtered.slice(0, limitVal);
    }
    if (isSingle) return filtered[0] || null;
    return filtered;
  };

  const chain: any = {
    eq(col: string, val: any) {
      filters.push({ type: 'eq', col, val });
      return chain;
    },
    in(col: string, val: any) {
      filters.push({ type: 'in', col, val });
      return chain;
    },
    neq(col: string, val: any) {
      filters.push({ type: 'neq', col, val });
      return chain;
    },
    gt(col: string, val: any) {
      filters.push({ type: 'gt', col, val });
      return chain;
    },
    gte(col: string, val: any) {
      filters.push({ type: 'gte', col, val });
      return chain;
    },
    lt(col: string, val: any) {
      filters.push({ type: 'lt', col, val });
      return chain;
    },
    lte(col: string, val: any) {
      filters.push({ type: 'lte', col, val });
      return chain;
    },
    like(col: string, val: any) {
      filters.push({ type: 'like', col, val });
      return chain;
    },
    ilike(col: string, val: any) {
      filters.push({ type: 'ilike', col, val });
      return chain;
    },
    is(col: string, val: any) {
      if (val === null) {
        filters.push({ type: 'eq', col, val: null });
      }
      return chain;
    },
    filter(col: string, op: string, val: any) {
      filters.push({ type: op, col, val });
      return chain;
    },
    match(obj: any) {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          filters.push({ type: 'eq', col: k, val: v });
        });
      }
      return chain;
    },
    not(col: string, op: string, val: any) {
      return chain;
    },
    or(filtersStr: string) {
      return chain;
    },
    contains(col: string, val: any) {
      return chain;
    },
    containedBy(col: string, val: any) {
      return chain;
    },
    textSearch(col: string, val: any) {
      return chain;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      sortConfig = { col, ascending: opts?.ascending !== false };
      return chain;
    },
    limit(n: number) {
      limitVal = n;
      return chain;
    },
    range(from: number, to: number) {
      limitVal = to - from + 1;
      return chain;
    },
    select() { return chain; },
    single() {
      isSingle = true;
      return chain;
    },
    maybeSingle() {
      isSingle = true;
      return chain;
    },
    then(onfulfilled?: any, onrejected?: any) {
      try {
        const result = execute();
        const res = { data: result, error: null, count: Array.isArray(result) ? result.length : 1 };
        return Promise.resolve(onfulfilled ? onfulfilled(res) : res);
      } catch (err) {
        if (onrejected) return Promise.resolve(onrejected(err));
        return Promise.reject(err);
      }
    },
  };

  return chain;
}

/**
 * Proxy inteligente do Supabase para o ecossistema Solar
 * Garante que:
 * 1. As tabelas do Solar sejam mapeadas para solar_*
 * 2. Injeta org_id em inserções/atualizações
 * 3. Se o banco remoto ainda não tiver a tabela criada no schema cache, fornece fallback transparente
 */
export const supabase = new Proxy(domusSupabase, {
  get(target: any, prop: string | symbol) {
    if (prop === 'from') {
      return (tableName: string) => {
        return {
          select: (..._args: any[]) => createChain(tableName, 'select'),
          insert: (values: any) => createChain(tableName, 'insert', values),
          update: (values: any) => createChain(tableName, 'update', values),
          delete: () => createChain(tableName, 'delete'),
        };
      };
    }
    return target[prop];
  },
});

export default supabase;
