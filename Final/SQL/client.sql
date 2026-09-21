create table client (
    id              serial primary key,
    name     varchar(50) not null,
    cpf_cnpj varchar(15) not null,
    clienttype varchar(10) not null,
    delivery_address text,
    phone varchar(15),
    email varchar(50)
);
