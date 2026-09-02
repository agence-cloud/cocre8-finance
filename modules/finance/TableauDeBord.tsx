import Link from "next/link";
import { Carte } from "@/lib/design/Carte";
import { CarteStat } from "@/lib/design/CarteStat";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { formaterDate } from "@/lib/dates";
import { formaterMontant, type Facture } from "@/lib/facture/types";
import type { Bilan, Mois } from "@/lib/facture/calculs";
import { GraphiqueAnnee } from "@/modules/finance/GraphiqueAnnee";

/**
 * L'écran d'ouverture : où en est l'année, en un regard.
 *
 * **L'ordre des cartes est celui des questions qu'on se pose**, pas celui de
 * la base : ce que j'ai facturé, ce qui est rentré, ce qui manque, ce que
 * j'ai dépensé. Le résultat vient après, parce qu'il se lit à la lumière des
 * quatre autres.
 */
export function TableauDeBord({
  bilan,
  mois,
  objectif,
  postes,
  impayees,
  devise,
  annee,
}: {
  bilan: Bilan;
  mois: Mois[];
  objectif: number;
  postes: { nom: string; montant: number }[];
  impayees: Facture[];
  devise: string;
  annee: number;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat
          icone="facture"
          libelle="Facturé"
          valeur={formaterMontant(bilan.facture, devise)}
          detail={`Émis en ${annee}`}
        />
        <CarteStat
          icone="coche"
          libelle="Encaissé"
          valeur={formaterMontant(bilan.encaisse, devise)}
          detail="Ce qui est réellement arrivé"
        />
        <CarteStat
          icone="attente"
          libelle="En attente"
          valeur={formaterMontant(bilan.enAttente, devise)}
          detail={
            impayees.length === 0
              ? "Tout est payé"
              : `${impayees.length} facture${impayees.length > 1 ? "s" : ""} à relancer`
          }
        />
        <CarteStat
          icone="depense"
          libelle="Dépensé"
          valeur={formaterMontant(bilan.depenses, devise)}
          detail="Sorties de l'année"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Le résultat en carte posée, seul de son ton sur l'écran : c'est le
            chiffre qu'on est venu chercher. */}
        <Carte>
          <MicroLibelle>Ce qui reste</MicroLibelle>
          <p
            className={`mt-4 text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums ${
              bilan.resultat < 0 ? "text-accent" : "text-titre"
            }`}
          >
            {formaterMontant(bilan.resultat, devise)}
          </p>
          <p className="mt-3 text-sm text-texte-doux">
            Encaissé moins dépenses. Calculé sur ce qui est arrivé sur le
            compte, jamais sur ce qui est facturé : c&apos;est la seule
            lecture qui ne se trompe pas.
          </p>

          <div className="mt-6 border-t border-bordure pt-5">
            <MicroLibelle>Ton objectif {annee}</MicroLibelle>
            {objectif === 0 ? (
              <p className="mt-3 text-sm text-texte-doux">
                Aucun objectif posé.{" "}
                <Link href="/reglages" className="text-accent hover:underline">
                  Pose-le dans tes réglages
                </Link>
                .
              </p>
            ) : (
              <>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-titre">
                    {bilan.avancement}%
                  </span>
                  <span className="text-sm text-texte-doux">
                    de {formaterMontant(objectif, devise)}
                  </span>
                </p>
                {/* La barre ne déborde pas au-delà de 100 % : un objectif
                    dépassé se lit dans le pourcentage à côté, pas dans une
                    barre qui sort de sa boîte. */}
                <div className="mt-3 h-2 overflow-hidden rounded-pilule bg-fond-alt">
                  <div
                    className="h-full rounded-pilule bg-accent"
                    style={{ width: `${Math.min(100, bilan.avancement ?? 0)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </Carte>

        <Carte ton="calme" className="lg:col-span-2">
          <MicroLibelle>Mois par mois</MicroLibelle>
          <div className="mt-6">
            <GraphiqueAnnee mois={mois} devise={devise} />
          </div>
        </Carte>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Carte ton="calme">
          <MicroLibelle>Tes dépenses par poste</MicroLibelle>
          {postes.length === 0 ? (
            <p className="mt-5 text-sm text-texte-doux">
              Aucune dépense en {annee}.
            </p>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {postes.map((poste) => {
                const part = bilan.depenses > 0 ? (poste.montant / bilan.depenses) * 100 : 0;
                return (
                  <li key={poste.nom}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span>{poste.nom}</span>
                      <span className="shrink-0 tabular-nums text-texte-doux">
                        {formaterMontant(poste.montant, devise)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-pilule bg-fond-alt">
                      <div
                        className="h-full rounded-pilule bg-accent/60"
                        style={{ width: `${part}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Carte>

        <Carte ton="calme">
          <div className="flex items-start justify-between gap-4">
            <MicroLibelle>À encaisser</MicroLibelle>
            <Link href="/factures" className="text-[13px] text-accent hover:underline">
              Toutes les factures
            </Link>
          </div>
          {impayees.length === 0 ? (
            <p className="mt-5 text-sm text-texte-doux">
              Rien en attente. Tout ce que tu as émis en {annee} est encaissé.
            </p>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {impayees.slice(0, 6).map((facture) => (
                <li key={facture.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{facture.client}</span>
                    <span className="block text-[13px] text-texte-doux">
                      émise le {formaterDate(facture.emise_le)}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formaterMontant(facture.montant, devise)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </>
  );
}
