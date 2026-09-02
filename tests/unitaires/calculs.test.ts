import { describe, expect, it } from "vitest";
import { bilan, parMois, parPoste } from "@/lib/facture/calculs";
import type { Depense, Facture } from "@/lib/facture/types";

/**
 * **Ce fichier garde le seul endroit de l'outil où une erreur se voit mal.**
 * Un bouton qui ne marche pas se remarque tout de suite ; un chiffre d'affaires
 * faux de 3 000 euros s'affiche proprement et se croit sur parole.
 *
 * Le cas qui revient dans presque chaque test est celui d'une facture émise en
 * décembre et encaissée en janvier : c'est lui qui départage un calcul juste
 * d'un calcul qui compte tout sur une seule date.
 */

function facture(partiel: Partial<Facture>): Facture {
  return {
    id: crypto.randomUUID(),
    client: "Client",
    libelle: null,
    montant: 1000,
    emise_le: "2026-03-10",
    encaissee_le: null,
    notes: null,
    ...partiel,
  };
}

function depense(partiel: Partial<Depense>): Depense {
  return {
    id: crypto.randomUUID(),
    libelle: "Dépense",
    montant: 100,
    payee_le: "2026-03-10",
    poste_id: null,
    recurrente: false,
    notes: null,
    ...partiel,
  };
}

describe("bilan", () => {
  it("compte le facturé sur l'émission et l'encaissé sur l'encaissement", () => {
    const factures = [
      // Émise en 2025, encaissée en 2026 : elle ne compte que dans
      // l'encaissé de 2026.
      facture({ montant: 3000, emise_le: "2025-12-20", encaissee_le: "2026-01-15" }),
      // Émise et encaissée en 2026 : elle compte dans les deux.
      facture({ montant: 2000, emise_le: "2026-02-01", encaissee_le: "2026-02-20" }),
      // Émise en 2026, pas encore payée : facturé seulement.
      facture({ montant: 1500, emise_le: "2026-03-01" }),
    ];

    const resultat = bilan(factures, [], 2026, 0);

    expect(resultat.facture).toBe(3500);
    expect(resultat.encaisse).toBe(5000);
    expect(resultat.enAttente).toBe(1500);
  });

  it("calcule le résultat sur l'encaissé et non sur le facturé", () => {
    const factures = [facture({ montant: 5000, emise_le: "2026-01-10" })];
    const depenses = [depense({ montant: 800, payee_le: "2026-01-20" })];

    // Rien n'est encaissé : le résultat est négatif, même si 5 000 sont
    // facturés. C'est exactement ce qu'on veut voir.
    expect(bilan(factures, depenses, 2026, 0).resultat).toBe(-800);
  });

  it("ne compte pas dans l'attente une facture émise une autre année", () => {
    const factures = [facture({ montant: 4000, emise_le: "2025-11-05" })];

    // Elle est bien impayée, mais elle n'a pas été émise en 2026 : la faire
    // apparaître dans l'attente de 2026 gonflerait une année qui n'y est pour
    // rien.
    expect(bilan(factures, [], 2026, 0).enAttente).toBe(0);
  });

  it("rend l'avancement en pour cent, et rien du tout sans objectif", () => {
    const factures = [facture({ montant: 15000, emise_le: "2026-04-01" })];

    expect(bilan(factures, [], 2026, 60000).avancement).toBe(25);
    // Zéro n'est pas un objectif : c'est l'absence d'objectif. Un avancement
    // à zéro pour cent laisserait croire qu'on est très en retard.
    expect(bilan(factures, [], 2026, 0).avancement).toBeNull();
  });
});

describe("parMois", () => {
  it("rend les douze mois, y compris ceux à zéro", () => {
    const mois = parMois([facture({ emise_le: "2026-06-10" })], [], 2026);

    expect(mois).toHaveLength(12);
    expect(mois[0].mois).toBe("2026-01");
    expect(mois[0].facture).toBe(0);
    expect(mois[5].facture).toBe(1000);
  });

  it("pose une facture dans deux mois différents quand elle est payée plus tard", () => {
    const mois = parMois(
      [facture({ montant: 2400, emise_le: "2026-01-31", encaissee_le: "2026-03-05" })],
      [],
      2026,
    );

    expect(mois[0].facture).toBe(2400);
    expect(mois[0].encaisse).toBe(0);
    expect(mois[2].encaisse).toBe(2400);
  });

  it("ignore ce qui tombe hors de l'année sans lever", () => {
    // La lecture ramène volontairement des factures d'une autre année (celles
    // qui chevauchent le 31 décembre). Le graphique ne doit pas essayer de
    // leur trouver une colonne.
    const mois = parMois(
      [facture({ montant: 900, emise_le: "2025-12-01", encaissee_le: "2026-02-02" })],
      [],
      2026,
    );

    expect(mois.reduce((total, m) => total + m.facture, 0)).toBe(0);
    expect(mois[1].encaisse).toBe(900);
  });
});

describe("parPoste", () => {
  const postes = [
    { id: "p1", nom: "Outils" },
    { id: "p2", nom: "Publicité" },
  ];

  it("range les postes du plus lourd au plus léger", () => {
    const resultat = parPoste(
      [
        depense({ montant: 300, poste_id: "p1" }),
        depense({ montant: 1200, poste_id: "p2" }),
        depense({ montant: 100, poste_id: "p1" }),
      ],
      postes,
    );

    expect(resultat).toEqual([
      { nom: "Publicité", montant: 1200 },
      { nom: "Outils", montant: 400 },
    ]);
  });

  it("garde sous « Sans poste » ce dont le poste a été supprimé", () => {
    // Une dépense écartée ferait un camembert dont la somme ne tombe pas sur
    // le total affiché juste au-dessus.
    const resultat = parPoste(
      [
        depense({ montant: 50, poste_id: null }),
        depense({ montant: 70, poste_id: "poste-effacé" }),
      ],
      postes,
    );

    expect(resultat).toEqual([{ nom: "Sans poste", montant: 120 }]);
  });
});
