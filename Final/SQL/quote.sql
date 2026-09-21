create table quote(
    id serial primary key,
    clientid int references client(id) not null,
    userid uuid references profile(id) not null,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    validity_days int not null,
    finalized_at timestamptz,
    total_value decimal(15,2) not null
);

create table product_quote(
    id serial primary key,
    quoteid int references quote(id) not null,
    productid int references product(id) not null,
    description text,
    amount int not null,
    product_value decimal(15,2) not null,
    total_value decimal(15,2) not null
);