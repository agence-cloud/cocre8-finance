"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/lib/design/Badge";
import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { CHAMP, ETIQUETTE } from "@/lib/design/champs";
import { aujourdhui, formaterDate } from "@/lib/dates";
import { formaterMontant, type Facture } from "@/lib/facture/types";
import { grouperParMois } from "@/lib/facture/calculs";
import { SeparateurMois } from "@/modules/finance/SeparateurMois";
import {
  basculerLEncaissement,
  enregistrerLaFacture,
  supprimerLaFacture,
  RIEN,
} from "@/modules/finance/actions";

type Filtre = "toutes" | "attente" | "encaissees";

const FILTRES: { valeur: Filtre; libelle: string }[] = [
  { valeur: "toutes", libelle: "Toutes" },
  { valeur: "attente", libelle: "En attente" },
  { valeur: "encaissees", libelle: "Encaissées" },
];

/**
 * La liste des factures de l'année, et le formulaire qui les crée.
 *
 * **Un seul formulaire sert à créer et à modifier.** Deux écrans jumeaux
 * auraient divergé au premier champ ajouté : c'est la même facture, saisie
 * une première fois ou corrigée.
 *
 * **La recherche et le filtre ne partent pas au serveur.** Une année de
 * factures d'indépendant, c'est quelques dizaines de lignes : les filtrer
 * dans le navigateur répond à la frappe, là où un aller-retour se sentirait.
 */
export function Factures({
  factures,
  devise,
  annee,
}: {
  factures: Facture[];
  devise: string;
  annee: number;
}) {
  // `null` : le formulaire est fermé. Une facture : on la modifie. `"nouvelle"`
  // : on en crée une.
  const [edition, setEdition] = useState<Facture | "nouvelle" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  /**
   * `useTransition` et non `useActionState`, pour une seule raison : le
   * formulaire doit se refermer quand l'enregistrement a réussi, et rester
   * ouvert avec sa saisie quand il a échoué. Un état d'action ne dit pas la
   * différence entre « pas encore soumis » et « soumis sans erreur », les
   * deux valant `{ erreur: null }`.
   */
  function soumettre(donnees: FormData) {
    demarrer(async () => {
      const suite = await enregistrerLaFacture(RIEN, donnees);
      setErreur(suite.erreur);
      if (!suite.erreur) setEdition(null);
    });
  }

  function ouvrir(quoi: Facture | "nouvelle") {
    setErreur(null);
    setEdition(quoi);
  }
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [recherche, setRecherche] = useState("");

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return factures.filter((facture) => {
      if (filtre === "attente" && facture.encaissee_le) return false;
      if (filtre === "encaissees" && !facture.encaissee_le) return false;
      if (!terme) return true;
      return `${facture.client} ${facture.libelle ?? ""}`.toLowerCase().includes(terme);
    });
  }, [factures, filtre, recherche]);

  const total = visibles.reduce((somme, facture) => somme + facture.montant, 0);

  /**
   * **Les factures se rangent par mois d'émission, jamais d'encaissement.**
   * La liste répond à « qu'est-ce que j'ai facturé en mars », et une facture
   * de mars payée en mai doit rester sous mars, sinon elle disparaît du mois
   * où on la cherche. C'est le mois du paiement qui se lit sur la ligne.
   */
  const paquets = useMemo(
    () => grouperParMois(visibles, (facture) => facture.emise_le),
    [visibles],
  );

  return (
    <>
      {edition !== null && (
        <Carte className="mb-5">
          <form action={soumettre}>
            <FormulaireFacture
              facture={edition === "nouvelle" ? null : edition}
              annee={annee}
              erreur={erreur}
              enCours={enCours}
              onAnnuler={() => setEdition(null)}
            />
          </form>
        </Carte>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Chercher un client"
          aria-label="Chercher une facture"
          className="w-64 rounded-lg border-[1.5px] border-bordure bg-fond px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-accent"
        />
        <div className="flex gap-1 rounded-pilule border border-bordure p-1">
          {FILTRES.map((choix) => (
            <button
              key={choix.valeur}
              type="button"
              onClick={() => setFiltre(choix.valeur)}
              className={`rounded-pilule px-3 py-1 text-[13px] transition-colors duration-200 ${
                filtre === choix.valeur
                  ? "bg-accent text-white"
                  : "text-texte-doux hover:text-texte"
              }`}
            >
              {choix.libelle}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-texte-doux tabular-nums">
          {visibles.length} ligne{visibles.length > 1 ? "s" : ""}, {formaterMontant(total, devise)}
        </span>
      </div>

      <Carte ton="calme" marge="aucune" className="mt-5">
        {visibles.length === 0 ? (
          <p className="p-8 text-center text-sm text-texte-doux">
            {factures.length === 0
              ? `Aucune facture en ${annee}. Ajoute la première.`
              : "Aucune facture ne correspond."}
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
                {paquet.lignes.map((facture) => (
              <li
                key={facture.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{facture.client}</p>
                  <p className="mt-0.5 truncate text-[13px] text-texte-doux">
                    {facture.libelle ? `${facture.libelle}, ` : ""}
                    émise le {formaterDate(facture.emise_le)}
                    {facture.encaissee_le
                      ? `, encaissée le ${formaterDate(facture.encaissee_le)}`
                      : ""}
                  </p>
                </div>

                {facture.encaissee_le ? (
                  <Badge ton="succes">Encaissée</Badge>
                ) : (
                  <Badge ton="attention">En attente</Badge>
                )}

                <span className="w-28 shrink-0 text-right tabular-nums">
                  {formaterMontant(facture.montant, devise)}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  {/* Un formulaire par geste et non des boutons dans un seul :
                      deux actions serveur ne peuvent pas partager la même
                      balise `form`. */}
                  <form action={basculerLEncaissement}>
                    <input type="hidden" name="id" value={facture.id} />
                    <input type="hidden" name="emise_le" value={facture.emise_le} />
                    <input
                      type="hidden"
                      name="encaissee"
                      value={facture.encaissee_le ? "1" : "0"}
                    />
                    <button
                      type="submit"
                      title={
                        facture.encaissee_le
                          ? "Marquer comme non encaissée"
                          : "Marquer comme encaissée aujourd'hui"
                      }
                      aria-label={
                        facture.encaissee_le
                          ? "Marquer comme non encaissée"
                          : "Marquer comme encaissée"
                      }
                      className={`rounded-lg p-2 transition-colors duration-200 ${
                        facture.encaissee_le
                          ? "text-vert hover:bg-surface"
                          : "text-texte-doux hover:bg-surface hover:text-vert"
                      }`}
                    >
                      <Icone nom="coche" className="h-4 w-4" />
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => ouvrir(facture)}
                    title="Modifier"
                    aria-label={`Modifier la facture de ${facture.client}`}
                    className="rounded-lg p-2 text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-texte"
                  >
                    <Icone nom="stylo" className="h-4 w-4" />
                  </button>

                  <form
                    action={supprimerLaFacture}
                    onSubmit={(evenement) => {
                      // Une suppression ne se rattrape pas : la question se
                      // pose avant, jamais après.
                      if (!confirm(`Supprimer la facture de ${facture.client} ?`)) {
                        evenement.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={facture.id} />
                    <button
                      type="submit"
                      title="Supprimer"
                      aria-label={`Supprimer la facture de ${facture.client}`}
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
          Ajouter une facture
        </Bouton>
      )}
    </>
  );
}

function FormulaireFacture({
  facture,
  annee,
  erreur,
  enCours,
  onAnnuler,
}: {
  facture: Facture | null;
  annee: number;
  erreur: string | null;
  enCours: boolean;
  onAnnuler: () => void;
}) {
  // Une facture créée depuis une année passée est datée du 1er janvier de
  // cette année-là, pas d'aujourd'hui : sinon elle disparaîtrait de l'écran
  // au moment même où on l'enregistre.
  const enCoursDAnnee = annee === new Date().getFullYear();
  const dateParDefaut = enCoursDAnnee ? aujourdhui() : `${annee}-01-01`;

  return (
    <>
      {facture && <input type="hidden" name="id" value={facture.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={ETIQUETTE}>Client</span>
          <input
            name="client"
            required
            autoFocus
            defaultValue={facture?.client ?? ""}
            placeholder="Nom du client"
            className={CHAMP}
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Montant hors taxes</span>
          <input
            name="montant"
            required
            inputMode="decimal"
            defaultValue={facture ? String(facture.montant) : ""}
            placeholder="1500"
            className={CHAMP}
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Émise le</span>
          <input
            type="date"
            name="emise_le"
            required
            defaultValue={facture?.emise_le ?? dateParDefaut}
            className={CHAMP}
          />
        </label>
        <label className="block">
          <span className={ETIQUETTE}>Encaissée le</span>
          <input
            type="date"
            name="encaissee_le"
            defaultValue={facture?.encaissee_le ?? ""}
            className={CHAMP}
          />
          <span className="mt-1 block text-[13px] text-texte-doux">
            Laisse vide tant que l&apos;argent n&apos;est pas arrivé.
          </span>
        </label>
        <label className="block sm:col-span-2">
          <span className={ETIQUETTE}>Libellé</span>
          <input
            name="libelle"
            defaultValue={facture?.libelle ?? ""}
            placeholder="Accompagnement, mars"
            className={CHAMP}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={ETIQUETTE}>Notes</span>
          <textarea name="notes" rows={2} defaultValue={facture?.notes ?? ""} className={CHAMP} />
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
