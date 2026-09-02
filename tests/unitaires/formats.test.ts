import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aujourdhui, formaterDate, formaterJourMois } from "@/lib/dates";
import { formaterMontant, moisDe } from "@/lib/facture/types";
import { contientTiretLong } from "@/lib/design/typographie";

describe("formaterMontant", () => {
  it("écrit les centimes seulement quand il y en a", () => {
    expect(formaterMontant(29, "€")).toBe("29 €");
    expect(formaterMontant(29.9, "€")).toBe("29,90 €");
  });

  it("sépare les milliers", () => {
    // L'espace de `toLocaleString` est une espace insécable étroite, pas une
    // espace ordinaire : la comparer à " " ferait échouer ce test sans raison
    // visible à l'oeil.
    expect(formaterMontant(12500, "€").replace(/\s/g, " ")).toBe("12 500 €");
  });

  it("prend la devise qu'on lui donne", () => {
    expect(formaterMontant(40, "CHF")).toBe("40 CHF");
  });
});

describe("les dates", () => {
  it("écrit le premier du mois en ordinal, les autres en cardinal", () => {
    expect(formaterJourMois("2026-03-01")).toBe("1er mars");
    expect(formaterJourMois("2026-03-02")).toBe("2 mars");
  });

  it("ne décale jamais le jour, quel que soit le fuseau du lecteur", () => {
    // Une date confiée telle quelle à `new Date` est lue en UTC puis rendue
    // dans le fuseau local : à l'ouest de Greenwich, le 1er devient le 31 du
    // mois d'avant. C'est le défaut que le midi ajouté empêche.
    expect(formaterDate("2026-01-01")).toBe("1er janvier 2026");
    expect(formaterDate("2026-12-31")).toBe("31 décembre 2026");
  });

  it("rend une date du jour au format des champs de date", () => {
    expect(aujourdhui()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("découpe le mois d'une date", () => {
    expect(moisDe("2026-07-14")).toBe("2026-07");
  });
});

/**
 * **Les tirets longs sont interdits dans tout ce qui s'affiche**, et cette
 * règle ne tient que si quelque chose la vérifie : elle se glisse dans un
 * texte sans qu'on la voie, et personne ne relit trente fichiers pour un
 * caractère qui ressemble à un trait d'union.
 */
describe("aucun tiret long dans l'interface", () => {
  it("n'en trouve dans aucun fichier de l'app", () => {
    const fichiers = execSync("git ls-files 'app/**/*.tsx' 'lib/**/*.ts*' 'modules/**/*.tsx'", {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);

    const fautifs = fichiers
      // Le fichier qui définit la règle doit pouvoir écrire les deux
      // caractères qu'elle interdit, sinon il ne peut pas les chercher.
      .filter((chemin) => chemin !== "lib/design/typographie.ts")
      .filter((chemin) => contientTiretLong(readFileSync(chemin, "utf8")));

    expect(fautifs).toEqual([]);
  });
});
