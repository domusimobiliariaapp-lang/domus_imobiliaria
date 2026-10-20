# Domus — Instruções de desenvolvimento

## Visão do produto
Este repositório implementa um sistema imobiliário multi-tenant. Cada organização corresponde a uma imobiliária isolada por `org_id` e por políticas RLS no Postgres. O produto não é um sistema de “uma única imobiliária”; a arquitetura foi convertida para múltiplas empresas em um único banco.

## Modelo de negócio
- `organizations` representa cada imobiliária
- `profiles` guarda usuários e seu vínculo com uma organização
- `properties`, `leases`, `sales`, `payments`, `documents` etc. sempre pertencem a uma `org_id`
- o conceito de `org_id` é diferente de `tenant_id`: `tenant_id` em `leases` e `payments` significa locatário, e não a imobiliária

## Tipos de usuário
1. Interno: `admin`, `corretor`, `financeiro`, `juridico`
2. Cliente: `cliente`
3. DEV: `dev`

A conta DEV não é uma organização e não deve ser tratada como membro interno de qualquer imobiliária. A criação e administração de contas, organizações e permissões sensíveis passam pela edge function `dev-admin`.

## Regras obrigatórias
- Todo registro de negócio precisa de `org_id` e a política de acesso deve usar `current_org_id()` e `is_dev()`.
- Nunca confie no `org_id` vindo do front-end; o valor deve ser preenchido no servidor e validado pela RLS.
- `role` e `org_id` devem vir de `app_metadata` no Supabase; nunca de `user_metadata`.
- `auth.jwt()->>'role'` não representa o papel do Domus; use `public.get_current_user_role()`.
- O DEV fica fora de qualquer org; contas internas sempre têm org vinculada.
- Os dados públicos (vitrine) nunca consultam `properties` sem filtro por slug e pela org correta; use as RPCs públicas.
- Nenhuma secret key no front-end; qualquer operação que exija service role fica em edge function.
- Toda edge function que usa service role deve validar o chamador antes de usar a service role.
- O `enable_signup` está desligado; contas nascem por fluxo controlado pela borda do backoffice ou pela edge function.

## Roteamento e acesso
- `/login` — login da equipe interna
- `/dev` — painel do DEV
- `/admin/*` — área interna da equipe
- `/portal/*` — área do cliente
- `/:slug/portal/login` — login do cliente sem ambiguidade entre imobiliárias
- `/:slug/imoveis` e `/:slug/imovel/:id` — vitrine pública por slug

O slug da Domus original é `domus`. Links antigos `/imovel/:id` devem redirecionar para `/domus/imovel/:id`.

## Segurança e padronização
- Toda tabela de negócio deve ter RLS habilitado.
- Policies de UPDATE precisam de `WITH CHECK` além de `USING`.
- O padrão da policy é: `org_id = current_org_id() OR is_dev()`.
- Não esconda dados apenas na UI; a proteção real está no banco.
- Texto em português do Brasil. Datas em `dd/mm/aaaa`. Moedas em `R$`.

## Template para alterações
Ao alterar código ou regras de acesso:
1. confirmar se a mudança preserva a isolação por organização;
2. confirmar que o backend também valida e não só a tela;
3. confirmar que a conta DEV continua fora da organização;
4. rodar `npm run build` antes de fechar a tarefa.

## Arquivos-chave
- `src/App.tsx` — rotas, guards e redirecionamentos
- `src/hooks/useAuth.tsx` — sessão, perfil e organização atual
- `src/integrations/supabase/client.ts` — cliente do Supabase
- `src/lib/devAdmin.ts` — orquestração de ações administrativas sensíveis
- `supabase/functions/dev-admin/index.ts` — validação de permissões e service role
- `supabase/functions/cliente-login-request/index.ts` — login do cliente com OTP por e-mail
- `supabase/migrations/README-multi-tenant.md` — histórico da conversão multi-tenant
