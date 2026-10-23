import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react'

interface PropertyImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ParsedProperty {
  title: string
  type: string
  category: 'aluguel' | 'venda' | 'ambos'
  rental_value: number
  sale_price: number
  address: string
  neighborhood: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  parking_spots: number
  usable_area: number
  status: 'disponivel'
}

export function PropertyImportModal({ open, onOpenChange, onSuccess }: PropertyImportModalProps) {
  const { currentOrgId } = useAuth()
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedProperty[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // 1. Gera e faz download do modelo CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'titulo',
      'tipo',
      'finalidade',
      'valor_aluguel',
      'valor_venda',
      'endereco',
      'bairro',
      'cidade',
      'estado',
      'quartos',
      'banheiros',
      'vagas',
      'area_util',
    ]
    const exampleRows = [
      [
        'Apartamento Vista Mar 2 Quartos',
        'apartamento',
        'aluguel',
        '2500',
        '0',
        'Av. Atlantica, 1200',
        'Centro',
        'Balneario Camboriu',
        'SC',
        '2',
        '2',
        '1',
        '75',
      ],
      [
        'Casa em Condominio Fechado',
        'casa',
        'venda',
        '0',
        '850000',
        'Rua das Palmeiras, 45',
        'Jardins',
        'Sao Paulo',
        'SP',
        '3',
        '3',
        '2',
        '180',
      ],
      [
        'Sala Comercial Centro Executivo',
        'comercial',
        'ambos',
        '1800',
        '320000',
        'Rua XV de Novembro, 500',
        'Centro',
        'Curitiba',
        'PR',
        '0',
        '1',
        '1',
        '45',
      ],
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...exampleRows.map((r) => r.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'modelo_importacao_imoveis_domus.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. Parser do arquivo CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setParseError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        if (!text) return

        // Suporta quebra de linha \r\n ou \n
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
        if (lines.length < 2) {
          setParseError('O arquivo selecionado está vazio ou contém apenas o cabeçalho.')
          return
        }

        // Detecta separador (; ou ,)
        const separator = lines[0].includes(';') ? ';' : ','

        const items: ParsedProperty[] = []

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(separator).map((c) => c.replace(/^["']|["']$/g, '').trim())
          if (!cols[0]) continue

          const tipoRaw = (cols[1] || 'apartamento').toLowerCase()
          const tipoValido = [
            'apartamento',
            'casa',
            'cobertura',
            'studio',
            'sobrado',
            'comercial',
            'terreno',
            'sala',
            'galpao',
            'loja',
            'chacara',
            'sitio',
          ].includes(tipoRaw)
            ? tipoRaw
            : 'apartamento'

          const finalidadeRaw = (cols[2] || 'aluguel').toLowerCase()
          const finalidadeValida: 'aluguel' | 'venda' | 'ambos' = ['aluguel', 'venda', 'ambos'].includes(
            finalidadeRaw
          )
            ? (finalidadeRaw as any)
            : 'aluguel'

          items.push({
            title: cols[0],
            type: tipoValido,
            category: finalidadeValida,
            rental_value: parseFloat(cols[3] || '0') || 0,
            sale_price: parseFloat(cols[4] || '0') || 0,
            address: cols[5] || 'Endereço não informado',
            neighborhood: cols[6] || '',
            city: cols[7] || 'Cidade',
            state: (cols[8] || 'UF').toUpperCase().slice(0, 2),
            bedrooms: parseInt(cols[9] || '0', 10) || 0,
            bathrooms: parseInt(cols[10] || '1', 10) || 1,
            parking_spots: parseInt(cols[11] || '0', 10) || 0,
            usable_area: parseFloat(cols[12] || '0') || 0,
            status: 'disponivel',
          })
        }

        if (items.length === 0) {
          setParseError('Nenhum imóvel válido identificado na planilha.')
          return
        }

        setParsedItems(items)
      } catch (err: any) {
        setParseError(`Erro ao processar planilha: ${err.message}`)
      }
    }

    reader.readAsText(file, 'UTF-8')
  }

  // 3. Salva os registros importados no Supabase
  const handleImport = async () => {
    if (parsedItems.length === 0) return

    setLoading(true)
    try {
      const recordsToInsert = parsedItems.map((item) => ({
        ...item,
        org_id: currentOrgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from('properties').insert(recordsToInsert)

      if (error) throw error

      addToast(`${parsedItems.length} imóveis importados com sucesso!`, 'success')
      setParsedItems([])
      setFileName(null)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      addToast(`Erro ao importar imóveis: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#AD7B3B]/10 text-[#AD7B3B] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-serif">Importar Carteira de Imóveis (CSV)</DialogTitle>
              <DialogDescription className="text-xs">
                Importe dezenas de imóveis de uma só vez a partir de uma planilha CSV.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Passo 1: Baixar modelo */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">1. Baixe o modelo padrão</p>
              <p className="text-[11px] text-muted-foreground">
                Planilha com os nomes das colunas e exemplos pré-preenchidos.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs h-8 gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Modelo CSV</span>
            </Button>
          </div>

          {/* Passo 2: Upload */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">2. Selecione o arquivo CSV preenchido</p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-background/50 hover:bg-muted/20"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium text-foreground">
                {fileName ? fileName : 'Clique aqui para escolher a planilha (.csv)'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Compatível com Excel, Google Planilhas e LibreOffice (separado por vírgula ou ponto-e-vírgula)
              </p>
            </div>
          </div>

          {parseError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Prévia da Importação */}
          {parsedItems.length > 0 && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">
                  {parsedItems.length} imóveis prontos para importação:
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 text-xs divide-y divide-emerald-500/10">
                {parsedItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="pt-1 flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground truncate max-w-[260px]">{item.title}</span>
                    <span className="shrink-0 text-[11px] font-mono">
                      {item.city}/{item.state} • {item.type}
                    </span>
                  </div>
                ))}
                {parsedItems.length > 5 && (
                  <p className="pt-1 text-[11px] text-muted-foreground italic">
                    ... e mais {parsedItems.length - 5} imóveis na lista.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={parsedItems.length === 0 || loading}
            className="bg-[#17323D] hover:bg-[#17323D]/90 text-white gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importando...</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5" />
                <span>Confirmar Importação de {parsedItems.length} Imóveis</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
