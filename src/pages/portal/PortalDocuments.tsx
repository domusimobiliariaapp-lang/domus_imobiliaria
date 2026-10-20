/**
 * Documentos do cliente.
 *
 * ---------------------------------------------------------------------------
 * A LISTAGEM NÃO É UMA CONSULTA COM FILTRO
 * ---------------------------------------------------------------------------
 *
 * A tela não pede "documentos do usuário logado" e filtra no navegador. Ela pede
 * TUDO que a RLS devolve e mostra. A policy "Users can view related documents"
 * já entrega só o que pertence a quem está logado:
 *
 *   entity_type = 'user'     documento pessoal do próprio cliente
 *   entity_type = 'property' documento de um imóvel que ELE é o proprietário
 *   entity_type = 'lease'    documento de um contrato onde ele é locatário OU
 *                            proprietário
 *   entity_type = 'sale'     documento de uma venda onde ele é comprador OU
 *                            vendedor
 *
 * Filtrar no cliente com base em "o id é o meu" seria a mesma tela com recorte
 * errado: a policy é a única que sabe quem é o proprietário do imóvel, porque
 * isso mora em properties.owner_id e em leases.landlord_id. Uma política
 * aproximada no front passaria no teste e vazaria na produção.
 *
 * ---------------------------------------------------------------------------
 * O DOCUMENTO VEM DO R2, NÃO DO SUPABASE STORAGE
 * ---------------------------------------------------------------------------
 *
 * O campo file_path guarda a URL pública permanente que a edge function
 * domus-r2-upload devolve. Não há download autenticado: o arquivo é aberto
 * direto no navegador pelo link. Isso vale para o documento de um cliente estar
 * acessível por URL para quem tiver o link — e é por isso que o upload grava
 * sob o prefixo da org, e não sob um bucket único.
 */

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Download, ExternalLink, Search, FolderOpen } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { formatDateBR } from '@/lib/inputMasks'
import type { Document } from '@/types'

const ENTITY_LABELS: Record<Document['entity_type'], string> = {
  property: 'Imóvel',
  lease: 'Contrato',
  sale: 'Venda',
  user: 'Pessoal',
}

export function PortalDocuments() {
  const [documentos, setDocumentos] = React.useState<Document[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)
  const [busca, setBusca] = React.useState('')
  const [tipoAtivo, setTipoAtivo] = React.useState<'' | Document['entity_type']>('')

  const carregar = React.useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      // Sem filtro: a RLS já devolve só o que é deste cliente. Filtrar por
      // entity_id aqui seria adivinhar o vínculo, e a policy sabe dele.
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      setDocumentos((data as Document[]) || [])
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  const filtrados = React.useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return documentos.filter((d) => {
      const porTipo = !tipoAtivo || d.entity_type === tipoAtivo
      const porBusca =
        !termo ||
        d.title.toLowerCase().includes(termo) ||
        d.type.toLowerCase().includes(termo) ||
        (d.notes || '').toLowerCase().includes(termo)
      return porTipo && porBusca
    })
  }, [documentos, busca, tipoAtivo])

  // Quantos existem de cada tipo, para o filtro mostrar o que há — e não só as
  // categorias possíveis, que fariam o usuário clicar num filtro vazio.
  const contagemPorTipo = React.useMemo(() => {
    const contagem: Record<string, number> = {}
    for (const d of documentos) {
      contagem[d.entity_type] = (contagem[d.entity_type] || 0) + 1
    }
    return contagem
  }, [documentos])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-medium text-primary">Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Contratos, comprovantes e documentos dos seus imóveis
        </p>
      </div>

      {erro && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {erro}
        </div>
      )}

      {documentos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar documento..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={tipoAtivo === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoAtivo('')}
            >
              Todos ({documentos.length})
            </Button>
            {(Object.keys(ENTITY_LABELS) as Document['entity_type'][])
              .filter((t) => contagemPorTipo[t])
              .map((t) => (
                <Button
                  key={t}
                  variant={tipoAtivo === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoAtivo(tipoAtivo === t ? '' : t)}
                >
                  {ENTITY_LABELS[t]} ({contagemPorTipo[t]})
                </Button>
              ))}
          </div>
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : documentos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Nenhum documento disponível.</p>
          <p className="text-sm mt-1">
            Quando a imobiliária disponibilizar um documento para você, ele aparece aqui.
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento com esses filtros.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight break-words">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ENTITY_LABELS[doc.entity_type]} · {doc.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(doc.created_at)}
                    </p>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{doc.notes}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Abrir
                    </a>
                  </Button>
                  <Button asChild size="icon" variant="ghost" title="Abrir em nova aba">
                    <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
