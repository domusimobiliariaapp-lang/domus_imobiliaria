-- ========== ENUMS ==========
create type user_role as enum ('admin','corretor','financeiro','juridico','cliente');
create type imovel_status as enum ('disponivel','alugado','vendido','reservado','manutencao');
create type contrato_tipo as enum ('locacao','venda');
create type contrato_status as enum ('ativo','em_negociacao','renovado','vencido','encerrado');
create type assinatura_tipo as enum ('simples_canvas','avancada','qualificada_icp');
create type assinatura_status as enum ('pendente','assinado','recusado','expirado');

-- ========== CLIENTES ==========
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  categoria text not null,
  cpf_cnpj text not null unique,
  cpf_cnpj_limpo text generated always as (regexp_replace(cpf_cnpj,'\D','','g')) stored,
  email text,
  telefone text,
  telefone_e164 text,
  endereco text,
  status text not null default 'Ativo',
  observacoes text,
  created_at timestamptz default now()
);
create index on clientes(cpf_cnpj_limpo);
create index on clientes(telefone_e164);

-- ========== PROFILES ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role user_role not null default 'cliente',
  cliente_id uuid references clientes(id),
  telefone text,
  created_at timestamptz default now()
);

-- ========== IMÓVEIS ==========
create table imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  titulo text not null,
  tipo text not null,
  finalidade text not null,
  status imovel_status not null default 'disponivel',
  proprietario_id uuid references clientes(id),
  endereco text, bairro text, cidade text,
  area numeric, quartos int, banheiros int, vagas int,
  valor_locacao numeric default 0,
  valor_venda numeric default 0,
  descricao text,
  created_at timestamptz default now()
);

create table imovel_arquivos (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references imoveis(id) on delete cascade,
  r2_key text not null,
  tipo text default 'foto',
  ordem int default 0,
  created_at timestamptz default now()
);

-- ========== CONTRATOS ==========
create table contratos (
  id uuid primary key default gen_random_uuid(),
  tipo contrato_tipo not null,
  imovel_id uuid references imoveis(id),
  cliente_id uuid references clientes(id),
  proprietario_id uuid references clientes(id),
  fiador_id uuid references clientes(id),
  data_inicio date not null,
  data_fim date,
  valor numeric not null,
  indice_reajuste text,
  dia_vencimento int,
  comissao numeric,
  status contrato_status not null default 'ativo',
  observacoes text,
  pdf_r2_key text,
  created_at timestamptz default now()
);

create table contrato_historico (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references contratos(id) on delete cascade,
  tipo text not null,
  detalhe text,
  criado_por uuid references profiles(id),
  created_at timestamptz default now()
);

create table contrato_assinantes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references contratos(id) on delete cascade,
  cliente_id uuid references clientes(id),
  papel text not null,
  tipo_assinatura assinatura_tipo not null default 'simples_canvas',
  status assinatura_status not null default 'pendente',
  assinatura_r2_key text,
  ip_assinatura text,
  user_agent text,
  hash_documento text,
  assinado_em timestamptz,
  created_at timestamptz default now()
);

-- ========== FINANCEIRO ==========
create table financeiro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  categoria text not null,
  descricao text not null,
  valor numeric not null,
  vencimento date not null,
  pagamento date,
  status text not null default 'Pendente',
  contrato_id uuid references contratos(id),
  cliente_id uuid references clientes(id),
  created_at timestamptz default now()
);

-- ========== JURÍDICO ==========
create table juridico (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  contrato_id uuid references contratos(id),
  cliente_id uuid references clientes(id),
  advogado text,
  status text not null default 'Em andamento',
  data_abertura date not null,
  prazo_proximo date,
  observacoes text,
  created_at timestamptz default now()
);

-- ========== VENDAS ==========
create table propostas (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references imoveis(id),
  cliente_id uuid references clientes(id),
  valor_proposta numeric not null,
  corretor text,
  status text not null default 'Novo',
  data date not null default current_date
);

-- ========== NOTIFICAÇÕES ==========
create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid references profiles(id),
  titulo text not null,
  mensagem text,
  lida boolean default false,
  created_at timestamptz default now()
);

-- ========== FUNÇÕES AUXILIARES DE SEGURANÇA ==========
create or replace function public.is_staff() returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','corretor','financeiro','juridico')
  );
$$ language sql stable security definer;

create or replace function public.meu_cliente_id() returns uuid as $$
  select cliente_id from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- ========== RLS ==========
alter table clientes enable row level security;
alter table profiles enable row level security;
alter table imoveis enable row level security;
alter table imovel_arquivos enable row level security;
alter table contratos enable row level security;
alter table contrato_historico enable row level security;
alter table contrato_assinantes enable row level security;
alter table financeiro enable row level security;
alter table juridico enable row level security;
alter table propostas enable row level security;
alter table notificacoes enable row level security;

-- staff tem acesso total
create policy staff_all_clientes on clientes for all using (is_staff()) with check (is_staff());
create policy staff_all_imoveis on imoveis for all using (is_staff()) with check (is_staff());
create policy staff_all_imovel_arquivos on imovel_arquivos for all using (is_staff()) with check (is_staff());
create policy staff_all_contratos on contratos for all using (is_staff()) with check (is_staff());
create policy staff_all_historico on contrato_historico for all using (is_staff()) with check (is_staff());
create policy staff_all_assinantes on contrato_assinantes for all using (is_staff()) with check (is_staff());
create policy staff_all_financeiro on financeiro for all using (is_staff()) with check (is_staff());
create policy staff_all_juridico on juridico for all using (is_staff()) with check (is_staff());
create policy staff_all_propostas on propostas for all using (is_staff()) with check (is_staff());

-- cliente: somente leitura, somente do que é dele
create policy cliente_ve_si on clientes for select using (id = meu_cliente_id());

create policy cliente_ve_contratos on contratos for select using (
  meu_cliente_id() in (cliente_id, proprietario_id, fiador_id)
);

create policy cliente_ve_financeiro on financeiro for select using (
  cliente_id = meu_cliente_id()
);

create policy cliente_ve_imoveis on imoveis for select using (
  proprietario_id = meu_cliente_id()
  or exists (select 1 from contratos c
             where c.imovel_id = imoveis.id
               and meu_cliente_id() in (c.cliente_id, c.proprietario_id, c.fiador_id))
);

create policy cliente_ve_assinantes on contrato_assinantes for select using (
  cliente_id = meu_cliente_id()
);
create policy cliente_assina on contrato_assinantes for update using (
  cliente_id = meu_cliente_id()
) with check (cliente_id = meu_cliente_id());

create policy cliente_ve_historico on contrato_historico for select using (
  exists (select 1 from contratos c where c.id = contrato_historico.contrato_id
          and meu_cliente_id() in (c.cliente_id, c.proprietario_id, c.fiador_id))
);

-- profiles: cada um lê o seu; ninguém altera o próprio role
create policy leio_meu_profile on profiles for select using (id = auth.uid() or is_staff());
create policy atualizo_meu_profile on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- notificações: cada um vê as suas
create policy minhas_notificacoes on notificacoes for all using (destinatario_id = auth.uid());

-- ========== TRIGGER: cria profile no cadastro de usuário ==========
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, nome, role, cliente_id, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Usuário'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'cliente'),
    (new.raw_user_meta_data->>'cliente_id')::uuid,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();