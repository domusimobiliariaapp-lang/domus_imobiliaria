# Conversão para multi-tenant

Esta conversão introduz o conceito de **organização** (uma imobiliária). Toda
tabela de negócio ganha `org_id`, e as políticas RLS passam a garantir que uma
imobiliária nunca enxerga dados de outra. Só a conta **DEV** cria organizações.

## Aplicar

Tudo roda em uma sequência só:

```bash
supabase db push
```

## Ordem das migrations

| # | Arquivo | O que faz |
|---|---|---|
| 01 | `create_organizations` | Tabela `organizations`, papel `dev`, `org_id` nullable em 11 tabelas, índices |
| 02 | `org_settings` | `company_settings` e `configuracoes` por org; cria a org `domus` |
| 03 | `org_functions` | Helpers, **RLS reescrita**, trigger `set_org_id`, RPCs públicas |
| 04 | `backfill_org_id` | Promove a conta DEV, preenche `org_id` do que já existe |
| 05 | `enforce_org_not_null` | `NOT NULL` nas tabelas de negócio, com portão |
| 06 | `dev_panel` | Logs de erro, chamados, auditoria, estatísticas do painel |

**Por que o backfill é uma migration e não um passo manual:** a 03 reescreve a
RLS, e a 05 exige `NOT NULL`. Entre elas precisa existir uma migration que
preencha a coluna — sem ela, ou a 05 aborta, ou o sistema fica vazio. Versar o
passo como SQL versionado torna a sequência executável sem intervention.

### O que a 04 pressupõe

Ela promove `admin@domus.com` a `role='dev'` e preenche todo `org_id` com a org
`domus`. Se o seu banco real tiver alguma linha de outra imobiliária, ajuste os
`UPDATE` por tabela **antes** de aplicar — o `WHERE org_id IS NULL` genérico
atribui tudo à Domus, e a RLS não avisa quando o backfill erra, ela apenas
esconde a linha da equipe certa.

## Depois do `db push`

```bash
supabase functions deploy dev-create-organization
supabase functions deploy dev-admin
```

`db push` não publica edge functions. Sem a `dev-create-organization` não dá
para criar imobiliária; sem a `dev-admin` o painel não tem contas, senhas,
status nem exclusão.

## A conta DEV

A 04 promove `admin@domus.com` a DEV. Isso tira o acesso dela ao `/admin` e
passa a usar `/dev` — a org `domus` continua existindo e vazia, e o admin dela
se cria pelo próprio painel.

Para usar outra conta como DEV, crie em **Authentication → Users** e rode:

```sql
UPDATE profiles SET role = 'dev' WHERE email = 'voce@exemplo.com';
```

O `role` precisa ser `'dev'` **e** `org_id` NULL. É esse estado que `is_dev()`
identifica — por isso a 05 deixa `profiles.org_id` nullable.

Para reverter (só em desenvolvimento — a conta perde o acesso a `/dev`):

```sql
UPDATE profiles
   SET role = 'admin',
       org_id = (SELECT id FROM organizations WHERE slug = 'domus')
 WHERE email = 'admin@domus.com';
```

## Painel do DEV (`/dev`)

- **Imobiliárias** — criar, editar, ativar/desativar, excluir
- **Contas** — criar, editar, trocar senha, ativar/desativar, excluir, último acesso
- **Chamados** — abertos pela equipe pelo botão de suporte no `/admin`
- **Erros** — alimentado pelo `ErrorBoundary` e pelas queries do `useSupabase`
- **Auditoria** — ações sensíveis, com autor e horário

Desativar uma imobiliária preserva os dados e é reversível. Excluir apaga tudo e
exige digitar o nome.

## Verificar o isolamento

Isto é o que realmente precisa ser provado — as policies estão ativas desde a 03.
Rode no SQL Editor com o JWT de um corretor da org A no header do PostgREST, e
`<org B>` sendo o id de outra imobiliária:

```sql
SELECT count(*) FROM properties WHERE org_id = '<org B>';   -- esperado: 0
SELECT count(*) FROM leases     WHERE org_id = '<org B>';   -- esperado: 0
SELECT count(*) FROM clients    WHERE org_id = '<org B>';   -- esperado: 0

-- Mover um imóvel para outra org: esperado erro de RLS, não sucesso.
UPDATE properties SET org_id = '<org B>' WHERE id = '<imóvel da org A>';

-- Forjar notificação para o admin de outra org: esperado erro.
INSERT INTO notifications (user_id, title, message, type)
VALUES ('<admin da org B>', 'x', 'y', 'info');

-- Vitrine pública: cada slug devolve só a própria org, e só status='disponivel'.
SELECT count(*) FROM public_property_listings('domus');
SELECT count(*) FROM public_property_listings('outra-imobiliaria');

-- Um cliente não pode se promover a admin pela própria conta.
UPDATE profiles SET role = 'admin' WHERE id = '<id de um cliente>';
```

No app: entrar como admin da org A e confirmar que nenhum dado da org B aparece
em lista, dashboard ou financeiro; criar uma org pelo `/dev`, logar com o admin
criado e ver o sistema vazio; e pelo portal, confirmar que o mesmo CPF em duas
orgs não envia código para a org errada.

## Nomenclatura

`org_id`, e não `tenant_id`. `leases.tenant_id` e `payments.tenant_id` já usam
"tenant" no sentido de **locatário** (inquilino) — são o cliente que paga o
aluguel, não a imobiliária. Os dois sentidos convivendo na mesma tabela é a
forma mais fácil de introduzir um vazamento de dados.
