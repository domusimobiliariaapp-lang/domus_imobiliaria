-- Migration: org_id preenchido automaticamente em profiles
--
-- O sintoma era "criar cliente dá erro de permissão, e a conta é admin".
--
-- profiles é a única tabela de negócio sem o trigger trg_set_org_id. A função
-- public.set_org_id() existe e está correta, mas o trigger só foi instalado em
-- properties, leases, sales, payments, documents, lease_history e clients — em
-- profiles nunca foi.
--
-- Sem o trigger, o insert do cliente chega com org_id NULL: o useCreateEntity
-- descarta o org_id do front-end (e descartá-lo é o certo), e profiles é
-- justamente a tabela de onde public.current_org_id() tira a org de quem está
-- logado, então não pode usar o trigger dela para se preencher. A policy
--
--   INSERT ... WITH CHECK (public.is_internal_team()
--                            AND (public.in_current_org(org_id) OR public.is_dev()))
--
-- recebe NULL, in_current_org() devolve falso, e o insert é recusado. A policy
-- estava certa; o que faltava era a outra metade — o trigger que preenche o
-- valor que a policy valida.
--
-- Não é permissão da conta: acontece com admin, corretor, financeiro e
-- jurídico igualmente, em qualquer imobiliária.

-- profiles.id é a auth.users.id, e o handle_new_user já a vincula ao
-- app_metadata. Não há recursion: set_org_id() consulta profiles da linha do
-- usuário AUTENTICADO (auth.uid()), nunca da linha que está sendo inserida.
--
-- No caminho do handle_new_user o auth.uid() ainda é NULL (a conta acabou de
-- ser criada e ninguém logou), e o trigger respeita o org_id que a própria
-- função leu do app_metadata — o early return de set_org_id existe para isso.
DROP TRIGGER IF EXISTS trg_set_org_id ON public.profiles;
CREATE TRIGGER trg_set_org_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_org_id();
