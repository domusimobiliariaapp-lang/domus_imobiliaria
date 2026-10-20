# Domus — Status do Projeto

**Data:** 2026-10-06
**Branch:** main
**Build:** ✅ Sucesso (`npm run build`)
**TypeScript:** ✅ Zero erros (`npx tsc --noEmit`)
**Última correção:** Login DEV redirecionado para `/dev` em vez de ficar preso na tela de login

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
| `/admin/clients` | `ClientsAdmin` | ✅ Completo (lê e escreve em `profiles`) |
| `/admin/sales` | `SalesAdmin` | ✅ **Completo** (aba Lista + Relatório) |
| `/admin/contracts` | `ContractsAdmin` | ✅ Completo (criação de locação + preenchimento automático + status do imóvel) |
| `/admin/primeiro-acesso` | `ChangePassword` | ✅ Troca obrigatória no 1º acesso (fora do `AdminLayout`) |
| `/admin/renewals` | `RenewalsAdmin` | ✅ Completo (alerta dinâmico por config) |
| `/admin/financial` | `FinancialAdmin` | ✅ 4 abas: Pagamentos, Relatório de Repasse, Lançamentos, Fluxo de Caixa |
| `/admin/legal` | `LegalAdmin` | ✅ Completo |
| `/admin/administrative` | `AdministrativeAdmin` | ✅ **Completo** (Visão Geral + Configurações + endereço da empresa) |
| `/admin/chamados` | `AdminSupport` | ✅ Completo (lista + abertura + conversa) |
| `/admin/equipe` | `AdminTeam` | ✅ Completo (só admin; exige a edge function `org-team` publicada) |

### Portal do Cliente (`/portal/*`)
| Rota | Componente | Status |
|------|-----------|--------|
| `/portal/dashboard` | `PortalDashboard` | ✅ Completo |
| `/portal/properties` | `PortalProperties` | ✅ Completo |
| `/portal/leases` | `PortalLeases` | ✅ Completo |
| `/portal/payments` | `PortalPayments` | ✅ Completo (só marca como reportado) |
| `/portal/documents` | `PortalDocuments` | ✅ Completo |
| `/portal/repasses` | `PortalRepasses` | ✅ Extrato de repasse do proprietário |

---

## 2. Tabelas do Supabase Usadas por Página

### NOVAS TABELAS CRIADAS (Migração 06 + 07)
| Tabela | Descrição |
|--------|-----------|
| ~~`clients`~~ | **Aposentada pela migration 020** (renomeada, não apagada). As pessoas vivem em `profiles` desde a 014 — ver a tabela de pendências |
| `lease_history` | Histórico de alterações em locações |
| `company_settings` | Configurações da empresa (CNPJ, taxa adm, índice reajuste, alerta renovação) |

### Páginas Administrativas

| Página | Tabelas Lidas | Tabelas Escrita | Observações |
|--------|--------------|-----------------|-------------|
| `DashboardAdmin` | `properties`, `leases`, `sales`, `payments` | — | Stats calculadas via `useDashboardStats()` |
| `PropertiesAdmin` | `properties` | `properties` | CRUD completo + autocomplete CEP + abas Lista/Relatório |
| `ClientsAdmin` | `profiles` | `profiles` + edge function `cliente-create` | A tabela `clients` foi unificada em `profiles` (migration 014) |
| `SalesAdmin` | `sales`, `properties` | `sales` | Vincula imóvel + abas Lista/Relatório |
| `ContractsAdmin` | `leases`, `properties` | `leases`, `lease_history` | Contratos de locação |
| ~~LeasesAdmin~~ | — | — | Arquivo apagado: substituído por `/admin/contracts` |
| `RenewalsAdmin` | `leases`, `properties`, `company_settings` | `leases`, `lease_history` | Renovações com alertas dinâmicos |
| `FinancialAdmin` | `payments`, `leases`, `properties`, `sales`, `fee_terms`, `financial_entries`, `profiles` | `payments`, `financial_entries` | Fluxo de caixa calculado em `src/lib/caixa.ts` |
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
| `PortalDocuments` | `documents` | — | Lista o que a RLS já restringe ao próprio cliente |
| `PortalRepasses` | `properties`, `leases`, `payments`, `fee_terms` | — | Extrato do proprietário, por imóvel |

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
| `20260930000001` … `20260930000010` | Conversão multi-tenant: `organizations`, `org_id` em todas as tabelas, RLS por org, painel do DEV, edge functions `dev-admin` e `dev-create-organization` | Sim |
| `20260930000011_settings_upsert_constraint.sql` | Troca o índice UNIQUE solto por constraint em `company_settings(org_id)` — sem ela o `.upsert(..., { onConflict: 'org_id' })` da tela de configurações falha | ✅ Sim |
| `20260930000012_company_address.sql` | Colunas `address_*` em `organizations` + policy de UPDATE | ✅ Sim |
| `20260930000013_third_party_ownership.sql` | Fecha o vazamento de `owner_id` na vitrine pública; `management_type` e `management_fee_percent` em `properties`; `repasse_modelo` em `leases`; valores de repasse em `payments` | ✅ Sim |
| `20260930000014_clients_in_profiles.sql` | Colunas de cliente em `profiles` + índices compostos. Sem elas a aba de Clientes não tem onde gravar | ✅ Sim |
| `20260930000017_profiles_set_org_id.sql` | Trigger `set_org_id` em `profiles` — sem ele o insert chega com `org_id` NULL e a `WITH CHECK` recusa | ✅ Sim |
| `20260930000018_fee_terms.sql` | Tabela única de taxas (locação e venda), com a direção deduzida por trigger | ✅ Sim |
| `20260930000019_financial_entries.sql` | Lançamentos de receita/despesa avulsas, com RLS por org | ✅ Sim |
| `20260930000020_drop_clients.sql` | Aposenta `clients` (rename + RLS desligada; **nada é apagado**). A verificação no topo ABORTA se houver linha sem correspondente em `profiles` | ✅ Sim |

---

## 4. Edge Functions

| Função | Descrição | Status |
|--------|-----------|--------|
| `domus-r2-upload` | Gera presigned URLs para upload direto ao Cloudflare R2 (AWS Sig V4) | ✅ Funcional |
| `cliente-login-request` | Envia código de verificação por e-mail para login de clientes | ✅ Implementada |
| `dev-admin` | Contas, imobiliárias e logs. **Só a conta DEV** | ✅ Implementada |
| `dev-create-organization` | Cria imobiliária + admin inicial. **Só a conta DEV** | ✅ Implementada |
| `org-team` | Admin da imobiliária gerencia a equipe dele: listar, criar, senha, ativar. **Só admin, e só da própria org**. Grava `requires_password_change` ao criar ou redefinir senha | ✅ Publicada |
| `cliente-create` | Cria a conta do cliente em `auth.users` + o profile | ✅ Publicada |

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
| `PropertyModal.tsx` | **Novo** — Modal de imóveis com 4 abas organizadas (Dados Básicos, Estrutura, Valores, Mídia) |
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

### Front 15 — Modal de Imóveis com Abas Organizadas ✅ **NOVO**
- Componente `PropertyModal` completamente refeito com 4 abas:
  - **Dados Básicos**: Título, tipo, status, endereço completo (com autocomplete CEP), descrição
  - **Estrutura**: Áreas (total/útil), ambientes com controles +/- (quartos, suítes, banheiros, vagas), checkboxes de infraestrutura
  - **Valores**: Preço aluguel/venda, taxas (condomínio, IPTU), condições (financiamento, permuta, FGTS)
  - **Mídia**: Upload drag & drop de até 10 fotos + 2 vídeos, URL para tour virtual/vídeo
- Layout moderno: backdrop blur `bg-black/50`, centralizado, max-w-4xl, max-h-90vh
- Rodapé fixo com Cancelar (ghost) e Salvar Cadastro (sólido âmbar)
- Scroll interno nas abas (`overflow-y-auto`)
- Estados de focus nos inputs com cor âmbar
- Integração com `ImageGalleryUploader` para upload R2
- Autocomplete de CEP via API ViaCEP

### Front 16 — Correção das Cores Semânticas (Tailwind v4) ✅ **NOVO**
- **Causa raiz:** o projeto usa Tailwind v4, onde um utilitário de cor só é
  gerado se a cor estiver no bloco `@theme`. Os 19 tokens semânticos estavam
  declarados no `:root` de `src/index.css`, que o Tailwind v4 não enxerga —
  então `.bg-card`, `.bg-background`, `.text-muted-foreground`, `.bg-muted`,
  `.border-input` **não existiam** no bundle. Todo Card, Dialog, Select e Input
  do sistema renderizava sem cor de fundo (~40 arquivos).
- Movidos para `@theme inline`, que resolve o utilitário via `var()`, então a
  troca de valor em `.dark` continua funcionando sem duplicar a paleta
- Afeta toda a aplicação de uma vez — vale revisar as telas com calma

### Front 17 — Tela de Chamados da Equipe ✅ **NOVO**
- Substitui o modal `SupportTicketButton` (que abria no topo, cortado, com
  barra de rolagem) pela rota `/admin/chamados`
- Formulário de abertura à esquerda, lista dos chamados da imobiliária à
  direita, conversa com resposta e "marcar como resolvido" abaixo
- Item **Chamados** no menu (seção Gestão) e o botão do cabeçalho navega para
  a tela em vez de abrir modal
- Isolamento pela RLS (`"Team can view own org tickets"`), não por filtro no
  navegador; `org_id` vem do trigger `set_org_id`

### Front 18 — Ficha da Imobiliária Sincronizada ✅ **NOVO**
- O nome estava duplicado em `organizations.name` (lido pelo menu) e
  `company_settings.company_name` (editado na tela), sem sincronização — por
  isso renomear não mudava o menu
- O save agora grava nos dois e chama `refreshProfile()`: o topo do menu muda
  sem recarregar a página
- Endereço passa a ser editado por partes (logradouro, número, bairro, CEP,
  cidade, UF) em `organizations.address_*`; o `address` em texto é montado no
  save, porque a vitrine pública e o painel do DEV o leem assim
- CEP com autocomplete (BrasilAPI + ViaCEP) extraído para `src/lib/cepLookup.ts`,
  reusado também pelo `PropertyModal`
- **CPF ou CNPJ** na ficha da empresa: a máscara se ajusta ao tamanho
  (11 dígitos → CPF, 14 → CNPJ). A coluna continua `cnpj` por herança
- Erro de save não é mais engolido: distingue falta de migration
  (`schema cache`) de policy/role e diz o que fazer

### Front 19 — Gestão de Imóvel de Terceiro ✅ **NOVO**
Some clientes são proprietários e a imobiliária administra o imóvel deles;
outros são a própria imobiliária locando o que tem. `properties.owner_id` já
existia no schema inicial para isso, mas nunca foi usado.

- **Migration `20260930000013_third_party_ownership.sql`** (❌ pendente `db push`):
  - `properties.management_type` (`terceirizado` | `parceria`) e
    `properties.management_fee_percent`; `owner_id` NULL = imóvel próprio
  - `leases.repasse_modelo` (`via_imobiliaria` | `direto`), default
    `via_imobiliaria` — contrato antigo não quebra
  - `payments.repasse_amount`, `payments.repasse_paid_at`, `payments.fee_amount`
- **Aba "Gestão" no `PropertyModal`**: proprietário (só clientes), tipo de gestão,
  taxa e prévia do repasse
- **`src/lib/repasse.ts`**: `calcularRepasse` é a única fonte da conta, usada
  pela prévia e pelo contrato. O repasse sai da subtração
  (`aluguel − taxa`), não de um segundo cálculo, então as duas partes somam
  exatamente o aluguel — sem o desvio de centavo que o arredondamento separado
  produzia em R$ 1.234,56 a 10%
- **Repasse por contrato no `ContractsAdmin`**: o seletor de circulação e a
  prévia só aparecem quando o imóvel tem `owner_id`
- Taxa guardada no imóvel, não lida de `company_settings` no momento do cálculo:
  se a taxa da empresa mudar, o repasse de ontem continua com o percentual que
  valia quando o contrato foi assinado

### Front 20 — Vazamento corrigido na vitrine pública ✅ **NOVO**
`public_property_detail` era `RETURNS SETOF public.properties`, que devolve a
**linha inteira** — `owner_id` (o UUID do proprietário) e mais 9 colunas
internas (`accepts_fgts`, `iptu_paid`, `occupancy_permit`, `deposit_amount`…)
para qualquer visitante da vitrine. Não apareceu até agora só porque
`owner_id` estava sempre NULL; bastava o primeiro proprietário cadastrado para
o dado de cliente sair para a internet.

- Reescrita com `RETURNS TABLE` explícito, coluna a coluna, como a
  `public_property_listings` já fazia
- A migration tem um bloco `DO` que **aborta** se alguma coluna privada
  reaparecer na assinatura — é o teste que pega a regressão
- `COMMENT ON FUNCTION` registra o motivo, para ninguém voltar ao `SELECT p.*`

### Front 21 — Equipe da Imobiliária ✅ **NOVO**
O admin de uma imobiliária criava a própria imobiliária com um admin, mas não
tinha como cadastrar o corretor que ia operar o sistema: o `dev-admin` exige
`is_dev()`, então a única conta que podia criar contas era a do painel /dev.

- **Edge function `org-team`** (`supabase/functions/org-team/index.ts`):
  autorização **invertida** em relação ao `dev-admin` — quem entra é o admin da
  org, não o DEV
  - `org_id` vem **do token, nunca do corpo**: é o que impede um admin da org A
    de criar conta na org B
  - `dev` está fora de `CONCEDIVEIS` **e** a checagem é explícita, para não
    depender de alguém lembrar de tirar do array
  - `set_password` e `toggle_active` conferem que a conta alvo é da própria org,
    senão o admin trocaria a senha de qualquer conta do sistema com o UUID
  - `list_team` pagina o `auth.admin.listUsers` (uma equipe maior que 200
    apareceria incompleta sem aviso)
  - toda escrita em `admin_audit_log`
- **Tela `/admin/equipe`** (`src/pages/AdminTeam.tsx`): conceder acesso, trocar
  senha, ativar/desativar. Item de menu só para admin — conveniência, não
  segurança; a barreira é a edge function
- **`src/lib/orgTeam.ts`**: client com os papéis concedíveis e suas descrições
- **As contas aparecem sozinhas no painel /dev**: o `list_users` do `dev-admin`
  lê todos os perfis e já mostra `role` e a imobiliária. Nenhuma mudança
  necessária lá — o `app_metadata` é escrito pela mesma edge function

**Ao publicar:** `supabase functions deploy org-team` (a função não sobe sozinha,
e sem ela a tela mostra "Falha ao carregar a equipe").

### Front 22 — Locações corrigida ✅ **NOVO**
Havia **duas telas para a mesma tabela (`leases`)**, e a errada era a que estava
no menu como "Locações":

- `LeasesAdmin` nunca teve formulário de criação. Passava
  `createItem={async () => ({} as Lease)}` e `deleteItem={async () => {}}` — o
  botão **Novo** abria um modal que salvava um objeto vazio, e o de **excluir**
  não apagava nada. Sem `renderForm`, o CRUDPage gerava campos de texto livre a
  partir dos cabeçalhos da tabela, sem nenhum `Select` — por isso não aparecia
  lista de imóveis. Não era falha de carregamento: era ausência de formulário.
- **Unificado em `/admin/contracts`**, que já tinha o formulário completo.
  A rota `/admin/leases` agora redireciona (links antigos seguem funcionando) e
  o item "Contratos" saiu do menu por ser a mesma tela com outro nome.
- **Escolher o imóvel agora preenche o contrato**: traz `rent_price` para o
  aluguel, `deposit_amount` para o depósito, e em imóvel de terceiro o
  proprietário vira o locador. Só preenche campo **vazio** — sobrescrever o
  aluguel ao trocar o imóvel de um contrato vivo mudaria o valor em silêncio.
  O locatário não é preenchido: são pessoas diferentes, e não dá para adivinhar.
- **Trava de imóvel ocupado**: avisa quando o imóvel já tem locação ativa,
  dizendo com quem. A verificação é pelo contrato ativo, não pelo status do
  imóvel — o status é consequência e pode estar desatualizado.
- **Status do imóvel passou a ser automático** (`syncPropertyStatus`): criar
  contrato ativo marca `alugado` (o imóvel sai da vitrine pública, que filtra
  por `disponivel`); encerrar, cancelar ou excluir devolve para `disponivel` se
  não houver outro contrato ativo. Antes disso, um imóvel alugado continuava
  aparecendo como disponível na vitrine, porque nada no sistema mudava o status.
  Imóvel `vendido` ou `reservado` nunca é sobrescrito — ali o status carrega
  informação de venda.

### Front 23 — CEP primeiro e máscaras em todo o sistema ✅ **NOVO**
O CEP era o **último** campo do endereço no `PropertyModal`, e começar pela rua
exige saber a rua antes de saber o CEP. Passou para o primeiro lugar: ao completar
os 8 dígitos, logradouro, bairro, cidade e UF se preenchem sozinhos e o número
fica por conta da pessoa (é a única parte que o CEP não traz).

**Máscaras novas em `src/lib/inputMasks.ts`:**

| Função | Para quê |
|---|---|
| `formatCurrencyInput` / `parseCurrencyInput` | Valor em R$ com milhar e vírgula decimal |
| `formatDecimal` / `parseDecimal` | Áreas em m², taxas em % |
| `formatDocumento` | CPF ou CNPJ no mesmo campo |
| `formatDateBR` | `dd/mm/aaaa` a partir do ISO do banco |
| `onlyNumbers` | Só dígitos, para campos inteiros |

A máscara de moeda **não é trivial** e tem dois casos que só aparecem testando:

- `Number("2.500,00")` dá `NaN`, não 2500. `RenewalsAdmin` gravava o novo
  aluguel com essa conversão — uma renovação podia salvar `NaN` no contrato.
  Agora passa por `parseCurrencyInput`.
- `formatCurrencyInput("1.234")` devolvia `"1,23"`: o ponto era lido como
  decimal. Colar um valor já formatado de outra tela truncaria o número em 20x.
  A regra agora é: mais de um ponto, ou ponto seguido de exatamente 3 dígitos
  sem vírgula, significa milhar.

Testados 14 casos de entrada, incluindo `"R$ 1.200,00"` e `"1.234.567"`.

**Aplicado em:** `PropertyModal` (CEP, áreas, aluguel, venda, condomínio, IPTU,
depósito, taxa de gestão), `ContractsAdmin` (aluguel, depósito, dia de
vencimento), `SalesAdmin` (valor da venda), `RenewalsAdmin` (novo aluguel),
`AdministrativeAdmin` (taxa administrativa, dias de alerta).

**Ficaram como `type="number"` de propósito:** latitude e longitude (7 casas
decimais, e ponto é o separador decimal do formato técnico), o contador de
ambientes com botões +/− e o ano de construção.

### Front 24 — Aba de Clientes corrigida ✅ **NOVO**
A tela não funcionava, e por **dois bugs independentes** que se somavam.

**Bug 1 — lia de uma tabela e escrevia em outra:**
```tsx
useClients()              -> SELECT em clients
useCreateEntity('profiles') -> INSERT em profiles
```
Criar um cliente não o fazia aparecer na lista; editar salvava em `profiles`
campos que só existem em `clients` (`tipo_relacao`, `categoria`, `endereco`,
`status`); e os ids das duas não tinham relação, então excluir apagava a linha
errada.

**Bug 2 — `clients` ficou de fora do multi-tenant.** Não recebeu `org_id`, não
recebeu GRANT, e as policies continuaram com
`auth.jwt()->>'role' IN ('admin', 'corretor', ...)`. Essa é a role do PostgREST,
sempre `'authenticated'` para quem está logado — nunca o papel do Domus. A
condição dava **falso** e a leitura era recusada: a tela aparecia vazia. É o
erro que o `CLAUDE.md` já avisava, acontecendo na única tabela que ficou para
trás.

**Correção:** unificado em `profiles`, que é a tabela que o login do portal, as
leases e os pagamentos já referenciam — e a que tem `org_id` e policies
corretas. `clients` sai de cena.

- **Migration `20260930000014_clients_in_profiles.sql`** (❌ pendente `db push`):
  adiciona a `profiles` as colunas que só existiam em `clients` —
  `tipo_relacao`, `categoria`, `endereco`, `status`, `observacoes`, com os
  mesmos `CHECK` — e os índices compostos `(org_id, cpf_cnpj_limpo)` e
  `(org_id, telefone_e164)`, que são os dois campos que o login do portal usa
- **Exclusão virou desativação.** `profiles` é referenciada por
  `leases.tenant_id`, `leases.landlord_id`, `sales.buyer_id`,
  `sales.seller_id` e `payments.tenant_id`, todas com `ON DELETE RESTRICT` —
  apagar esbarra nos contratos e derruba o login de quem pagou o aluguel no
  portal. Desativar (`status = 'inativo'`) preserva o histórico
- `CRUDPage` ganhou `confirmDeleteTitle` / `Message` / `Label`: a confirmação
  dizia "esta ação não pode ser desfeita", o que seria mentira para desativar
- A badge de status foi invertida: `null` agora conta como ativo, senão todo
  cliente sem `status` aparecia como inativo

### Front 25 — Bugs achados em Renovações ✅ **NOVO**
Corrigidos por estarem no mesmo caminho (`useClients` só era usado aqui):

- **Encerrar contrato nunca salvava.** Mandava `status: 'encerrado'`, que não
  existe no enum `lease_status` = `('ativo','pendente','cancelado','vencido')`.
  O Postgres recusava e o imóvel continuava marcado como alugado. Agora usa
  `'vencido'`
- **O imóvel era atualizado na tabela errada.** O `update` da tela aponta para
  `leases` e era usado para mudar o status do imóvel, ou seja, tentava
  atualizar um id de imóvel na tabela de contratos
- **Locatário em branco em toda linha.** Buscava o nome em `clients`, mas
  `leases.tenant_id` referencia `profiles.id`
- **A busca do alerta usava o id fixo** `00000000-0000-0000-0000-000000000001`
  em vez de `org_id` — recusada pelo RLS em qualquer imobiliária que não seja a
  Domus original, e o alerta caía no padrão de 60 dias sem aviso. Era a
  pendência "Média" que estava no topo da lista há semanas
- O aluguel pré-preenchido na renovação não passava pela máscara

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
| ~~Migrations 015–019~~ | — | **Aplicadas em 30/09.** A 017 corrigia o RLS que impedia criar cliente; a 018 cria `fee_terms`; a 019 cria `financial_entries` |
| ~~Deploy da `cliente-create`~~ | — | **Aplicada em 30/09.** Era o que faltava para criar cliente |
| ~~Deploy da `org-team`~~ | — | **Aplicada em 30/09**, agora gravando o flag `requires_password_change` |
| **Storage RLS** | **Alta** | **Aplicar as políticas de RLS do bucket `domus-files` no SQL Editor do dashboard** (as policies já estão escritas na migration `20260930000003`, mas precisam ser aplicadas manualmente) |
| Taxas de venda (comissão) | **Concluído** | `FeeTermsEditor` em `PropertyModal` (aba Gestão), `ContractsAdmin` (locação) e `SalesAdmin` (venda). A taxa de um mês só existe quando o dinheiro entra — o relatório usa o valor pago, e não o cheio |
| Relatório de repasse no Financeiro | **Concluído** | Aba **Relatório de Repasse** em `/admin/financial`, com tabelas de Locação e Venda. Período configurável. A taxa incide sobre o que foi **pago**, não sobre o aluguel cheio |
| Lançamentos financeiros | **Concluído** | Aba **Lançamentos** (`src/components/LancamentosTab.tsx`). CRUD de `financial_entries` com categoria (campo livre) e vínculo opcional. Aqui o sinal é **digitado** — ao contrário de `fee_terms`, onde o banco deduz a direção |
| Relatório de caixa mensal | **Concluído** | Aba **Fluxo de Caixa**, com `src/lib/caixa.ts`. Cruzamento mensal de aluguel pago, taxa e lançamento. **A direção da taxa decide a forma da linha inteira**: imóvel de cliente entra o bruto e sai o repasse; imóvel da org entra só o líquido; repasse direto registra só a taxa. Somar "o que o locatário pagou" e "as taxas" em separado contaria a taxa duas vezes |
| Troca de senha no primeiro acesso | **Concluído** | O `org-team` grava `requires_password_change` em `app_metadata` (só service role escreve — o usuário não pode reescrever o flag para escapar). Tela cheia em `/admin/primeiro-acesso`, com o gate no `RequireAuth` **antes** do teste de papel: quem entra com senha provisória não vê uma linha da área interna. Redefinir pelo admin também reergue o flag |
| Vínculo locatário/proprietário no portal | **Concluído** | Tela `/portal/repasses`. O proprietário vê, por imóvel, o que já foi repassado, o que está a receber e as taxas. Em repasse direto o locatário pagou direto a ele — a linha aparece cheia. Um mesmo login pode ser locatário e proprietário ao mesmo tempo. **A tela avisa quando há contrato cujo imóvel ainda não tem `owner_id`** — sem ele a RLS esconde o imóvel do cliente e a lista viraria vazia sem explicar por quê |
| Portal Documents | **Concluído** | `/portal/documents`, por tipo e com busca. A listagem não filtra no browser: a RLS `Users can view related documents` já devolve só o que é daquele cliente, e é ela que sabe quem é o proprietário do imóvel |
| Tabela `clients` | **Concluído** | Hook `useClients` e tipos mortos removidos. A tabela foi **aposentada** (renomeada para `clients_aposentada`, RLS desligada) pela migration 020 — nada foi apagado. O `DROP` de verdade fica para quando já tiver passado tempo sem ninguém sentir falta |
| Arquivos órfãos | **Concluído** | `SupportTicketButton.tsx` e `LeasesAdmin.tsx` apagados — nenhum dos dois era importado |
| Testes | **Parcial** | `npm test` roda 19 testes unitários em `src/lib/__tests__/caixa.test.ts`, sobre o cálculo de repasse e o fluxo de caixa. **Eles já pegaram dois bugs reais**: a entrada do aluguel faltando no caixa, e a comissão calculada sobre o percentual em vez do preço. E2E de navegador para login, criação de cliente e upload continua faltando |

---

## 10. Como Testar

### Testes automatizados
```bash
npm test
```
19 testes unitários sobre o cálculo de repasse e o fluxo de caixa
(`src/lib/__tests__/caixa.test.ts`). Rode depois de mexer em
`src/lib/repasse.ts` ou `src/lib/caixa.ts` — é ali que um erro passa
despercebido e aparece como valor errado na tela, sem mensagem de erro.

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
- `/admin/financial` — Pagamentos, Relatório de Repasse, Lançamentos, Fluxo de Caixa
- `/admin/primeiro-acesso` — Só aparece para conta com senha provisória

### Portal
- `/:slug/portal/login` — Login com CPF + código enviado por e-mail
- `/portal/dashboard` — Área do cliente
- `/portal/repasses` — Extrato de repasse do proprietário

### Ordem para testar o repasse de ponta a ponta
1. Cadastre o imóvel e defina o proprietário (aba Gestão do `PropertyModal`).
2. Crie a locação e registre uma taxa de administração em `ContractsAdmin`.
3. Abra um pagamento e marque como pago.
4. `/admin/financial` → **Relatório de Repasse**: a taxa aparece sobre o valor pago.
5. **Fluxo de Caixa**: a mesma operação aparece no mês, com o sinal que a
   direção da taxa determinar.
6. Entre como o proprietário no portal → `/portal/repasses` mostra o extrato.
