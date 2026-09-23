export type UserRole = 'admin' | 'corretor' | 'financeiro' | 'juridico' | 'cliente'

export type PropertyType = 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'sala' | 'galpao' | 'loja'

export type PropertyStatus = 'disponivel' | 'alugado' | 'vendido' | 'reservado' | 'indisponivel'

export type LeaseStatus = 'ativo' | 'pendente' | 'cancelado' | 'vencido'

export type SaleStatus = 'em_andamento' | 'concluido' | 'cancelado' | 'pendente'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone?: string
  email?: string
  cpf_cnpj_limpo?: string
  telefone_e164?: string
  client_id?: string
  avatar_url?: string
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
  endereco?: string
  status?: 'ativo' | 'inativo'
  observacoes?: string
  created_at: string
  updated_at?: string
}

export interface Property {
  id: string
  title: string
  type: PropertyType
  status: PropertyStatus
  address: string
  address_number?: string
  address_complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area_m2: number
  bedrooms?: number
  bathrooms?: number
  parking?: number
  rent_price: number
  sale_price: number
  description: string
  images: string[]
  videos?: string[]
  features: string[]
  iptu?: number
  condo_fee?: number
  gas_fee?: number
  water_fee?: number
  electricity_fee?: number
  other_fees?: number
  owner_id?: string
  created_at: string
  updated_at: string
}

export interface Lease {
  id: string
  property_id: string
  tenant_id: string
  landlord_id: string
  monthly_rent: number
  start_date: string
  end_date: string
  status: LeaseStatus
  payment_day: number
  deposit: number
  notes?: string
  created_at: string
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
  created_at: string
}

export interface LeaseHistory {
  id: string
  lease_id: string
  type: 'created' | 'updated' | 'renewed' | 'cancelled' | 'closed'
  detail?: string
  created_by: string
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