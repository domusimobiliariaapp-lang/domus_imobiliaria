-- Seed data for development
-- This migration creates sample data for local development

-- Create a sample admin user (password: admin123)
-- Note: In production, use Supabase Auth UI or edge functions to create users

-- Sample properties
INSERT INTO properties (id, title, type, status, address, neighborhood, city, state, zip_code, area_m2, bedrooms, bathrooms, parking, rent_price, sale_price, description, features, owner_id) VALUES
(gen_random_uuid(), 'Apartamento Moderno no Centro', 'apartamento', 'disponivel', 'Rua das Flores, 123', 'Centro', 'Fortaleza', 'CE', '60000-000', 85.5, 3, 2, 1, 2500.00, 450000.00, 'Apartamento reformado com vista para o mar, cozinha planejada e área de lazer completa.', '{"ar_condicionado", "varanda", "elevador", "portaria_24h"}', NULL),
(gen_random_uuid(), 'Casa em Condomínio Fechado', 'casa', 'disponivel', 'Alameda dos Ipês, 456', 'Parque Iracema', 'Fortaleza', 'CE', '60450-000', 220.0, 4, 3, 2, 5000.00, 850000.00, 'Casa térrea com piscina, churrasqueira e jardim. Condomínio com segurança 24h.', '{"piscina", "churrasqueira", "jardim", "seguranca_24h"}', NULL),
(gen_random_uuid(), 'Sala Comercial na Av. Beira Mar', 'sala', 'alugado', 'Av. Beira Mar, 1000 - Sala 501', 'Meireles', 'Fortaleza', 'CE', '60165-000', 65.0, NULL, 1, 1, 3500.00, 0.00, 'Sala comercial com vista para o mar, recepção e banheiro privativo.', '{"vista_mar", "recepcao", "ar_central"}', NULL),
(gen_random_uuid(), 'Terreno para Construção', 'terreno', 'disponivel', 'Estrada da Lagoa, s/n', 'Passaré', 'Fortaleza', 'CE', '60800-000', 500.0, NULL, NULL, NULL, 0.00, 300000.00, 'Terreno plano, murado, com escritura registrada. Ideal para construção residencial ou comercial.', '{"murado", "escritura_registrada", "plano"}', NULL),
(gen_random_uuid(), 'Apartamento Compacto', 'apartamento', 'reservado', 'Rua Padre Mororó, 789', 'Aldeota', 'Fortaleza', 'CE', '60115-000', 55.0, 2, 1, 1, 1800.00, 320000.00, 'Apartamento ideal para casal jovem ou investimento. Próximo a universidades e comércio.', '{"proximo_metro", "area_lazer", "garagem"}', NULL);

-- Sample leases (will need valid tenant/landlord IDs from auth.users)
-- These will be created via application logic when users exist

-- Sample financial data
-- Payments will be created via application logic