import { Suspense } from "react";
import { exigerCompte } from "@/lib/auth/compte";
import { lireReglages } from "@/lib/reglages/requetes";
import { anneeDemandee } from "@/lib/facture/annee";
import { lireAnnees, lireObjectif, lirePostes } from "@/lib/facture/requetes";
import { SelecteurAnnee } from "@/modules/finance/SelecteurAnnee";
import {
  ReglagesObjectif,
  ReglagesOutil,
  ReglagesPostes,
} from "@/modules/finance/Reglages";
import { MonMotDePasse } from "@/lib/design/MonMotDePasse";

export default async function PageReglages({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerCompte();

  const annee = anneeDemandee((await searchParams).annee);

  const [reglages, objectif, postes, annees] = await Promise.all([
    lireReglages(),
    lireObjectif(annee),
    lirePostes(),
    lireAnnees(),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Tes réglages</h1>
          <p className="mt-2 text-sm text-texte-doux">
            Le nom de ton outil, ton objectif de l&apos;année, et tes postes.
          </p>
        </div>
        <Suspense fallback={null}>
          <SelecteurAnnee annee={annee} annees={annees} />
        </Suspense>
      </div>

      <div className="mt-8">
        <ReglagesOutil reglages={reglages} />
        <ReglagesObjectif annee={annee} objectif={objectif} devise={reglages.devise} />
        <ReglagesPostes postes={postes} />
        <MonMotDePasse />
      </div>
    </div>
  );
}
