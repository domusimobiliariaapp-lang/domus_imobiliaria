# Arquitetura de Subdomínios & Configuração de Domínio — Domus SaaS

Este documento descreve como o suporte a subdomínios por cliente/imobiliária foi implementado no Domus e como configurar no domínio oficial do sistema: **`gestaodomus.com.br`**.

---

## 1. Como Funciona a Experiência

O sistema possui dois modos de acesso baseados na URL:

### A. Domínio Principal (Landing Page Comercial)
* **Exemplos:** `gestaodomus.com.br`, `www.gestaodomus.com.br`, `localhost:5173`
* **Rota `/`:** Carrega a **Landing Page Comercial** com apresentação do sistema, demonstração de telas reais, simulador de ROI, tabela de preços e formulário de teste grátis (trial de 14 dias).
* **Botão "Acessar Sistema":** Leva para `/login` (login da equipe interna).

### B. Subdomínio da Imobiliária (Tenant / Multi-tenant)
* **Exemplos:** `aurora.gestaodomus.com.br`, `prime.gestaodomus.com.br`, `aurora.localhost:5173`
* **Rota `/`:** Redireciona e abre imediatamente a **Vitrine Pública de Imóveis** daquela imobiliária (`/aurora/imoveis`).
* **Rota `/portal` ou `/portal/login`:** Identifica automaticamente a organização e abre o Portal do Inquilino/Proprietário sem que o cliente precise digitar o slug manualmente.

---

## 2. Como Testar em Desenvolvimento Local

Navegadores modernos (Google Chrome, Microsoft Edge, Firefox) **já resolvem nativamente qualquer endereço terminado em `.localhost` para o IP `127.0.0.1`** sem que você precise alterar o arquivo `hosts` do Windows!

Para testar localmente:
1. Inicie o servidor Vite:
   ```bash
   npm run dev
   ```
2. Acesse no navegador:
   * **Landing Page:** `http://localhost:5173/`
   * **Vitrine da Imobiliária Aurora:** `http://aurora.localhost:5173/`
   * **Vitrine da Domus:** `http://domus.localhost:5173/`
   * **Simulação via parâmetro URL (fallback):** `http://localhost:5173/?subdomain=aurora`

---

## 3. Guia de Configuração no Domínio `gestaodomus.com.br`

### Passo 1: Configurar DNS Wildcard no Registro.br / Provedor de Domínio
Crie os seguintes registros DNS apontando para o seu serviço de hospedagem (ex: Vercel, Cloudflare Pages ou servidor VPS):

| Tipo | Nome (Host) | Valor / Destino | Finalidade |
| :--- | :--- | :--- | :--- |
| **A** ou **CNAME** | `@` | IP do servidor ou `cname.vercel-dns.com` | Domínio raiz (`gestaodomus.com.br`) |
| **CNAME** | `www` | `cname.vercel-dns.com` | Redirecionamento `www.gestaodomus.com.br` |
| **CNAME** | `*` | `cname.vercel-dns.com` | **Wildcard: captura qualquer subdomínio dinamicamente** (`*.gestaodomus.com.br`) |

### Passo 2: Configurar Domínio na Plataforma de Hospedagem (Ex: Vercel)
1. Nas configurações do projeto (**Settings > Domains**):
   * Adicione `gestaodomus.com.br`
   * Adicione `*.gestaodomus.com.br` (Wildcard Domain)
2. A plataforma emitirá automaticamente um **Certificado SSL Wildcard (Let's Encrypt)** gratuito, garantindo que qualquer subdomínio criado (ex: `nova-imobiliaria.gestaodomus.com.br`) já abra com cadeado de segurança HTTPS ativo.

---

## 4. Estrutura do Código Implementado

* **`src/lib/subdomain.ts`**:
  * `extractSubdomain(hostname)`: Extrai o slug do subdomínio tratando domínios nacionais (`.com.br`), internacionais, `localhost` e ignorando subdomínios reservados (`www`, `app`, `dev`, `api`, etc.).
  * `getSubdomainInfo()`: Retorna o status de tenant ativo e o slug resolvido.
* **`src/lib/__tests__/subdomain.test.ts`**:
  * 6 testes unitários cobrindo todos os cenários de URLs e subdomínios.
* **`src/pages/LandingPage.tsx`**:
  * Landing page completa de alta conversão, com visual refinado Newsreader + Inter e paleta oficial Domus.
* **`src/components/landing/LiveScreenShowcase.tsx`**:
  * Demonstração interativa das telas reais do sistema (Dashboard, Locações, CRM, Financeiro, Portal e Vitrine).
* **`src/components/landing/PricingTable.tsx`**:
  * Tabela de planos Starter, Profissional e Enterprise com toggle mensal/anual.
* **`src/components/landing/RoiCalculator.tsx`**:
  * Calculadora interativa de economia de horas e retorno sobre investimento.
* **`src/components/landing/TrialModal.tsx`**:
  * Modal de cadastro de teste grátis com reserva imediata do subdomínio e integração com WhatsApp comercial.
* **`src/components/landing/FaqSection.tsx`**:
  * Acordeão com respostas às principais dúvidas comerciais e técnicas.
* **`src/App.tsx`**:
  * Integração das rotas com chaveamento dinâmico entre Landing Page e Vitrine da Imobiliária.
