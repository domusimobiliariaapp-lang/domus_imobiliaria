# Domus — Sistema de Gestão Imobiliária

## Negócio
Sistema multi-tenant de gestão imobiliária. Cada **organização** da tabela
`organizations` é uma imobiliária, com seus próprios clientes, imóveis,
contratos, equipe e site público. Uma imobiliária nunca enxerga dados de outra —
o isolamento é feito por RLS no Postgres, nunca escondendo botão na interface.

Administra locações e vendas de imóveis.

### Organizações, e o porquê de `org_id`
Toda tabela de negócio tem `org_id`, preenchido no servidor pelo trigger
`set_org_id` e validado pela policy RLS. **Nunca** aceite `org_id` do front-end:
`useCreateEntity`/`useUpdateEntity` descartam o campo antes de enviar, mas quem
chamar o `.insert()` direto também tem a policy como rede.

A coluna se chama `org_id` e não `tenant_id` porque `leases.tenant_id` e
`payments.tenant_id` já usam "tenant" no sentido de **locatário** (inquilino) —
o cliente que paga o aluguel. São dois sentidos diferentes na mesma tabela; não
misture.

## Três tipos de usuário
1. Equipe interna (admin, corretor, financeiro, juridico) → área /admin,
   login por e-mail e senha. A imobiliária vem do próprio perfil, sem digitar
   código no login.
2. Cliente (locatário, proprietário, comprador, fiador) → área /portal,
   login por CPF/CNPJ + telefone (identificação) + código enviado por e-mail
   (verificação), na tela `/:slug/portal/login`. Só vê dados vinculados a ele mesmo.
3. **DEV** → área `/dev`. Conta fora de qualquer organização: é a única que cria
   imobiliárias e gerencia contas. Nunca adicione um `dev` fora desse fluxo.

## Painel do DEV (`/dev`)
Cinco abas, em `src/pages/Dev*.tsx`:
- **Imobiliárias** — criar/editar/ativar/excluir
- **Contas** — criar, editar, trocar senha, ativar/desativar, excluir, último acesso
- **Chamados** — abertos pela equipe pelo botão de suporte no `/admin`
- **Erros** — alimentado pelo `ErrorBoundary` e pelo `useSupabase`
- **Auditoria** — ações sensíveis, com autor e horário

Ações que exigem service role (criar/excluir conta, senha, listar logins) passam
pela edge function `dev-admin`; tudo mais vai direto pelo RLS. O client está em
`src/lib/devAdmin.ts`.

## Stack
- React + TypeScript + Tailwind + shadcn/ui, roteamento com react-router-dom
- Supabase para banco (Postgres), autenticação e edge functions
- Cloudflare R2 para arquivos (fotos, PDFs, assinaturas) — NUNCA use Supabase Storage
- Componentes de UI ficam em src/components/ui
- Client do Supabase em src/integrations/supabase/client.ts

## Regras técnicas que valem para todo o projeto
- Segurança de dados via Row Level Security no Postgres, nunca só escondendo botão
  na interface.
- **Isolamento por imobiliária é responsabilidade da RLS.** Ao escrever uma
  policy nova, o padrão é `org_id = current_org_id() OR is_dev()`, e policy de
  UPDATE precisa de `WITH CHECK` além do `USING` — sem ele, um usuário da org A
  move a linha para a org B.
- A página pública não consulta tabela: usa as RPCs `public_property_listings`,
  `public_property_detail` e `public_org_branding`, que filtram por slug. Não
  crie policy de SELECT para `anon` em `properties` — isso vazaria a vitrine de
  uma imobiliária para as outras.
- `auth.jwt()->>'role'` é a role do PostgREST (sempre `'authenticated'` para
  quem está logado), **não** o papel do Domus. Use `public.get_current_user_role()`.
  Havia policies quebradas por causa disso.
- Nenhuma chave secreta (R2, gateway de pagamento, service_role do Supabase) no
  código do front-end — só como variável de ambiente de edge function.
- Toda edge function que use service role precisa checar quem está chamando
  **antes** de usar a service role. A service role ignora a RLS, então essa
  checagem é a única barreira.
- `enable_signup` está desligado: contas nascem pela edge function ou pelo admin
  da imobiliária. O `role` e o `org_id` vêm de `app_metadata` (só service role
  escreve), nunca de `user_metadata`.
- Todo texto de interface em português do Brasil. Valores em Real (R$), datas em
  dd/mm/aaaa.
- Depois de qualquer mudança, rode `npm run build` e confirme que não há erro de
  tipo antes de considerar a tarefa concluída.
- Não crie um arquivo chamado sidebar.tsx em components/ui — o shadcn/ui reserva
  esse nome. Componentes de layout próprios do projeto vão em
  src/components/layout, prefixados com "domus-".

## Identidade visual
- Cor principal: verde-petróleo escuro #17323D
- Cor de destaque/ação: âmbar #AD7B3B
- Fundo: bege claro #EEECE5, superfícies em branco
- Títulos em Newsreader (font-serif), texto em Inter (font-sans)
- Cantos pouco arredondados (4-6px), sem sombras exageradas
- Suporte a modo escuro

## Estrutura do projeto
```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── layout/             # domus-sidebar, domus-header, admin-layout, portal-layout
├── hooks/                  # useAuth, useSupabase
├── integrations/supabase/  # client.ts
├── lib/                    # utils.ts
├── pages/                  # LoginAdmin, LoginPortal, DashboardAdmin, DevOrganizations
├── types/                  # index.ts — tipos TypeScript
└── App.tsx
```

## Rotas
- `/login` — equipe interna; `/dev` — conta DEV
- `/admin/*` — área da equipe interna
- `/portal/*` — área do cliente
- `/:slug/imoveis`, `/:slug/imovel/:id` — vitrine pública da imobiliária do slug
- `/:slug/portal/login` — login do cliente, sem ambiguidade entre imobiliárias
  (o mesmo CPF pode estar em duas carteiras)

O slug da Domus original é `domus`. Links antigos `/imovel/:id` redirecionam
para `/domus/imovel/:id`.

## Configuração de ambiente
1. Copiar `.env.example` para `.env`
2. Preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. R2: configurar edge functions separadamente (nunca no frontend)
4. Rodar `supabase db push` para aplicar migrations no projeto cloud

## Commands úteis
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção (roda TypeScript + Vite)
- `npm run lint` — lint com oxlint
- `supabase link --project-ref celdewmegikrlanlrzsg` — vincular projeto
- `supabase db push` — aplicar migrations no banco remoto

## Banco de dados
- Projeto Supabase: celdewmegikrlanlrzsg (us-west-2)
- Migrations em supabase/migrations/
- Tabela: organizations, profiles, clients, properties, leases, sales, payments,
  documents, notifications, lease_history, company_settings, configuracoes,
  app_error_logs, support_tickets, support_messages, admin_audit_log
- RLS habilitado em todas as tabelas
- Functions helper: get_current_user_role(), current_org_id(), in_current_org(),
  is_internal_team(), is_client(), is_dev()
- Triggers: set_org_id (preenche org_id no servidor), set_notification_org_id,
  handle_new_user (cria profile no signup, lendo role/org de app_metadata)
- A conversão multi-tenant tem um passo manual obrigatório (backfill) entre as
  migrations 03 e 04 — ver `supabase/migrations/README-multi-tenant.md`