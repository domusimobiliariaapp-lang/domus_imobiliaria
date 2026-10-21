/**
 * Gerador de Feed XML para Portais Imobiliários
 * Padrão oficial VRSync (Grupo OLX: ZAP Imóveis, VivaReal, OLX Brasil)
 * Compatível também com Chaves na Mão, Imovelweb e agregadores nacionais.
 */

import type { Property, Organization, PropertyType } from '@/types'

/** Mapeamento de tipos internos para o padrão internacional do VRSync / Grupo OLX */
const VIVAREAL_TYPE_MAP: Record<PropertyType, string> = {
  apartamento: 'Residential / Apartment',
  casa: 'Residential / Home',
  cobertura: 'Residential / Penthouse',
  studio: 'Residential / Studio',
  sobrado: 'Residential / Sobrado',
  comercial: 'Commercial / Building',
  terreno: 'Land / Residential',
  sala: 'Commercial / Office',
  galpao: 'Commercial / Industrial',
  loja: 'Commercial / Retail',
  chacara: 'Residential / Farm Ranch',
  sitio: 'Residential / Farm Ranch',
}

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return ''
  const str = String(unsafe)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface GenerateFeedOptions {
  properties: Property[]
  organization: Pick<Organization, 'name' | 'slug' | 'email' | 'phone'>
  baseUrl?: string
}

/**
 * Gera a string XML completa no formato VRSync
 */
export function generateVRSyncXml({
  properties,
  organization,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://domus.app',
}: GenerateFeedOptions): string {
  const publishDate = new Date().toISOString()
  const availableProps = properties.filter((p) => p.status === 'disponivel')

  const listingsXml = availableProps
    .map((p) => {
      const listingId = escapeXml(p.reference_code || p.id.slice(0, 8).toUpperCase())
      const title = escapeXml(p.title)
      const desc = escapeXml(p.description || p.title)

      let transactionType = 'For Rent'
      if (p.purpose === 'venda' || (p.sale_price > 0 && p.rent_price === 0)) {
        transactionType = 'For Sale'
      } else if (p.purpose === 'ambos' || (p.sale_price > 0 && p.rent_price > 0)) {
        transactionType = 'Sale/Rent'
      }

      const detailUrl = `${baseUrl}/${organization.slug}/imovel/${p.id}`

      // Fotos
      const mediaXml = (p.images || [])
        .map(
          (img, idx) =>
            `        <Item medium="image" caption="Foto ${idx + 1}">${escapeXml(img)}</Item>`,
        )
        .join('\n')

      // Características
      const featuresXml = (p.features || [])
        .map((f) => `          <Feature>${escapeXml(f)}</Feature>`)
        .join('\n')

      const vrType = VIVAREAL_TYPE_MAP[p.type] || 'Residential / Apartment'

      return `    <Listing>
      <ListingID>${listingId}</ListingID>
      <Title>${title}</Title>
      <TransactionType>${transactionType}</TransactionType>
      <DetailViewUrl>${escapeXml(detailUrl)}</DetailViewUrl>
      <Media>
${mediaXml || '        <Item medium="image" caption="Sem foto"></Item>'}
      </Media>
      <Details>
        <PropertyType>${vrType}</PropertyType>
        <Description>${desc}</Description>
        ${p.sale_price > 0 ? `<ListPrice currency="BRL">${p.sale_price}</ListPrice>` : ''}
        ${p.rent_price > 0 ? `<RentalPrice currency="BRL" period="Monthly">${p.rent_price}</RentalPrice>` : ''}
        ${p.condo_fee && p.condo_fee > 0 ? `<PropertyAdministrationFee currency="BRL">${p.condo_fee}</PropertyAdministrationFee>` : ''}
        ${p.iptu && p.iptu > 0 ? `<YearlyTax currency="BRL">${p.iptu}</YearlyTax>` : ''}
        <LivingArea unit="square metres">${p.area_util || p.area_m2 || 0}</LivingArea>
        <LotArea unit="square metres">${p.area_m2 || 0}</LotArea>
        <Bedrooms>${p.bedrooms || 0}</Bedrooms>
        <Bathrooms>${p.bathrooms || 0}</Bathrooms>
        <Suites>${p.suites || 0}</Suites>
        <Garage type="Parking Space">${p.parking || 0}</Garage>
        <Features>
${featuresXml}
        </Features>
      </Details>
      <Location displayAddress="All">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${escapeXml(p.state)}">${escapeXml(p.state)}</State>
        <City>${escapeXml(p.city)}</City>
        <Neighborhood>${escapeXml(p.neighborhood)}</Neighborhood>
        <Address>${escapeXml(p.address)}</Address>
        <StreetNumber>${escapeXml(p.address_number || 'S/N')}</StreetNumber>
        <PostalCode>${escapeXml(p.zip_code)}</PostalCode>
        ${p.latitude ? `<Latitude>${p.latitude}</Latitude>` : ''}
        ${p.longitude ? `<Longitude>${p.longitude}</Longitude>` : ''}
      </Location>
    </Listing>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com.br/schemas/1.0/VRSync" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vivareal.com.br/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>${escapeXml(organization.name)}</Provider>
    <Email>${escapeXml(organization.email || 'contato@domus.app')}</Email>
    <ContactName>${escapeXml(organization.name)}</ContactName>
    <PublishDate>${publishDate}</PublishDate>
  </Header>
  <Listings>
${listingsXml}
  </Listings>
</ListingDataFeed>`
}

/**
 * Dispara o download imediato do arquivo XML no navegador do usuário
 */
export function downloadVRSyncXml(
  properties: Property[],
  organization: Pick<Organization, 'name' | 'slug' | 'email' | 'phone'>,
  filename?: string,
): void {
  const xmlContent = generateVRSyncXml({ properties, organization })
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `imoveis-${organization.slug}-vrsync.xml`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
