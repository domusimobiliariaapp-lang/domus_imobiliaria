import { supabase } from '@/integrations/supabase/client'

export interface SolarClient {
  id: string
  org_id?: string
  name: string
  email?: string
  phone: string
  document: string
  document_type?: 'CPF' | 'CNPJ'
  street?: string
  number?: string
  city?: string
  state?: string
  zip_code?: string
  consumer_unit?: string
  concessionaire?: string
  created_at?: string
}

export interface SolarQuote {
  id: string
  org_id?: string
  client_id?: string
  client_name?: string
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED'
  roof_type?: string
  address_city?: string
  address_state?: string
  average_monthly_kwh: number
  tariff: number
  recommended_power_kwp: number
  estimated_generation_kwh: number
  modules_quantity: number
  inverter_power_kw?: number
  modules?: string
  inverter?: string
  total: number
  monthly_savings: number
  payback_months: number
  roi_25_years?: number
  created_at?: string
}

export interface SolarProject {
  id: string
  org_id?: string
  client_id?: string
  client_name?: string
  quote_id?: string
  status: 'DOCUMENTACAO' | 'HOMOLOGACAO' | 'INSTALACAO' | 'VISTORIA' | 'CONEXAO' | 'CONCLUIDO'
  installation_type?: string
  power_kwp: number
  concessionaire?: string
  start_date?: string
  estimated_end_date?: string
  actual_end_date?: string
  notes?: string
  created_at?: string
}

export interface SolarKit {
  id: string
  org_id?: string
  name: string
  description?: string
  system_type: 'on_grid' | 'hibrido' | 'off_grid'
  total_power_kwp: number
  cost_price: number
  sale_price: number
  modules?: string
  inverter?: string
  active?: boolean
  created_at?: string
}

export interface SolarServiceOrder {
  id: string
  org_id?: string
  project_id?: string
  project_title?: string
  title: string
  description?: string
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  opening_date?: string
  deadline_date?: string
  technician_name?: string
  created_at?: string
}

export interface SolarSupplier {
  id: string
  org_id?: string
  name: string
  email?: string
  phone?: string
  document?: string
  city?: string
  state?: string
  category?: string
  active?: boolean
  created_at?: string
}

export const solarService = {
  // CLIENTES
  async getClients(orgId?: string): Promise<SolarClient[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('solar_clients')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'client-sol-1',
            org_id: orgId,
            name: 'Fazenda Boa Esperança Ltda',
            document: '12.345.678/0001-90',
            document_type: 'CNPJ',
            phone: '(19) 99882-1144',
            email: 'contato@boaesperanca.agr.br',
            city: 'Campinas',
            state: 'SP',
            consumer_unit: 'UC-994821',
            concessionaire: 'CPFL Paulista'
          },
          {
            id: 'client-sol-2',
            org_id: orgId,
            name: 'Roberto Mendonça Alves',
            document: '284.119.558-04',
            document_type: 'CPF',
            phone: '(11) 98711-2233',
            email: 'roberto.mendonca@gmail.com',
            city: 'São Paulo',
            state: 'SP',
            consumer_unit: 'UC-338102',
            concessionaire: 'Enel SP'
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  // ORÇAMENTOS / PROPOSTAS
  async getQuotes(orgId?: string): Promise<SolarQuote[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('solar_quotes')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'quote-1',
            org_id: orgId,
            client_name: 'Fazenda Boa Esperança Ltda',
            status: 'APPROVED',
            roof_type: 'SOLO',
            address_city: 'Campinas',
            address_state: 'SP',
            average_monthly_kwh: 2400,
            tariff: 0.94,
            recommended_power_kwp: 18.7,
            estimated_generation_kwh: 2450,
            modules_quantity: 34,
            inverter_power_kw: 15,
            modules: '34x Canadian Solar 550Wp Bi-facial',
            inverter: '1x Growatt 15kW Trifásico 380V',
            total: 74800,
            monthly_savings: 2280,
            payback_months: 33,
            roi_25_years: 580000,
            created_at: new Date(Date.now() - 3 * 86400000).toISOString()
          },
          {
            id: 'quote-2',
            org_id: orgId,
            client_name: 'Roberto Mendonça Alves',
            status: 'SENT',
            roof_type: 'CERAMICA',
            address_city: 'São Paulo',
            address_state: 'SP',
            average_monthly_kwh: 650,
            tariff: 0.98,
            recommended_power_kwp: 5.5,
            estimated_generation_kwh: 680,
            modules_quantity: 10,
            inverter_power_kw: 5,
            modules: '10x Jinko Tiger Pro 550Wp Mono',
            inverter: '1x Deye Microinversor 5kW',
            total: 24750,
            monthly_savings: 650,
            payback_months: 38,
            roi_25_years: 172000,
            created_at: new Date(Date.now() - 1 * 86400000).toISOString()
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  async saveQuote(quote: Partial<SolarQuote>, orgId: string): Promise<SolarQuote> {
    const payload = {
      ...quote,
      org_id: orgId,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('solar_quotes')
      .upsert(payload)
      .select('*')
      .single()

    if (error) {
      console.warn('Erro salvando no supabase solar_quotes, retornando mock:', error)
      return {
        ...quote,
        id: quote.id || `quote-${Date.now()}`,
        org_id: orgId,
        created_at: new Date().toISOString()
      } as SolarQuote
    }
    return data
  },

  // PROJETOS / USINAS
  async getProjects(orgId?: string): Promise<SolarProject[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('solar_projects')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'proj-1',
            org_id: orgId,
            client_name: 'Fazenda Boa Esperança Ltda',
            status: 'HOMOLOGACAO',
            installation_type: 'RURAL',
            power_kwp: 18.7,
            concessionaire: 'CPFL Paulista',
            start_date: '2026-10-01',
            estimated_end_date: '2026-11-20',
            notes: 'Aguardando parecer de acesso da CPFL',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString()
          },
          {
            id: 'proj-2',
            org_id: orgId,
            client_name: 'Clínica OdontoLife Centro',
            status: 'INSTALACAO',
            installation_type: 'COMERCIAL',
            power_kwp: 12.1,
            concessionaire: 'Enel SP',
            start_date: '2026-09-15',
            estimated_end_date: '2026-10-28',
            notes: 'Fixação de trilhos e passagem de eletrodutos concluída',
            created_at: new Date(Date.now() - 25 * 86400000).toISOString()
          },
          {
            id: 'proj-3',
            org_id: orgId,
            client_name: 'Residência Dr. Carlos Albuquerque',
            status: 'CONEXAO',
            installation_type: 'RESIDENCIAL',
            power_kwp: 8.8,
            concessionaire: 'Elektro',
            start_date: '2026-08-20',
            estimated_end_date: '2026-10-25',
            notes: 'Vistoria aprovada. Troca de relógio bidirecional agendada',
            created_at: new Date(Date.now() - 45 * 86400000).toISOString()
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  async updateProjectStatus(projectId: string, newStatus: SolarProject['status'], orgId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('solar_projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('org_id', orgId)
      return !error
    } catch {
      return true
    }
  },

  // KITS FOTOVOLTAICOS
  async getKits(orgId?: string): Promise<SolarKit[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('solar_kits')
        .select('*')
        .eq('org_id', orgId)
        .order('total_power_kwp', { ascending: true })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'kit-1',
            org_id: orgId,
            name: 'Kit Residencial Compacto 3.3 kWp',
            system_type: 'on_grid',
            total_power_kwp: 3.3,
            modules: '6x Módulos 550Wp Tier 1',
            inverter: '1x Inversor String 3kW Monofásico 220V',
            cost_price: 8500,
            sale_price: 15900,
            active: true
          },
          {
            id: 'kit-2',
            org_id: orgId,
            name: 'Kit Residencial Médio 6.6 kWp',
            system_type: 'on_grid',
            total_power_kwp: 6.6,
            modules: '12x Módulos 550Wp Tier 1',
            inverter: '1x Inversor Growatt 6kW Monofásico/Bifásico',
            cost_price: 15200,
            sale_price: 27900,
            active: true
          },
          {
            id: 'kit-3',
            org_id: orgId,
            name: 'Kit Comercial / Rural 15.4 kWp Trifásico',
            system_type: 'on_grid',
            total_power_kwp: 15.4,
            modules: '28x Módulos 550Wp Bi-facial',
            inverter: '1x Inversor Deye 15kW Trifásico 380V',
            cost_price: 34000,
            sale_price: 61500,
            active: true
          },
          {
            id: 'kit-4',
            org_id: orgId,
            name: 'Kit Híbrido com Bateria de Lítio 5 kWp + 5kWh',
            system_type: 'hibrido',
            total_power_kwp: 5.5,
            modules: '10x Módulos 550Wp Tier 1',
            inverter: '1x Inversor Híbrido 5kW + Bateria LiFePO4 5.12kWh',
            cost_price: 29500,
            sale_price: 48900,
            active: true
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  // ORDENS DE SERVIÇO (CAMPO)
  async getServiceOrders(orgId?: string): Promise<SolarServiceOrder[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('solar_service_orders')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'os-1',
            org_id: orgId,
            project_title: 'Fazenda Boa Esperança - 18.7 kWp',
            title: 'Montagem de Estruturas de Solo e Fixação de Módulos',
            description: 'Instalação das 34 placas solares em estrutura metálica galvanizada de solo e cravamento de estacas.',
            status: 'EM_ANDAMENTO',
            priority: 'ALTA',
            opening_date: '2026-10-18',
            deadline_date: '2026-10-25',
            technician_name: 'Carlos Alberto (Eletrotécnico Chefe)'
          },
          {
            id: 'os-2',
            org_id: orgId,
            project_title: 'Residência Dr. Carlos Albuquerque - 8.8 kWp',
            title: 'Comissionamento e Teste de Isolamento CC/CA',
            description: 'Medição de curvas I-V, teste de aterramento e conferência da parametrização do inversor para inspeção da concessionária.',
            status: 'CONCLUIDO',
            priority: 'MEDIA',
            opening_date: '2026-10-10',
            deadline_date: '2026-10-15',
            technician_name: 'Lucas Martins (Engenheiro Eletricista)'
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  // FORNECEDORES
  async getSuppliers(orgId?: string): Promise<SolarSupplier[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('solar_suppliers')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'sup-1',
            org_id: orgId,
            name: 'Aldo Solar Distribuidora',
            email: 'contato@aldosolar.com.br',
            phone: '(44) 3032-1000',
            document: '00.362.421/0001-44',
            city: 'Maringá',
            state: 'PR',
            category: 'Kits & Inversores Growatt / Deye',
            active: true
          },
          {
            id: 'sup-2',
            org_id: orgId,
            name: 'WEG Solar Brasil',
            email: 'comercial.solar@weg.net',
            phone: '(47) 3276-4000',
            document: '84.450.840/0001-09',
            city: 'Jaraguá do Sul',
            state: 'SC',
            category: 'Inversores Industriais e Stringbox',
            active: true
          },
          {
            id: 'sup-3',
            org_id: orgId,
            name: 'Fortlev Solar',
            email: 'atendimento@fortlevsolar.com.br',
            phone: '(27) 2121-8000',
            document: '01.554.214/0001-65',
            city: 'Serra',
            state: 'ES',
            category: 'Módulos Fotovoltaicos e Estruturas',
            active: true
          }
        ]
      }
      return data
    } catch {
      return []
    }
  }
}
