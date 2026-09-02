# CLAUDE.md : Suivi des finances

## Ce que c'est

Un outil de suivi des finances d'un indépendant, **donné en modèle**. Celui
qui le récupère l'installe chez lui, sur son propre Supabase et son propre
hébergement, et le modifie s'il veut.

Deux conséquences qui contraignent tout le code :

1. **Rien de l'éditeur ne doit s'y trouver.** Aucun nom, aucun numéro, aucune
   adresse, aucune donnée réelle, aucune marque. `npm run verifier` le
   vérifie à chaque fois, et il refuse. Le README et la licence sont les deux
   seuls endroits où un éditeur se nomme légitimement.
2. **Celui qui l'installe n'est pas développeur.** Chaque message d'erreur dit
   quoi faire, en français, sans jargon. Une panne muette lui coûte une
   soirée et il abandonne.

## Le modèle de données, en trois phrases

**Une facture porte deux dates**, l'émission et l'encaissement, et pas deux
tables. C'est la même somme vue à deux moments. `encaissee_le` nul veut dire
« pas encore payée ».

**Une dépense porte un poste, et le poste est une table**, pas un `enum` : les
postes d'un graphiste ne sont pas ceux d'un coach. Supprimer un poste laisse
les dépenses en place, sans poste (`on delete set null`) : perdre un réglage
est une erreur, perdre une année de comptabilité ne se rattrape pas.

**Un objectif par année**, et non un réglage unique : celui de l'an dernier
doit rester lisible quand on regarde l'an dernier.

## La règle de calcul, la seule qui compte

**Facturé se compte sur l'émission, encaissé sur l'encaissement, et le
résultat sur l'encaissé.**

Une facture émise en décembre et encaissée en janvier appartient au chiffre
d'affaires d'une année et à la trésorerie de l'autre. Tout calcul qui les
range sur une seule date est faux, et ne se voit pas à l'écran : le chiffre
s'affiche proprement et se croit sur parole.

C'est pour ça que `lib/facture/calculs.ts` est le fichier le plus testé du
dépôt, et que `lireFactures` ramène volontairement des factures de l'année
voisine (celles qui chevauchent le 31 décembre). Les fonctions d'affichage
doivent donc toutes savoir ignorer ce qui ne les concerne pas, sans lever.

## L'architecture

`lib/` est le socle : l'authentification, les clientes Supabase, le design,
les réglages, les lectures et les calculs. `modules/finance/` porte les
écrans et les actions serveur. Les modules s'appuient sur le socle, jamais
l'inverse.

`app/(app)/` est un groupe de routes : il donne la barre latérale sans
préfixer les adresses. La connexion, l'installation et le diagnostic vivent
en dehors, ils n'ont pas de barre.

## Les gardes à ne pas desserrer

- **La clé de service n'est lue qu'à un seul endroit**,
  `lib/supabase/service.ts`, et n'est utilisée qu'à un seul autre,
  `lib/auth/installation.ts`, pour créer le premier compte sur une base
  vierge. La liste se vérifie par `grep -rn "supabase/service" lib modules app`,
  jamais par une liste écrite qu'il faudrait croire.
- **La porte d'installation se ferme par la base, pas par une lecture.** La
  table `installation` n'accepte qu'une ligne ; c'est le doublon qui refuse la
  seconde mise en service, pas un `if`.
- **Chaque action serveur commence par `exigerCompte()`.** Une action serveur
  est une requête HTTP à part entière : elle ne traverse aucun layout et
  n'hérite d'aucune garde de page.
- **Sur le schéma `public`, révoquer avant d'accorder.** Supabase donne par
  défaut `INSERT`, `UPDATE` et `DELETE` à `anon` et `authenticated` sur toute
  table nouvelle. Un `grant select` seul ajoute un droit sans en retirer
  aucun. `install.sql` révoque d'abord, en tête de sa section 5.
- **Après toute modification de `install.sql`, lancer le conseiller de
  sécurité de Supabase.**

## Les pièges déjà payés

- **Une variable Vercel de type Secret n'est pas lisible à la construction**,
  or Next recopie les `NEXT_PUBLIC_` dans le code à ce moment-là. Elles
  doivent être de type Config. `next.config.ts` fait échouer la construction
  plutôt que de laisser partir une app muette.
- **Une clé Supabase copiée à la souris contient des puces.** L'affichage
  masqué a exactement la longueur de la vraie clé : rien ne les distingue à
  l'oeil. `next.config.ts` et `/diagnostic` nomment ce cas explicitement.
- **Une hauteur en pour cent a besoin d'un parent de hauteur définie.** Sans
  elle, elle se résout à zéro et les barres du graphique ne se dessinent pas.
  Les tests restent verts : seule une capture d'écran le voit.
- **Une date `2026-01-01` confiée telle quelle à `new Date`** est lue en UTC
  puis rendue dans le fuseau local : à l'ouest de Greenwich, le 1er devient le
  31 du mois d'avant. `lib/dates.ts` ajoute midi avant de construire.

## Conventions

- **Français** partout : commits, commentaires, docs, interface. Le code
  (variables, fonctions) reste en anglais.
- **Tutoiement** dans toute l'interface.
- **Interdit : les tirets longs** (cadratin et demi-cadratin). Virgules, deux
  points ou parenthèses à la place. Un test les cherche dans tout le code.
- **Commits atomiques.** Un commit, un changement cohérent.

## L'outillage

- `npm run dev` démarre l'app en local.
- `npm test` lance les tests unitaires.
- `npm run verifier` refuse toute donnée de l'éditeur dans les fichiers
  versionnés. À lancer avant chaque commit.
- `npm run lint` passe ESLint.

## Sécurité

Les secrets vivent dans `.env.local`, jamais dans le code, jamais commités.
Rien de sensible ne part côté navigateur : un préfixe `NEXT_PUBLIC_` envoie la
valeur à tous les visiteurs.
