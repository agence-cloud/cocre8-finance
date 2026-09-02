-- =====================================================================
--  Suivi des finances : le schéma complet, en une fois.
--
--  À coller dans l'éditeur SQL de ton projet Supabase, puis exécuter.
--  Une seule fois, sur une base neuve.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Les tables
--
--  **Un seul compte, celui de qui installe.** Cet outil regarde l'argent
--  de son propriétaire, et personne d'autre ne s'y connecte. Les
--  permissions se réduisent donc à une question, « es-tu le propriétaire ».
-- ---------------------------------------------------------------------

create table compte (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

-- Ce que tu vises pour une année.
--
-- Une ligne par année et non un réglage unique : l'objectif de l'an dernier
-- reste lisible quand on regarde l'an dernier. Un objectif écrasé chaque
-- janvier rendrait tout historique incomparable.
create table objectif (
  annee smallint primary key check (annee between 2000 and 2100),
  -- Ce que tu veux avoir facturé au 31 décembre.
  facture_vise numeric(12, 2) not null default 0 check (facture_vise >= 0),
  cree_le timestamptz not null default now()
);

-- Une facture émise.
--
-- **Facturé et encaissé sont deux dates, pas deux tables.** C'est la même
-- somme, vue à deux moments : le jour où tu l'as demandée, et le jour où elle
-- est arrivée. Deux tables obligeraient à les rapprocher à la main, et une
-- facture encaissée à moitié n'existe pas dans la vraie vie d'un indépendant.
--
-- `encaissee_le` nul veut dire « pas encore payée », et c'est exactement ce
-- que la colonne « en attente » du tableau de bord additionne.
create table facture (
  id uuid primary key default gen_random_uuid(),
  -- Le client, en texte libre. Cet outil ne tient pas de carnet d'adresses :
  -- c'est le rôle du CRM, et les deux ne se parlent pas.
  client text not null,
  libelle text,
  -- Hors taxes : c'est ce qui fait ton chiffre d'affaires. La TVA n'est pas à
  -- toi, elle transite.
  montant numeric(12, 2) not null check (montant >= 0),
  emise_le date not null,
  encaissee_le date,
  notes text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  -- Une facture ne peut pas être encaissée avant d'être émise. La saisie
  -- inversée est la faute la plus facile à faire sur deux champs de date
  -- côte à côte, et elle fausserait tous les mois.
  constraint encaissement_apres_emission
    check (encaissee_le is null or encaissee_le >= emise_le)
);

create index facture_emise_idx on facture (emise_le);
create index facture_encaissee_idx on facture (encaissee_le);

-- Les postes de dépense, réglables.
--
-- Une table et non un `enum` : les postes d'un graphiste ne sont pas ceux
-- d'un coach, et changer une valeur d'`enum` demande une migration.
create table poste (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ordre smallint not null default 0,
  cree_le timestamptz not null default now()
);

create index poste_ordre_idx on poste (ordre);

-- Une dépense.
--
-- Le poste passe à nul quand on le supprime, plutôt que d'emporter la
-- dépense : perdre un poste est une erreur de réglage, perdre une année de
-- comptabilité ne se rattrape pas.
create table depense (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  montant numeric(12, 2) not null check (montant >= 0),
  payee_le date not null,
  poste_id uuid references poste (id) on delete set null,
  -- Une dépense qui revient tous les mois, marquée comme telle.
  --
  -- **L'outil ne la recopie jamais tout seul, et c'est un choix.** Un
  -- abonnement change de prix, se résilie, saute un mois : une recopie
  -- automatique fabriquerait une comptabilité qui n'a jamais existé, et qu'il
  -- faudrait corriger plus souvent qu'on ne l'aurait saisie. La marque sert à
  -- reconnaître ses charges fixes dans la liste, pas à les inventer.
  recurrente boolean not null default false,
  notes text,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create index depense_payee_idx on depense (payee_le);
create index depense_poste_idx on depense (poste_id);

-- Les réglages, en clé-valeur. Aucun secret n'entre ici.
create table reglage (
  cle text primary key,
  valeur jsonb not null,
  modifie_le timestamptz not null default now()
);

-- La marque de la première mise en service, et le verrou qui l'accompagne.
--
-- Une seule ligne possible, à jamais : la clé primaire vaut `true` et la
-- contrainte interdit `false`. Le second appel se heurte donc à un doublon,
-- et c'est la base qui referme la porte, pas l'application.
create table installation (
  id boolean primary key default true check (id),
  faite_le timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  2. Les fonctions qui décident des permissions
-- ---------------------------------------------------------------------

create or replace function est_le_proprietaire() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from compte where id = auth.uid() and actif);
$$;

create or replace function installation_faite() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from installation); $$;

-- Le nom de l'outil, lu par l'écran de connexion avant toute session.
create or replace function nom_de_loutil() returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select valeur #>> '{}' from reglage where cle = 'nom_programme'),
    'Mes finances'
  );
$$;


-- ---------------------------------------------------------------------
--  3. Les déclencheurs
-- ---------------------------------------------------------------------

create or replace function touche_modifie_le()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

create trigger facture_modifie_le
before update on facture for each row execute function touche_modifie_le();

create trigger depense_modifie_le
before update on depense for each row execute function touche_modifie_le();


-- ---------------------------------------------------------------------
--  4. Les permissions par ligne
--
--  Chaque table est verrouillée, puis ouverte au seul propriétaire. Toutes
--  les politiques portent `to authenticated` : sans cette clause elles
--  s'appliqueraient au rôle `public`, anonyme compris.
-- ---------------------------------------------------------------------

alter table compte enable row level security;
alter table objectif enable row level security;
alter table facture enable row level security;
alter table poste enable row level security;
alter table depense enable row level security;
alter table reglage enable row level security;
alter table installation enable row level security;

create policy proprietaire_tout on objectif for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on facture for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on poste for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on depense for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());
create policy proprietaire_tout on reglage for all to authenticated
  using (est_le_proprietaire()) with check (est_le_proprietaire());

create policy lit_son_compte on compte
  for select to authenticated using (id = auth.uid());

-- Aucune politique sur `installation` : la table ne se lit ni ne s'écrit
-- depuis l'API. La fonction `installation_faite()` répond à sa place, et la
-- pose de la ligne passe par la clé de service, une seule fois.


-- ---------------------------------------------------------------------
--  5. La surface exposée
--
--  Le droit d'exécuter une fonction arrive par deux chemins à la fois, et il
--  faut couper les deux : `anon` hérite de `PUBLIC`, et Supabase lui accorde
--  en plus le droit en direct sur toute fonction nouvelle du schéma.
--
--  Même règle sur les tables : Supabase donne par défaut INSERT, UPDATE et
--  DELETE à `anon` et `authenticated` sur toute table nouvelle du schéma
--  `public`. Un `grant select` seul ajoute un droit sans en retirer aucun.
-- ---------------------------------------------------------------------

revoke all on compte, objectif, facture, poste, depense, reglage, installation
  from anon, authenticated;

grant select on compte to authenticated;
grant select, insert, update, delete on objectif, facture, poste, depense,
  reglage to authenticated;

revoke execute on function public.est_le_proprietaire() from public, anon;
grant execute on function public.est_le_proprietaire() to authenticated;

-- Ces deux-là répondent à un anonyme, et c'est voulu : l'une dit si
-- l'installation a encore lieu d'être, l'autre donne le nom affiché sur
-- l'écran de connexion. Personne n'a de session à ces moments-là.
revoke execute on function public.installation_faite() from public;
grant execute on function public.installation_faite() to anon, authenticated;
revoke execute on function public.nom_de_loutil() from public;
grant execute on function public.nom_de_loutil() to anon, authenticated;

-- La fonction de déclencheur ne s'appelle pas : PostgreSQL l'exécute
-- lui-même, sans vérifier le droit de l'appelant. L'exposer n'apporte rien.
revoke execute on function public.touche_modifie_le() from public, anon, authenticated;


-- ---------------------------------------------------------------------
--  6. Le jeu de départ
--
--  Tout ce qui suit se renomme, se réécrit et se supprime depuis l'app.
--  Ce sont des valeurs de départ, pas une comptabilité.
-- ---------------------------------------------------------------------

insert into poste (nom, ordre) values
  ('Outils et abonnements', 1),
  ('Sous-traitance', 2),
  ('Publicité', 3),
  ('Formation', 4),
  ('Déplacements', 5),
  ('Frais bancaires', 6),
  ('Divers', 7);

-- Aucun objectif d'avance : il se pose pour une année précise, et l'outil ne
-- sait pas laquelle sera la première. L'écran le demande au premier passage.
