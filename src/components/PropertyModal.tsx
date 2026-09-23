import * as React from 'react'
import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ImageGalleryUploader } from './ImageGalleryUploader'

interface PropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: any
  onSave: (data: any) => Promise<void>
  saving?: boolean
}

const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sala', label: 'Sala' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'loja', label: 'Loja' },
]

const PROPERTY_STATUSES = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'alugado', label: 'Alugado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'indisponivel', label: 'Indisponível' },
]

const FEATURES_LIST = [
  { value: 'piscina', label: 'Piscina' },
  { value: 'portaria_24h', label: 'Portaria 24h' },
  { value: 'elevador', label: 'Elevador' },
  { value: 'churrasqueira', label: 'Churrasqueira' },
  { value: 'academia', label: 'Academia' },
  { value: 'salao_festas', label: 'Salão de Festas' },
  { value: 'sol_manha', label: 'Sol da Manhã' },
]

export function PropertyModal({ open, onOpenChange, item, onSave, saving = false }: PropertyModalProps) {
  const isEditing = !!item
  const [activeTab, setActiveTab] = useState('basicos')
  const [formData, setFormData] = useState({
    title: '',
    type: 'apartamento',
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
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parking: 0,
    features: [] as string[],
    rent_price: 0,
    sale_price: 0,
    condo_fee: 0,
    iptu: 0,
    accepts_financing: false,
    accepts_exchange: false,
    accepts_fgts: false,
    description: '',
    images: [] as string[],
    videos: [] as string[],
    virtual_tour_url: '',
  })

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        type: item.type || 'apartamento',
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
        bedrooms: item.bedrooms || 0,
        suites: item.suites || 0,
        bathrooms: item.bathrooms || 0,
        parking: item.parking || 0,
        features: item.features || [],
        rent_price: item.rent_price || 0,
        sale_price: item.sale_price || 0,
        condo_fee: item.condo_fee || 0,
        iptu: item.iptu || 0,
        accepts_financing: false,
        accepts_exchange: false,
        accepts_fgts: false,
        description: item.description || '',
        images: item.images || [],
        videos: item.videos || [],
        virtual_tour_url: '',
      })
      setActiveTab('basicos')
    }
  }, [item])

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    if (numbers.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${numbers}/json/`)
      const data = await res.json()
      if (!data.erro) {
        updateField('address', data.logradouro || '')
        updateField('neighborhood', data.bairro || '')
        updateField('city', data.localidade || '')
        updateField('state', data.uf?.toUpperCase() || '')
      }
    } catch {
      // Ignore errors
    }
  }

  const handleSave = async () => {
    const data = {
      ...formData,
      images: formData.images || [],
      videos: formData.videos || [],
      features: formData.features || [],
      rent_price: Number(formData.rent_price) || 0,
      sale_price: Number(formData.sale_price) || 0,
      area_m2: Number(formData.area_m2) || 0,
      area_util: Number(formData.area_util) || 0,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      parking: Number(formData.parking) || 0,
      condo_fee: Number(formData.condo_fee) || 0,
      iptu: Number(formData.iptu) || 0,
    }
    await onSave(data)
    if (!isEditing) {
      setFormData({
        title: '', type: 'apartamento', status: 'disponivel',
        address: '', address_number: '', address_complement: '', neighborhood: '',
        city: '', state: '', zip_code: '', area_m2: 0, area_util: 0,
        bedrooms: 0, suites: 0, bathrooms: 0, parking: 0, features: [],
        rent_price: 0, sale_price: 0, condo_fee: 0, iptu: 0,
        accepts_financing: false, accepts_exchange: false, accepts_fgts: false,
        description: '', images: [], videos: [], virtual_tour_url: '',
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

                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('address', e.target.value)}
                    placeholder="Rua"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.address_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('address_number', e.target.value)}
                    placeholder="Nº"
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('neighborhood', e.target.value)}
                    placeholder="Bairro"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('city', e.target.value)}
                    placeholder="Cidade"
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Input
                    value={formData.state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('state', e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="UF"
                    maxLength={2}
                    className="bg-[#EEECE5] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('zip_code', e.target.value)}
                    onBlur={() => handleCepBlur(formData.zip_code)}
                    placeholder="00000-000"
                    maxLength={9}
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
                      type="number"
                      value={formData.area_m2 || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('area_m2', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Área Útil (m²)</Label>
                    <Input
                      type="number"
                      value={formData.area_util || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('area_util', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min={0}
                      step={0.01}
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
                  {FEATURES_LIST.map((feature) => (
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
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Aba 3: Valores */}
            <TabsContent value="valores" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Valores Principais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Aluguel (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.rent_price || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('rent_price', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Venda (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sale_price || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('sale_price', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
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
                      type="number"
                      step="0.01"
                      value={formData.condo_fee || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('condo_fee', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="bg-[#EEECE5] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IPTU (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.iptu || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('iptu', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
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
            </TabsContent>

            {/* Aba 4: Mídia */}
            <TabsContent value="midia" className="mt-0 space-y-6">
              <div className="space-y-4">
                <h3 className="font-serif font-medium text-lg text-primary">Fotos do Imóvel</h3>
                <div className="p-6 border-2 border-dashed border-border/40 rounded-lg bg-[#EEECE5]">
                  <ImageGalleryUploader
                    existingImages={formData.images || []}
                    onImagesChange={(urls: string[]) => updateField('images', urls)}
                    onVideosChange={(urls: string[]) => updateField('videos', urls)}
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
              </div>
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
            disabled={saving}
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
