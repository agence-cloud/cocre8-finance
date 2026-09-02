# Suivi des finances

Ce que tu as facturé, ce qui est réellement rentré, ce que tu as dépensé, et
ce qu'il te reste. Un tableau de bord par année, avec ton objectif.

Un outil que tu installes chez toi, sur ton propre hébergement et ta propre
base. Personne d'autre n'a accès à tes chiffres, nous compris.

## Ce qu'il fait

**Ton tableau de bord :** facturé, encaissé, en attente, dépensé, et le
résultat. L'avancement de ton objectif de l'année, tes douze mois en
graphique, tes dépenses par poste, et les factures qui attendent d'être
payées.

**Tes factures :** qui, combien, émise quand, payée quand. Un clic pour
marquer une facture encaissée le jour où l'argent arrive.

**Tes dépenses :** ce qui sort, rangé dans tes propres postes, avec une marque
pour tes charges qui reviennent tous les mois.

**Tes réglages :** le nom de ton outil, ta devise, ton objectif de l'année, et
tes postes de dépense.

## Facturé ou encaissé, la seule chose à comprendre

Ce sont deux chiffres différents, et confondre les deux est la faute qui coûte
le plus cher à un indépendant.

**Facturé**, c'est ce que tu as demandé. **Encaissé**, c'est ce qui est arrivé
sur ton compte. Entre les deux il y a parfois deux mois.

L'outil compte donc chaque facture sur deux dates, celle de l'émission et
celle de l'encaissement. Une facture de décembre payée en janvier compte dans
le chiffre d'affaires d'une année et dans la trésorerie de l'autre : c'est la
réalité, et l'outil la montre telle quelle.

**Ce qu'il te reste se calcule toujours sur l'encaissé**, jamais sur le
facturé. Un résultat calculé sur du facturé te rend riche de sommes que tu
attends encore.

## Le récupérer

Tu n'as rien à télécharger. Le bouton de l'étape 3 se charge de tout : il te
crée ta copie du code sur GitHub, et il la met en ligne dans la foulée.

Si tu préfères avoir le code sous les yeux d'abord, le bouton vert
**« Use this template »** en haut de cette page t'en fait une copie, et
« Code » puis « Download ZIP » te la met sur ton ordinateur.

## L'installer

Quatre étapes, une quinzaine de minutes, aucune ligne de commande.

### 1. Ta base de données

Va sur [supabase.com](https://supabase.com), crée un compte gratuit, puis
« New project ». Donne-lui un nom, choisis une région proche de toi, et note
le mot de passe qu'il te demande quelque part. Attends deux minutes qu'il se
prépare.

C'est ta base : elle t'appartient, et personne d'autre n'y a accès.

### 2. Créer les tables

Ouvre le fichier [`install.sql`](./install.sql) sur cette page, et clique sur
l'icône de copie en haut à droite du fichier.

Retourne sur Supabase, clique sur **SQL Editor** dans la colonne de gauche,
colle, et clique sur **Run**. C'est fait. Tu n'as rien à comprendre dans ce
fichier.

### 3. Mettre l'app en ligne

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fagence-cloud%2Fcocre8-finance&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Les%20trois%20valeurs%20de%20ton%20projet%20Supabase&project-name=suivi-finances&repository-name=suivi-finances)

Ce bouton fait tout d'un coup : il te crée un compte Vercel si tu n'en as pas,
il pose ta copie du code sur ton GitHub, et il met l'app en ligne. Il te
demande d'abord trois valeurs. Elles sont toutes dans le projet Supabase que
tu viens de créer :

| Ce que Vercel demande | Où le trouver dans Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings, **Data API**, ligne « Project URL » |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings, **API Keys**, la clé `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Au même endroit, la clé `service_role` |

**Copie chaque clé avec le petit bouton de copie**, jamais en sélectionnant le
texte à l'écran. Supabase les affiche masquées avec des points, et une clé
masquée a exactement la même longueur que la vraie : rien ne permet de les
distinguer à l'oeil.

La troisième, `service_role`, est un secret. Elle ne sert qu'à créer ton tout
premier compte, et elle ne doit jamais sortir de chez toi.

Si tu te trompes sur l'une des deux premières, la construction s'arrête et te
dit en français laquelle cloche et pourquoi. La troisième n'est lue qu'au
moment de créer ton compte, à l'étape suivante, et l'écran te le dira aussi.

Dans les deux cas : corrige la valeur chez Vercel, puis clique sur
**Redeploy**. Une valeur corrigée ne prend effet qu'au déploiement suivant.

### 4. Ton compte

Ouvre l'adresse que Vercel te donne. Un écran te demande ton nom, ton email et
un mot de passe.

Ce premier compte devient le tien, et **la porte se referme derrière toi pour
toujours** : il n'y a pas de formulaire d'inscription, personne d'autre ne
peut se créer un compte chez toi.

Va ensuite dans tes réglages poser ton objectif de l'année, puis saisis ta
première facture.

## Le faire tourner sur ton ordinateur

Facultatif. L'app marche très bien sans que tu ouvres jamais un terminal. Ceci
ne sert qu'à modifier le code.

Il te faut [Node.js](https://nodejs.org), puis dans le dossier :

```
npm install
cp .env.example .env.local     # puis remplis les trois valeurs
npm run dev
```

L'app répond sur `http://localhost:3000`, contre la même base que ta version
en ligne.

## Si quelque chose ne répond pas

Ouvre `/diagnostic` sur ton installation, par exemple
`https://ton-app.vercel.app/diagnostic`. La page dit l'adresse qu'elle
interroge, si tes trois valeurs sont bien arrivées, et si ton projet Supabase
lui répond. C'est la première chose à regarder quand la connexion refuse : une
adresse ou une clé fausse produit exactement le même écran qu'un mot de passe
faux.

Trois pièges qui coûtent une soirée chacun :

- **Copie tes clés avec le bouton de copie**, jamais en sélectionnant le texte
  affiché. Supabase les montre masquées, et une clé masquée a exactement la
  longueur de la vraie : rien ne distingue les deux à l'oeil, et l'app se
  contente de refuser la connexion.
- Sur Vercel, une variable de type **Secret** n'est pas lisible pendant la
  construction. Les deux valeurs `NEXT_PUBLIC_` doivent être de type
  **Config**, sinon elles arrivent vides sans que rien ne le montre. Seule
  `SUPABASE_SERVICE_ROLE_KEY` reste un Secret.
- Une valeur corrigée ne prend effet qu'au **déploiement suivant**. Corrige,
  puis redéploie.

## Ce qu'il ne fait pas

Ce n'est pas un logiciel de comptabilité, et il ne prétend pas l'être. Il ne
calcule pas ta TVA, il n'édite pas de facture à envoyer, il ne se branche sur
aucune banque et sur aucun encaisseur. Il ne remplace pas ton comptable.

Il fait une chose : te montrer où tu en es, sans que tu aies à ouvrir un
tableur.

Les montants sont **hors taxes**, partout. C'est ce qui fait ton chiffre
d'affaires : la TVA n'est pas à toi, elle transite.

## La pile

Next.js, Supabase, Tailwind. Tout le code est là, tu peux le modifier.

## Licence

**Cet outil t'est donné.** Tu peux t'en servir pour ton activité, le modifier
autant que tu veux, l'héberger sous ton nom, et le faire tourner pour tes
propres clients. Tu n'as rien à payer et rien à demander.

**La seule chose que tu ne peux pas faire, c'est le revendre**, le redonner, ou
le proposer comme s'il était ton produit. Le texte complet est dans
[`LICENSE`](./LICENSE), en français, et il se lit en deux minutes.

Un usage qui ne rentre dans aucune case ? Écris-nous. La réponse est souvent
oui.

Édité par [Cocre8](https://cocre8.fr).
