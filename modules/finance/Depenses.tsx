"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/lib/design/Badge";
import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import { aujourdhui, formaterDate } from "@/lib/dates";
import { formaterMontant, type Depense, type Poste } from "@/lib/facture/types";
import { grouperParMois } from "@/lib/facture/calculs";
import { SeparateurMois } from "@/modules/finance/SeparateurMois";
import {
  enregistrerLaDepense,
  supprimerLaDepense,
  RIEN,
} from "@/modules/finance/actions";

/**
 * La liste des dépenses de l'année, filtrable par poste.
 *
 * Même forme que l'écran des factures, volontairement : ce sont deux listes
 * de lignes datées et chiffrées, et deux dispositions différentes obligeraient
 * à réapprendre le second écran après avoir appris le premier.
 */
export function Depenses({
  depenses,
  postes,
  devise,
  annee,
}: {
  depenses: Depense[];
  postes: Poste[];
  devise: string;
  annee: number;
}) {
  const [edition, setEdition] = useState<Depense | "nouvelle" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const [posteFiltre, setPosteFiltre] = useState<string>("tous");

  const nomDe = useMemo(
    () => new Map(postes.map((poste) => [poste.id, poste.nom])),
    [postes],
  );

  const visibles = useMemo(() => {
    if (posteFiltre === "tous") return depenses;
    if (posteFiltre === "sans") return depenses.filter((d) => d.poste_id === null);
    return depenses.filter((d) => d.poste_id === posteFiltre);
  }, [depenses, posteFiltre]);

  const total = visibles.reduce((somme, depense) => somme + depense.montant, 0);

  // Rangées par mois de paiement, comme les factures le sont par mois
  // d'émission : c'est la date qui compte dans la trésorerie du mois.
  const paquets = useMemo(
    () => grouperParMois(visibles, (depense) => depense.payee_le),
    [visibles],
  );

  function soumettre(donnees: FormData) {
    demarrer(async () => {
      const suite = await enregistrerLaDepense(RIEN, donnees);
      setErreur(suite.erreur);
      if (!suite.erreur) setEdition(null);
    });
  }

  function ouvrir(quoi: Depense | "nouvelle") {
    setErreur(null);
    setEdition(quoi);
  }

  return (
    <>
      {edition !== null && (
        <Carte className="mb-5">
          <form action={soumettre}>
            <FormulaireDepense
              depense={edition === "nouvelle" ? null : edition}
              postes={postes}
              annee={annee}
              erreur={erreur}
              enCours={enCours}
              onAnnuler={() => setEdition(null)}
            />
          </form>
        </Carte>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={posteFiltre}
          onChange={(evenement) => setPosteFiltre(evenement.target.value)}
          aria-label="Filtrer par poste"
          className="rounded-lg border-[1.5px] border-bordure bg-fond px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-accent"
        >
          <option value="tous">Tous les postes</option>
          {postes.map((poste) => (
            <option key={poste.id} value={poste.id}>
              {poste.nom}
            </option>
          ))}
          <option value="sans">Sans poste</option>
        </select>
        <span className="ml-auto text-sm text-texte-doux tabular-nums">
          {visibles.length} ligne{visibles.length > 1 ? "s" : ""}, {formaterMontant(total, devise)}
        </span>
      </div>

      <Carte ton="calme" marge="aucune" className="mt-5">
        {visibles.length === 0 ? (
          <p className="p-8 text-center text-sm text-texte-doux">
            {depenses.length === 0
              ? `Aucune dépense en ${annee}. Ajoute la première.`
              : "Aucune dépense sur ce poste."}
          </p>
        ) : (
          paquets.map((paquet) => (
            <section key={paquet.mois}>
              <SeparateurMois
                mois={paquet.mois}
                total={paquet.total}
                nombre={paquet.lignes.length}
                devise={devise}
              />
              <ul className="divide-y divide-bordure">
                {paquet.lignes.map((depense) => (
              <li
                key={depense.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{depense.libelle}</p>
                  <p className="mt-0.5 truncate text-[13px] text-texte-doux">
                    {depense.poste_id
                      ? (nomDe.get(depense.poste_id) ?? "Sans poste")
                      : "Sans poste"}
                    , payée le {formaterDate(depense.payee_le)}
                  </p>
                </div>

                {depense.recurrente && <Badge>Récurrente</Badge>}

                <span className="w-28 shrink-0 text-right tabular-nums">
                  {formaterMontant(depense.montant, devise)}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => ouvrir(depense)}
                    title="Modifier"
                    aria-label={`Modifier la dépense ${depense.libelle}`}
                    className="rounded-lg p-2 text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-texte"
                  >
                    <Icone nom="stylo" className="h-4 w-4" />
                  </button>

                  <form
                    action={supprimerLaDepense}
                    onSubmit={(evenement) => {
                      if (!confirm(`Supprimer la dépense « ${depense.libelle} » ?`)) {
                        evenement.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={depense.id} />
                    <button
                      type="submit"
                      title="Supprimer"
                      aria-label={`Supprimer la dépense ${depense.libelle}`}
                      className="rounded-lg p-2 text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-accent"
                    >
                      <Icone nom="poubelle" className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </Carte>

      {edition === null && (
        <Bouton className="mt-5" onClick={() => ouvrir("nouvelle")}>
          Ajouter une dépense
        </Bouton>
      )}
    </>
  );
}

function FormulaireDepense({
  depense,
  postes,
  annee,
  erreur,
  enCours,
  onAnnuler,
}: {
  depense: Depense | null;
  postes: Poste[];
  annee: number;
  erreur: string | null;
  enCours: boolean;
  onAnnuler: () => void;
}) {
  const dateParDefaut =
    annee === new Date().getFullYear() ? aujourdhui() : `${annee}-01-01`;

  return (
    <>
      {depense && <input type="hidden" name="id" value={depense.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ETIQUETTE}>Ce que c&apos;est</span>
          <input
            name="libelle"
            required
            autoFocus
            defaultValue={depense?.libelle ?? ""}
            placeholder="Abonnement au logiciel de facturation"
            className={CHAMP}
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Montant</span>
          <input
            name="montant"
            required
            inputMode="decimal"
            defaultValue={depense ? String(depense.montant) : ""}
            placeholder="29,90"
            className={CHAMP}
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Payée le</span>
          <input
            type="date"
            name="payee_le"
            required
            defaultValue={depense?.payee_le ?? dateParDefaut}
            className={CHAMP}
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Poste</span>
          <select name="poste_id" defaultValue={depense?.poste_id ?? ""} className={CHAMP}>
            <option value="">Sans poste</option>
            {postes.map((poste) => (
              <option key={poste.id} value={poste.id}>
                {poste.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={ETIQUETTE}>Notes</span>
          <textarea name="notes" rows={2} defaultValue={depense?.notes ?? ""} className={CHAMP} />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="recurrente"
            defaultChecked={depense?.recurrente ?? false}
            className="accent-accent"
          />
          <span>
            Elle revient tous les mois
            <span className="ml-2 text-[13px] text-texte-doux">
              (elle sera juste marquée, l&apos;outil ne la recopie pas tout seul)
            </span>
          </span>
        </label>
      </div>

      {erreur && <p className="mt-4 text-sm text-accent">{erreur}</p>}

      <div className="mt-5 flex gap-3">
        <Bouton type="submit" disabled={enCours}>
          {enCours ? "Enregistrement..." : "Enregistrer"}
        </Bouton>
        <Bouton type="button" variante="secondaire" onClick={onAnnuler}>
          Annuler
        </Bouton>
      </div>
    </>
  );
}
