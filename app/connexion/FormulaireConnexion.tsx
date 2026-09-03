"use client";

import { useActionState } from "react";
import { seConnecter, type EtatConnexion } from "./actions";
import { Bouton } from "@/lib/design/Bouton";
import {
  BOUTON_AUTH,
  CHAMP_AUTH,
  EcranAuth,
  ETIQUETTE_AUTH,
  TitreAuth,
} from "@/lib/design/EcranAuth";

const INITIAL: EtatConnexion = { erreur: null };

/**
 * Ce qui attend derrière la porte, dans l'ordre où on s'en sert. Trois, pas
 * cinq : une liste qu'on lit d'un regard vaut mieux qu'un inventaire qu'on
 * survole.
 */
const CE_QUI_ATTEND = [
  "Tes factures, et celles qui ne sont pas encore payées",
  "Tes dépenses, rangées par poste",
  "Ton objectif de l'année, et où tu en es",
];

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(seConnecter, INITIAL);

  return (
    <EcranAuth
      titre={
        <>
          Regarde où en est <span className="block text-accent">ton argent.</span>
        </>
      }
      accroche="Ce que tu as facturé, ce qui est rentré, ce que tu as dépensé."
      points={CE_QUI_ATTEND}
    >
      <TitreAuth>Connexion</TitreAuth>

      <form action={action} className="cascade">
        <label className="block">
          <span className={ETIQUETTE_AUTH}>Ton adresse email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="toi@exemple.fr"
            className={CHAMP_AUTH}
          />
        </label>

        <label className="mt-5 block">
          <span className={ETIQUETTE_AUTH}>Ton mot de passe</span>
          <input
            type="password"
            name="motDePasse"
            required
            autoComplete="current-password"
            className={CHAMP_AUTH}
          />
        </label>

        {etat.erreur && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-accent-doux px-4 py-3 text-center text-[13px] text-accent"
          >
            {etat.erreur}
          </p>
        )}

        <Bouton type="submit" disabled={enCours} className={BOUTON_AUTH}>
          {enCours ? "Connexion..." : "Entrer"}
          {!enCours && (
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          )}
        </Bouton>

        <p className="mt-6 text-center text-[13px] text-texte-doux/65">
          Un souci ? Le lien de récupération se demande depuis Supabase.
        </p>
      </form>
    </EcranAuth>
  );
}
