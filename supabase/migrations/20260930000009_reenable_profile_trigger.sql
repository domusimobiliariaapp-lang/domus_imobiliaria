-- Migration: reabilita a trigger de criação de profile
--
-- A trigger on_auth_user_created está com tgenabled = 'O' (origin), ou seja,
-- existe mas está DESLIGADA. handle_new_user() nunca roda, e a única
-- manifestação é que dev-create-organization reporta "a conta foi criada mas o
-- perfil não foi gerado" — a conta existe no auth.users, sem linha em profiles,
-- e portanto sem org e sem acesso a nada.
--
-- Não sei quando desligou; pode ter sido o apply de uma migration que recriou a
-- função handle_new_user sem recriar a trigger. O ponto é que uma trigger
-- desligada não gera erro nem aviso: o sistema simplesmente para de criar
-- profile, e nada denuncia isso até alguém tentar usar uma conta nova.
--
-- Esta migration recria a trigger ligando, e o bloco de verificação abaixo
-- transforma a ausência do profile em erro visível, para a próxima vez não
-- passar despercebida.

-- ============================================================
-- TRIGGER
-- ============================================================

-- Recriar a partir do zero: a original foi criada na migration 20260919000004.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

DO $$
DECLARE
  estado "char";
BEGIN
  SELECT t.tgenabled INTO estado
    FROM pg_trigger t
   WHERE t.tgrelid = 'auth.users'::regclass
     AND t.tgname = 'on_auth_user_created'
     AND NOT t.tgisinternal;

  IF estado IS NULL THEN
    RAISE EXCEPTION 'A trigger on_auth_user_created não foi criada.';
  ELSIF estado <> 'O' THEN
    RAISE EXCEPTION
      'A trigger on_auth_user_created está em estado %, esperado O (origin).', estado;
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created ligada e habilitada.';
  END IF;
END $$;

-- ============================================================
-- CONTAS ÓRFÃS
-- ============================================================

-- As tentativas que falharam antes desta correção podem ter deixado usuários
-- em auth.users sem linha correspondente em profiles: a conta existe, mas
-- não entra em lugar nenhum, porque toda policy de leitura de profile exige
-- que a linha exista. Pior, o login delas passaria — a autenticação é do
-- GoTrue, e ele não sabe que o profile falta.
--
-- Criar o profile faltante é seguro: a conta é do próprio dono do sistema, e
-- sem org ela não acessa dado de nenhuma imobiliária.
INSERT INTO public.profiles (id, role, full_name, email)
SELECT
  u.id,
  -- Papel vem do app_metadata quando existe; senão 'cliente', que é o
  -- default seguro. Nunca 'admin' por dedução.
  COALESCE(
    (SELECT m.role::user_role
       FROM jsonb_to_record(COALESCE(u.raw_app_meta_data, '{}'::jsonb)) AS m(role TEXT)
      WHERE m.role IN ('dev', 'admin', 'corretor', 'financeiro', 'juridico', 'cliente')),
    'cliente'::user_role
  ),
  COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'Usuário'),
  u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- ============================================================
-- CONTAGEM FINAL
-- ============================================================

DO $$
DECLARE
  orfas BIGINT;
BEGIN
  SELECT count(*) INTO orfas
    FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

  IF orfas > 0 THEN
    RAISE WARNING 'Ainda há % contas sem profile.', orfas;
  ELSE
    RAISE NOTICE 'Toda conta do auth.users tem profile correspondente.';
  END IF;
END $$;
