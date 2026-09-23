# Domus — Status do Projeto

**Data:** 2026-09-23
**Branch:** master
**Build:** ✅ Sucesso (`npm run build`)
**TypeScript:** ✅ Zero erros (`npx tsc --noEmit`)

---

## 1. Rotas e Páginas

### Autenticação
| Rota | Componente | Status |
|------|-----------|--------|
| `/login` | `LoginAdmin` | ✅ Completo |
| `/portal/login` | `LoginPortal` | ✅ Completo |
| `/` | Navigate → `/imoveis` | ✅ Completo |

### Páginas Públicas (sem login)
| Rota | Componente | Status |
|------|-----------|--------|
| `/imoveis` | `PublicProperties` | ✅ **Novo** — Listagem pública com busca e filtros |
| `/imovel/:id` | `PublicPropertyDetail` | ✅ **Novo** — Detalhe com galeria fan carousel GSAP |

### Painel Administrativo (`/admin/*`)
| Rota | Componente | Status |
|------|-----------|--------|
| `/admin/dashboard` | `DashboardAdmin` | ✅ Completo |
| `/admin/properties` | `PropertiesAdmin` | ✅ **Completo** (aba Lista + Relatório) |
| `/admin/clients` | `ClientsAdmin` | ✅ Completo (tabela `clients`) |
| `/admin/sales` | `SalesAdmin` | ✅ **Completo** (aba Lista + Relatório) |
| `/admin/contracts` | `ContractsAdmin` | ✅ Completo |
| `/admin/leases` | `LeasesAdmin` | ✅ Completo |
| `/admin/renewals` | `RenewalsAdmin` | ✅ Completo (alerta dinâmico por config) |
| `/admin/financial` | `FinancialAdmin` | ✅ Completo |
| `/admin/legal` | `LegalAdmin` | ✅ Completo |
| `/admin/administrative` | `AdministrativeAdmin` | ✅ **Completo** (Visão Geral + Configurações) |

### Portal do Cliente (`/portal/*`)
| Rota | Componente | Status |
|------|-----------|--------|
| `/portal/dashboard` | `PortalDashboard` | ✅ Completo |
| `/portal/properties` | `PortalProperties` | ✅ Completo |
| `/portal/leases` | `PortalLeases` | ✅ Completo |
| `/portal/payments` | `PortalPayments` | ✅ Completo (só marca como reportado) |
| `/portal/documents` | Placeholder | ⚠️ Parcial (sem implementação) |

---

## 2. Tabelas do Supabase Usadas por Página

### NOVAS TABELAS CRIADAS (Migração 06 + 07)
| Tabela | Descrição |
|--------|-----------|
| `clients` | Tabela independente de clientes (migrada de `profiles`) |
| `lease_history` | Histórico de alterações em locações |
| `company_settings` | Configurações da empresa (CNPJ, taxa adm, índice reajuste, alerta renovação) |

### Páginas Administrativas

| Página | Tabelas Lidas | Tabelas Escrita | Observações |
|--------|--------------|-----------------|-------------|
| `DashboardAdmin` | `properties`, `leases`, `sales`, `payments` | — | Stats calculadas via `useDashboardStats()` |
| `PropertiesAdmin` | `properties` | `properties` | CRUD completo + autocomplete CEP + abas Lista/Relatório |
| `ClientsAdmin` | `clients` | `clients` | **CRUD direto em `clients`** |
| `SalesAdmin` | `sales`, `properties` | `sales` | Vincula imóvel + abas Lista/Relatório |
| `ContractsAdmin` | `leases`, `properties` | `leases`, `lease_history` | Contratos de locação |
| `LeasesAdmin` | `leases`, `properties` | `leases` | Listagem de locações |
| `RenewalsAdmin` | `leases`, `properties`, `company_settings` | `leases`, `lease_history` | Renovações com alertas dinâmicos |
| `FinancialAdmin` | `payments`, `leases` | `payments` | Atualiza status para "pago" |
| `LegalAdmin` | `documents` | `documents` | Upload via R2 (edge function) |
| `AdministrativeAdmin` | `properties`, `leases`, `payments`, `company_settings` | `company_settings` | Dashboard operacional + Configurações |

### Páginas Públicas

| Página | Tabelas Lidas | Tabelas Escrita | Observações |
|--------|--------------|-----------------|-------------|
| `PublicProperties` | `properties` | — | Listagem pública com busca/filtro, sem login |
| `PublicPropertyDetail` | `properties` | — | Detalhe com galeria fan carousel GSAP |

### Portal do Cliente

| Página | Tabelas Lidas | Tabelas Escrita | Observações |
|--------|--------------|-----------------|-------------|
| `PortalDashboard` | `properties`, `leases` | — | Resumo da conta |
| `PortalProperties` | `properties` | — | Catálogo de imóveis |
| `PortalLeases` | `leases`, `properties` | — | Contratos do cliente |
| `PortalPayments` | `payments`, `leases` | `payments` | Só marca `reported_paid_by_client` |
| `PortalDocuments` | — | — | ⚠️ Placeholder não implementado |

---

## 3. Migrations Aplicadas

| Arquivo | Descrição | Aplicada? |
|---------|-----------|-----------|
| `0001_schema_inicial.sql` | Schema inicial antigo | ⚠️ Movido para `.bak` |
| `20260919000000_initial_schema.sql` | Schema completo: profiles, properties, leases, sales, payments, documents, notifications | Sim |
| `20260919000001_rls_policies.sql` | Políticas de Row Level Security para todas as tabelas | Sim |
| `20260919000002_seed_data.sql` | Dados iniciais de teste | Sim |
| `20260919000003_add_client_fields.sql` | Campos adicionais em profiles (cpf_cnpj, telefone, etc.) | Sim |
| `20260919000004_auto_create_profile.sql` | Trigger para criar profile automaticamente ao criar auth user | Sim |
| `20260919000005_add_property_taxes.sql` | Campos de taxas: iptu, condo_fee, gas_fee, water_fee, electricity_fee, other_fees | Sim |
| `20260919000006_create_clients_table.sql` | Cria tabela `clients` e migra dados de `profiles` | Sim |
| `20260919000007_company_settings.sql` | Cria tabela `company_settings` com configurações da empresa | Sim |
| `20260919000008_add_property_videos.sql` | Adiciona coluna `videos` (TEXT[]) em `properties` | ⏳ Pendente |
| `20260923000010_storage_policies.sql` | RLS policies para bucket `domus-files` | ⏳ Pendente (aplicar manualmente no SQL Editor) |

---

## 4. Edge Functions

| Função | Descrição | Status |
|--------|-----------|--------|
| `domus-r2-upload` | Gera presigned URLs para upload direto ao Cloudflare R2 (AWS Sig V4) | ✅ Funcional |
| `cliente-login-request` | Envia código de verificação por e-mail para login de clientes | ✅ Implementada |

### Configuração R2
- **Bucket:** `domus-files` (criar no dashboard do Supabase)
- **Secrets obrigatórios:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- **CORS:** Configurar em Cloudflare R2 > Settings > CORS Policy
- **Deploy:** `npx supabase functions deploy domus-r2-upload --project-ref celdewmegikrlanlrzsg`

---

## 5. Componentes de UI Criados/Atualizados

| Arquivo | Descrição |
|---------|-----------|
| `status-badge.tsx` | Componente genérico de badge de status com cores padronizadas |
| `modal.tsx` | Modal redesenhado com fundo sólido explícito (branco/escuro), header destacado, animação de entrada |
| `select.tsx` | Fundo opaco branco (forçado) para evitar transparência |
| `tabs.tsx` | Componente de abas simples com context API |
| `toast.tsx` | Sistema de notificações toast com Provider e hook `useToast()` |
| `PropertyGallery.tsx` | **Novo** — Galeria em fan carousel com GSAP (animação de cards + hover interactivo) |
| `ImageGalleryUploader.tsx` | Componente de upload múltiplo de imagens/vídeos com drag reorder |
| `ProtectedRoute.tsx` | Wrapper de proteção de rotas baseado em roles |

---

## 6. Dependências Instaladas

| Pacote | Versão | Uso |
|--------|--------|-----|
| `gsap` | Latest | Fan carousel animations na galeria pública |
| `react-router-dom` | ^7.18.4 | Roteamento (público + protegido) |
| `@supabase/supabase-js` | ^2.116.0 | Client Supabase + edge functions |
| `lucide-react` | ^1.47.0 | Ícones |
| `framer-motion` | ^13.4.0 | Animações (já existente) |
| `date-fns` | ^4.4.0 | Formatação de datas |
| `recharts` | ^3.10.1 | Gráficos do dashboard |

---

## 7. Mudanças de UI/UX Implementadas

### Front 1 — Menu ✅
- Removidos "Relatório Imóveis" e "Relatório Vendas" da sidebar
- Removidas rotas `/admin/properties/report` e `/admin/sales/report`
- Arquivos `PropertiesReport.tsx` e `SalesReport.tsx` eliminados
- Conteúdo migrado para abas dentro das páginas principais

### Front 2 — Tabelas ✅
- Removidos cabeçalhos duplicados (AdminLayout já renderiza título/subtítulo)
- Colunas encurtadas para o essencial
- `StatusBadge` aplicado consistentemente em todas as páginas

### Front 3 — Modal ✅
- Redesenho completo com header em `bg-[#F7F5F0]`
- Fundo do container explicitamente definido: `bg-white dark:bg-[#1a1a1a]`
- Título em fonte serif
- Botão de fechar no canto superior direito
- Animação de entrada (fade + zoom)
- Footer com Cancelar (ghost, esquerda) e Salvar (sólido, direita)
- Respeita modo escuro (usa variáveis de tema)

### Front 4 — Dropdown ✅
- SelectContent forçado para `bg-[#FFFFFF]` / `dark:bg-[#1a1a1a]`
- Sombra aumentada para `shadow-lg`
- Z-index mantido em 50

### Front 5 — Configurações da Empresa ✅
- Aba "Visão Geral" e "Configurações" em `AdministrativeAdmin`
- Edição de: company_name, cnpj, address, phone, admin_fee_percent, default_reajuste_index, renewal_alert_days
- `RenewalsAdmin` lê `renewal_alert_days` das configurações (não mais hardcode)
- Tabela `company_settings` criada na migration 0007
- Query usa `.maybeSingle()` para evitar erro quando tabela está vazia
- Mensagens de erro exibidas na tela (não alert do navegador)

### Front 6 — Abas Lista/Relatório ✅
- `PropertiesAdmin`: abas "Lista" | "Relatório" com filtros e print
- `SalesAdmin`: abas "Lista" | "Relatório" com filtros
- Arquivos de relatório separados removidos
- Todas as abas do sistema usam o componente `Tabs` unificado com design de trilho (border-bottom) + indicador âmbar na aba ativa

### Front 7 — Folha de Estilo de Impressão ✅
- Adicionadas regras `@media print` em `src/index.css`
- Esconde sidebar, header, botões, filtros durante impressão
- Adicionado cabeçalho de relatório com título e data
- Configurado para evitar quebra de tabelas entre páginas
- Aplicado nas páginas de Imóveis e Vendas

### Front 8 — Limpeza de Modais (título/botão duplicados) ✅
- Removidos títulos duplicados (`<h3>`) dentro dos formulários — o Modal já renderiza title/description via props
- Removidos botões de submit embutidos nos formulários ("Salvar Documento", "Salvar Venda", "Salvar Contrato") — único botão de salvar agora está no rodapé do Modal
- Padrão unificado: `<form>` mantém `onSubmit` nativo; botão do Modal usa `type="submit"` apontando ao form via ID implícito (o form envolve o conteúdo do Modal no CRUDPage)
- Texto do botão de salvar padronizado: **"Salvar"** tanto para criar quanto editar
- Aplicado em: Vendas, Contratos, Documentos (Jurídico) — outros formulários (Imóveis, Clientes) já estavam OK

### Front 9 — Botões de Ação com Animação ✅
- Todos os botões de ação (editar/excluir/compartilhar) agora têm `transition-transform hover:scale-110 active:scale-95`
- Feedback visual de clique com escala para baixo ao pressionar
- Hover com leve aumento de tamanho (scale 110%)
- Aplicado em: CRUDPage, PropertiesAdmin, SalesAdmin, ContractsAdmin, LegalAdmin

### Front 10 — Toast System ✅
- Componente `Toast` criado em `src/components/ui/toast.tsx`
- ToastProvider envolvido no App.tsx
- `useToast()` hook para mostrar notificações
- Toast aparece no canto inferior direito com animação de entrada (fade + slide up)
- Auto-hide em 3 segundos com animação de saída
- Tipos: success (verde), error (vermelho), info (verde-petróleo)

### Front 11 — Compartilhamento com Toast ✅
- Botão de compartilhar nos imóveis copia o link para o clipboard
- Mostra toast "Link copiado com sucesso!" ao copiar
- Fallback para abrir em nova aba se falhar
- Aplicado em: PropertiesAdmin

### Front 12 — Upload de Arquivos R2 ✅
- Edge function `domus-r2-upload` gera presigned URLs com AWS Signature V4
- Hook `useR2Upload` para upload de arquivos (imagens e vídeos)
- Componente `ImageGalleryUploader` com:
  - Suporte a até 10 imagens (máx. 10MB cada)
  - Suporte a até 2 vídeos (máx. 50MB cada)
  - Animação de loading (spinner) durante upload
  - Drag & drop para reorder de imagens
  - Preview em grid com botão de remover
  - Player de vídeo com controles nativos
- Coluna `videos` adicionada na tabela `properties`
- Aplicado em: PropertiesAdmin (formulário de criação/edição)
- Aplicado em: LegalAdmin (upload de documentos PDF/DOC)

### Front 13 — Página Pública de Imóveis ✅ **NOVO**
- Rota `/imoveis` acessível sem login
- Listagem com busca por texto (título, endereço, bairro, cidade)
- Filtro por tipo de imóvel (casa, apartamento, comercial, etc.)
- Cards com foto de capa, badges de status, preços (aluguel/venda)
- Navegação para `/imovel/:id`
- Rota `/` redireciona para `/imoveis`

### Front 14 — Galeria Fan Carousel com GSAP ✅ **NOVO**
- Componente `PropertyGallery` com animação de fãs (cards em leque)
- GSAP para animações suaves de entrada e transição
- Hover interativo (cards se afastam do cursor)
- Navegação por setas + indicadores de posição
- Suporta imagens (lazy load) e vídeos (com overlay de play)
- Responsivo: adapta layout para mobile/tablet/desktop
- Estética Domus: cores da marca, cantos arredondados, sombras sutis

---

## 8. Correções de Arquitetura

### 1. Separação Clients de Profiles ✅
- Criada tabela `clients` independente
- Migrados dados de `profiles` com `role='cliente'`
- `profiles` agora tem `client_id` (nullable)
- `ClientsAdmin` faz CRUD direto em `clients`
- Login/portal continua usando `profiles`

### 2. Tabela `lease_history` Criada ✅
- Colunas: `id`, `lease_id`, `type`, `detail`, `created_by`, `created_at`
- `RenewalsAdmin` insere histórico ao renovar/fechar contratos
- RLS permite apenas equipe interna

### 3. Confirmação de Pagamento pelo Cliente ✅
- Novas colunas em `payments`: `reported_paid_by_client`, `reported_paid_at`
- `PortalPayments` marca só essas colunas (não muda status)
- `FinancialAdmin` mostra indicador para equipe confirmar

### 4. Upload de Arquivos no R2 ✅
- Edge function configurada e testada
- Bucket `domus-files` precisa ser criado no dashboard
- Políticas de RLS no bucket precisam ser aplicadas manualmente
- URLs públicas permanentes salvas nas tabelas

### 5. Roteamento Público ✅
- Rotas `/imoveis` e `/imovel/:id` sem proteção de autenticação
- RLS do Supabase permite seleção de imóveis `disponivel` para todos
- Página inicial redireciona para listagem pública

---

## 9. Pendências

| Item | Prioridade | Descrição |
|------|-----------|-----------|
| Migration 0008 | Média | Aplicar `20260919000008_add_property_videos.sql` no banco (coluna `videos`) |
| Storage RLS | Média | Aplicar políticas de RLS do bucket `domus-files` manualmente no SQL Editor |
| Testes E2E | Baixa | Criar testes end-to-end para fluxos críticos |
| Portal Documents | Baixa | Implementar página de documentos no portal do cliente |

---

## 10. Como Testar

### Dev local
```bash
npm run dev
```
Acesse: http://localhost:5173/imoveis

### Páginas públicas
- `/imoveis` — Listagem sem login
- `/imovel/:id` — Detalhe com galeria GSAP

### Admin
- `/login` — Login com e-mail e senha
- `/admin/dashboard` — Dashboard com métricas

### Portal
- `/portal/login` — Login com CPF + código enviado por e-mail
- `/portal/dashboard` — Área do cliente
