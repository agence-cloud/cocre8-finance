export type Facture = {
  id: string;
  client: string;
  libelle: string | null;
  montant: number;
  emise_le: string;
  /** Nul tant que l'argent n'est pas arrivé. */
  encaissee_le: string | null;
  notes: string | null;
};

export type Depense = {
  id: string;
  libelle: string;
  montant: number;
  payee_le: string;
  poste_id: string | null;
  recurrente: boolean;
  notes: string | null;
};

export type Poste = { id: string; nom: string; ordre: number };

/**
 * Un montant, dans la devise réglée.
 *
 * Deux décimales quand il y en a, aucune sinon : une dépense de 29 euros
 * s'écrit « 29 », un abonnement à 29,90 s'écrit en entier. Arrondir partout
 * ferait mentir un total sur une longue liste.
 */
export function formaterMontant(montant: number, devise: string): string {
  const nombre = Number(montant);
  const entier = Number.isInteger(nombre);
  return `${nombre.toLocaleString("fr-FR", {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${devise}`;
}

/** Le mois d'une date, au format `2026-03`, qui trie tout seul. */
export function moisDe(date: string): string {
  return date.slice(0, 7);
}
