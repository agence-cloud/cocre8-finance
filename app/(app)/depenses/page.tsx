import { Suspense } from "react";
import { exigerCompte } from "@/lib/auth/compte";
import { lireReglages } from "@/lib/reglages/requetes";
import { anneeDemandee } from "@/lib/facture/annee";
import { lireAnnees, lireDepenses, lirePostes } from "@/lib/facture/requetes";
import { SelecteurAnnee } from "@/modules/finance/SelecteurAnnee";
import { Depenses } from "@/modules/finance/Depenses";

export default async function PageDepenses({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerCompte();

  const annee = anneeDemandee((await searchParams).annee);

  const [reglages, depenses, postes, annees] = await Promise.all([
    lireReglages(),
    lireDepenses(annee),
    lirePostes(),
    lireAnnees(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Tes dépenses</h1>
          <p className="mt-2 text-sm text-texte-doux">
            Ce qui sort, rangé dans tes propres postes.
          </p>
        </div>
        <Suspense fallback={null}>
          <SelecteurAnnee annee={annee} annees={annees} />
        </Suspense>
      </div>

      <div className="mt-8">
        <Depenses depenses={depenses} postes={postes} devise={reglages.devise} annee={annee} />
      </div>
    </>
  );
}
