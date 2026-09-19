# Domus — Sistema de Gestão Imobiliária

## Negócio
Sistema interno de uma única imobiliária. NÃO é multi-tenant — não existe conceito
de "empresas" ou "organizações": todos os dados pertencem à mesma imobiliária.
Administra locações e vendas de imóveis.

## Dois tipos de usuário
1. Equipe interna (admin, corretor, financeiro, juridico) → área /admin,
   login por e-mail e senha.
2. Cliente (locatário, proprietário, comprador, fiador) → área /portal,
   login por CPF/CNPJ + telefone + código SMS. Só vê dados vinculados a ele mesmo.

## Stack
- React + TypeScript + Tailwind + shadcn/ui, roteamento com react-router-dom
- Supabase para banco (Postgres), autenticação e edge functions
- Cloudflare R2 para arquivos (fotos, PDFs, assinaturas) — NUNCA use Supabase Storage
- Componentes de UI ficam em src/components/ui
- Client do Supabase em src/integrations/supabase/client.ts

## Regras técnicas que valem para todo o projeto
- Segurança de dados via Row Level Security no Postgres, nunca só escondendo botão
  na interface.
- Nenhuma chave secreta (R2, gateway de pagamento, service_role do Supabase) no
  código do front-end — só como variável de ambiente de edge function.
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