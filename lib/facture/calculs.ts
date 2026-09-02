import type { Depense, Facture } from "@/lib/facture/types";
import { moisDe } from "@/lib/facture/types";

/**
 * Les chiffres d'une année.
 *
 * **Facturé et encaissé se comptent sur deux dates différentes**, et c'est
 * toute la subtilité de cet écran. Une facture de décembre encaissée en
 * janvier compte dans le facturé d'une année et dans l'encaissé de l'autre :
 * les additionner sur la même date ferait croire à un trou de trésorerie qui
 * n'existe pas, ou à un chiffre d'affaires qui n'est pas encore arrivé.
 *
 * **Le résultat se calcule sur l'encaissé, pas sur le facturé.** C'est ce qui
 * est réellement sur le compte. Un indépendant qui lit son résultat sur du
 * facturé se croit riche de sommes qu'il attend encore.
 */
export type Bilan = {
  facture: number;
  encaisse: number;
  /** Émis cette année et pas encore payé. */
  enAttente: number;
  depenses: number;
  /** Encaissé moins dépenses : ce qui reste vraiment. */
  resultat: number;
  /** Où en est l'objectif, en pour cent. Nul si aucun objectif n'est posé. */
  avancement: number | null;
};

const somme = (liste: { montant: number }[]) =>
  liste.reduce((total, ligne) => total + Number(ligne.montant), 0);

export function bilan(
  factures: Facture[],
  depenses: Depense[],
  annee: number,
  objectif: number,
): Bilan {
  const dans = (date: string | null) => date !== null && date.startsWith(String(annee));

  const emises = factures.filter((f) => dans(f.emise_le));
  const encaissees = factures.filter((f) => dans(f.encaissee_le));

  const facture = somme(emises);
  const encaisse = somme(encaissees);
  const total = somme(depenses);

  return {
    facture,
    encaisse,
    enAttente: somme(emises.filter((f) => f.encaissee_le === null)),
    depenses: total,
    resultat: encaisse - total,
    avancement: objectif > 0 ? Math.round((facture / objectif) * 100) : null,
  };
}

export type Mois = {
  mois: string;
  facture: number;
  encaisse: number;
  depenses: number;
};

/**
 * Les douze mois de l'année, y compris ceux à zéro.
 *
 * Un trou dans une série se lit comme une donnée manquante, un zéro se lit
 * comme un mois creux. Ce n'est pas la même information.
 */
export function parMois(
  factures: Facture[],
  depenses: Depense[],
  annee: number,
): Mois[] {
  const vide = () => ({ facture: 0, encaisse: 0, depenses: 0 });
  const table = new Map<string, ReturnType<typeof vide>>();

  for (let rang = 1; rang <= 12; rang += 1) {
    table.set(`${annee}-${String(rang).padStart(2, "0")}`, vide());
  }

  for (const facture of factures) {
    const emis = table.get(moisDe(facture.emise_le));
    if (emis) emis.facture += Number(facture.montant);

    if (facture.encaissee_le) {
      const encaisse = table.get(moisDe(facture.encaissee_le));
      if (encaisse) encaisse.encaisse += Number(facture.montant);
    }
  }

  for (const depense of depenses) {
    const mois = table.get(moisDe(depense.payee_le));
    if (mois) mois.depenses += Number(depense.montant);
  }

  return [...table.entries()].map(([mois, valeurs]) => ({ mois, ...valeurs }));
}

/** Ce que pèse chaque poste de dépense, du plus lourd au plus léger. */
export function parPoste(
  depenses: Depense[],
  postes: { id: string; nom: string }[],
): { nom: string; montant: number }[] {
  const nomDe = new Map(postes.map((poste) => [poste.id, poste.nom]));
  const table = new Map<string, number>();

  for (const depense of depenses) {
    // Une dépense dont le poste a été supprimé garde sa place dans le total :
    // l'écarter ferait un camembert dont la somme ne fait pas le total affiché
    // juste au-dessus.
    const nom = depense.poste_id ? (nomDe.get(depense.poste_id) ?? "Sans poste") : "Sans poste";
    table.set(nom, (table.get(nom) ?? 0) + Number(depense.montant));
  }

  return [...table.entries()]
    .map(([nom, montant]) => ({ nom, montant }))
    .sort((a, b) => b.montant - a.montant);
}
