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
  created_at: string
}

export interface Property {
  id: string
  title: string
  type: PropertyType
  status: PropertyStatus
  address: string
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
  features: string[]
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