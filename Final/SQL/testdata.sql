-- ============================================================
-- CATEGORIES
-- ============================================================

insert into category (description) values
    ('Informática'),
    ('Eletrônicos'),
    ('Móveis'),
    ('Material de Escritório'),
    ('Periféricos'),
    ('Redes'),
    ('Telefonia'),
    ('Áudio e Vídeo'),
    ('Acessórios'),
    ('Impressão');


-- ============================================================
-- CLIENTS
-- ============================================================

insert into client
    (name, cpf_cnpj, clienttype, delivery_address, phone, email)
values
    ('João da Silva', '12345678901', 'PF',
     'Rua das Palmeiras, 145, Maringá - PR',
     '(44) 99821-4532', 'joao.silva@email.com'),

    ('Mariana Oliveira', '23456789012', 'PF',
     'Avenida Brasil, 821, Maringá - PR',
     '(44) 99142-7821', 'mariana.oliveira@email.com'),

    ('Carlos Eduardo Santos', '34567890123', 'PF',
     'Rua Neo Alves Martins, 532, Maringá - PR',
     '(44) 99731-2948', 'carlos.santos@email.com'),

    ('Fernanda Almeida', '45678901234', 'PF',
     'Rua Santos Dumont, 1090, Sarandi - PR',
     '(44) 99284-6157', 'fernanda.almeida@email.com'),

    ('Rafael Pereira', '56789012345', 'PF',
     'Rua Curitiba, 387, Londrina - PR',
     '(43) 99817-3245', 'rafael.pereira@email.com'),

    ('Camila Rodrigues', '67890123456', 'PF',
     'Avenida Mandacaru, 742, Maringá - PR',
     '(44) 99173-8462', 'camila.rodrigues@email.com'),

    ('Lucas Martins', '78901234567', 'PF',
     'Rua Paraná, 216, Paiçandu - PR',
     '(44) 99621-5738', 'lucas.martins@email.com'),

    ('Patrícia Ferreira', '89012345678', 'PF',
     'Rua XV de Novembro, 654, Maringá - PR',
     '(44) 99834-2197', 'patricia.ferreira@email.com'),

    ('André Carvalho', '90123456789', 'PF',
     'Rua Machado de Assis, 321, Sarandi - PR',
     '(44) 99128-6347', 'andre.carvalho@email.com'),

    ('Juliana Costa', '01234567890', 'PF',
     'Avenida Colombo, 1834, Maringá - PR',
     '(44) 99742-1836', 'juliana.costa@email.com'),

    ('Alfa Tecnologia Ltda', '12345678000101', 'PJ',
     'Avenida Paraná, 1500, Maringá - PR',
     '(44) 3031-4521', 'contato@alfatecnologia.com'),

    ('Maringá Comércio e Serviços Ltda', '23456789000112', 'PJ',
     'Rua Neo Alves Martins, 2100, Maringá - PR',
     '(44) 3221-7834', 'contato@maringacomercio.com'),

    ('Norte Sul Distribuidora Ltda', '34567890000123', 'PJ',
     'Avenida Tiradentes, 890, Londrina - PR',
     '(43) 3324-6512', 'vendas@nortesul.com'),

    ('Digital Solutions Tecnologia', '45678901000134', 'PJ',
     'Rua Santos Dumont, 450, Maringá - PR',
     '(44) 3028-1945', 'financeiro@digitalsolutions.com'),

    ('Comercial Boa Compra Ltda', '56789012000145', 'PJ',
     'Avenida Brasil, 3200, Sarandi - PR',
     '(44) 3264-9182', 'compras@boacompra.com'),

    ('Construtora Horizonte Ltda', '67890123000156', 'PJ',
     'Rua Curitiba, 780, Maringá - PR',
     '(44) 3031-7284', 'administrativo@horizonte.com'),

    ('Mercado São José Ltda', '78901234000167', 'PJ',
     'Rua Paraná, 1120, Paiçandu - PR',
     '(44) 3244-5128', 'compras@mercadosaojose.com'),

    ('Escritório Contábil Paraná', '89012345000178', 'PJ',
     'Avenida Brasil, 1750, Maringá - PR',
     '(44) 3226-8391', 'contato@contabilparana.com'),

    ('Clínica Vida Saúde Ltda', '90123456000189', 'PJ',
     'Rua Neo Alves Martins, 965, Maringá - PR',
     '(44) 3032-7418', 'administracao@vidasaude.com'),

    ('Grupo Empresarial Aurora', '01234567000190', 'PJ',
     'Avenida Colombo, 4200, Maringá - PR',
     '(44) 3025-6183', 'contato@aurora.com');


-- ============================================================
-- PRODUCTS
-- ============================================================

insert into product
    (categoryid, price, description, status, observation)
values

    -- Informática
    (1, 4599.90, 'Notebook Lenovo IdeaPad 3', 'ACTIVE',
     'Ryzen 7, 16GB RAM, SSD 512GB'),

    (1, 3899.90, 'Notebook Acer Aspire 5', 'ACTIVE',
     'Intel Core i5, 16GB RAM, SSD 512GB'),

    (1, 5299.90, 'Notebook Dell Inspiron 15', 'ACTIVE',
     'Intel Core i7, 16GB RAM, SSD 512GB'),

    (1, 4299.90, 'Desktop Dell OptiPlex', 'ACTIVE',
     'Core i5, 16GB RAM, SSD 512GB'),

    (1, 6199.90, 'Desktop Gamer Ryzen 7', 'ACTIVE',
     'Ryzen 7, 32GB RAM, RTX 4060'),

    -- Eletrônicos
    (2, 1299.90, 'Monitor LG UltraGear 24"', 'ACTIVE',
     'Full HD, 144Hz'),

    (2, 1899.90, 'Monitor Samsung Odyssey 27"', 'ACTIVE',
     'Full HD, 165Hz'),

    (2, 3499.90, 'Smart TV Samsung 50"', 'ACTIVE',
     '4K UHD'),

    (2, 4299.90, 'Smart TV LG 55" OLED', 'ACTIVE',
     '4K OLED'),

    (2, 899.90, 'Tablet Samsung Galaxy Tab A9', 'ACTIVE',
     '64GB, Wi-Fi'),

    -- Móveis
    (3, 799.90, 'Mesa de Escritório em MDF', 'ACTIVE',
     'Mesa 120cm com gavetas'),

    (3, 1299.90, 'Mesa Executiva Premium', 'ACTIVE',
     'Mesa 160cm em madeira'),

    (3, 899.90, 'Cadeira de Escritório Ergonômica', 'ACTIVE',
     'Encosto ajustável'),

    (3, 1599.90, 'Cadeira Presidente Premium', 'ACTIVE',
     'Revestimento em couro sintético'),

    (3, 649.90, 'Armário de Escritório 2 Portas', 'ACTIVE',
     'Estrutura em MDF'),

    -- Material de Escritório
    (4, 29.90, 'Caderno Universitário 200 Folhas', 'ACTIVE',
     'Capa dura'),

    (4, 12.90, 'Caneta Esferográfica Azul - Caixa', 'ACTIVE',
     'Caixa com 50 unidades'),

    (4, 18.90, 'Papel Sulfite A4 500 Folhas', 'ACTIVE',
     '75g/m²'),

    (4, 34.90, 'Pasta Arquivo Sanfonada', 'ACTIVE',
     '12 divisórias'),

    (4, 8.50, 'Bloco de Notas Adesivas', 'ACTIVE',
     '500 folhas'),

    -- Periféricos
    (5, 349.90, 'Teclado Mecânico HyperX Alloy', 'ACTIVE',
     'Switches mecânicos'),

    (5, 299.90, 'Mouse Logitech G502', 'ACTIVE',
     'Mouse gamer com 11 botões'),

    (5, 149.90, 'Mouse Logitech M720', 'ACTIVE',
     'Mouse sem fio'),

    (5, 89.90, 'Teclado Logitech K120', 'ACTIVE',
     'Teclado USB ABNT2'),

    (5, 499.90, 'Headset HyperX Cloud III', 'ACTIVE',
     'Headset gamer'),

    -- Redes
    (6, 249.90, 'Roteador TP-Link Archer C6', 'ACTIVE',
     'Gigabit, Wi-Fi 5'),

    (6, 499.90, 'Roteador TP-Link Archer AX55', 'ACTIVE',
     'Wi-Fi 6'),

    (6, 799.90, 'Switch TP-Link 24 Portas', 'ACTIVE',
     'Gigabit Ethernet'),

    (6, 129.90, 'Access Point TP-Link', 'ACTIVE',
     'Wi-Fi dual band'),

    (6, 39.90, 'Cabo de Rede CAT6 10m', 'ACTIVE',
     'Cabo UTP CAT6'),

    -- Telefonia
    (7, 2499.90, 'Samsung Galaxy A55', 'ACTIVE',
     '128GB'),

    (7, 3999.90, 'Samsung Galaxy S24', 'ACTIVE',
     '256GB'),

    (7, 5499.90, 'iPhone 15', 'ACTIVE',
     '128GB'),

    (7, 6999.90, 'iPhone 16 Pro', 'ACTIVE',
     '256GB'),

    (7, 1999.90, 'Motorola Edge 50', 'ACTIVE',
     '256GB'),

    -- Áudio e Vídeo
    (8, 599.90, 'JBL Flip 6', 'ACTIVE',
     'Caixa de som Bluetooth'),

    (8, 899.90, 'JBL Charge 5', 'ACTIVE',
     'Caixa de som portátil'),

    (8, 1299.90, 'Sony WH-1000XM4', 'ACTIVE',
     'Fone Bluetooth com cancelamento de ruído'),

    (8, 399.90, 'Echo Dot 5ª Geração', 'ACTIVE',
     'Smart speaker'),

    (8, 699.90, 'Google Nest Audio', 'ACTIVE',
     'Smart speaker'),

    -- Acessórios
    (9, 79.90, 'Hub USB-C 7 em 1', 'ACTIVE',
     'HDMI, USB e leitor SD'),

    (9, 129.90, 'Suporte para Notebook', 'ACTIVE',
     'Alumínio ajustável'),

    (9, 59.90, 'Webcam Full HD', 'ACTIVE',
     '1080p com microfone'),

    (9, 119.90, 'HDMI 2.1 2 metros', 'ACTIVE',
     'Cabo HDMI 2.1'),

    (9, 149.90, 'Carregador USB-C 65W', 'ACTIVE',
     'Power Delivery'),

    -- Impressão
    (10, 899.90, 'Impressora HP DeskJet', 'ACTIVE',
     'Multifuncional Wi-Fi'),

    (10, 1299.90, 'Impressora Epson EcoTank', 'ACTIVE',
     'Tanque de tinta'),

    (10, 2499.90, 'Impressora Laser Brother', 'ACTIVE',
     'Impressão monocromática'),

    (10, 399.90, 'Scanner Epson WorkForce', 'ACTIVE',
     'Scanner de documentos'),

    (10, 179.90, 'Cartucho HP 667 Preto', 'ACTIVE',
     'Cartucho original');


-- ============================================================
-- QUOTES
-- ============================================================

insert into quote
    (clientid, userid, created_at, validity_days, finalized_at, total_value)
values
    (
        1,
        '84ddc5af-f37c-4cf0-8b0a-3912a089857d',
        '2026-08-01 09:15:00-03',
        15,
        '2026-08-03 14:20:00-03',
        0
    ),
    (
        2,
        'face8c31-4f41-4667-be2d-2b831f4bb432',
        '2026-08-02 10:30:00-03',
        30,
        null,
        0
    ),
    (
        3,
        'e32d751c-87e4-4295-9929-e69b0296be26',
        '2026-08-04 08:45:00-03',
        15,
        '2026-08-05 16:10:00-03',
        0
    ),
    (
        4,
        '84ddc5af-f37c-4cf0-8b0a-3912a089857d',
        '2026-08-06 13:20:00-03',
        7,
        null,
        0
    ),
    (
        5,
        'face8c31-4f41-4667-be2d-2b831f4bb432',
        '2026-08-08 11:00:00-03',
        30,
        '2026-08-10 09:30:00-03',
        0
    ),
    (
        6,
        'face8c31-4f41-4667-be2d-2b831f4bb432',
        '2026-08-11 15:45:00-03',
        15,
        null,
        0
    ),
    (
        7,
        'e32d751c-87e4-4295-9929-e69b0296be26',
        '2026-08-13 09:10:00-03',
        30,
        '2026-08-14 10:00:00-03',
        0
    ),
    (
        8,
        '84ddc5af-f37c-4cf0-8b0a-3912a089857d',
        '2026-08-15 14:35:00-03',
        7,
        null,
        0
    ),
    (
        9,
        'face8c31-4f41-4667-be2d-2b831f4bb432',
        '2026-08-17 16:20:00-03',
        15,
        '2026-08-18 08:40:00-03',
        0
    ),
    (
        10,
        'e32d751c-87e4-4295-9929-e69b0296be26',
        '2026-08-20 10:05:00-03',
        30,
        null,
        0
    );


-- ============================================================
-- PRODUCTS IN QUOTES
-- ============================================================

insert into product_quote
    (quoteid, productid, description, amount, product_value, total_value)
values
    (1, 1, 'Notebook Lenovo IdeaPad 3', 2, 4599.90, 9199.80),
    (1, 6, 'Monitor LG UltraGear 24"', 2, 1299.90, 2599.80),
    (1, 21, 'Teclado Mecânico HyperX Alloy', 2, 349.90, 699.80),

    (2, 2, 'Notebook Acer Aspire 5', 3, 3899.90, 11699.70),
    (2, 22, 'Mouse Logitech G502', 3, 299.90, 899.70),
    (2, 26, 'Roteador TP-Link Archer C6', 1, 249.90, 249.90),

    (3, 3, 'Notebook Dell Inspiron 15', 1, 5299.90, 5299.90),
    (3, 7, 'Monitor Samsung Odyssey 27"', 2, 1899.90, 3799.80),
    (3, 25, 'Headset HyperX Cloud III', 2, 499.90, 999.80),

    (4, 11, 'Mesa de Escritório em MDF', 4, 799.90, 3199.60),
    (4, 13, 'Cadeira de Escritório Ergonômica', 4, 899.90, 3599.60),
    (4, 18, 'Papel Sulfite A4 500 Folhas', 20, 18.90, 378.00),

    (5, 5, 'Desktop Gamer Ryzen 7', 2, 6199.90, 12399.80),
    (5, 23, 'Mouse Logitech M720', 2, 149.90, 299.80),
    (5, 38, 'Hub USB-C 7 em 1', 5, 79.90, 399.50),

    (6, 8, 'Smart TV Samsung 50"', 3, 3499.90, 10499.70),
    (6, 36, 'JBL Charge 5', 3, 899.90, 2699.70),

    (7, 12, 'Mesa Executiva Premium', 2, 1299.90, 2599.80),
    (7, 14, 'Cadeira Presidente Premium', 2, 1599.90, 3199.80),
    (7, 42, 'Impressora HP DeskJet', 1, 899.90, 899.90),

    (8, 31, 'Samsung Galaxy A55', 4, 2499.90, 9999.60),
    (8, 40, 'Carregador USB-C 65W', 4, 149.90, 599.60),

    (9, 32, 'Samsung Galaxy S24', 2, 3999.90, 7999.80),
    (9, 37, 'Sony WH-1000XM4', 2, 1299.90, 2599.80),
    (9, 43, 'Impressora Epson EcoTank', 1, 1299.90, 1299.90),

    (10, 33, 'iPhone 15', 2, 5499.90, 10999.80),
    (10, 41, 'Webcam Full HD', 2, 59.90, 119.80),
    (10, 44, 'Impressora Laser Brother', 1, 2499.90, 2499.90);


-- ============================================================
-- UPDATE QUOTE TOTALS
-- ============================================================

update quote q
set total_value = pq.total
from (
    select
        quoteid,
        sum(total_value) as total
    from product_quote
    group by quoteid
) pq
where q.id = pq.quoteid;