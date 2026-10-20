import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { X, Plus, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ImageGalleryUploader } from './ImageGalleryUploader'
import { useR2Upload } from '@/hooks/useR2Upload'
import { PROPERTY_FEATURES } from '@/lib/propertyFeatures'
import { lookupCep } from '@/lib/cepLookup'
import { formatCep, formatDecimal, formatCurrencyInput, parseDecimal, parseCurrencyInput } from '@/lib/inputMasks'
import { calcularRepasseLocacao, formatBRL, GESTAO_DESCRICOES } from '@/lib/repasse'
import type { GestaoTipo } from '@/types'
import { PropertyLocationPicker } from './PropertyLocationPicker'
import { FeeTermsEditor } from './FeeTermsEditor'
import { useProfiles } from '@/hooks/useSupabase'

interface PropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: any
  onSave: (data: any) => Promise<boolean>
  saving?: boolean
}

const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'studio', label: 'Kitnet / Studio' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala', label: 'Sala' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'loja', label: 'Loja' },
  { value: 'chacara', label: 'Chácara' },
  { value: 'sitio', label: 'Sítio' },
]

const PROPERTY_STATUSES = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'alugado', label: 'Alugado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'indisponivel', label: 'Indisponível' },
]

export function PropertyModal({ open, onOpenChange, item, onSave, saving = false }: PropertyModalProps) {
  const isEditing = !!item
  const { uploadFile, uploading: uploadingPlan } = useR2Upload()
  // Só os clientes podem ser proprietários. Um corretor da equipe como dono
  // faria o repasse apontar para dentro da equipe, que é o que o modelo de
  // três papéis exclui.
  const { data: profiles } = useProfiles()
  const proprietarios = (profiles || []).filter((p) => p.role === 'cliente')

  const [activeTab, setActiveTab] = useState('basicos')
  const [locating, setLocating] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null)
  const currentCep = useRef('')
  const lastFetchedCep = useRef<string | null>(null)
  const inflightCep = useRef<string | null>(null)
  const lookupRequest = useRef(0)
  const lastAddressLookup = useRef<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    reference_code: '',
    type: 'apartamento',
    purpose: 'aluguel',
    status: 'disponivel',
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    area_m2: 0,
    area_util: 0,
    latitude: '',
    longitude: '',
    reference_point: '',
    proximity_details: '',
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parking: 0,
    parking_covered: false,
    parking_type: 'nao_informada',
    floor_number: '',
    floor_position: 'frente',
    solar_orientation: 'nascente',
    furnished_status: 'vazio',
    construction_year: '',
    condition: 'usado',
    has_elevator: false,
    pet_allowed: false,
    available_from: '',
    features: [] as string[],
    rent_price: 0,
    sale_price: 0,
    condo_fee: 0,
    iptu: 0,
    deposit_amount: 0,
    accepts_guarantor: false,
    accepts_insurance: false,
    accepts_deposit: false,
    accepts_financing: false,
    accepts_exchange: false,
    accepts_fgts: false,
    description: '',
    images: [] as string[],
    videos: [] as string[],
    virtual_tour_url: '',
    floor_plan_url: '',
    deed_registered: false,
    iptu_paid: false,
    occupancy_permit: false,
    // Gestão de imóvel de terceiro. owner_id vazio = imóvel próprio da
    // imobiliária, que é o padrão e não precisa de mais nada preenchido.
    owner_id: '',
    gestao_tipo: 'propria_sem_intermediario' as GestaoTipo,
    taxa_terceirizacao_percent: '',
  })

  useEffect(() => {
    currentCep.current = item?.zip_code?.replace(/\D/g, '') || ''
    lastFetchedCep.current = null
    inflightCep.current = null
    lookupRequest.current += 1
    lastAddressLookup.current = null
    setLocationMessage('')
    setMapCenter(item?.latitude != null && item?.longitude != null ? { latitude: Number(item.latitude), longitude: Number(item.longitude) } : null)
    if (item) {
      setFormData({
        title: item.title || '',
        reference_code: item.reference_code || '',
        type: item.type || 'apartamento',
        purpose: item.purpose || 'aluguel',
        status: item.status || 'disponivel',
        address: item.address || '',
        address_number: item.address_number || '',
        address_complement: item.address_complement || '',
        neighborhood: item.neighborhood || '',
        city: item.city || '',
        state: item.state || '',
        zip_code: item.zip_code || '',
        area_m2: item.area_m2 || 0,
        area_util: item.area_util || 0,
        latitude: item.latitude?.toString() || '', longitude: item.longitude?.toString() || '',
        reference_point: item.reference_point || '', proximity_details: item.proximity_details || '',
        bedrooms: item.bedrooms || 0,
        suites: item.suites || 0,
        bathrooms: item.bathrooms || 0,
        parking: item.parking || 0,
        parking_covered: item.parking_covered || false, parking_type: item.parking_type || 'nao_informada',
        floor_number: item.floor_number?.toString() || '', floor_position: item.floor_position || 'frente',
        solar_orientation: item.solar_orientation || 'nascente', furnished_status: item.furnished_status || 'vazio',
        construction_year: item.construction_year?.toString() || '', condition: item.condition || 'usado',
        has_elevator: item.has_elevator || false, pet_allowed: item.pet_allowed || false,
        available_from: item.available_from || '',
        features: item.features || [],
        rent_price: item.rent_price || 0,
        sale_price: item.sale_price || 0,
        condo_fee: item.condo_fee || 0,
        iptu: item.iptu || 0,
        deposit_amount: item.deposit_amount || 0,
        accepts_guarantor: item.accepts_guarantor || false, accepts_insurance: item.accepts_insurance || false, accepts_deposit: item.accepts_deposit || false,
        accepts_financing: item.accepts_financing || false, accepts_exchange: item.accepts_exchange || false, accepts_fgts: item.accepts_fgts || false,
        description: item.description || '',
        images: item.images || [],
        videos: item.videos || [],
        virtual_tour_url: '',
        floor_plan_url: item.floor_plan_url || '', deed_registered: item.deed_registered || false,
        iptu_paid: item.iptu_paid || false, occupancy_permit: item.occupancy_permit || false,
        owner_id: item.owner_id || '',
        gestao_tipo: (item.gestao_tipo || 'propria_sem_intermediario') as GestaoTipo,
        taxa_terceirizacao_percent: item.taxa_terceirizacao_percent != null ? String(item.taxa_terceirizacao_percent) : '',
      })
      setActiveTab('basicos')
    } else {
      setFormData(prev => ({
        ...prev,
        title: '', reference_code: '', type: 'apartamento', purpose: 'aluguel', status: 'disponivel',
        address: '', address_number: '', address_complement: '', neighborhood: '', city: '', state: '', zip_code: '',
        area_m2: 0, area_util: 0, latitude: '', longitude: '', reference_point: '', proximity_details: '',
        bedrooms: 0, suites: 0, bathrooms: 0, parking: 0, parking_covered: false, parking_type: 'nao_informada',
        floor_number: '', floor_position: 'frente', solar_orientation: 'nascente', furnished_status: 'vazio',
        construction_year: '', condition: 'usado', has_elevator: false, pet_allowed: false, available_from: '',
        features: [], rent_price: 0, sale_price: 0, condo_fee: 0, iptu: 0, deposit_amount: 0,
        accepts_guarantor: false, accepts_insurance: false, accepts_deposit: false,
        accepts_financing: false, accepts_exchange: false, accepts_fgts: false,
        description: '', images: [], videos: [], virtual_tour_url: '', floor_plan_url: '',
        deed_registered: false, iptu_paid: false, occupancy_permit: false,
        owner_id: '', gestao_tipo: 'propria_sem_intermediario', taxa_terceirizacao_percent: '',
      }))
      setActiveTab('basicos')
    }
  }, [item])

  // Prévia da taxa de administração na aba Gestão. É a mesma função que o
  // financeiro usa, de propósito: se a prévia mostrasse um valor e o repasse
  // cobrasse outro, a equipe perderia a confiança nos dois.
  const rentNumerico = Number(formData.rent_price) || 0
  const taxaTerceirizacao =
    formData.taxa_terceirizacao_percent === '' ? null : Number(formData.taxa_terceirizacao_percent)
  // A prévia usa o aluguel cheio, e não o que foi pago: é uma projeção de
  // quanto fica se o locatário pagar em dia. O relatório do Financeiro é que
  // usa o valor pago — a taxa de um mês só existe quando o dinheiro entra.
  const { taxas: taxaValor, liquido: liquidoPrevisto } = calcularRepasseLocacao({
    monthlyRent: rentNumerico,
    pagoNoPeriodo: rentNumerico,
    termos: taxaTerceirizacao
      ? [{
          id: 'preview',
          property_id: '',
          kind: 'administracao',
          incide_em: 'locacao',
          base: 'percentual',
          percentual: taxaTerceirizacao,
        }]
      : [],
  })
  // Só há o que mostrar quando existe aluguel e existe taxa: a prévia de um
  // imóvel sem valor é uma tela vazia que só confunde.
  const temTaxa = rentNumerico > 0 && taxaValor > 0

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateAddressField = (field: string, value: string) => {
    lookupRequest.current += 1
    inflightCep.current = null
    setLocating(false)
    if (field === 'zip_code') {
      currentCep.current = value.replace(/\D/g, '')
      lastFetchedCep.current = null
    }
    else if (field !== 'address_number') currentCep.current = ''
    setFormData(prev => ({
      ...prev,
      [field]: value,
      zip_code: field === 'zip_code' ? value : field === 'address_number' ? prev.zip_code : '',
      latitude: '',
      longitude: '',
    }))
    if (field !== 'address_number') setMapCenter(null)
    setLocationMessage('Localização alterada. Confira o marcador no mapa antes de salvar.')
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const handleCepBlur = async (cep: string) => {
    const numbers = cep.replace(/\D/g, '')
    if (numbers.length !== 8 || lastFetchedCep.current === numbers || inflightCep.current === numbers) return
    const request = ++lookupRequest.current
    inflightCep.current = numbers
    setLocating(true)
    setLocationMessage('Buscando o endereço do CEP...')
    try {
      const found = await lookupCep(numbers)
      if (request !== lookupRequest.current || numbers !== currentCep.current) return
      setFormData(prev => ({
        ...prev,
        address: found.street,
        neighborhood: found.neighborhood,
        city: found.city,
        state: found.state,
      }))
      setMapCenter(
        found.latitude !== null && found.longitude !== null
          ? { latitude: found.latitude, longitude: found.longitude }
          : null,
      )
      lastFetchedCep.current = numbers
      setLocationMessage(found.latitude !== null ? 'Endereço atualizado. O mapa abriu na região do CEP; clique no local exato do imóvel para posicionar o marcador.' : 'Endereço atualizado. Informe a latitude e longitude para mostrar o mapa.')
    } catch {
      if (request === lookupRequest.current) setLocationMessage('Não foi possível localizar o CEP. Confira os dados do endereço.')
    } finally {
      if (inflightCep.current === numbers) inflightCep.current = null
      if (request === lookupRequest.current) setLocating(false)
    }
  }

  const handleAddressBlur = async () => {
    const { address, city, state, neighborhood, zip_code } = formData
    if (zip_code.replace(/\D/g, '').length === 8 || address.trim().length < 3 || city.trim().length < 3 || state.trim().length !== 2) return
    const searchKey = `${state}|${city}|${address}|${neighborhood}`.toLocaleLowerCase('pt-BR')
    if (lastAddressLookup.current === searchKey) return
    lastAddressLookup.current = searchKey
    setLocating(true)
    setLocationMessage('Buscando o CEP e a posição do endereço...')
    try {
      const url = `https://viacep.com.br/ws/${encodeURIComponent(state)}/${encodeURIComponent(city)}/${encodeURIComponent(address)}/json/`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Endereço não encontrado')
      const matches = await response.json()
      if (!Array.isArray(matches) || !matches.length) throw new Error('Endereço não encontrado')
      const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR')
      const exactStreet = matches.filter((match: { logradouro?: string }) => normalize(match.logradouro || '') === normalize(address))
      const streetMatches = exactStreet.length ? exactStreet : matches
      const neighborhoodMatches = neighborhood.trim() ? streetMatches.filter((match: { bairro?: string }) => normalize(match.bairro || '') === normalize(neighborhood)) : streetMatches
      const bestMatches = neighborhoodMatches.length ? neighborhoodMatches : streetMatches
      if (bestMatches.length !== 1) {
        setLocationMessage('Há mais de um CEP para este endereço. Informe o CEP para localizar o imóvel.')
        return
      }
      const foundCep = String(bestMatches[0].cep || '').replace(/\D/g, '')
      if (foundCep.length !== 8) throw new Error('CEP não encontrado')
      currentCep.current = foundCep
      updateField('zip_code', foundCep.replace(/^(\d{5})(\d{3})$/, '$1-$2'))
      await handleCepBlur(foundCep)
    } catch {
      setLocationMessage('Não foi possível localizar esse endereço. Informe o CEP ou ajuste as coordenadas.')
    } finally {
      setLocating(false)
    }
  }

  const handleSave = async () => {
    const hasLatitude = formData.latitude !== ''
    const hasLongitude = formData.longitude !== ''
    const latitude = Number(formData.latitude)
    const longitude = Number(formData.longitude)
    if (hasLatitude !== hasLongitude || (hasLatitude && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180))) {
      setLocationMessage('Informe latitude e longitude válidas ou marque o ponto no mapa.')
      setActiveTab('basicos')
      return
    }
    const data = {
      ...formData,
      images: formData.images || [],
      videos: formData.videos || [],
      features: formData.features || [],
      rent_price: Number(formData.rent_price) || 0,
      sale_price: Number(formData.sale_price) || 0,
      area_m2: Number(formData.area_m2) || 0,
      area_util: Number(formData.area_util) || 0,
      latitude: formData.latitude === '' ? null : Number(formData.latitude),
      longitude: formData.longitude === '' ? null : Number(formData.longitude),
      floor_number: formData.floor_number === '' ? null : Number(formData.floor_number),
      construction_year: formData.construction_year === '' ? null : Number(formData.construction_year),
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      parking: Number(formData.parking) || 0,
      condo_fee: Number(formData.condo_fee) || 0,
      iptu: Number(formData.iptu) || 0,
      deposit_amount: Number(formData.deposit_amount) || 0,
      // Vazio vira null, não string vazia: a coluna é UUID e TEXT com CHECK, e
      // a string vazia passaria no insert e quebraria a conferência "tem
      // proprietário?" no banco.
      owner_id: formData.owner_id || null,
      gestao_tipo: formData.gestao_tipo || 'propria_sem_intermediario',
      taxa_terceirizacao_percent: formData.taxa_terceirizacao_percent === '' ? null : Number(formData.taxa_terceirizacao_percent),
    }
    const saved = await onSave(data)
    if (!saved) return
    if (!isEditing) {
      setFormData({
        title: '', reference_code: '', type: 'apartamento', purpose: 'aluguel', status: 'disponivel',
        address: '', address_number: '', address_complement: '', neighborhood: '',
        city: '', state: '', zip_code: '', area_m2: 0, area_util: 0, latitude: '', longitude: '', reference_point: '', proximity_details: '',
        bedrooms: 0, suites: 0, bathrooms: 0, parking: 0, parking_covered: false, parking_type: 'nao_informada', floor_number: '', floor_position: 'frente', solar_orientation: 'nascente', furnished_status: 'vazio', construction_year: '', condition: 'usado', has_elevator: false, pet_allowed: false, available_from: '', features: [],
        rent_price: 0, sale_price: 0, condo_fee: 0, iptu: 0, deposit_amount: 0,
        accepts_guarantor: false, accepts_insurance: false, accepts_deposit: false,
        accepts_financing: false, accepts_exchange: false, accepts_fgts: false,
        description: '', images: [], videos: [], virtual_tour_url: '', floor_plan_url: '', deed_registered: false, iptu_paid: false, occupancy_permit: false,
        owner_id: '', gestao_tipo: 'propria_sem_intermediario' as GestaoTipo, taxa_terceirizacao_percent: '',
      })
      setActiveTab('basicos')
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-[#F7F5F0] rounded-t-lg">
          <div>
            <h2 className="text-xl font-serif font-medium text-primary">
              {isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditing ? 'Atualize as informações do imóvel' : 'Preencha os dados para cadastrar um novo imóvel'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-border/40">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start gap-2 bg-transparent border-b-2">
              <TabsTrigger value="basicos" className="rounded-none px-4 py-3 border-b-2 -mb-px data-[state=active]:border-[#AD7B3B] data-[state=active]:text-[#17323D]">
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="estrutura" className="rounded-none px-4 py-3 border-b-2 -mb-px data-[state=active]:border-[#AD7B3B] data-[state=active]:text-[#17323D]">
                Estrutura
              </TabsTrigger>
              <TabsTrigger value="valores" className="rounded-none px-4 py-3 border-b-2 -mb-px data-[state=active]:border-[#AD7B3B] data-[state=active]:text-[#17323D]">
                Valores
              </TabsTrigger>
              <TabsTrigger value="midia" className="rounded-none px-4 py-3 border-b-2 -mb-px data-[state=active]:border-[#AD7B3B] data-[state=active]:text-[#17323D]">
                Mídia
              </TabsTrigger>
              <TabsTrigger value="gestao" className="rounded-none px-4 py-3 border-b-2 -mb-px data-[state=active]:border-[#AD7B3B] data-[state=active]:text-[#17323D]">
                Gestão
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Aba 1: Dados Básicos */}
            <TabsContent value="basicos" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título do Anúncio</Label>
                  <Input
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value)}
                    placeholder="Ex: Edifício Costa do Sol"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2"><Label>Código / referência interna</Label><Input value={formData.reference_code} onChange={(e) => updateField('reference_code', e.target.value)} placeholder="Ex.: DOM-001" className="bg-[#EEECE5] focus:bg-white" /></div>
                <div className="space-y-2"><Label>Finalidade</Label><Select value={formData.purpose} onValueChange={(v) => updateField('purpose', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aluguel">Locação</SelectItem><SelectItem value="venda">Venda</SelectItem><SelectItem value="temporada">Temporada</SelectItem><SelectItem value="ambos">Locação e venda</SelectItem></SelectContent></Select></div>

                <div className="space-y-2">
                  <Label>Tipo do Imóvel</Label>
                  <Select value={formData.type} onValueChange={(v: string) => updateField('type', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: string) => updateField('status', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* O CEP vem primeiro de propósito: é o único campo do endereço
                    que se descobre sozinho. Quem digita os 8 dígitos recebe
                    logradouro, bairro, cidade e UF preenchidos, e o número fica
                    por conta da pessoa. Começar pelo endereço exigiria saber a
                    rua antes de saber o CEP. */}
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formatCep(formData.zip_code)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const masked = formatCep(e.target.value)
                      updateAddressField('zip_code', masked)
                      if (masked.replace(/\D/g, '').length === 8) void handleCepBlur(masked)
                    }}
                    onBlur={() => handleCepBlur(formData.zip_code)}
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.address_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAddressField('address_number', e.target.value)}
                    placeholder="Nº"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAddressField('address', e.target.value)}
                    onBlur={handleAddressBlur}
                    placeholder="Rua, avenida..."
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.address_complement}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('address_complement', e.target.value)}
                    placeholder="Apto, Bloco, etc."
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAddressField('neighborhood', e.target.value)}
                    onBlur={handleAddressBlur}
                    placeholder="Bairro"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAddressField('city', e.target.value)}
                    onBlur={handleAddressBlur}
                    placeholder="Cidade"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Input
                    value={formData.state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAddressField('state', e.target.value.toUpperCase().slice(0, 2))}
                    onBlur={handleAddressBlur}
                    placeholder="UF"
                    maxLength={2}
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)}
                    placeholder="Descrição detalhada do imóvel"
                    rows={4}
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2"><Label>Ponto de referência</Label><Input value={formData.reference_point} onChange={(e) => updateField('reference_point', e.target.value)} placeholder="Próximo ao Shopping..." className="bg-[#EEECE5] focus:bg-white" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Proximidades e distâncias</Label><Textarea value={formData.proximity_details} onChange={(e) => updateField('proximity_details', e.target.value)} placeholder="Metrô a 5 min, escola a 800 m, mercado na esquina..." rows={2} className="bg-[#EEECE5] focus:bg-white" /></div>
                <div className="space-y-2"><Label>Latitude</Label><Input type="number" min={-90} max={90} step="0.0000001" value={formData.latitude} onChange={(e) => updateField('latitude', e.target.value)} placeholder="-23.550520" className="bg-[#EEECE5] focus:bg-white" /></div>
                <div className="space-y-2"><Label>Longitude</Label><Input type="number" min={-180} max={180} step="0.0000001" value={formData.longitude} onChange={(e) => updateField('longitude', e.target.value)} placeholder="-46.633308" className="bg-[#EEECE5] focus:bg-white" /></div>
                <p className="md:col-span-2 flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">{locating && <Loader2 className="h-4 w-4 animate-spin" />}{locationMessage || 'O CEP posiciona o mapa na região. Clique no local exato do imóvel para definir o marcador público.'}</p>
                {!mapCenter && formData.zip_code.replace(/\D/g, '').length === 8 && <Button type="button" variant="outline" className="md:col-span-2 w-fit" disabled={locating} onClick={() => void handleCepBlur(formData.zip_code)}>Mostrar mapa pelo CEP</Button>}
                {(() => {
                  const latitude = Number(formData.latitude)
                  const longitude = Number(formData.longitude)
                  const selected = formData.latitude !== '' && formData.longitude !== '' && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null
                  const center = selected || mapCenter
                  return center && <div className="md:col-span-2 space-y-2">
                    <Label>Confirme a localização no mapa</Label>
                    <PropertyLocationPicker center={center} selected={selected} onSelect={({ latitude: lat, longitude: lon }) => {
                      setFormData(prev => ({ ...prev, latitude: lat.toFixed(7), longitude: lon.toFixed(7) }))
                      setLocationMessage('Ponto exato definido no mapa. Salve o cadastro para atualizar a página pública.')
                    }} />
                    <p className="text-xs text-muted-foreground">Arraste o mapa e clique no imóvel para posicionar o marcador. Dados do mapa © OpenStreetMap colaboradores.</p>
                  </div>
                })()}
              </div>
            </TabsContent>

            {/* Aba 2: Estrutura */}
            <TabsContent value="estrutura" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Áreas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Área Total (m²)</Label>
                    <Input
                      value={formatDecimal(formData.area_m2)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('area_m2', parseDecimal(e.target.value))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Área Útil (m²)</Label>
                    <Input
                      value={formatDecimal(formData.area_util)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('area_util', parseDecimal(e.target.value))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Ambientes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'bedrooms', label: 'Quartos' },
                    { key: 'suites', label: 'Suítes' },
                    { key: 'bathrooms', label: 'Banheiros' },
                    { key: 'parking', label: 'Vagas' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateField(key, Math.max(0, (formData as any)[key] - 1))}
                          className="h-10 w-10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={(formData as any)[key] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(key, parseInt(e.target.value) || 0)}
                          className="text-center bg-[#EEECE5] focus:bg-white h-10"
                          min={0}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateField(key, ((formData as any)[key] || 0) + 1)}
                          className="h-10 w-10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Infraestrutura & Diferenciais</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PROPERTY_FEATURES.map((feature) => (
                    <label
                      key={feature.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.features.includes(feature.value)
                          ? 'border-[#AD7B3B] bg-[#AD7B3B]/10'
                          : 'border-border/40 bg-[#EEECE5] hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.value)}
                        onChange={() => toggleFeature(feature.value)}
                        className="sr-only"
                      />
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        formData.features.includes(feature.value)
                          ? 'bg-[#AD7B3B] border-[#AD7B3B]'
                          : 'border-muted-foreground/40'
                      }`}>
                        {formData.features.includes(feature.value) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <feature.icon className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Andar</Label><Input type="number" min={0} value={formData.floor_number} onChange={(e) => updateField('floor_number', e.target.value)} /></div>
                <div className="space-y-2"><Label>Ano de construção</Label><Input type="number" min={1800} max={new Date().getFullYear()} value={formData.construction_year} onChange={(e) => updateField('construction_year', e.target.value)} /></div>
                <div className="space-y-2"><Label>Posição</Label><Select value={formData.floor_position} onValueChange={(v) => updateField('floor_position', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="frente">Frente</SelectItem><SelectItem value="fundos">Fundos</SelectItem><SelectItem value="lateral">Lateral</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Orientação solar</Label><Select value={formData.solar_orientation} onValueChange={(v) => updateField('solar_orientation', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[['nascente','Nascente'],['poente','Poente'],['norte','Norte'],['sul','Sul'],['leste','Leste'],['oeste','Oeste']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Mobiliário</Label><Select value={formData.furnished_status} onValueChange={(v) => updateField('furnished_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vazio">Vazio</SelectItem><SelectItem value="semimobiliado">Semimobiliado</SelectItem><SelectItem value="mobiliado">Mobiliado</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Conservação</Label><Select value={formData.condition} onValueChange={(v) => updateField('condition', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="novo">Novo</SelectItem><SelectItem value="reformado">Reformado</SelectItem><SelectItem value="usado">Usado</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Tipo da vaga</Label><Select value={formData.parking_type} onValueChange={(v) => updateField('parking_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="demarcada">Demarcada</SelectItem><SelectItem value="livre">Livre</SelectItem><SelectItem value="nao_informada">Não informada</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex flex-wrap gap-3">{[['parking_covered','Vaga coberta'],['has_elevator','Elevador'],['pet_allowed','Aceita pet']].map(([key,label]) => <label key={key} className="flex items-center gap-2 border rounded-md px-3 py-2"><input type="checkbox" checked={(formData as any)[key]} onChange={(e) => updateField(key, e.target.checked)} />{label}</label>)}</div>
            </TabsContent>

            {/* Aba 3: Valores */}
            <TabsContent value="valores" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Valores Principais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Aluguel (R$)</Label>
                    <Input
                      value={formatCurrencyInput(formData.rent_price)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('rent_price', parseCurrencyInput(e.target.value))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Venda (R$)</Label>
                    <Input
                      value={formatCurrencyInput(formData.sale_price)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('sale_price', parseCurrencyInput(e.target.value))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Taxas e Encargos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Condomínio (R$)</Label>
                    <Input
                      value={formatCurrencyInput(formData.condo_fee)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('condo_fee', parseCurrencyInput(e.target.value))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IPTU (R$)</Label>
                    <Input
                      value={formatCurrencyInput(formData.iptu)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('iptu', parseCurrencyInput(e.target.value))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Condições</h3>
                <div className="space-y-3">
                  {[
                    { key: 'accepts_financing', label: 'Aceita Financiamento' },
                    { key: 'accepts_exchange', label: 'Aceita Permuta' },
                    { key: 'accepts_fgts', label: 'Aceita FGTS' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 p-4 rounded-lg border border-border/40 bg-[#EEECE5] cursor-pointer hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={(formData as any)[key]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(key, e.target.checked)}
                        className="w-5 h-5 rounded border-muted-foreground/40 text-[#AD7B3B] focus:ring-[#AD7B3B]"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Depósito / caução (R$)</Label><Input value={formatCurrencyInput(formData.deposit_amount)} onChange={(e) => updateField('deposit_amount', parseCurrencyInput(e.target.value))} placeholder="0,00" inputMode="decimal" /></div><div className="space-y-2"><Label>Disponível a partir de</Label><Input type="date" value={formData.available_from} onChange={(e) => updateField('available_from', e.target.value)} /></div></div>
              <div className="flex flex-wrap gap-3">{[['accepts_guarantor','Aceita fiador'],['accepts_insurance','Aceita seguro-fiança'],['accepts_deposit','Aceita caução'],['deed_registered','Matrícula registrada'],['iptu_paid','IPTU em dia'],['occupancy_permit','Possui habite-se']].map(([key,label]) => <label key={key} className="flex items-center gap-2 border rounded-md px-3 py-2"><input type="checkbox" checked={(formData as any)[key]} onChange={(e) => updateField(key, e.target.checked)} />{label}</label>)}</div>
            </TabsContent>

            {/* Aba 4: Mídia */}
            <TabsContent value="midia" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Fotos do Imóvel</h3>
                <div className="p-6 border-2 border-dashed border-border/40 rounded-lg bg-[#EEECE5]">
                  <ImageGalleryUploader
                    key={item?.id ?? 'new-property'}
                    existingImages={formData.images || []}
                    existingVideos={formData.videos || []}
                    onImagesChange={(urls: string[]) => updateField('images', urls)}
                    onVideosChange={(urls: string[]) => updateField('videos', urls)}
                    onUploadingChange={setMediaUploading}
                    maxImages={10}
                    maxVideos={2}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Vídeo / Tour Virtual</h3>
                <div className="space-y-2">
                  <Label>URL do Vídeo ou Tour Virtual</Label>
                  <Input
                    value={formData.virtual_tour_url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('virtual_tour_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link do YouTube, Vimeo ou Google Drive
                  </p>
                </div>
                <div className="space-y-2"><Label>Planta baixa (imagem ou PDF)</Label><Input type="file" accept="image/*,.pdf" disabled={uploadingPlan} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const result = await uploadFile(file, 'documents'); updateField('floor_plan_url', result.url) } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao enviar planta baixa.') } finally { e.target.value = '' } }} /><p className="text-xs text-muted-foreground">{uploadingPlan ? 'Enviando para o R2...' : formData.floor_plan_url ? 'Planta enviada com sucesso.' : 'Até 10 MB.'}</p></div>
              </div>
            </TabsContent>

            <TabsContent value="gestao" className="mt-0 space-y-6">
              {/* Os três papéis de quem é dono dos imóveis e também opera o
                  sistema. Ver src/lib/repasse.ts para a regra de cada um. */}
              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Gestão do Imóvel</h3>
                <p className="text-sm text-muted-foreground">
                  Como o aluguel deste imóvel chega até você, e se outra
                  imobiliária administra por sua conta.
                </p>

                {/* Quem é o dono. Vazio = a própria imobiliária é dona, que é o
                    padrão e não precisa de mais nada preenchido.

                    O campo é o que liga o imóvel ao cliente no portal: a RLS de
                    properties só devolve a linha quando owner_id = auth.uid(), e
                    sem ele o cliente vê "nenhum imóvel" numa tela que deveria
                    estar mostrando o extrato de repasse dele. Por isso o aviso
                    sobre cadastro incompleto existe em /portal/repasses. */}
                <div className="space-y-2">
                  <Label htmlFor="owner_id">Proprietário do imóvel</Label>
                  <Select
                    value={formData.owner_id || 'proprio_da_imobiliaria'}
                    onValueChange={(v) =>
                      updateField(
                        "owner_id",
                        v === 'proprio_da_imobiliaria' ? '' : v,
                      )
                    }
                  >
                    <SelectTrigger id="owner_id" className="bg-[#EEECE5] focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprio_da_imobiliaria">
                        A própria imobiliária
                      </SelectItem>
                      {proprietarios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                          {p.cpf_cnpj_limpo ? ` · ${p.cpf_cnpj_limpo}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Preencha quando o imóvel é de um cliente. É o que permite ao
                    proprietário ver o repasse no portal e define se a taxa de
                    administração é receita da imobiliária ou custo dela.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gestao_tipo">Como o aluguel chega até você</Label>
                  <Select
                    value={formData.gestao_tipo}
                    onValueChange={(v) => updateField("gestao_tipo", v)}
                  >
                    <SelectTrigger id="gestao_tipo" className="bg-[#EEECE5] focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propria_sem_intermediario">
                        Próprio, sem intermediário — recebo o aluguel inteiro
                      </SelectItem>
                      <SelectItem value="propria_com_terceirizacao">
                        Próprio, com imobiliária administrando — ela retém taxa
                      </SelectItem>
                      <SelectItem value="locacao_direta">
                        Locação particular — combinei direto com o locatário
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {GESTAO_DESCRICOES[formData.gestao_tipo as GestaoTipo]}
                  </p>
                </div>

                {formData.gestao_tipo === "propria_com_terceirizacao" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="taxa_terceirizacao">Taxa da administradora (%)</Label>
                      <Input
                        id="taxa_terceirizacao"
                        value={formData.taxa_terceirizacao_percent}
                        onChange={(e) => updateField("taxa_terceirizacao_percent", e.target.value)}
                        placeholder="5,00"
                        inputMode="decimal"
                        className="bg-[#EEECE5] focus:bg-white"
                      />
                      <p className="text-xs text-muted-foreground">
                        Percentual que a outra imobiliária tira do seu aluguel.
                        Este valor é um custo seu — o dinheiro sai do seu bolso.
                      </p>
                    </div>

                    {temTaxa && (
                      <div className="p-4 rounded-md bg-[#EEECE5] border border-border/40">
                        <p className="text-sm font-medium">Como fica no seu caixa</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Com aluguel de {formatBRL(rentNumerico)}, a administradora
                          fica com {formatBRL(taxaValor)} e você recebe{" "}
                          {formatBRL(liquidoPrevisto)} por mês.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Calculado a partir do contrato, nunca digitado. Guardamos
                          o percentual, não o valor: assim um reajuste no aluguel
                          não deixa o repasse velho.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {formData.gestao_tipo !== "propria_com_terceirizacao" && rentNumerico > 0 && (
                  <div className="p-4 rounded-md bg-[#EEECE5] border border-border/40">
                    <p className="text-sm font-medium">Como fica no seu caixa</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sem intermediário, você recebe o aluguel inteiro:{" "}
                      {formatBRL(rentNumerico)} por mês.
                    </p>
                  </div>
                )}
              </div>

              {/* Taxas de adminstração (ou comissão, no caso de imóvel de
                  terceiro). Uma tabela serve a imóvel, contrato e venda — o
                  mesmo editor entra em todos. A prévia do caixa usa o aluguel
                  cheio, e não o que foi pago: é uma projeção. O relatório do
                  Financeiro é que usa o valor efetivamente recebido. */}
              <FeeTermsEditor
                propertyId={item?.id || ''}
                somente="locacao"
                valorBase={rentNumerico}
                rotuloBase="um mês de aluguel"
                avisoDirecao={
                  temTaxa ? (
                    <>
                      <p className="text-sm font-medium">Como fica no seu caixa</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Com aluguel de {formatBRL(rentNumerico)}, a administradora fica com{' '}
                        {formatBRL(taxaValor)} e você recebe {formatBRL(liquidoPrevisto)} por mês.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Calculado a partir do aluguel cheio. O relatório do Financeiro usa o
                        valor pago — a taxa de um mês só existe quando o dinheiro entra.
                      </p>
                    </>
                  ) : formData.gestao_tipo === 'propria_sem_intermediario' ? (
                    <p className="text-sm">Sem intermediário, você recebe o aluguel inteiro.</p>
                  ) : undefined
                }
                onChange={() => {}}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-[#F7F5F0] rounded-b-lg">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || locating || uploadingPlan || mediaUploading}
            className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white px-8"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Salvando...
              </>
            ) : (
              'Salvar Cadastro'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
