import { describe, it, expect } from 'vitest'
import { generateRentalContract } from '../contractGenerator'
import type { Lease, Property, Profile, Organization } from '@/types'

describe('contractGenerator.ts', () => {
  const mockLease: Lease = {
    id: '12345678-abcd-ef00-1122-334455667788',
    property_id: 'p1',
    landlord_id: 'owner1',
    tenant_id: 'tenant1',
    monthly_rent: 2500,
    payment_day: 10,
    start_date: '2026-05-01',
    end_date: '2028-10-31',
    deposit: 5000,
    status: 'ativo',
    created_at: new Date().toISOString(),
  }

  const mockProperty: Property = {
    id: 'p1',
    title: 'Edifício Horizon',
    type: 'apartamento',
    status: 'alugado',
    address: 'Av. Paulista',
    address_number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-100',
    area_m2: 80,
    rent_price: 2500,
    sale_price: 600000,
    description: 'Apartamento com vista',
    images: [],
    features: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockLandlord: Profile = {
    id: 'owner1',
    full_name: 'Roberto Locador',
    cpf_cnpj_limpo: '12345678900',
    email: 'roberto@example.com',
    role: 'cliente',
    created_at: new Date().toISOString(),
  }

  const mockTenant: Profile = {
    id: 'tenant1',
    full_name: 'Juliana Inquilina',
    cpf_cnpj_limpo: '98765432100',
    email: 'juliana@example.com',
    role: 'cliente',
    created_at: new Date().toISOString(),
  }

  const mockOrg: Organization = {
    id: 'org1',
    slug: 'domus',
    name: 'Domus Imobiliária',
    cnpj: '12.345.678/0001-90',
    active: true,
    created_at: new Date().toISOString(),
  }

  it('gera minuta de contrato com número de contrato e qualificação completa das partes', () => {
    const contract = generateRentalContract({
      lease: mockLease,
      property: mockProperty,
      landlord: mockLandlord,
      tenant: mockTenant,
      organization: mockOrg,
    })

    expect(contract.contractNumber).toBe('DOMUS-12345678')
    expect(contract.plainText).toContain('Roberto Locador')
    expect(contract.plainText).toContain('Juliana Inquilina')
    expect(contract.plainText).toContain('Av. Paulista, nº 1000')
    expect(contract.plainText).toContain('2.500,00')
    expect(contract.plainText).toContain('Lei nº 8.245/1991')
    expect(contract.htmlContent).toContain('contract-document')
  })

  it('inclui fiador na lista de signatários quando fornecido', () => {
    const mockGuarantor: Profile = {
      id: 'g1',
      full_name: 'Marcos Fiador',
      cpf_cnpj_limpo: '11122233344',
      email: 'marcos@example.com',
      role: 'cliente',
      created_at: new Date().toISOString(),
    }

    const contract = generateRentalContract({
      lease: mockLease,
      property: mockProperty,
      landlord: mockLandlord,
      tenant: mockTenant,
      guarantor: mockGuarantor,
      organization: mockOrg,
    })

    const roles = contract.signers.map((s) => s.role)
    expect(roles).toContain('locador')
    expect(roles).toContain('locatario')
    expect(roles).toContain('fiador')
    expect(roles).toContain('imobiliaria')
  })
})
