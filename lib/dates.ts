/**
 * **Cet outil ne manipule que des dates, jamais des instants.** Une facture
 * est émise un jour, une dépense payée un jour : l'heure n'existe nulle part,
 * et le fuseau horaire non plus. C'est ce qui permet à tout ce fichier de
 * tenir en trois fonctions.
 *
 * Corollaire à ne pas perdre de vue : une date au format `2026-03-14` confiée
 * telle quelle à `new Date` est lue en UTC, puis réaffichée dans le fuseau du
 * navigateur. À l'ouest de Greenwich, le 14 devient le 13. Toutes les
 * fonctions d'ici ajoutent donc midi avant de construire la date, et lisent
 * ensuite en UTC : le décalage n'a plus assez de marge pour changer le jour.
 */

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Les mêmes, abrégés, pour les étiquettes d'un graphique. */
export const MOIS_COURTS = [
  "jan", "fév", "mar", "avr", "mai", "juin",
  "juil", "août", "sep", "oct", "nov", "déc",
];

function lire(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

/**
 * « 14 mars 2026 ». L'année est là parce qu'un écran de finances laisse voir
 * deux années à la fois : une facture émise en décembre et encaissée en
 * janvier apparaît dans les deux.
 */
export function formaterDate(iso: string): string {
  const date = lire(iso);
  const jour = date.getUTCDate();
  return `${jour === 1 ? "1er" : jour} ${MOIS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** « 14 mars », sans l'année, quand l'année est déjà écrite au-dessus. */
export function formaterJourMois(iso: string): string {
  const date = lire(iso);
  const jour = date.getUTCDate();
  return `${jour === 1 ? "1er" : jour} ${MOIS[date.getUTCMonth()]}`;
}

/**
 * « mars 2026 », à partir d'un mois au format `2026-03`.
 *
 * L'année est écrite alors qu'un écran ne montre qu'une année à la fois : les
 * listes ramènent volontairement les factures de l'année voisine qui
 * chevauchent le 31 décembre, et un séparateur « décembre » sans année
 * laisserait croire à un mois de l'année regardée.
 */
export function moisEnToutesLettres(mois: string): string {
  const [annee, rang] = mois.split("-");
  return `${MOIS[Number(rang) - 1]} ${annee}`;
}

/** La date du jour au format `2026-03-14`, celui des champs de date. */
export function aujourdhui(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}
