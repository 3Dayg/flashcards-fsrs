create table if not exists cards (
  id text not null,
  owner_sub text not null,
  stage text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_sub, stage, id)
);

create index if not exists cards_updated_at_idx on cards (updated_at desc);

create table if not exists reviews (
  id text not null,
  owner_sub text not null,
  stage text not null,
  card_id text not null,
  session_id text not null,
  payload jsonb not null,
  rated_at timestamptz not null,
  primary key (owner_sub, stage, id)
);

create index if not exists reviews_card_id_idx on reviews (owner_sub, stage, card_id);
create index if not exists reviews_session_id_idx on reviews (owner_sub, stage, session_id);
create index if not exists reviews_rated_at_idx on reviews (rated_at desc);
