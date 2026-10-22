export type UserRole = 'dev' | 'admin' | 'corretor' | 'financeiro' | 'juridico' | 'cliente'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'blocked'

export interface SaasPlanFeatures {
  crm?: boolean
  portal?: boolean
  vistorias?: boolean
  subdomain?: boolean
  custom_domain?: boolean
}

export interface SaasPlan {
  id: string
  name: string
  description?: string
  price_monthly: number
  price_annual_monthly: number
  max_properties?: number | null
  max_users?: number | null
  features: SaasPlanFeatures
  popular?: boolean
  badge?: string | null
  active?: boolean
  created_at?: string
  updated_at?: string
}

export type LeadStatus = 'novo' | 'contatado' | 'convertido' | 'descartado'

export interface SaasLead {
  id: string
  name: string
  email: string
  phone: string
  agency_name: string
  subdomain: string
  portfolio_size: string
  plan_id: string
  status: LeadStatus
  notes?: string | null
  created_at: string
  updated_at?: string
}

/** Uma imobiliária. Toda linha de negócio pertence a exatamente uma. */
export interface Organization {
  id: string
  slug: string
  name: string
  cnpj?: string
  phone?: string
  whatsapp?: string
  email?: string
  logo_url?: string
  address?: string
  active: boolean
  plan_id?: string
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string | null
  enabled_modules?: string[]
  created_at: string
  updated_at?: string
}

export type PropertyType = 'apartamento' | 'casa' | 'cobertura' | 'studio' | 'sobrado' | 'comercial' | 'terreno' | 'sala' | 'galpao' | 'loja' | 'chacara' | 'sitio'

export type PropertyStatus = 'disponivel' | 'alugado' | 'vendido' | 'reservado' | 'indisponivel'

export type LeaseStatus = 'ativo' | 'pendente' | 'cancelado' | 'vencido'

/** Como o aluguel de imóvel de terceiro circula. Ver src/lib/repasse.ts. */
export type RepasseModelo = 'via_imobiliaria' | 'direto'

/**
 * Como o aluguel chega ao dono do imóvel, quando o dono também é imobiliária.
 * Em 'propria_com_terceirizacao' a taxa é custo do dono, não receita.
 */
export type GestaoTipo =
  | 'propria_sem_intermediario'
  | 'propria_com_terceirizacao'
  | 'locacao_direta'

/** Quem locou o imóvel: o próprio dono ou outra imobiliária. */
export type OrigemContrato = 'direta' | 'terceiro'

export type SaleStatus = 'em_andamento' | 'concluido' | 'cancelado' | 'pendente'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone?: string
  email?: string
  cpf_cnpj_limpo?: string
  telefone_e164?: string
  avatar_url?: string
  /**
   * Relação do cliente com o negócio. Fica em profiles, e não em clients: a
   * tabela clients saiu de cena quando as duas foram unificadas.
   */
  tipo_relacao?: 'locatario' | 'locador' | 'comprador' | 'vendedor' | 'fiador'
  categoria?: 'pf' | 'pj'
  endereco?: string
  /** Ativo ou inativo como cliente. Não confundir com role, que é equipe ou cliente. */
  status?: 'ativo' | 'inativo'
  observacoes?: string
  /** Imobiliária do usuário. Ausente (null) na conta DEV e em conta ainda não vinculada. */
  org_id?: string
  /** Módulos específicos habilitados para este login (ou herda da org se vazio) */
  enabled_modules?: string[]
  created_at: string
  updated_at?: string
}

export interface Client {
  id: string
  role: UserRole
  full_name: string
  cpf_cnpj?: string
  cpf_cnpj_limpo?: string
  telefone?: string
  telefone_e164?: string
  email?: string
  tipo_relacao?: 'locatario' | 'locador' | 'comprador' | 'vendedor' | 'fiador'
  categoria?: 'pf' | 'pj'
  /** Endereço em texto, montado a partir das partes. Não editar à mão. */
  endereco?: string
  /** Partes do endereço, preenchidas pelo CEP. */
  endereco_cep?: string
  endereco_street?: string
  endereco_number?: string
  endereco_complement?: string
  endereco_neighborhood?: string
  endereco_city?: string
  endereco_state?: string
  status?: 'ativo' | 'inativo'
  observacoes?: string
  org_id?: string
  created_at: string
  updated_at?: string
}

export interface Property {
  id: string
  title: string
  type: PropertyType
  purpose?: 'aluguel' | 'venda' | 'temporada' | 'ambos'
  reference_code?: string
  status: PropertyStatus
  address: string
  address_number?: string
  address_complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area_m2: number
  area_util?: number
  bedrooms?: number
  suites?: number
  bathrooms?: number
  parking?: number
  parking_covered?: boolean
  parking_type?: 'demarcada' | 'livre' | 'nao_informada'
  floor_number?: number
  floor_position?: 'frente' | 'fundos' | 'lateral'
  solar_orientation?: 'nascente' | 'poente' | 'norte' | 'sul' | 'leste' | 'oeste'
  furnished_status?: 'vazio' | 'semimobiliado' | 'mobiliado'
  construction_year?: number
  condition?: 'novo' | 'reformado' | 'usado'
  has_elevator?: boolean
  pet_allowed?: boolean
  available_from?: string
  rent_price: number
  sale_price: number
  description: string
  latitude?: number
  longitude?: number
  reference_point?: string
  proximity_details?: string
  images: string[]
  videos?: string[]
  features: string[]
  iptu?: number
  condo_fee?: number
  gas_fee?: number
  water_fee?: number
  electricity_fee?: number
  other_fees?: number
  deposit_amount?: number
  accepts_guarantor?: boolean
  accepts_insurance?: boolean
  accepts_deposit?: boolean
  accepts_financing?: boolean
  accepts_exchange?: boolean
  accepts_fgts?: boolean
  deed_registered?: boolean
  iptu_paid?: boolean
  occupancy_permit?: boolean
  floor_plan_url?: string
  virtual_tour_url?: string
  owner_id?: string | null
  /** Imóvel de terceiro: como a imobiliária administra. null = próprio. */
  management_type?: 'terceirizado' | 'parceria' | null
  /** Percentual retido do aluguel. null usa a taxa padrão da empresa. */
  management_fee_percent?: number | null
  /**
   * Como o aluguel chega ao dono. Distingue os três papéis de quem é dono e
   * também é imobiliária — ver src/lib/repasse.ts.
   */
  gestao_tipo?: GestaoTipo
  /**
   * Percentual que a imobiliária administradora retém. Só vale em
   * 'propria_com_terceirizacao', onde a taxa é CUSTO do dono.
   */
  taxa_terceirizacao_percent?: number | null
  org_id?: string
  created_at: string
  updated_at: string
}

export interface Lease {
  id: string
  property_id: string
  /**
   * Locatário: o cliente que paga o aluguel. Não confundir com org_id, que é a
   * imobiliária dona do contrato — os dois sentidos convivem nesta tabela.
   */
  tenant_id: string
  landlord_id: string
  monthly_rent: number
  start_date: string
  end_date: string
  status: LeaseStatus
  payment_day: number
  deposit: number
  notes?: string
  /**
   * Como o aluguel circula em imóvel de terceiro: a imobiliária centraliza e
   * repassa ao proprietário, ou cada parte paga direto ao seu. Só é consultado
   * quando o imóvel tem owner_id.
   */
  repasse_modelo?: RepasseModelo
  /** Quem locou o imóvel: o próprio dono ou outra imobiliária. */
  origem_contrato?: OrigemContrato
  signature_status?: 'rascunho' | 'aguardando_assinaturas' | 'assinado' | 'recusado' | 'cancelado'
  signature_provider?: string
  external_document_id?: string
  contract_document_url?: string
  signers?: LeaseSigner[]
  signed_at?: string
  org_id?: string
  created_at: string
}

export interface LeaseSigner {
  id?: string
  name: string
  email: string
  cpf?: string
  role: 'locatario' | 'locador' | 'fiador' | 'testemunha' | 'imobiliaria'
  status: 'pendente' | 'assinado' | 'recusado'
  signed_at?: string
  ip_address?: string
  signature_hash?: string
}

export interface Sale {
  id: string
  property_id: string
  buyer_id: string
  seller_id: string
  price: number
  status: SaleStatus
  contract_date?: string
  notes?: string
  org_id?: string
  created_at: string
}

export interface Payment {
  id: string
  lease_id: string
  tenant_id: string
  amount: number
  due_date: string
  paid_date?: string
  status: 'pendente' | 'pago' | 'atrasado'
  description?: string
  reported_paid_by_client?: boolean
  reported_paid_at?: string
  org_id?: string
  created_at: string
}

export interface Document {
  id: string
  title: string
  type: string
  file_path: string
  entity_type: 'property' | 'lease' | 'sale' | 'user'
  entity_id: string
  uploaded_by: string
  notes?: string
  org_id?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  entity_type?: string
  entity_id?: string
  org_id?: string
  created_at: string
}

export interface LeaseHistory {
  id: string
  lease_id: string
  type: 'created' | 'updated' | 'renewed' | 'cancelled' | 'closed'
  detail?: string
  created_by: string
  org_id?: string
  created_at: string
}

export interface DashboardStats {
  total_properties: number
  available_properties: number
  rented_properties: number
  sold_properties: number
  total_leases: number
  active_leases: number
  total_sales: number
  pending_payments: number
  total_pending_amount: number
  total_collected: number
}

// ---------------------------------------------------------------------------
// CRM LEADS & SMART MATCH
// ---------------------------------------------------------------------------

export type CrmLeadStage = 'novo' | 'contato' | 'visita' | 'proposta' | 'fechado' | 'perdido'
export type CrmInterestType = 'locacao' | 'venda' | 'ambos'

export interface CrmLead {
  id: string
  org_id?: string
  profile_id?: string | null
  name: string
  email?: string | null
  phone?: string | null
  origin?: string | null
  interest_type: CrmInterestType
  property_type?: PropertyType | null
  max_budget?: number | null
  min_bedrooms?: number | null
  preferred_neighborhoods?: string[]
  stage: CrmLeadStage
  assigned_to?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string
}

export interface CrmInteraction {
  id: string
  org_id?: string
  lead_id: string
  user_id?: string | null
  type: 'whatsapp' | 'ligacao' | 'visita' | 'email' | 'nota'
  notes: string
  created_at: string
}

// ---------------------------------------------------------------------------
// VISTORIAS DIGITAIS (INSPECTIONS)
// ---------------------------------------------------------------------------

export type InspectionType = 'entrada' | 'saida' | 'periodica'
export type InspectionStatus = 'pendente' | 'aprovada' | 'contestada' | 'finalizada'
export type InspectionItemCondition = 'novo' | 'bom' | 'regular' | 'com_avarias'

export interface PropertyInspection {
  id: string
  org_id?: string
  property_id: string
  lease_id?: string | null
  inspector_id?: string | null
  type: InspectionType
  status: InspectionStatus
  inspection_date: string
  general_notes?: string | null
  tenant_comments?: string | null
  tenant_approved_at?: string | null
  created_at: string
  updated_at?: string
}

export interface InspectionItem {
  id: string
  org_id?: string
  inspection_id: string
  room: string
  item_name: string
  condition: InspectionItemCondition
  notes?: string | null
  photos: string[]
  created_at: string
}
