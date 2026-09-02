import { Suspense } from "react";
import { exigerCompte } from "@/lib/auth/compte";
import { lireReglages } from "@/lib/reglages/requetes";
import { anneeDemandee } from "@/lib/facture/annee";
import { bilan, parMois, parPoste } from "@/lib/facture/calculs";
import {
  lireAnnees,
  lireDepenses,
  lireFactures,
  lireObjectif,
  lirePostes,
} from "@/lib/facture/requetes";
import { SelecteurAnnee } from "@/modules/finance/SelecteurAnnee";
import { TableauDeBord } from "@/modules/finance/TableauDeBord";

export default async function PageTableau({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerCompte();

  const annee = anneeDemandee((await searchParams).annee);

  // En parallèle et non l'une après l'autre : six allers-retours en file
  // auraient fait de cet écran le plus lent de l'app, pour des lectures qui
  // ne dépendent pas les unes des autres.
  const [reglages, factures, depenses, postes, objectif, annees] = await Promise.all([
    lireReglages(),
    lireFactures(annee),
    lireDepenses(annee),
    lirePostes(),
    lireObjectif(annee),
    lireAnnees(),
  ]);

  const chiffres = bilan(factures, depenses, annee, objectif);
  const impayees = factures
    .filter((facture) => facture.encaissee_le === null && facture.emise_le.startsWith(String(annee)))
    .sort((a, b) => a.emise_le.localeCompare(b.emise_le));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Ton tableau de bord</h1>
          <p className="mt-2 text-sm text-texte-doux">
            Ce que tu as facturé, ce qui est rentré, et ce qu&apos;il te reste.
          </p>
        </div>
        {/* `Suspense` parce que le sélecteur lit les paramètres de l'adresse :
            sans lui, toute la page bascule en rendu à la demande. */}
        <Suspense fallback={null}>
          <SelecteurAnnee annee={annee} annees={annees} />
        </Suspense>
      </div>

      <div className="mt-8">
        <TableauDeBord
          bilan={chiffres}
          mois={parMois(factures, depenses, annee)}
          objectif={objectif}
          postes={parPoste(depenses, postes)}
          impayees={impayees}
          devise={reglages.devise}
          annee={annee}
        />
      </div>
    </>
  );
}
