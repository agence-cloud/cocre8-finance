"use client";

import { useState, useTransition } from "react";
import { Bouton } from "@/lib/design/Bouton";
import { Carte } from "@/lib/design/Carte";
import { Icone } from "@/lib/design/Icones";
import { MicroLibelle } from "@/lib/design/MicroLibelle";
import { CHAMP, CHAMP_LIGNE, ETIQUETTE } from "@/lib/design/champs";
import { formaterMontant, type Poste } from "@/lib/facture/types";
import type { Reglages as TypeReglages } from "@/lib/reglages/types";
import {
  ajouterLePoste,
  enregistrerLObjectif,
  enregistrerLesReglages,
  renommerLePoste,
  supprimerLePoste,
  RIEN,
} from "@/modules/finance/actions";

/**
 * Les trois réglages de l'outil : son nom, ton objectif, tes postes.
 *
 * **On lit d'abord, le stylo ouvre l'édition, un seul bouton envoie tout.**
 * C'est le geste de tous les écrans de l'app qui se modifient, et il tient
 * ici comme ailleurs : rien ne part tant qu'on n'a pas cliqué, donc on peut
 * toujours renoncer.
 */

/** Le pied commun aux trois blocs : le message d'erreur et les deux boutons. */
function Pied({
  enCours,
  erreur,
  onAnnuler,
}: {
  enCours: boolean;
  erreur: string | null;
  onAnnuler: () => void;
}) {
  return (
    <>
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

function BoutonStylo({ onClick, quoi }: { onClick: () => void; quoi: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Modifier ${quoi}`}
      className="shrink-0 text-texte-doux transition-colors duration-200 hover:text-accent"
    >
      <Icone nom="stylo" className="h-4 w-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Le nom de l'outil et la devise                                     */
/* ------------------------------------------------------------------ */

export function ReglagesOutil({ reglages }: { reglages: TypeReglages }) {
  const [edition, setEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function soumettre(donnees: FormData) {
    demarrer(async () => {
      const suite = await enregistrerLesReglages(RIEN, donnees);
      setErreur(suite.erreur);
      if (!suite.erreur) setEdition(false);
    });
  }

  if (!edition) {
    return (
      <Carte>
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Ton outil</MicroLibelle>
          <BoutonStylo onClick={() => setEdition(true)} quoi="tes réglages" />
        </div>
        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-texte-doux">Nom</dt>
            <dd>{reglages.nom_programme}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-texte-doux">Devise</dt>
            <dd>{reglages.devise}</dd>
          </div>
        </dl>
      </Carte>
    );
  }

  return (
    <Carte>
      <form action={soumettre}>
        <MicroLibelle>Ton outil</MicroLibelle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETTE}>Nom</span>
            <input name="nom_programme" defaultValue={reglages.nom_programme} className={CHAMP} />
            <span className="mt-1 block text-[13px] text-texte-doux">
              Affiché en haut à gauche et sur l&apos;écran de connexion.
            </span>
          </label>
          <label className="block">
            <span className={ETIQUETTE}>Devise</span>
            <input name="devise" defaultValue={reglages.devise} className={CHAMP} />
          </label>
        </div>
        <Pied enCours={enCours} erreur={erreur} onAnnuler={() => setEdition(false)} />
      </form>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */
/*  L'objectif de l'année                                              */
/* ------------------------------------------------------------------ */

export function ReglagesObjectif({
  annee,
  objectif,
  devise,
}: {
  annee: number;
  objectif: number;
  devise: string;
}) {
  const [edition, setEdition] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function soumettre(donnees: FormData) {
    demarrer(async () => {
      const suite = await enregistrerLObjectif(RIEN, donnees);
      setErreur(suite.erreur);
      if (!suite.erreur) setEdition(false);
    });
  }

  if (!edition) {
    return (
      <Carte ton="calme" className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <MicroLibelle>Ton objectif {annee}</MicroLibelle>
          <BoutonStylo onClick={() => setEdition(true)} quoi="ton objectif" />
        </div>
        <p className="mt-5 text-2xl font-bold tabular-nums text-titre">
          {objectif === 0 ? "Aucun objectif posé" : formaterMontant(objectif, devise)}
        </p>
        <p className="mt-3 text-[13px] text-texte-doux">
          Ce que tu veux avoir facturé au 31 décembre. Un objectif par année :
          celui de l&apos;an dernier reste lisible quand tu regardes
          l&apos;an dernier.
        </p>
      </Carte>
    );
  }

  return (
    <Carte ton="calme" className="mt-5">
      <form action={soumettre}>
        <MicroLibelle>Ton objectif {annee}</MicroLibelle>
        {/* L'année vient de l'écran et non d'un champ visible : elle est déjà
            choisie en haut de la page, et la redemander ici laisserait poser
            un objectif sur une autre année que celle qu'on regarde. */}
        <input type="hidden" name="annee" value={annee} />
        <label className="mt-5 block max-w-xs">
          <span className={ETIQUETTE}>Chiffre d&apos;affaires visé</span>
          <input
            name="facture_vise"
            inputMode="decimal"
            autoFocus
            defaultValue={objectif === 0 ? "" : String(objectif)}
            placeholder="60000"
            className={CHAMP}
          />
        </label>
        <Pied enCours={enCours} erreur={erreur} onAnnuler={() => setEdition(false)} />
      </form>
    </Carte>
  );
}

/* ------------------------------------------------------------------ */
/*  Les postes de dépense                                              */
/* ------------------------------------------------------------------ */

export function ReglagesPostes({ postes }: { postes: Poste[] }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function ajouter(donnees: FormData) {
    demarrer(async () => {
      const suite = await ajouterLePoste(RIEN, donnees);
      setErreur(suite.erreur);
    });
  }

  return (
    <Carte ton="calme" className="mt-5">
      <MicroLibelle>Tes postes de dépense</MicroLibelle>
      <p className="mt-3 text-[13px] text-texte-doux">
        Supprimer un poste ne supprime aucune dépense : celles qui le portaient
        passent simplement en « sans poste ».
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {postes.map((poste) => (
          <li key={poste.id} className="flex items-center gap-2">
            {/* Le renommage part au flou du champ, sans bouton : un poste
                n'a qu'un nom, et un « Enregistrer » par ligne ferait une
                colonne de boutons pour une seule lettre corrigée. */}
            <form action={renommerLePoste} className="flex-1">
              <input type="hidden" name="id" value={poste.id} />
              <input
                name="nom"
                defaultValue={poste.nom}
                aria-label={`Nom du poste ${poste.nom}`}
                onBlur={(evenement) => {
                  if (evenement.target.value.trim() !== poste.nom) {
                    evenement.target.form?.requestSubmit();
                  }
                }}
                className={`w-full ${CHAMP_LIGNE}`}
              />
            </form>
            <form
              action={supprimerLePoste}
              onSubmit={(evenement) => {
                if (!confirm(`Supprimer le poste « ${poste.nom} » ?`)) {
                  evenement.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={poste.id} />
              <button
                type="submit"
                aria-label={`Supprimer le poste ${poste.nom}`}
                className="shrink-0 rounded-lg p-2 text-texte-doux transition-colors duration-200 hover:bg-surface hover:text-accent"
              >
                <Icone nom="croix" className="h-4 w-4" />
              </button>
            </form>
          </li>
        ))}
      </ul>

      <form action={ajouter} className="mt-4 flex gap-2">
        <input
          name="nom"
          placeholder="Nom du nouveau poste"
          aria-label="Nom du nouveau poste"
          className={`flex-1 ${CHAMP_LIGNE}`}
        />
        <Bouton type="submit" variante="secondaire" className="px-4 py-2 text-sm" disabled={enCours}>
          Ajouter
        </Bouton>
      </form>

      {erreur && <p className="mt-4 text-sm text-accent">{erreur}</p>}
    </Carte>
  );
}
