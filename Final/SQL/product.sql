create table category (
    id              serial primary key,
    description     varchar(50) not null,
);

create table product (
    id serial primary key,
    "categoryId" int references category(id) not null,
    price decimal(15,2) not null,
    description text not null,
    status varchar(20) not null,
    observation text,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
