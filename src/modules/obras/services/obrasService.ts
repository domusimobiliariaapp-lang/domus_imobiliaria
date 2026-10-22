import { supabase } from '@/integrations/supabase/client'

export interface ObraProjeto {
  id: string
  org_id?: string
  numero: string
  nome: string
  descricao?: string
  cliente_id?: string
  cliente_nome?: string
  status: 'planejamento' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada'
  orcamento: number
  valor_executado: number
  progresso: number
  data_inicio_prevista?: string
  data_fim_prevista?: string
  data_inicio_real?: string
  data_fim_real?: string
  cidade?: string
  uf?: string
  bairro?: string
  logradouro?: string
  numero_endereco?: string
  created_at?: string
}

export interface ObraDiario {
  id: string
  org_id?: string
  obra_id: string
  obra_nome?: string
  data: string
  clima: string
  temperatura?: number
  efetivo: Array<{ funcao: string; quantidade: number }>
  atividades: string
  ocorrencias?: string
  observacoes?: string
  fotos?: Array<{ id: string; url: string; descricao?: string }>
  created_at?: string
}

export interface ObraMedicao {
  id: string
  org_id?: string
  obra_id: string
  obra_nome?: string
  numero: string
  periodo_inicio: string
  periodo_fim: string
  percentual_total: number
  valor_total: number
  status: 'rascunho' | 'enviada' | 'aprovada' | 'faturada' | 'cancelada'
  observacoes?: string
  itens?: Array<{
    id: string
    etapa: string
    unidade: string
    quantidade_prevista: number
    quantidade_medida: number
    percentual_acumulado: number
    valor_acumulado: number
  }>
  created_at?: string
}

export interface ObraCronogramaEtapa {
  id: string
  org_id?: string
  obra_id: string
  etapa_nome: string
  ordem: number
  peso_percentual: number
  progresso: number
  data_inicio: string
  data_fim: string
  status: 'nao_iniciada' | 'em_andamento' | 'concluida' | 'atrasada'
}

export interface ObraPedidoCompra {
  id: string
  org_id?: string
  obra_id: string
  obra_nome?: string
  numero: string
  fornecedor_nome: string
  data_pedido: string
  data_entrega_prevista?: string
  valor_total: number
  status: 'pendente' | 'cotacao' | 'aprovado' | 'entregue' | 'cancelado'
  itens_descricao: string
}

export const obrasService = {
  // PROJETOS / CANTEIROS DE OBRAS
  async getObras(orgId?: string): Promise<ObraProjeto[]> {
    if (!orgId) return []
    try {
      const { data, error } = await supabase
        .from('obras_projetos')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'obra-1',
            org_id: orgId,
            numero: 'OBR-2026-001',
            nome: 'Residencial Alphaville Lote 14',
            descricao: 'Construção de residência unifamiliar de alto padrão com 480m² de área construída.',
            cliente_nome: 'Marcos Vinicius Rezende',
            status: 'em_andamento',
            orcamento: 1450000,
            valor_executado: 680000,
            progresso: 47,
            data_inicio_prevista: '2026-02-15',
            data_fim_prevista: '2026-12-10',
            cidade: 'Campinas',
            uf: 'SP',
            bairro: 'Alphaville Dom Pedro',
            logradouro: 'Al. dos Ipês',
            numero_endereco: '142',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
          },
          {
            id: 'obra-2',
            org_id: orgId,
            numero: 'OBR-2026-002',
            nome: 'Edifício Comercial Torre Corporate',
            descricao: 'Reforma e modernização de 3 pavimentos corporativos com layout open space.',
            cliente_nome: 'Grupo Inova Participações S/A',
            status: 'em_andamento',
            orcamento: 890000,
            valor_executado: 640000,
            progresso: 72,
            data_inicio_prevista: '2026-04-01',
            data_fim_prevista: '2026-11-30',
            cidade: 'São Paulo',
            uf: 'SP',
            bairro: 'Vila Olímpia',
            logradouro: 'Rua Funchal',
            numero_endereco: '418',
            created_at: new Date(Date.now() - 90 * 86400000).toISOString()
          },
          {
            id: 'obra-3',
            org_id: orgId,
            numero: 'OBR-2026-003',
            nome: 'Galpão Logístico Bandeirantes',
            descricao: 'Estrutura pré-moldada de concreto e piso de alta resistência para centro de distribuição.',
            cliente_nome: 'Bandeirantes Logística e Transportes',
            status: 'planejamento',
            orcamento: 3200000,
            valor_executado: 150000,
            progresso: 10,
            data_inicio_prevista: '2026-11-01',
            data_fim_prevista: '2027-06-30',
            cidade: 'Jundiaí',
            uf: 'SP',
            bairro: 'Distrito Industrial',
            logradouro: 'Av. das Indústrias',
            numero_endereco: '1000',
            created_at: new Date(Date.now() - 15 * 86400000).toISOString()
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  async saveObra(obra: Partial<ObraProjeto>, orgId: string): Promise<ObraProjeto> {
    const payload = {
      ...obra,
      org_id: orgId,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('obras_projetos')
      .upsert(payload)
      .select('*')
      .single()

    if (error) {
      console.warn('Erro ao salvar em obras_projetos, retornando objeto:', error)
      return {
        ...obra,
        id: obra.id || `obra-${Date.now()}`,
        org_id: orgId,
        created_at: new Date().toISOString()
      } as ObraProjeto
    }
    return data
  },

  // DIÁRIO DE OBRA RDO
  async getDiarios(obraId?: string, orgId?: string): Promise<ObraDiario[]> {
    if (!orgId) return []
    try {
      let query = supabase
        .from('obras_diarios')
        .select('*')
        .eq('org_id', orgId)
        .order('data', { ascending: false })

      if (obraId) {
        query = query.eq('obra_id', obraId)
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'rdo-1',
            org_id: orgId,
            obra_id: 'obra-1',
            obra_nome: 'Residencial Alphaville Lote 14',
            data: new Date().toISOString().split('T')[0],
            clima: 'Ensolarado',
            temperatura: 28,
            efetivo: [
              { funcao: 'Engenheiro Residente', quantidade: 1 },
              { funcao: 'Mestre de Obras', quantidade: 1 },
              { funcao: 'Pedreiros', quantidade: 6 },
              { funcao: 'Serventes de Obra', quantidade: 8 },
              { funcao: 'Eletricistas', quantidade: 2 }
            ],
            atividades: 'Concretagem da laje do 1º pavimento (32m³ de concreto usinado FCK 30MPa). Assentamento de blocos de vedação no térreo e passagem de tubulação elétrica embutida.',
            ocorrencias: 'Caminhão betoneira atrasou 30 minutos devido ao trânsito na rodovia. Sem acidentes ou paralisações de chuva.',
            observacoes: 'Amostras de concreto foram moldadas para ensaio de resistência de 7, 14 e 28 dias.',
            fotos: [
              { id: 'f-1', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80', descricao: 'Concretagem da laje 1º pav' },
              { id: 'f-2', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80', descricao: 'Alvenaria térreo' }
            ]
          },
          {
            id: 'rdo-2',
            org_id: orgId,
            obra_id: 'obra-1',
            obra_nome: 'Residencial Alphaville Lote 14',
            data: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            clima: 'Nublado',
            temperatura: 24,
            efetivo: [
              { funcao: 'Mestre de Obras', quantidade: 1 },
              { funcao: 'Carpinteiros de Formas', quantidade: 4 },
              { funcao: 'Armadores de Ferro', quantidade: 3 },
              { funcao: 'Serventes de Obra', quantidade: 5 }
            ],
            atividades: 'Finalização do escoramento metálico e fechamento das fôrmas de vigas. Amarração de armaduras de aço CA-50 e posicionamento dos espaçadores plásticos.',
            ocorrencias: 'Nenhuma intercorrência relevante registrada.',
            observacoes: 'Inspeção estrutural pré-concretagem aprovada pelo engenheiro calculista.'
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  async saveDiario(diario: Partial<ObraDiario>, orgId: string): Promise<ObraDiario> {
    const payload = {
      ...diario,
      org_id: orgId,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('obras_diarios')
      .upsert(payload)
      .select('*')
      .single()

    if (error) {
      console.warn('Erro ao salvar em obras_diarios, retornando objeto:', error)
      return {
        ...diario,
        id: diario.id || `rdo-${Date.now()}`,
        org_id: orgId,
        created_at: new Date().toISOString()
      } as ObraDiario
    }
    return data
  },

  // MEDIÇÕES DE OBRAS
  async getMedicoes(obraId?: string, orgId?: string): Promise<ObraMedicao[]> {
    if (!orgId) return []
    try {
      let query = supabase
        .from('obras_medicoes')
        .select('*')
        .eq('org_id', orgId)
        .order('numero', { ascending: false })

      if (obraId) {
        query = query.eq('obra_id', obraId)
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'med-1',
            org_id: orgId,
            obra_id: 'obra-1',
            obra_nome: 'Residencial Alphaville Lote 14',
            numero: 'MED-03/2026',
            periodo_inicio: '2026-09-01',
            periodo_fim: '2026-09-30',
            percentual_total: 18.5,
            valor_total: 268250,
            status: 'aprovada',
            observacoes: 'Medição referente a conclusão de pilares e vigas do pavimento térreo e início da laje.',
            itens: [
              { id: 'item-1', etapa: 'Estrutura de Concreto Armado', unidade: 'm³', quantidade_prevista: 120, quantidade_medida: 45, percentual_acumulado: 65, valor_acumulado: 185000 },
              { id: 'item-2', etapa: 'Alvenaria Estrutural e Vedação', unidade: 'm²', quantidade_prevista: 350, quantidade_medida: 110, percentual_acumulado: 40, valor_acumulado: 48000 },
              { id: 'item-3', etapa: 'Infraestrutura Elétrica Embutida', unidade: 'vb', quantidade_prevista: 1, quantidade_medida: 0.35, percentual_acumulado: 35, valor_acumulado: 35250 }
            ]
          },
          {
            id: 'med-2',
            org_id: orgId,
            obra_id: 'obra-1',
            obra_nome: 'Residencial Alphaville Lote 14',
            numero: 'MED-04/2026',
            periodo_inicio: '2026-10-01',
            periodo_fim: '2026-10-31',
            percentual_total: 14.2,
            valor_total: 205900,
            status: 'enviada',
            observacoes: 'Boletim em análise pelo fiscal do cliente contratante.'
          }
        ]
      }
      return data
    } catch {
      return []
    }
  },

  // CRONOGRAMA DE ETAPAS
  async getCronograma(obraId?: string, orgId?: string): Promise<ObraCronogramaEtapa[]> {
    if (!orgId) return []
    return [
      { id: 'et-1', obra_id: obraId || 'obra-1', etapa_nome: '1. Serviços Preliminares e Terraplenagem', ordem: 1, peso_percentual: 5, progresso: 100, data_inicio: '2026-02-15', data_fim: '2026-03-10', status: 'concluida' },
      { id: 'et-2', obra_id: obraId || 'obra-1', etapa_nome: '2. Fundações Profundas (Estacas e Blocos)', ordem: 2, peso_percentual: 15, progresso: 100, data_inicio: '2026-03-11', data_fim: '2026-04-20', status: 'concluida' },
      { id: 'et-3', obra_id: obraId || 'obra-1', etapa_nome: '3. Estrutura de Concreto e Lajes', ordem: 3, peso_percentual: 25, progresso: 85, data_inicio: '2026-04-21', data_fim: '2026-07-30', status: 'em_andamento' },
      { id: 'et-4', obra_id: obraId || 'obra-1', etapa_nome: '4. Alvenarias e Fechamentos', ordem: 4, peso_percentual: 15, progresso: 60, data_inicio: '2026-07-01', data_fim: '2026-09-15', status: 'em_andamento' },
      { id: 'et-5', obra_id: obraId || 'obra-1', etapa_nome: '5. Instalações Hidrossanitárias e Elétricas', ordem: 5, peso_percentual: 15, progresso: 30, data_inicio: '2026-08-15', data_fim: '2026-10-30', status: 'em_andamento' },
      { id: 'et-6', obra_id: obraId || 'obra-1', etapa_nome: '6. Revestimentos e Acabamentos Nobres', ordem: 6, peso_percentual: 20, progresso: 0, data_inicio: '2026-10-15', data_fim: '2026-11-30', status: 'nao_iniciada' },
      { id: 'et-7', obra_id: obraId || 'obra-1', etapa_nome: '7. Pintura e Limpeza Final da Obra', ordem: 7, peso_percentual: 5, progresso: 0, data_inicio: '2026-12-01', data_fim: '2026-12-10', status: 'nao_iniciada' }
    ]
  },

  // COMPRAS & SUPRIMENTOS
  async getPedidosCompra(obraId?: string, orgId?: string): Promise<ObraPedidoCompra[]> {
    if (!orgId) return []
    return [
      {
        id: 'ped-1',
        org_id: orgId,
        obra_id: obraId || 'obra-1',
        obra_nome: 'Residencial Alphaville Lote 14',
        numero: 'PED-4412',
        fornecedor_nome: 'Supermix Concreto S/A',
        data_pedido: '2026-10-15',
        data_entrega_prevista: '2026-10-18',
        valor_total: 18400,
        status: 'entregue',
        itens_descricao: '32m³ Concreto Usinado FCK 30MPa Slump 10±2 com bomba de 36m'
      },
      {
        id: 'ped-2',
        org_id: orgId,
        obra_id: obraId || 'obra-1',
        obra_nome: 'Residencial Alphaville Lote 14',
        numero: 'PED-4419',
        fornecedor_nome: 'Gerdau Aço Comercial',
        data_pedido: '2026-10-20',
        data_entrega_prevista: '2026-10-24',
        valor_total: 31200,
        status: 'aprovado',
        itens_descricao: '4.2 toneladas Aço CA-50 barras de 10mm, 12.5mm e estribos 6.3mm'
      },
      {
        id: 'ped-3',
        org_id: orgId,
        obra_id: obraId || 'obra-1',
        obra_nome: 'Residencial Alphaville Lote 14',
        numero: 'PED-4425',
        fornecedor_nome: 'Tigre Tubos e Conexões',
        data_pedido: '2026-10-21',
        data_entrega_prevista: '2026-10-28',
        valor_total: 12850,
        status: 'cotacao',
        itens_descricao: 'Tubulações de esgoto sanitário, água fria soldável e registros de pressão'
      }
    ]
  }
}
